# Forge Life OS / MonkMode — Design, Bugs, Edge Cases & Test Plan

> Full review of the app under `src/`. Covers **design issues, UI-break cases, user-flow problems, logic bugs, accessibility, performance, security, UX improvements, feature ideas, and a concrete edge-case / test-case matrix.**
> Every finding has a `file:line` reference so it can be located and fixed.

**Stack:** React + TypeScript + Vite + Zustand (persist) + Firebase (Auth + Firestore) + Tailwind + Framer Motion + Recharts. PWA, mobile-first, offline-first.

Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low / polish

---

## ✅ Fix status (applied 2026-06-23)

Typecheck, 21/21 unit tests, and the production build all pass after these changes.

**Fixed**
- §1.1 Weight logging wired — Profile weight field now calls `logWeight`, so the Progress chart fills in (with an empty-state until then).
- §1.2 Milestone editor added to the Goal edit sheet (`addMilestone`/`removeMilestone`).
- §1.3 "Import data (JSON)" added in Profile → Data (validates shape).
- §1.5 Hardcoded emails removed → read from `VITE_RECOMP_EMAILS`; `resolveWorkout` hardened against malformed plans.
- §2.1 Weekly recurrence uses local-time `fromISO(date).getDay()`.
- §2.2 Week/month overviews materialise the whole visible range (`ensureRecurringRange`).
- §2.3 `pruneGenerated()` reclaims stale, untouched recurring occurrences on launch (bounds storage).
- §2.5 Logout now `stopCloudSync()` **before** `resetData()` (no empty-state cloud wipe).
- §2.6/§2.7 Goal target clamped > 0; `safePct()` helper kills all `NaN`/`Infinity` percentages (water, goals, items).
- §2.8 Numeric Profile fields keep a raw string while editing, commit on blur (no snap-to-0).
- §2.9 Completion reconciled across status ⇄ progress ⇄ subtasks.
- §2.10 "Delete entire series" added for recurring items (`removeSeries`).
- §2.11 `uid()` uses `crypto.randomUUID()` when available.
- §3.1 `break-words`/`truncate` on journal text, habit names, milestones, and sheet titles.
- §3.3 Empty-state placeholders for all Progress charts.
- §3.5 Dead `h-15/w-15` classes removed; §3.6 FAB position persisted.
- §3.7 Search results group consecutive same-date items under one header.
- §4.1 Confirm dialogs on delete (task, series, goal, habit, note).
- §4.2 Inline validation messages in Quick Add.
- §4.3 Clear button resets query **and** tag filter.
- §4.4 Reminders copy softened + re-checks on app foreground.
- §4.5 Focus completion/chime/notification moved to an app-wide `useFocusTicker` (works after navigating away).
- §4.7 Water "−250 ml" button added; §4.9 Journal "show all"; §4.10 "Reset all data" added.
- §5.1 `prefers-reduced-motion` honored in page transitions, cards, rings, bars.
- §5.2 `--ink-faint`/`--ink-mute` darkened for AA contrast.
- §6 Reminders interval no longer restarts on every edit; Focus page tick decoupled from completion.
- §7 App-wide `ErrorBoundary` (no more white-screen); unknown routes redirect Home.
- §8 OS-theme default on first run; iOS "Add to Home Screen" hint.
- §8.9 Onboarding leftover hardcoded-name check removed.

**Fixed — round 2 (2026-06-23)**
- 🎨 **Logo redesigned.** Replaced the off-brand purple-bolt `favicon.svg` and the cropped PNG with a cohesive saffron **meditating-monk-under-rising-sun** mark: new `public/logo.svg` (transparent, used in splash/home/onboarding/profile/login) + a rounded app-tile `favicon.svg`. `index.html` now serves the SVG favicon; Home brand bar simplified (no more image-cropping hack).
- §1.4 `syncEnabled`/`setSyncEnabled` dead state removed.
- §2.10 "Delete this & upcoming" added (new `until` bound on templates stops future generation; past occurrences kept) alongside whole-series delete.
- §4.6 Quick-step counters: ±5/±10 on item progress, +5/+10/+25 on goals.
- §4.8 "Log weight for another day" (dated backfill via `logWeightOn`).
- §5.3 Screen-reader text summary of all Progress charts + `role="img"` heatmap label.
- §5.4 Global `:focus-visible` ring for keyboard users.
- §5.5 Priority dots and done/skip status now carry `title`/`aria-label`.
- §7 Firestore rules hardened (key allow-list, per-slice type + size caps).
- §8 Offline banner (`navigator.onLine`) shows when disconnected.
- §9 Consistency **heatmap** (70-day) + **longest-streak** per habit; **type & status search filters** in Planner.

**Deferred (need external infra / keys, or a larger redesign)**
- §2.4 Sync stays last-write-wins — true per-entity merge is a bigger redesign (no entity-level timestamps yet).
- §9 Push reminders for a fully-closed app — needs an **FCM server + VAPID keys**.
- §7 Firebase **App Check** — needs a reCAPTCHA/site key to wire.
- §9 Drag-to-reschedule tasks between days — sizable interaction work.
- Installed-PWA icon + `og.png` still use the **old PNGs** — regenerating raster assets from the new SVG needs an image export step (can't be done from code here). The in-app + browser-tab logo is fully updated.

---

## 1. Critical — broken or dead features (a user can clearly notice)

### 1.1 🔴 Weight chart is permanently empty — `logWeight()` is never called
`logWeight` is defined in the store (`store/useStore.ts:371`) but **no component ever calls it** (verified by grep). The Profile "Weight (kg)" field calls `updateProfile({ weightKg })` (`pages/Profile.tsx:154`), which only mutates `profile.weightKg` and does **not** push a `WeightLog` entry. `seedWeight = []` (`lib/seed.ts:23`), so the Progress → Weight `LineChart` (`pages/Progress.tsx:47,64`) renders an **empty chart forever** for every user.
- **Effect:** core "track your weight over time" promise is dead.
- **Fix:** make the Profile weight field (or a dedicated "Log weight" action) call `logWeight()`; render an empty-state when `weight.length < 2`.

### 1.2 🔴 Goal milestones can never be added (dead UI)
`addGoal` always sets `milestones: []` (`store/useStore.ts:286`). There is a `toggleMilestone` action but **no UI to create a milestone** anywhere (QuickAddSheet has no milestone field; GoalSheet only edits title/target/unit/deadline). So the milestone block in `GoalSheet` (`pages/Goals.tsx:248`) and the "x/y milestones" line on the card (`pages/Goals.tsx:119`) are **always hidden**.
- **Fix:** add a "Milestones" add/remove section to the Goal edit sheet.

### 1.3 🟠 No "import / restore" — export is one-way
`exportData()` downloads JSON (`pages/Profile.tsx:90`), but `importData` is only used internally by cloud sync (`lib/sync.ts:120`). There is **no UI to restore a backup**. A user who exports, then resets/loses data, cannot get it back without the cloud.
- **Fix:** add an "Import data (JSON)" file picker in Profile → Data that calls `importData`.

### 1.4 🟡 `syncEnabled` / `setSyncEnabled` are dead state
Defined in the store (`store/useStore.ts:38-40, 114`) but **never read or set by any component**. Cloud sync auto-starts on login regardless. Either wire a real "Sync" toggle in Profile or delete the dead state.

### 1.5 🟠 Workout plan is hardcoded to 2 email addresses
`hasBakedPlan()` only returns true for two literal Gmail addresses (`lib/workoutPlan.ts:105-112`). For **everyone else** (including the current account), the entire workout surface is dead: no `WorkoutCard` in the Planner, `WorkoutDaySheet` never opens, and the 3,390-line `data/recompPlan.ts` is shipped to the bundle but unused.
- **Privacy:** those two personal emails are embedded in client JS and visible to anyone who reads the bundle.
- **Fix:** gate by a profile flag / remote config, not hardcoded emails; lazy-load the plan data; add the promised "create/upload your own plan" flow.

---

## 2. Logic & data-integrity bugs

### 2.1 🟠 Weekly recurrence can land on the wrong weekday (timezone bug)
`ensureRecurring` compares weekdays with `new Date(date).getDay()` (`store/useStore.ts:170-172`). `new Date("2026-06-17")` is parsed as **UTC midnight**, so `.getDay()` returns the *previous* day in any negative-UTC-offset timezone (e.g. the Americas). The rest of the app uses `date-fns/parseISO` (local time) via `fromISO`. → weekly tasks may generate on the wrong day.
- **Fix:** use `fromISO(date).getDay()` (local), consistent with the rest of the codebase.

### 2.2 🟠 Recurring tasks don't show in week/month overview until each day is tapped
`ensureRecurring(cursor)` only runs for the currently selected day (`pages/Planner.tsx:44-46`). Week dots/counts (`pages/Planner.tsx:268`) and month dots (`pages/Planner.tsx:323`) count `items` directly, so a daily/weekly task does **not** appear on days you haven't individually opened. The overview is misleading.
- **Fix:** materialize the whole visible range (all 7 week days / all visible month cells) before computing counts.

### 2.3 🔴 Unbounded item growth → eventual Firestore failure
Every distinct day a user navigates to with a daily template permanently appends a generated occurrence (`store/useStore.ts:175-184`), and **nothing ever prunes them**. The entire state is mirrored into a single Firestore document (`lib/sync.ts:35-40,79`). Firestore caps a document at **1 MB**; after enough navigation, `setDoc` throws and sync silently dies (the catch in `flushWrite` swallows it, `lib/sync.ts:133`).
- **Fix:** generate occurrences lazily only for *viewed* days *and* cap/prune old generated items; or store items in a subcollection, not one doc.

### 2.4 🟠 Last-write-wins sync silently loses concurrent edits
The documented strategy overwrites the entire state from whichever side has the newer client clock (`lib/sync.ts:7-12, 169-176`). Two devices editing different things while offline → the later writer **clobbers** the other's changes wholesale (e.g. Device A added a task, Device B logged water; one is lost). Clock is `Date.now()` (`lib/sync.ts:142`), so device **clock skew** can make one device always win.
- **Fix:** merge per-slice/per-entity, or at least warn on conflict; consider per-collection timestamps.

### 2.5 🟠 Logout wipes local data and risks pushing an empty state
`doLogout` calls `await logout()` then `resetData()` (`pages/Profile.tsx:60-70`), clearing the device. The store subscription in sync is still attached during the gap; `resetData` triggers `scheduleWrite`. It's only saved by `userDocRef()` returning null after sign-out (`lib/sync.ts:131,138-143`) — a timing-dependent guard. If auth teardown is async on some platform, an **empty seed could overwrite the cloud**.
- **Fix:** explicitly `stopCloudSync()` *before* `resetData()` in logout.

### 2.6 🟡 Goal with `target = 0` (or negative) → "Infinity%" / "NaN%"
QuickAdd goal validation is `if (!t || !target) return` (`components/QuickAddSheet.tsx:99`). The string `"0"` is truthy, so a target of `0` passes; `number` inputs also accept negatives. `GoalCard` then computes `Math.round((current/target)*100)` → `Infinity%` (`pages/Goals.tsx:92`), and the ProgressBar/ring break. (The *edit* path guards with `Number(eTarget) > 0`, `pages/Goals.tsx:162` — but create does not.)
- **Fix:** validate `Number(target) > 0` on create; set `min={1}` and reject negatives.

### 2.7 🟡 Water % becomes `NaN` when the water goal is 0
`waterPct = Math.round((waterMl / profile.waterTargetMl) * 100)` (`pages/Home.tsx:33`). `Profile.num()` allows `0` (`pages/Profile.tsx:88`), so setting the water goal to 0 gives `0/0 = NaN` → bar width `NaN%`.
- **Fix:** guard divisor; enforce a minimum water goal.

### 2.8 🟡 Number fields snap to 0 when cleared
Controlled numeric inputs bound to `profile.*` with `num(v)=Math.max(0, Number(v)||0)` (`pages/Profile.tsx:88,296-308`). Backspacing to empty forces the value to `0` (you can't leave it blank to retype), and leading-zero / decimal editing is awkward. Same pattern in Onboarding (`components/Onboarding.tsx:19`).
- **Fix:** keep the raw string in local state while editing; commit on blur.

### 2.9 🟡 Mixed completion signals between progress, subtasks, and status
- Marking an item "done" forces `progress.current = target` (`store/useStore.ts:201-203`) but leaves subtasks unchecked.
- Checking all subtasks forces `status:"done"` (`store/useStore.ts:256-260`) but does **not** max the progress bar.
- An item with *both* a progress counter and a checklist can show "done" with a half-full bar, or a full bar with unchecked steps. Confusing and inconsistent.
- **Fix:** define one source of truth for completion, or reconcile all three on every mutation.

### 2.10 🔵 Editing a recurring template doesn't propagate; deleting it orphans occurrences
`updateItem`/`removeItem` act on a single item (`store/useStore.ts:188,226`). There's no "edit/delete this & future" or "whole series." Deleting a template leaves generated children (with a dangling `seriesId`).
- **Fix:** add series-aware edit/delete.

### 2.11 🔵 `uid()` is `Math.random().toString(36).slice(2,10)` (`store/useStore.ts:25`)
8 base-36 chars; collision probability is small but non-zero, and it's used for every item/goal/habit/subtask id. Prefer `crypto.randomUUID()`.

### 2.12 🔵 Focus `sessionsToday` only rolls over on `complete()`
The daily reset check lives in `complete()` (`store/useFocus.ts:141,149-150`). If no session completes across midnight, yesterday's count is shown until the next completion.

---

## 3. UI-break / layout edge cases

### 3.1 🟠 Long unbroken text overflows cards (no `break-words`)
- Journal note body `<p className="text-sm">{j.text}</p>` (`pages/Profile.tsx:273`) — a long URL / no-space string overflows the card and can cause horizontal scroll.
- Sheet/Goal/Item titles in headers are not truncated (`components/Sheet.tsx:99`, `pages/Goals.tsx:209`) — a very long title wraps and pushes the close button / layout.
- Habit name `<span className="flex-1 ...">{h.title}</span>` has no `truncate` (`pages/Profile.tsx:196`) — a long habit name shoves the streak + delete button off-row.
- **Fix:** add `break-words`/`overflow-wrap-anywhere` to free-text, and `truncate`/`min-w-0` to flex titles.

### 3.2 🟡 Home summary numbers can overflow the 1/3-width cards
`grid-cols-3` cards render `font-heading text-lg font-extrabold` values like `"12/200 KM"` (`pages/Home.tsx:135-148`). Large numbers on a narrow (≤320px) phone clip or wrap.
- **Fix:** shrink/auto-size font, or allow 2-line wrap with `tabular-nums`.

### 3.3 🟡 Charts have no empty-state — they look broken when there's no data
A brand-new user sees blank axes (weight: no points; running/study: all-zero bars; completion: flat 0) (`pages/Progress.tsx`). Reads as "broken," not "no data yet."
- **Fix:** show a friendly "Start logging to see trends" placeholder when a series is empty.

### 3.4 🟡 Login/Onboarding don't handle the on-screen keyboard
`Sheet` carefully lifts above the keyboard via VisualViewport (`components/Sheet.tsx:31-49`), but `Login` (`pages/Login.tsx:88`) and `Onboarding` (`components/Onboarding.tsx:33`) are `fixed inset-0 ... justify-center`. On a short phone, focusing the password field can push the submit button under the keyboard. They are `overflow-y-auto` so it's scrollable, but the primary CTA may be hidden.
- **Fix:** reuse the VisualViewport handling, or `justify-start` + scroll.

### 3.5 🔵 `DraggableFab` uses non-existent Tailwind classes
`className="... h-15 w-15 ..."` (`components/DraggableFab.tsx:47`) — `h-15`/`w-15` aren't in the default scale and are ignored; it only works because of the inline `style={{height:60,width:60}}`. Dead classes; remove or fix.

### 3.6 🔵 FAB can be dragged over tap targets and resets on reload
The FAB drags within `inset-3` (`components/DraggableFab.tsx:23`) and can be parked over the center Home button or content, blocking taps. Its position is **not persisted**, so it jumps back to bottom-right on every reload.
- **Fix:** persist position; keep a safe margin from the nav.

### 3.7 🔵 Search result list repeats the date header per item
Each result prints its own date label even for consecutive same-date items (`pages/Planner.tsx:189-196`), producing visual noise.
- **Fix:** group results under a single date header.

### 3.8 🔵 No landscape / very-short-viewport handling
The Focus ring is `size={232}` plus controls plus the session card (`pages/Focus.tsx:171`); in landscape or on a small screen these can collide with the fixed bottom nav (content uses `pb-36`, `App.tsx:57`).

---

## 4. User-flow issues

### 4.1 🟠 Destructive deletes have no confirmation and no undo
`removeItem` (`components/ItemActionsSheet.tsx:257`), `removeGoal` (`pages/Goals.tsx:282`), `removeHabit` (`pages/Profile.tsx:201`), `removeNote` (`pages/Profile.tsx:265`) all delete instantly. Deleting a habit destroys its **entire streak history**. Only logout asks for confirmation (`pages/Profile.tsx:61`).
- **Fix:** confirm + "Undo" snackbar (especially habits/goals).

### 4.2 🟠 "Add" silently does nothing on invalid input
`QuickAddSheet.submit()` early-returns with no feedback when the title is empty, or a goal has no target (`components/QuickAddSheet.tsx:94-111`). The user taps "Add" and nothing happens — no error, no highlight.
- **Fix:** inline validation messages / disable the button with a reason.

### 4.3 🟡 Clearing the search "X" doesn't exit search mode if a tag is selected
`searching = query !== "" || !!tagFilter` (`pages/Planner.tsx:40`), but the clear-X only resets `query` (`pages/Planner.tsx:79`). With an active tag chip, the calendar stays hidden and there's no obvious way back except re-tapping the chip.
- **Fix:** a single "Clear" that resets both query and tagFilter.

### 4.4 🟡 Reminders copy over-promises; they only fire while the app is open
Profile says "Get a real notification when a timed task is due" (`pages/Profile.tsx:131`), but `useReminders` only fires while the page is foregrounded and ticks every 30s within a 2-minute window (`lib/useReminders.ts:30-53`). Closed-app reminders need FCM/push (acknowledged in the code comment). Background tabs are throttled; the in-memory `fired` set is cleared on reload (can re-fire).
- **Fix:** soften the copy ("while the app is open"), or implement push.

### 4.5 🟡 Focus timer notifications/chime only work while on the Focus page
The completion detector lives in a `setInterval` inside the Focus component and is cleared on unmount (`pages/Focus.tsx:75-99`). Navigate away and the session won't be counted, no chime, no notification until you return — defeating "set a timer and go."
- **Fix:** move the tick/completion to a global hook or the service worker.

### 4.6 🟡 ±1-only counters make time/large goals tedious
Item progress (`components/ItemActionsSheet.tsx:129,137`) and goal progress (`pages/Goals.tsx:226,233`) only step by ±1. A 120-minute study target = 120 taps; a 50-rep goal = 50 taps.
- **Fix:** allow custom step / direct numeric entry / quick +5/+10 chips.

### 4.7 🟡 Water can only go up, in fixed 250 ml steps
Only a "+250ml" button exists (`pages/Home.tsx:164`); no minus / undo / custom amount. Overshoot is uncorrectable except by reset.

### 4.8 🟡 Weight & water can only be logged for *today*
Both key off `todayISO()` (`store/useStore.ts:367,373`). No backfilling a missed day.

### 4.9 🔵 Journal shows only the latest 5 notes with no "view all"
`journal.slice(0, 5)` (`pages/Profile.tsx:258`). Older notes are inaccessible from the UI (still in export/data).

### 4.10 🔵 No way to reset/clear data from the UI
`resetData` only runs on logout (`pages/Profile.tsx:66`). Local-only users (no Firebase) can never start fresh.

### 4.11 🔵 Native `alert()` / `confirm()` break the design language
Used for reminder errors and logout (`pages/Profile.tsx:54,57,61,68`). Jarring vs. the custom Sheet/toast styling; some embedded webviews suppress them.

---

## 5. Accessibility

### 5.1 🟠 `prefers-reduced-motion` is not honored by Framer Motion
The CSS override only zeroes **CSS** transitions (`src/index.css:190-197`). Framer Motion's JS-driven animations (page transitions `App.tsx:51`, ProgressRing `components/ProgressRing.tsx:50-53`, card stagger, sheet spring) ignore it.
- **Fix:** use `useReducedMotion()` from framer-motion to disable/instant these.

### 5.2 🟡 Low contrast on `text-ink-faint`
`--ink-faint: 168 154 137` on `--bg: 251 244 233` (light theme, `src/index.css:23,18`) is well below WCAG AA for small text, and it's used widely for secondary labels, timeline times, chart ticks (`#64748B`).
- **Fix:** darken faint text or restrict it to large/decorative text.

### 5.3 🟡 Charts are not accessible
Recharts output has no text alternative / table fallback (`pages/Progress.tsx`). Screen-reader users get nothing.
- **Fix:** provide an `aria-label`/summary or a visually-hidden data table.

### 5.4 🔵 Focus-visible styling is inconsistent
Many buttons rely on browser defaults; `-webkit-tap-highlight-color: transparent` is set globally (`src/index.css:52`) with no replacement focus ring on several controls. Keyboard focus is hard to see.

### 5.5 🔵 Color-only status encoding
Priority is conveyed by a colored dot only (`components/PlanItemCard.tsx:43`, `TodayPlan.tsx:107`); done/skip partly by color. Add a shape/label for color-blind users.

---

## 6. Performance & scale

- 🟡 **Per-card Sheet instances:** every `PlanItemCard` mounts its own `ItemActionsSheet` (`components/PlanItemCard.tsx:100`); a long day/search list creates N modal subtrees. Hoist a single shared sheet.
- 🟡 **Focus re-renders 4×/sec:** `forceTick` every 250ms re-renders the whole page (`pages/Focus.tsx:96-97`). 1s cadence (or a dedicated time component) is enough.
- 🟡 **`useReminders` resets its interval on every item change** (`deps: [enabled, items]`, `lib/useReminders.ts:54`). Each edit clears + restarts the 30s timer and re-runs `tick()`.
- 🟡 **Unbounded `items`** (see §2.3) also slows every `itemsForDate`/`searchItems`/`dayCompletion` scan, which all run `O(items)` on each render.
- 🔵 **`recompPlan.ts` (3,390 lines)** is bundled eagerly via `useWorkoutPlan` import even though 2 accounts use it; lazy-load it.

---

## 7. Security / privacy

- 🟠 **Hardcoded personal emails in client code** (`lib/workoutPlan.ts:105-108`) — leaked in the bundle (see §1.5).
- 🟡 **Firestore rules are minimal** (`firestore.rules:5-7`): correct owner-only access, but **no field validation / size limits / schema checks** — a compromised client can write arbitrary/huge data to its own doc (ties into the 1 MB blow-up).
- 🟡 **No App Check** — the Firestore/Auth endpoints are open to any client with the public config.
- 🔵 **`.env` committed?** Confirm `.env` (real keys) is git-ignored; only `.env.example` should be tracked. (Firebase web keys aren't secret, but good hygiene.)
- 🔵 **No error boundary** (`App.tsx`): a single render throw (e.g. malformed synced data making `month.days[weekday]` undefined → `.groups` throws, `lib/workoutPlan.ts:84`) white-screens the whole app.

---

## 8. UX improvements ("better hota agar…")

1. **Offline / sync status indicator** — nothing tells the user if a write failed or they're offline (`flushWrite` swallows errors, `lib/sync.ts:133`).
2. **iOS install + notification guidance** — `beforeinstallprompt` never fires on iOS Safari (`pages/Profile.tsx:79-86`), and iOS needs an *installed* PWA for notifications. Add an "Add to Home Screen" hint for iOS.
3. **Empty states everywhere** — Progress charts (§3.3), and a friendlier first-run dashboard.
4. **Respect system theme** — default ignores `prefers-color-scheme`; seed is always `light` (`lib/seed.ts:13`).
5. **Undo toasts** for completes/deletes/skips instead of silent mutation.
6. **Pull-to-refresh / manual "Sync now"** button (the manual `pushState`/`pullState` exist in `lib/sync.ts:90,98` but aren't surfaced).
7. **Show year in date headers** (`formatLong` omits year, `lib/date.ts:21`) — ambiguous in multi-year search results.
8. **Bigger touch targets / haptic consistency** — some icon buttons are 32px (`h-8 w-8`), below the 44px guideline.
9. **Onboarding leftover:** `name === "Sanjay" ? "" : ...` (`components/Onboarding.tsx:13`) references a personal name that no longer exists in the seed — dead/odd code.

---

## 9. Feature ideas ("ye feature daal sakte the")

- **Weight logging UI** + trend/BMI (the data layer already exists, §1.1).
- **Custom / uploadable workout plans** for all users (the resolver is generic, §1.5).
- **Milestone editor** for goals (§1.2).
- **Recurring-series management** (edit/delete this & future).
- **Statistics:** longest streak, completion-by-tag, weekly/monthly summaries, calendar heatmap (GitHub-style) for habits.
- **Reminders that actually fire when closed** via FCM push + scheduled notifications.
- **Quick reschedule / drag tasks between days**; "move incomplete tasks to today."
- **Search filters:** by type, status, date range, priority (currently text + single tag only).
- **Import/restore** + automatic cloud backup history.
- **Subtask reordering**, due times per subtask.
- **Widgets / share progress card**, multi-language (the user base is Hinglish-friendly).

---

## 10. Edge-case & test-case matrix

### 10.1 Plan items
| # | Scenario | Expected | Risk today |
|---|----------|----------|-----------|
| T1 | Add task with empty title | Blocked with feedback | Silently no-ops (§4.2) |
| T2 | Title with only spaces | Trimmed → blocked | `trim()` → empty, no-ops |
| T3 | Very long title (200+ chars) / no spaces | Truncates cleanly | Header overflow (§3.1) |
| T4 | Workout target = 0 | No progress bar created | OK (`progress` only if `target>0`) |
| T5 | Workout target = negative | Rejected | Accepted → odd bar |
| T6 | Daily recurring, jump 30 days ahead in month view | Task shows every day | Only shows on tapped day (§2.2); 30 items created |
| T7 | Weekly recurring across timezones (UTC-5) | Same weekday | Off-by-one day (§2.1) |
| T8 | Mark done item that has a half-done checklist | Consistent state | Mixed signals (§2.9) |
| T9 | Complete all subtasks | Item auto-done | Works; progress bar not maxed (§2.9) |
| T10 | Delete a recurring template | Series handled | Orphans remain (§2.10) |
| T11 | 1,000+ items (heavy user over a year) | App stays fast & syncs | Slow scans + 1 MB doc limit (§2.3, §6) |

### 10.2 Goals
| # | Scenario | Expected | Risk |
|---|----------|----------|------|
| T12 | Goal target = "0" | Rejected | "Infinity%" (§2.6) |
| T13 | current bumped to target | Caps at 100% green | OK (clamped) |
| T14 | Deadline in the past | "Overdue" | OK (`pages/Goals.tsx:85`) |
| T15 | Deadline = today | "Due today" | OK |
| T16 | Add 100-unit goal | Reasonable input | 100 taps (§4.6) |
| T17 | Milestones | Add/check/uncheck | Can't add any (§1.2) |

### 10.3 Habits / streaks
| # | Scenario | Expected | Risk |
|---|----------|----------|------|
| T18 | Toggle habit twice | Net no log for the day | OK (`store/useStore.ts:339-340`) |
| T19 | Skip today, kept yesterday | Streak survives 1 empty day | OK (`computeStreak` grace, `useStore.ts:481`) |
| T20 | Delete habit with long streak | Confirm + undo | Instant delete, history gone (§4.1) |
| T21 | Very long habit name | Row stays intact | Pushes controls off (§3.1) |

### 10.4 Water / weight
| # | Scenario | Expected | Risk |
|---|----------|----------|------|
| T22 | Water goal = 0 | Guarded | `NaN%` width (§2.7) |
| T23 | Overshoot water | Can correct | Up-only, no undo (§4.7) |
| T24 | Log weight over weeks | Chart trends | Chart never populates (§1.1) |
| T25 | Clear weight field | Keep editing | Snaps to 0 (§2.8) |

### 10.5 Focus timer
| # | Scenario | Expected | Risk |
|---|----------|----------|------|
| T26 | Start, lock phone, return after time | Phase complete + chime | Only completes if page mounted (§4.5) |
| T27 | Start, navigate to Home, come back | Time elapsed correctly | Time via `endsAt` OK; no completion event fired meanwhile |
| T28 | Set duration to 0 / blank | Min 1 enforced | Guarded (`pages/Focus.tsx:268`) |
| T29 | Cross midnight mid-session | sessionsToday resets | Resets only on next `complete()` (§2.12) |
| T30 | Reduced-motion user | No spinny animation | Ring still animates (§5.1) |

### 10.6 Auth / sync
| # | Scenario | Expected | Risk |
|---|----------|----------|------|
| T31 | Two devices offline, edit different things | Both merge | One clobbers the other (§2.4) |
| T32 | Device clock wrong (skew) | Newest real edit wins | Skewed clock always wins (§2.4) |
| T33 | Logout right after adding a task | Task safe in cloud | Possible loss in debounce/teardown race (§2.5) |
| T34 | Brand-new signup | Cloud seeded from empty local | OK |
| T35 | Login on a 2nd account, same device | Starts from that account's data | Per-uid clock handles it (`lib/sync.ts:46-51`) |
| T36 | Offline edit, then back online | Auto-flush | Works via Firestore cache; no UI feedback (§8.1) |
| T37 | Firebase not configured | Local-only mode | OK (`App.tsx:121`) |
| T38 | Sign in on iOS Safari tab, enable reminders | Honest about limits | Over-promises (§4.4, §8.2) |

### 10.7 Forms / sheets / navigation
| # | Scenario | Expected | Risk |
|---|----------|----------|------|
| T39 | Open Add sheet, focus a field on a short phone | CTA stays visible | Sheet OK; Login/Onboarding not (§3.4) |
| T40 | Esc / drag-down / backdrop tap to close sheet | Closes | OK (`components/Sheet.tsx:33,72,88`) |
| T41 | Search a tag, then tap the X | Returns to calendar | Stays in search (§4.3) |
| T42 | Journal note containing a long URL | Wraps in card | Overflows (§3.1) |
| T43 | Malformed/old synced data shape | Graceful | No error boundary → white screen (§7) |
| T44 | Unknown route (`/xyz`) | 404 / redirect | No catch-all route (`App.tsx:60-67`) — blank page |
| T45 | Rapidly drag the FAB then tap | Tap suppressed after drag | Handled (`DraggableFab.tsx:36`); position not saved (§3.6) |

---

## 11. Suggested priority order

1. **🔴 §2.3** item growth → 1 MB Firestore failure (data loss at scale)
2. **🔴 §1.1 / §1.2** wire up weight logging + milestone add (advertised but dead)
3. **🟠 §2.1 / §2.2** recurrence correctness (timezone + overview)
4. **🟠 §2.4 / §2.5** sync conflict loss + logout race
5. **🟠 §4.1** delete confirmation + undo
6. **🟠 §1.5 / §7** remove hardcoded emails; add error boundary
7. **🟡** validation feedback (§4.2), empty states (§3.3), reminders/focus honesty & globalization (§4.4/§4.5)
8. **🟡/🔵** accessibility (§5), text-overflow (§3.1), performance (§6), polish (§8)

---

*Generated from a full read of `src/` on 2026-06-23. References are `file:line` at time of review.*

# ⚡ Forge Life OS

A **mobile-first PWA** for productivity, fitness, study, habits, and long-term goals — built for simplicity and consistency. Premium dark theme, glassmorphism, Apple + Notion-inspired, thumb-friendly one-hand navigation.

> Local-first: all data lives in your browser (Zustand + `localStorage`) so it works fully **offline** and is **installable** as an app. A `prisma/schema.prisma` is included to mirror the model for a future sync API.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build → dist/
npm run preview    # serve the production build
```

Open it on your phone (or DevTools device mode at 375px) → **Add to Home Screen** to install.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React 19 + TypeScript** | Type-safe component model |
| Styling | **Tailwind CSS** (CSS-variable theming) | Fast, consistent, theme switch cascades |
| Animation | **Framer Motion** | Sheet drag, route transitions, progress rings |
| State | **Zustand** + `persist` | Tiny store, auto-saved to `localStorage` |
| Charts | **Recharts** (lazy-loaded) | Weight / running / study / completion |
| Icons | **lucide-react** | SVG icons (no emoji icons) |
| Dates | **date-fns** | Week/month grids, streaks |
| PWA | **vite-plugin-pwa** | Offline cache + installable manifest |
| Backend (future) | **Node + PostgreSQL + Prisma** | See `prisma/schema.prisma` |

> **React Query** is intentionally omitted — there is no remote data to fetch in the local-first build. It slots in alongside the Prisma API later.

---

## Design system

| Token | Value |
|---|---|
| Primary | `#7C3AED` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Background | `#0F172A` |
| Card | `#1E293B` |
| Text | `#F8FAFC` |
| Headings | Poppins |
| Body | Inter |
| Radius | 16–24px (`rounded-2xl` / `rounded-3xl`) |
| Surfaces | `.glass` (blur + translucent), `.glass-soft` |

Colors are defined as CSS variables in `src/index.css` and consumed by Tailwind via `rgb(var(--x) / <alpha-value>)`, so the **dark ⇄ light theme switch** in Profile re-themes the whole app instantly. Respects `prefers-reduced-motion`, 44px+ touch targets, and `viewport-fit=cover` safe areas.

---

## UX flow

```
Launch ─▶ Home (today at a glance)
            │
            ├─ tap task ─▶ Action sheet: Complete ✓ / Skip ✕ / Edit ✎ / Delete / ±progress
            ├─ +250ml water ─▶ instant update
            │
Bottom nav ─┼─ Planner ─▶ Day / Week / Month  ─▶ tap day ─▶ tasks ─▶ (same action sheet)
            ├─ Goals   ─▶ filter by category ─▶ tap goal ─▶ ±progress, toggle milestones
            ├─ Progress─▶ charts: weight · completion% · running · study · habit streaks
            └─ Profile ─▶ info · theme · habits (toggle today) · journal · export · install

FAB (+) ─▶ fan: Add Task / Workout / Goal / Note ─▶ bottom sheet ─▶ pick type ─▶ save
```

**Core loop:** plan → do → check off → watch streak & charts grow → adjust goals.

---

## Component hierarchy

```
App (router + theme sync)
├─ AnimatedRoutes            route transitions (Framer Motion)
│  ├─ Home                   greeting · streak · completion ring · summary cards · water · timeline
│  ├─ Planner                Day / Week / Month views + period nav
│  │   └─ DayView / WeekView / MonthView
│  ├─ Goals                  category filter · GoalCard · GoalSheet (milestones)
│  ├─ Progress               Recharts: Line / Area / Bar + habit streaks
│  └─ Profile                info · theme switch · habits · journal · data export/reset/install
├─ FloatingActionButton      radial quick-add fan → QuickAddSheet
└─ BottomNav                 5 tabs, animated active pill (layoutId)

Shared
├─ GlassCard                 glass surface w/ fade-up entrance
├─ Sheet                     draggable bottom sheet (swipe-to-dismiss, Esc, focus trap)
├─ QuickAddSheet             unified add for task/workout/study/habit/goal/note
├─ PlanItemCard              task row + action/edit/progress sheet
├─ ProgressRing / ProgressBar
└─ lib/ui.ts                 task & category metadata (icon + accent), cn(), haptic()
```

### State (`src/store/useStore.ts`)

Entities: `profile`, `items` (plan items), `goals`, `habits`, `journal`, `weight`, `water`.
Actions cover add/update/complete/skip/progress for items; goal progress + milestones; habit toggle; journal; water; weight; export & reset.
Derived selectors: `itemsForDate`, `dayCompletion`, `computeStreak`, `habitStreak`.

---

## Data model (backend)

`prisma/schema.prisma` mirrors `src/types/index.ts`: `User`, `PlanItem`, `Goal`+`Milestone`, `Habit`+`HabitEntry` (one row per completed day for fast streak queries), `JournalEntry`, `WeightLog`, `WaterLog`. Enums for `TaskType`, `TaskStatus`, `GoalCategory`, `Theme`.

To wire a backend later:
1. `DATABASE_URL=postgres://…` in `.env`
2. `npx prisma migrate dev`
3. Build a thin REST/tRPC layer and swap the Zustand actions to call it (keep `localStorage` as the offline cache).

---

## Features delivered

- ✅ 5-tab thumb-friendly bottom nav + animated active pill
- ✅ Home: greeting, date, streak 🔥, today's completion ring, summary cards, water tracker, timeline
- ✅ Planner: Day / Week / Month, progress-based tasks (`3/5 KM`, `45/120 Min`)
- ✅ Task actions: complete / skip / edit / delete / ± progress
- ✅ Goals: 4 categories, progress, deadlines, milestones
- ✅ Progress: weight, completion %, running, study-hours charts + habit streaks
- ✅ Profile: editable info, **working** dark/light theme switch, habit tracker, journal, JSON export, reset
- ✅ FAB radial quick-add (Task / Workout / Goal / Note)
- ✅ Habit streak tracking + daily journal with mood
- ✅ PWA: offline support, installable, theme-color, safe-area aware
- ✅ Accessibility: 44px targets, focus rings, aria-labels, reduced-motion

### Not yet wired (clear next steps)
- Backend persistence/sync (schema ready in `prisma/`)
- Push/local notifications (manifest + SW in place; needs Notification API hookup)
- Multi-device calendar integration
```

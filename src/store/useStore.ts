import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Goal,
  GoalCategory,
  Habit,
  JournalEntry,
  PlanItem,
  Priority,
  Profile,
  Repeat,
  TaskType,
  WeightLog,
} from "../types";
import {
  seedGoals,
  seedHabits,
  seedItems,
  seedProfile,
  seedWater,
  seedWeight,
} from "../lib/seed";
import { todayISO, shiftISO } from "../lib/date";

const uid = () => Math.random().toString(36).slice(2, 10);

interface State {
  profile: Profile;
  items: PlanItem[];
  goals: Goal[];
  habits: Habit[];
  journal: JournalEntry[];
  weight: WeightLog[];
  water: Record<string, number>;

  // ── Account / sync / settings ──
  userId: string;
  syncEnabled: boolean;
  remindersEnabled: boolean;
  setSyncEnabled: (on: boolean) => void;
  setRemindersEnabled: (on: boolean) => void;
  completeOnboarding: (patch: Partial<Profile>) => void;
  importData: (snapshot: Partial<State>) => void;

  // ── Plan items ──
  addItem: (input: {
    title: string;
    type: TaskType;
    date?: string;
    time?: string;
    target?: number;
    unit?: string;
    note?: string;
    priority?: Priority;
    repeat?: Repeat;
    tags?: string[];
    subtasks?: string[];
  }) => void;
  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  setItemStatus: (id: string, status: PlanItem["status"]) => void;
  bumpProgress: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  addSubtask: (itemId: string, title: string) => void;
  toggleSubtask: (itemId: string, subId: string) => void;
  removeSubtask: (itemId: string, subId: string) => void;
  /** materialise recurring templates as concrete occurrences for `date` */
  ensureRecurring: (date: string) => void;

  // ── Goals ──
  addGoal: (input: {
    title: string;
    category: GoalCategory;
    target: number;
    unit: string;
    deadline?: string;
  }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  bumpGoal: (id: string, delta: number) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  removeGoal: (id: string) => void;

  // ── Habits ──
  addHabit: (title: string) => void;
  toggleHabit: (id: string, date: string) => void;
  removeHabit: (id: string) => void;

  // ── Journal ──
  addNote: (text: string, mood?: JournalEntry["mood"]) => void;
  removeNote: (id: string) => void;

  // ── Misc ──
  addWater: (ml: number) => void;
  logWeight: (kg: number) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  exportData: () => string;
  resetData: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: seedProfile,
      items: seedItems,
      goals: seedGoals,
      habits: seedHabits,
      journal: [],
      weight: seedWeight,
      water: seedWater,

      userId: uid() + uid(),
      syncEnabled: false,
      remindersEnabled: false,

      setSyncEnabled: (on) => set({ syncEnabled: on }),
      setRemindersEnabled: (on) => set({ remindersEnabled: on }),
      completeOnboarding: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch, onboarded: true } })),
      importData: (snapshot) =>
        set((s) => ({
          profile: snapshot.profile ?? s.profile,
          items: snapshot.items ?? s.items,
          goals: snapshot.goals ?? s.goals,
          habits: snapshot.habits ?? s.habits,
          journal: snapshot.journal ?? s.journal,
          weight: snapshot.weight ?? s.weight,
          water: snapshot.water ?? s.water,
        })),

      addItem: (input) =>
        set((s) => {
          const tags = (input.tags ?? [])
            .map((t) => t.trim())
            .filter(Boolean);
          const subtasks = (input.subtasks ?? [])
            .map((t) => t.trim())
            .filter(Boolean)
            .map((title) => ({ id: uid(), title, done: false }));
          return {
            items: [
              ...s.items,
              {
                id: uid(),
                title: input.title.trim(),
                type: input.type,
                date: input.date ?? todayISO(),
                time: input.time,
                status: "pending",
                note: input.note,
                priority: input.priority,
                repeat: input.repeat && input.repeat !== "none" ? input.repeat : undefined,
                tags: tags.length ? tags : undefined,
                subtasks: subtasks.length ? subtasks : undefined,
                progress:
                  input.target && input.target > 0
                    ? { current: 0, target: input.target, unit: input.unit ?? "" }
                    : undefined,
                createdAt: Date.now(),
              },
            ],
          };
        }),

      ensureRecurring: (date) =>
        set((s) => {
          const additions: PlanItem[] = [];
          for (const t of s.items) {
            if (!t.repeat || t.repeat === "none" || t.seriesId) continue;
            if (date <= t.date) continue; // template already covers its own date
            if (
              t.repeat === "weekly" &&
              new Date(date).getDay() !== new Date(t.date).getDay()
            )
              continue;
            if (s.items.some((i) => i.seriesId === t.id && i.date === date)) continue;
            additions.push({
              ...t,
              id: uid(),
              date,
              status: "pending",
              seriesId: t.id,
              progress: t.progress ? { ...t.progress, current: 0 } : undefined,
              createdAt: Date.now(),
            });
          }
          return additions.length ? { items: [...s.items, ...additions] } : {};
        }),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      setItemStatus: (id, status) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status,
                  progress:
                    status === "done" && i.progress
                      ? { ...i.progress, current: i.progress.target }
                      : i.progress,
                }
              : i,
          ),
        })),

      bumpProgress: (id, delta) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id || !i.progress) return i;
            const current = Math.max(
              0,
              Math.min(i.progress.target, i.progress.current + delta),
            );
            const done = current >= i.progress.target;
            return {
              ...i,
              progress: { ...i.progress, current },
              status: done ? "done" : i.status === "done" ? "pending" : i.status,
            };
          }),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      addSubtask: (itemId, title) =>
        set((s) => {
          const t = title.trim();
          if (!t) return {};
          return {
            items: s.items.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    subtasks: [
                      ...(i.subtasks ?? []),
                      { id: uid(), title: t, done: false },
                    ],
                  }
                : i,
            ),
          };
        }),

      toggleSubtask: (itemId, subId) =>
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== itemId || !i.subtasks) return i;
            const subtasks = i.subtasks.map((st) =>
              st.id === subId ? { ...st, done: !st.done } : st,
            );
            // When every step is checked, mark the whole task done (and vice-versa).
            const allDone = subtasks.length > 0 && subtasks.every((st) => st.done);
            return {
              ...i,
              subtasks,
              status: allDone ? "done" : i.status === "done" ? "pending" : i.status,
            };
          }),
        })),

      removeSubtask: (itemId, subId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === itemId && i.subtasks
              ? { ...i, subtasks: i.subtasks.filter((st) => st.id !== subId) }
              : i,
          ),
        })),

      addGoal: (input) =>
        set((s) => ({
          goals: [
            ...s.goals,
            {
              id: uid(),
              title: input.title.trim(),
              category: input.category,
              current: 0,
              target: input.target,
              unit: input.unit,
              deadline: input.deadline,
              milestones: [],
              createdAt: Date.now(),
            },
          ],
        })),

      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      bumpGoal: (id, delta) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  current: Math.max(0, Math.min(g.target, g.current + delta)),
                }
              : g,
          ),
        })),

      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: g.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, done: !m.done } : m,
                  ),
                }
              : g,
          ),
        })),

      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addHabit: (title) =>
        set((s) => ({
          habits: [
            ...s.habits,
            { id: uid(), title: title.trim(), log: {}, createdAt: Date.now() },
          ],
        })),

      toggleHabit: (id, date) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const log = { ...h.log };
            if (log[date]) delete log[date];
            else log[date] = true;
            return { ...h, log };
          }),
        })),

      removeHabit: (id) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      addNote: (text, mood = 3) =>
        set((s) => ({
          journal: [
            {
              id: uid(),
              date: todayISO(),
              mood,
              text: text.trim(),
              createdAt: Date.now(),
            },
            ...s.journal,
          ],
        })),

      removeNote: (id) =>
        set((s) => ({ journal: s.journal.filter((j) => j.id !== id) })),

      addWater: (ml) =>
        set((s) => {
          const t = todayISO();
          return { water: { ...s.water, [t]: Math.max(0, (s.water[t] ?? 0) + ml) } };
        }),

      logWeight: (kg) =>
        set((s) => {
          const t = todayISO();
          const rest = s.weight.filter((w) => w.date !== t);
          return {
            weight: [...rest, { date: t, kg }].sort((a, b) =>
              a.date.localeCompare(b.date),
            ),
            profile: { ...s.profile, weightKg: kg },
          };
        }),

      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),

      exportData: () => {
        const { profile, items, goals, habits, journal, weight, water } = get();
        return JSON.stringify(
          { profile, items, goals, habits, journal, weight, water, exportedAt: new Date().toISOString() },
          null,
          2,
        );
      },

      resetData: () =>
        set({
          profile: seedProfile,
          items: seedItems,
          goals: seedGoals,
          habits: seedHabits,
          journal: [],
          weight: seedWeight,
          water: seedWater,
        }),
    }),
    { name: "forge-life-os", version: 1 },
  ),
);

// ── Derived selectors (pure helpers, used across pages) ──────────

const rank: Record<string, number> = { high: 0, med: 1, low: 2 };
export const itemsForDate = (items: PlanItem[], date: string): PlanItem[] =>
  items
    .filter((i) => i.date === date)
    .sort((a, b) => {
      const t = (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
      if (t !== 0) return t;
      return (rank[a.priority ?? "low"] ?? 2) - (rank[b.priority ?? "low"] ?? 2);
    });

/** Completed/total checklist steps for an item (0/0 when it has none). */
export const subtaskProgress = (item: PlanItem): { done: number; total: number } => {
  const total = item.subtasks?.length ?? 0;
  const done = item.subtasks?.filter((s) => s.done).length ?? 0;
  return { done, total };
};

/** All distinct tags across items, sorted alphabetically. */
export const allTags = (items: PlanItem[]): string[] =>
  [...new Set(items.flatMap((i) => i.tags ?? []))].sort((a, b) =>
    a.localeCompare(b),
  );

/**
 * Full-text-ish search across all items. Matches a free-text query against
 * title, tags, type and note, and optionally narrows to a specific tag.
 * Results are newest-first. An empty query + no tag returns [].
 */
export const searchItems = (
  items: PlanItem[],
  query: string,
  tag?: string,
): PlanItem[] => {
  const q = query.trim().toLowerCase();
  if (!q && !tag) return [];
  return items
    .filter((i) => {
      if (tag && !(i.tags ?? []).includes(tag)) return false;
      if (!q) return true;
      const hay = [
        i.title,
        i.type,
        i.note ?? "",
        ...(i.tags ?? []),
        ...(i.subtasks ?? []).map((s) => s.title),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
};

export const dayCompletion = (items: PlanItem[], date: string): number => {
  const day = items.filter((i) => i.date === date && i.status !== "skipped");
  if (day.length === 0) return 0;
  const done = day.filter((i) => i.status === "done").length;
  return Math.round((done / day.length) * 100);
};

/** A day "counts" toward streak if any task was completed or any habit logged. */
export const computeStreak = (items: PlanItem[], habits: Habit[]): number => {
  const active = (date: string) =>
    items.some((i) => i.date === date && i.status === "done") ||
    habits.some((h) => h.log[date]);

  let streak = 0;
  let cursor = todayISO();
  // allow today to be empty without breaking yesterday's streak
  if (!active(cursor)) cursor = shiftISO(cursor, -1);
  while (active(cursor)) {
    streak += 1;
    cursor = shiftISO(cursor, -1);
  }
  return streak;
};

export const habitStreak = (habit: Habit): number => {
  let streak = 0;
  let cursor = todayISO();
  if (!habit.log[cursor]) cursor = shiftISO(cursor, -1);
  while (habit.log[cursor]) {
    streak += 1;
    cursor = shiftISO(cursor, -1);
  }
  return streak;
};

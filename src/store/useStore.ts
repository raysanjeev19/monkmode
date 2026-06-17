import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Goal,
  GoalCategory,
  Habit,
  JournalEntry,
  PlanItem,
  Profile,
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

  // ── Plan items ──
  addItem: (input: {
    title: string;
    type: TaskType;
    date?: string;
    time?: string;
    target?: number;
    unit?: string;
    note?: string;
  }) => void;
  updateItem: (id: string, patch: Partial<PlanItem>) => void;
  setItemStatus: (id: string, status: PlanItem["status"]) => void;
  bumpProgress: (id: string, delta: number) => void;
  removeItem: (id: string) => void;

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

      addItem: (input) =>
        set((s) => ({
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
              progress:
                input.target && input.target > 0
                  ? { current: 0, target: input.target, unit: input.unit ?? "" }
                  : undefined,
              createdAt: Date.now(),
            },
          ],
        })),

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

export const itemsForDate = (items: PlanItem[], date: string): PlanItem[] =>
  items
    .filter((i) => i.date === date)
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));

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

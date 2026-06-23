// Workout-plan types + the resolver that maps a calendar date to "which
// session should I do today". A plan is phase-based: each month is a phase,
// and a fixed weekly split decides the muscle groups per weekday.
import { fromISO } from "./date";

export interface Exercise {
  name: string;
  equipment: string;
  sets: string;
  reps: string;
  rest: string;
}
export interface MuscleGroup {
  group: string;
  exercises: Exercise[];
}
export interface DayWorkout {
  warmup: string;
  groups: MuscleGroup[];
}
export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
export interface PlanMonth {
  phase: string;
  repRange: string;
  days: Record<Weekday, DayWorkout>;
}
export interface WorkoutPlan {
  name: string;
  /** The calendar year+month (1–12) that maps to phase/month 1. */
  startYear: number;
  startMonth: number;
  split: Record<Weekday, string>;
  months: PlanMonth[];
}

export interface ResolvedWorkout {
  monthIndex: number; // 0-based phase index
  phase: string;
  repRange: string;
  weekday: Weekday;
  splitLabel: string;
  day: DayWorkout;
  exerciseCount: number;
  setCount: number;
}

const WEEKDAYS: Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function weekdayOf(dateISO: string): Weekday {
  return WEEKDAYS[fromISO(dateISO).getDay()];
}

/**
 * Which phase/month a date falls in. Phase 1 = the plan's start month; each
 * later calendar month advances one phase. Dates before the start clamp to
 * phase 1, dates past the last phase clamp to the final phase.
 */
export function monthIndexForDate(plan: WorkoutPlan, dateISO: string): number {
  const d = fromISO(dateISO);
  const offset =
    (d.getFullYear() - plan.startYear) * 12 + (d.getMonth() + 1 - plan.startMonth);
  return Math.max(0, Math.min(plan.months.length - 1, offset));
}

const EMPTY_DAY: DayWorkout = { warmup: "", groups: [] };

export function resolveWorkout(plan: WorkoutPlan, dateISO: string): ResolvedWorkout {
  const monthIndex = monthIndexForDate(plan, dateISO);
  const month = plan.months[monthIndex];
  const weekday = weekdayOf(dateISO);
  // Defensive: a malformed/partial plan must not crash the whole app.
  const day = month?.days?.[weekday] ?? EMPTY_DAY;
  const setCount = day.groups.reduce(
    (sum, g) =>
      sum + g.exercises.reduce((s, e) => s + (parseInt(e.sets, 10) || 0), 0),
    0,
  );
  const exerciseCount = day.groups.reduce((sum, g) => sum + g.exercises.length, 0);
  return {
    monthIndex,
    phase: month?.phase ?? "",
    repRange: month?.repRange ?? "",
    weekday,
    splitLabel: plan.split?.[weekday] ?? weekday,
    day,
    exerciseCount,
    setCount,
  };
}

// ── Which users get the baked-in Recomp plan ────────────────────────────────
// The two coach accounts always get it; extra addresses can be added via the
// VITE_RECOMP_EMAILS env var (comma-separated). Everyone else uses a plan they
// create/upload themselves (coming next).
const RECOMP_EMAILS = new Set(
  [
    "raysanjeev19@gmail.com",
    "jharatan6290@gmail.com",
    ...((import.meta.env.VITE_RECOMP_EMAILS as string | undefined)
      ?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []),
  ],
);

export function hasBakedPlan(email?: string | null): boolean {
  return !!email && RECOMP_EMAILS.has(email.trim().toLowerCase());
}

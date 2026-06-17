// ── Domain model for Forge Life OS ───────────────────────────────

export type ID = string;

export type TaskType = "task" | "workout" | "study" | "habit";
export type TaskStatus = "pending" | "done" | "skipped";

export interface PlanItem {
  id: ID;
  title: string;
  type: TaskType;
  /** ISO date string, e.g. "2026-06-17" */
  date: string;
  /** "HH:mm" 24h, optional — drives the timeline */
  time?: string;
  status: TaskStatus;
  /** progress-based tasks: current/target with a unit ("KM", "Min", "reps") */
  progress?: { current: number; target: number; unit: string };
  note?: string;
  createdAt: number;
}

export type GoalCategory = "fitness" | "career" | "learning" | "personal";

export interface Milestone {
  id: ID;
  title: string;
  done: boolean;
}

export interface Goal {
  id: ID;
  title: string;
  category: GoalCategory;
  current: number;
  target: number;
  unit: string;
  /** ISO date deadline */
  deadline?: string;
  milestones: Milestone[];
  createdAt: number;
}

export interface Habit {
  id: ID;
  title: string;
  /** map of "YYYY-MM-DD" -> true for completed days */
  log: Record<string, boolean>;
  createdAt: number;
}

export interface JournalEntry {
  id: ID;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: number;
}

export interface WeightLog {
  date: string;
  kg: number;
}

export type Theme = "dark" | "light";

export interface Profile {
  name: string;
  weightKg: number;
  heightCm: number;
  targetWeightKg: number;
  waterTargetMl: number;
  theme: Theme;
}

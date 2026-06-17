import {
  Dumbbell,
  BookOpen,
  Repeat,
  CheckSquare,
  Briefcase,
  GraduationCap,
  Heart,
  type LucideIcon,
} from "lucide-react";
import type { GoalCategory, TaskType } from "../types";

export const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

interface Meta {
  label: string;
  icon: LucideIcon;
  /** tailwind text/bg accent for the type/category chip */
  text: string;
  bg: string;
  ring: string;
}

export const taskMeta: Record<TaskType, Meta> = {
  task: {
    label: "Task",
    icon: CheckSquare,
    text: "text-primary-soft",
    bg: "bg-primary/15",
    ring: "ring-primary/30",
  },
  workout: {
    label: "Workout",
    icon: Dumbbell,
    text: "text-warning",
    bg: "bg-warning/15",
    ring: "ring-warning/30",
  },
  study: {
    label: "Study",
    icon: BookOpen,
    text: "text-yellow-600",
    bg: "bg-yellow-500/15",
    ring: "ring-yellow-500/30",
  },
  habit: {
    label: "Habit",
    icon: Repeat,
    text: "text-success",
    bg: "bg-success/15",
    ring: "ring-success/30",
  },
};

export const categoryMeta: Record<GoalCategory, Meta> = {
  fitness: {
    label: "Fitness",
    icon: Dumbbell,
    text: "text-warning",
    bg: "bg-warning/15",
    ring: "ring-warning/30",
  },
  career: {
    label: "Career",
    icon: Briefcase,
    text: "text-primary-soft",
    bg: "bg-primary/15",
    ring: "ring-primary/30",
  },
  learning: {
    label: "Learning",
    icon: GraduationCap,
    text: "text-yellow-600",
    bg: "bg-yellow-500/15",
    ring: "ring-yellow-500/30",
  },
  personal: {
    label: "Personal",
    icon: Heart,
    text: "text-rose-500",
    bg: "bg-rose-500/15",
    ring: "ring-rose-500/30",
  },
};

/** Light haptic feedback where supported (no-op otherwise). */
export const haptic = (ms = 8) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }
};

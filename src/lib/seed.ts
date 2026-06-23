import type { Goal, Habit, PlanItem, Profile, WeightLog } from "../types";

// Starter state. The app intentionally ships EMPTY — no demo/sample data — so
// new users (and a data reset) begin with a clean slate. Onboarding collects
// the profile basics.

/** First-run theme follows the OS preference; the user can switch in Profile. */
const systemTheme: Profile["theme"] =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const seedProfile: Profile = {
  name: "",
  weightKg: 70,
  heightCm: 175,
  targetWeightKg: 65,
  waterTargetMl: 3000,
  theme: systemTheme,
  onboarded: false,
};

export const seedItems: PlanItem[] = [];

export const seedGoals: Goal[] = [];

export const seedHabits: Habit[] = [];

export const seedWeight: WeightLog[] = [];

export const seedWater: Record<string, number> = {};

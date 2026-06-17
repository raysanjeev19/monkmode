import type { Goal, Habit, PlanItem, Profile, WeightLog } from "../types";
import { todayISO, shiftISO } from "./date";

const uid = () => Math.random().toString(36).slice(2, 10);

const T = todayISO();

export const seedProfile: Profile = {
  name: "Sanjay",
  weightKg: 86,
  heightCm: 178,
  targetWeightKg: 71,
  waterTargetMl: 3000,
  theme: "light",
};

export const seedItems: PlanItem[] = [
  {
    id: uid(),
    title: "Wake Up",
    type: "habit",
    date: T,
    time: "05:00",
    status: "done",
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "Run 5 KM",
    type: "workout",
    date: T,
    time: "06:00",
    status: "pending",
    progress: { current: 3, target: 5, unit: "KM" },
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "Office",
    type: "task",
    date: T,
    time: "08:00",
    status: "pending",
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "React Study",
    type: "study",
    date: T,
    time: "13:00",
    status: "pending",
    progress: { current: 45, target: 120, unit: "Min" },
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "Gym — Push Day",
    type: "workout",
    date: T,
    time: "19:00",
    status: "pending",
    createdAt: Date.now(),
  },
  // a couple on adjacent days so week/month views are alive
  {
    id: uid(),
    title: "Meal Prep",
    type: "task",
    date: shiftISO(T, 1),
    time: "11:00",
    status: "pending",
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "Run 6 KM",
    type: "workout",
    date: shiftISO(T, 1),
    time: "06:00",
    status: "pending",
    progress: { current: 0, target: 6, unit: "KM" },
    createdAt: Date.now(),
  },
];

export const seedGoals: Goal[] = [
  {
    id: uid(),
    title: "Lose 15 KG",
    category: "fitness",
    current: 8,
    target: 15,
    unit: "KG",
    deadline: shiftISO(T, 120),
    milestones: [
      { id: uid(), title: "First 5 KG", done: true },
      { id: uid(), title: "Hit 80 KG", done: true },
      { id: uid(), title: "Hit 75 KG", done: false },
      { id: uid(), title: "Reach target 71 KG", done: false },
    ],
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "Get Frontend Job",
    category: "career",
    current: 30,
    target: 100,
    unit: "Applications",
    deadline: shiftISO(T, 90),
    milestones: [
      { id: uid(), title: "Polish portfolio", done: true },
      { id: uid(), title: "Apply to 50", done: false },
      { id: uid(), title: "Land 5 interviews", done: false },
    ],
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "Master React + TS",
    category: "learning",
    current: 22,
    target: 40,
    unit: "Hours",
    deadline: shiftISO(T, 45),
    milestones: [
      { id: uid(), title: "Hooks deep dive", done: true },
      { id: uid(), title: "Build 3 projects", done: false },
    ],
    createdAt: Date.now(),
  },
];

export const seedHabits: Habit[] = [
  {
    id: uid(),
    title: "Wake at 5 AM",
    log: {
      [shiftISO(T, -3)]: true,
      [shiftISO(T, -2)]: true,
      [shiftISO(T, -1)]: true,
      [T]: true,
    },
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "No Sugar",
    log: { [shiftISO(T, -1)]: true, [shiftISO(T, -2)]: true },
    createdAt: Date.now(),
  },
  {
    id: uid(),
    title: "Read 20 min",
    log: { [T]: true, [shiftISO(T, -1)]: true },
    createdAt: Date.now(),
  },
];

export const seedWeight: WeightLog[] = Array.from({ length: 8 }, (_, i) => ({
  date: shiftISO(T, -(7 - i) * 7),
  kg: 94 - i * 1.0 - (i % 2 === 0 ? 0.4 : 0),
}));

export const seedWater: Record<string, number> = { [T]: 1500 };

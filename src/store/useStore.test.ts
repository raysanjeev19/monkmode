import { describe, it, expect } from "vitest";
import { itemsForDate, dayCompletion, computeStreak, habitStreak } from "./useStore";
import type { PlanItem, Habit } from "../types";
import { todayISO, shiftISO } from "../lib/date";

const T = todayISO();

const item = (over: Partial<PlanItem>): PlanItem => ({
  id: Math.random().toString(36).slice(2),
  title: "x",
  type: "task",
  date: T,
  status: "pending",
  createdAt: 0,
  ...over,
});

const habit = (log: Record<string, boolean>): Habit => ({
  id: Math.random().toString(36).slice(2),
  title: "h",
  log,
  createdAt: 0,
});

describe("itemsForDate", () => {
  it("filters by date and sorts by time", () => {
    const items = [
      item({ date: T, time: "09:00", title: "b" }),
      item({ date: T, time: "06:00", title: "a" }),
      item({ date: shiftISO(T, 1), title: "other" }),
    ];
    const out = itemsForDate(items, T);
    expect(out.map((i) => i.title)).toEqual(["a", "b"]);
  });
});

describe("dayCompletion", () => {
  it("is the % of non-skipped items that are done", () => {
    const items = [
      item({ status: "done" }),
      item({ status: "pending" }),
    ];
    expect(dayCompletion(items, T)).toBe(50);
  });

  it("ignores skipped items", () => {
    const items = [item({ status: "done" }), item({ status: "skipped" })];
    expect(dayCompletion(items, T)).toBe(100);
  });

  it("is 0 when nothing is planned", () => {
    expect(dayCompletion([], T)).toBe(0);
  });
});

describe("computeStreak", () => {
  it("counts consecutive active days ending today", () => {
    const habits = [habit({ [T]: true, [shiftISO(T, -1)]: true, [shiftISO(T, -2)]: true })];
    expect(computeStreak([], habits)).toBe(3);
  });

  it("survives an empty today if yesterday was active", () => {
    const habits = [habit({ [shiftISO(T, -1)]: true, [shiftISO(T, -2)]: true })];
    expect(computeStreak([], habits)).toBe(2);
  });

  it("counts a completed task as an active day", () => {
    const items = [item({ date: T, status: "done" })];
    expect(computeStreak(items, [])).toBe(1);
  });

  it("breaks on a gap", () => {
    const habits = [habit({ [T]: true, [shiftISO(T, -2)]: true })];
    expect(computeStreak([], habits)).toBe(1);
  });
});

describe("habitStreak", () => {
  it("counts the trailing run of logged days", () => {
    expect(habitStreak(habit({ [T]: true, [shiftISO(T, -1)]: true }))).toBe(2);
    expect(habitStreak(habit({}))).toBe(0);
  });
});

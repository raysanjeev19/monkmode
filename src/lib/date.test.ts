import { describe, it, expect } from "vitest";
import { toISO, fromISO, shiftISO, weekDays, monthGrid, isToday, todayISO } from "./date";

describe("date helpers", () => {
  it("toISO / fromISO round-trip", () => {
    expect(toISO(fromISO("2026-06-18"))).toBe("2026-06-18");
  });

  it("shiftISO moves by N days across month boundaries", () => {
    expect(shiftISO("2026-06-30", 1)).toBe("2026-07-01");
    expect(shiftISO("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("weekDays returns 7 consecutive Mon-first days", () => {
    const w = weekDays("2026-06-18"); // Thursday
    expect(w).toHaveLength(7);
    expect(w[0]).toBe("2026-06-15"); // Monday
    expect(w[6]).toBe("2026-06-21"); // Sunday
  });

  it("monthGrid spans whole weeks and contains the month", () => {
    const g = monthGrid("2026-06-18");
    expect(g.length % 7).toBe(0); // full Mon–Sun rows
    expect(g.length).toBeGreaterThanOrEqual(28);
    expect(g).toContain("2026-06-01");
    expect(g).toContain("2026-06-30");
  });

  it("isToday matches todayISO", () => {
    expect(isToday(todayISO())).toBe(true);
    expect(isToday("2000-01-01")).toBe(false);
  });
});

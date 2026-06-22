import { create } from "zustand";
import { persist } from "zustand/middleware";

// A self-contained Pomodoro / focus timer. Kept in its OWN store (persisted
// locally, not mirrored to the cloud) because the running countdown is
// ephemeral, per-device state that shouldn't sync between devices.

export type Phase = "work" | "short" | "long";

interface Durations {
  work: number; // minutes
  short: number;
  long: number;
}

interface FocusState {
  phase: Phase;
  running: boolean;
  /** epoch ms when the current run ends (only meaningful while running) */
  endsAt: number | null;
  /** ms left on the clock — authoritative while paused */
  remainingMs: number;
  /** completed work sessions in the current long-break cycle */
  cycle: number;
  /** completed work sessions today (for a daily count) */
  sessionsToday: number;
  sessionsDate: string;
  durations: Durations;
  cyclesBeforeLong: number;
  taskTitle?: string;

  setTask: (title?: string) => void;
  configure: (patch: Partial<Durations & { cyclesBeforeLong: number }>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  /** advance to the next phase (manual skip — doesn't count a session) */
  skip: () => void;
  /** called when the clock reaches zero — counts the session then advances */
  complete: () => void;
}

const MIN = 60_000;
const todayKey = () => new Date().toISOString().slice(0, 10);

export const durationFor = (p: Phase, d: Durations): number =>
  (p === "work" ? d.work : p === "short" ? d.short : d.long) * MIN;

/** ms remaining right now (live while running, frozen while paused). */
export const remainingNow = (s: FocusState): number =>
  s.running && s.endsAt != null
    ? Math.max(0, s.endsAt - Date.now())
    : s.remainingMs;

function nextPhase(
  phase: Phase,
  cycle: number,
  cyclesBeforeLong: number,
): { phase: Phase; cycle: number } {
  if (phase === "work") {
    const c = cycle + 1;
    return c % cyclesBeforeLong === 0
      ? { phase: "long", cycle: c }
      : { phase: "short", cycle: c };
  }
  return { phase: "work", cycle };
}

const DEFAULTS: Durations = { work: 25, short: 5, long: 15 };

export const useFocus = create<FocusState>()(
  persist(
    (set, get) => ({
      phase: "work",
      running: false,
      endsAt: null,
      remainingMs: durationFor("work", DEFAULTS),
      cycle: 0,
      sessionsToday: 0,
      sessionsDate: todayKey(),
      durations: DEFAULTS,
      cyclesBeforeLong: 4,
      taskTitle: undefined,

      setTask: (title) => set({ taskTitle: title?.trim() || undefined }),

      configure: (patch) =>
        set((s) => {
          const durations = {
            work: patch.work ?? s.durations.work,
            short: patch.short ?? s.durations.short,
            long: patch.long ?? s.durations.long,
          };
          const cyclesBeforeLong = patch.cyclesBeforeLong ?? s.cyclesBeforeLong;
          // If not running, re-seed the clock for the current phase.
          return s.running
            ? { durations, cyclesBeforeLong }
            : {
                durations,
                cyclesBeforeLong,
                remainingMs: durationFor(s.phase, durations),
              };
        }),

      start: () =>
        set((s) => {
          const ms = s.remainingMs > 0 ? s.remainingMs : durationFor(s.phase, s.durations);
          return { running: true, endsAt: Date.now() + ms, remainingMs: ms };
        }),

      pause: () =>
        set((s) => ({
          running: false,
          endsAt: null,
          remainingMs: remainingNow(s),
        })),

      reset: () =>
        set((s) => ({
          running: false,
          endsAt: null,
          remainingMs: durationFor(s.phase, s.durations),
        })),

      skip: () =>
        set((s) => {
          const { phase, cycle } = nextPhase(s.phase, s.cycle, s.cyclesBeforeLong);
          return {
            phase,
            cycle,
            running: false,
            endsAt: null,
            remainingMs: durationFor(phase, s.durations),
          };
        }),

      complete: () => {
        const s = get();
        const finishedWork = s.phase === "work";
        const { phase, cycle } = nextPhase(s.phase, s.cycle, s.cyclesBeforeLong);
        const sameDay = s.sessionsDate === todayKey();
        set({
          phase,
          cycle,
          running: false,
          endsAt: null,
          remainingMs: durationFor(phase, s.durations),
          sessionsDate: todayKey(),
          sessionsToday:
            (sameDay ? s.sessionsToday : 0) + (finishedWork ? 1 : 0),
        });
      },
    }),
    { name: "monkmode-focus", version: 1 },
  ),
);

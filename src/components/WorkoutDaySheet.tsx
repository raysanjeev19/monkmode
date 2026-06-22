import { Dumbbell, Flame } from "lucide-react";
import Sheet from "./Sheet";
import { formatLong } from "../lib/date";
import { resolveWorkout, type WorkoutPlan } from "../lib/workoutPlan";

/** Read-only view of one day's session from a workout plan. */
export default function WorkoutDaySheet({
  open,
  onClose,
  plan,
  date,
}: {
  open: boolean;
  onClose: () => void;
  plan: WorkoutPlan;
  date: string;
}) {
  const w = resolveWorkout(plan, date);

  return (
    <Sheet open={open} onClose={onClose} title={w.splitLabel}>
      <div className="space-y-4">
        {/* Phase + date + volume */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
            Month {w.monthIndex + 1} · {w.phase}
          </span>
          <span className="rounded-full surface px-2.5 py-1 font-medium text-ink-mute">
            {w.repRange}
          </span>
        </div>
        <p className="text-sm text-ink-mute">
          {formatLong(date)} · {w.exerciseCount} exercises · {w.setCount} sets
        </p>

        {/* Warm-up */}
        {w.day.warmup && (
          <div className="flex gap-2.5 rounded-2xl surface px-3.5 py-3">
            <Flame size={16} className="mt-0.5 shrink-0 text-primary-soft" />
            <p className="text-sm leading-relaxed text-ink-mute">
              <span className="font-semibold text-ink">Warm-up · </span>
              {w.day.warmup}
            </p>
          </div>
        )}

        {/* Muscle groups */}
        {w.day.groups.map((g) => (
          <div key={g.group}>
            <div className="mb-2 flex items-center gap-2">
              <Dumbbell size={15} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-ink">
                {g.group}
              </h3>
              <span className="text-xs text-ink-faint">{g.exercises.length} ex</span>
            </div>
            <div className="overflow-hidden rounded-2xl surface">
              {g.exercises.map((e, i) => (
                <div
                  key={i}
                  className={cnRow(i)}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/12 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{e.name}</p>
                    {e.equipment && (
                      <p className="truncate text-xs text-ink-faint">{e.equipment}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-ink">
                      {e.sets}
                      <span className="text-ink-faint"> × </span>
                      {e.reps}
                    </p>
                    {e.rest && <p className="text-xs text-ink-faint">rest {e.rest}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

function cnRow(i: number): string {
  return (
    "flex items-center gap-3 px-3.5 py-2.5" +
    (i === 0 ? "" : " border-t border-line/50")
  );
}

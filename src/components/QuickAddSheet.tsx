import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { cn, taskMeta, categoryMeta, haptic } from "../lib/ui";
import type { GoalCategory, TaskType } from "../types";
import { todayISO } from "../lib/date";
import Sheet from "./Sheet";

export type AddMode = "task" | "workout" | "study" | "habit" | "goal" | "note";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: AddMode;
  /** date plan items are added to (defaults to today) */
  date?: string;
}

const inputCls =
  "w-full rounded-2xl border hairline surface px-4 py-3 text-base text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

const labelCls = "mb-1.5 block text-sm font-medium text-ink-mute";

const MODES: { key: AddMode; label: string }[] = [
  { key: "task", label: "Task" },
  { key: "workout", label: "Workout" },
  { key: "study", label: "Study" },
  { key: "habit", label: "Habit" },
  { key: "goal", label: "Goal" },
  { key: "note", label: "Note" },
];

export default function QuickAddSheet({ open, onClose, initialMode = "task", date }: Props) {
  const { addItem, addGoal, addHabit, addNote } = useStore();
  const [mode, setMode] = useState<AddMode>(initialMode);

  // form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<GoalCategory>("fitness");
  const [deadline, setDeadline] = useState("");
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const reset = () => {
    setTitle("");
    setTime("");
    setTarget("");
    setUnit("");
    setDeadline("");
    setMood(3);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    const t = title.trim();
    if (mode === "note") {
      if (!t) return;
      addNote(t, mood);
    } else if (mode === "goal") {
      if (!t || !target) return;
      addGoal({
        title: t,
        category,
        target: Number(target),
        unit: unit || "units",
        deadline: deadline || undefined,
      });
    } else if (mode === "habit") {
      if (!t) return;
      addHabit(t);
    } else {
      if (!t) return;
      addItem({
        title: t,
        type: mode as TaskType,
        date: date ?? todayISO(),
        time: time || undefined,
        target: target ? Number(target) : undefined,
        unit: unit || undefined,
      });
    }
    haptic(12);
    close();
  };

  const isPlanItem = ["task", "workout", "study", "habit"].includes(mode);

  return (
    <Sheet open={open} onClose={close} title="Quick Add">
      {/* Mode selector */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              haptic();
            }}
            className={cn(
              "cursor-pointer rounded-2xl py-2.5 text-sm font-medium transition-colors",
              mode === m.key
                ? "bg-primary text-white shadow-glow-sm"
                : "surface text-ink-mute surface-hover",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {mode !== "note" && (
          <div>
            <label className={labelCls} htmlFor="qa-title">
              Title
            </label>
            <input
              id="qa-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === "goal"
                  ? "e.g. Lose 15 KG"
                  : mode === "habit"
                    ? "e.g. Drink 3L water"
                    : "e.g. Run 5 KM"
              }
              className={inputCls}
            />
          </div>
        )}

        {/* Time — for scheduled plan items */}
        {(mode === "task" || mode === "workout" || mode === "study") && (
          <div>
            <label className={labelCls} htmlFor="qa-time">
              Time (optional)
            </label>
            <input
              id="qa-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputCls}
            />
          </div>
        )}

        {/* Target/unit — progress tasks & goals */}
        {(mode === "workout" || mode === "study" || mode === "goal") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="qa-target">
                Target {mode !== "goal" && "(optional)"}
              </label>
              <input
                id="qa-target"
                type="number"
                inputMode="numeric"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={mode === "study" ? "120" : "5"}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="qa-unit">
                Unit
              </label>
              <input
                id="qa-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder={mode === "study" ? "Min" : mode === "goal" ? "KG" : "KM"}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Goal category + deadline */}
        {mode === "goal" && (
          <>
            <div>
              <span className={labelCls}>Category</span>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(categoryMeta) as GoalCategory[]).map((c) => {
                  const M = categoryMeta[c];
                  const Icon = M.icon;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-1 rounded-2xl py-2.5 text-xs transition-colors",
                        category === c ? cn(M.bg, M.text, "ring-1", M.ring) : "surface text-ink-mute",
                      )}
                    >
                      <Icon size={18} />
                      {M.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="qa-deadline">
                Deadline (optional)
              </label>
              <input
                id="qa-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputCls}
              />
            </div>
          </>
        )}

        {/* Note */}
        {mode === "note" && (
          <>
            <div>
              <span className={labelCls}>How was today?</span>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(m as 1 | 2 | 3 | 4 | 5)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-2xl py-2.5 text-lg transition-colors",
                      mood === m ? "bg-primary text-white" : "surface",
                    )}
                  >
                    {["😞", "😕", "😐", "🙂", "😄"][m - 1]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="qa-note">
                Journal
              </label>
              <textarea
                id="qa-note"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={4}
                placeholder="What happened today…"
                className={cn(inputCls, "resize-none")}
              />
            </div>
          </>
        )}

        <button
          onClick={submit}
          className="btn-primary w-full py-3.5 text-base"
        >
          Add {isPlanItem ? taskMeta[mode as TaskType].label : MODES.find((m) => m.key === mode)?.label}
        </button>
      </div>
    </Sheet>
  );
}

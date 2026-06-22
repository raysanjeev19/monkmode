import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { useStore } from "../store/useStore";
import { cn, taskMeta, categoryMeta, priorityMeta, haptic } from "../lib/ui";
import type { GoalCategory, Priority, Repeat, TaskType } from "../types";
import { todayISO } from "../lib/date";
import Sheet from "./Sheet";

export type AddMode = "task" | "workout" | "study" | "habit" | "goal" | "note";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: AddMode;
  /** when true, lock to `initialMode` and hide the mode switcher */
  lockMode?: boolean;
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

// Modes offered in the quick-add switcher. Habits, goals and notes are each
// added from where they live (Profile / Goals page), so the planner "+" only
// covers plan items.
const SWITCHER_MODES: AddMode[] = ["task", "workout", "study"];

export default function QuickAddSheet({ open, onClose, initialMode = "task", lockMode = false, date }: Props) {
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
  const [priority, setPriority] = useState<Priority>("med");
  const [repeat, setRepeat] = useState<Repeat>("none");
  const [tags, setTags] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subDraft, setSubDraft] = useState("");

  const reset = () => {
    setTitle("");
    setTime("");
    setTarget("");
    setUnit("");
    setDeadline("");
    setMood(3);
    setPriority("med");
    setRepeat("none");
    setTags("");
    setSubtasks([]);
    setSubDraft("");
  };

  // Reset the form when the sheet OPENS (not on close) so the content stays
  // stable while it slides away — otherwise clearing fields mid-exit makes the
  // sheet visibly collapse before it finishes animating out.
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode]);

  const addSubDraft = () => {
    const t = subDraft.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, t]);
    setSubDraft("");
  };

  const close = () => {
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
        priority,
        repeat,
        tags: tags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        subtasks,
      });
    }
    haptic(12);
    close();
  };

  const isPlanItem = ["task", "workout", "study", "habit"].includes(mode);

  const sheetTitle = lockMode
    ? `Add ${MODES.find((m) => m.key === mode)?.label ?? ""}`
    : "Quick Add";

  return (
    <Sheet
      open={open}
      onClose={close}
      title={sheetTitle}
      footer={
        <button onClick={submit} className="btn-primary w-full py-3.5 text-base">
          Add {isPlanItem ? taskMeta[mode as TaskType].label : MODES.find((m) => m.key === mode)?.label}
        </button>
      }
    >
      {/* Mode selector — hidden when locked to a single mode */}
      {!lockMode && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {MODES.filter((m) => SWITCHER_MODES.includes(m.key)).map((m) => (
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
      )}

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

        {/* Priority + Repeat — for scheduled plan items */}
        {(mode === "task" || mode === "workout" || mode === "study") && (
          <>
            <div>
              <span className={labelCls}>Priority</span>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "med", "high"] as Priority[]).map((p) => {
                  const M = priorityMeta[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-medium transition-colors",
                        priority === p ? cn(M.bg, M.text) : "surface text-ink-mute",
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", M.dot)} />
                      {M.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className={labelCls}>Repeat</span>
              <div className="grid grid-cols-3 gap-2">
                {(["none", "daily", "weekly"] as Repeat[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRepeat(r)}
                    className={cn(
                      "cursor-pointer rounded-2xl py-2.5 text-sm font-medium capitalize transition-colors",
                      repeat === r ? "bg-primary text-white" : "surface text-ink-mute",
                    )}
                  >
                    {r === "none" ? "Once" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelCls} htmlFor="qa-tags">
                Tags (optional)
              </label>
              <input
                id="qa-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma separated · e.g. work, urgent"
                className={inputCls}
              />
            </div>

            {/* Subtasks / checklist */}
            <div>
              <span className={labelCls}>Checklist (optional)</span>
              {subtasks.length > 0 && (
                <div className="mb-2 space-y-1.5">
                  {subtasks.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl surface px-3 py-2 text-sm"
                    >
                      <span className="flex-1 truncate">{st}</span>
                      <button
                        type="button"
                        onClick={() => setSubtasks((p) => p.filter((_, i) => i !== idx))}
                        aria-label="Remove step"
                        className="cursor-pointer text-ink-faint hover:text-danger"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={subDraft}
                  onChange={(e) => setSubDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubDraft();
                    }
                  }}
                  placeholder="Add a step…"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={addSubDraft}
                  aria-label="Add step"
                  className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-2xl bg-primary text-white active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </>
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
      </div>
    </Sheet>
  );
}

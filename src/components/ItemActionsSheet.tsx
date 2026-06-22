import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Minus,
  Plus,
  Pencil,
  Trash2,
  Timer,
  Square,
  CheckSquare,
} from "lucide-react";
import type { PlanItem } from "../types";
import { useStore, subtaskProgress } from "../store/useStore";
import { cn, haptic } from "../lib/ui";
import Sheet from "./Sheet";
import ProgressBar from "./ProgressBar";

const inputCls =
  "w-full rounded-2xl border hairline surface px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

/** Shared bottom-sheet of actions for a plan item (complete / skip / edit / delete / progress / subtasks). */
export default function ItemActionsSheet({
  item,
  open,
  onClose,
}: {
  item: PlanItem;
  open: boolean;
  onClose: () => void;
}) {
  const {
    setItemStatus,
    bumpProgress,
    updateItem,
    removeItem,
    addSubtask,
    toggleSubtask,
    removeSubtask,
  } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [time, setTime] = useState(item.time ?? "");
  const [tags, setTags] = useState((item.tags ?? []).join(", "));
  const [newSub, setNewSub] = useState("");

  const done = item.status === "done";
  const skipped = item.status === "skipped";
  const pct = item.progress
    ? Math.round((item.progress.current / item.progress.target) * 100)
    : 0;
  const sub = subtaskProgress(item);

  const close = () => {
    setEditing(false);
    onClose();
  };

  const saveEdit = () => {
    const cleanedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updateItem(item.id, {
      title: title.trim() || item.title,
      time: time || undefined,
      tags: cleanedTags.length ? cleanedTags : undefined,
    });
    setEditing(false);
  };

  return (
    <Sheet open={open} onClose={close} title={editing ? "Edit" : item.title}>
      {editing ? (
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className={inputCls}
          />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated) e.g. work, urgent"
            className={inputCls}
          />
          <button onClick={saveEdit} className="btn-primary w-full py-3.5">
            Save
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary-soft ring-1 ring-primary/20"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {item.progress && (
            <div className="glass-soft rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-ink-mute">Progress</span>
                <span className="font-semibold">
                  {item.progress.current}/{item.progress.target} {item.progress.unit}
                </span>
              </div>
              <ProgressBar value={pct} barClass={done ? "grad-success" : "grad-primary"} />
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => bumpProgress(item.id, -1)}
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl surface surface-hover"
                  aria-label="Decrease"
                >
                  <Minus size={18} />
                </button>
                <span className="min-w-14 text-center text-2xl font-bold">{item.progress.current}</span>
                <button
                  onClick={() => bumpProgress(item.id, 1)}
                  className="grid h-11 w-11 cursor-pointer place-items-center rounded-2xl bg-primary/20 text-primary-soft ring-1 ring-primary/30 hover:bg-primary/30"
                  aria-label="Increase"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Checklist / subtasks */}
          <div className="glass-soft rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-mute">Checklist</span>
              {sub.total > 0 && (
                <span className="font-semibold">
                  {sub.done}/{sub.total}
                </span>
              )}
            </div>
            {item.subtasks && item.subtasks.length > 0 && (
              <div className="mb-2 space-y-1">
                {item.subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        toggleSubtask(item.id, st.id);
                        haptic();
                      }}
                      aria-label={`Toggle ${st.title}`}
                      className={cn(
                        "shrink-0 cursor-pointer",
                        st.done ? "text-success" : "text-ink-faint",
                      )}
                    >
                      {st.done ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        st.done && "text-ink-mute line-through",
                      )}
                    >
                      {st.title}
                    </span>
                    <button
                      onClick={() => removeSubtask(item.id, st.id)}
                      aria-label="Remove step"
                      className="shrink-0 cursor-pointer text-ink-faint hover:text-danger"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSub.trim()) return;
                addSubtask(item.id, newSub);
                setNewSub("");
                haptic();
              }}
            >
              <input
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                placeholder="Add a step…"
                className="flex-1 rounded-xl border hairline surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                aria-label="Add step"
                className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl bg-primary text-white active:scale-95"
              >
                <Plus size={18} />
              </button>
            </form>
          </div>

          {/* Focus on this task */}
          <button
            onClick={() => {
              haptic(12);
              close();
              navigate(`/focus?task=${encodeURIComponent(item.title)}`);
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary/12 py-3.5 font-medium text-primary-soft ring-1 ring-primary/25 active:scale-[0.98]"
          >
            <Timer size={18} /> Focus on this
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setItemStatus(item.id, done ? "pending" : "done");
                haptic(12);
                close();
              }}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-success/15 py-3.5 font-medium text-success ring-1 ring-success/30 active:scale-[0.98]"
            >
              <Check size={18} /> {done ? "Undo" : "Complete"}
            </button>
            <button
              onClick={() => {
                setItemStatus(item.id, skipped ? "pending" : "skipped");
                close();
              }}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl surface py-3.5 font-medium text-ink-mute ring-1 ring-line active:scale-[0.98]"
            >
              <X size={18} /> {skipped ? "Unskip" : "Skip"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl surface py-3.5 font-medium text-ink ring-1 ring-line active:scale-[0.98]"
            >
              <Pencil size={18} /> Edit
            </button>
            <button
              onClick={() => {
                removeItem(item.id);
                close();
              }}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-danger/10 py-3.5 font-medium text-danger ring-1 ring-danger/30 active:scale-[0.98]"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

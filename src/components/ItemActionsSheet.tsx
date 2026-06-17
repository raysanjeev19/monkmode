import { useState } from "react";
import { Check, X, Minus, Plus, Pencil, Trash2 } from "lucide-react";
import type { PlanItem } from "../types";
import { useStore } from "../store/useStore";
import { haptic } from "../lib/ui";
import Sheet from "./Sheet";
import ProgressBar from "./ProgressBar";

const inputCls =
  "w-full rounded-2xl border hairline surface px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

/** Shared bottom-sheet of actions for a plan item (complete / skip / edit / delete / progress). */
export default function ItemActionsSheet({
  item,
  open,
  onClose,
}: {
  item: PlanItem;
  open: boolean;
  onClose: () => void;
}) {
  const { setItemStatus, bumpProgress, updateItem, removeItem } = useStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [time, setTime] = useState(item.time ?? "");

  const done = item.status === "done";
  const skipped = item.status === "skipped";
  const pct = item.progress
    ? Math.round((item.progress.current / item.progress.target) * 100)
    : 0;

  const close = () => {
    setEditing(false);
    onClose();
  };

  const saveEdit = () => {
    updateItem(item.id, { title: title.trim() || item.title, time: time || undefined });
    setEditing(false);
  };

  return (
    <Sheet open={open} onClose={close} title={editing ? "Edit" : item.title}>
      {editing ? (
        <div className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          <button onClick={saveEdit} className="btn-primary w-full py-3.5">
            Save
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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

import { useState } from "react";
import { Check, X, Clock, Repeat as RepeatIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { PlanItem } from "../types";
import { cn, taskMeta, priorityMeta, haptic } from "../lib/ui";
import ProgressBar from "./ProgressBar";
import ItemActionsSheet from "./ItemActionsSheet";

export default function PlanItemCard({ item, index = 0 }: { item: PlanItem; index?: number }) {
  const [open, setOpen] = useState(false);

  const M = taskMeta[item.type];
  const Icon = M.icon;
  const done = item.status === "done";
  const skipped = item.status === "skipped";
  const pct = item.progress
    ? Math.round((item.progress.current / item.progress.target) * 100)
    : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.25) }}
        onClick={() => {
          haptic();
          setOpen(true);
        }}
        className={cn(
          "glass flex cursor-pointer items-center gap-3.5 rounded-lg p-4 transition-transform active:scale-[0.99]",
          (done || skipped) && "opacity-60",
        )}
      >
        <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[16px] ring-1", M.bg, M.text, M.ring)}>
          <Icon size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {item.priority && (
              <span className={cn("h-2 w-2 shrink-0 rounded-full", priorityMeta[item.priority].dot)} />
            )}
            <p className={cn("truncate font-semibold", done && "text-ink-mute line-through")}>
              {item.title}
            </p>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-mute">
            {item.time && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {item.time}
              </span>
            )}
            <span className={M.text}>{M.label}</span>
            {(item.repeat || item.seriesId) && <RepeatIcon size={12} className="text-ink-faint" />}
            {item.progress && (
              <span>
                {item.progress.current}/{item.progress.target} {item.progress.unit}
              </span>
            )}
          </div>
          {item.progress && (
            <ProgressBar value={pct} className="mt-2" barClass={done ? "grad-success" : "grad-primary"} />
          )}
        </div>

        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1",
            done
              ? "bg-success text-white ring-success"
              : skipped
                ? "surface text-ink-faint ring-line"
                : "text-ink-faint ring-line",
          )}
        >
          {done ? <Check size={16} /> : skipped ? <X size={14} /> : null}
        </span>
      </motion.div>

      <ItemActionsSheet item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

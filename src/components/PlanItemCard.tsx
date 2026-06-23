import { useState } from "react";
import { Check, X, Clock, Repeat as RepeatIcon, ListChecks } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { PlanItem } from "../types";
import { subtaskProgress, safePct } from "../store/useStore";
import { cn, taskMeta, priorityMeta, haptic } from "../lib/ui";
import ProgressBar from "./ProgressBar";
import ItemActionsSheet from "./ItemActionsSheet";

export default function PlanItemCard({ item, index = 0 }: { item: PlanItem; index?: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const M = taskMeta[item.type];
  const Icon = M.icon;
  const done = item.status === "done";
  const skipped = item.status === "skipped";
  const pct = item.progress ? safePct(item.progress.current, item.progress.target) : 0;
  const sub = subtaskProgress(item);

  return (
    <>
      <motion.div
        initial={reduce ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: reduce ? 0 : Math.min(index * 0.04, 0.25) }}
        onClick={() => {
          haptic();
          setOpen(true);
        }}
        className={cn(
          "glass flex cursor-pointer items-center gap-3.5 rounded-lg p-4 transition-transform active:scale-[0.99]",
          done && "opacity-60",
          // Skipped items read differently: dimmed, dashed outline, no strong fill.
          skipped && "opacity-50 border border-dashed border-line bg-transparent",
        )}
      >
        <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[16px] ring-1", M.bg, M.text, M.ring)}>
          <Icon size={22} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {item.priority && (
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", priorityMeta[item.priority].dot)}
                title={`${priorityMeta[item.priority].label} priority`}
                aria-label={`${priorityMeta[item.priority].label} priority`}
              />
            )}
            <p className={cn("truncate font-semibold", (done || skipped) && "text-ink-mute line-through")}>
              {item.title}
            </p>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-mute">
            {skipped && (
              <span className="rounded-full bg-ink-faint/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                Skipped
              </span>
            )}
            {item.time && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {item.time}
              </span>
            )}
            <span className={M.text}>{M.label}</span>
            {(item.repeat || item.seriesId) && <RepeatIcon size={12} className="text-ink-faint" />}
            {sub.total > 0 && (
              <span className="flex items-center gap-1">
                <ListChecks size={12} /> {sub.done}/{sub.total}
              </span>
            )}
            {item.progress && (
              <span>
                {item.progress.current}/{item.progress.target} {item.progress.unit}
              </span>
            )}
          </div>
          {item.tags && item.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary-soft"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
          {item.progress && (
            <ProgressBar value={pct} className="mt-2" barClass={done ? "grad-success" : "grad-primary"} />
          )}
        </div>

        <span
          role="img"
          aria-label={done ? "Completed" : skipped ? "Skipped" : "Pending"}
          title={done ? "Completed" : skipped ? "Skipped" : "Pending"}
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

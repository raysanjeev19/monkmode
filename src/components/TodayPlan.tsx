import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { PlanItem } from "../types";
import { useStore, itemsForDate } from "../store/useStore";
import { todayISO } from "../lib/date";
import { cn, taskMeta, haptic } from "../lib/ui";
import GlassCard from "./GlassCard";
import ItemActionsSheet from "./ItemActionsSheet";

export default function TodayPlan() {
  const items = useStore((s) => s.items);
  const list = itemsForDate(items, todayISO());
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = list.find((i) => i.id === activeId) ?? null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">Today's Plan</h2>
        <Link to="/planner" className="flex items-center gap-0.5 text-sm font-semibold text-primary">
          View all <ChevronRight size={15} />
        </Link>
      </div>

      {list.length === 0 ? (
        <GlassCard className="py-8 text-center text-ink-mute">
          Nothing planned yet. Tap + to add your first task.
        </GlassCard>
      ) : (
        <GlassCard className="px-3 py-1.5" index={0}>
          {list.map((item, i) => (
            <Row
              key={item.id}
              item={item}
              isFirst={i === 0}
              isLast={i === list.length - 1}
              onOpen={() => {
                haptic();
                setActiveId(item.id);
              }}
            />
          ))}
        </GlassCard>
      )}

      {active && (
        <ItemActionsSheet key={active.id} item={active} open onClose={() => setActiveId(null)} />
      )}
    </section>
  );
}

function Row({
  item,
  isFirst,
  isLast,
  onOpen,
}: {
  item: PlanItem;
  isFirst: boolean;
  isLast: boolean;
  onOpen: () => void;
}) {
  const M = taskMeta[item.type];
  const Icon = M.icon;
  const done = item.status === "done";
  const skipped = item.status === "skipped";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-3 py-2.5 active:opacity-70"
    >
      {/* time gutter */}
      <span className="w-11 shrink-0 text-right text-[11px] font-semibold text-ink-mute">
        {item.time ?? ""}
      </span>

      {/* timeline line + node */}
      <div className="relative flex w-4 shrink-0 items-center justify-center self-stretch">
        <span
          className={cn(
            "absolute left-1/2 w-px -translate-x-1/2 bg-[rgb(var(--line)/0.18)]",
            isFirst ? "bottom-0 top-1/2" : isLast ? "bottom-1/2 top-0" : "inset-y-0",
          )}
        />
        <span
          className={cn(
            "relative z-10 h-3 w-3 rounded-full ring-[3px] ring-card",
            done ? "bg-primary" : "border-2 border-[rgb(var(--line)/0.4)] bg-card",
          )}
        />
      </div>

      {/* icon chip */}
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", M.bg, M.text)}>
        <Icon size={17} />
      </span>

      {/* content */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", (done || skipped) && "text-ink-mute line-through")}>
          {item.title}
        </p>
        <p className="truncate text-xs text-ink-mute">{M.label}</p>
      </div>

      {/* right indicator */}
      {item.progress ? (
        <span className={cn("shrink-0 text-xs font-bold", done ? "text-success" : "text-primary")}>
          {item.progress.current}/{item.progress.target} {item.progress.unit}
        </span>
      ) : done ? (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-white">
          <Check size={14} />
        </span>
      ) : (
        <ChevronRight size={18} className="shrink-0 text-ink-faint" />
      )}
    </motion.div>
  );
}

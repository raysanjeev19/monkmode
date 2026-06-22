import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, X, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import {
  useStore,
  itemsForDate,
  dayCompletion,
  searchItems,
  allTags,
} from "../store/useStore";
import {
  todayISO,
  weekDays,
  monthGrid,
  monthLabel,
  formatLong,
  fromISO,
  isToday,
  shiftISO,
} from "../lib/date";
import { cn, haptic } from "../lib/ui";
import GlassCard from "../components/GlassCard";
import PlanItemCard from "../components/PlanItemCard";
import QuickAddSheet from "../components/QuickAddSheet";
import WorkoutDaySheet from "../components/WorkoutDaySheet";
import { useWorkoutPlan } from "../lib/useWorkoutPlan";
import { resolveWorkout, type WorkoutPlan } from "../lib/workoutPlan";

type View = "day" | "week" | "month";

export default function Planner() {
  const { items, ensureRecurring } = useStore();
  const [view, setView] = useState<View>("day");
  const [cursor, setCursor] = useState(todayISO());
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined);

  const tags = allTags(items);
  const searching = query.trim() !== "" || !!tagFilter;
  const results = searchItems(items, query, tagFilter);

  // generate recurring occurrences for the viewed day
  useEffect(() => {
    ensureRecurring(cursor);
  }, [cursor, ensureRecurring]);

  const shift = (n: number) => {
    const step = view === "month" ? n * 30 : view === "week" ? n * 7 : n;
    setCursor(shiftISO(cursor, step));
    haptic();
  };

  return (
    <div className="space-y-3">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Planner</h1>
          <p className="mt-0.5 text-sm text-ink-mute">Plan your week. Stay consistent.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow-sm active:scale-[0.97]"
        >
          <Plus size={16} /> Add
        </button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, tags, notes…"
          className="w-full rounded-2xl border hairline surface py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-ink-faint hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tag filter chips */}
      {tags.length > 0 && (
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTagFilter((cur) => (cur === t ? undefined : t));
                haptic();
              }}
              className={cn(
                "shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                tagFilter === t
                  ? "bg-primary text-white shadow-glow-sm"
                  : "surface text-ink-mute surface-hover",
              )}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {searching ? (
        <SearchResults results={results} count={results.length} />
      ) : (
        <>
          {/* View switcher */}
          <div className="glass-soft grid grid-cols-3 gap-1 rounded-2xl p-1">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  haptic();
                }}
                className={cn(
                  "cursor-pointer rounded-xl py-2 text-sm font-medium capitalize transition-colors",
                  view === v ? "bg-primary text-white shadow-glow-sm" : "text-ink-mute hover:text-ink",
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Period nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => shift(-1)}
              aria-label="Previous"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl surface surface-hover"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-medium">
              {view === "month" ? monthLabel(cursor) : view === "week" ? `Week of ${format(fromISO(weekDays(cursor)[0]), "d MMM")}` : formatLong(cursor)}
            </p>
            <button
              onClick={() => shift(1)}
              aria-label="Next"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl surface surface-hover"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {view === "day" && <DayView date={cursor} items={items} />}
          {view === "week" && (
            <WeekView cursor={cursor} selected={cursor} onSelect={setCursor} items={items} />
          )}
          {view === "month" && (
            <MonthView cursor={cursor} selected={cursor} onSelect={setCursor} items={items} />
          )}
        </>
      )}

      <QuickAddSheet open={addOpen} onClose={() => setAddOpen(false)} date={cursor} />
    </div>
  );
}

function SearchResults({
  results,
  count,
}: {
  results: ReturnType<typeof useStore.getState>["items"];
  count: number;
}) {
  if (count === 0)
    return (
      <GlassCard className="py-10 text-center text-ink-mute">
        No matching tasks.
      </GlassCard>
    );
  return (
    <div className="space-y-2.5">
      <p className="px-1 text-xs text-ink-mute">
        {count} result{count === 1 ? "" : "s"}
      </p>
      {results.map((item, i) => (
        <div key={item.id}>
          <p className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            {formatLong(item.date)}
          </p>
          <PlanItemCard item={item} index={i} />
        </div>
      ))}
    </div>
  );
}

function DayView({ date, items }: { date: string; items: ReturnType<typeof useStore.getState>["items"] }) {
  const plan = useWorkoutPlan();
  const [woOpen, setWoOpen] = useState(false);
  const list = itemsForDate(items, date);
  return (
    <div className="space-y-2.5">
      {plan && <WorkoutCard onOpen={() => setWoOpen(true)} plan={plan} date={date} />}
      {list.length === 0 ? (
        <GlassCard className="py-8 text-center text-ink-mute">
          No tasks for this day.
        </GlassCard>
      ) : (
        list.map((item, i) => <PlanItemCard key={item.id} item={item} index={i} />)
      )}
      {plan && (
        <WorkoutDaySheet open={woOpen} onClose={() => setWoOpen(false)} plan={plan} date={date} />
      )}
    </div>
  );
}

/** Tappable summary of the planned workout session for `date`. */
function WorkoutCard({
  plan,
  date,
  onOpen,
}: {
  plan: WorkoutPlan;
  date: string;
  onOpen: () => void;
}) {
  const w = resolveWorkout(plan, date);
  return (
    <button
      onClick={onOpen}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.07] px-3.5 py-3 text-left transition-colors hover:bg-primary/10 active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
        <Dumbbell size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{w.splitLabel}</p>
        <p className="truncate text-xs text-ink-mute">
          Month {w.monthIndex + 1} · {w.phase} · {w.exerciseCount} ex · {w.setCount} sets
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-primary" />
    </button>
  );
}

function WeekView({
  cursor,
  selected,
  onSelect,
  items,
}: {
  cursor: string;
  selected: string;
  onSelect: (d: string) => void;
  items: ReturnType<typeof useStore.getState>["items"];
}) {
  const days = weekDays(cursor);
  return (
    <>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const count = items.filter((i) => i.date === d).length;
          const pct = dayCompletion(items, d);
          const active = d === selected;
          return (
            <button
              key={d}
              onClick={() => onSelect(d)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-2xl py-2.5 transition-colors",
                active ? "bg-primary text-white shadow-glow-sm" : "surface surface-hover",
                isToday(d) && !active && "ring-1 ring-primary/40",
              )}
            >
              <span className="text-[10px] uppercase opacity-70">{format(fromISO(d), "EEEEE")}</span>
              <span className="text-sm font-bold">{format(fromISO(d), "d")}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  count === 0 ? "bg-transparent" : pct === 100 ? "bg-success" : active ? "bg-white" : "bg-primary",
                )}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <DayView date={selected} items={items} />
      </div>
    </>
  );
}

function MonthView({
  cursor,
  selected,
  onSelect,
  items,
}: {
  cursor: string;
  selected: string;
  onSelect: (d: string) => void;
  items: ReturnType<typeof useStore.getState>["items"];
}) {
  const grid = monthGrid(cursor);
  const monthNum = format(fromISO(cursor), "M");
  return (
    <>
      <GlassCard className="p-3" index={0}>
        <div className="mb-2 grid grid-cols-7 text-center text-[10px] uppercase text-ink-faint">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d) => {
            const inMonth = format(fromISO(d), "M") === monthNum;
            const count = items.filter((i) => i.date === d).length;
            const active = d === selected;
            return (
              <button
                key={d}
                onClick={() => onSelect(d)}
                className={cn(
                  "relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl text-sm transition-colors",
                  active ? "bg-primary text-white" : "surface-hover",
                  !inMonth && "opacity-30",
                  isToday(d) && !active && "ring-1 ring-primary/50",
                )}
              >
                {format(fromISO(d), "d")}
                {count > 0 && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1 w-1 rounded-full",
                      active ? "bg-white" : "bg-primary",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>
      <div className="mt-4">
        <h3 className="mb-3 px-1 text-sm font-semibold text-ink-mute">{formatLong(selected)}</h3>
        <DayView date={selected} items={items} />
      </div>
    </>
  );
}

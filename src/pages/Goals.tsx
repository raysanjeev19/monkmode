import { useEffect, useState } from "react";
import { Plus, Minus, Trash2, Pencil, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { useStore } from "../store/useStore";
import { categoryMeta, cn, haptic } from "../lib/ui";
import type { Goal, GoalCategory } from "../types";
import { fromISO } from "../lib/date";
import GlassCard from "../components/GlassCard";
import ProgressBar from "../components/ProgressBar";
import ProgressRing from "../components/ProgressRing";
import Sheet from "../components/Sheet";
import QuickAddSheet from "../components/QuickAddSheet";

const ALL = "all" as const;

export default function Goals() {
  const { goals } = useStore();
  const [filter, setFilter] = useState<GoalCategory | typeof ALL>(ALL);
  const [active, setActive] = useState<Goal | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = filter === ALL ? goals : goals.filter((g) => g.category === filter);
  // keep the active sheet's goal in sync with the store
  const liveActive = active ? goals.find((g) => g.id === active.id) ?? null : null;

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-glow-sm active:scale-[0.97]"
        >
          <Plus size={16} /> Add
        </button>
      </header>

      {/* Category filter */}
      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
        <Chip label="All" active={filter === ALL} onClick={() => setFilter(ALL)} />
        {(Object.keys(categoryMeta) as GoalCategory[]).map((c) => (
          <Chip
            key={c}
            label={categoryMeta[c].label}
            active={filter === c}
            onClick={() => setFilter(c)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="py-10 text-center text-ink-mute">No goals here yet.</GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((g, i) => (
            <GoalCard key={g.id} goal={g} index={i} onOpen={() => setActive(g)} />
          ))}
        </div>
      )}

      <GoalSheet goal={liveActive} onClose={() => setActive(null)} />
      <QuickAddSheet open={addOpen} initialMode="goal" onClose={() => setAddOpen(false)} />
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-white shadow-glow-sm" : "surface text-ink-mute surface-hover",
      )}
    >
      {label}
    </button>
  );
}

function deadlineLabel(deadline?: string): string | null {
  if (!deadline) return null;
  const days = differenceInCalendarDays(fromISO(deadline), new Date());
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return `${days} days left`;
}

function GoalCard({ goal, index, onOpen }: { goal: Goal; index: number; onOpen: () => void }) {
  const M = categoryMeta[goal.category];
  const Icon = M.icon;
  const pct = Math.round((goal.current / goal.target) * 100);
  const dl = deadlineLabel(goal.deadline);
  const doneMs = goal.milestones.filter((m) => m.done).length;

  return (
    <GlassCard index={index} onClick={onOpen} className="p-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={pct} size={68} stroke={7} color={pct === 100 ? "#22C55E" : "#ED7D1C"}>
          <span className="text-sm font-bold">{pct}%</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("grid h-6 w-6 place-items-center rounded-lg", M.bg, M.text)}>
              <Icon size={14} />
            </span>
            <span className={cn("text-xs font-medium", M.text)}>{M.label}</span>
          </div>
          <h3 className="mt-1 truncate text-lg font-semibold">{goal.title}</h3>
          <p className="text-sm text-ink-mute">
            {goal.current}/{goal.target} {goal.unit}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
            {dl && (
              <span className={cn("flex items-center gap-1", dl === "Overdue" && "text-danger")}>
                <CalendarClock size={12} /> {dl}
              </span>
            )}
            {goal.milestones.length > 0 && (
              <span>
                {doneMs}/{goal.milestones.length} milestones
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

const gField =
  "w-full rounded-2xl border hairline surface px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
const gLabel = "mb-1.5 block text-sm font-medium text-ink-mute";

function GoalSheet({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const { bumpGoal, toggleMilestone, removeGoal, updateGoal } = useStore();
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eTarget, setETarget] = useState("");
  const [eUnit, setEUnit] = useState("");
  const [eDeadline, setEDeadline] = useState("");

  useEffect(() => {
    setEditing(false);
  }, [goal?.id]);

  if (!goal) return null;
  const M = categoryMeta[goal.category];
  const pct = Math.round((goal.current / goal.target) * 100);

  const openEdit = () => {
    setETitle(goal.title);
    setETarget(String(goal.target));
    setEUnit(goal.unit);
    setEDeadline(goal.deadline ?? "");
    setEditing(true);
  };
  const saveEdit = () => {
    updateGoal(goal.id, {
      title: eTitle.trim() || goal.title,
      target: Number(eTarget) > 0 ? Number(eTarget) : goal.target,
      unit: eUnit.trim() || goal.unit,
      deadline: eDeadline || undefined,
    });
    setEditing(false);
    haptic();
  };

  if (editing) {
    return (
      <Sheet open onClose={onClose} title="Edit Goal">
        <div className="space-y-4">
          <div>
            <label className={gLabel} htmlFor="g-title">Title</label>
            <input id="g-title" value={eTitle} onChange={(e) => setETitle(e.target.value)} className={gField} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={gLabel} htmlFor="g-target">Target</label>
              <input id="g-target" type="number" inputMode="numeric" value={eTarget} onChange={(e) => setETarget(e.target.value)} className={gField} />
            </div>
            <div>
              <label className={gLabel} htmlFor="g-unit">Unit</label>
              <input id="g-unit" value={eUnit} onChange={(e) => setEUnit(e.target.value)} className={gField} />
            </div>
          </div>
          <div>
            <label className={gLabel} htmlFor="g-deadline">Deadline</label>
            <input id="g-deadline" type="date" value={eDeadline} onChange={(e) => setEDeadline(e.target.value)} className={gField} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setEditing(false)} className="cursor-pointer rounded-2xl surface py-3.5 font-medium text-ink-mute ring-1 ring-line active:scale-[0.98]">
              Cancel
            </button>
            <button onClick={saveEdit} className="btn-primary py-3.5">Save</button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={!!goal} onClose={onClose} title={goal.title}>
      <div className="space-y-3">
        <div className="glass-soft flex items-center gap-4 rounded-2xl p-4">
          <ProgressRing value={pct} size={84} stroke={9} color={pct === 100 ? "#22C55E" : "#ED7D1C"}>
            <span className="font-bold">{pct}%</span>
          </ProgressRing>
          <div className="flex-1">
            <p className={cn("text-sm font-medium", M.text)}>{M.label}</p>
            <p className="text-2xl font-bold">
              {goal.current}
              <span className="text-base font-normal text-ink-mute">
                {" "}
                / {goal.target} {goal.unit}
              </span>
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => bumpGoal(goal.id, -1)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl surface surface-hover"
                aria-label="Decrease"
              >
                <Minus size={18} />
              </button>
              <button
                onClick={() => {
                  bumpGoal(goal.id, 1);
                  haptic();
                }}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl bg-primary/20 text-primary-soft ring-1 ring-primary/30 hover:bg-primary/30"
                aria-label="Increase"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <ProgressBar value={pct} barClass={pct === 100 ? "grad-success" : "grad-primary"} />

        {goal.milestones.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink-mute">Milestones</h3>
            <div className="space-y-2">
              {goal.milestones.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    toggleMilestone(goal.id, m.id);
                    haptic();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl surface px-4 py-3 text-left transition-colors surface-hover"
                >
                  {m.done ? (
                    <CheckCircle2 size={20} className="shrink-0 text-success" />
                  ) : (
                    <Circle size={20} className="shrink-0 text-ink-faint" />
                  )}
                  <span className={cn("text-sm", m.done && "text-ink-mute line-through")}>
                    {m.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={openEdit}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl surface py-3 font-medium text-ink ring-1 ring-line active:scale-[0.98]"
          >
            <Pencil size={18} /> Edit
          </button>
          <button
            onClick={() => {
              removeGoal(goal.id);
              onClose();
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-danger/10 py-3 font-medium text-danger ring-1 ring-danger/30 active:scale-[0.98]"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>
    </Sheet>
  );
}

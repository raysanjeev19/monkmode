import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { Flame } from "lucide-react";
import { useStore, dayCompletion, habitStreak, longestHabitStreak, wasActive } from "../store/useStore";
import { lastNDays, fromISO, isToday } from "../lib/date";
import { cn } from "../lib/ui";
import GlassCard from "../components/GlassCard";

/** Placeholder shown in place of a chart when there's no data yet. */
function EmptyChart({ height, label }: { height: number; label: string }) {
  return (
    <div
      className="grid place-items-center rounded-2xl surface text-center text-sm text-ink-mute"
      style={{ height }}
    >
      <span className="px-6">{label}</span>
    </div>
  );
}

const tooltipStyle = {
  background: "rgba(36,31,24,0.96)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#F7F2E9",
  fontSize: 12,
};

export default function Progress() {
  const { items, weight, habits, profile } = useStore();
  const days = lastNDays(7);

  const sumByDay = (type: string, unit?: string) =>
    days.map((d) => {
      const cur = items
        .filter((i) => i.date === d && i.type === type && i.progress && (!unit || i.progress.unit === unit))
        .reduce((acc, i) => acc + (i.progress?.current ?? 0), 0);
      return { day: format(fromISO(d), "EEE"), value: cur };
    });

  const completion = days.map((d) => ({
    day: format(fromISO(d), "EEE"),
    value: dayCompletion(items, d),
  }));
  const running = sumByDay("workout", "KM");
  const studyMin = sumByDay("study", "Min").map((p) => ({ day: p.day, value: Math.round((p.value / 60) * 10) / 10 }));
  const weightData = weight.map((w) => ({ day: format(fromISO(w.date), "d MMM"), kg: w.kg }));

  const hasWeight = weightData.length > 0;
  const hasRunning = running.some((p) => p.value > 0);
  const hasStudy = studyMin.some((p) => p.value > 0);
  const hasItems = items.length > 0;

  // Consistency heatmap — last 70 days of "active" (a task done or habit logged).
  const heatDays = lastNDays(70);
  const activeCount = heatDays.filter((d) => wasActive(items, habits, d)).length;

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="mt-0.5 text-sm text-ink-mute">Your last 7 days at a glance</p>
      </header>

      {/* Text equivalent of the charts below for screen readers. */}
      <p className="sr-only">
        Last 7 days. Task completion: {completion.map((c) => `${c.day} ${c.value} percent`).join(", ")}.
        Running kilometres: {running.map((r) => `${r.day} ${r.value}`).join(", ")}.
        Study hours: {studyMin.map((s) => `${s.day} ${s.value}`).join(", ")}.
        {hasWeight ? ` Weight in kilograms: ${weightData.map((w) => w.kg).join(", ")}.` : ""}
      </p>

      {/* Weight */}
      <GlassCard className="p-4" index={0}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Weight</h2>
          <span className="text-sm text-ink-mute">
            {profile.weightKg} → {profile.targetWeightKg} kg
          </span>
        </div>
        {hasWeight ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weightData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,86,46,0.16)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="kg" stroke="#ED7D1C" strokeWidth={3} dot={{ r: 3, fill: "#ED7D1C" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart height={160} label="Update your weight in Profile to start the trend line." />
        )}
      </GlassCard>

      {/* Completion % */}
      <GlassCard className="p-4" index={1}>
        <h2 className="mb-3 font-semibold">Task Completion %</h2>
        {hasItems ? (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={completion} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="compFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,86,46,0.16)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Done"]} />
              <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2.5} fill="url(#compFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart height={150} label="Plan and complete tasks to see your completion trend." />
        )}
      </GlassCard>

      {/* Running + Study side by side */}
      <div className="grid grid-cols-1 gap-5">
        <GlassCard className="p-4" index={2}>
          <h2 className="mb-3 font-semibold">Running (KM)</h2>
          {hasRunning ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={running} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,86,46,0.16)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(120,86,46,0.08)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {running.map((_, i) => (
                    <Cell key={i} fill="#F59E0B" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart height={140} label="Log a workout with KM to see your distance." />
          )}
        </GlassCard>

        <GlassCard className="p-4" index={3}>
          <h2 className="mb-3 font-semibold">Study Hours</h2>
          {hasStudy ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={studyMin} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,86,46,0.16)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(120,86,46,0.08)" }} formatter={(v) => [`${v}h`, "Studied"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {studyMin.map((_, i) => (
                    <Cell key={i} fill="#EAB308" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart height={140} label="Log a study session with minutes to see your hours." />
          )}
        </GlassCard>
      </div>

      {/* Consistency heatmap */}
      <GlassCard className="p-4" index={4}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Consistency</h2>
          <span className="text-sm text-ink-mute">{activeCount}/70 active days</span>
        </div>
        <div
          className="grid grid-flow-col grid-rows-7 gap-1"
          role="img"
          aria-label={`Activity heatmap: active on ${activeCount} of the last 70 days.`}
        >
          {heatDays.map((d) => {
            const active = wasActive(items, habits, d);
            return (
              <span
                key={d}
                title={`${format(fromISO(d), "d MMM")}${active ? " · active" : ""}`}
                className={cn(
                  "aspect-square rounded-[3px]",
                  active ? "bg-primary" : "surface-2",
                  isToday(d) && "ring-1 ring-primary/60",
                )}
              />
            );
          })}
        </div>
      </GlassCard>

      {/* Habit streaks */}
      <GlassCard className="p-4" index={5}>
        <h2 className="mb-3 font-semibold">Habit Streaks</h2>
        <div className="space-y-2">
          {habits.length === 0 && <p className="text-sm text-ink-mute">No habits tracked yet.</p>}
          {habits.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl surface px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{h.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-warning">
                <Flame size={15} /> {habitStreak(h)}
              </span>
              <span className="shrink-0 text-xs text-ink-faint">best {longestHabitStreak(h)}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

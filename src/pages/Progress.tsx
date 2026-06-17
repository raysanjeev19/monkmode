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
import { useStore, dayCompletion, habitStreak } from "../store/useStore";
import { lastNDays, fromISO } from "../lib/date";
import GlassCard from "../components/GlassCard";

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

  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="mt-0.5 text-sm text-ink-mute">Your last 7 days at a glance</p>
      </header>

      {/* Weight */}
      <GlassCard className="p-4" index={0}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Weight</h2>
          <span className="text-sm text-ink-mute">
            {profile.weightKg} → {profile.targetWeightKg} kg
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={weightData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,86,46,0.16)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="kg" stroke="#ED7D1C" strokeWidth={3} dot={{ r: 3, fill: "#ED7D1C" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Completion % */}
      <GlassCard className="p-4" index={1}>
        <h2 className="mb-3 font-semibold">Task Completion %</h2>
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
      </GlassCard>

      {/* Running + Study side by side */}
      <div className="grid grid-cols-1 gap-5">
        <GlassCard className="p-4" index={2}>
          <h2 className="mb-3 font-semibold">Running (KM)</h2>
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
        </GlassCard>

        <GlassCard className="p-4" index={3}>
          <h2 className="mb-3 font-semibold">Study Hours</h2>
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
        </GlassCard>
      </div>

      {/* Habit streaks */}
      <GlassCard className="p-4" index={4}>
        <h2 className="mb-3 font-semibold">Habit Streaks</h2>
        <div className="space-y-2">
          {habits.length === 0 && <p className="text-sm text-ink-mute">No habits tracked yet.</p>}
          {habits.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-2xl surface px-4 py-3">
              <span className="text-sm font-medium">{h.title}</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-warning">
                <Flame size={15} /> {habitStreak(h)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

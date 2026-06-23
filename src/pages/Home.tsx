import { Flame, Droplet, Footprints, BookOpen, ListChecks, Plus, Minus, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore, itemsForDate, dayCompletion, computeStreak, safePct } from "../store/useStore";
import { todayISO, formatLong, greeting } from "../lib/date";
import { cn, haptic } from "../lib/ui";
import GlassCard from "../components/GlassCard";
import ProgressRing from "../components/ProgressRing";
import TodayPlan from "../components/TodayPlan";

export default function Home() {
  const { profile, items, water, habits, addWater } = useStore();
  const today = todayISO();
  const todays = itemsForDate(items, today);
  const completion = dayCompletion(items, today);
  const streak = computeStreak(items, habits);

  const tasksDone = todays.filter((i) => i.status === "done").length;

  const sum = (type: string) =>
    todays
      .filter((i) => i.type === type && i.progress)
      .reduce(
        (acc, i) => ({
          cur: acc.cur + (i.progress?.current ?? 0),
          tgt: acc.tgt + (i.progress?.target ?? 0),
        }),
        { cur: 0, tgt: 0 },
      );

  const run = sum("workout");
  const study = sum("study");
  const waterMl = water[today] ?? 0;
  const waterPct = safePct(waterMl, profile.waterTargetMl);

  const cards = [
    {
      label: "Tasks Done",
      value: `${tasksDone}/${todays.length}`,
      icon: ListChecks,
      text: "text-primary",
      soft: "bg-primary/10",
    },
    {
      label: "Running",
      value: run.tgt ? `${run.cur}/${run.tgt} KM` : "—",
      icon: Footprints,
      text: "text-warning",
      soft: "bg-warning/12",
    },
    {
      label: "Study",
      value: study.tgt ? `${study.cur}/${study.tgt} Min` : "—",
      icon: BookOpen,
      text: "text-yellow-600",
      soft: "bg-yellow-500/12",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Brand bar */}
      <div className="grid grid-cols-3 items-center">
        <span className="justify-self-start font-heading text-xl font-extrabold tracking-tight">
          Monk<span className="text-primary">Mode</span>
        </span>
        <img
          src="/logo.png"
          alt="MonkMode logo"
          className="h-14 w-14 justify-self-center object-contain drop-shadow-[0_4px_12px_rgba(225,29,42,0.3)]"
        />
        <Link
          to="/focus"
          aria-label="Focus timer"
          onClick={() => haptic()}
          className="relative grid h-10 w-10 cursor-pointer place-items-center justify-self-end rounded-2xl surface surface-hover"
        >
          <Timer size={19} className="text-primary" />
        </Link>
      </div>

      {/* Greeting + streak */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-mute">{greeting()},</p>
          <h1 className="text-2xl font-extrabold tracking-tight">{profile.name} 👋</h1>
          <p className="mt-0.5 text-sm text-ink-mute">{formatLong(today)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-warning/15 text-warning">
            <Flame size={16} />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-sm font-extrabold">{streak} days</p>
            <p className="text-[10px] text-ink-mute">Current streak</p>
          </div>
        </div>
      </header>

      {/* Hero — Today's Focus */}
      <GlassCard className="relative flex items-center gap-5 overflow-hidden p-5" index={0}>
        {/* warm sun glow */}
        <div className="pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        {/* faint sun + mountains motif */}
        <svg
          className="pointer-events-none absolute bottom-0 right-0 h-24 w-44"
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <circle cx="150" cy="34" r="16" className="fill-[rgb(var(--warning)/0.16)]" />
          <path d="M0 100 L40 52 L66 74 L104 32 L138 64 L172 40 L200 60 L200 100 Z" className="fill-[rgb(var(--primary)/0.10)]" />
          <path d="M70 100 L118 50 L150 78 L182 54 L200 70 L200 100 Z" className="fill-[rgb(var(--primary)/0.16)]" />
        </svg>
        <ProgressRing value={completion} size={108} stroke={11}>
          <div>
            <p className="font-heading text-3xl font-extrabold leading-none text-primary">{completion}%</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">today</p>
          </div>
        </ProgressRing>
        <div className="relative flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Today's Focus</p>
          <h2 className="mt-0.5 text-lg font-bold">
            {completion === 100
              ? "Day complete 🎉"
              : completion >= 50
                ? "Strong progress"
                : "Let's get moving"}
          </h2>
          <p className="mt-1 text-sm text-ink-mute">
            {tasksDone} of {todays.length} done · {todays.length - tasksDone} left
          </p>
        </div>
      </GlassCard>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <GlassCard key={c.label} className="p-4" index={i + 1}>
              <span className={cn("mb-3 grid h-10 w-10 place-items-center rounded-[14px]", c.soft, c.text)}>
                <Icon size={19} />
              </span>
              <p className="font-heading text-lg font-extrabold leading-tight tracking-tight">{c.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-mute">{c.label}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* Water intake */}
      <GlassCard className="p-4" index={4}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-sky-500/12 text-sky-500">
              <Droplet size={19} />
            </span>
            <div>
              <p className="font-semibold">Water Intake</p>
              <p className="text-xs text-ink-mute">
                {waterMl} / {profile.waterTargetMl} ml
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                addWater(-250);
                haptic(8);
              }}
              aria-label="Remove 250ml"
              disabled={waterMl === 0}
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-2xl bg-sky-500/12 text-sky-600 ring-1 ring-sky-500/25 active:scale-[0.97] disabled:opacity-40"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => {
                addWater(250);
                haptic(12);
              }}
              aria-label="Add 250ml"
              className="flex cursor-pointer items-center gap-1 rounded-2xl bg-sky-500/12 px-3 py-2 text-sm font-semibold text-sky-600 ring-1 ring-sky-500/25 active:scale-[0.97]"
            >
              <Plus size={16} /> 250ml
            </button>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${Math.min(100, waterPct)}%` }}
          />
        </div>
      </GlassCard>

      {/* Today's Plan timeline */}
      <TodayPlan />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  ChevronLeft,
  X,
  Settings2,
} from "lucide-react";
import { useFocus, remainingNow, durationFor, type Phase } from "../store/useFocus";
import { cn, haptic } from "../lib/ui";
import { showNotification, notifyPermission } from "../lib/notify";
import GlassCard from "../components/GlassCard";
import ProgressRing from "../components/ProgressRing";

const PHASE_META: Record<Phase, { label: string; color: string; sub: string }> = {
  work: { label: "Focus", color: "#ED7D1C", sub: "Deep work — no distractions" },
  short: { label: "Short break", color: "#22C55E", sub: "Stretch, breathe, hydrate" },
  long: { label: "Long break", color: "#22C55E", sub: "Step away and recharge" },
};

const mmss = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/** Short chime when a phase ends (best-effort; silent if audio is blocked). */
function chime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* no audio available */
  }
}

export default function Focus() {
  const s = useFocus();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [, forceTick] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const setTaskOnce = useRef(false);

  // Seed the focus task from a ?task=… deep-link (e.g. "Focus on this task").
  useEffect(() => {
    if (setTaskOnce.current) return;
    const t = params.get("task");
    if (t) {
      useFocus.getState().setTask(t);
      setTaskOnce.current = true;
      params.delete("task");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  // Drive the countdown + detect phase completion.
  useEffect(() => {
    const id = setInterval(() => {
      const st = useFocus.getState();
      if (st.running && remainingNow(st) <= 0) {
        const finished = st.phase;
        st.complete();
        haptic(40);
        chime();
        if (notifyPermission() === "granted") {
          void showNotification(
            finished === "work" ? "Focus session done 🎯" : "Break over — back to it 💪",
            {
              body:
                finished === "work"
                  ? "Nice work. Time for a break."
                  : "Break finished. Start your next focus session.",
              tag: "focus-phase",
            },
          );
        }
      }
      forceTick((n) => n + 1);
    }, 250);
    return () => clearInterval(id);
  }, []);

  const meta = PHASE_META[s.phase];
  const total = durationFor(s.phase, s.durations);
  const remaining = remainingNow(s);
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl surface surface-hover"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Focus</h1>
        <button
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Timer settings"
          className={cn(
            "grid h-10 w-10 cursor-pointer place-items-center rounded-2xl surface surface-hover",
            showSettings && "text-primary",
          )}
        >
          <Settings2 size={19} />
        </button>
      </header>

      {/* Phase tabs */}
      <div className="glass-soft grid grid-cols-3 gap-1 rounded-2xl p-1">
        {(["work", "short", "long"] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              if (p === s.phase) return;
              useFocus.setState({
                phase: p,
                running: false,
                endsAt: null,
                remainingMs: durationFor(p, s.durations),
              });
              haptic();
            }}
            className={cn(
              "cursor-pointer rounded-xl py-2 text-xs font-medium transition-colors",
              s.phase === p ? "bg-primary text-white shadow-glow-sm" : "text-ink-mute hover:text-ink",
            )}
          >
            {PHASE_META[p].label}
          </button>
        ))}
      </div>

      {showSettings ? (
        <SettingsPanel onDone={() => setShowSettings(false)} />
      ) : (
        <GlassCard className="flex flex-col items-center gap-5 py-8" index={0}>
          {s.taskTitle && (
            <span className="flex max-w-[85%] items-center gap-2 rounded-full bg-primary/12 px-3 py-1.5 text-sm font-medium text-primary-soft ring-1 ring-primary/25">
              <span className="truncate">{s.taskTitle}</span>
              <button
                onClick={() => useFocus.getState().setTask(undefined)}
                aria-label="Clear focus task"
                className="cursor-pointer text-primary-soft/70 hover:text-primary-soft"
              >
                <X size={14} />
              </button>
            </span>
          )}

          <ProgressRing value={pct} size={232} stroke={14} color={meta.color}>
            <div>
              <p className="font-heading text-5xl font-extrabold leading-none tabular-nums">
                {mmss(remaining)}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                {meta.label}
              </p>
            </div>
          </ProgressRing>

          <p className="text-sm text-ink-mute">{meta.sub}</p>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                useFocus.getState().reset();
                haptic();
              }}
              aria-label="Reset"
              className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl surface surface-hover text-ink-mute"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={() => {
                const f = useFocus.getState();
                f.running ? f.pause() : f.start();
                haptic(12);
              }}
              className="grid h-16 w-16 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-primary-soft to-primary-dim text-white shadow-glow active:scale-95"
              aria-label={s.running ? "Pause" : "Start"}
            >
              {s.running ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
            </button>

            <button
              onClick={() => {
                useFocus.getState().skip();
                haptic();
              }}
              aria-label="Skip to next phase"
              className="grid h-12 w-12 cursor-pointer place-items-center rounded-2xl surface surface-hover text-ink-mute"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Session counter */}
      <GlassCard className="flex items-center justify-between p-4" index={1}>
        <div>
          <p className="text-sm font-semibold">Sessions today</p>
          <p className="text-xs text-ink-mute">Completed focus blocks</p>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: s.cyclesBeforeLong }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                i < s.cycle % s.cyclesBeforeLong ? "bg-primary" : "surface-2",
              )}
            />
          ))}
          <span className="ml-2 font-heading text-2xl font-extrabold text-primary">
            {s.sessionsToday}
          </span>
        </div>
      </GlassCard>
    </div>
  );
}

function SettingsPanel({ onDone }: { onDone: () => void }) {
  const { durations, cyclesBeforeLong, configure } = useFocus();
  const rows: { key: keyof typeof durations | "cyclesBeforeLong"; label: string; val: number }[] = [
    { key: "work", label: "Focus (min)", val: durations.work },
    { key: "short", label: "Short break (min)", val: durations.short },
    { key: "long", label: "Long break (min)", val: durations.long },
    { key: "cyclesBeforeLong", label: "Sessions before long break", val: cyclesBeforeLong },
  ];
  return (
    <GlassCard className="space-y-3 p-4" index={0}>
      <h2 className="font-semibold">Timer settings</h2>
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-mute">{r.label}</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={r.val}
            onChange={(e) => {
              const n = Math.max(1, Number(e.target.value) || 1);
              configure({ [r.key]: n } as Partial<typeof durations & { cyclesBeforeLong: number }>);
            }}
            className="w-20 rounded-xl border hairline surface px-3 py-2 text-center text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
      ))}
      <button onClick={onDone} className="btn-primary mt-1 w-full py-3">
        Done
      </button>
    </GlassCard>
  );
}

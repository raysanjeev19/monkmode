import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Trash2,
  Plus,
  Check,
  Flame,
  BellRing,
  LogOut,
} from "lucide-react";
import { useStore, habitStreak } from "../store/useStore";
import { cn, haptic } from "../lib/ui";
import { todayISO, formatLong } from "../lib/date";
import { requestNotifyPermission, notifySupported } from "../lib/notify";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { logout } from "../lib/auth";
import { stopCloudSync } from "../lib/sync";
import GlassCard from "../components/GlassCard";
import QuickAddSheet from "../components/QuickAddSheet";

const fieldCls =
  "w-full rounded-2xl border hairline surface px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export default function Profile() {
  const {
    profile,
    habits,
    journal,
    remindersEnabled,
    setRemindersEnabled,
    updateProfile,
    logWeight,
    addHabit,
    toggleHabit,
    removeHabit,
    removeNote,
    resetData,
  } = useStore();

  const [newHabit, setNewHabit] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const today = todayISO();

  const toggleReminders = async () => {
    if (remindersEnabled) return setRemindersEnabled(false);
    if (!notifySupported()) return alert("Notifications not supported on this device.");
    const perm = await requestNotifyPermission();
    setRemindersEnabled(perm === "granted");
    if (perm !== "granted") alert("Allow notifications to get reminders.");
  };

  const doLogout = async () => {
    if (!confirm("Log out of MonkMode? Your data stays safe in the cloud.")) return;
    haptic(12);
    try {
      // Tear down sync BEFORE clearing local state, so the reset can't be
      // mirrored up as an empty document and wipe the cloud copy.
      stopCloudSync();
      await logout();
      // Clear this device's local copy so the next account starts clean.
      resetData();
    } catch {
      alert("Couldn't log out. Please try again.");
    }
  };

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle("light", profile.theme === "light");
    document.documentElement.classList.toggle("dark", profile.theme === "dark");
  }, [profile.theme]);

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-4">
        <img src="/logo.png" alt="Monk Mode" className="h-[72px] w-[72px] shrink-0 object-contain" />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-ink-mute">
            {isFirebaseConfigured && auth?.currentUser?.email
              ? auth.currentUser.email
              : "MonkMode member"}
          </p>
        </div>
      </header>

      {/* Account */}
      {isFirebaseConfigured && (
        <GlassCard className="space-y-2 p-4" index={0}>
          <h2 className="mb-1 font-semibold">Account</h2>
          <ToggleRow
            icon={BellRing}
            title="Reminders"
            sub="Notified when a timed task is due, while the app is open"
            on={remindersEnabled}
            onClick={toggleReminders}
          />
        </GlassCard>
      )}

      {/* Personal info */}
      <GlassCard className="space-y-3 p-4" index={0}>
        <h2 className="font-semibold">Your Info</h2>
        <div>
          <label className="mb-1.5 block text-sm text-ink-mute" htmlFor="p-name">
            Name
          </label>
          <input
            id="p-name"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            className={fieldCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Logging weight also records a dated point so the Progress chart fills in. */}
          <Field label="Weight (kg)" value={profile.weightKg} onCommit={(n) => logWeight(n)} />
          <Field label="Height (cm)" value={profile.heightCm} onCommit={(n) => updateProfile({ heightCm: n })} />
          <Field label="Target (kg)" value={profile.targetWeightKg} onCommit={(n) => updateProfile({ targetWeightKg: n })} />
          <Field label="Water goal (ml)" value={profile.waterTargetMl} onCommit={(n) => updateProfile({ waterTargetMl: Math.max(1, n) })} />
        </div>
        <BackfillWeight />
      </GlassCard>

      {/* Theme */}
      <GlassCard className="p-4" index={1}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-ink-mute">Switch between dark and light</p>
          </div>
          <div className="glass-soft flex gap-1 rounded-2xl p-1">
            <ThemeBtn active={profile.theme === "dark"} onClick={() => updateProfile({ theme: "dark" })} icon={Moon} label="Dark" />
            <ThemeBtn active={profile.theme === "light"} onClick={() => updateProfile({ theme: "light" })} icon={Sun} label="Light" />
          </div>
        </div>
      </GlassCard>

      {/* Habits */}
      <GlassCard className="p-4" index={3}>
        <h2 className="mb-3 font-semibold">Habits</h2>
        <div className="space-y-2">
          {habits.map((h) => {
            const doneToday = !!h.log[today];
            return (
              <div key={h.id} className="flex items-center gap-3 rounded-2xl surface px-3 py-2.5">
                <button
                  onClick={() => {
                    toggleHabit(h.id, today);
                    haptic();
                  }}
                  aria-label={`Toggle ${h.title}`}
                  className={cn(
                    "grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl ring-1 transition-colors",
                    doneToday ? "bg-success text-white ring-success" : "ring-line text-ink-faint surface-hover",
                  )}
                >
                  <Check size={18} />
                </button>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{h.title}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-warning">
                  <Flame size={13} /> {habitStreak(h)}
                </span>
                <button
                  onClick={() => {
                    if (!confirm(`Delete habit "${h.title}"? Its streak history will be lost.`)) return;
                    removeHabit(h.id);
                  }}
                  aria-label="Delete habit"
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-faint hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newHabit.trim()) return;
            addHabit(newHabit);
            setNewHabit("");
            haptic();
          }}
        >
          <input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit…"
            className={fieldCls}
          />
          <button
            type="submit"
            aria-label="Add habit"
            className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-2xl bg-primary text-white shadow-glow-sm active:scale-95"
          >
            <Plus size={20} />
          </button>
        </form>
      </GlassCard>

      {/* Journal */}
      <GlassCard className="p-4" index={3}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Journal</h2>
          <button
            onClick={() => {
              setNoteOpen(true);
              haptic();
            }}
            aria-label="Add note"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl bg-primary text-white shadow-glow-sm active:scale-95"
          >
            <Plus size={18} />
          </button>
        </div>
        {journal.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-mute">
            No notes yet. Tap + to write one.
          </p>
        ) : (
          <div className="space-y-2">
            {(showAllNotes ? journal : journal.slice(0, 5)).map((j) => (
              <div key={j.id} className="rounded-2xl surface px-4 py-3">
                <div className="mb-1 flex items-center justify-between text-xs text-ink-mute">
                  <span>{formatLong(j.date)}</span>
                  <div className="flex items-center gap-2">
                    <span>{["😞", "😕", "😐", "🙂", "😄"][j.mood - 1]}</span>
                    <button
                      onClick={() => {
                        if (!confirm("Delete this journal note?")) return;
                        removeNote(j.id);
                      }}
                      aria-label="Delete note"
                      className="cursor-pointer text-ink-faint hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{j.text}</p>
              </div>
            ))}
            {journal.length > 5 && (
              <button
                onClick={() => setShowAllNotes((v) => !v)}
                className="w-full cursor-pointer rounded-2xl py-2 text-sm font-medium text-primary surface-hover"
              >
                {showAllNotes ? "Show less" : `Show all ${journal.length} notes`}
              </button>
            )}
          </div>
        )}
      </GlassCard>

      <p className="pt-1 text-center text-xs text-ink-faint">MonkMode · v1.0 · works offline</p>

      {/* Log out — kept at the very bottom */}
      {isFirebaseConfigured && (
        <button
          onClick={doLogout}
          className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-danger/10 py-3.5 font-medium text-danger ring-1 ring-danger/30 active:scale-[0.98]"
        >
          <LogOut size={18} /> Log out
        </button>
      )}

      <QuickAddSheet open={noteOpen} initialMode="note" lockMode onClose={() => setNoteOpen(false)} />
    </div>
  );
}

function Field({ label, value, onCommit }: { label: string; value: number; onCommit: (n: number) => void }) {
  // Keep the raw string while editing so the field can be cleared/retyped
  // without snapping to 0; commit a sanitised number on blur / Enter.
  const [raw, setRaw] = useState(String(value));
  useEffect(() => setRaw(String(value)), [value]);
  const commit = () => {
    const n = Math.max(0, Number(raw) || 0);
    onCommit(n);
    setRaw(String(n));
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm text-ink-mute">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className={fieldCls}
      />
    </div>
  );
}

/** Inline form to record a weight reading for a past (or any) date. */
function BackfillWeight() {
  const logWeightOn = useStore((s) => s.logWeightOn);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState("");

  const save = () => {
    const n = Number(kg);
    if (!date || !(n > 0)) return;
    logWeightOn(date, n);
    setKg("");
    setOpen(false);
    haptic(12);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer text-sm font-medium text-primary hover:underline"
      >
        + Log weight for another day
      </button>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1.5 block text-sm text-ink-mute">Date</label>
        <input
          type="date"
          max={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={fieldCls}
        />
      </div>
      <div className="w-24">
        <label className="mb-1.5 block text-sm text-ink-mute">kg</label>
        <input
          type="number"
          inputMode="decimal"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          className={fieldCls}
        />
      </div>
      <button onClick={save} className="btn-primary px-4 py-3">
        Save
      </button>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  sub,
  on,
  onClick,
}: {
  icon: typeof BellRing;
  title: string;
  sub: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", on ? "bg-primary/15 text-primary" : "surface text-ink-faint")}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-ink-mute">{sub}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={onClick}
        className={cn(
          "relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors",
          on ? "bg-primary" : "surface-2",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            on ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}

function ThemeBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Moon;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-white" : "text-ink-mute hover:text-ink",
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

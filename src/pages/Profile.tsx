import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Download,
  RotateCcw,
  Trash2,
  Plus,
  Check,
  Flame,
  Share2,
  Cloud,
  BellRing,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useStore, habitStreak } from "../store/useStore";
import { cn, haptic } from "../lib/ui";
import { todayISO, formatLong } from "../lib/date";
import { pushState, pullState } from "../lib/sync";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { logout } from "../lib/auth";
import GlassCard from "../components/GlassCard";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const fieldCls =
  "w-full rounded-2xl border hairline surface px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export default function Profile() {
  const {
    profile,
    habits,
    journal,
    syncEnabled,
    remindersEnabled,
    setSyncEnabled,
    setRemindersEnabled,
    updateProfile,
    addHabit,
    toggleHabit,
    removeHabit,
    exportData,
    resetData,
  } = useStore();

  const [newHabit, setNewHabit] = useState("");
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [syncMsg, setSyncMsg] = useState<string>("");
  const today = todayISO();

  const toggleReminders = async () => {
    if (remindersEnabled) return setRemindersEnabled(false);
    if (typeof Notification === "undefined") return alert("Notifications not supported on this device.");
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setRemindersEnabled(perm === "granted");
    if (perm !== "granted") alert("Allow notifications to get reminders.");
  };

  const toggleSync = async () => {
    if (syncEnabled) return setSyncEnabled(false);
    setSyncEnabled(true);
    setSyncMsg("Connecting…");
    try {
      const had = await pullState();
      setSyncMsg(had ? "Synced from cloud ✓" : "Cloud sync on ✓");
    } catch {
      setSyncMsg("Sign in to enable cloud sync.");
    }
  };

  const syncNow = async () => {
    setSyncMsg("Syncing…");
    haptic(12);
    try {
      await pushState();
      setSyncMsg("Backed up to cloud ✓");
    } catch {
      setSyncMsg("Sign in to back up your data.");
    }
  };

  const doLogout = async () => {
    if (!confirm("Log out of MonkMode? Your data stays safe in the cloud.")) return;
    haptic(12);
    try {
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

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const num = (v: string) => Math.max(0, Number(v) || 0);

  const doExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monkmode-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    haptic(12);
  };

  const doInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  };

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-3xl bg-primary/15 ring-1 ring-primary/25">
          <img src="/logo.png" alt="Monk Mode" className="h-14 w-14 object-contain" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-ink-mute">
            {isFirebaseConfigured && auth?.currentUser?.email
              ? auth.currentUser.email
              : "MonkMode member"}
          </p>
        </div>
      </header>

      {/* Account & Sync */}
      {isFirebaseConfigured && (
        <GlassCard className="space-y-2 p-4" index={0}>
          <h2 className="mb-1 font-semibold">Account &amp; Sync</h2>
          <ToggleRow
            icon={Cloud}
            title="Cloud sync"
            sub="Keep your data on all devices"
            on={syncEnabled}
            onClick={toggleSync}
          />
          <ToggleRow
            icon={BellRing}
            title="Reminders"
            sub="Notify me when a task is due"
            on={remindersEnabled}
            onClick={toggleReminders}
          />
          <Row onClick={syncNow} icon={RefreshCw} label="Sync now" tint="text-success" />
          {syncMsg && <p className="px-2 text-xs text-ink-mute">{syncMsg}</p>}
          <Row onClick={doLogout} icon={LogOut} label="Log out" tint="text-danger" />
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
          <Field label="Weight (kg)" value={profile.weightKg} onChange={(v) => updateProfile({ weightKg: num(v) })} />
          <Field label="Height (cm)" value={profile.heightCm} onChange={(v) => updateProfile({ heightCm: num(v) })} />
          <Field label="Target (kg)" value={profile.targetWeightKg} onChange={(v) => updateProfile({ targetWeightKg: num(v) })} />
          <Field label="Water goal (ml)" value={profile.waterTargetMl} onChange={(v) => updateProfile({ waterTargetMl: num(v) })} />
        </div>
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
                <span className="flex-1 text-sm font-medium">{h.title}</span>
                <span className="flex items-center gap-1 text-xs text-warning">
                  <Flame size={13} /> {habitStreak(h)}
                </span>
                <button
                  onClick={() => removeHabit(h.id)}
                  aria-label="Delete habit"
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-ink-faint hover:text-danger"
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
      {journal.length > 0 && (
        <GlassCard className="p-4" index={3}>
          <h2 className="mb-3 font-semibold">Journal</h2>
          <div className="space-y-2">
            {journal.slice(0, 5).map((j) => (
              <div key={j.id} className="rounded-2xl surface px-4 py-3">
                <div className="mb-1 flex items-center justify-between text-xs text-ink-mute">
                  <span>{formatLong(j.date)}</span>
                  <span>{["😞", "😕", "😐", "🙂", "😄"][j.mood - 1]}</span>
                </div>
                <p className="text-sm">{j.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Data */}
      <GlassCard className="space-y-2 p-4" index={4}>
        <h2 className="mb-1 font-semibold">Data</h2>
        {installEvt && (
          <Row onClick={doInstall} icon={Share2} label="Install app" tint="text-primary-soft" />
        )}
        <Row onClick={doExport} icon={Download} label="Export data (JSON)" tint="text-sky-400" />
        <Row
          onClick={() => {
            if (confirm("Reset all data to the starter demo?")) resetData();
          }}
          icon={RotateCcw}
          label="Reset to demo data"
          tint="text-warning"
        />
      </GlassCard>

      <p className="pb-2 text-center text-xs text-ink-faint">MonkMode · v1.0 · works offline</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-ink-mute">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldCls}
      />
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
  icon: typeof Cloud;
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

function Row({
  onClick,
  icon: Icon,
  label,
  tint,
}: {
  onClick: () => void;
  icon: typeof Download;
  label: string;
  tint: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors surface-hover"
    >
      <span className={cn("grid h-9 w-9 place-items-center rounded-xl surface", tint)}>
        <Icon size={18} />
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

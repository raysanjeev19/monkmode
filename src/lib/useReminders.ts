import { useEffect, useRef } from "react";
import { useStore, itemsForDate } from "../store/useStore";
import { todayISO } from "./date";
import { showNotification, notifyPermission } from "./notify";

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Best-effort local reminders: while the app is open (or recently
 * backgrounded), fire a notification when a pending, timed task for today
 * reaches its scheduled time. We check once a minute and allow a short grace
 * window so a task isn't missed if a tick lands a few seconds late.
 *
 * Note: notifications for a fully-closed app need a push server (FCM); this
 * covers the common foreground / installed-PWA case via the service worker.
 */
export function useReminders() {
  const enabled = useStore((s) => s.remindersEnabled);
  const items = useStore((s) => s.items);
  // remember what we've already fired, keyed by `${date}:${id}` so it resets
  // naturally across days and never double-notifies within a day.
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || notifyPermission() !== "granted") return;

    const tick = () => {
      const today = todayISO();
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      for (const it of itemsForDate(items, today)) {
        if (it.status !== "pending" || !it.time) continue;
        const due = toMinutes(it.time);
        // fire when we're at-or-just-past the time (within a 2-min window)
        const delta = nowMin - due;
        if (delta < 0 || delta > 2) continue;
        const key = `${today}:${it.id}`;
        if (fired.current.has(key)) continue;
        fired.current.add(key);
        void showNotification(`MonkMode · ${it.title}`, {
          body: `It's ${it.time} — time for ${it.title}.`,
          tag: key,
        });
      }
    };

    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, [enabled, items]);
}

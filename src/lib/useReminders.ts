import { useEffect, useRef } from "react";
import { useStore, itemsForDate } from "../store/useStore";
import { todayISO } from "./date";

/**
 * Best-effort local reminders: while the app is open, fire a Notification
 * when a pending, timed task for today reaches its time. (Full background
 * push needs a push server — this covers the common foreground case.)
 */
export function useReminders() {
  const enabled = useStore((s) => s.remindersEnabled);
  const items = useStore((s) => s.items);
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const tick = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
      for (const it of itemsForDate(items, todayISO())) {
        if (it.status !== "pending" || !it.time) continue;
        if (it.time === hhmm && !fired.current.has(it.id)) {
          fired.current.add(it.id);
          new Notification(`MonkMode · ${it.title}`, {
            body: `It's ${it.time} — time for ${it.title}.`,
            icon: "/logo.png",
            tag: it.id,
          });
        }
      }
    };

    const id = setInterval(tick, 20000);
    tick();
    return () => clearInterval(id);
  }, [enabled, items]);
}

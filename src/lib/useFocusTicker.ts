import { useEffect } from "react";
import { useFocus, remainingNow } from "../store/useFocus";
import { haptic } from "./ui";
import { showNotification, notifyPermission } from "./notify";

// Mounted once at the app root so a running focus session completes — with
// chime + notification + session count — even when the user has navigated away
// from the Focus screen. The Focus page only renders the live clock; it no
// longer owns completion detection (which used to stop on unmount).

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

export function useFocusTicker() {
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
    }, 1000);
    return () => clearInterval(id);
  }, []);
}

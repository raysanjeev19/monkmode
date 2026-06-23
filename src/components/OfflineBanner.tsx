import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Lightweight connectivity indicator. The app is offline-first (changes save
 * locally and Firestore syncs when back online), but a quiet cue reassures the
 * user that nothing is lost while disconnected.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 top-2 z-[55] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-xs font-medium text-bg shadow-lg"
      style={{ top: "max(env(safe-area-inset-top), 0.5rem)" }}
    >
      <WifiOff size={13} /> Offline — saved here, syncs when back online
    </div>
  );
}

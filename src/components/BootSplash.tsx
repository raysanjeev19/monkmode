import { motion } from "framer-motion";

// Branded launch screen shown briefly on every open / reopen, then it fades
// away to reveal the app. Duration lives in App (SPLASH_MS). Kept intentionally
// simple — one clean logo entrance and a subtle loading indicator.
export default function BootSplash() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-bg"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* soft warm glow behind the mark */}
      <div className="pointer-events-none absolute h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <motion.img
        src="/logo.png"
        alt="Monk Mode"
        className="h-36 w-36 object-contain"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* subtle 3-dot loader (replaces the spinner) */}
      <div className="absolute bottom-20 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

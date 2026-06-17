import { motion } from "framer-motion";
import { cn } from "../lib/ui";

interface Props {
  value: number; // 0–100
  className?: string;
  barClass?: string;
}

export default function ProgressBar({ value, className, barClass = "grad-primary" }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full surface-2 ring-1 ring-inset ring-line",
        className,
      )}
    >
      <motion.div
        className={cn("h-full rounded-full shadow-glow-sm", barClass)}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

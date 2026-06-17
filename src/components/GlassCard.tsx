import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../lib/ui";

interface Props {
  children: ReactNode;
  className?: string;
  /** animate in with a fade-up; index staggers the delay */
  index?: number;
  onClick?: () => void;
}

export default function GlassCard({ children, className, index = 0, onClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "glass rounded-lg p-4",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, useMotionValue } from "framer-motion";
import { Plus } from "lucide-react";
import { haptic } from "../lib/ui";
import QuickAddSheet, { type AddMode } from "./QuickAddSheet";

const POS_KEY = "monkmode-fab-pos";
function loadPos(): { x: number; y: number } {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || "") || { x: 0, y: 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

/**
 * Floating "+" quick-add button the user can drag anywhere on screen.
 * A tap (no meaningful drag) opens the Quick Add sheet — defaulting to the
 * mode that matches the current page (e.g. a Goal on the Goals tab).
 */
export default function DraggableFab() {
  const boundsRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const mode: AddMode = pathname.startsWith("/goals") ? "goal" : "task";

  // Remember where the user parked the button between sessions.
  const initial = useRef(loadPos());
  const x = useMotionValue(initial.current.x);
  const y = useMotionValue(initial.current.y);

  return (
    <>
      {/* full-screen drag boundary (lets clicks pass through) */}
      <div ref={boundsRef} className="pointer-events-none fixed inset-3 z-40">
        <motion.button
          aria-label="Quick add"
          drag
          dragConstraints={boundsRef}
          dragElastic={0.08}
          dragMomentum={false}
          onDragStart={() => {
            movedRef.current = true;
            haptic(8);
          }}
          onDragEnd={() => {
            try {
              localStorage.setItem(POS_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
            } catch {
              /* storage unavailable */
            }
          }}
          onClick={() => {
            // ignore the click that fires at the end of a drag
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            haptic(14);
            setOpen(true);
          }}
          whileTap={{ scale: 0.92 }}
          whileDrag={{ scale: 1.08 }}
          // start near bottom-right, above the nav bar
          className="pointer-events-auto absolute bottom-24 right-2 grid cursor-grab touch-none place-items-center rounded-full bg-gradient-to-br from-primary-soft to-primary-dim text-white shadow-glow ring-4 ring-bg active:cursor-grabbing"
          style={{ x, y, height: 60, width: 60 }}
        >
          <Plus size={28} />
        </motion.button>
      </div>

      <QuickAddSheet open={open} initialMode={mode} lockMode={mode === "goal"} onClose={() => setOpen(false)} />
    </>
  );
}

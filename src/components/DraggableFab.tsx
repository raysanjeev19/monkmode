import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { haptic } from "../lib/ui";
import QuickAddSheet from "./QuickAddSheet";

/**
 * Floating "+" quick-add button the user can drag anywhere on screen.
 * A tap (no meaningful drag) opens the Quick Add sheet.
 */
export default function DraggableFab() {
  const boundsRef = useRef<HTMLDivElement>(null);
  const movedRef = useRef(false);
  const [open, setOpen] = useState(false);

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
          initial={{ x: 0, y: 0 }}
          className="pointer-events-auto absolute bottom-24 right-2 grid h-15 w-15 cursor-grab touch-none place-items-center rounded-full bg-gradient-to-br from-primary-soft to-primary-dim text-white shadow-glow ring-4 ring-bg active:cursor-grabbing"
          style={{ height: 60, width: 60 }}
        >
          <Plus size={28} />
        </motion.button>
      </div>

      <QuickAddSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

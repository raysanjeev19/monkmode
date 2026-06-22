import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Sheet({ open, onClose, title, children }: Props) {
  // Height hidden by the on-screen keyboard, and the resulting cap for the
  // panel. On phones `vh` does NOT shrink when the keyboard opens, so a
  // bottom-anchored sheet pushes its footer (the Save button) behind the
  // keyboard. We measure the real visible area with the VisualViewport API and
  // (1) lift the sheet above the keyboard and (2) cap its height to what's
  // actually visible, so the footer stays reachable and the body still scrolls.
  const [kbInset, setKbInset] = useState(0);
  const [maxH, setMaxH] = useState("88dvh");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    const vv = window.visualViewport;
    const update = () => {
      const innerH = window.innerHeight;
      const visH = vv ? vv.height : innerH;
      const offTop = vv ? vv.offsetTop : 0;
      setKbInset(Math.max(0, innerH - visH - offTop));
      const cap = Math.min(innerH * 0.9, visH) - 8;
      setMaxH(`${Math.round(cap)}px`);
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      setKbInset(0);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ paddingBottom: kbInset }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
            style={{ maxHeight: maxH }}
            className="glass relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-t-3xl border-x-0 border-b-0 p-5 pb-safe sm:rounded-3xl sm:border-x"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full surface-3 sm:hidden" />
            <div className="mb-4 flex shrink-0 items-center justify-between">
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              <button
                onClick={onClose}
                aria-label="Close"
                className="ml-auto grid h-9 w-9 cursor-pointer place-items-center rounded-full surface text-ink-mute transition-colors surface-hover"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

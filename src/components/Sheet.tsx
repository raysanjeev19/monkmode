import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /**
   * Pinned action bar (e.g. the Save button). It stays fixed at the bottom of
   * the sheet — above the on-screen keyboard — while the body scrolls, so the
   * primary action is never hidden.
   */
  footer?: ReactNode;
}

export default function Sheet({ open, onClose, title, children, footer }: Props) {
  // The on-screen keyboard covers the bottom of a bottom-anchored sheet, and
  // `vh` units don't shrink for it. Measure the real visible area with the
  // VisualViewport API to (1) lift the sheet above the keyboard and (2) cap its
  // height to the visible region, so the body scrolls and the footer stays put.
  const [kbInset, setKbInset] = useState(0);
  const [maxH, setMaxH] = useState("88dvh");
  // Drag-to-dismiss is started only from the grab handle (dragListener=false),
  // otherwise framer-motion's drag would swallow the body's scroll gestures and
  // the user could never scroll down to reach the footer.
  const dragControls = useDragControls();

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
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
            style={{ maxHeight: maxH }}
            className="glass relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-x-0 border-b-0 sm:rounded-3xl sm:border-x"
          >
            {/* Header — fixed; the handle is the only drag-to-dismiss target */}
            <div className="shrink-0 px-5 pt-4">
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="mx-auto mb-3 h-1.5 w-10 cursor-grab touch-none rounded-full surface-3 active:cursor-grabbing sm:hidden"
              />
              <div className="mb-3 flex items-center justify-between gap-3">
                {title && <h2 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h2>}
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="ml-auto grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full surface text-ink-mute transition-colors surface-hover"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body — scrolls freely */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5"
              style={{ paddingBottom: footer ? 16 : "max(env(safe-area-inset-bottom), 24px)" }}
            >
              {children}
            </div>

            {/* Footer — pinned above the keyboard */}
            {footer && (
              <div
                className="shrink-0 border-t border-line/60 px-5 pt-3"
                style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

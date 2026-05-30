"use client";

import * as React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { gentle, staggerItem } from "@/lib/motion";
import { UI } from "@/lib/strings";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0,  transition: gentle }}
            exit={{    opacity: 0, scale: 0.96,  y: 8,  transition: { duration: 0.17 } }}
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 my-8 w-full max-w-lg rounded-2xl",
              "border border-border tf-glass shadow-2xl shadow-black/60",
              className,
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <motion.h2
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0, transition: { ...gentle, delay: 0.05 } }}
                className="text-sm font-semibold text-fg"
              >
                {title}
              </motion.h2>
              <motion.button
                onClick={onClose}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, transition: { ...gentle, delay: 0.08 } }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="tf-ring rounded-lg p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-fg"
                aria-label={UI.close}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Content — stagger children */}
            <motion.div
              className="px-5 py-5"
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } } }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Wrap form Field/input inside ModalField to get staggered entrance.
 * Usage: wrap each <Field> in <ModalField>.
 */
export function ModalField({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={staggerItem}>
      {children}
    </motion.div>
  );
}

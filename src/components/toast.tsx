"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { gentle } from "@/lib/motion";

/* ── Types ───────────────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

/* ── Context ─────────────────────────────────────────────────────────── */
const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ── Provider ────────────────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), 4000),
      );
    },
    [dismiss],
  );

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error   = useCallback((m: string) => toast(m, "error"),   [toast]);

  return (
    <Ctx.Provider value={{ toast, success, error }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

/* ── Toast item ──────────────────────────────────────────────────────── */
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-teal shrink-0" />,
  error:   <XCircle     size={16} className="text-rose shrink-0" />,
  info:    <AlertCircle size={16} className="text-accent-fg shrink-0" />,
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0,  scale: 1,    transition: gentle }}
      exit={{    opacity: 0, y: 8,  scale: 0.96, transition: { duration: 0.18 } }}
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3",
        "tf-glass shadow-xl shadow-black/15",
        "min-w-[260px] max-w-[360px] text-sm font-medium text-fg",
      )}
    >
      {ICONS[t.type]}
      <span className="flex-1">{t.message}</span>
      <button
        onClick={() => onDismiss(t.id)}
        className="ml-1 rounded-md p-1 text-muted transition-colors hover:text-fg"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

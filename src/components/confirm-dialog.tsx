"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { fadeScale, gentle } from "@/lib/motion";
import { UI } from "@/lib/strings";

/* ── Types ───────────────────────────────────────────────────────────── */
interface ConfirmOptions {
  title: string;
  detail?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmCtx {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

/* ── Context ─────────────────────────────────────────────────────────── */
const Ctx = createContext<ConfirmCtx | null>(null);

export function useConfirm(): ConfirmCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

/* ── Provider ────────────────────────────────────────────────────────── */
interface PendingConfirm extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  function settle(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {pending && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm"
              onClick={() => settle(false)}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-[91] flex items-center justify-center p-4">
              <motion.div
                key="dialog"
                {...fadeScale}
                className="w-full max-w-sm rounded-2xl border border-border tf-glass p-6 shadow-2xl"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-soft">
                    <AlertTriangle size={17} className="text-rose" />
                  </div>
                  <div>
                    <p className="font-semibold text-fg">{pending.title}</p>
                    {pending.detail && (
                      <p className="mt-1 text-sm text-muted">{pending.detail}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => settle(false)}>
                    {UI.cancel}
                  </Button>
                  <Button
                    variant={pending.danger !== false ? "danger" : "primary"}
                    onClick={() => settle(true)}
                  >
                    {pending.confirmLabel ?? UI.confirm}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

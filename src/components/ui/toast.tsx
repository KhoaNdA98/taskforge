'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/* ── Types ─────────────────────────────────────────────────── */
interface Toast { id: number; message: string; type: 'success' | 'error'; }
interface ToastCtx { success: (msg: string) => void; error: (msg: string) => void; }

const Ctx = createContext<ToastCtx>({ success: () => {}, error: () => {} });
export function useToast() { return useContext(Ctx); }

/* ── Provider ───────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let id = 0;

  const add = useCallback((message: string, type: Toast['type']) => {
    const tid = ++id;
    setToasts(t => [...t, { id: tid, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== tid)), 3000);
  }, []);

  const success = useCallback((m: string) => add(m, 'success'), [add]);
  const error   = useCallback((m: string) => add(m, 'error'),   [add]);

  return (
    <Ctx.Provider value={{ success, error }}>
      {children}
      {/* Toast container — bottom right */}
      <div className="fixed bottom-28 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-toast pointer-events-auto ${
              t.type === 'success'
                ? 'bg-px-green/10 border-px-green/50 text-px-green'
                : 'bg-px-red/10 border-px-red/50 text-px-red'
            }`}
          >
            <span>{t.type === 'success' ? '✓' : '⚠'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

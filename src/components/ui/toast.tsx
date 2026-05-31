'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error'; }
interface ToastCtx { success: (msg: string) => void; error: (msg: string) => void; }
const Ctx = createContext<ToastCtx>({ success: () => {}, error: () => {} });
export function useToast() { return useContext(Ctx); }

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: Toast['type']) => {
    const id = ++_id;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const success = useCallback((m: string) => add(m, 'success'), [add]);
  const error   = useCallback((m: string) => add(m, 'error'),   [add]);

  return (
    <Ctx.Provider value={{ success, error }}>
      {children}
      <div style={{ position: 'fixed', bottom: '130px', right: '16px', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            fontFamily: "'VT323', monospace", fontSize: '15px', letterSpacing: '0.04em',
            padding: '10px 14px',
            border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
            background: t.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: t.type === 'success' ? '#22c55e' : '#ef4444',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'toast-slide-in 0.15s ease forwards',
            pointerEvents: 'auto',
          }}>
            <span>{t.type === 'success' ? '✓' : '⚠'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

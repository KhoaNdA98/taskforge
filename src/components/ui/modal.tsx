'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ModalOptions {
  title: string;
  content: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}
interface ModalCtx { open: (opts: ModalOptions) => void; close: () => void; }

const Ctx = createContext<ModalCtx>({ open: () => {}, close: () => {} });
export function useModal() { return useContext(Ctx); }

const S = {
  backdrop: { position: 'fixed' as const, inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)' },
  box: { background: '#232323', border: '3px solid #111111', width: '100%', maxWidth: '500px', margin: '0 16px', boxShadow: 'inset 0 0 0 1px rgba(255,145,77,0.15), 6px 6px 0 #111111' },
  header: { display: 'flex' as const, alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '2px solid #1e1e1e' },
  title: { fontFamily: "'VT323', monospace", fontSize: '24px', color: '#ff914d', letterSpacing: '0.08em' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'VT323', monospace", fontSize: '28px', color: 'rgba(252,234,187,0.25)', lineHeight: 1, padding: '0 4px' },
  body: { padding: '20px' },
  footer: { display: 'flex' as const, justifyContent: 'flex-end', gap: '10px', padding: '0 20px 20px' },
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ModalOptions | null>(null);
  const open  = useCallback((o: ModalOptions) => setOpts(o), []);
  const close = useCallback(() => setOpts(null), []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {opts && opts.title && (
        <div style={S.backdrop} onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <div style={S.box} role="dialog" aria-modal aria-labelledby="modal-title">
            <div style={S.header}>
              <span id="modal-title" style={S.title}>{opts.title}</span>
              <button onClick={close} style={S.closeBtn} aria-label="Close">×</button>
            </div>
            <div style={S.body}>{opts.content}</div>
            {opts.onConfirm && (
              <div style={S.footer}>
                <button onClick={close} style={{ fontFamily: "'VT323', monospace", fontSize: '19px', letterSpacing: '0.1em', padding: '6px 16px', cursor: 'pointer', border: '1px solid #2d2d3d', background: 'transparent', color: 'rgba(232,232,240,0.35)' }}>
                  {opts.cancelLabel ?? '[ CANCEL ]'}
                </button>
                <button
                  onClick={() => { opts.onConfirm?.(); close(); }}
                  style={{ fontFamily: "'VT323', monospace", fontSize: '19px', letterSpacing: '0.1em', padding: '6px 16px', cursor: 'pointer', border: opts.danger ? '1px solid rgba(239,68,68,0.5)' : '1px solid #111111', background: opts.danger ? 'rgba(239,68,68,0.1)' : '#ff914d', color: opts.danger ? '#ef4444' : '#111111', boxShadow: opts.danger ? 'none' : '3px 3px 0 rgba(0,0,0,0.6)' }}
                >
                  {opts.confirmLabel ?? '[ CONFIRM ]'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

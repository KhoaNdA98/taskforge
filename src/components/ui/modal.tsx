'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

/* ── Types ─────────────────────────────────────────────────── */
interface ModalOptions {
  title: string;
  content: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ModalCtx {
  open: (opts: ModalOptions) => void;
  close: () => void;
}

/* ── Context ────────────────────────────────────────────────── */
const Ctx = createContext<ModalCtx>({ open: () => {}, close: () => {} });

export function useModal() { return useContext(Ctx); }

/* ── Provider ───────────────────────────────────────────────── */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ModalOptions | null>(null);
  const open  = useCallback((o: ModalOptions) => setOpts(o), []);
  const close = useCallback(() => setOpts(null), []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {opts && (
        <div
          className="px-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="px-modal-box" role="dialog" aria-modal aria-labelledby="modal-title">
            {/* Header */}
            <div className="px-modal-header">
              <span id="modal-title" className="px-modal-title">{opts.title}</span>
              <button
                onClick={close}
                className="font-pixel text-[20px] text-px-dimmed hover:text-white leading-none px-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-modal-body">{opts.content}</div>

            {/* Footer */}
            {opts.onConfirm && (
              <div className="px-modal-footer">
                <button className="px-btn px-btn-ghost" onClick={close}>
                  {opts.cancelLabel ?? '[ CANCEL ]'}
                </button>
                <button
                  className={opts.danger ? 'px-btn px-btn-danger' : 'px-btn px-btn-primary'}
                  onClick={() => { opts.onConfirm?.(); close(); }}
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

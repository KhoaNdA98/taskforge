'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp, type AuthState } from '@/app/auth/actions';
import { AUTH } from '@/lib/strings';

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction}>
      {/* Email */}
      <div className="px-field">
        <label htmlFor="tf-email">{AUTH.email.toUpperCase()}</label>
        <input
          id="tf-email"
          name="email"
          type="email"
          placeholder={AUTH.emailPlaceholder}
          autoComplete="email"
          required
        />
      </div>

      {/* Password */}
      <div className="px-field" style={{ marginBottom: 18 }}>
        <label htmlFor="tf-password">{AUTH.password.toUpperCase()}</label>
        <input
          id="tf-password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
        />
      </div>

      {/* Error/success messages */}
      {state.error && (
        <div style={{
          border: '1px solid rgba(239,68,68,0.5)',
          background: 'rgba(239,68,68,0.08)',
          color: '#f87171',
          padding: '8px 12px',
          marginBottom: 12,
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 15,
          letterSpacing: '0.04em',
        }}>
          ⚠ {state.error}
        </div>
      )}
      {state.message && (
        <div style={{
          border: '1px solid rgba(34,197,94,0.4)',
          background: 'rgba(34,197,94,0.07)',
          color: '#4ade80',
          padding: '8px 12px',
          marginBottom: 12,
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 15,
          letterSpacing: '0.04em',
        }}>
          ✓ {state.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="px-btn px-btn--primary"
        style={{ width: '100%', fontSize: 18, padding: '10px 0', marginBottom: 14 }}
      >
        {pending ? '[ LOADING... ]' : mode === 'signin' ? '[ ENTER WORLD ]' : '[ CREATE ACCOUNT ]'}
      </button>

      {/* Mode switch */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-pixel), VT323, monospace',
        fontSize: 14,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.04em',
      }}>
        {mode === 'signin' ? (
          <>
            No account?{' '}
            <button
              type="button"
              onClick={() => setMode('signup')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a855f7', fontFamily: 'inherit', fontSize: 'inherit',
                padding: 0, letterSpacing: 'inherit',
              }}
            >
              SIGN UP →
            </button>
          </>
        ) : (
          <>
            Have account?{' '}
            <button
              type="button"
              onClick={() => setMode('signin')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a855f7', fontFamily: 'inherit', fontSize: 'inherit',
                padding: 0, letterSpacing: 'inherit',
              }}
            >
              SIGN IN →
            </button>
          </>
        )}
      </div>
    </form>
  );
}

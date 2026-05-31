'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp, type AuthState } from '@/app/auth/actions';
import { AUTH } from '@/lib/strings';

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

      <div className="px-field">
        <label className="px-label" htmlFor="lf-email">{AUTH.email}</label>
        <input id="lf-email" name="email" type="email" required
               placeholder={AUTH.emailPlaceholder} autoComplete="email"
               className="px-input" />
      </div>

      <div className="px-field" style={{ marginBottom: '16px' }}>
        <label className="px-label" htmlFor="lf-password">{AUTH.password}</label>
        <input id="lf-password" name="password" type="password" required
               placeholder="••••••••"
               autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
               className="px-input" />
      </div>

      {state.error && (
        <div style={{
          border: '2px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.06)',
          padding: '8px 12px', marginBottom: '12px',
          fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#ef4444',
          letterSpacing: '0.04em',
        }}>
          ⚠ {state.error}
        </div>
      )}
      {state.message && (
        <div style={{
          border: '2px solid rgba(111,207,90,0.5)', background: 'rgba(111,207,90,0.06)',
          padding: '8px 12px', marginBottom: '12px',
          fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#6fcf5a',
          letterSpacing: '0.04em',
        }}>
          ✓ {state.message}
        </div>
      )}

      <button
        type="submit" disabled={pending}
        style={{
          fontFamily: "'VT323', monospace", fontSize: '22px', letterSpacing: '0.08em',
          padding: '10px 20px', cursor: pending ? 'not-allowed' : 'pointer',
          border: '3px solid #111111',
          background: pending ? '#cc6b30' : '#ff914d',
          color: '#111111', width: '100%',
          boxShadow: pending
            ? 'inset -2px -2px 0 rgba(0,0,0,0.25), 0 2px 0 #111'
            : 'inset -4px -4px 0 rgba(0,0,0,0.2), inset 4px 4px 0 rgba(255,255,255,0.25), 4px 6px 0 #111111',
          transform: pending ? 'translateY(3px)' : 'none',
          marginBottom: '16px',
          transition: 'all 0.08s ease',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? '[ LOADING... ]' : mode === 'signin' ? '[ ENTER WORLD ]' : '[ CREATE ACCOUNT ]'}
      </button>

      <div style={{ textAlign: 'center', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(252,234,187,0.3)', letterSpacing: '0.06em' }}>
        {mode === 'signin' ? (
          <>No account?{' '}
            <button type="button" onClick={() => setMode('signup')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff914d', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, padding: 0, letterSpacing: '0.06em' }}>
              SIGN UP →
            </button>
          </>
        ) : (
          <>Have account?{' '}
            <button type="button" onClick={() => setMode('signin')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff914d', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, padding: 0, letterSpacing: '0.06em' }}>
              SIGN IN →
            </button>
          </>
        )}
      </div>
    </form>
  );
}

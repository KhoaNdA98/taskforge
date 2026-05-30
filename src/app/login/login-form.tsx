'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp, type AuthState } from '@/app/auth/actions';
import { AUTH } from '@/lib/strings';

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="px-field">
        <label className="px-label" htmlFor="lf-email">{AUTH.email}</label>
        <input id="lf-email" name="email" type="email" required
               placeholder={AUTH.emailPlaceholder} autoComplete="email"
               className="px-input" />
      </div>
      <div className="px-field mb-4">
        <label className="px-label" htmlFor="lf-password">{AUTH.password}</label>
        <input id="lf-password" name="password" type="password" required
               placeholder="••••••••"
               autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
               className="px-input" />
      </div>

      {state.error && (
        <div className="border border-px-red/50 bg-px-red/8 text-px-red font-pixel text-[15px] tracking-[0.04em] px-3 py-2 mb-3">
          ⚠ {state.error}
        </div>
      )}
      {state.message && (
        <div className="border border-px-green/40 bg-px-green/7 text-px-green font-pixel text-[15px] tracking-[0.04em] px-3 py-2 mb-3">
          ✓ {state.message}
        </div>
      )}

      <button type="submit" disabled={pending}
              className="px-btn px-btn-primary w-full text-[18px] py-2.5 mb-4 justify-center">
        {pending ? '[ LOADING... ]' : mode === 'signin' ? '[ ENTER WORLD ]' : '[ CREATE ACCOUNT ]'}
      </button>

      <div className="text-center font-pixel text-[14px] text-white/30 tracking-[0.04em]">
        {mode === 'signin' ? (
          <>No account?{' '}
            <button type="button" onClick={() => setMode('signup')}
                    className="bg-none border-none cursor-pointer text-px-purple font-pixel text-[14px] p-0">
              SIGN UP →
            </button>
          </>
        ) : (
          <>Have account?{' '}
            <button type="button" onClick={() => setMode('signin')}
                    className="bg-none border-none cursor-pointer text-px-purple font-pixel text-[14px] p-0">
              SIGN IN →
            </button>
          </>
        )}
      </div>
    </form>
  );
}

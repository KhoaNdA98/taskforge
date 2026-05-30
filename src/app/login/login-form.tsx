'use client';

import { useActionState, useState } from 'react';
import { TextInput, PasswordInput, Button, Alert, Text, Anchor } from '@mantine/core';
import { signIn, signUp, type AuthState } from '@/app/auth/actions';
import { AUTH } from '@/lib/strings';

export function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction}>
      <TextInput
        name="email"
        type="email"
        label={AUTH.email}
        placeholder={AUTH.emailPlaceholder}
        autoComplete="email"
        required
        mb="md"
      />
      <PasswordInput
        name="password"
        label={AUTH.password}
        placeholder="••••••••"
        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        required
        mb="md"
      />

      {state.error && (
        <Alert color="red" mb="md" radius="md">
          {state.error}
        </Alert>
      )}
      {state.message && (
        <Alert color="teal" mb="md" radius="md">
          {state.message}
        </Alert>
      )}

      <Button type="submit" fullWidth loading={pending} mb="md">
        {mode === 'signin' ? AUTH.signIn : AUTH.signUp}
      </Button>

      <Text ta="center" size="xs" c="dimmed">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <Anchor component="button" type="button" size="xs" onClick={() => setMode('signup')}>
              {AUTH.signUp}
            </Anchor>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Anchor component="button" type="button" size="xs" onClick={() => setMode('signin')}>
              {AUTH.signIn}
            </Anchor>
          </>
        )}
      </Text>
    </form>
  );
}

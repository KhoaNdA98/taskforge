"use client";

import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import { Button, Input, Field } from "@/components/ui";
import { AUTH } from "@/lib/strings";
import { fadeUp } from "@/lib/motion";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <Field label={AUTH.email}>
        <Input name="email" type="email" autoComplete="email" placeholder={AUTH.emailPlaceholder} required />
      </Field>
      <Field label={AUTH.password}>
        <Input
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="••••••••"
          required
        />
      </Field>

      {state.error && (
        <motion.p
          {...fadeUp}
          className="rounded-xl border border-rose/25 bg-rose-soft px-3 py-2 text-sm text-rose"
        >
          {state.error}
        </motion.p>
      )}
      {state.message && (
        <motion.p
          {...fadeUp}
          className="rounded-xl border border-teal/25 bg-teal-soft px-3 py-2 text-sm text-teal"
        >
          {state.message}
        </motion.p>
      )}

      <Button type="submit" variant="primary" disabled={pending} className="w-full">
        {pending
          ? mode === "signin" ? AUTH.signingIn : AUTH.signingUp
          : mode === "signin" ? AUTH.signIn    : AUTH.signUp}
      </Button>

      <p className="text-center text-xs text-muted">
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button type="button" onClick={() => setMode("signup")}
              className="font-medium text-accent-fg hover:underline">
              {AUTH.signUp}
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => setMode("signin")}
              className="font-medium text-accent-fg hover:underline">
              {AUTH.signIn}
            </button>
          </>
        )}
      </p>
    </form>
  );
}

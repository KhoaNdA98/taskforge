"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/auth/actions";
import { Button, Input, Field } from "@/components/ui";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ban@email.com"
          required
        />
      </Field>
      <Field label="Mật khẩu">
        <Input
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="••••••••"
          required
        />
      </Field>

      {state.error && (
        <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg border border-teal/30 bg-teal-soft px-3 py-2 text-sm text-teal">
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        className="w-full"
      >
        {pending
          ? "Đang xử lý…"
          : mode === "signin"
            ? "Đăng nhập"
            : "Tạo tài khoản"}
      </Button>

      <p className="text-center text-xs text-muted">
        {mode === "signin" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-medium text-accent-fg hover:underline"
        >
          {mode === "signin" ? "Đăng ký" : "Đăng nhập"}
        </button>
      </p>
    </form>
  );
}

import { Hexagon } from "lucide-react";
import { LoginForm } from "./login-form";
import { AUTH } from "@/lib/strings";

export default function LoginPage() {
  return (
    <main className="tf-backdrop flex min-h-dvh items-center justify-center px-4">
      <div className="tf-rise w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="tf-glow mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent-soft text-accent-fg">
            <Hexagon size={24} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Task<span className="text-accent-fg">Forge</span>
          </h1>
          <p className="mt-1 font-mono text-xs text-muted">{AUTH.tagline}</p>
        </div>
        <div className="rounded-2xl border border-border tf-glass p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

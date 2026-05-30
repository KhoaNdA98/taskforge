"use client";

import { Hexagon } from "lucide-react";
import { motion } from "motion/react";
import { LoginForm } from "./login-form";
import { AUTH } from "@/lib/strings";
import { gentle } from "@/lib/motion";

export default function LoginPage() {
  return (
    <main className="tf-backdrop flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0, transition: gentle }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.05 }}
            className="tf-glow mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent-soft text-accent-fg"
          >
            <Hexagon size={24} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...gentle, delay: 0.12 }}
            className="text-2xl font-semibold tracking-tight"
          >
            Task<span className="text-accent-fg">Forge</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-1 font-mono text-xs text-muted"
          >
            {AUTH.tagline}
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...gentle, delay: 0.1 }}
          className="rounded-2xl border border-border tf-glass p-6"
        >
          <LoginForm />
        </motion.div>
      </div>
    </main>
  );
}

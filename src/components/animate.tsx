"use client";

/**
 * Thin client wrappers for motion animations.
 * Server Components can't use motion.* JSX directly in Next.js 16,
 * so we wrap animated sections in these client components.
 */

import { motion } from "motion/react";
import { gentle } from "@/lib/motion";

export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeLeft({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...gentle, delay }}
      className={className}
    >
      {children}
    </motion.li>
  );
}

export function FadeRight({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...gentle, delay }}
      className={className}
    >
      {children}
    </motion.li>
  );
}

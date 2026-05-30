"use client";

import { MotionConfig } from "motion/react";

/**
 * Global Framer Motion config:
 * - reducedMotion="user" — respects `prefers-reduced-motion` system setting
 * - transition defaults applied via CSS spring presets (see motion.ts)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}

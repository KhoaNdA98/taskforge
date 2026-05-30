"use client";

import { motion } from "motion/react";

/** Re-renders on every navigation (unlike layout.tsx) → page transition. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.9 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared Framer Motion presets — Apple-grade physics.
 *
 * Rule of thumb:
 *  snappy   → immediate UI feedback (buttons, toggles, chips)
 *  gentle   → panels, modals, page content entering
 *  bouncy   → drag release, celebratory moments
 *  smooth   → value animations (count-up, progress bars)
 *  fluid    → hover card lift, subtle continuous responses
 */
import type { Variants } from "motion/react";

/* ── Spring configs ──────────────────────────────────────────────────── */

export const snappy = {
  type: "spring",
  stiffness: 600,
  damping: 38,
  mass: 0.8,
} as const;

export const gentle = {
  type: "spring",
  stiffness: 280,
  damping: 26,
  mass: 0.9,
} as const;

export const bouncy = {
  type: "spring",
  stiffness: 400,
  damping: 20,
  mass: 0.85,
} as const;

export const smooth = {
  type: "spring",
  stiffness: 120,
  damping: 18,
  mass: 1,
} as const;

/** Hover lift — snappier so response feels instant */
export const fluid = {
  type: "spring",
  stiffness: 380,
  damping: 24,
  mass: 0.9,
} as const;

/* ── Shared transition shorthands ────────────────────────────────────── */
export const ease = {
  type: "tween",
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1],
} as const;

/* ── Variant factories ───────────────────────────────────────────────── */

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: gentle },
  exit:    { opacity: 0, y: 4, transition: { duration: 0.15 } },
};

export const fadeScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1,    transition: gentle },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.14 } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: ease },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
};

/** Container: stagger children on animate */
export const staggerContainer = (stagger = 0.05): Variants => ({
  animate: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
});

/** Item used inside staggerContainer */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,  transition: { type: "spring", stiffness: 300, damping: 26 } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.14 } },
};

/** Stagger a list of n items with max cap to avoid long waits */
export function staggerDelay(i: number, max = 8): number {
  return Math.min(i, max) * 0.05;
}

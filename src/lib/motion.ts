/**
 * Shared Framer Motion spring presets — Apple-inspired.
 * Import these instead of inline transition objects so animations
 * stay consistent across the app.
 */

/** Snappy — quick UI feedback (buttons, toggles, badges) */
export const snappy = {
  type: "spring",
  stiffness: 500,
  damping: 36,
  mass: 1,
} as const;

/** Gentle — panels, modals, page content */
export const gentle = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 1,
} as const;

/** Bouncy — drag release, celebratory moments */
export const bouncy = {
  type: "spring",
  stiffness: 380,
  damping: 22,
  mass: 0.9,
} as const;

/** Smooth — value animations (count-up, progress bars) */
export const smooth = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 1,
} as const;

/** Standard ease for non-spring transitions */
export const ease = {
  type: "tween",
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1],
} as const;

/** Fade variants (for AnimatePresence / layout groups) */
export const fadeUp = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: gentle },
  exit:     { opacity: 0, y: 4, transition: { duration: 0.15 } },
} as const;

export const fadeScale = {
  initial:  { opacity: 0, scale: 0.96 },
  animate:  { opacity: 1, scale: 1,   transition: gentle },
  exit:     { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
} as const;

/** Stagger children (apply to parent motion.div) */
export const staggerContainer = (stagger = 0.045) => ({
  animate: { transition: { staggerChildren: stagger } },
}) as const;

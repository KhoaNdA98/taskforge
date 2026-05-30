"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * TiltCard — 3D perspective tilt that follows the cursor.
 * Used for dashboard stat cards. Feels like Apple Card / Magic Mouse.
 */
export function TiltCard({
  children,
  className,
  intensity = 6,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springCfg = { stiffness: 260, damping: 22, mass: 0.8 };
  const x = useSpring(rawX, springCfg);
  const y = useSpring(rawY, springCfg);

  const rotateX = useTransform(y, [-0.5, 0.5], [ intensity, -intensity]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-intensity,  intensity]);
  const glowX   = useTransform(x, [-0.5, 0.5], [0, 100]);
  const glowY   = useTransform(y, [-0.5, 0.5], [0, 100]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width  - 0.5);
    rawY.set((e.clientY - rect.top)  / rect.height - 0.5);
  }

  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      whileHover={{ scale: 1.025, z: 8 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn("relative cursor-default", className)}
    >
      {/* Specular highlight that moves with tilt */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) =>
              `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

/**
 * HoverCard — simpler lift effect without tilt.
 * Used for client cards, task cards etc.
 */
export function HoverCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        boxShadow: "0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.09)",
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

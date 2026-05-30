import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/* ── Button ──────────────────────────────────────────────────────────── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.015, y: props.disabled ? 0 : -1 }}
      whileTap={{ scale: props.disabled ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 36 }}
      className={cn(
        "tf-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" &&
          "bg-accent text-white shadow-[0_0_0_1px_rgba(124,108,255,0.5),0_4px_12px_rgba(124,108,255,0.25)] hover:bg-accent/90",
        variant === "secondary" &&
          "border border-border bg-panel-2 text-fg hover:border-border-mid hover:bg-panel-3",
        variant === "ghost" && "text-fg-2 hover:bg-panel-2 hover:text-fg",
        variant === "danger" &&
          "border border-rose/25 bg-rose-soft text-rose hover:bg-rose/15",
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    />
  );
}

/* ── Inputs ──────────────────────────────────────────────────────────── */
const fieldBase =
  "tf-ring w-full rounded-xl border border-border bg-base/50 px-3 py-2 text-sm text-fg " +
  "placeholder:text-muted transition-all duration-150 " +
  "hover:border-border-mid focus:border-accent/50 focus:bg-panel disabled:opacity-40";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-[72px] resize-y", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(fieldBase, "cursor-pointer appearance-none pr-8", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-panel/80 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

/* ── Badge ───────────────────────────────────────────────────────────── */
type BadgeTone = "accent" | "teal" | "amber" | "muted" | "rose";

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<BadgeTone, string> = {
    accent: "bg-accent-soft text-accent-fg border-accent/20",
    teal:   "bg-teal-soft   text-teal      border-teal/20",
    amber:  "bg-amber-soft  text-amber     border-amber/20",
    rose:   "bg-rose-soft   text-rose      border-rose/20",
    muted:  "bg-panel-2     text-fg-2      border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5",
        "font-mono text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Page header ─────────────────────────────────────────────────────── */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      {icon && <div className="mb-2 text-muted opacity-60">{icon}</div>}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────── */
function Shimmer({ className }: { className?: string }) {
  return <div className={cn("tf-shimmer rounded-xl", className)} />;
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="mt-4 h-8 w-36" />
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden tf-scan-wrap">
      <div className="border-b border-border px-4 py-3">
        <Shimmer className="h-3 w-40" />
      </div>
      <div className="divide-y divide-border-soft">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3"
            style={{ opacity: 1 - i * 0.09 }}
          >
            <Shimmer className="h-3 w-20 shrink-0" />
            <Shimmer className="h-3 flex-1" />
            <Shimmer className="h-5 w-16 shrink-0 rounded-lg" />
            <Shimmer className="h-3 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

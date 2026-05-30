"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, Timer, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { gentle } from "@/lib/motion";

/* ── Completion widget — animated stacked progress bar ───────────────── */
export function CompletionWidget({
  todo, doing, done,
}: {
  todo: number; doing: number; done: number;
}) {
  const total = todo + doing + done;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  const donePct = Math.round(pct(done));

  const segments = [
    { label: "Done",        value: done,  color: "var(--color-teal)",  pct: pct(done)  },
    { label: "In progress", value: doing, color: "var(--color-amber)", pct: pct(doing) },
    { label: "To do",       value: todo,  color: "var(--color-muted)", pct: pct(todo)  },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Completion</span>
        <CheckCircle2 size={15} className="text-teal" />
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-fg">{donePct}%</span>
        <span className="text-xs text-muted">done</span>
      </div>

      {/* Stacked bar */}
      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-panel-3">
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ width: 0 }}
            animate={{ width: `${s.pct}%` }}
            transition={{ ...gentle, delay: 0.1 + i * 0.08 }}
            style={{ backgroundColor: s.color }}
            className="h-full"
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-muted">{s.label}</span>
            <span className="font-mono text-xs text-fg-2">{s.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Month-over-month delta widget ───────────────────────────────────── */
export function DeltaWidget({
  current, previous, currency,
}: {
  current: number; previous: number; currency: string;
}) {
  const delta   = current - previous;
  const pctChange = previous === 0
    ? (current > 0 ? 100 : 0)
    : Math.round((delta / previous) * 100);
  const up   = delta > 0;
  const flat = delta === 0;

  const Icon  = flat ? Minus : up ? TrendingUp : TrendingDown;
  const tone  = flat ? "text-muted" : up ? "text-teal" : "text-rose";
  const bgTone = flat ? "bg-panel-3" : up ? "bg-teal-soft" : "bg-rose-soft";

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">vs last month</span>
        <Icon size={15} className={tone} />
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-fg">
          {formatMoney(current, currency)}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-mono text-xs font-medium ${bgTone} ${tone}`}>
          <Icon size={12} />
          {up ? "+" : ""}{pctChange}%
        </span>
        <span className="text-xs text-muted">
          last: {formatMoney(previous, currency)}
        </span>
      </div>
    </Card>
  );
}

/* ── Unbilled hours widget ───────────────────────────────────────────── */
export function UnbilledWidget({
  tasks, month,
}: {
  tasks: { id: string; name: string }[];
  month: string;
}) {
  const count = tasks.length;

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Needs hours</span>
        <Timer size={15} className={count > 0 ? "text-amber" : "text-teal"} />
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-fg">{count}</span>
        <span className="text-xs text-muted">on-demand task{count !== 1 ? "s" : ""} at 0h</span>
      </div>

      {count === 0 ? (
        <p className="mt-3 text-xs text-muted">All on-demand tasks have hours logged. 🎉</p>
      ) : (
        <>
          <ul className="mt-3 flex-1 space-y-1">
            {tasks.slice(0, 3).map((t, i) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...gentle, delay: 0.15 + i * 0.06 }}
                className="truncate text-xs text-fg-2"
              >
                · {t.name}
              </motion.li>
            ))}
            {count > 3 && <li className="text-xs text-muted">+{count - 3} more…</li>}
          </ul>
          <Link
            href={`/tasks?month=${month}&type=on_demand&view=table`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-fg transition-colors hover:text-accent"
          >
            Log hours <ArrowRight size={12} />
          </Link>
        </>
      )}
    </Card>
  );
}

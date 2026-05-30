"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Download, Search, Layers, Table2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Input, Select, Card } from "@/components/ui";
import { Modal } from "@/components/modal";
import { formatMoney, formatHours } from "@/lib/format";
import { exportTasksToExcel } from "@/lib/export";
import { TASK, FILTER, UI } from "@/lib/strings";
import { TasksTable } from "./tasks-table";
import { TasksGrouped } from "./tasks-grouped";
import { TasksForm } from "./tasks-form";
import type { Client, TaskWithClient } from "@/lib/types";

type Filters = { month: string; type: string; client: string; status: string; q: string };
type ViewMode = "table" | "list";

/* ── View toggle ──────────────────────────────────────────────────────── */
function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { v: ViewMode; icon: React.ReactNode; label: string }[] = [
    { v: "table", icon: <Table2  size={15} />, label: "Table" },
    { v: "list",  icon: <Layers  size={15} />, label: "List"  },
  ];
  return (
    <div className="relative flex items-center rounded-xl border border-border bg-panel-2 p-1 gap-0.5">
      {options.map(({ v, icon, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value === v ? "text-fg" : "text-muted hover:text-fg"
          }`}
        >
          {value === v && (
            <motion.span
              layoutId="view-pill"
              className="absolute inset-0 rounded-lg bg-panel-3 shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
            />
          )}
          <span className="relative">{icon}</span>
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Main view ────────────────────────────────────────────────────────── */
export function TasksView({
  tasks,
  clients,
  currency,
  filters,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  filters: Filters;
}) {
  const router   = useRouter();
  const pathname = usePathname();

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [open, setOpen]         = useState(false);
  const [nonce, setNonce]       = useState(0);
  const [search, setSearch]     = useState(filters.q);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams({
      month: filters.month, type: filters.type,
      client: filters.client, status: filters.status, q: filters.q,
    });
    if (value && value !== "all") params.set(key, value); else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Debounced search
  useMemo(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setParam("q", search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totals = useMemo(() => {
    const od = tasks.filter(t => t.type === "on_demand");
    return {
      count: tasks.length,
      hours: od.reduce((s, t) => s + Number(t.hours ?? 0), 0),
      amount: od.reduce((s, t) => s + Number(t.amount), 0),
    };
  }, [tasks]);

  function openAdd() { setNonce(n => n + 1); setOpen(true); }

  return (
    <>
      {/* Filter bar */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-end gap-2.5">
          {[
            { label: FILTER.month,  node: <Input type="month" value={filters.month} onChange={e => setParam("month", e.target.value)} className="h-9" /> },
            { label: FILTER.type,   node:
              <Select value={filters.type} onChange={e => setParam("type", e.target.value)} className="h-9">
                <option value="all">{FILTER.all}</option>
                <option value="maintain">{TASK.type.maintain}</option>
                <option value="on_demand">{TASK.type.on_demand}</option>
              </Select>
            },
            { label: FILTER.client, node:
              <Select value={filters.client} onChange={e => setParam("client", e.target.value)} className="h-9">
                <option value="all">{FILTER.all}</option>
                <option value="none">{FILTER.none}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            },
            { label: FILTER.status, node:
              <Select value={filters.status} onChange={e => setParam("status", e.target.value)} className="h-9">
                <option value="all">{FILTER.all}</option>
                <option value="todo">{TASK.status.todo}</option>
                <option value="doing">{TASK.status.doing}</option>
                <option value="done">{TASK.status.done}</option>
              </Select>
            },
          ].map(({ label, node }) => (
            <div key={label} className="min-w-[130px]">
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted">{label}</label>
              {node}
            </div>
          ))}
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted">{FILTER.search}</label>
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={FILTER.searchPlaceholder} className="h-9 pl-8" />
            </div>
          </div>
        </div>
      </Card>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-mono text-fg">{totals.count}</span> tasks ·{" "}
          <span className="font-mono text-fg">{formatHours(totals.hours)}</span> on-demand ·{" "}
          <span className="font-mono text-teal">{formatMoney(totals.amount, currency)}</span>
        </p>
        <div className="flex items-center gap-2">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <Button variant="secondary" onClick={() => exportTasksToExcel(tasks, clients, currency, filters.month)} disabled={tasks.length === 0}>
            <Download size={15} /> {UI.export}
          </Button>
          <Button variant="primary" onClick={openAdd}>
            <Plus size={15} /> {TASK.addTask}
          </Button>
        </div>
      </div>

      {/* Content — animated transition between views */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
        >
          {viewMode === "table" ? (
            <TasksTable tasks={tasks} clients={clients} currency={currency} />
          ) : (
            <TasksGrouped tasks={tasks} clients={clients} currency={currency} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add task modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={TASK.addTask}>
        <TasksForm key={nonce} task={null} clients={clients} onDone={() => { setOpen(false); router.refresh(); }} />
      </Modal>
    </>
  );
}

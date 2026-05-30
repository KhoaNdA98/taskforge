"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Download, Search, Layers, Table2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Input, Select, Badge } from "@/components/ui";
import { Modal } from "@/components/modal";
import { BulkBar } from "@/components/bulk-bar";
import { formatMoney, formatHours, monthLabel } from "@/lib/format";
import { exportTasksToExcel } from "@/lib/export";
import { TASK, FILTER, UI } from "@/lib/strings";
import { type Client, type TaskWithClient, type TaskType, type TaskStatus, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import { TasksTable } from "./tasks-table";
import { TasksGrouped } from "./tasks-grouped";
import { TasksForm } from "./tasks-form";

type ViewMode = "table" | "list";
type GroupBy  = "status" | "client" | "type" | "none";
type Filters  = { month: string; type: string; client: string; status: string; q: string; view: string; group: string };

/* ── View toggle ──────────────────────────────────────────────────────── */
function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="relative flex items-center rounded-xl border border-border bg-panel-2 p-1 gap-0.5">
      {([ { v: "table" as ViewMode, icon: <Table2 size={15} />, label: "Table" },
          { v: "list"  as ViewMode, icon: <Layers size={15} />, label: "List"  },
      ] as const).map(({ v, icon, label }) => (
        <button key={v} onClick={() => onChange(v)}
          className={`relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${value === v ? "text-fg" : "text-muted hover:text-fg"}`}>
          {value === v && (
            <motion.span layoutId="view-pill"
              className="absolute inset-0 rounded-lg bg-panel-3 shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 36 }} />
          )}
          <span className="relative">{icon}</span>
          <span className="relative">{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Filter chip ──────────────────────────────────────────────────────── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 28 } }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent-soft px-2.5 py-1 font-mono text-xs text-accent-fg"
    >
      {label}
      <motion.button
        whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="ml-0.5 rounded text-accent/70 hover:text-accent-fg"
        aria-label="Remove filter"
      >
        <X size={11} />
      </motion.button>
    </motion.span>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
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

  // View + group-by — initialized from URL, persisted to URL
  const [viewMode, setViewMode] = useState<ViewMode>(
    (filters.view === "list" ? "list" : "table") as ViewMode
  );
  const [groupBy, setGroupBy] = useState<GroupBy>(
    (["status","client","type","none"].includes(filters.group) ? filters.group : "status") as GroupBy
  );

  const [open,   setOpen]   = useState(false);
  const [nonce,  setNonce]  = useState(0);
  const [search, setSearch] = useState(filters.q);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect    = useCallback((id: string) => setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const toggleSelectAll = useCallback(() => setSelectedIds(s => s.size === tasks.length ? new Set() : new Set(tasks.map(t => t.id))), [tasks]);
  const clearSelection  = useCallback(() => setSelectedIds(new Set()), []);

  // Clear selection when tasks change (filter change)
  useEffect(() => { clearSelection(); }, [filters.month, filters.type, filters.client, filters.status, filters.q, clearSelection]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams({
      month: filters.month, type: filters.type, client: filters.client,
      status: filters.status, q: filters.q,
      view: viewMode, group: groupBy,
    });
    if (value && value !== "all" && value !== "") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function changeView(v: ViewMode) {
    setViewMode(v);
    const params = new URLSearchParams({
      month: filters.month, type: filters.type, client: filters.client,
      status: filters.status, q: filters.q, group: groupBy,
    });
    params.set("view", v);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function changeGroup(g: GroupBy) {
    setGroupBy(g);
    const params = new URLSearchParams({
      month: filters.month, type: filters.type, client: filters.client,
      status: filters.status, q: filters.q, view: viewMode,
    });
    params.set("group", g);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Debounced search → URL
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setParam("q", search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totals = useMemo(() => {
    const od = tasks.filter(t => t.type === "on_demand");
    return { count: tasks.length, hours: od.reduce((s,t) => s+Number(t.hours??0), 0), amount: od.reduce((s,t) => s+Number(t.amount), 0) };
  }, [tasks]);

  // Active filter chips
  const chips = useMemo(() => {
    const list: { key: string; label: string; remove: () => void }[] = [];
    if (filters.type   !== "all") list.push({ key: "type",   label: `Type: ${TASK_TYPE_LABEL[filters.type as TaskType]}`,         remove: () => setParam("type",   "all") });
    if (filters.status !== "all") list.push({ key: "status", label: `Status: ${TASK_STATUS_LABEL[filters.status as TaskStatus]}`,  remove: () => setParam("status", "all") });
    if (filters.client !== "all" && filters.client !== "") {
      const name = clients.find(c => c.id === filters.client)?.name ?? (filters.client === "none" ? "Unassigned" : filters.client);
      list.push({ key: "client", label: `Client: ${name}`, remove: () => setParam("client", "all") });
    }
    if (filters.q) list.push({ key: "q", label: `"${filters.q}"`, remove: () => { setSearch(""); setParam("q", ""); } });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, clients]);

  const bulkList = useMemo(() => [...selectedIds], [selectedIds]);

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="mb-3 rounded-2xl border border-border bg-panel/80 backdrop-blur-sm p-3">
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
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={FILTER.searchPlaceholder} className="h-9 pl-8" />
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        <AnimatePresence initial={false}>
          {chips.length > 0 && (
            <motion.div
              layout
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: { type: "spring", stiffness: 300, damping: 28 } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.18 } }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border-soft pt-2.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Active:</span>
                <AnimatePresence>
                  {chips.map(chip => (
                    <FilterChip key={chip.key} label={chip.label} onRemove={chip.remove} />
                  ))}
                </AnimatePresence>
                <motion.button
                  layout
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setSearch(""); router.push(`${pathname}?month=${filters.month}&view=${viewMode}&group=${groupBy}`); }}
                  className="ml-1 font-mono text-[11px] text-muted underline-offset-2 hover:text-rose hover:underline"
                >
                  {FILTER.clearAll}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-mono text-fg">{totals.count}</span> tasks ·{" "}
          <span className="font-mono text-fg">{formatHours(totals.hours)}</span> on-demand ·{" "}
          <span className="font-mono text-teal">{formatMoney(totals.amount, currency)}</span>
          {selectedIds.size > 0 && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-2 font-mono text-accent-fg"
            >
              · {selectedIds.size} selected
            </motion.span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <ViewToggle value={viewMode} onChange={changeView} />
          <Button variant="secondary" onClick={() => exportTasksToExcel(tasks, clients, currency, filters.month)} disabled={tasks.length === 0}>
            <Download size={15} /> {UI.export}
          </Button>
          <Button variant="primary" onClick={() => { setNonce(n => n+1); setOpen(true); }}>
            <Plus size={15} /> {TASK.addTask}
          </Button>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.14 } }}
        >
          {viewMode === "table" ? (
            <TasksTable
              tasks={tasks}
              clients={clients}
              currency={currency}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />
          ) : (
            <TasksGrouped
              tasks={tasks}
              clients={clients}
              currency={currency}
              initialGroupBy={groupBy}
              onGroupByChange={changeGroup}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Add task modal ──────────────────────────────────────────────── */}
      <Modal open={open} onClose={() => setOpen(false)} title={TASK.addTask}>
        <TasksForm key={nonce} task={null} clients={clients} onDone={() => { setOpen(false); router.refresh(); }} />
      </Modal>

      {/* ── Floating bulk bar ───────────────────────────────────────────── */}
      <AnimatePresence>
        {bulkList.length > 0 && (
          <BulkBar
            selectedIds={bulkList}
            clients={clients}
            onClear={clearSelection}
            onDone={() => { clearSelection(); router.refresh(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

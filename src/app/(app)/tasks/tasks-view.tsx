"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Download, Search, Layers, Table2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { BulkBar } from "@/components/bulk-bar";
import { formatMoney, formatHours } from "@/lib/format";
import { exportTasksToExcel } from "@/lib/export";
import { TASK, FILTER, UI } from "@/lib/strings";
import { type Client, type TaskWithClient, type TaskType, type TaskStatus, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import { TasksTable } from "./tasks-table";
import { TasksGrouped } from "./tasks-grouped";
import { TasksForm } from "./tasks-form";

type ViewMode = "table" | "list";
type GroupBy  = "status" | "client" | "type" | "none";
type Filters  = { month: string; type: string; client: string; status: string; q: string; view: string; group: string };

/* ── Shared compact field class ──────────────────────────────────────── */
const compact = [
  "h-8 rounded-lg border border-border bg-panel px-2.5 text-sm text-fg",
  "outline-none transition-shadow focus:ring-2 focus:ring-accent/30",
].join(" ");

/* ── View toggle ──────────────────────────────────────────────────────── */
function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-panel-2 p-0.5 gap-0.5">
      {([
        { v: "table" as ViewMode, icon: <Table2 size={14} />, label: "Table" },
        { v: "list"  as ViewMode, icon: <Layers size={14} />, label: "List"  },
      ] as const).map(({ v, icon, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === v ? "text-fg" : "text-muted hover:text-fg"
          }`}
        >
          {value === v && (
            <motion.span
              layoutId="view-pill"
              className="absolute inset-0 rounded-md bg-panel-3 shadow-sm"
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

/* ── Filter chip ──────────────────────────────────────────────────────── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 28 } }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.1 } }}
      className="inline-flex items-center gap-1 rounded-lg border border-accent/20 bg-accent-soft px-2 py-1 font-mono text-[11px] text-accent-fg"
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded text-accent/60 hover:text-accent-fg"
        aria-label="Remove filter"
      >
        <X size={10} />
      </button>
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

  const [viewMode, setViewMode] = useState<ViewMode>(
    (filters.view === "list" ? "list" : "table") as ViewMode,
  );
  const [groupBy, setGroupBy] = useState<GroupBy>(
    (["status","client","type","none"].includes(filters.group) ? filters.group : "status") as GroupBy,
  );

  const [open,   setOpen]   = useState(false);
  const [nonce,  setNonce]  = useState(0);
  const [search, setSearch] = useState(filters.q);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect    = useCallback((id: string) => setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const toggleSelectAll = useCallback(() => setSelectedIds(s => s.size === tasks.length ? new Set() : new Set(tasks.map(t => t.id))), [tasks]);
  const clearSelection  = useCallback(() => setSelectedIds(new Set()), []);

  useEffect(() => { clearSelection(); }, [filters.month, filters.type, filters.client, filters.status, filters.q, clearSelection]);

  function buildParams(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      month: filters.month, type: filters.type, client: filters.client,
      status: filters.status, q: filters.q, view: viewMode, group: groupBy,
      ...overrides,
    }).toString();
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams({
      month: filters.month, type: filters.type, client: filters.client,
      status: filters.status, q: filters.q, view: viewMode, group: groupBy,
    });
    if (value && value !== "all" && value !== "") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function changeView(v: ViewMode) {
    setViewMode(v);
    router.replace(`${pathname}?${buildParams({ view: v })}`, { scroll: false });
  }

  function changeGroup(g: GroupBy) {
    setGroupBy(g);
    router.replace(`${pathname}?${buildParams({ group: g })}`, { scroll: false });
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
    return {
      count:  tasks.length,
      hours:  od.reduce((s, t) => s + Number(t.hours ?? 0), 0),
      amount: od.reduce((s, t) => s + Number(t.amount), 0),
    };
  }, [tasks]);

  const chips = useMemo(() => {
    const list: { key: string; label: string; remove: () => void }[] = [];
    if (filters.type   !== "all") list.push({ key: "type",   label: TASK_TYPE_LABEL[filters.type as TaskType],           remove: () => setParam("type",   "all") });
    if (filters.status !== "all") list.push({ key: "status", label: TASK_STATUS_LABEL[filters.status as TaskStatus],     remove: () => setParam("status", "all") });
    if (filters.client !== "all" && filters.client !== "") {
      const name = clients.find(c => c.id === filters.client)?.name ?? (filters.client === "none" ? "No client" : filters.client);
      list.push({ key: "client", label: name, remove: () => setParam("client", "all") });
    }
    if (filters.q) list.push({ key: "q", label: `"${filters.q}"`, remove: () => { setSearch(""); setParam("q", ""); } });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, clients]);

  const bulkList = useMemo(() => [...selectedIds], [selectedIds]);

  return (
    <>
      {/* ── Filter strip ───────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {/* Month */}
        <input
          type="month"
          value={filters.month}
          onChange={e => setParam("month", e.target.value)}
          className={`${compact} font-mono`}
        />

        {/* Type */}
        <select
          value={filters.type}
          onChange={e => setParam("type", e.target.value)}
          className={`${compact} cursor-pointer appearance-none pr-7`}
        >
          <option value="all">All types</option>
          <option value="maintain">{TASK.type.maintain}</option>
          <option value="on_demand">{TASK.type.on_demand}</option>
        </select>

        {/* Client */}
        <select
          value={filters.client}
          onChange={e => setParam("client", e.target.value)}
          className={`${compact} cursor-pointer appearance-none pr-7`}
        >
          <option value="all">All clients</option>
          <option value="none">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={e => setParam("status", e.target.value)}
          className={`${compact} cursor-pointer appearance-none pr-7`}
        >
          <option value="all">All statuses</option>
          <option value="todo">{TASK.status.todo}</option>
          <option value="doing">{TASK.status.doing}</option>
          <option value="done">{TASK.status.done}</option>
        </select>

        {/* Search */}
        <div className="relative min-w-[160px] flex-1">
          <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={FILTER.searchPlaceholder}
            className={`${compact} w-full pl-7`}
          />
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {chips.map(chip => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.remove} />
          ))}
        </AnimatePresence>

        {chips.length > 1 && (
          <button
            onClick={() => { setSearch(""); router.push(`${pathname}?month=${filters.month}&view=${viewMode}&group=${groupBy}`); }}
            className="text-[11px] text-muted hover:text-rose transition-colors"
          >
            {FILTER.clearAll}
          </button>
        )}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>
            <span className="font-mono font-medium text-fg">{totals.count}</span> tasks
          </span>
          {totals.hours > 0 && (
            <span>
              <span className="font-mono text-fg">{formatHours(totals.hours)}</span> on-demand
            </span>
          )}
          {totals.amount > 0 && (
            <span className="font-mono font-medium text-teal">{formatMoney(totals.amount, currency)}</span>
          )}
          {selectedIds.size > 0 && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-mono text-accent-fg"
            >
              · {selectedIds.size} selected
            </motion.span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ViewToggle value={viewMode} onChange={changeView} />
          <Button
            variant="secondary"
            onClick={() => exportTasksToExcel(tasks, clients, currency, filters.month)}
            disabled={tasks.length === 0}
          >
            <Download size={14} /> {UI.export}
          </Button>
          <Button variant="primary" onClick={() => { setNonce(n => n + 1); setOpen(true); }}>
            <Plus size={14} /> {TASK.addTask}
          </Button>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
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
        <TasksForm
          key={nonce}
          task={null}
          clients={clients}
          onDone={() => { setOpen(false); router.refresh(); }}
        />
      </Modal>

      {/* ── Bulk bar ───────────────────────────────────────────────────── */}
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

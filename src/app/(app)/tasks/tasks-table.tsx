"use client";

import { useRef, useState, useTransition, useOptimistic, useCallback, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Pencil } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { EditableText, EditableNumber, EditableDate, EditableSelect } from "./inline-cell";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { formatMoney, formatDate, toDateInput } from "@/lib/format";
import { TASK, FILTER } from "@/lib/strings";
import { fadeUp } from "@/lib/motion";
import { type Client, type TaskWithClient, type TaskType, type TaskStatus, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import { updateTaskField, quickAddTask, deleteTask } from "./actions";
import { TasksForm } from "./tasks-form";

/* ── Sort state ──────────────────────────────────────────────────────── */
type SortKey = "task_date" | "name" | "type" | "status" | "hours" | "amount";
type SortDir = "asc" | "desc";

function sortTasks(tasks: TaskWithClient[], key: SortKey, dir: SortDir) {
  return [...tasks].sort((a, b) => {
    let av: string | number = "", bv: string | number = "";
    if (key === "task_date") { av = a.task_date; bv = b.task_date; }
    else if (key === "name")   { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    else if (key === "type")   { av = a.type; bv = b.type; }
    else if (key === "status") { av = a.status; bv = b.status; }
    else if (key === "hours")  { av = Number(a.hours ?? 0); bv = Number(b.hours ?? 0); }
    else if (key === "amount") { av = Number(a.amount); bv = Number(b.amount); }
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

/* ── Optimistic action types ─────────────────────────────────────────── */
type OptAction =
  | { type: "UPDATE"; id: string; updates: Partial<TaskWithClient> }
  | { type: "DELETE"; id: string };

/* ── Main component ──────────────────────────────────────────────────── */
export function TasksTable({
  tasks: initialTasks,
  clients,
  currency,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  const router  = useRouter();
  const toast   = useToast();
  const { confirm } = useConfirm();

  const [sort,    setSort]    = useState<{ key: SortKey; dir: SortDir }>({ key: "task_date", dir: "desc" });
  const [editModal, setEditModal] = useState<TaskWithClient | null>(null);
  const [addNonce, setAddNonce]   = useState(0);

  const [optimisticTasks, dispatch] = useOptimistic(
    initialTasks,
    (state: TaskWithClient[], action: OptAction) => {
      if (action.type === "UPDATE")
        return state.map(t => t.id === action.id ? { ...t, ...action.updates } : t);
      if (action.type === "DELETE")
        return state.filter(t => t.id !== action.id);
      return state;
    },
  );

  const [, startTransition] = useTransition();

  /* Save a field change optimistically */
  const saveField = useCallback(
    (task: TaskWithClient, updates: Parameters<typeof updateTaskField>[1]) => {
      // Compute derived amount client-side for optimistic display
      const next = { ...task, ...updates } as TaskWithClient;
      if ("hours" in updates || "rate_snapshot" in updates) {
        (next as TaskWithClient).amount = Number(next.hours ?? 0) * Number(next.rate_snapshot);
      }
      startTransition(async () => {
        dispatch({ type: "UPDATE", id: task.id, updates: next });
        const { error } = await updateTaskField(task.id, updates);
        if (error) {
          toast.error(`Failed to save: ${error}`);
          router.refresh(); // rollback via server state
        }
      });
    },
    [dispatch, router, toast],
  );

  /* Delete */
  const onDelete = useCallback(async (t: TaskWithClient) => {
    const ok = await confirm({ title: TASK.deleteConfirm(t.name), detail: TASK.deleteConfirmDetail });
    if (!ok) return;
    startTransition(async () => {
      dispatch({ type: "DELETE", id: t.id });
      await deleteTask(t.id);
      toast.success("Task deleted.");
    });
  }, [confirm, dispatch, toast]);

  const sorted = sortTasks(optimisticTasks, sort.key, sort.dir);

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "task_date" ? "desc" : "asc" }
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-panel-2/60">
                {/* Bulk checkbox */}
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && sorted.every(t => selectedIds.has(t.id))}
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
                    aria-label="Select all"
                  />
                </th>
                {(
                  [
                    { key: "task_date", label: "Date",   align: "left"  },
                    { key: "name",      label: "Task",   align: "left"  },
                    { key: "type",      label: "Type",   align: "left"  },
                    { key: null,        label: "Client", align: "left"  },
                    { key: "status",    label: "Status", align: "left"  },
                    { key: "hours",     label: "Hours",  align: "right" },
                    { key: "amount",    label: "Amount", align: "right" },
                    { key: null,        label: "",       align: "right" },
                  ] as const
                ).map(({ key, label, align }) => (
                  <th
                    key={label}
                    className={`px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-widest text-muted${align === "right" ? " text-right" : ""}`}
                  >
                    {key ? (
                      <button
                        onClick={() => toggleSort(key as SortKey)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-fg"
                      >
                        {label}
                        <SortIcon active={sort.key === key} dir={sort.dir} />
                      </button>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>

            <motion.tbody layout>
              <AnimatePresence initial={false}>
                {sorted.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    clients={clients}
                    currency={currency}
                    selected={selectedIds.has(task.id)}
                    onToggleSelect={() => onToggleSelect(task.id)}
                    onSaveField={(updates) => saveField(task, updates)}
                    onEdit={() => setEditModal(task)}
                    onDelete={() => onDelete(task)}
                  />
                ))}
              </AnimatePresence>

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title={TASK.empty.title} />
                  </td>
                </tr>
              )}

              {/* Quick-add row */}
              <QuickAddRow
                key={addNonce}
                clients={clients}
                onAdded={() => { setAddNonce(n => n + 1); router.refresh(); }}
              />
            </motion.tbody>
          </table>
        </div>
      </Card>

      {/* Full-edit modal */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={TASK.editTask}
      >
        {editModal && (
          <TasksForm
            task={editModal}
            clients={clients}
            onDone={() => { setEditModal(null); router.refresh(); }}
          />
        )}
      </Modal>
    </>
  );
}

/* ── Sort icon ───────────────────────────────────────────────────────── */
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={11} className="opacity-40" />;
  return dir === "asc"
    ? <ArrowUp   size={11} className="text-accent" />
    : <ArrowDown size={11} className="text-accent" />;
}

/* ── Task row ────────────────────────────────────────────────────────── */
function TaskRow({
  task,
  clients,
  currency,
  selected,
  onToggleSelect,
  onSaveField,
  onEdit,
  onDelete,
}: {
  task: TaskWithClient;
  clients: Client[];
  currency: string;
  selected: boolean;
  onToggleSelect: () => void;
  onSaveField: (updates: Parameters<typeof updateTaskField>[1]) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const clientOptions = [
    { value: "", label: TASK.fields.unassigned },
    ...clients.map(c => ({ value: c.id, label: c.name })),
  ];

  const typeOptions: { value: TaskType; label: string }[] = [
    { value: "on_demand", label: TASK.type.on_demand },
    { value: "maintain",  label: TASK.type.maintain  },
  ];

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: "todo",  label: TASK.status.todo  },
    { value: "doing", label: TASK.status.doing },
    { value: "done",  label: TASK.status.done  },
  ];

  const statusTone = { todo: "muted", doing: "amber", done: "teal" } as const;
  const typeTone   = { on_demand: "teal", maintain: "accent" }       as const;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
      className={`group border-b border-border-soft last:border-0 transition-colors ${selected ? "bg-accent-soft/30 hover:bg-accent-soft/40" : "hover:bg-panel-2/40"}`}
    >
      {/* Checkbox */}
      <td className="w-10 px-3 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer accent-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100 data-[checked]:opacity-100"
          data-checked={selected || undefined}
          aria-label="Select task"
        />
      </td>

      {/* Date */}
      <td className="px-4 py-2">
        <EditableDate
          value={task.task_date}
          formatFn={v => formatDate(v).slice(0, 5)}
          onSave={v => onSaveField({ task_date: v })}
        />
      </td>

      {/* Name */}
      <td className="px-4 py-2 min-w-[200px]">
        <EditableText
          value={task.name}
          bold
          onSave={v => onSaveField({ name: v })}
        />
        {task.note && (
          <p className="mt-0.5 line-clamp-1 pl-2 text-xs text-muted">{task.note}</p>
        )}
      </td>

      {/* Type */}
      <td className="px-4 py-2">
        <EditableSelect<TaskType>
          value={task.type}
          options={typeOptions}
          renderValue={v => <Badge tone={typeTone[v]}>{TASK_TYPE_LABEL[v]}</Badge>}
          onSave={v => onSaveField({ type: v, hours: v === "maintain" ? null : (task.hours ?? 0) })}
        />
      </td>

      {/* Client */}
      <td className="px-4 py-2">
        <EditableSelect<string>
          value={task.client_id ?? ""}
          options={clientOptions}
          renderValue={v => (
            <span className="text-fg-2">
              {clients.find(c => c.id === v)?.name ?? <span className="text-muted">—</span>}
            </span>
          )}
          onSave={v => onSaveField({ client_id: v || null })}
        />
      </td>

      {/* Status */}
      <td className="px-4 py-2">
        <EditableSelect<TaskStatus>
          value={task.status}
          options={statusOptions}
          renderValue={v => <Badge tone={statusTone[v]}>{TASK_STATUS_LABEL[v]}</Badge>}
          onSave={v => onSaveField({ status: v })}
        />
      </td>

      {/* Hours */}
      <td className="px-4 py-2 text-right">
        {task.type === "on_demand" ? (
          <EditableNumber
            value={task.hours}
            step={0.25}
            min={0}
            onSave={v => onSaveField({ hours: v })}
          />
        ) : (
          <span className="px-2 text-muted">—</span>
        )}
      </td>

      {/* Amount */}
      <td className="px-4 py-2 text-right font-mono text-sm">
        {task.type === "on_demand"
          ? <span className="text-fg">{formatMoney(task.amount, currency)}</span>
          : <span className="text-muted">—</span>
        }
      </td>

      {/* Actions */}
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="tf-ring rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-fg"
            aria-label="Edit"
          >
            <Pencil size={13} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="tf-ring rounded-lg p-1.5 text-muted hover:bg-rose-soft hover:text-rose"
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
}

/* ── Quick-add row ───────────────────────────────────────────────────── */
function QuickAddRow({
  clients,
  onAdded,
}: {
  clients: Client[];
  onAdded: () => void;
}) {
  const [active, setActive]   = useState(false);
  const [name,   setName]     = useState("");
  const [clientId, setClientId] = useState("");
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function activate() { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) { setActive(false); return; }
    startTransition(async () => {
      const { error } = await quickAddTask(trimmed, clientId || null);
      if (error) { toast.error(`Failed: ${error}`); return; }
      setName(""); setClientId("");
      onAdded();
      // keep row active for rapid entry
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter")  submit();
    if (e.key === "Escape") { setActive(false); setName(""); }
  }

  return (
    <tr className="border-t border-dashed border-border hover:bg-panel-2/30 transition-colors">
      <td colSpan={2} className="px-4 py-2">
        {active ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={onKey}
              onBlur={() => { if (!name.trim()) setActive(false); }}
              placeholder="Task name… (Enter to save, Esc to cancel)"
              disabled={pending}
              className="flex-1 rounded-lg border border-accent/50 bg-panel-2 px-2 py-1 text-sm text-fg outline-none ring-2 ring-accent/30 placeholder:text-muted"
            />
          </div>
        ) : (
          <button
            onClick={activate}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-fg"
          >
            <Plus size={14} />
            New task
          </button>
        )}
      </td>
      {active && (
        <>
          <td className="px-4 py-2">
            <span className="rounded-lg border border-border bg-panel-2 px-2 py-1 text-xs text-muted">On-demand</span>
          </td>
          <td className="px-4 py-2">
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-panel-2 px-2 py-1 text-sm text-fg outline-none"
            >
              <option value="">{TASK.fields.unassigned}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </td>
          <td colSpan={4} />
        </>
      )}
      {!active && <td colSpan={6} />}
    </tr>
  );
}

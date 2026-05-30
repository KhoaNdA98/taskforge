"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Pencil, Trash2, Download, Search, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Input, Textarea, Select, Field, Card, Badge, EmptyState } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { formatMoney, formatHours, formatDate, toDateInput, monthLabel } from "@/lib/format";
import { exportTasksToExcel } from "@/lib/export";
import { TASK, FILTER, UI } from "@/lib/strings";
import { fadeUp, staggerContainer, gentle } from "@/lib/motion";
import {
  type Client, type TaskWithClient, type TaskType,
  TASK_TYPE_LABEL, TASK_STATUS_LABEL,
} from "@/lib/types";
import { saveTask, deleteTask, type TaskActionState } from "./actions";

type Filters = { month: string; type: string; client: string; status: string; q: string };

export function TasksView({
  tasks, clients, currency, filters,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  filters: Filters;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const toast    = useToast();
  const { confirm } = useConfirm();
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<TaskWithClient | null>(null);
  const [nonce, setNonce]     = useState(0);
  const [, startTransition]   = useTransition();
  const [search, setSearch]   = useState(filters.q);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams({ month: filters.month, type: filters.type, client: filters.client, status: filters.status, q: filters.q });
    if (value && value !== "all") params.set(key, value); else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
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

  function openAdd()             { setEditing(null);  setNonce(n => n+1); setOpen(true); }
  function openEdit(t: TaskWithClient) { setEditing(t); setNonce(n => n+1); setOpen(true); }
  function onDone()              { setOpen(false); router.refresh(); }

  async function onDelete(t: TaskWithClient) {
    const ok = await confirm({ title: TASK.deleteConfirm(t.name), detail: TASK.deleteConfirmDetail });
    if (!ok) return;
    startTransition(async () => {
      await deleteTask(t.id);
      toast.success(`Task deleted.`);
      router.refresh();
    });
  }

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
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={FILTER.searchPlaceholder} className="h-9 pl-8" />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary + actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-mono text-fg">{totals.count}</span> tasks ·{" "}
          <span className="font-mono text-fg">{formatHours(totals.hours)}</span> on-demand ·{" "}
          <span className="font-mono text-teal">{formatMoney(totals.amount, currency)}</span>
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportTasksToExcel(tasks, clients, currency, filters.month)} disabled={tasks.length === 0}>
            <Download size={16} /> {UI.export}
          </Button>
          <Button variant="primary" onClick={openAdd}>
            <Plus size={16} /> {TASK.addTask}
          </Button>
        </div>
      </div>

      {/* Table */}
      {tasks.length === 0 ? (
        <Card>
          <EmptyState icon={<ListTodo size={28} />} title={TASK.empty.title}
            description={TASK.empty.description(monthLabel(filters.month))} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-widest text-muted">
                  {["Date","Task","Type","Client","Status","Hours","Amount",""].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium${h === "Hours" || h === "Amount" ? " text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <motion.tbody variants={staggerContainer(0.03)} initial="initial" animate="animate">
                {tasks.map((t) => (
                  <motion.tr
                    key={t.id}
                    variants={fadeUp}
                    className="group border-b border-border-soft last:border-0 hover:bg-panel-2/40 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{formatDate(t.task_date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{t.name}</p>
                      {t.note && <p className="line-clamp-1 text-xs text-muted">{t.note}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={t.type === "maintain" ? "accent" : "teal"}>{TASK_TYPE_LABEL[t.type]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-fg-2">{t.client?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={t.status === "done" ? "teal" : t.status === "doing" ? "amber" : "muted"}>
                        {TASK_STATUS_LABEL[t.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted">
                      {t.type === "on_demand" ? formatHours(t.hours) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-fg">
                      {t.type === "on_demand" ? formatMoney(t.amount, currency) : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(t)}
                          className="tf-ring rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-fg" aria-label="Edit">
                          <Pencil size={14} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => onDelete(t)}
                          className="tf-ring rounded-lg p-1.5 text-muted hover:bg-rose-soft hover:text-rose" aria-label="Delete">
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? TASK.editTask : TASK.addTask}>
        <TaskForm key={`${editing?.id ?? "new"}-${nonce}`} task={editing} clients={clients} onDone={onDone} />
      </Modal>
    </>
  );
}

function TaskForm({ task, clients, onDone }: { task: TaskWithClient | null; clients: Client[]; onDone: () => void }) {
  const toast = useToast();
  const [state, action, pending] = useActionState<TaskActionState, FormData>(saveTask, {});
  const [type, setType] = useState<TaskType>(task?.type ?? "on_demand");

  useEffect(() => {
    if (state.ok) {
      toast.success(task ? "Task updated." : "Task added.");
      onDone();
    }
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}

      <Field label={TASK.fields.name}>
        <Input name="name" defaultValue={task?.name ?? ""} placeholder={TASK.fields.namePlaceholder} required autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={TASK.fields.type}>
          <Select name="type" value={type} onChange={e => setType(e.target.value as TaskType)}>
            <option value="on_demand">{TASK.type.on_demand}</option>
            <option value="maintain">{TASK.type.maintain}</option>
          </Select>
        </Field>
        <Field label={TASK.fields.date}>
          <Input name="task_date" type="date" defaultValue={task ? toDateInput(task.task_date) : toDateInput()} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={TASK.fields.client}>
          <Select name="client_id" defaultValue={task?.client_id ?? ""}>
            <option value="">{TASK.fields.unassigned}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label={TASK.fields.status}>
          <Select name="status" defaultValue={task?.status ?? "todo"}>
            <option value="todo">{TASK.status.todo}</option>
            <option value="doing">{TASK.status.doing}</option>
            <option value="done">{TASK.status.done}</option>
          </Select>
        </Field>
      </div>

      {type === "on_demand" && (
        <Field label={TASK.fields.hours} hint={TASK.fields.hoursHint}>
          <Input name="hours" type="number" min={0} step={0.25} defaultValue={task?.hours ?? ""} placeholder={TASK.fields.hoursPlaceholder} className="font-mono" />
        </Field>
      )}

      <Field label={TASK.fields.note}>
        <Textarea name="note" defaultValue={task?.note ?? ""} />
      </Field>

      <AnimatePresence>
        {state.error && <motion.p {...fadeUp} className="text-sm text-rose">{state.error}</motion.p>}
      </AnimatePresence>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? TASK.saving : TASK.saveTask}
        </Button>
      </div>
    </form>
  );
}

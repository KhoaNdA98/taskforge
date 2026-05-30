"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ListTodo } from "lucide-react";
import { motion } from "motion/react";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { formatMoney, formatHours, formatDate, monthLabel } from "@/lib/format";
import { TASK } from "@/lib/strings";
import { TASK_TYPE_LABEL as TYPE_LABEL, TASK_STATUS_LABEL as STATUS_LABEL } from "@/lib/types";
import { type Client, type TaskWithClient } from "@/lib/types";
import { deleteTask } from "./actions";
import { TasksForm } from "./tasks-form";

type Filters = { month: string; type: string; client: string; status: string; q: string };

export function TasksList({
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
  const router       = useRouter();
  const toast        = useToast();
  const { confirm }  = useConfirm();
  const [editing, setEditing]     = useState<TaskWithClient | null>(null);
  const [, startTransition]       = useTransition();

  async function onDelete(t: TaskWithClient) {
    const ok = await confirm({ title: TASK.deleteConfirm(t.name), detail: TASK.deleteConfirmDetail });
    if (!ok) return;
    startTransition(async () => {
      await deleteTask(t.id);
      toast.success("Task deleted.");
      router.refresh();
    });
  }

  const statusTone = { todo: "muted", doing: "amber", done: "teal" } as const;
  const typeTone   = { on_demand: "teal", maintain: "accent" }       as const;

  if (tasks.length === 0) {
    return (
      <Card>
        <EmptyState icon={<ListTodo size={28} />} title={TASK.empty.title}
          description={TASK.empty.description(monthLabel(filters.month))} />
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-panel-2/60 text-left font-mono text-[11px] uppercase tracking-widest text-muted">
                {["Date","Task","Type","Client","Status","Hours","Amount",""].map(h => (
                  <th key={h} className={`px-4 py-2.5 font-medium${h === "Hours" || h === "Amount" ? " text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 30, 300) / 1000, type: "spring", stiffness: 300, damping: 28 } }}
                  className="group border-b border-border-soft last:border-0 hover:bg-panel-2/40 transition-colors"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{formatDate(t.task_date).slice(0, 5)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{t.name}</p>
                    {t.note && <p className="line-clamp-1 text-xs text-muted">{t.note}</p>}
                  </td>
                  <td className="px-4 py-3"><Badge tone={typeTone[t.type]}>{TYPE_LABEL[t.type]}</Badge></td>
                  <td className="px-4 py-3 text-sm text-fg-2">{t.client?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone[t.status]}>{STATUS_LABEL[t.status]}</Badge></td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-fg-2">{t.type === "on_demand" ? formatHours(t.hours) : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-fg">{t.type === "on_demand" ? formatMoney(t.amount, currency) : "—"}</td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setEditing(t)}
                        className="tf-ring rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-fg" aria-label="Edit">
                        <Pencil size={13} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(t)}
                        className="tf-ring rounded-lg p-1.5 text-muted hover:bg-rose-soft hover:text-rose" aria-label="Delete">
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={TASK.editTask}>
        {editing && (
          <TasksForm task={editing} clients={clients}
            onDone={() => { setEditing(null); router.refresh(); }} />
        )}
      </Modal>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, ChevronDown, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { gentle } from "@/lib/motion";
import { TASK_STATUS_LABEL } from "@/lib/types";
import type { Client, TaskStatus } from "@/lib/types";
import { bulkUpdateTasks, bulkDeleteTasks } from "@/app/(app)/tasks/actions";

interface BulkBarProps {
  selectedIds: string[];
  clients: Client[];
  onClear: () => void;
  onDone: () => void;
}

export function BulkBar({ selectedIds, clients, onClear, onDone }: BulkBarProps) {
  const toast        = useToast();
  const { confirm }  = useConfirm();
  const [pending, startTransition] = useTransition();
  const [statusOpen,  setStatusOpen]  = useState(false);
  const [clientOpen,  setClientOpen]  = useState(false);

  const count = selectedIds.length;

  async function setStatus(status: TaskStatus) {
    setStatusOpen(false);
    startTransition(async () => {
      const { error } = await bulkUpdateTasks(selectedIds, { status });
      if (error) { toast.error(`Update failed: ${error}`); return; }
      toast.success(`${count} task${count > 1 ? "s" : ""} moved to ${TASK_STATUS_LABEL[status]}.`);
      onDone();
    });
  }

  async function setClient(clientId: string | null) {
    setClientOpen(false);
    startTransition(async () => {
      const { error } = await bulkUpdateTasks(selectedIds, { client_id: clientId });
      if (error) { toast.error(`Update failed: ${error}`); return; }
      toast.success(`${count} task${count > 1 ? "s" : ""} reassigned.`);
      onDone();
    });
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${count} task${count > 1 ? "s" : ""}?`,
      detail: "This action cannot be undone.",
      confirmLabel: "Delete all",
    });
    if (!ok) return;
    startTransition(async () => {
      const { error } = await bulkDeleteTasks(selectedIds);
      if (error) { toast.error(`Delete failed: ${error}`); return; }
      toast.success(`${count} task${count > 1 ? "s" : ""} deleted.`);
      onDone();
    });
  }

  const statuses: TaskStatus[] = ["todo", "doing", "done"];
  const statusTone = { todo: "text-fg-2", doing: "text-amber", done: "text-teal" } as const;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: gentle }}
      exit={{ y: 80, opacity: 0, transition: { duration: 0.2 } }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-border tf-glass px-4 py-3 shadow-2xl shadow-black/20">
        {/* Count */}
        <div className="flex items-center gap-2 border-r border-border pr-3">
          <CheckSquare size={15} className="text-accent" />
          <span className="font-mono text-sm font-semibold text-fg">{count}</span>
          <span className="text-sm text-muted">selected</span>
        </div>

        {/* Set status */}
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => { setStatusOpen(o => !o); setClientOpen(false); }}
          >
            Status <ChevronDown size={13} className={`transition-transform ${statusOpen ? "rotate-180" : ""}`} />
          </Button>
          <AnimatePresence>
            {statusOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: gentle }}
                exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
                className="absolute bottom-full mb-2 min-w-[140px] rounded-xl border border-border tf-glass p-1 shadow-xl"
              >
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-panel-2 ${statusTone[s]}`}
                  >
                    {TASK_STATUS_LABEL[s]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Assign client */}
        {clients.length > 0 && (
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => { setClientOpen(o => !o); setStatusOpen(false); }}
            >
              Client <ChevronDown size={13} className={`transition-transform ${clientOpen ? "rotate-180" : ""}`} />
            </Button>
            <AnimatePresence>
              {clientOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: gentle }}
                  exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
                  className="absolute bottom-full mb-2 min-w-[160px] rounded-xl border border-border tf-glass p-1 shadow-xl"
                >
                  <button
                    onClick={() => setClient(null)}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-panel-2"
                  >
                    Unassign
                  </button>
                  {clients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setClient(c.id)}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-fg transition-colors hover:bg-panel-2"
                    >
                      {c.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Delete */}
        <Button variant="danger" size="sm" disabled={pending} onClick={handleDelete}>
          <Trash2 size={13} />
        </Button>

        {/* Divider + clear */}
        <div className="border-l border-border pl-2">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClear}
            className="tf-ring rounded-lg p-1.5 text-muted hover:text-fg"
            aria-label="Clear selection"
          >
            <X size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

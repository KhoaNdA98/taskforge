"use client";

import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatMoney, formatHours, formatDate } from "@/lib/format";
import { type TaskWithClient, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import type { Client } from "@/lib/types";
import { fluid } from "@/lib/motion";

type GroupBy = "status" | "client" | "type" | "none";

/* ── Static card ─────────────────────────────────────────────────────── */
export const TaskCardStatic = forwardRef<
  HTMLDivElement,
  {
    task: TaskWithClient;
    clients: Client[];
    currency: string;
    groupBy: GroupBy;
    overlay?: boolean;
    selected?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    style?: React.CSSProperties;
    className?: string;
  }
>(function TaskCardStatic(
  { task, clients, currency, groupBy, overlay, selected, onEdit, onDelete, style, className },
  ref,
) {
  const statusTone = { todo: "muted",     doing: "amber", done: "teal"   } as const;
  const typeTone   = { on_demand: "teal", maintain: "accent"             } as const;
  const clientName = clients.find(c => c.id === task.client_id)?.name;

  return (
    <div
      ref={ref}
      style={style}
      className={`
        group/card relative rounded-xl border p-3 select-none
        transition-colors duration-150
        ${overlay
          ? "rotate-[1.5deg] scale-[1.04] border-accent/40 bg-panel shadow-2xl shadow-accent/20 ring-1 ring-accent/25"
          : selected
            ? "border-accent/35 bg-accent-soft/20"
            : "border-border bg-panel/90 backdrop-blur-sm"}
        ${className ?? ""}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div className={`mt-0.5 shrink-0 cursor-grab text-muted ${overlay ? "opacity-50" : "opacity-0 transition-opacity group-hover/card:opacity-50"}`}>
          <GripVertical size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{task.name}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {groupBy !== "type"   && <Badge tone={typeTone[task.type]}>{TASK_TYPE_LABEL[task.type]}</Badge>}
            {groupBy !== "status" && <Badge tone={statusTone[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>}
            {groupBy !== "client" && clientName && (
              <span className="font-mono text-[11px] text-muted">{clientName}</span>
            )}
            <span className="font-mono text-[11px] text-muted">{formatDate(task.task_date).slice(0, 5)}</span>
          </div>

          {task.type === "on_demand" && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-mono text-xs text-fg-2">{formatHours(task.hours)}</span>
              <span className="font-mono text-xs font-medium text-teal">{formatMoney(task.amount, currency)}</span>
            </div>
          )}

          {task.note && <p className="mt-1 line-clamp-1 text-xs text-muted">{task.note}</p>}
        </div>

        {/* Actions */}
        {!overlay && (
          <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}
                onClick={e => { e.stopPropagation(); onEdit(); }}
                className="tf-ring rounded-lg p-1 text-muted hover:bg-panel-2 hover:text-fg"
                aria-label="Edit"
              >
                <Pencil size={13} />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.88 }}
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="tf-ring rounded-lg p-1 text-muted hover:bg-rose-soft hover:text-rose"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/* ── Sortable wrapper ─────────────────────────────────────────────────── */
export function SortableTaskCard({
  task,
  clients,
  currency,
  groupBy,
  selected,
  onEdit,
  onDelete,
}: {
  task: TaskWithClient;
  clients: Client[];
  currency: string;
  groupBy: GroupBy;
  selected?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={isDragging ? {} : {
        y: -2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)",
      }}
      transition={isDragging ? { duration: 0 } : fluid}
    >
      <TaskCardStatic
        task={task}
        clients={clients}
        currency={currency}
        groupBy={groupBy}
        selected={selected}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </motion.div>
  );
}

"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatMoney, formatHours, formatDate } from "@/lib/format";
import { type TaskWithClient, TASK_TYPE_LABEL, type TaskStatus, type TaskType } from "@/lib/types";
import type { Client } from "@/lib/types";

type GroupBy = "status" | "client" | "type" | "none";

const statusDot: Record<TaskStatus, string> = {
  todo:  "bg-fg-2/30",
  doing: "bg-amber",
  done:  "bg-teal",
};

const typeTone: Record<TaskType, "teal" | "accent"> = {
  on_demand: "teal",
  maintain:  "accent",
};

/* ── Row ─────────────────────────────────────────────────────────────── */
export const TaskCardStatic = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    task: TaskWithClient;
    clients: Client[];
    currency: string;
    groupBy: GroupBy;
    overlay?: boolean;
    selected?: boolean;
    onToggleSelect?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
  }
>(function TaskCardStatic(
  { task, clients, currency, groupBy, overlay, selected, onToggleSelect, onEdit, onDelete, style, className, ...rest },
  ref,
) {
  const clientName = clients.find(c => c.id === task.client_id)?.name;
  const isOD = task.type === "on_demand";

  return (
    <div
      ref={ref}
      style={style}
      className={[
        "group/row flex items-center gap-2 rounded-lg px-2 py-[7px] text-sm select-none",
        "transition-colors duration-100",
        overlay
          ? "bg-panel shadow-xl shadow-black/10 ring-1 ring-accent/20 rotate-[0.6deg] scale-[1.02] cursor-grabbing"
          : selected
            ? "bg-accent-soft/20 hover:bg-accent-soft/30"
            : "hover:bg-panel-2/70",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {/* Drag handle */}
      <GripVertical
        size={13}
        className={[
          "shrink-0 text-muted/40",
          overlay
            ? "opacity-50"
            : "cursor-grab opacity-0 transition-opacity group-hover/row:opacity-100",
        ].join(" ")}
      />

      {/* Checkbox (bulk select) or status dot */}
      {onToggleSelect ? (
        <label
          className="flex shrink-0 cursor-pointer items-center"
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={onToggleSelect}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
        </label>
      ) : (
        <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${statusDot[task.status]}`} />
      )}

      {/* Name */}
      <span className="min-w-0 flex-1 truncate text-fg">{task.name}</span>

      {/* Right-side meta */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Type badge — hidden when grouped by type */}
        {groupBy !== "type" && (
          <Badge tone={typeTone[task.type]}>{TASK_TYPE_LABEL[task.type]}</Badge>
        )}

        {/* Status dot — shown only when not grouped by status */}
        {groupBy !== "status" && !onToggleSelect && (
          <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${statusDot[task.status]}`} />
        )}

        {/* Client */}
        {groupBy !== "client" && clientName && (
          <span className="hidden font-mono text-[11px] text-muted sm:block">{clientName}</span>
        )}

        {/* Date */}
        <span className="w-9 text-right font-mono text-[11px] text-muted">
          {formatDate(task.task_date).slice(0, 5)}
        </span>

        {/* Hours + Amount */}
        {isOD ? (
          <>
            <span className="w-8 text-right font-mono text-[11px] text-fg-2">
              {formatHours(task.hours)}
            </span>
            <span className="w-[72px] text-right font-mono text-[11px] font-medium text-teal">
              {formatMoney(task.amount, currency)}
            </span>
          </>
        ) : (
          <span className="w-[88px]" />
        )}

        {/* Actions */}
        {!overlay && (onEdit || onDelete) && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                onPointerDown={e => e.stopPropagation()}
                className="tf-ring rounded-md p-1 text-muted hover:bg-panel-3 hover:text-fg"
                aria-label="Edit"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                onPointerDown={e => e.stopPropagation()}
                className="tf-ring rounded-md p-1 text-muted hover:bg-rose-soft hover:text-rose"
                aria-label="Delete"
              >
                <Trash2 size={12} />
              </button>
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
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  task: TaskWithClient;
  clients: Client[];
  currency: string;
  groupBy: GroupBy;
  selected?: boolean;
  onToggleSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { task } });

  return (
    <TaskCardStatic
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.3 : 1,
      }}
      {...attributes}
      {...listeners}
      task={task}
      clients={clients}
      currency={currency}
      groupBy={groupBy}
      selected={selected}
      onToggleSelect={onToggleSelect}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

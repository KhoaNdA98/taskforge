'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Group, Text } from '@mantine/core';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { formatMoney, formatHours, formatDate } from '@/lib/format';
import { type TaskWithClient, TASK_TYPE_LABEL, type TaskStatus, type TaskType } from '@/lib/types';
import type { Client } from '@/lib/types';

type GroupBy = 'status' | 'client' | 'type' | 'none';

const statusColor: Record<TaskStatus, string> = {
  todo:  'var(--mantine-color-gray-4)',
  doing: 'var(--mantine-color-yellow-5)',
  done:  'var(--mantine-color-teal-5)',
};

const typeBadgeColor: Record<TaskType, string> = {
  on_demand: 'teal',
  maintain:  'indigo',
};

/* ── Static card row ─────────────────────────────────────────────────── */
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
  const isOD = task.type === 'on_demand';

  return (
    <div
      ref={ref}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px', borderRadius: 8, fontSize: 14,
        userSelect: 'none', cursor: 'default',
        background: overlay
          ? 'var(--mantine-color-dark-6)'
          : selected
            ? 'rgba(99,102,241,0.1)'
            : undefined,
        boxShadow: overlay ? '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)' : undefined,
        transform: overlay ? 'rotate(0.6deg) scale(1.02)' : undefined,
        ...style,
      }}
      className={`task-card-row ${className ?? ''}`}
      {...rest}
    >
      {/* Drag handle */}
      <GripVertical
        size={13}
        style={{
          flexShrink: 0, color: 'var(--mantine-color-gray-4)',
          cursor: overlay ? 'grabbing' : 'grab',
        }}
      />

      {/* Checkbox or status dot */}
      {onToggleSelect ? (
        <label
          style={{ display: 'flex', flexShrink: 0, cursor: 'pointer' }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={onToggleSelect}
            style={{ width: 14, height: 14, accentColor: 'var(--mantine-color-indigo-6)' }}
          />
        </label>
      ) : (
        <span
          style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: statusColor[task.status],
          }}
        />
      )}

      {/* Name */}
      <Text size="sm" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.name}
      </Text>

      {/* Right meta */}
      <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
        {groupBy !== 'type' && (
          <Badge color={typeBadgeColor[task.type]} variant="light" size="xs">
            {TASK_TYPE_LABEL[task.type]}
          </Badge>
        )}

        {groupBy !== 'status' && !onToggleSelect && (
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: statusColor[task.status], flexShrink: 0,
            }}
          />
        )}

        {groupBy !== 'client' && clientName && (
          <Text size="xs" c="dimmed" ff="monospace" visibleFrom="sm" style={{ flexShrink: 0 }}>
            {clientName}
          </Text>
        )}

        <Text size="xs" c="dimmed" ff="monospace" w={36} ta="right" style={{ flexShrink: 0 }}>
          {formatDate(task.task_date).slice(0, 5)}
        </Text>

        {isOD ? (
          <>
            <Text size="xs" c="dimmed" ff="monospace" w={32} ta="right" style={{ flexShrink: 0 }}>
              {formatHours(task.hours)}
            </Text>
            <Text size="xs" c="teal" fw={500} ff="monospace" w={72} ta="right" style={{ flexShrink: 0 }}>
              {formatMoney(task.amount, currency)}
            </Text>
          </>
        ) : (
          <span style={{ width: 88, flexShrink: 0 }} />
        )}

        {!overlay && (onEdit || onDelete) && (
          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }} className="task-card-actions">
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                onPointerDown={e => e.stopPropagation()}
                style={{
                  padding: 4, borderRadius: 4, border: 'none', background: 'transparent',
                  cursor: 'pointer', color: 'var(--mantine-color-gray-5)',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label="Edit"
              >
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                onPointerDown={e => e.stopPropagation()}
                style={{
                  padding: 4, borderRadius: 4, border: 'none', background: 'transparent',
                  cursor: 'pointer', color: 'var(--mantine-color-gray-5)',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </Group>
        )}
      </Group>
    </div>
  );
});

/* ── Sortable wrapper ────────────────────────────────────────────────── */
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

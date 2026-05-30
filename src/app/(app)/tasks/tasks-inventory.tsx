'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { deleteTask } from './actions';
import { TasksForm } from './tasks-form';
import { type Client, type TaskWithClient, type TaskStatus } from '@/lib/types';
import { TASK } from '@/lib/strings';
import { formatMoney, formatDate } from '@/lib/format';

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:  '#a855f7',
  doing: '#eab308',
  done:  '#22c55e',
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo:  'TODO',
  doing: 'WIP',
  done:  'DONE',
};

/* ── Smart emoji icon based on task content ─────────────────────── */
function getQuestIcon(task: TaskWithClient): string {
  const n = task.name.toLowerCase();
  if (/bug|fix|error|lỗi|crash/.test(n))                    return '🐞';
  if (/migrat|import|export|transfer|data/.test(n))          return '📦';
  if (/config|setting|cài|setup|install/.test(n))            return '⚙️';
  if (/ui|design|style|css|layout|giao diện/.test(n))        return '🎨';
  if (/api|endpoint|backend|server|database|db/.test(n))     return '🔧';
  if (/test|review|audit|kiểm tra/.test(n))                  return '🔍';
  if (/update|upgrade|version|refactor/.test(n))             return '⬆️';
  if (/add|new|create|feature|tính năng|thêm/.test(n))       return '📜';
  if (task.type === 'maintain')  return '⚔️';
  return '💰';
}

/* ── Quest card ──────────────────────────────────────────────────── */
function QuestCard({
  task, clients, currency, selected, onToggleSelect, onEdit, onDelete,
}: {
  task:           TaskWithClient;
  clients:        Client[];
  currency:       string;
  selected:       boolean;
  onToggleSelect: () => void;
  onEdit:         () => void;
  onDelete:       () => void;
}) {
  const sc         = STATUS_COLOR[task.status];
  const clientName = clients.find(c => c.id === task.client_id)?.name ?? null;
  const isOD       = task.type === 'on_demand';
  const icon       = getQuestIcon(task);

  return (
    <div
      className={`tf-quest-card tf-quest-card--${task.status}`}
      style={{
        background: '#13131c',
        border: `2px solid ${selected ? '#a855f7' : '#2d2d3d'}`,
        padding: '14px 16px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
        boxShadow: selected
          ? `4px 4px 0px rgba(0,0,0,0.6), 0 0 0 1px #a855f7`
          : `4px 4px 0px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
      onClick={onEdit}
    >
      {/* Selection checkbox (top-left) */}
      <div
        style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}
        onClick={e => { e.stopPropagation(); onToggleSelect(); }}
      >
        <Checkbox checked={selected} onChange={onToggleSelect} size="xs" aria-label="Select" />
      </div>

      {/* Delete button (top-right, visible on hover) */}
      <button
        className="tf-quest-card-actions"
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          position: 'absolute', top: 4, right: 6, zIndex: 2,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(248,113,113,0.7)', fontSize: 16, lineHeight: 1,
          padding: '2px 4px', fontFamily: 'inherit',
        }}
        aria-label="Delete"
      >
        ×
      </button>

      {/* Header: status + client */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <div style={{
            width: 8, height: 8, flexShrink: 0,
            background: sc,
            boxShadow: `0 0 6px ${sc}`,
          }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>
            {STATUS_LABEL[task.status]}
          </span>
        </div>
        {clientName && (
          <div style={{
            background: 'rgba(255,255,255,0.07)',
            padding: '1px 8px',
            fontSize: 12,
            color: '#94A3B8',
            letterSpacing: '0.04em',
            maxWidth: 90,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {clientName}
          </div>
        )}
      </div>

      {/* Task name */}
      <div style={{
        fontSize: 17,
        lineHeight: 1.4,
        color: task.status === 'done' ? 'rgba(255,255,255,0.65)' : '#e2e8f0',
        wordBreak: 'break-word',
        flex: 1,
      }}>
        {task.name}
      </div>

      {/* Footer: date + icon + reward */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
            {formatDate(task.task_date).slice(0, 5)}
          </span>
          {isOD && task.amount > 0 && (
            <span style={{ fontSize: 13, color: '#22c55e', letterSpacing: '0.02em' }}>
              {formatMoney(task.amount, currency)}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 28,
          filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.8))',
          userSelect: 'none',
        }}>
          {icon}
        </span>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────── */
export function TasksInventory({
  tasks, clients, currency, selectedIds, onToggleSelect,
}: {
  tasks:          TaskWithClient[];
  clients:        Client[];
  currency:       string;
  selectedIds:    Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const router = useRouter();

  const openEdit = useCallback((task: TaskWithClient) => {
    modals.open({
      title: TASK.editTask,
      children: (
        <TasksForm
          task={task}
          clients={clients}
          onDone={() => { modals.closeAll(); router.refresh(); }}
        />
      ),
      size: 'md',
    });
  }, [clients, router]);

  const onDelete = useCallback((task: TaskWithClient) => {
    modals.openConfirmModal({
      title: TASK.deleteConfirm(task.name),
      children: <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>{TASK.deleteConfirmDetail}</div>,
      labels: { confirm: 'DELETE', cancel: 'CANCEL' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await deleteTask(task.id);
        notifications.show({ message: '// Quest removed from board.' });
        router.refresh();
      },
    });
  }, [router]);

  const done  = tasks.filter(t => t.status === 'done').length;
  const doing = tasks.filter(t => t.status === 'doing').length;
  const todo  = tasks.filter(t => t.status === 'todo').length;

  return (
    <div>
      {/* Board header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 22, color: '#a855f7', letterSpacing: '0.08em', textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
          ⚔️ QUEST_BOARD
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
          <span style={{ color: '#22c55e' }}>●DONE&nbsp;{done}</span>
          <span style={{ color: '#eab308' }}>●WIP&nbsp;{doing}</span>
          <span style={{ color: 'rgba(168,85,247,0.8)' }}>●TODO&nbsp;{todo}</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(168,85,247,0.2)',
          padding: '48px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
          fontSize: 18,
          letterSpacing: '0.08em',
        }}>
          {'// NO ACTIVE QUESTS'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {tasks.map(task => (
            <QuestCard
              key={task.id}
              task={task}
              clients={clients}
              currency={currency}
              selected={selectedIds.has(task.id)}
              onToggleSelect={() => onToggleSelect(task.id)}
              onEdit={() => openEdit(task)}
              onDelete={() => onDelete(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

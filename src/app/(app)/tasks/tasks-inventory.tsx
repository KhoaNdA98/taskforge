'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { deleteTask } from './actions';
import { TasksForm } from './tasks-form';
import { type Client, type TaskWithClient, type TaskStatus } from '@/lib/types';
import { TASK } from '@/lib/strings';
import { formatMoney, formatDate } from '@/lib/format';

// ── Golden Arcade palette per status ──────────────────────────────────────
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:   '#a78bfa',  // soft purple for backlog
  doing:  '#ff914d',  // arcade orange for WIP
  review: '#ffde59',  // gold for review
  done:   '#6fcf5a',  // warm green for done
};
const STATUS_BG: Record<TaskStatus, string> = {
  todo:   'rgba(167,139,250,0.08)',
  doing:  'rgba(255,145,77,0.08)',
  review: 'rgba(255,222,89,0.08)',
  done:   'rgba(111,207,90,0.08)',
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo:   'TODO',
  doing:  'WIP',
  review: 'REVIEW',
  done:   'DONE',
};

function getQuestIcon(task: TaskWithClient): string {
  const n = task.name.toLowerCase();
  if (/bug|fix|error|lỗi|crash/.test(n))                return '🐞';
  if (/migrat|import|export|transfer|data/.test(n))      return '📦';
  if (/config|setting|cài|setup|install/.test(n))        return '⚙️';
  if (/ui|design|style|css|layout|giao diện/.test(n))    return '🎨';
  if (/api|endpoint|backend|server|database|db/.test(n)) return '🔧';
  if (/test|review|audit|kiểm tra/.test(n))              return '🔍';
  if (/update|upgrade|version|refactor/.test(n))         return '⬆️';
  if (/add|new|create|feature|tính năng|thêm/.test(n))   return '📜';
  if (task.type === 'maintain') return '⚔️';
  return '💰';
}

// ── Quest Card (Golden Arcade) ─────────────────────────────────────────────
function QuestCard({ task, clients, currency, onEdit, onDelete }: {
  task: TaskWithClient; clients: Client[]; currency: string;
  onEdit: () => void; onDelete: () => void;
}) {
  const isDone      = task.status === 'done';
  const color       = STATUS_COLOR[task.status];
  const clientName  = clients.find(c => c.id === task.client_id)?.name ?? null;
  const isOD        = task.type === 'on_demand';
  const icon        = getQuestIcon(task);

  return (
    <article
      id={`quest-card-${task.id}`}
      style={{
        background: '#232323',
        border: '3px solid #111111',
        boxShadow: `inset 0 0 0 1.5px ${color}55, 4px 4px 0px #111111`,
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        opacity: isDone ? 0.72 : 1,
        transform: 'translateY(0)',
        transition: 'all 0.08s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onEdit}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        el.style.boxShadow = `inset 0 0 0 2px ${color}, 5px 5px 0px #111111`;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = isDone ? '0.72' : '1';
        el.style.boxShadow = `inset 0 0 0 1.5px ${color}55, 4px 4px 0px #111111`;
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Top color accent strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, right: 0,
        height: '2px', background: color,
      }} />

      {/* Delete btn */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          position: 'absolute', top: '8px', right: '8px', zIndex: 3,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'transparent', fontSize: '20px', lineHeight: 1,
          padding: '1px 4px', fontFamily: "'VT323', monospace",
          transition: 'color 0.08s',
        }}
        aria-label="Delete"
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'transparent'; }}
      >
        ×
      </button>

      {/* Header: icon + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span role="img" aria-label={task.type} style={{ fontSize: '24px', lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: '9px', fontWeight: 700,
          letterSpacing: '0.12em', color: '#111111',
          background: color, padding: '2px 7px',
          textTransform: 'uppercase',
        }}>
          {STATUS_LABEL[task.status]}
        </span>
      </div>

      {/* Task name — VT323 large */}
      <h3 style={{
        fontFamily: "'VT323', monospace", fontSize: '22px',
        color: '#fceabb', margin: 0,
        wordWrap: 'break-word', overflowWrap: 'break-word',
        lineHeight: 1.25, letterSpacing: '0.02em',
      }}>
        {task.name}
      </h3>

      {/* Divider */}
      <div style={{ height: '1px', background: '#2a2a2a' }} />

      {/* Meta: client + reward */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(252,234,187,0.35)', textTransform: 'uppercase' }}>
            Client
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '19px', color: '#ff914d' }}>
            {clientName ?? '—'}
          </div>
        </div>
        {isOD && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(252,234,187,0.35)', textTransform: 'uppercase' }}>
              Reward
            </div>
            <div style={{
              fontFamily: "'VT323', monospace", fontSize: '22px',
              color: '#111111',
              textShadow: '-1px -1px 0 #ffde59, 1px -1px 0 #ffde59, -1px 1px 0 #ffde59, 1px 1px 0 #ffde59, 2px 2px 0 #111',
            }}>
              +{formatMoney(task.amount, currency)}
            </div>
          </div>
        )}
      </div>

      {/* Date */}
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(252,234,187,0.25)', letterSpacing: '0.06em' }}>
        {formatDate(task.task_date).slice(0, 10)}
      </div>
    </article>
  );
}

// ── Kanban Columns ─────────────────────────────────────────────────────────
const COLUMNS: { status: TaskStatus; label: string; emoji: string }[] = [
  { status: 'todo',   label: 'BACKLOG',     emoji: '📋' },
  { status: 'doing',  label: 'IN PROGRESS', emoji: '⭐' },
  { status: 'review', label: 'IN REVIEW',   emoji: '🔍' },
  { status: 'done',   label: 'DONE',        emoji: '✅' },
];

export function TasksInventory({ tasks, clients, currency }: {
  tasks: TaskWithClient[]; clients: Client[]; currency: string;
}) {
  const router = useRouter();
  const { open } = useModal();
  const toast  = useToast();

  const openEdit = useCallback((task: TaskWithClient) => {
    open({
      title: TASK.editTask,
      content: (
        <TasksForm
          task={task} clients={clients}
          onDone={() => { open({ title: '', content: null }); router.refresh(); }}
        />
      ),
    });
  }, [clients, open, router]);

  const openDelete = useCallback((task: TaskWithClient) => {
    open({
      title: TASK.deleteConfirm(task.name),
      content: <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(252,234,187,0.55)', lineHeight: 1.6 }}>{TASK.deleteConfirmDetail}</p>,
      onConfirm: async () => {
        await deleteTask(task.id);
        toast.success('Quest removed from board.');
        router.refresh();
      },
      confirmLabel: '[ DELETE ]', cancelLabel: '[ CANCEL ]', danger: true,
    });
  }, [open, toast, router]);

  const byStatus = (s: TaskStatus) => tasks.filter(t => t.status === s);

  return (
    <div>
      {/* Board header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '28px', color: '#ff914d', letterSpacing: '0.08em',
          textShadow: '-1px -1px 0 #111, 1px -1px 0 #111, -1px 1px 0 #111, 1px 1px 0 #111, 2px 3px 0 #111' }}>
          ⭐ QUEST_BOARD
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          {COLUMNS.map(col => (
            <span key={col.status} style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: STATUS_COLOR[col.status], textTransform: 'uppercase' }}>
              ● {col.label.replace('IN ', '').replace('BACKLOG', 'TODO')}&nbsp;{byStatus(col.status).length}
            </span>
          ))}
        </div>
      </div>

      {/* 4-column Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', alignItems: 'start' }}>
        {COLUMNS.map(col => {
          const colTasks = byStatus(col.status);
          const color    = STATUS_COLOR[col.status];
          const bg       = STATUS_BG[col.status];
          return (
            <div key={col.status} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Column header — arcade style */}
              <div style={{
                background: bg,
                border: '3px solid #111111',
                borderTop: `4px solid ${color}`,
                boxShadow: `inset 0 0 0 1px ${color}22, 3px 3px 0px #111111`,
                padding: '9px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color, textTransform: 'uppercase' }}>
                  {col.emoji} {col.label}
                </span>
                <span style={{
                  fontFamily: "'VT323', monospace", fontSize: '22px',
                  color: '#111111', background: color,
                  padding: '0 8px', lineHeight: 1.2,
                  boxShadow: '2px 2px 0 #111111',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              {colTasks.length === 0 ? (
                <div style={{
                  border: `2px dashed ${color}22`, padding: '32px 12px',
                  textAlign: 'center', fontFamily: "'Inter', sans-serif",
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
                  color: `${color}44`, textTransform: 'uppercase',
                }}>
                  EMPTY
                </div>
              ) : (
                colTasks.map(task => (
                  <QuestCard
                    key={task.id} task={task} clients={clients} currency={currency}
                    onEdit={() => openEdit(task)} onDelete={() => openDelete(task)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

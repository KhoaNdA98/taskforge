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

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo:  '#a855f7',
  doing: '#eab308',
  done:  '#22c55e',
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo:  '[ TODO ]',
  doing: '[ WIP  ]',
  done:  '[ DONE ]',
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

function QuestCard({ task, clients, currency, onEdit, onDelete }: {
  task: TaskWithClient; clients: Client[]; currency: string;
  onEdit: () => void; onDelete: () => void;
}) {
  const isDone      = task.status === 'done';
  const statusColor = STATUS_COLOR[task.status];
  const clientName  = clients.find(c => c.id === task.client_id)?.name ?? null;
  const isOD        = task.type === 'on_demand';
  const icon        = getQuestIcon(task);

  return (
    <article
      id={`quest-card-${task.id}`}
      style={{
        background: '#13131c',
        border: '2px solid #2d2d3d',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.6)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: isDone ? 0.55 : 1,
        transform: 'translateY(0)',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onEdit}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        el.style.boxShadow = '8px 8px 0px 0px rgba(168,85,247,0.4)';
        el.style.borderColor = '#a855f7';
        el.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = isDone ? '0.55' : '1';
        el.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,0.6)';
        el.style.borderColor = '#2d2d3d';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '3px', background: statusColor,
        boxShadow: `0 0 8px ${statusColor}80`,
      }} />

      {/* Delete btn */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{
          position: 'absolute', top: '6px', right: '8px', zIndex: 3,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'transparent', fontSize: '20px', lineHeight: 1,
          padding: '1px 4px', fontFamily: "'VT323', monospace",
          transition: 'color 0.1s',
        }}
        aria-label="Delete"
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'transparent'; }}
        className="quest-delete-trigger"
      >
        ×
      </button>

      {/* Header: icon + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span role="img" aria-label={task.type} style={{ fontSize: '28px', lineHeight: 1 }}>
          {icon}
        </span>
        <span style={{
          fontFamily: "'VT323', monospace",
          fontSize: '15px',
          color: statusColor,
          textShadow: `0 0 6px ${statusColor}80`,
          letterSpacing: '0.08em',
        }}>
          {STATUS_LABEL[task.status]}
        </span>
      </div>

      {/* Task name */}
      <h3 style={{
        fontFamily: "'VT323', monospace",
        fontSize: '20px',
        color: '#e2e8f0',
        margin: 0,
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        lineHeight: 1.3,
        letterSpacing: '0.03em',
      }}>
        {task.name}
      </h3>

      {/* Divider */}
      <div style={{ height: '1px', background: '#2d2d3d' }} />

      {/* Meta: client + reward */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#6b7280', letterSpacing: '0.06em' }}>
            CLIENT
          </div>
          <div style={{ fontFamily: "'VT323', monospace", fontSize: '17px', color: '#a855f7' }}>
            {clientName ?? '—'}
          </div>
        </div>
        {isOD && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#6b7280', letterSpacing: '0.06em' }}>
              REWARD
            </div>
            <div style={{
              fontFamily: "'VT323', monospace", fontSize: '22px',
              color: '#06b6d4', textShadow: '0 0 8px rgba(6,182,212,0.4)',
            }}>
              +{formatMoney(task.amount, currency)} XP
            </div>
          </div>
        )}
      </div>

      {/* Date */}
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '13px', color: '#4b5563', letterSpacing: '0.04em' }}>
        DATE: {formatDate(task.task_date).slice(0, 10)}
      </div>
    </article>
  );
}

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
          task={task}
          clients={clients}
          onDone={() => { open({ title: '', content: null }); router.refresh(); }}
        />
      ),
    });
  }, [clients, open, router]);

  const openDelete = useCallback((task: TaskWithClient) => {
    open({
      title: TASK.deleteConfirm(task.name),
      content: <p style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>{TASK.deleteConfirmDetail}</p>,
      onConfirm: async () => {
        await deleteTask(task.id);
        toast.success('// Quest removed from board.');
        router.refresh();
      },
      confirmLabel: '[ DELETE ]', cancelLabel: '[ CANCEL ]', danger: true,
    });
  }, [open, toast, router]);

  const done  = tasks.filter(t => t.status === 'done').length;
  const doing = tasks.filter(t => t.status === 'doing').length;
  const todo  = tasks.filter(t => t.status === 'todo').length;

  return (
    <div>
      {/* Board header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{
          fontFamily: "'VT323', monospace", fontSize: '24px',
          color: '#a855f7', letterSpacing: '0.1em',
          textShadow: '0 0 10px rgba(168,85,247,0.45)',
        }}>
          ⚔️ QUEST_BOARD
        </div>
        <div style={{ display: 'flex', gap: '16px', fontFamily: "'VT323', monospace", fontSize: '14px' }}>
          <span style={{ color: '#22c55e' }}>●DONE&nbsp;{done}</span>
          <span style={{ color: '#eab308' }}>●WIP&nbsp;{doing}</span>
          <span style={{ color: 'rgba(168,85,247,0.8)' }}>●TODO&nbsp;{todo}</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(168,85,247,0.2)', padding: '64px',
          textAlign: 'center', fontFamily: "'VT323', monospace",
          fontSize: '18px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em',
        }}>
          {'// NO ACTIVE QUESTS'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {tasks.map(task => (
            <QuestCard
              key={task.id} task={task} clients={clients} currency={currency}
              onEdit={() => openEdit(task)} onDelete={() => openDelete(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { deleteTask } from './actions';
import { TasksForm } from './tasks-form';
import { type Client, type TaskWithClient, type TaskStatus } from '@/lib/types';
import { TASK } from '@/lib/strings';
import { formatMoney, formatDate } from '@/lib/format';

/* ── Status config ───────────────────────────────────────────── */
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

/* ── Quest icon from task name ───────────────────────────────── */
function getQuestIcon(task: TaskWithClient): string {
  const n = task.name.toLowerCase();
  if (/bug|fix|error|lỗi|crash/.test(n))               return '🐞';
  if (/migrat|import|export|transfer|data/.test(n))     return '📦';
  if (/config|setting|cài|setup|install/.test(n))       return '⚙️';
  if (/ui|design|style|css|layout|giao diện/.test(n))   return '🎨';
  if (/api|endpoint|backend|server|database|db/.test(n))return '🔧';
  if (/test|review|audit|kiểm tra/.test(n))             return '🔍';
  if (/update|upgrade|version|refactor/.test(n))        return '⬆️';
  if (/add|new|create|feature|tính năng|thêm/.test(n))  return '📜';
  if (task.type === 'maintain') return '⚔️';
  return '💰';
}

/* ── QuestCard ───────────────────────────────────────────────── */
function QuestCard({ task, clients, currency, onEdit, onDelete }: {
  task: TaskWithClient; clients: Client[]; currency: string;
  onEdit: () => void; onDelete: () => void;
}) {
  const sc         = STATUS_COLOR[task.status];
  const clientName = clients.find(c => c.id === task.client_id)?.name ?? null;
  const isOD       = task.type === 'on_demand';
  const icon       = getQuestIcon(task);

  const borderClass = {
    todo:  'border-px-purple/50 quest-todo',
    doing: 'border-px-yellow/50 quest-doing',
    done:  'border-px-green/40  quest-done',
  }[task.status];

  return (
    <div
      className={`relative flex flex-col gap-3 p-4 bg-px-card border-2 cursor-pointer
                  shadow-hard transition-all duration-150 group ${borderClass}`}
      onClick={onEdit}
    >
      {/* Delete btn — top right, visible on hover */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity
                   bg-none border-none cursor-pointer text-px-red/70 hover:text-px-red
                   font-pixel text-[18px] leading-none px-1 z-10"
        aria-label="Delete"
      >
        ×
      </button>

      {/* Top row: icon + status badge */}
      <div className="flex items-center justify-between">
        <span className="text-[28px] leading-none" role="img" aria-hidden
              style={{ filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.8))' }}>
          {icon}
        </span>
        <span className="font-pixel text-[13px] tracking-[0.06em] px-2 border"
              style={{ color: sc, borderColor: sc + '80' }}>
          [ {STATUS_LABEL[task.status]} ]
        </span>
      </div>

      {/* Task name */}
      <div className={`font-pixel text-[17px] leading-snug flex-1
        ${task.status === 'done' ? 'text-white/50' : 'text-[#e8e8f0]'}`}>
        {task.name}
      </div>

      {/* Bottom: client + reward */}
      <div className="grid grid-cols-2 gap-x-2 mt-auto">
        <div>
          <div className="font-pixel text-[11px] text-px-cyan tracking-[0.1em] mb-0.5">
            CLIENT
          </div>
          <div className="font-pixel text-[14px] text-white/80 overflow-hidden text-ellipsis whitespace-nowrap">
            {clientName ?? '—'}
          </div>
        </div>
        {isOD && (
          <div className="text-right">
            <div className="font-pixel text-[11px] text-px-cyan tracking-[0.1em] mb-0.5">
              REWARD
            </div>
            <div className="font-pixel text-[14px] text-px-green"
                 style={{ textShadow: '0 0 8px rgba(34,197,94,0.5)' }}>
              +{formatMoney(task.amount, currency)} XP
            </div>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="font-pixel text-[12px] text-white/25 tracking-[0.04em]">
        DATE: {formatDate(task.task_date).slice(0, 10)}
      </div>
    </div>
  );
}

/* ── TasksInventory ──────────────────────────────────────────── */
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
      content: <p className="font-pixel text-[16px] text-white/50">{TASK.deleteConfirmDetail}</p>,
      onConfirm: async () => {
        await deleteTask(task.id);
        toast.success('// Quest removed from board.');
        router.refresh();
      },
      confirmLabel: '[ DELETE ]',
      cancelLabel:  '[ CANCEL ]',
      danger: true,
    });
  }, [open, toast, router]);

  const done  = tasks.filter(t => t.status === 'done').length;
  const doing = tasks.filter(t => t.status === 'doing').length;
  const todo  = tasks.filter(t => t.status === 'todo').length;

  return (
    <div>
      {/* Board header */}
      <div className="flex items-center justify-between mb-5">
        <div className="px-section-title">⚔️ QUEST_BOARD</div>
        <div className="flex gap-5 font-pixel text-[14px]">
          <span className="text-px-green">●DONE&nbsp;{done}</span>
          <span className="text-px-yellow">●WIP&nbsp;{doing}</span>
          <span className="text-px-purple/80">●TODO&nbsp;{todo}</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="border-2 border-dashed border-px-purple/20 p-16 text-center
                        font-pixel text-[18px] text-white/20 tracking-[0.08em]">
          {'// NO ACTIVE QUESTS'}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {tasks.map(task => (
            <QuestCard
              key={task.id}
              task={task}
              clients={clients}
              currency={currency}
              onEdit={() => openEdit(task)}
              onDelete={() => openDelete(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useState, useTransition, useOptimistic, useCallback, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Checkbox, ActionIcon } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Pencil } from 'lucide-react';
import { EditableText, EditableNumber, EditableDate, EditableSelect } from './inline-cell';
import { formatMoney, formatDate } from '@/lib/format';
import { TASK } from '@/lib/strings';
import { type Client, type TaskWithClient, type TaskType, type TaskStatus } from '@/lib/types';
import { updateTaskField, quickAddTask, deleteTask } from './actions';
import { TasksForm } from './tasks-form';

type SortKey = 'task_date' | 'name' | 'type' | 'status' | 'hours' | 'amount';
type SortDir = 'asc' | 'desc';

function sortTasks(tasks: TaskWithClient[], key: SortKey, dir: SortDir) {
  return [...tasks].sort((a, b) => {
    let av: string | number = '', bv: string | number = '';
    if (key === 'task_date') { av = a.task_date; bv = b.task_date; }
    else if (key === 'name')   { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
    else if (key === 'type')   { av = a.type; bv = b.type; }
    else if (key === 'status') { av = a.status; bv = b.status; }
    else if (key === 'hours')  { av = Number(a.hours ?? 0); bv = Number(b.hours ?? 0); }
    else if (key === 'amount') { av = Number(a.amount); bv = Number(b.amount); }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

type OptAction =
  | { type: 'UPDATE'; id: string; updates: Partial<TaskWithClient> }
  | { type: 'DELETE'; id: string };

const statusPx:    Record<TaskStatus, string> = { todo: '#A78BFA', doing: '#FCD34D', done: '#4ADE80' };
const statusLabel: Record<TaskStatus, string> = { todo: 'TODO', doing: 'WIP', done: 'DONE' };
const typePx:     Record<TaskType,   string> = { on_demand: '#4ADE80', maintain: '#A78BFA' };
const typeBadge:  Record<TaskType,   string> = { on_demand: ' OD',    maintain: 'MNT' };

function SortBtn({ k, label, sort, onSort }: { k: SortKey; label: string; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void }) {
  return (
    <button onClick={() => onSort(k)} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
      fontSize: 11, letterSpacing: '0.12em', color: sort.key === k ? '#A78BFA' : 'rgba(255,255,255,0.25)',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {label}
      {sort.key === k
        ? sort.dir === 'asc' ? <ArrowUp size={9} /> : <ArrowDown size={9} />
        : <ArrowUpDown size={9} style={{ opacity: 0.4 }} />}
    </button>
  );
}

export function TasksTable({
  tasks: initialTasks,
  clients,
  currency,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}) {
  const router = useRouter();
  const [sort,     setSort]    = useState<{ key: SortKey; dir: SortDir }>({ key: 'task_date', dir: 'desc' });
  const [addNonce, setAddNonce] = useState(0);

  const [optimisticTasks, dispatch] = useOptimistic(
    initialTasks,
    (state: TaskWithClient[], action: OptAction) => {
      if (action.type === 'UPDATE')
        return state.map(t => t.id === action.id ? { ...t, ...action.updates } : t);
      if (action.type === 'DELETE')
        return state.filter(t => t.id !== action.id);
      return state;
    },
  );
  const [, startTransition] = useTransition();

  const saveField = useCallback(
    (task: TaskWithClient, updates: Parameters<typeof updateTaskField>[1]) => {
      const next = { ...task, ...updates } as TaskWithClient;
      if ('hours' in updates || 'rate_snapshot' in updates) {
        (next as TaskWithClient).amount = Number(next.hours ?? 0) * Number(next.rate_snapshot);
      }
      startTransition(async () => {
        dispatch({ type: 'UPDATE', id: task.id, updates: next });
        const { error } = await updateTaskField(task.id, updates);
        if (error) {
          notifications.show({ color: 'red', message: `Failed to save: ${error}` });
          router.refresh();
        }
      });
    },
    [dispatch, router],
  );

  const onDelete = useCallback((t: TaskWithClient) => {
    modals.openConfirmModal({
      title: TASK.deleteConfirm(t.name),
      children: <Text size="sm" c="dimmed">{TASK.deleteConfirmDetail}</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        startTransition(async () => {
          dispatch({ type: 'DELETE', id: t.id });
          await deleteTask(t.id);
          notifications.show({ message: 'Task deleted.' });
        });
      },
    });
  }, [dispatch]);

  const sorted = sortTasks(optimisticTasks, sort.key, sort.dir);

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: key === 'task_date' ? 'desc' : 'asc' }
    );
  }

  function openEdit(task: TaskWithClient) {
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
  }

  const allSelected = sorted.length > 0 && sorted.every(t => selectedIds.has(t.id));

  return (
    <div style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(0,0,0,0.25)', overflowX: 'auto', minWidth: 700 }}>

      {/* ── Quest log header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(139,92,246,0.06)',
        fontSize: 11, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)',
      }}>
        <div style={{ width: 28, flexShrink: 0 }}>
          <Checkbox checked={allSelected} indeterminate={selectedIds.size > 0 && !allSelected}
            onChange={onToggleSelectAll} size="xs" aria-label="Select all" />
        </div>
        <div style={{ width: 46, flexShrink: 0 }}><SortBtn k="task_date" label="DATE" sort={sort} onSort={toggleSort} /></div>
        <div style={{ width: 40, flexShrink: 0 }}>CLASS</div>
        <div style={{ flex: 1 }}><SortBtn k="name" label="QUEST_NAME" sort={sort} onSort={toggleSort} /></div>
        <div style={{ width: 76, flexShrink: 0 }}>CLIENT</div>
        <div style={{ width: 62, flexShrink: 0 }}><SortBtn k="status" label="STATUS" sort={sort} onSort={toggleSort} /></div>
        <div style={{ width: 52, flexShrink: 0, textAlign: 'right' }}><SortBtn k="hours" label="HRS" sort={sort} onSort={toggleSort} /></div>
        <div style={{ width: 92, flexShrink: 0, textAlign: 'right' }}><SortBtn k="amount" label="REWARD" sort={sort} onSort={toggleSort} /></div>
        <div style={{ width: 44, flexShrink: 0 }} />
      </div>

      {/* ── Quest rows ── */}
      {sorted.map(task => {
        const sc = statusPx[task.status];
        const selected = selectedIds.has(task.id);
        return (
          <div
            key={task.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderLeft: `2px solid ${sc}`,
              background: selected ? 'rgba(139,92,246,0.08)' : 'transparent',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {/* Checkbox */}
            <div style={{ width: 28, flexShrink: 0 }}>
              <Checkbox checked={selected} onChange={() => onToggleSelect(task.id)}
                onClick={e => e.stopPropagation()} size="xs" aria-label="Select task" />
            </div>

            {/* Date */}
            <div style={{ width: 46, flexShrink: 0 }}>
              <EditableDate value={task.task_date} formatFn={v => formatDate(v).slice(0, 5)} onSave={v => saveField(task, { task_date: v })} />
            </div>

            {/* Type badge */}
            <div style={{ width: 40, flexShrink: 0 }}>
              <EditableSelect<TaskType>
                value={task.type}
                options={[{ value: 'on_demand', label: TASK.type.on_demand }, { value: 'maintain', label: TASK.type.maintain }]}
                renderValue={v => (
                  <span style={{ fontSize: 11, border: `1px solid ${typePx[v]}55`, color: typePx[v], padding: '0 3px', letterSpacing: '0.03em', fontFamily: 'inherit', cursor: 'pointer' }}>
                    {typeBadge[v]}
                  </span>
                )}
                onSave={v => saveField(task, { type: v, hours: v === 'maintain' ? null : (task.hours ?? 0) })}
              />
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <EditableText value={task.name} bold onSave={v => saveField(task, { name: v })} />
              {task.note && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 6 }}>{task.note}</div>}
            </div>

            {/* Client */}
            <div style={{ width: 76, flexShrink: 0, overflow: 'hidden' }}>
              <EditableSelect<string>
                value={task.client_id ?? ''}
                options={[{ value: '', label: TASK.fields.unassigned }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
                renderValue={v => <Text size="xs" c={v ? undefined : 'dimmed'} truncate>{clients.find(c => c.id === v)?.name ?? '—'}</Text>}
                onSave={v => saveField(task, { client_id: v || null })}
              />
            </div>

            {/* Status dots */}
            <div style={{ width: 62, flexShrink: 0 }}>
              <EditableSelect<TaskStatus>
                value={task.status}
                options={[{ value: 'todo', label: TASK.status.todo }, { value: 'doing', label: TASK.status.doing }, { value: 'done', label: TASK.status.done }]}
                renderValue={v => (
                  <span style={{
                    color: statusPx[v], border: `1px solid ${statusPx[v]}`,
                    padding: '1px 5px', fontSize: 12, letterSpacing: '0.06em',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                    {statusLabel[v]}
                  </span>
                )}
                onSave={v => saveField(task, { status: v })}
              />
            </div>

            {/* Hours */}
            <div style={{ width: 52, flexShrink: 0, textAlign: 'right' }}>
              {task.type === 'on_demand'
                ? <EditableNumber value={task.hours} step={0.25} min={0} onSave={v => saveField(task, { hours: v })} />
                : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>——</span>}
            </div>

            {/* Reward (amount) */}
            <div style={{ width: 92, flexShrink: 0, textAlign: 'right', fontSize: 14 }}>
              {task.type === 'on_demand'
                ? <span style={{ color: '#4ADE80', fontFamily: 'inherit' }}>{formatMoney(task.amount, currency)}</span>
                : <span style={{ color: 'rgba(255,255,255,0.2)' }}>——</span>}
            </div>

            {/* Actions */}
            <div style={{ width: 44, flexShrink: 0, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => openEdit(task)} aria-label="Edit">
                <Pencil size={12} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(task)} aria-label="Delete">
                <Trash2 size={12} />
              </ActionIcon>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 16, letterSpacing: '0.08em' }}>
          {'// NO QUESTS FOUND'}
        </div>
      )}

      <QuickAddRow key={addNonce} clients={clients} onAdded={() => { setAddNonce(n => n + 1); router.refresh(); }} />
    </div>
  );
}

/* ── Quick-add row ───────────────────────────────────────────────────── */
function QuickAddRow({ clients, onAdded }: { clients: Client[]; onAdded: () => void }) {
  const [active,   setActive]   = useState(false);
  const [name,     setName]     = useState('');
  const [clientId, setClientId] = useState('');
  const [pending,  startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function activate() { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) { setActive(false); return; }
    startTransition(async () => {
      const { error } = await quickAddTask(trimmed, { client_id: clientId || null });
      if (error) { notifications.show({ color: 'red', message: `Failed: ${error}` }); return; }
      setName(''); setClientId('');
      onAdded();
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  submit();
    if (e.key === 'Escape') { setActive(false); setName(''); }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 12px',
      borderTop: '1px dashed rgba(139,92,246,0.2)',
    }}>
      <div style={{ width: 28, flexShrink: 0 }} />
      {active ? (
        <>
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => { if (name.trim()) submit(); else setActive(false); }}
            placeholder="QUEST NAME... [ENTER] SAVE  [ESC] CANCEL"
            disabled={pending}
            style={{
              flex: 1, border: '1px solid rgba(139,92,246,0.5)',
              padding: '4px 8px', fontSize: 15,
              outline: 'none', boxShadow: '0 0 0 2px rgba(139,92,246,0.15)',
              background: 'rgba(139,92,246,0.06)', color: '#E8E8F0', fontFamily: 'inherit',
            }}
          />
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '4px 6px', fontSize: 14, cursor: 'pointer',
              background: 'var(--mantine-color-dark-6)', color: '#E8E8F0', fontFamily: 'inherit',
            }}
          >
            <option value="">{TASK.fields.unassigned}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </>
      ) : (
        <button
          onClick={activate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 8px', fontSize: 14, fontFamily: 'inherit',
            color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em',
          }}
        >
          <Plus size={13} /> NEW QUEST
        </button>
      )}
    </div>
  );
}

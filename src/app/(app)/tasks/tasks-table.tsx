'use client';

import { useRef, useState, useTransition, useOptimistic, useCallback, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Badge, Card, Text, Group, Checkbox, ActionIcon, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Pencil } from 'lucide-react';
import { EditableText, EditableNumber, EditableDate, EditableSelect } from './inline-cell';
import { formatMoney, formatDate } from '@/lib/format';
import { TASK } from '@/lib/strings';
import { type Client, type TaskWithClient, type TaskType, type TaskStatus, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from '@/lib/types';
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

const statusColor: Record<TaskStatus, string> = { todo: 'gray', doing: 'yellow', done: 'teal' };
const typeColor:   Record<TaskType,   string> = { on_demand: 'teal', maintain: 'indigo' };

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

  const cols: { key: SortKey | null; label: string; align?: 'right' | 'left' }[] = [
    { key: 'task_date', label: 'Date'   },
    { key: 'name',      label: 'Task'   },
    { key: 'type',      label: 'Type'   },
    { key: null,        label: 'Client' },
    { key: 'status',    label: 'Status' },
    { key: 'hours',     label: 'Hours',  align: 'right' },
    { key: 'amount',    label: 'Amount', align: 'right' },
    { key: null,        label: ''       },
  ];

  return (
    <>
      <Card p={0} style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <Table
            highlightOnHover
            withRowBorders
            style={{ minWidth: 820 }}
            styles={{ th: { whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mantine-color-dimmed)' } }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedIds.size > 0 && !allSelected}
                    onChange={onToggleSelectAll}
                    size="xs"
                    aria-label="Select all"
                  />
                </Table.Th>
                {cols.map(({ key, label, align }) => (
                  <Table.Th key={label} style={{ textAlign: align }}>
                    {key ? (
                      <button
                        onClick={() => toggleSort(key as SortKey)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontFamily: 'monospace', fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.05em', color: 'var(--mantine-color-dimmed)',
                          padding: 0,
                        }}
                      >
                        {label}
                        {sort.key === key
                          ? sort.dir === 'asc'
                            ? <ArrowUp size={10} style={{ color: 'var(--mantine-color-indigo-6)' }} />
                            : <ArrowDown size={10} style={{ color: 'var(--mantine-color-indigo-6)' }} />
                          : <ArrowUpDown size={10} style={{ opacity: 0.4 }} />}
                      </button>
                    ) : label}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {sorted.map(task => (
                <Table.Tr
                  key={task.id}
                  style={{ background: selectedIds.has(task.id) ? 'rgba(99,102,241,0.1)' : undefined }}
                >
                  <Table.Td>
                    <Checkbox
                      checked={selectedIds.has(task.id)}
                      onChange={() => onToggleSelect(task.id)}
                      onClick={e => e.stopPropagation()}
                      size="xs"
                      aria-label="Select task"
                    />
                  </Table.Td>

                  <Table.Td>
                    <EditableDate
                      value={task.task_date}
                      formatFn={v => formatDate(v).slice(0, 5)}
                      onSave={v => saveField(task, { task_date: v })}
                    />
                  </Table.Td>

                  <Table.Td style={{ minWidth: 200 }}>
                    <EditableText value={task.name} bold onSave={v => saveField(task, { name: v })} />
                    {task.note && (
                      <Text size="xs" c="dimmed" lineClamp={1} pl={6}>{task.note}</Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    <EditableSelect<TaskType>
                      value={task.type}
                      options={[
                        { value: 'on_demand', label: TASK.type.on_demand },
                        { value: 'maintain',  label: TASK.type.maintain  },
                      ]}
                      renderValue={v => (
                        <Badge color={typeColor[v]} variant="light" size="sm">
                          {TASK_TYPE_LABEL[v]}
                        </Badge>
                      )}
                      onSave={v => saveField(task, { type: v, hours: v === 'maintain' ? null : (task.hours ?? 0) })}
                    />
                  </Table.Td>

                  <Table.Td>
                    <EditableSelect<string>
                      value={task.client_id ?? ''}
                      options={[
                        { value: '', label: TASK.fields.unassigned },
                        ...clients.map(c => ({ value: c.id, label: c.name })),
                      ]}
                      renderValue={v => (
                        <Text size="sm" c={v ? undefined : 'dimmed'}>
                          {clients.find(c => c.id === v)?.name ?? '—'}
                        </Text>
                      )}
                      onSave={v => saveField(task, { client_id: v || null })}
                    />
                  </Table.Td>

                  <Table.Td>
                    <EditableSelect<TaskStatus>
                      value={task.status}
                      options={[
                        { value: 'todo',  label: TASK.status.todo  },
                        { value: 'doing', label: TASK.status.doing },
                        { value: 'done',  label: TASK.status.done  },
                      ]}
                      renderValue={v => (
                        <Badge color={statusColor[v]} variant="light" size="sm">
                          {TASK_STATUS_LABEL[v]}
                        </Badge>
                      )}
                      onSave={v => saveField(task, { status: v })}
                    />
                  </Table.Td>

                  <Table.Td ta="right">
                    {task.type === 'on_demand' ? (
                      <EditableNumber
                        value={task.hours}
                        step={0.25}
                        min={0}
                        onSave={v => saveField(task, { hours: v })}
                      />
                    ) : (
                      <Text size="sm" c="dimmed" ta="right" pr={6}>—</Text>
                    )}
                  </Table.Td>

                  <Table.Td ta="right">
                    {task.type === 'on_demand'
                      ? <Text size="sm" ff="monospace" ta="right" pr={6}>{formatMoney(task.amount, currency)}</Text>
                      : <Text size="sm" c="dimmed" ta="right" pr={6}>—</Text>
                    }
                  </Table.Td>

                  <Table.Td>
                    <Group gap={4} wrap="nowrap" justify="flex-end" className="row-actions">
                      <Tooltip label="Edit" withArrow position="top">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => openEdit(task)}
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete" withArrow position="top">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => onDelete(task)}
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {sorted.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={9} ta="center" py="xl">
                    <Text size="sm" c="dimmed">{TASK.empty.title}</Text>
                  </Table.Td>
                </Table.Tr>
              )}

              <QuickAddRow
                key={addNonce}
                clients={clients}
                onAdded={() => { setAddNonce(n => n + 1); router.refresh(); }}
              />
            </Table.Tbody>
          </Table>
        </div>
      </Card>
    </>
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
    <Table.Tr style={{ borderTop: '1px dashed var(--mantine-color-gray-3)' }}>
      <Table.Td colSpan={active ? 2 : 9} style={{ paddingTop: 6, paddingBottom: 6 }}>
        {active ? (
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => { if (name.trim()) submit(); else setActive(false); }}
            placeholder="Task name… (Enter to save, Esc to cancel)"
            disabled={pending}
            style={{
              width: '100%', border: '1px solid var(--mantine-color-indigo-4)',
              borderRadius: 0, padding: '4px 8px', fontSize: 13,
              outline: 'none', boxShadow: '0 0 0 2px var(--mantine-color-indigo-1)',
            }}
          />
        ) : (
          <button
            onClick={activate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              cursor: 'pointer', padding: '4px 8px', borderRadius: 0, fontSize: 13,
              color: 'var(--mantine-color-dimmed)',
            }}
          >
            <Plus size={14} /> New task
          </button>
        )}
      </Table.Td>
      {active && (
        <>
          <Table.Td>
            <Badge color="teal" variant="light" size="sm">On-demand</Badge>
          </Table.Td>
          <Table.Td>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              style={{
                border: '1px solid var(--mantine-color-gray-3)', borderRadius: 0,
                padding: '3px 6px', fontSize: 13, cursor: 'pointer', width: '100%',
              }}
            >
              <option value="">{TASK.fields.unassigned}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Table.Td>
          <Table.Td colSpan={5} />
        </>
      )}
    </Table.Tr>
  );
}

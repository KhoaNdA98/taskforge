'use client';

import { useState, useCallback, useTransition, useRef, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, DragOverlay,
  PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Group, Text, UnstyledButton } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { ChevronRight, Plus } from 'lucide-react';
import { formatMoney, formatHours } from '@/lib/format';
import { TASK } from '@/lib/strings';
import {
  type TaskWithClient, type TaskStatus, type TaskType, type Client,
  TASK_TYPE_LABEL, TASK_STATUS_LABEL,
} from '@/lib/types';
import { SortableTaskCard, TaskCardStatic } from './task-card';
import { TasksForm } from './tasks-form';
import { updateTaskPosition, deleteTask, quickAddTask } from './actions';

type GroupBy = 'status' | 'client' | 'type' | 'none';

interface Group {
  id: string;
  label: string;
  tasks: TaskWithClient[];
  color: string;
}

function midpoint(a: number | null | undefined, b: number | null | undefined): number {
  const now = Date.now();
  if (a == null && b == null) return now;
  if (a == null) return (b ?? now) - 1000;
  if (b == null) return a + 1000;
  return (a + b) / 2;
}

function buildGroups(tasks: TaskWithClient[], groupBy: GroupBy, clients: Client[]): Group[] {
  if (groupBy === 'none') {
    return [{ id: 'all', label: 'All tasks', tasks, color: 'gray' }];
  }
  if (groupBy === 'status') {
    const order: TaskStatus[] = ['todo', 'doing', 'done'];
    const colors = { todo: 'gray', doing: 'yellow', done: 'teal' } as const;
    return order.map(s => ({ id: s, label: TASK_STATUS_LABEL[s], tasks: tasks.filter(t => t.status === s), color: colors[s] }));
  }
  if (groupBy === 'type') {
    const order: TaskType[] = ['on_demand', 'maintain'];
    const colors = { on_demand: 'teal', maintain: 'indigo' } as const;
    return order.map(ty => ({ id: ty, label: TASK_TYPE_LABEL[ty], tasks: tasks.filter(t => t.type === ty), color: colors[ty] }));
  }
  if (groupBy === 'client') {
    const groups: Group[] = clients.map(c => ({
      id: c.id, label: c.name,
      tasks: tasks.filter(t => t.client_id === c.id), color: 'indigo',
    }));
    const unassigned = tasks.filter(t => !t.client_id);
    if (unassigned.length > 0 || groups.length === 0) {
      groups.push({ id: '__none__', label: 'Unassigned', tasks: unassigned, color: 'gray' });
    }
    return groups.filter(g => g.tasks.length > 0 || clients.find(c => c.id === g.id));
  }
  return [];
}

function groupFieldUpdate(
  groupBy: GroupBy, newGroupId: string,
): { field: 'status' | 'client_id' | 'type'; value: string | null } | undefined {
  if (groupBy === 'status') return { field: 'status',    value: newGroupId as TaskStatus };
  if (groupBy === 'type')   return { field: 'type',      value: newGroupId as TaskType   };
  if (groupBy === 'client') return { field: 'client_id', value: newGroupId === '__none__' ? null : newGroupId };
  return undefined;
}

function groupOverrides(groupBy: GroupBy, groupId: string): { client_id?: string | null; status?: TaskStatus; type?: TaskType } {
  if (groupBy === 'status') return { status: groupId as TaskStatus };
  if (groupBy === 'type')   return { type: groupId as TaskType };
  if (groupBy === 'client') return { client_id: groupId === '__none__' ? null : groupId };
  return {};
}

/* ── Quick-add ────────────────────────────────────────────────────────── */
function GroupQuickAdd({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [active,  setActive] = useState(false);
  const [name,    setName]   = useState('');
  const [pending, start]     = useTransition();
  const inputRef             = useRef<HTMLInputElement>(null);

  function activate() { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) { setActive(false); return; }
    start(async () => {
      await onAdd(trimmed);
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  submit();
    if (e.key === 'Escape') { setActive(false); setName(''); }
  }

  return (
    <div style={{ padding: '4px 8px' }}>
      {active ? (
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => { if (name.trim()) submit(); else setActive(false); }}
          placeholder="Task name… Enter to add, Esc to cancel"
          disabled={pending}
          style={{
            width: '100%', border: '1px solid var(--mantine-color-indigo-4)',
            borderRadius: 6, padding: '5px 10px', fontSize: 13,
            outline: 'none', boxShadow: '0 0 0 2px var(--mantine-color-indigo-1)',
          }}
        />
      ) : (
        <UnstyledButton
          onClick={activate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: 'var(--mantine-color-dimmed)', padding: '4px 8px', borderRadius: 6,
          }}
        >
          <Plus size={13} /> Add task
        </UnstyledButton>
      )}
    </div>
  );
}

/* ── Droppable container ─────────────────────────────────────────────── */
function DroppableGroup({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 32, borderRadius: 8, transition: 'background 0.15s',
        background: isOver ? 'rgba(99,102,241,0.07)' : undefined,
        outline: isOver ? '1px solid rgba(99,102,241,0.25)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

/* ── Group section ────────────────────────────────────────────────────── */
function GroupSection({
  group, groupBy, clients, currency, taskIds, selectedIds, onToggleSelect, onEdit, onDelete, onQuickAdd,
}: {
  group: Group;
  groupBy: GroupBy;
  clients: Client[];
  currency: string;
  taskIds: string[];
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onEdit: (t: TaskWithClient) => void;
  onDelete: (t: TaskWithClient) => void;
  onQuickAdd: (name: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);

  const hours  = group.tasks.filter(t => t.type === 'on_demand').reduce((s, t) => s + Number(t.hours  ?? 0), 0);
  const amount = group.tasks.filter(t => t.type === 'on_demand').reduce((s, t) => s + Number(t.amount), 0);

  const dotColor: Record<string, string> = {
    teal: 'var(--mantine-color-teal-5)', yellow: 'var(--mantine-color-yellow-5)',
    gray: 'var(--mantine-color-gray-4)', indigo: 'var(--mantine-color-indigo-5)',
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <UnstyledButton
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', width: '100%', alignItems: 'center', gap: 8,
          padding: '6px 8px', borderRadius: 6, marginBottom: 2,
        }}
        styles={{ root: { '&:hover': { background: 'rgba(255,255,255,0.04)' } } }}
      >
        <ChevronRight
          size={13}
          style={{
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s', color: 'var(--mantine-color-gray-5)',
          }}
        />
        <span
          style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: dotColor[group.color] ?? 'var(--mantine-color-gray-4)',
          }}
        />
        <Text size="xs" fw={500} c="dimmed">{group.label}</Text>
        <Text size="xs" c="dimmed" ff="monospace">{group.tasks.length}</Text>
        <Group gap="md" ml="auto" style={{ flexShrink: 0 }}>
          {hours  > 0 && <Text size="xs" c="dimmed" ff="monospace">{formatHours(hours)}</Text>}
          {amount > 0 && <Text size="xs" c="teal"   ff="monospace">{formatMoney(amount, currency)}</Text>}
        </Group>
      </UnstyledButton>

      {open && (
        <div style={{ overflow: 'hidden' }}>
          <GroupQuickAdd onAdd={onQuickAdd} />
          <DroppableGroup id={group.id}>
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              <div>
                {group.tasks.length === 0 ? (
                  <div style={{
                    margin: '4px 8px', padding: '20px 0', textAlign: 'center',
                    border: '1px dashed var(--mantine-color-gray-3)', borderRadius: 8,
                  }}>
                    <Text size="xs" c="dimmed">Drop tasks here</Text>
                  </div>
                ) : (
                  group.tasks.map(task => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      clients={clients}
                      currency={currency}
                      groupBy={groupBy}
                      selected={selectedIds?.has(task.id) ?? false}
                      onToggleSelect={onToggleSelect ? () => onToggleSelect(task.id) : undefined}
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DroppableGroup>
        </div>
      )}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export function TasksGrouped({
  tasks: initialTasks, clients, currency,
  groupBy,
  selectedIds, onToggleSelect,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  groupBy: GroupBy;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const router = useRouter();

  const [tasks,    setTasks]    = useState<TaskWithClient[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition]    = useTransition();

  const [prevInitial, setPrevInitial] = useState(initialTasks);
  if (initialTasks !== prevInitial) { setPrevInitial(initialTasks); setTasks(initialTasks); }

  const sensors = useSensors(
    useSensor(PointerSensor,  { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groups     = buildGroups(tasks, groupBy, clients);
  const activeTask = tasks.find(t => t.id === activeId);

  const groupsRef  = useRef(groups);
  // eslint-disable-next-line react-hooks/refs
  groupsRef.current = groups;
  const groupByRef = useRef(groupBy);
  // eslint-disable-next-line react-hooks/refs
  groupByRef.current = groupBy;

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  }, []);

  // Lightweight: only tracks which group is being hovered for visual highlight.
  // @dnd-kit's SortableContext handles same-group reorder animation via CSS transforms — no setState needed.
  const onDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over) return;
    const gs = groupsRef.current;
    // intentionally empty — DroppableGroup.isOver from useDroppable handles highlight
    void active; void over; void gs;
  }, []);

  const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const taskId      = active.id as string;
    const gs          = groupsRef.current;
    const gb          = groupByRef.current;
    const overIsGroup = gs.some(g => g.id === over.id);
    const findGrpId   = (id: string) => gs.find(g => g.tasks.some(t => t.id === id))?.id ?? null;
    const activeGrpId = findGrpId(taskId);
    const targetGrpId = overIsGroup
      ? (over.id as string)
      : (findGrpId(over.id as string) ?? activeGrpId ?? '');

    const activeGroup = gs.find(g => g.id === activeGrpId);
    const targetGroup = gs.find(g => g.id === targetGrpId);
    if (!activeGroup || !targetGroup) return;

    const gUpdate = groupFieldUpdate(gb, targetGrpId);
    let position: number;

    if (activeGrpId === targetGrpId) {
      // Same group — use arrayMove to compute neighbour positions
      const list     = activeGroup.tasks;
      const fromIdx  = list.findIndex(t => t.id === taskId);
      const toIdx    = overIsGroup ? list.length - 1 : list.findIndex(t => t.id === (over.id as string));
      if (fromIdx === -1 || fromIdx === toIdx) return;
      const reordered = arrayMove(list, fromIdx, toIdx < 0 ? list.length - 1 : toIdx);
      const newIdx    = reordered.findIndex(t => t.id === taskId);
      position = midpoint(
        newIdx > 0                     ? Number(reordered[newIdx - 1].position) : null,
        newIdx < reordered.length - 1  ? Number(reordered[newIdx + 1].position) : null,
      );
    } else {
      // Cross-group — drop before the over-task, or at end of target group
      if (overIsGroup) {
        const last = targetGroup.tasks[targetGroup.tasks.length - 1];
        position = midpoint(last ? Number(last.position) : null, null);
      } else {
        const overIdx = targetGroup.tasks.findIndex(t => t.id === (over.id as string));
        const prev    = overIdx > 0 ? targetGroup.tasks[overIdx - 1] : null;
        const curr    = targetGroup.tasks[overIdx];
        position = midpoint(prev ? Number(prev.position) : null, curr ? Number(curr.position) : null);
      }
    }

    // Optimistic: move task in local state so UI updates immediately after drop
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      const updated: TaskWithClient = {
        ...task, position,
        ...(gUpdate?.field === 'status'    ? { status:    gUpdate.value as TaskStatus } : {}),
        ...(gUpdate?.field === 'type'      ? { type:      gUpdate.value as TaskType   } : {}),
        ...(gUpdate?.field === 'client_id' ? { client_id: gUpdate.value               } : {}),
      };
      return [...prev.filter(t => t.id !== taskId), updated];
    });

    startTransition(async () => {
      const { error } = await updateTaskPosition(taskId, position, gUpdate);
      if (error) {
        notifications.show({ color: 'red', message: `Reorder failed: ${error}` });
        setTasks(initialTasks);
      }
    });
  }, [initialTasks]);

  const onDelete = useCallback((task: TaskWithClient) => {
    modals.openConfirmModal({
      title: TASK.deleteConfirm(task.name),
      children: <Text size="sm" c="dimmed">{TASK.deleteConfirmDetail}</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        startTransition(async () => {
          setTasks(prev => prev.filter(t => t.id !== task.id));
          await deleteTask(task.id);
          notifications.show({ message: 'Task deleted.' });
        });
      },
    });
  }, []);

  const onQuickAdd = useCallback(async (groupId: string, name: string) => {
    const { error } = await quickAddTask(name, groupOverrides(groupBy, groupId));
    if (error) { notifications.show({ color: 'red', message: `Failed: ${error}` }); return; }
    router.refresh();
  }, [groupBy, router]);

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

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div>
          {groups.map(group => (
            <GroupSection
              key={group.id}
              group={group}
              groupBy={groupBy}
              clients={clients}
              currency={currency}
              taskIds={group.tasks.map(t => t.id)}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onEdit={openEdit}
              onDelete={onDelete}
              onQuickAdd={(name) => onQuickAdd(group.id, name)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {activeTask && (
            <TaskCardStatic
              task={activeTask}
              clients={clients}
              currency={currency}
              groupBy={groupBy}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}

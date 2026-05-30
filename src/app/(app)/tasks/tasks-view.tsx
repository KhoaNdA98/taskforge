'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Group, SegmentedControl, Button, Text, Badge,
  TextInput, Select, Affix, Paper, ActionIcon, Tooltip,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Plus, Download, Search, Layers, Table2, X } from 'lucide-react';
import dayjs from 'dayjs';
import { formatMoney, formatHours } from '@/lib/format';
import { exportTasksToExcel } from '@/lib/export';
import { TASK, FILTER, UI } from '@/lib/strings';
import { type Client, type TaskWithClient, type TaskType, type TaskStatus, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from '@/lib/types';
import { bulkUpdateTasks, bulkDeleteTasks } from './actions';
import { TasksTable } from './tasks-table';
import { TasksGrouped } from './tasks-grouped';
import { TasksForm } from './tasks-form';

type ViewMode = 'table' | 'list';
type GroupBy  = 'status' | 'client' | 'type' | 'none';
type Filters  = { month: string; type: string; client: string; status: string; q: string; view: string; group: string };

export function TasksView({
  tasks, clients, currency, filters,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  filters: Filters;
}) {
  const router   = useRouter();
  const pathname = usePathname();

  const [viewMode, setViewMode] = useState<ViewMode>((filters.view === 'list' ? 'list' : 'table') as ViewMode);
  const [groupBy,  setGroupBy]  = useState<GroupBy>(
    (['status', 'client', 'type', 'none'].includes(filters.group) ? filters.group : 'status') as GroupBy,
  );
  const [search,   setSearch]   = useState(filters.q);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect    = useCallback((id: string) => setSelectedIds(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const toggleSelectAll = useCallback(() => setSelectedIds(s => s.size === tasks.length ? new Set() : new Set(tasks.map(t => t.id))), [tasks]);
  const clearSelection  = useCallback(() => setSelectedIds(new Set()), []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { clearSelection(); }, [filters.month, filters.type, filters.client, filters.status, filters.q, clearSelection]);

  function buildParams(overrides: Record<string, string> = {}) {
    return new URLSearchParams({
      month: filters.month, type: filters.type, client: filters.client,
      status: filters.status, q: filters.q, view: viewMode, group: groupBy,
      ...overrides,
    }).toString();
  }

  function setParam(key: string, value: string) {
    const params = new URLSearchParams({
      month: filters.month, type: filters.type, client: filters.client,
      status: filters.status, q: filters.q, view: viewMode, group: groupBy,
    });
    if (value && value !== 'all' && value !== '') params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function changeView(v: ViewMode) {
    setViewMode(v);
    router.replace(`${pathname}?${buildParams({ view: v })}`, { scroll: false });
  }

  function changeGroup(g: GroupBy) {
    setGroupBy(g);
    router.replace(`${pathname}?${buildParams({ group: g })}`, { scroll: false });
  }

  // Debounced search
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setParam('q', search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totals = useMemo(() => {
    const od = tasks.filter(t => t.type === 'on_demand');
    return {
      count:  tasks.length,
      hours:  od.reduce((s, t) => s + Number(t.hours ?? 0), 0),
      amount: od.reduce((s, t) => s + Number(t.amount), 0),
    };
  }, [tasks]);

  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; remove: () => void }[] = [];
    if (filters.type   !== 'all') list.push({ key: 'type',   label: TASK_TYPE_LABEL[filters.type as TaskType],       remove: () => setParam('type', 'all') });
    if (filters.status !== 'all') list.push({ key: 'status', label: TASK_STATUS_LABEL[filters.status as TaskStatus], remove: () => setParam('status', 'all') });
    if (filters.client !== 'all' && filters.client !== '') {
      const name = clients.find(c => c.id === filters.client)?.name ?? (filters.client === 'none' ? 'No client' : filters.client);
      list.push({ key: 'client', label: name, remove: () => setParam('client', 'all') });
    }
    if (filters.q) list.push({ key: 'q', label: `"${filters.q}"`, remove: () => { setSearch(''); setParam('q', ''); } });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, clients]);

  function openAdd() {
    modals.open({
      title: TASK.addTask,
      children: (
        <TasksForm
          task={null}
          clients={clients}
          onDone={() => { modals.closeAll(); router.refresh(); }}
        />
      ),
      size: 'md',
    });
  }

  // Bulk actions
  function handleBulkStatusChange(status: string) {
    const ids = [...selectedIds];
    clearSelection();
    Promise.resolve(bulkUpdateTasks(ids, { status: status as TaskStatus })).then(res => {
      if (res?.error) notifications.show({ color: 'red', message: res.error });
      else { notifications.show({ message: `Updated ${ids.length} task(s).` }); router.refresh(); }
    });
  }

  function handleBulkDelete() {
    const ids = [...selectedIds];
    modals.openConfirmModal({
      title: `Delete ${ids.length} task${ids.length !== 1 ? 's' : ''}?`,
      children: <Text size="sm" c="dimmed">{TASK.deleteConfirmDetail}</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        clearSelection();
        bulkDeleteTasks(ids).then(res => {
          if (res?.error) notifications.show({ color: 'red', message: res.error });
          else { notifications.show({ message: `Deleted ${ids.length} task(s).` }); router.refresh(); }
        });
      },
    });
  }

  const monthValue = filters.month ? dayjs(filters.month + '-01').toDate() : null;

  return (
    <>
      {/* ── Filter strip ─────────────────────────────────────────────── */}
      <Group mb="sm" wrap="wrap" gap="xs">
        <MonthPickerInput
          value={monthValue}
          onChange={d => { if (d) setParam('month', dayjs(d).format('YYYY-MM')); }}
          valueFormat="MMM YYYY"
          w={130}
          size="sm"
        />
        <Select
          value={filters.type}
          onChange={v => setParam('type', v ?? 'all')}
          data={[
            { value: 'all', label: 'All types' },
            { value: 'maintain',  label: TASK.type.maintain  },
            { value: 'on_demand', label: TASK.type.on_demand },
          ]}
          size="sm" w={130}
        />
        <Select
          value={filters.client}
          onChange={v => setParam('client', v ?? 'all')}
          data={[
            { value: 'all',  label: 'All clients' },
            { value: 'none', label: 'No client'   },
            ...clients.map(c => ({ value: c.id, label: c.name })),
          ]}
          size="sm" w={150}
        />
        <Select
          value={filters.status}
          onChange={v => setParam('status', v ?? 'all')}
          data={[
            { value: 'all',  label: 'All statuses' },
            { value: 'todo',  label: TASK.status.todo  },
            { value: 'doing', label: TASK.status.doing },
            { value: 'done',  label: TASK.status.done  },
          ]}
          size="sm" w={140}
        />
        <TextInput
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          placeholder={FILTER.searchPlaceholder}
          leftSection={<Search size={13} />}
          size="sm"
          style={{ flex: 1, minWidth: 140 }}
          rightSection={search ? (
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => { setSearch(''); setParam('q', ''); }}>
              <X size={12} />
            </ActionIcon>
          ) : null}
        />

        {/* Active filter chips */}
        {activeFilters.map(f => (
          <Badge
            key={f.key}
            variant="light"
            color="indigo"
            rightSection={
              <ActionIcon size={12} variant="transparent" color="indigo" onClick={f.remove}>
                <X size={10} />
              </ActionIcon>
            }
            style={{ cursor: 'default' }}
          >
            {f.label}
          </Badge>
        ))}
        {activeFilters.length > 1 && (
          <Text
            size="xs" c="dimmed" style={{ cursor: 'pointer' }}
            onClick={() => { setSearch(''); router.push(`${pathname}?month=${filters.month}&view=${viewMode}&group=${groupBy}`); }}
          >
            {FILTER.clearAll}
          </Text>
        )}
      </Group>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <Group mb="md" justify="space-between" wrap="wrap" gap="sm">
        <Group gap="md">
          <Text size="sm" c="dimmed">
            <Text span fw={600} c="dark">{totals.count}</Text> tasks
          </Text>
          {totals.hours > 0 && (
            <Text size="sm" c="dimmed">
              <Text span ff="monospace" c="dark">{formatHours(totals.hours)}</Text> on-demand
            </Text>
          )}
          {totals.amount > 0 && (
            <Text size="sm" fw={600} c="teal" ff="monospace">{formatMoney(totals.amount, currency)}</Text>
          )}
          {selectedIds.size > 0 && (
            <Text size="sm" c="indigo" ff="monospace">· {selectedIds.size} selected</Text>
          )}
        </Group>

        <Group gap="xs">
          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={v => changeView(v as ViewMode)}
            data={[
              { value: 'table', label: <Group gap={4} wrap="nowrap"><Table2 size={14} /><span>Table</span></Group> },
              { value: 'list',  label: <Group gap={4} wrap="nowrap"><Layers size={14} /><span>List</span></Group> },
            ]}
          />
          <Button
            variant="default"
            size="sm"
            leftSection={<Download size={14} />}
            onClick={() => exportTasksToExcel(tasks, clients, currency, filters.month)}
            disabled={tasks.length === 0}
          >
            {UI.export}
          </Button>
          <Button size="sm" leftSection={<Plus size={14} />} onClick={openAdd}>
            {TASK.addTask}
          </Button>
        </Group>
      </Group>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <TasksTable
          tasks={tasks}
          clients={clients}
          currency={currency}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      ) : (
        <TasksGrouped
          tasks={tasks}
          clients={clients}
          currency={currency}
          initialGroupBy={groupBy}
          onGroupByChange={changeGroup}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}

      {/* ── Bulk action bar ───────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <Affix position={{ bottom: 24, left: '50%' }} style={{ transform: 'translateX(-50%)' }}>
          <Paper shadow="lg" p="sm" radius="lg" withBorder style={{ background: 'white' }}>
            <Group gap="sm">
              <Text size="sm" fw={500}>{selectedIds.size} selected</Text>
              <Select
                placeholder="Set status…"
                size="xs"
                w={140}
                data={[
                  { value: 'todo',  label: TASK.status.todo  },
                  { value: 'doing', label: TASK.status.doing },
                  { value: 'done',  label: TASK.status.done  },
                ]}
                onChange={v => { if (v) handleBulkStatusChange(v); }}
              />
              <Button size="xs" color="red" variant="light" onClick={handleBulkDelete}>
                Delete
              </Button>
              <Tooltip label="Clear selection" withArrow>
                <ActionIcon variant="subtle" color="gray" onClick={clearSelection}>
                  <X size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Paper>
        </Affix>
      )}
    </>
  );
}

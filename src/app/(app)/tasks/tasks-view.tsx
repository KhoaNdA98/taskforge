'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { exportTasksToExcel } from '@/lib/export';
import { TASK, FILTER } from '@/lib/strings';
import { type Client, type TaskWithClient } from '@/lib/types';
import { useModal } from '@/components/ui/modal';
import { TasksForm } from './tasks-form';
import { TasksInventory } from './tasks-inventory';

type Filters = { month: string; type: string; client: string; status: string; q: string };

const S = {
  filterBar: { display: 'flex' as const, flexWrap: 'wrap' as const, gap: '8px', marginBottom: '16px', alignItems: 'center' },
  toolbar: { display: 'flex' as const, alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '10px' },
  count: { fontFamily: "'VT323', monospace", fontSize: '14px', color: '#6b7280', letterSpacing: '0.06em' },
  btnGroup: { display: 'flex' as const, gap: '8px' },
};

export function TasksView({ tasks, clients, currency, filters }: {
  tasks: TaskWithClient[]; clients: Client[]; currency: string; filters: Filters;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const { open } = useModal();
  const [search, setSearch] = useState(filters.q);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams({
      month: filters.month, type: filters.type,
      client: filters.client, status: filters.status, q: filters.q,
    });
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setParam('q', search), 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openAdd = useCallback(() => {
    open({
      title: TASK.addTask,
      content: (
        <TasksForm
          task={null}
          clients={clients}
          onDone={() => { open({ title: '', content: null }); router.refresh(); }}
        />
      ),
    });
  }, [clients, open, router]);

  return (
    <>
      {/* Filter bar */}
      <div style={S.filterBar}>
        <input type="month" value={filters.month} onChange={e => setParam('month', e.target.value)} className="px-input" style={{ width: '150px' }} />
        <select value={filters.type} onChange={e => setParam('type', e.target.value)} className="px-input" style={{ width: '140px' }}>
          <option value="all">All types</option>
          <option value="on_demand">{TASK.type.on_demand}</option>
          <option value="maintain">{TASK.type.maintain}</option>
        </select>
        <select value={filters.client} onChange={e => setParam('client', e.target.value)} className="px-input" style={{ width: '150px' }}>
          <option value="all">All clients</option>
          <option value="none">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.status} onChange={e => setParam('status', e.target.value)} className="px-input" style={{ width: '150px' }}>
          <option value="all">All statuses</option>
          <option value="todo">{TASK.status.todo}</option>
          <option value="doing">{TASK.status.doing}</option>
          <option value="done">{TASK.status.done}</option>
        </select>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={FILTER.searchPlaceholder}
          className="px-input" style={{ flex: 1, minWidth: '140px' }}
        />
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <span style={S.count}>{tasks.length} QUEST{tasks.length !== 1 ? 'S' : ''}</span>
        <div style={S.btnGroup}>
          <button className="px-btn px-btn-cyan" onClick={() => exportTasksToExcel(tasks, clients, currency, filters.month)} disabled={tasks.length === 0}>
            ↓ EXPORT
          </button>
          <button id="add-task-btn" className="px-btn px-btn-primary" onClick={openAdd}>
            + NEW QUEST
          </button>
        </div>
      </div>

      <TasksInventory tasks={tasks} clients={clients} currency={currency} />
    </>
  );
}

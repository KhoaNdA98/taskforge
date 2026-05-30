'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Download, Plus } from 'lucide-react';
import { exportTasksToExcel } from '@/lib/export';
import { TASK, FILTER } from '@/lib/strings';
import { type Client, type TaskWithClient } from '@/lib/types';
import { useModal } from '@/components/ui/modal';
import { TasksForm } from './tasks-form';
import { TasksInventory } from './tasks-inventory';

type Filters = { month: string; type: string; client: string; status: string; q: string };

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
    if (value && value !== 'all' && value !== '') params.set(key, value);
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

  const totalOD = tasks.filter(t => t.type === 'on_demand');
  const totalCount = tasks.length;

  return (
    <>
      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Month */}
        <input
          type="month"
          value={filters.month}
          onChange={e => setParam('month', e.target.value)}
          className="px-input w-36"
        />
        {/* Type */}
        <select value={filters.type} onChange={e => setParam('type', e.target.value)} className="px-input w-36">
          <option value="all">All types</option>
          <option value="on_demand">{TASK.type.on_demand}</option>
          <option value="maintain">{TASK.type.maintain}</option>
        </select>
        {/* Client */}
        <select value={filters.client} onChange={e => setParam('client', e.target.value)} className="px-input w-40">
          <option value="all">All clients</option>
          <option value="none">No client</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {/* Status */}
        <select value={filters.status} onChange={e => setParam('status', e.target.value)} className="px-input w-40">
          <option value="all">All statuses</option>
          <option value="todo">{TASK.status.todo}</option>
          <option value="doing">{TASK.status.doing}</option>
          <option value="done">{TASK.status.done}</option>
        </select>
        {/* Search */}
        <div className="relative flex-1 min-w-36">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={FILTER.searchPlaceholder}
            className="px-input pl-8"
          />
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <span className="font-pixel text-[14px] text-white/35 tracking-[0.06em]">
          {totalCount} QUEST{totalCount !== 1 ? 'S' : ''}
          {totalOD.length > 0 && (
            <span className="ml-4 text-px-green">
              +{totalOD.reduce((s, t) => s + Number(t.hours ?? 0), 0)}H
            </span>
          )}
        </span>
        <div className="flex gap-2">
          <button
            className="px-btn px-btn-cyan flex items-center gap-2"
            onClick={() => exportTasksToExcel(tasks, clients, currency, filters.month)}
            disabled={tasks.length === 0}
          >
            <Download size={14} />
            EXPORT
          </button>
          <button
            id="add-task-btn"
            className="px-btn px-btn-primary flex items-center gap-2"
            onClick={openAdd}
          >
            <Plus size={14} />
            + NEW QUEST
          </button>
        </div>
      </div>

      {/* ── Quest Board ─────────────────────────────────────── */}
      <TasksInventory tasks={tasks} clients={clients} currency={currency} />
    </>
  );
}

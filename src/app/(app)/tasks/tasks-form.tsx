'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { TASK } from '@/lib/strings';
import { type Client, type TaskWithClient } from '@/lib/types';
import { saveTask } from './actions';

export function TasksForm({ task, clients, onDone }: {
  task: TaskWithClient | null; clients: Client[]; onDone: () => void;
}) {
  const [pending,  setPending]  = useState(false);
  const [taskType, setTaskType] = useState(task?.type ?? 'on_demand');
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    if (task) fd.set('id', task.id);
    const res = await saveTask({}, fd);
    setPending(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(task ? '// Quest updated.' : '// New quest added.');
      onDone();
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = task?.task_date ? task.task_date.slice(0, 10) : today;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      {/* Task name */}
      <div className="px-field">
        <label className="px-label" htmlFor="tf-name">{TASK.fields.name}</label>
        <input
          id="tf-name" name="name" required autoFocus
          defaultValue={task?.name ?? ''}
          placeholder={TASK.fields.namePlaceholder}
          className="px-input"
        />
      </div>

      {/* Type + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="px-field">
          <label className="px-label" htmlFor="tf-type">{TASK.fields.type}</label>
          <select
            id="tf-type" name="type"
            defaultValue={task?.type ?? 'on_demand'}
            onChange={e => setTaskType(e.target.value as 'on_demand' | 'maintain')}

            className="px-input"
          >
            <option value="on_demand">{TASK.type.on_demand}</option>
            <option value="maintain">{TASK.type.maintain}</option>
          </select>
        </div>
        <div className="px-field">
          <label className="px-label" htmlFor="tf-date">{TASK.fields.date}</label>
          <input
            id="tf-date" name="task_date" type="date" required
            defaultValue={defaultDate}
            className="px-input"
          />
        </div>
      </div>

      {/* Client + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="px-field">
          <label className="px-label" htmlFor="tf-client">{TASK.fields.client}</label>
          <select id="tf-client" name="client_id" defaultValue={task?.client_id ?? ''} className="px-input">
            <option value="">{TASK.fields.unassigned}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="px-field">
          <label className="px-label" htmlFor="tf-status">{TASK.fields.status}</label>
          <select id="tf-status" name="status" defaultValue={task?.status ?? 'todo'} className="px-input">
            <option value="todo">{TASK.status.todo}</option>
            <option value="doing">{TASK.status.doing}</option>
            <option value="review">{TASK.status.review}</option>
            <option value="done">{TASK.status.done}</option>
          </select>
        </div>
      </div>

      {/* Hours — only for on_demand */}
      {taskType === 'on_demand' && (
        <div className="px-field">
          <label className="px-label" htmlFor="tf-hours">{TASK.fields.hours}</label>
          <input
            id="tf-hours" name="hours" type="number" min="0" step="0.25"
            defaultValue={task?.hours ?? ''}
            placeholder={TASK.fields.hoursPlaceholder}
            className="px-input"
          />
          <span className="font-pixel text-[12px] text-white/25 tracking-[0.04em]">
            {TASK.fields.hoursHint}
          </span>
        </div>
      )}

      {/* Note */}
      <div className="px-field">
        <label className="px-label" htmlFor="tf-note">{TASK.fields.note}</label>
        <textarea
          id="tf-note" name="note" rows={2}
          defaultValue={task?.note ?? ''}
          className="px-input resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-2">
        <button type="button" className="px-btn px-btn-ghost" onClick={onDone}>CANCEL</button>
        <button type="submit" disabled={pending} className="px-btn px-btn-primary">
          {pending ? 'SAVING...' : TASK.saveTask.toUpperCase()}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from '@mantine/form';
import { TextInput, Select, Textarea, Button, Group, Collapse, NumberInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { TASK } from '@/lib/strings';
import { type Client, type TaskWithClient, type TaskType } from '@/lib/types';
import { saveTask } from './actions';

export function TasksForm({
  task,
  clients,
  onDone,
}: {
  task: TaskWithClient | null;
  clients: Client[];
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);

  const form = useForm({
    initialValues: {
      name:       task?.name ?? '',
      type:       (task?.type ?? 'on_demand') as TaskType,
      task_date:  task?.task_date ? new Date(task.task_date) : new Date(),
      client_id:  task?.client_id ?? '',
      status:     task?.status ?? 'todo',
      hours:      task?.hours != null ? Number(task.hours) : (null as number | null),
      note:       task?.note ?? '',
    },
    validate: {
      name: (v) => (v.trim() ? null : TASK.fields.name + ' is required'),
    },
  });

  const isOnDemand = form.values.type === 'on_demand';

  const handleSubmit = form.onSubmit(async (values) => {
    setPending(true);
    const fd = new FormData();
    if (task) fd.set('id', task.id);
    fd.set('name',      values.name.trim());
    fd.set('type',      values.type);
    fd.set('task_date', dayjs(values.task_date).format('YYYY-MM-DD'));
    fd.set('client_id', values.client_id);
    fd.set('status',    values.status);
    if (values.type === 'on_demand' && values.hours != null) {
      fd.set('hours', String(values.hours));
    }
    fd.set('note', values.note);

    const res = await saveTask({}, fd);
    setPending(false);
    if (res.error) {
      notifications.show({ color: 'red', message: res.error });
    } else {
      notifications.show({ message: task ? 'Task updated.' : 'Task added.' });
      onDone();
    }
  });

  const clientOptions = [
    { value: '', label: TASK.fields.unassigned },
    ...clients.map(c => ({ value: c.id, label: c.name })),
  ];

  const statusOptions = [
    { value: 'todo',  label: TASK.status.todo  },
    { value: 'doing', label: TASK.status.doing },
    { value: 'done',  label: TASK.status.done  },
  ];

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label={TASK.fields.name}
        placeholder={TASK.fields.namePlaceholder}
        required
        autoFocus
        mb="sm"
        {...form.getInputProps('name')}
      />

      <Group grow mb="sm">
        <Select
          label={TASK.fields.type}
          data={[
            { value: 'on_demand', label: TASK.type.on_demand },
            { value: 'maintain',  label: TASK.type.maintain  },
          ]}
          {...form.getInputProps('type')}
        />
        <DateInput
          label={TASK.fields.date}
          valueFormat="YYYY-MM-DD"
          required
          {...form.getInputProps('task_date')}
        />
      </Group>

      <Group grow mb="sm">
        <Select
          label={TASK.fields.client}
          data={clientOptions}
          clearable
          {...form.getInputProps('client_id')}
        />
        <Select
          label={TASK.fields.status}
          data={statusOptions}
          {...form.getInputProps('status')}
        />
      </Group>

      <Collapse expanded={isOnDemand} transitionDuration={150}>
        <NumberInput
          label={TASK.fields.hours}
          description={TASK.fields.hoursHint}
          placeholder={TASK.fields.hoursPlaceholder}
          min={0}
          step={0.25}
          decimalScale={2}
          mb="sm"
          {...form.getInputProps('hours')}
        />
      </Collapse>

      <Textarea
        label={TASK.fields.note}
        mb="md"
        autosize
        minRows={2}
        {...form.getInputProps('note')}
      />

      <Group justify="flex-end">
        <Button type="submit" loading={pending}>
          {TASK.saveTask}
        </Button>
      </Group>
    </form>
  );
}

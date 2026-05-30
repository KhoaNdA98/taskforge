import { Suspense } from 'react';
import { Stack, Title, Text, Skeleton } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/dal';
import { currentMonth, monthRange } from '@/lib/format';
import { TASK } from '@/lib/strings';
import type { Client, TaskWithClient } from '@/lib/types';
import { TasksView } from './tasks-view';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function TasksPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2} style={{ letterSpacing: '-0.02em' }}>{TASK.title}</Title>
        <Text size="sm" c="dimmed">{TASK.subtitle}</Text>
      </div>
      <Suspense fallback={<Skeleton h={400} radius="lg" />}>
        <TasksLoader searchParams={searchParams} />
      </Suspense>
    </Stack>
  );
}

async function TasksLoader({ searchParams }: { searchParams: Promise<SP> }) {
  const sp     = await searchParams;
  const month  = one(sp.month)  || currentMonth();
  const type   = one(sp.type)   || 'all';
  const client = one(sp.client) || 'all';
  const status = one(sp.status) || 'all';
  const q      = one(sp.q)      || '';
  const view   = one(sp.view)   || 'table';
  const group  = one(sp.group)  || 'status';

  const settings = await getSettings();
  const supabase = await createClient();

  const [{ data: clientRows }, taskRes] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    (async () => {
      let query = supabase
        .from('tasks')
        .select('*, client:clients(name)')
        .order('position', { ascending: false, nullsFirst: false })
        .order('task_date',  { ascending: false })
        .order('created_at', { ascending: false });

      if (month) { const { start, end } = monthRange(month); query = query.gte('task_date', start).lte('task_date', end); }
      if (type   !== 'all') query = query.eq('type',   type);
      if (status !== 'all') query = query.eq('status', status);
      if (client === 'none') query = query.is('client_id', null);
      else if (client !== 'all') query = query.eq('client_id', client);
      if (q) query = query.ilike('name', `%${q}%`);

      return query;
    })(),
  ]);

  return (
    <TasksView
      tasks={(taskRes.data ?? []) as TaskWithClient[]}
      clients={(clientRows ?? []) as Client[]}
      currency={settings.currency}
      filters={{ month, type, client, status, q, view, group }}
    />
  );
}

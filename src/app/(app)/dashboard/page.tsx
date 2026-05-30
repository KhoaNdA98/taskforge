import { Suspense } from 'react';
import Link from 'next/link';
import {
  SimpleGrid, Card, Text, Group, Title, Stack,
  Badge, Skeleton, Table, ThemeIcon, Anchor,
} from '@mantine/core';
import {
  Clock, Wallet, Repeat, Coins, ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/dal';
import { CompletionWidget, DeltaWidget, UnbilledWidget } from './widgets';
import { formatMoney, formatDate, currentMonth, monthRange, monthLabel } from '@/lib/format';
import { DASHBOARD } from '@/lib/strings';
import { type Client, type TaskWithClient, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from '@/lib/types';
import { MonthSelect } from './month-select';

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp    = await searchParams;
  const month = one(sp.month) || currentMonth();

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} style={{ letterSpacing: '-0.02em' }}>{DASHBOARD.title}</Title>
          <Text size="sm" c="dimmed">Overview for {monthLabel(month)}</Text>
        </div>
        <MonthSelect month={month} />
      </Group>

      <Suspense fallback={<SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md"><Skeleton h={96} radius="lg" /><Skeleton h={96} radius="lg" /><Skeleton h={96} radius="lg" /><Skeleton h={96} radius="lg" /></SimpleGrid>}>
        <DashboardStats month={month} />
      </Suspense>

      <Suspense fallback={<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md"><Skeleton h={128} radius="lg" /><Skeleton h={128} radius="lg" /><Skeleton h={128} radius="lg" /></SimpleGrid>}>
        <InsightsRow month={month} />
      </Suspense>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--mantine-spacing-md)' }}>
        <div style={{ gridColumn: 'span 3', minWidth: 0 }}>
          <Suspense fallback={<Skeleton h={240} radius="lg" />}>
            <RecentTasks month={month} />
          </Suspense>
        </div>
        <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <Suspense fallback={<Skeleton h={240} radius="lg" />}>
            <ClientRevenue month={month} />
          </Suspense>
        </div>
      </div>
    </Stack>
  );
}

/* ── Stat cards ─────────────────────────────────────────────────────── */
async function DashboardStats({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const [{ data: clientRows }, { data: taskRows }] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('tasks').select('type, hours, amount, status').gte('task_date', start).lte('task_date', end),
  ]);

  const clients = (clientRows ?? []) as Client[];
  const tasks   = (taskRows   ?? []) as Pick<TaskWithClient, 'type' | 'hours' | 'amount' | 'status'>[];

  const onDemandHours   = tasks.filter(t => t.type === 'on_demand').reduce((s, t) => s + Number(t.hours ?? 0), 0);
  const onDemandRevenue = tasks.filter(t => t.type === 'on_demand').reduce((s, t) => s + Number(t.amount), 0);
  const retainerRevenue = clients.filter(c => c.is_maintain_active).reduce((s, c) => s + Number(c.monthly_retainer), 0);
  const total           = onDemandRevenue + retainerRevenue;

  const stats = [
    { icon: Clock,  label: DASHBOARD.stats.onDemandHours,   color: 'gray',   value: `${onDemandHours}h`                     },
    { icon: Wallet, label: DASHBOARD.stats.onDemandRevenue, color: 'teal',   value: formatMoney(onDemandRevenue, cur)        },
    { icon: Repeat, label: DASHBOARD.stats.retainer,        color: 'indigo', value: formatMoney(retainerRevenue, cur)        },
    { icon: Coins,  label: DASHBOARD.stats.total,           color: 'gray',   value: formatMoney(total, cur)                  },
  ];

  return (
    <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
      {stats.map(({ icon: Icon, label, color, value }) => (
        <Card key={label}>
          <Group gap="xs" mb="xs">
            <ThemeIcon variant="light" color={color} size="sm" radius="xl">
              <Icon size={14} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" fw={500}>{label}</Text>
          </Group>
          <Text fw={700} size="xl" style={{ letterSpacing: '-0.02em' }}>{value}</Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}

/* ── Insights widgets row ───────────────────────────────────────────── */
async function InsightsRow({ month }: { month: string }) {
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const cur_r  = monthRange(month);
  const prev   = prevMonth(month);
  const prev_r = monthRange(prev);

  const [{ data: curRows }, { data: prevRows }, { data: clientRows }] = await Promise.all([
    supabase.from('tasks').select('id, name, type, hours, amount, status').gte('task_date', cur_r.start).lte('task_date', cur_r.end),
    supabase.from('tasks').select('type, amount').eq('type', 'on_demand').gte('task_date', prev_r.start).lte('task_date', prev_r.end),
    supabase.from('clients').select('is_maintain_active, monthly_retainer'),
  ]);

  const tasks = (curRows ?? []) as Pick<TaskWithClient, 'id' | 'name' | 'type' | 'hours' | 'amount' | 'status'>[];

  const todo  = tasks.filter(t => t.status === 'todo').length;
  const doing = tasks.filter(t => t.status === 'doing').length;
  const done  = tasks.filter(t => t.status === 'done').length;

  const retainer     = (clientRows ?? []).filter(c => c.is_maintain_active).reduce((s, c) => s + Number(c.monthly_retainer), 0);
  const curOnDemand  = tasks.filter(t => t.type === 'on_demand').reduce((s, t) => s + Number(t.amount), 0);
  const prevOnDemand = (prevRows ?? []).reduce((s, t) => s + Number(t.amount), 0);

  const unbilled = tasks
    .filter(t => t.type === 'on_demand' && (t.hours == null || Number(t.hours) === 0))
    .map(t => ({ id: t.id, name: t.name }));

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      <CompletionWidget todo={todo} doing={doing} done={done} />
      <DeltaWidget current={curOnDemand + retainer} previous={prevOnDemand + retainer} currency={cur} />
      <UnbilledWidget tasks={unbilled} month={month} />
    </SimpleGrid>
  );
}

/* ── Recent tasks ───────────────────────────────────────────────────── */
async function RecentTasks({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const { data } = await supabase
    .from('tasks').select('*, client:clients(name)')
    .gte('task_date', start).lte('task_date', end)
    .order('task_date', { ascending: false }).limit(8);

  const tasks     = (data ?? []) as TaskWithClient[];
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const typeColor: Record<string, string> = { on_demand: 'teal', maintain: 'indigo' };

  return (
    <Card h="100%">
      <Group justify="space-between" mb="md">
        <Text fw={600} size="sm">{DASHBOARD.recentTasks}</Text>
        <Anchor component={Link} href="/tasks" size="xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {DASHBOARD.viewAll} <ArrowRight size={13} />
        </Anchor>
      </Group>

      {tasks.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">{DASHBOARD.noTasks}</Text>
      ) : (
        <Table striped={false} highlightOnHover withRowBorders={false} verticalSpacing={6}>
          <Table.Tbody>
            {tasks.map(t => (
              <Table.Tr key={t.id}>
                <Table.Td w={50}>
                  <Text size="xs" c="dimmed" ff="monospace">{formatDate(t.task_date).slice(0, 5)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" truncate maw={240}>{t.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={typeColor[t.type]} variant="light" size="sm">{TASK_TYPE_LABEL[t.type]}</Badge>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="xs" c="dimmed" ff="monospace">
                    {t.type === 'on_demand' ? formatMoney(t.amount, cur) : TASK_STATUS_LABEL[t.status]}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Group justify="space-between" mt="md" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
        <Text size="xs" c="dimmed">{DASHBOARD.taskCount(tasks.length)}</Text>
        <Text size="xs" c="dimmed">{DASHBOARD.doneCount(doneCount)}</Text>
      </Group>
    </Card>
  );
}

/* ── Per-client revenue ─────────────────────────────────────────────── */
async function ClientRevenue({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const [{ data: clientRows }, { data: taskRows }] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('tasks').select('client_id, amount, client:clients(name)').eq('type', 'on_demand').gte('task_date', start).lte('task_date', end),
  ]);

  const clients = (clientRows ?? []) as Client[];
  const tasks   = (taskRows   ?? []) as unknown as Pick<TaskWithClient, 'client_id' | 'amount' | 'client'>[];

  const byClient = new Map<string, { name: string; amount: number }>();
  for (const t of tasks) {
    const key  = t.client_id ?? '__none__';
    const name = (t.client as { name: string } | null)?.name ?? '(unassigned)';
    const e    = byClient.get(key) ?? { name, amount: 0 };
    e.amount  += Number(t.amount);
    byClient.set(key, e);
  }
  const clientRevenue = [...byClient.values()].sort((a, b) => b.amount - a.amount);
  const retainerTotal = clients.filter(c => c.is_maintain_active).reduce((s, c) => s + Number(c.monthly_retainer), 0);

  return (
    <Card h="100%">
      <Text fw={600} size="sm" mb="md">{DASHBOARD.revenueByClient}</Text>

      {clientRevenue.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="xl">{DASHBOARD.noRevenue}</Text>
      ) : (
        <Stack gap={6}>
          {clientRevenue.map(c => (
            <Group key={c.name} justify="space-between">
              <Text size="sm" truncate style={{ flex: 1 }}>{c.name}</Text>
              <Text size="xs" c="teal" ff="monospace">{formatMoney(c.amount, cur)}</Text>
            </Group>
          ))}
        </Stack>
      )}

      {retainerTotal > 0 && (
        <Group justify="space-between" mt="md" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Text size="xs" c="dimmed">Retainer (maintain)</Text>
          <Text size="xs" c="indigo" ff="monospace">{formatMoney(retainerTotal, cur)}</Text>
        </Group>
      )}
    </Card>
  );
}

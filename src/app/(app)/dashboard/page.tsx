import { Suspense } from 'react';
import Link from 'next/link';
import {
  SimpleGrid, Text, Group, Title, Stack,
  Skeleton,
} from '@mantine/core';
import {
  Clock, Wallet, Repeat, Coins, ArrowRight,
} from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  todo:  { label: 'TODO', color: '#A78BFA' },
  doing: { label: 'WIP',  color: '#FCD34D' },
  done:  { label: 'DONE', color: '#22c55e' },
};
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/dal';
import { CompletionWidget, DeltaWidget, DebtWidget } from './widgets';
import { formatMoney, formatDate, currentMonth, monthRange, monthLabel } from '@/lib/format';
import { DASHBOARD } from '@/lib/strings';
import { type Client, type TaskWithClient } from '@/lib/types';
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

      <Suspense fallback={<Skeleton h={160} />}>
        <BossStage month={month} />
      </Suspense>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--mantine-spacing-md)' }}>
        <div style={{ gridColumn: 'span 3', minWidth: 0 }}>
          <Suspense fallback={<Skeleton h={240} />}>
            <RecentTasks month={month} />
          </Suspense>
        </div>
        <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
          <Suspense fallback={<Skeleton h={240} />}>
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

  const accentMap: Record<string, string> = {
    gray: 'rgba(255,255,255,0.3)', teal: '#4ADE80', indigo: '#A78BFA',
  };

  return (
    <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
      {stats.map(({ label, color, value }) => {
        const accent = accentMap[color] ?? 'rgba(255,255,255,0.3)';
        return (
          <div key={label} style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: `2px solid ${accent}`,
            padding: '14px 16px',
            background: 'rgba(0,0,0,0.3)',
            position: 'relative',
            boxShadow: `0 0 20px ${accent}0A`,
          }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              {label.toUpperCase().replace(/ /g, '_')}
            </div>
            <div style={{ fontSize: 28, lineHeight: 1, color: accent, textShadow: `0 0 16px ${accent}55`, fontFamily: 'inherit' }}>
              {value}
            </div>
          </div>
        );
      })}
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

  const debt = tasks
    .filter(t => t.type === 'on_demand' && (t.status === 'todo' || t.status === 'doing'))
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      <CompletionWidget todo={todo} doing={doing} done={done} />
      <DeltaWidget current={curOnDemand + retainer} previous={prevOnDemand + retainer} currency={cur} />
      <DebtWidget amount={debt} currency={cur} />
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

  return (
    <div style={{
      border: '1px solid rgba(139,92,246,0.2)',
      background: 'rgba(0,0,0,0.25)',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(139,92,246,0.2)',
        background: 'rgba(139,92,246,0.06)',
      }}>
        <span style={{ color: '#22D3EE', fontSize: 13, letterSpacing: '0.12em' }}>
          // {DASHBOARD.recentTasks.toUpperCase()}
        </span>
        <Link href="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#A78BFA', textDecoration: 'none', letterSpacing: '0.06em' }}>
          {DASHBOARD.viewAll} <ArrowRight size={12} />
        </Link>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '46px 1fr 80px 92px 80px',
        gap: 8, padding: '6px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: 11, letterSpacing: '0.12em', color: '#22D3EE',
      }}>
        <span>DATE</span>
        <span>NHIỆM VỤ</span>
        <span>KHÁCH HÀNG</span>
        <span style={{ textAlign: 'right' }}>PHẦN THƯỞNG</span>
        <span style={{ textAlign: 'right' }}>TRẠNG THÁI</span>
      </div>

      {tasks.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 15, letterSpacing: '0.08em' }}>
          {'// NO QUESTS LOGGED'}
        </div>
      ) : (
        tasks.map(t => {
          const badge = STATUS_BADGE[t.status] ?? { label: t.status, color: '#fff' };
          const clientName = (t.client as { name: string } | null)?.name ?? '—';
          return (
            <div key={t.id} style={{
              display: 'grid', gridTemplateColumns: '46px 1fr 80px 92px 80px',
              gap: 8, padding: '6px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              borderLeft: `2px solid ${badge.color}44`,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                {formatDate(t.task_date).slice(0, 5)}
              </span>
              <span style={{
                fontSize: 14, color: t.status === 'done' ? 'rgba(255,255,255,0.5)' : '#E8E8F0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {t.name}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {clientName}
              </span>
              <span style={{ fontSize: 13, color: '#22c55e', textAlign: 'right', letterSpacing: '0.02em' }}>
                {t.type === 'on_demand' ? formatMoney(t.amount, cur) : '——'}
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  color: badge.color, border: `1px solid ${badge.color}`,
                  padding: '1px 5px', fontSize: 12, letterSpacing: '0.06em',
                }}>
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })
      )}

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '8px 14px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em',
      }}>
        <span>{DASHBOARD.taskCount(tasks.length)}</span>
        <span>{DASHBOARD.doneCount(doneCount)}</span>
      </div>
    </div>
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
    <div style={{
      border: '1px solid rgba(139,92,246,0.2)',
      background: 'rgba(0,0,0,0.25)',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
      height: '100%',
      padding: '14px',
    }}>
      <div style={{
        color: '#22D3EE', fontSize: 13, letterSpacing: '0.12em',
        marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8,
      }}>
        // {DASHBOARD.revenueByClient.toUpperCase()}
      </div>

      {clientRevenue.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14, padding: '24px 0', letterSpacing: '0.08em' }}>
          {DASHBOARD.noRevenue}
        </div>
      ) : (
        <Stack gap={6}>
          {clientRevenue.map(c => (
            <Group key={c.name} justify="space-between">
              <Text size="sm" truncate style={{ flex: 1, color: 'rgba(255,255,255,0.7)' }}>{c.name}</Text>
              <Text size="xs" style={{ color: '#22c55e', fontFamily: 'inherit' }}>{formatMoney(c.amount, cur)}</Text>
            </Group>
          ))}
        </Stack>
      )}

      {retainerTotal > 0 && (
        <Group justify="space-between" mt="md" pt="xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Text size="xs" c="dimmed">Retainer (maintain)</Text>
          <Text size="xs" style={{ color: '#A78BFA', fontFamily: 'inherit' }}>{formatMoney(retainerTotal, cur)}</Text>
        </Group>
      )}
    </div>
  );
}

/* ── Boss Stage ─────────────────────────────────────────────────────── */
async function BossStage({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const supabase = await createClient();
  const { data } = await supabase
    .from('tasks').select('status')
    .gte('task_date', start).lte('task_date', end);

  const tasks   = (data ?? []) as { status: string }[];
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === 'done').length;
  const todo    = tasks.filter(t => t.status === 'todo').length;
  const doing   = tasks.filter(t => t.status === 'doing').length;
  const cleared = total > 0 && done === total;
  const hpPct   = total === 0 ? 100 : Math.round(((total - done) / total) * 100);
  const hpFill  = Math.round((1 - done / Math.max(total, 1)) * 24);
  const hpEmpty = 24 - hpFill;
  const bossSprite = cleared ? '💀' : hpPct < 30 ? '😤' : hpPct < 70 ? '👹' : '👾';
  const hpColor    = cleared ? '#4ADE80' : hpPct < 30 ? '#FCD34D' : '#F87171';

  return (
    <div style={{
      border: `1px solid ${cleared ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.2)'}`,
      background: 'rgba(0,0,0,0.3)',
      padding: '16px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: cleared
          ? 'radial-gradient(ellipse at center, rgba(74,222,128,0.04) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at center, rgba(248,113,113,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
        {/* Boss sprite */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 52, lineHeight: 1, filter: cleared ? 'grayscale(1) opacity(0.5)' : 'none' }}>
            {bossSprite}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginTop: 4 }}>
            {cleared ? '[ DEFEATED ]' : '[ ACTIVE ]'}
          </div>
        </div>

        {/* HP + info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)' }}>
              MONTHLY_BOSS
            </Text>
            <Text style={{ fontSize: 11, letterSpacing: '0.1em', color: hpColor }}>
              HP: {total - done}/{total}
            </Text>
          </div>

          {/* HP bar */}
          <div style={{ marginBottom: 8 }}>
            {cleared ? (
              <Text style={{ color: '#4ADE80', fontSize: 22, letterSpacing: '0.06em', textShadow: '0 0 16px rgba(74,222,128,0.6)' }}>
                ★ STAGE CLEAR ★
              </Text>
            ) : (
              <div>
                <span style={{ color: hpColor, letterSpacing: 1, fontSize: 16, fontFamily: 'inherit' }}>
                  {'█'.repeat(hpFill)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.1)', letterSpacing: 1, fontSize: 16, fontFamily: 'inherit' }}>
                  {'░'.repeat(hpEmpty)}
                </span>
                <span style={{ color: hpColor, marginLeft: 8, fontSize: 14 }}>{hpPct}%</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span style={{ color: '#4ADE80' }}>✓ SLAIN: {done}</span>
            <span style={{ color: '#FCD34D' }}>⚔ IN_COMBAT: {doing}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>○ REMAINING: {todo}</span>
            {!cleared && total > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                {'// DEFEAT ALL TO CLEAR STAGE'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

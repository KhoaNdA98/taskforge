import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/dal';
import { CompletionWidget, DeltaWidget, DebtWidget } from './widgets';
import { formatMoney, formatDate, currentMonth, monthRange, monthLabel } from '@/lib/format';
import { DASHBOARD } from '@/lib/strings';
import { type Client, type TaskWithClient } from '@/lib/types';
import { MonthSelect } from './month-select';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  todo:  { label: 'TODO', color: '#a855f7' },
  doing: { label: 'WIP',  color: '#eab308' },
  done:  { label: 'DONE', color: '#22c55e' },
};

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="px-section-title">{DASHBOARD.title}</div>
          <div className="font-pixel text-[14px] text-white/30 tracking-[0.06em] mt-0.5">
            Overview for {monthLabel(month)}
          </div>
        </div>
        <MonthSelect month={month} />
      </div>

      {/* Stat cards */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats month={month} />
      </Suspense>

      {/* Insight widgets */}
      <Suspense fallback={<div className="grid grid-cols-3 gap-4"><SkeletonBox /><SkeletonBox /><SkeletonBox /></div>}>
        <InsightsRow month={month} />
      </Suspense>

      {/* Boss stage */}
      <Suspense fallback={<SkeletonBox h="h-28" />}>
        <BossStage month={month} />
      </Suspense>

      {/* Recent + Revenue */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 min-w-0">
          <Suspense fallback={<SkeletonBox h="h-60" />}>
            <RecentTasks month={month} />
          </Suspense>
        </div>
        <div className="col-span-2 min-w-0">
          <Suspense fallback={<SkeletonBox h="h-60" />}>
            <ClientRevenue month={month} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function SkeletonBox({ h = 'h-24' }: { h?: string }) {
  return <div className={`${h} bg-px-card border border-px-border animate-pulse`} />;
}
function StatsSkeleton() {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><SkeletonBox /><SkeletonBox /><SkeletonBox /><SkeletonBox /></div>;
}

/* ── Stat cards ─────────────────────────────────────────────── */
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
    { label: DASHBOARD.stats.onDemandHours,   accent: 'rgba(255,255,255,0.35)', value: `${onDemandHours}h`                },
    { label: DASHBOARD.stats.onDemandRevenue, accent: '#22c55e',                value: formatMoney(onDemandRevenue, cur)   },
    { label: DASHBOARD.stats.retainer,        accent: '#a855f7',                value: formatMoney(retainerRevenue, cur)   },
    { label: DASHBOARD.stats.total,           accent: '#06b6d4',                value: formatMoney(total, cur)             },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, accent, value }) => (
        <div key={label} className="bg-black/30 border border-white/[0.08] p-4 shadow-hard relative overflow-hidden"
             style={{ borderTop: `2px solid ${accent}` }}>
          <div className="font-pixel text-[11px] tracking-widest2 mb-2 text-white/30 uppercase">
            {label.replace(/ /g, '_')}
          </div>
          <div className="font-pixel text-[28px] leading-none" style={{ color: accent, textShadow: `0 0 16px ${accent}55` }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Insights row ────────────────────────────────────────────── */
async function InsightsRow({ month }: { month: string }) {
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;
  const cur_r  = monthRange(month);
  const prev_r = monthRange(prevMonth(month));

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
  const debt = tasks.filter(t => t.type === 'on_demand' && (t.status === 'todo' || t.status === 'doing')).reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <CompletionWidget todo={todo} doing={doing} done={done} />
      <DeltaWidget current={curOnDemand + retainer} previous={prevOnDemand + retainer} currency={cur} />
      <DebtWidget amount={debt} currency={cur} />
    </div>
  );
}

/* ── Recent tasks ─────────────────────────────────────────────── */
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
    <div className="border border-px-purple/20 bg-black/25 shadow-hard h-full">
      <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-px-purple/20 bg-px-purple/5">
        <span className="font-pixel text-[13px] text-px-cyan tracking-[0.12em]">// {DASHBOARD.recentTasks.toUpperCase()}</span>
        <Link href="/tasks" className="font-pixel text-[13px] text-px-purple no-underline flex items-center gap-1 tracking-[0.06em]">
          {DASHBOARD.viewAll} <ArrowRight size={12} />
        </Link>
      </div>
      {/* Table header */}
      <div className="grid font-pixel text-[11px] tracking-[0.12em] text-px-cyan px-3.5 py-1.5 border-b border-white/5"
           style={{ gridTemplateColumns: '46px 1fr 80px 92px 80px' }}>
        <span>DATE</span><span>NHIỆM VỤ</span><span>KHÁCH</span>
        <span className="text-right">THƯỞNG</span><span className="text-right">STATUS</span>
      </div>
      {tasks.length === 0 ? (
        <div className="p-8 text-center font-pixel text-[15px] text-white/20 tracking-[0.08em]">// NO QUESTS LOGGED</div>
      ) : (
        tasks.map(t => {
          const badge = STATUS_BADGE[t.status] ?? { label: t.status, color: '#fff' };
          const clientName = (t.client as { name: string } | null)?.name ?? '—';
          return (
            <div key={t.id} className="grid items-center px-3.5 py-1.5 border-b border-white/[0.04]"
                 style={{ gridTemplateColumns: '46px 1fr 80px 92px 80px', borderLeft: `2px solid ${badge.color}44` }}>
              <span className="font-pixel text-[12px] text-white/30">{formatDate(t.task_date).slice(0, 5)}</span>
              <span className="font-pixel text-[14px] overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ color: t.status === 'done' ? 'rgba(255,255,255,0.5)' : '#E8E8F0' }}>{t.name}</span>
              <span className="font-pixel text-[12px] text-white/35 overflow-hidden text-ellipsis whitespace-nowrap">{clientName}</span>
              <span className="font-pixel text-[13px] text-px-green text-right">
                {t.type === 'on_demand' ? formatMoney(t.amount, cur) : '——'}
              </span>
              <div className="text-right">
                <span className="font-pixel text-[12px] tracking-[0.06em] px-1.5 border"
                      style={{ color: badge.color, borderColor: badge.color }}>{badge.label}</span>
              </div>
            </div>
          );
        })
      )}
      <div className="flex justify-between px-3.5 py-2 border-t border-white/5 font-pixel text-[12px] text-white/25 tracking-[0.06em]">
        <span>{DASHBOARD.taskCount(tasks.length)}</span>
        <span>{DASHBOARD.doneCount(doneCount)}</span>
      </div>
    </div>
  );
}

/* ── Client revenue ───────────────────────────────────────────── */
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
    const key = t.client_id ?? '__none__';
    const name = (t.client as { name: string } | null)?.name ?? '(unassigned)';
    const e = byClient.get(key) ?? { name, amount: 0 };
    e.amount += Number(t.amount);
    byClient.set(key, e);
  }
  const clientRevenue = [...byClient.values()].sort((a, b) => b.amount - a.amount);
  const retainerTotal = clients.filter(c => c.is_maintain_active).reduce((s, c) => s + Number(c.monthly_retainer), 0);

  return (
    <div className="border border-px-purple/20 bg-black/25 shadow-hard h-full p-4">
      <div className="font-pixel text-[13px] text-px-cyan tracking-[0.12em] mb-3.5 border-b border-white/5 pb-2">
        // {DASHBOARD.revenueByClient.toUpperCase()}
      </div>
      {clientRevenue.length === 0 ? (
        <div className="text-center font-pixel text-[14px] text-white/20 py-6 tracking-[0.08em]">{DASHBOARD.noRevenue}</div>
      ) : (
        <div className="space-y-2">
          {clientRevenue.map(c => (
            <div key={c.name} className="flex justify-between items-center">
              <span className="font-pixel text-[15px] text-white/70 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{c.name}</span>
              <span className="font-pixel text-[14px] text-px-green ml-2">{formatMoney(c.amount, cur)}</span>
            </div>
          ))}
        </div>
      )}
      {retainerTotal > 0 && (
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/[0.06]">
          <span className="font-pixel text-[13px] text-white/30">Retainer (maintain)</span>
          <span className="font-pixel text-[14px] text-px-purple">{formatMoney(retainerTotal, cur)}</span>
        </div>
      )}
    </div>
  );
}

/* ── Boss stage ───────────────────────────────────────────────── */
async function BossStage({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const supabase = await createClient();
  const { data } = await supabase.from('tasks').select('status').gte('task_date', start).lte('task_date', end);

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
    <div className="relative overflow-hidden border p-5"
         style={{ borderColor: cleared ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.2)', background: 'rgba(0,0,0,0.3)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: cleared
          ? 'radial-gradient(ellipse at center, rgba(74,222,128,0.04) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at center, rgba(248,113,113,0.04) 0%, transparent 70%)'
      }} />
      <div className="relative flex items-center gap-5">
        <div className="text-center flex-shrink-0">
          <div className="text-[52px] leading-none" style={{ filter: cleared ? 'grayscale(1) opacity(0.5)' : 'none' }}>{bossSprite}</div>
          <div className="font-pixel text-[10px] text-white/30 tracking-[0.08em] mt-1">{cleared ? '[ DEFEATED ]' : '[ ACTIVE ]'}</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1.5">
            <span className="font-pixel text-[11px] tracking-widest2 text-white/40">MONTHLY_BOSS</span>
            <span className="font-pixel text-[11px] tracking-[0.1em]" style={{ color: hpColor }}>HP: {total - done}/{total}</span>
          </div>
          <div className="mb-2">
            {cleared ? (
              <span className="font-pixel text-[22px] tracking-[0.06em]" style={{ color: '#4ADE80', textShadow: '0 0 16px rgba(74,222,128,0.6)' }}>★ STAGE CLEAR ★</span>
            ) : (
              <div>
                <span style={{ color: hpColor, letterSpacing: 1, fontSize: 16, fontFamily: 'var(--font-px)' }}>{'█'.repeat(hpFill)}</span>
                <span style={{ color: 'rgba(255,255,255,0.1)', letterSpacing: 1, fontSize: 16, fontFamily: 'var(--font-px)' }}>{'░'.repeat(hpEmpty)}</span>
                <span style={{ color: hpColor, marginLeft: 8, fontSize: 14, fontFamily: 'var(--font-px)' }}>{hpPct}%</span>
              </div>
            )}
          </div>
          <div className="flex gap-5 font-pixel text-[13px]">
            <span className="text-px-green">✓ SLAIN: {done}</span>
            <span className="text-px-yellow">⚔ IN_COMBAT: {doing}</span>
            <span className="text-white/35">○ REMAINING: {todo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

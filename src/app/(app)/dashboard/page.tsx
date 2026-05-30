import { Suspense } from "react";
import Link from "next/link";
import { Clock, Wallet, Repeat, Coins, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/dal";
import { Card, Badge, PageHeader, EmptyState, StatCardsSkeleton, TableSkeleton } from "@/components/ui";
import { CountUpMoney, CountUpHours } from "@/components/count-up";
import { TiltCard } from "@/components/motion-card";
import { FadeUp, FadeLeft, FadeRight } from "@/components/animate";
import { formatMoney, formatDate, currentMonth, monthRange, monthLabel } from "@/lib/format";
import { DASHBOARD } from "@/lib/strings";
import { staggerDelay } from "@/lib/motion";
import { type Client, type TaskWithClient, TASK_TYPE_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import { MonthSelect } from "./month-select";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp    = await searchParams;
  const month = one(sp.month) || currentMonth();

  return (
    <>
      <PageHeader title={DASHBOARD.title} subtitle={`Overview for ${monthLabel(month)}`}>
        <MonthSelect month={month} />
      </PageHeader>

      <Suspense fallback={<StatCardsSkeleton />}>
        <DashboardStats month={month} />
      </Suspense>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <Suspense fallback={<TableSkeleton rows={5} />}>
          <RecentTasks month={month} />
        </Suspense>
        <Suspense fallback={<Card className="lg:col-span-2"><TableSkeleton rows={4} /></Card>}>
          <ClientRevenue month={month} />
        </Suspense>
      </div>
    </>
  );
}

/* ── Stat cards ────────────────────────────────────────────────────────── */
async function DashboardStats({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const [{ data: clientRows }, { data: taskRows }] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("tasks").select("type, hours, amount, status").gte("task_date", start).lte("task_date", end),
  ]);

  const clients = (clientRows ?? []) as Client[];
  const tasks   = (taskRows   ?? []) as Pick<TaskWithClient, "type" | "hours" | "amount" | "status">[];

  const onDemandHours   = tasks.filter(t => t.type === "on_demand").reduce((s, t) => s + Number(t.hours  ?? 0), 0);
  const onDemandRevenue = tasks.filter(t => t.type === "on_demand").reduce((s, t) => s + Number(t.amount),    0);
  const retainerRevenue = clients.filter(c => c.is_maintain_active).reduce((s, c) => s + Number(c.monthly_retainer), 0);
  const total           = onDemandRevenue + retainerRevenue;

  const stats = [
    { icon: Clock,  label: DASHBOARD.stats.onDemandHours,   tone: "text-fg",       kind: "hours" as const, raw: onDemandHours   },
    { icon: Wallet, label: DASHBOARD.stats.onDemandRevenue, tone: "text-teal",      kind: "money" as const, raw: onDemandRevenue },
    { icon: Repeat, label: DASHBOARD.stats.retainer,        tone: "text-accent-fg", kind: "money" as const, raw: retainerRevenue },
    { icon: Coins,  label: DASHBOARD.stats.total,           tone: "text-fg",        kind: "money" as const, raw: total           },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, tone, kind, raw }, i) => (
        <FadeUp key={label} delay={i * 0.06}>
          <TiltCard className="group tf-scan-wrap h-full rounded-2xl border border-border bg-panel/80 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center gap-2 text-muted transition-colors group-hover:text-fg-2">
                <Icon size={16} />
                <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
              </div>
              <p className={`tf-pop mt-3 text-2xl font-semibold tracking-tight ${tone}`}
                style={{ animationDelay: `${i * 0.06 + 0.1}s` }}>
                {kind === "hours"
                  ? <CountUpHours hours={raw} />
                  : <CountUpMoney amount={raw} currency={cur} />}
              </p>
            </div>
          </TiltCard>
        </FadeUp>
      ))}
    </div>
  );
}

/* ── Recent tasks ──────────────────────────────────────────────────────── */
async function RecentTasks({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const { data } = await supabase
    .from("tasks").select("*, client:clients(name)")
    .gte("task_date", start).lte("task_date", end)
    .order("task_date", { ascending: false }).limit(8);

  const tasks     = (data ?? []) as TaskWithClient[];
  const doneCount = tasks.filter(t => t.status === "done").length;

  return (
    <FadeUp delay={0.28} className="lg:col-span-3">
      <Card>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{DASHBOARD.recentTasks}</h2>
          <Link href="/tasks" className="inline-flex items-center gap-1 text-xs text-accent-fg transition-colors hover:text-accent">
            {DASHBOARD.viewAll} <ArrowRight size={13} />
          </Link>
        </div>
        {tasks.length === 0 ? (
          <EmptyState title={DASHBOARD.noTasks} description={DASHBOARD.noTasksDetail} />
        ) : (
          <ul className="divide-y divide-border-soft">
            {tasks.map((t, i) => (
              <FadeLeft key={t.id} delay={0.32 + staggerDelay(i, 6)} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-panel-2/40">
                <span className="w-16 shrink-0 font-mono text-xs text-muted">{formatDate(t.task_date).slice(0,5)}</span>
                <span className="flex-1 truncate text-fg">{t.name}</span>
                <Badge tone={t.type === "maintain" ? "accent" : "teal"}>{TASK_TYPE_LABEL[t.type]}</Badge>
                <span className="w-28 shrink-0 text-right font-mono text-xs text-muted">
                  {t.type === "on_demand" ? formatMoney(t.amount, cur) : TASK_STATUS_LABEL[t.status]}
                </span>
              </FadeLeft>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
          <span>{DASHBOARD.taskCount(tasks.length)}</span>
          <span>{DASHBOARD.doneCount(doneCount)}</span>
        </div>
      </Card>
    </FadeUp>
  );
}

/* ── Per-client revenue ────────────────────────────────────────────────── */
async function ClientRevenue({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const [{ data: clientRows }, { data: taskRows }] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("tasks").select("client_id, amount, client:clients(name)").eq("type","on_demand").gte("task_date",start).lte("task_date",end),
  ]);

  const clients = (clientRows ?? []) as Client[];
  const tasks   = (taskRows   ?? []) as unknown as Pick<TaskWithClient,"client_id"|"amount"|"client">[];

  const byClient = new Map<string, { name:string; amount:number }>();
  for (const t of tasks) {
    const key  = t.client_id ?? "__none__";
    const name = (t.client as {name:string}|null)?.name ?? "(unassigned)";
    const e    = byClient.get(key) ?? { name, amount: 0 };
    e.amount  += Number(t.amount);
    byClient.set(key, e);
  }
  const clientRevenue  = [...byClient.values()].sort((a,b) => b.amount - a.amount);
  const retainerTotal  = clients.filter(c => c.is_maintain_active).reduce((s,c) => s + Number(c.monthly_retainer), 0);

  return (
    <FadeUp delay={0.35} className="lg:col-span-2">
      <Card>
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{DASHBOARD.revenueByClient}</h2>
        </div>
        {clientRevenue.length === 0 ? (
          <EmptyState title={DASHBOARD.noRevenue} />
        ) : (
          <ul className="divide-y divide-border-soft">
            {clientRevenue.map((c, i) => (
              <FadeRight key={c.name} delay={0.38 + staggerDelay(i, 5)} className="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-panel-2/40">
                <span className="truncate text-fg">{c.name}</span>
                <span className="font-mono text-xs text-teal">{formatMoney(c.amount, cur)}</span>
              </FadeRight>
            ))}
          </ul>
        )}
        {retainerTotal > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs">
            <span className="text-muted">Retainer (maintain)</span>
            <span className="font-mono text-accent-fg">{formatMoney(retainerTotal, cur)}</span>
          </div>
        )}
      </Card>
    </FadeUp>
  );
}

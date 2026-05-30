import { Suspense } from "react";
import Link from "next/link";
import { Clock, Wallet, Repeat, Coins, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/dal";
import {
  Card,
  Badge,
  PageHeader,
  EmptyState,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/ui";
import {
  formatMoney,
  formatHours,
  formatDate,
  currentMonth,
  monthRange,
  monthLabel,
} from "@/lib/format";
import {
  type Client,
  type TaskWithClient,
  TASK_TYPE_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/types";
import { MonthSelect } from "./month-select";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Shell + month picker render instantly; stats + tables stream in.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const month = one(sp.month) || currentMonth();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Tổng quan ${monthLabel(month)}`}
      >
        <MonthSelect month={month} />
      </PageHeader>

      <Suspense fallback={<StatCardsSkeleton />}>
        <DashboardStats month={month} />
      </Suspense>

      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <Suspense
          fallback={<TableSkeleton rows={5} />}
        >
          <RecentTasks month={month} />
        </Suspense>
        <Suspense
          fallback={
            <Card className="lg:col-span-2">
              <TableSkeleton rows={4} />
            </Card>
          }
        >
          <ClientRevenue month={month} />
        </Suspense>
      </div>
    </>
  );
}

/* ── Stats row ─────────────────────────────────────────────────────────── */
async function DashboardStats({ month }: { month: string }) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();
  const supabase = await createClient();
  const cur = settings.currency;

  const [{ data: clientRows }, { data: taskRows }] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase
      .from("tasks")
      .select("type, hours, amount, status")
      .gte("task_date", start)
      .lte("task_date", end),
  ]);

  const clients = (clientRows ?? []) as Client[];
  const tasks = (taskRows ?? []) as Pick<
    TaskWithClient,
    "type" | "hours" | "amount" | "status"
  >[];

  const onDemandHours = tasks
    .filter((t) => t.type === "on_demand")
    .reduce((s, t) => s + Number(t.hours ?? 0), 0);
  const onDemandRevenue = tasks
    .filter((t) => t.type === "on_demand")
    .reduce((s, t) => s + Number(t.amount), 0);
  const retainerRevenue = clients
    .filter((c) => c.is_maintain_active)
    .reduce((s, c) => s + Number(c.monthly_retainer), 0);
  const total = onDemandRevenue + retainerRevenue;

  const stats = [
    {
      icon: Clock,
      label: "Giờ on-demand",
      value: formatHours(onDemandHours),
      tone: "text-fg",
    },
    {
      icon: Wallet,
      label: "Doanh thu on-demand",
      value: formatMoney(onDemandRevenue, cur),
      tone: "text-teal",
    },
    {
      icon: Repeat,
      label: "Retainer (maintain)",
      value: formatMoney(retainerRevenue, cur),
      tone: "text-accent-fg",
    },
    {
      icon: Coins,
      label: "Tổng doanh thu",
      value: formatMoney(total, cur),
      tone: "text-fg",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, tone }) => (
        <Card key={label} className="tf-rise p-4">
          <div className="flex items-center gap-2 text-muted">
            <Icon size={16} />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {label}
            </span>
          </div>
          <p className={`mt-3 text-2xl font-semibold tracking-tight ${tone}`}>
            {value}
          </p>
        </Card>
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
    .from("tasks")
    .select("*, client:clients(name)")
    .gte("task_date", start)
    .lte("task_date", end)
    .order("task_date", { ascending: false })
    .limit(8);

  const tasks = (data ?? []) as TaskWithClient[];
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <Card className="lg:col-span-3">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Task gần đây</h2>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-xs text-accent-fg hover:underline"
        >
          Xem tất cả <ArrowRight size={13} />
        </Link>
      </div>
      {tasks.length === 0 ? (
        <EmptyState
          title="Chưa có task trong tháng này"
          description="Thêm task ở trang Tasks để bắt đầu ghi nhận."
        />
      ) : (
        <ul className="divide-y divide-border-soft">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <span className="w-16 shrink-0 font-mono text-xs text-muted">
                {formatDate(t.task_date).slice(0, 5)}
              </span>
              <span className="flex-1 truncate text-fg">{t.name}</span>
              <Badge tone={t.type === "maintain" ? "accent" : "teal"}>
                {TASK_TYPE_LABEL[t.type]}
              </Badge>
              <span className="w-28 shrink-0 text-right font-mono text-xs text-muted">
                {t.type === "on_demand"
                  ? formatMoney(t.amount, cur)
                  : TASK_STATUS_LABEL[t.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
        <span>{tasks.length} task</span>
        <span>{doneCount} xong</span>
      </div>
    </Card>
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
    supabase
      .from("tasks")
      .select("client_id, amount, client:clients(name)")
      .eq("type", "on_demand")
      .gte("task_date", start)
      .lte("task_date", end),
  ]);

  const clients = (clientRows ?? []) as Client[];
  const tasks = (taskRows ?? []) as unknown as Pick<
    TaskWithClient,
    "client_id" | "amount" | "client"
  >[];

  const byClient = new Map<string, { name: string; amount: number }>();
  for (const t of tasks) {
    const key = t.client_id ?? "__none__";
    const name = (t.client as { name: string } | null)?.name ?? "(không gán)";
    const e = byClient.get(key) ?? { name, amount: 0 };
    e.amount += Number(t.amount);
    byClient.set(key, e);
  }
  const clientRevenue = [...byClient.values()].sort(
    (a, b) => b.amount - a.amount,
  );

  const retainerTotal = clients
    .filter((c) => c.is_maintain_active)
    .reduce((s, c) => s + Number(c.monthly_retainer), 0);

  return (
    <Card className="lg:col-span-2">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">
          Doanh thu on-demand / khách
        </h2>
      </div>
      {clientRevenue.length === 0 ? (
        <EmptyState title="Chưa có doanh thu on-demand" />
      ) : (
        <ul className="divide-y divide-border-soft">
          {clientRevenue.map((c) => (
            <li
              key={c.name}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <span className="truncate text-fg">{c.name}</span>
              <span className="font-mono text-xs text-teal">
                {formatMoney(c.amount, cur)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {retainerTotal > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs">
          <span className="text-muted">Retainer maintain</span>
          <span className="font-mono text-accent-fg">
            {formatMoney(retainerTotal, cur)}
          </span>
        </div>
      )}
    </Card>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/dal";
import { PageHeader } from "@/components/ui";
import { currentMonth, monthRange } from "@/lib/format";
import type { Client, TaskWithClient } from "@/lib/types";
import { TasksView } from "./tasks-view";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const month = one(sp.month) || currentMonth();
  const type = one(sp.type) || "all";
  const client = one(sp.client) || "all";
  const status = one(sp.status) || "all";
  const q = one(sp.q) || "";

  const settings = await getSettings();
  const supabase = await createClient();

  const [{ data: clientRows }, taskRes] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    (async () => {
      let query = supabase
        .from("tasks")
        .select("*, client:clients(name)")
        .order("task_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (month) {
        const { start, end } = monthRange(month);
        query = query.gte("task_date", start).lte("task_date", end);
      }
      if (type !== "all") query = query.eq("type", type);
      if (status !== "all") query = query.eq("status", status);
      if (client === "none") query = query.is("client_id", null);
      else if (client !== "all") query = query.eq("client_id", client);
      if (q) query = query.ilike("name", `%${q}%`);

      return query;
    })(),
  ]);

  const tasks = (taskRes.data ?? []) as TaskWithClient[];
  const clients = (clientRows ?? []) as Client[];

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Ghi nhận công việc, tính tiền on-demand và export báo cáo."
      />
      <TasksView
        tasks={tasks}
        clients={clients}
        currency={settings.currency}
        filters={{ month, type, client, status, q }}
      />
    </>
  );
}

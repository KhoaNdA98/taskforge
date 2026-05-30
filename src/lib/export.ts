import * as XLSX from "xlsx";
import {
  type TaskWithClient,
  type Client,
  TASK_TYPE_LABEL,
  TASK_STATUS_LABEL,
} from "./types";
import { formatDate } from "./format";

/**
 * Builds and downloads an .xlsx report from the (already filtered) task list.
 * Sheet 1: chi tiết task. Sheet 2: tổng hợp theo khách (on-demand + retainer).
 */
export function exportTasksToExcel(
  tasks: TaskWithClient[],
  clients: Client[],
  currency: string,
  periodLabel: string,
) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: detail ──────────────────────────────────────────────────
  const detail = tasks.map((t) => ({
    Ngày: formatDate(t.task_date),
    Task: t.name,
    Loại: TASK_TYPE_LABEL[t.type],
    Khách: t.client?.name ?? "—",
    "Trạng thái": TASK_STATUS_LABEL[t.status],
    "Giờ": t.type === "on_demand" ? Number(t.hours ?? 0) : "",
    [`Rate (${currency})`]:
      t.type === "on_demand" ? Number(t.rate_snapshot) : "",
    [`Thành tiền (${currency})`]:
      t.type === "on_demand" ? Number(t.amount) : 0,
    "Ghi chú": t.note ?? "",
  }));

  const onDemandTotal = tasks
    .filter((t) => t.type === "on_demand")
    .reduce((s, t) => s + Number(t.amount), 0);
  const hoursTotal = tasks
    .filter((t) => t.type === "on_demand")
    .reduce((s, t) => s + Number(t.hours ?? 0), 0);

  detail.push({
    Ngày: "",
    Task: "TỔNG (on-demand)",
    Loại: "",
    Khách: "",
    "Trạng thái": "",
    "Giờ": hoursTotal,
    [`Rate (${currency})`]: "",
    [`Thành tiền (${currency})`]: onDemandTotal,
    "Ghi chú": "",
  });

  const ws1 = XLSX.utils.json_to_sheet(detail);
  ws1["!cols"] = [
    { wch: 12 },
    { wch: 34 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    { wch: 18 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Chi tiết");

  // ── Sheet 2: per-client summary ──────────────────────────────────────
  const byClient = new Map<string, { name: string; onDemand: number }>();
  for (const t of tasks) {
    if (t.type !== "on_demand") continue;
    const key = t.client_id ?? "__none__";
    const name = t.client?.name ?? "(không gán khách)";
    const cur = byClient.get(key) ?? { name, onDemand: 0 };
    cur.onDemand += Number(t.amount);
    byClient.set(key, cur);
  }

  const retainerOf = (id: string) =>
    clients.find((c) => c.id === id && c.is_maintain_active)?.monthly_retainer ??
    0;

  const summaryKeys = new Set<string>([
    ...byClient.keys(),
    ...clients.filter((c) => c.is_maintain_active).map((c) => c.id),
  ]);

  const summary = [...summaryKeys].map((key) => {
    const name =
      byClient.get(key)?.name ??
      clients.find((c) => c.id === key)?.name ??
      "(không gán khách)";
    const onDemand = byClient.get(key)?.onDemand ?? 0;
    const retainer = key === "__none__" ? 0 : retainerOf(key);
    return {
      Khách: name,
      [`On-demand (${currency})`]: onDemand,
      [`Retainer (${currency})`]: retainer,
      [`Tổng (${currency})`]: onDemand + retainer,
    };
  });

  const retainerTotal = clients
    .filter((c) => c.is_maintain_active)
    .reduce((s, c) => s + Number(c.monthly_retainer), 0);

  summary.push({
    Khách: "TỔNG CỘNG",
    [`On-demand (${currency})`]: onDemandTotal,
    [`Retainer (${currency})`]: retainerTotal,
    [`Tổng (${currency})`]: onDemandTotal + retainerTotal,
  });

  const ws2 = XLSX.utils.json_to_sheet(summary);
  ws2["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Tổng hợp");

  const safe = periodLabel.replace(/[^\w-]+/g, "_");
  XLSX.writeFile(wb, `TaskForge_${safe}.xlsx`);
}

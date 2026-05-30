"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Search,
  ListTodo,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Field,
  Card,
  Badge,
  EmptyState,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import {
  formatMoney,
  formatHours,
  formatDate,
  toDateInput,
  monthLabel,
} from "@/lib/format";
import { exportTasksToExcel } from "@/lib/export";
import {
  type Client,
  type TaskWithClient,
  type TaskType,
  TASK_TYPE_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/types";
import { saveTask, deleteTask, type TaskActionState } from "./actions";

type Filters = {
  month: string;
  type: string;
  client: string;
  status: string;
  q: string;
};

export function TasksView({
  tasks,
  clients,
  currency,
  filters,
}: {
  tasks: TaskWithClient[];
  clients: Client[];
  currency: string;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithClient | null>(null);
  const [nonce, setNonce] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q);

  // Push a single filter change into the URL (server re-queries).
  function setParam(key: string, value: string) {
    const params = new URLSearchParams({
      month: filters.month,
      type: filters.type,
      client: filters.client,
      status: filters.status,
      q: filters.q,
    });
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Debounced search → URL
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setParam("q", search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totals = useMemo(() => {
    const onDemand = tasks.filter((t) => t.type === "on_demand");
    return {
      count: tasks.length,
      hours: onDemand.reduce((s, t) => s + Number(t.hours ?? 0), 0),
      amount: onDemand.reduce((s, t) => s + Number(t.amount), 0),
    };
  }, [tasks]);

  function openAdd() {
    setEditing(null);
    setNonce((n) => n + 1);
    setOpen(true);
  }
  function openEdit(t: TaskWithClient) {
    setEditing(t);
    setNonce((n) => n + 1);
    setOpen(true);
  }
  function onDone() {
    setOpen(false);
    router.refresh();
  }
  function onDelete(t: TaskWithClient) {
    if (!confirm(`Xoá task "${t.name}"?`)) return;
    startTransition(async () => {
      await deleteTask(t.id);
      router.refresh();
    });
  }

  return (
    <>
      {/* Filter bar */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-[140px]">
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Tháng
            </label>
            <Input
              type="month"
              value={filters.month}
              onChange={(e) => setParam("month", e.target.value)}
              className="h-9"
            />
          </div>
          <div className="min-w-[130px]">
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Loại
            </label>
            <Select
              value={filters.type}
              onChange={(e) => setParam("type", e.target.value)}
              className="h-9"
            >
              <option value="all">Tất cả</option>
              <option value="maintain">Maintain</option>
              <option value="on_demand">On-demand</option>
            </Select>
          </div>
          <div className="min-w-[150px]">
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Khách
            </label>
            <Select
              value={filters.client}
              onChange={(e) => setParam("client", e.target.value)}
              className="h-9"
            >
              <option value="all">Tất cả</option>
              <option value="none">(không gán)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[130px]">
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Trạng thái
            </label>
            <Select
              value={filters.status}
              onChange={(e) => setParam("status", e.target.value)}
              className="h-9"
            >
              <option value="all">Tất cả</option>
              <option value="todo">Cần làm</option>
              <option value="doing">Đang làm</option>
              <option value="done">Xong</option>
            </Select>
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Tìm task
            </label>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên task…"
                className="h-9 pl-8"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary + actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-mono text-fg">{totals.count}</span> task ·{" "}
          <span className="font-mono text-fg">{formatHours(totals.hours)}</span>{" "}
          on-demand ·{" "}
          <span className="font-mono text-teal">
            {formatMoney(totals.amount, currency)}
          </span>
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              exportTasksToExcel(tasks, clients, currency, filters.month)
            }
            disabled={tasks.length === 0}
          >
            <Download size={16} /> Excel
          </Button>
          <Button variant="primary" onClick={openAdd}>
            <Plus size={16} /> Thêm task
          </Button>
        </div>
      </div>

      {/* Table */}
      {tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListTodo size={28} />}
            title="Không có task nào"
            description={`Chưa có task khớp bộ lọc ${monthLabel(filters.month)}. Thêm task mới hoặc đổi bộ lọc.`}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Ngày</th>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 font-medium">Khách</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Giờ</th>
                  <th className="px-4 py-3 text-right font-medium">Thành tiền</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    className="group border-b border-border-soft last:border-0 hover:bg-panel-2/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                      {formatDate(t.task_date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{t.name}</p>
                      {t.note && (
                        <p className="line-clamp-1 text-xs text-muted">
                          {t.note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={t.type === "maintain" ? "accent" : "teal"}>
                        {TASK_TYPE_LABEL[t.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {t.client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          t.status === "done"
                            ? "teal"
                            : t.status === "doing"
                              ? "amber"
                              : "muted"
                        }
                      >
                        {TASK_STATUS_LABEL[t.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted">
                      {t.type === "on_demand" ? formatHours(t.hours) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-fg">
                      {t.type === "on_demand"
                        ? formatMoney(t.amount, currency)
                        : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(t)}
                          className="tf-ring rounded-md p-1.5 text-muted hover:bg-panel-2 hover:text-fg"
                          aria-label="Sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(t)}
                          disabled={isPending}
                          className="tf-ring rounded-md p-1.5 text-muted hover:bg-rose/10 hover:text-rose"
                          aria-label="Xoá"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa task" : "Thêm task"}
      >
        <TaskForm
          key={`${editing?.id ?? "new"}-${nonce}`}
          task={editing}
          clients={clients}
          onDone={onDone}
        />
      </Modal>
    </>
  );
}

function TaskForm({
  task,
  clients,
  onDone,
}: {
  task: TaskWithClient | null;
  clients: Client[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<TaskActionState, FormData>(
    saveTask,
    {},
  );
  const [type, setType] = useState<TaskType>(task?.type ?? "on_demand");

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="space-y-4">
      {task && <input type="hidden" name="id" value={task.id} />}

      <Field label="Tên task">
        <Input name="name" defaultValue={task?.name ?? ""} required autoFocus />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Loại">
          <Select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
          >
            <option value="on_demand">On-demand (tính giờ)</option>
            <option value="maintain">Maintain (retainer)</option>
          </Select>
        </Field>
        <Field label="Ngày">
          <Input
            name="task_date"
            type="date"
            defaultValue={task ? toDateInput(task.task_date) : toDateInput()}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Khách hàng">
          <Select name="client_id" defaultValue={task?.client_id ?? ""}>
            <option value="">(không gán)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Trạng thái">
          <Select name="status" defaultValue={task?.status ?? "todo"}>
            <option value="todo">Cần làm</option>
            <option value="doing">Đang làm</option>
            <option value="done">Xong</option>
          </Select>
        </Field>
      </div>

      {type === "on_demand" && (
        <Field
          label="Số giờ"
          hint="Tiền = số giờ × rate (lấy từ Cài đặt khi tạo task)."
        >
          <Input
            name="hours"
            type="number"
            min={0}
            step={0.25}
            defaultValue={task?.hours ?? ""}
            placeholder="vd 2.5"
            className="font-mono"
          />
        </Field>
      )}

      <Field label="Ghi chú">
        <Textarea name="note" defaultValue={task?.note ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-rose">{state.error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu task"}
        </Button>
      </div>
    </form>
  );
}

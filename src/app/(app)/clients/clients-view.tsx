"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Field,
  Card,
  Badge,
  EmptyState,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { formatMoney } from "@/lib/format";
import type { Client } from "@/lib/types";
import { saveClient, deleteClient, type ClientActionState } from "./actions";

export function ClientsView({
  clients,
  currency,
}: {
  clients: Client[];
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [nonce, setNonce] = useState(0);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setEditing(null);
    setNonce((n) => n + 1);
    setOpen(true);
  }
  function openEdit(c: Client) {
    setEditing(c);
    setNonce((n) => n + 1);
    setOpen(true);
  }
  function onDone() {
    setOpen(false);
    router.refresh();
  }
  function onDelete(c: Client) {
    if (!confirm(`Xoá khách "${c.name}"? Task của khách sẽ được gỡ liên kết.`))
      return;
    startTransition(async () => {
      await deleteClient(c.id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" onClick={openAdd}>
          <Plus size={16} /> Thêm khách hàng
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={<Users size={28} />}
            title="Chưa có khách hàng nào"
            description="Thêm khách để gán task và thiết lập phí maintain hàng tháng."
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c, i) => (
            <Card key={c.id} className="tf-rise tf-scan-wrap flex flex-col p-4"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-fg">{c.name}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="tf-ring rounded-md p-1.5 text-muted hover:bg-panel-2 hover:text-fg"
                    aria-label="Sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    disabled={isPending}
                    className="tf-ring rounded-md p-1.5 text-muted hover:bg-rose/10 hover:text-rose"
                    aria-label="Xoá"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {c.is_maintain_active ? (
                  <Badge tone="accent">maintain active</Badge>
                ) : (
                  <Badge tone="muted">no maintain</Badge>
                )}
              </div>

              <div className="mt-3 font-mono text-sm">
                <span className="text-muted">retainer </span>
                <span className="text-fg">
                  {formatMoney(c.monthly_retainer, currency)}
                </span>
                <span className="text-muted">/tháng</span>
              </div>

              {c.note && (
                <p className="mt-2 line-clamp-2 text-xs text-muted">{c.note}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa khách hàng" : "Thêm khách hàng"}
      >
        <ClientForm
          key={`${editing?.id ?? "new"}-${nonce}`}
          client={editing}
          onDone={onDone}
        />
      </Modal>
    </>
  );
}

function ClientForm({
  client,
  onDone,
}: {
  client: Client | null;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ClientActionState, FormData>(
    saveClient,
    {},
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="space-y-4">
      {client && <input type="hidden" name="id" value={client.id} />}

      <Field label="Tên khách hàng">
        <Input name="name" defaultValue={client?.name ?? ""} required autoFocus />
      </Field>

      <Field
        label="Phí maintain / tháng"
        hint="Retainer cố định nếu bạn maintain cho khách này. Để 0 nếu không có."
      >
        <Input
          name="monthly_retainer"
          type="number"
          min={0}
          step={1000}
          defaultValue={client?.monthly_retainer ?? 0}
          className="font-mono"
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-base/40 px-3 py-2.5">
        <input
          type="checkbox"
          name="is_maintain_active"
          defaultChecked={client?.is_maintain_active ?? false}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        <span className="text-sm text-fg">
          Đang maintain khách này
          <span className="block text-xs text-muted">
            Khi bật, retainer sẽ được tính vào doanh thu hàng tháng.
          </span>
        </span>
      </label>

      <Field label="Ghi chú">
        <Textarea name="note" defaultValue={client?.note ?? ""} />
      </Field>

      {state.error && <p className="text-sm text-rose">{state.error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu"}
        </Button>
      </div>
    </form>
  );
}

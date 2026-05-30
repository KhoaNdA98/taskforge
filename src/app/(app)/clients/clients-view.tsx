"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button, Input, Textarea, Field, Card, Badge, EmptyState } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm-dialog";
import { formatMoney } from "@/lib/format";
import { CLIENT } from "@/lib/strings";
import { fadeUp, staggerContainer, gentle } from "@/lib/motion";
import type { Client } from "@/lib/types";
import { saveClient, deleteClient, type ClientActionState } from "./actions";

export function ClientsView({ clients, currency }: { clients: Client[]; currency: string }) {
  const router  = useRouter();
  const toast   = useToast();
  const { confirm } = useConfirm();
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [nonce, setNonce]     = useState(0);
  const [, startTransition]   = useTransition();

  function openAdd()      { setEditing(null); setNonce(n => n + 1); setOpen(true); }
  function openEdit(c: Client) { setEditing(c); setNonce(n => n + 1); setOpen(true); }
  function onDone()       { setOpen(false); router.refresh(); }

  async function onDelete(c: Client) {
    const ok = await confirm({
      title: CLIENT.deleteConfirm(c.name),
      detail: "Tasks assigned to this client will be unlinked.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteClient(c.id);
      toast.success(`Client "${c.name}" deleted.`);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button variant="primary" onClick={openAdd}>
          <Plus size={16} /> {CLIENT.addClient}
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card className="mt-4">
          <EmptyState icon={<Users size={28} />} title={CLIENT.empty.title} description={CLIENT.empty.description} />
        </Card>
      ) : (
        <motion.div
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer(0.055)}
          initial="initial"
          animate="animate"
        >
          {clients.map((c) => (
            <motion.div key={c.id} variants={fadeUp}>
              <Card className="tf-scan-wrap flex flex-col p-4 transition-shadow hover:shadow-lg hover:shadow-black/20">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-fg">{c.name}</p>
                  <div className="flex gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(c)}
                      className="tf-ring rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-fg"
                      aria-label="Edit"
                    >
                      <Pencil size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(c)}
                      className="tf-ring rounded-lg p-1.5 text-muted hover:bg-rose-soft hover:text-rose"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {c.is_maintain_active ? (
                    <Badge tone="accent">{CLIENT.maintainActive}</Badge>
                  ) : (
                    <Badge tone="muted">{CLIENT.noRetainer}</Badge>
                  )}
                </div>

                <div className="mt-3 font-mono text-sm">
                  <span className="text-muted">{CLIENT.retainerLabel} </span>
                  <span className="text-fg">{formatMoney(c.monthly_retainer, currency)}</span>
                  <span className="text-muted">{CLIENT.perMonth}</span>
                </div>

                {c.note && <p className="mt-2 line-clamp-2 text-xs text-muted">{c.note}</p>}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? CLIENT.editClient : CLIENT.addClient}>
        <ClientForm key={`${editing?.id ?? "new"}-${nonce}`} client={editing} onDone={onDone} />
      </Modal>
    </>
  );
}

function ClientForm({ client, onDone }: { client: Client | null; onDone: () => void }) {
  const toast = useToast();
  const [state, action, pending] = useActionState<ClientActionState, FormData>(saveClient, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(client ? `Client updated.` : `Client added.`);
      onDone();
    }
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="space-y-4">
      {client && <input type="hidden" name="id" value={client.id} />}

      <Field label={CLIENT.fields.name}>
        <Input name="name" defaultValue={client?.name ?? ""} required autoFocus />
      </Field>

      <Field label={CLIENT.fields.retainer} hint={CLIENT.fields.retainerHint}>
        <Input name="monthly_retainer" type="number" min={0} step={1000}
          defaultValue={client?.monthly_retainer ?? 0} className="font-mono" />
      </Field>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-base/40 px-3 py-2.5 transition-colors hover:bg-panel-2">
        <input type="checkbox" name="is_maintain_active"
          defaultChecked={client?.is_maintain_active ?? false}
          className="h-4 w-4 accent-[var(--color-accent)]" />
        <span className="text-sm text-fg">
          {CLIENT.fields.maintainActive}
          <span className="block text-xs text-muted">{CLIENT.fields.maintainActiveHint}</span>
        </span>
      </label>

      <Field label={CLIENT.fields.note}>
        <Textarea name="note" defaultValue={client?.note ?? ""} />
      </Field>

      <AnimatePresence>
        {state.error && (
          <motion.p {...fadeUp} className="text-sm text-rose">{state.error}</motion.p>
        )}
      </AnimatePresence>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? CLIENT.saving : CLIENT.save}
        </Button>
      </div>
    </form>
  );
}

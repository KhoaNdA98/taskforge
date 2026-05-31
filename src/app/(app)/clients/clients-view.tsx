'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/format';
import { CLIENT } from '@/lib/strings';
import type { Client } from '@/lib/types';
import { saveClient, deleteClient } from './actions';

function ClientCard({ client, currency, onEdit, onDelete }: {
  client: Client; currency: string; onEdit: () => void; onDelete: () => void;
}) {
  const sc = client.is_maintain_active ? '#ff914d' : '#2d2d3d';
  return (
    <div
      className="relative flex flex-col gap-3 p-4 bg-px-card border-2 cursor-pointer
                 shadow-hard transition-all duration-150 group"
      style={{ borderColor: sc }}
      onClick={onEdit}
    >
      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={e => { e.stopPropagation(); onEdit(); }}
          className="font-pixel text-[13px] px-2 py-0.5 border border-arcade-orange/40 text-arcade-orange bg-arcade-orange/10"
        >EDIT</button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="font-pixel text-[13px] px-2 py-0.5 border border-px-red/40 text-px-red bg-px-red/10"
        >DEL</button>
      </div>

      {/* Name */}
      <div className="font-pixel text-[20px] tracking-[0.06em] text-[#e8e8f0] pr-20">
        🛡️ {client.name.toUpperCase()}
      </div>

      {/* Status */}
      <span className="font-pixel text-[13px] tracking-[0.08em] px-2 py-0.5 border self-start"
            style={{ color: sc, borderColor: sc + '80', background: client.is_maintain_active ? 'rgba(255,145,77,0.1)' : 'transparent' }}>
        {client.is_maintain_active ? '●MAINTAIN ACTIVE' : '○NO MAINTAIN'}
      </span>

      {/* Retainer */}
      <div className="flex justify-between items-baseline mt-auto">
        <span className="font-pixel text-[13px] text-white/30 tracking-[0.08em]">RETAINER/MO</span>
        <span className="font-pixel text-[22px]" style={{ color: sc, textShadow: client.is_maintain_active ? '0 0 10px rgba(255,145,77,0.4)' : 'none' }}>
          {formatMoney(client.monthly_retainer, currency)}
        </span>
      </div>

      {client.note && (
        <p className="font-pixel text-[14px] text-white/30 border-t border-px-border pt-2 line-clamp-2">{client.note}</p>
      )}
    </div>
  );
}

function ClientForm({ client, onDone }: { client: Client | null; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    if (client) fd.set('id', client.id);
    const res = await saveClient({}, fd);
    setPending(false);
    if (res?.error) { toast.error(res.error); }
    else { toast.success(client ? '// Client updated.' : '// Client added.'); onDone(); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="px-field">
        <label className="px-label">CLIENT_NAME</label>
        <input name="name" required autoFocus defaultValue={client?.name ?? ''} className="px-input" />
      </div>
      <div className="px-field">
        <label className="px-label">RETAINER / MONTH</label>
        <input name="monthly_retainer" type="number" min={0} step={1000}
               defaultValue={client?.monthly_retainer ?? 0} className="px-input" />
      </div>
      <label className="flex items-center gap-3 mb-3 cursor-pointer">
        <input name="is_maintain_active" type="checkbox" defaultChecked={client?.is_maintain_active ?? false}
               className="w-4 h-4 accent-arcade-orange" />
        <span className="font-pixel text-[16px] text-white/60">Maintain active</span>
      </label>
      <div className="px-field">
        <label className="px-label">NOTE</label>
        <textarea name="note" rows={2} defaultValue={client?.note ?? ''} className="px-input resize-none" />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button type="button" className="px-btn px-btn-ghost" onClick={onDone}>CANCEL</button>
        <button type="submit" disabled={pending} className="px-btn px-btn-primary">
          {pending ? 'SAVING...' : 'SAVE'}
        </button>
      </div>
    </form>
  );
}

export function ClientsView({ clients, currency }: { clients: Client[]; currency: string }) {
  const router = useRouter();
  const { open } = useModal();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const openAdd = () => open({ title: CLIENT.addClient,
    content: <ClientForm client={null} onDone={() => { open({ title:'',content:null }); router.refresh(); }} /> });

  const openEdit = (c: Client) => open({ title: CLIENT.editClient,
    content: <ClientForm client={c} onDone={() => { open({ title:'',content:null }); router.refresh(); }} /> });

  const onDelete = (c: Client) => open({
    title: CLIENT.deleteConfirm(c.name),
    content: <p className="font-pixel text-[16px] text-white/50">Tasks will be unlinked.</p>,
    onConfirm: () => startTransition(async () => {
      await deleteClient(c.id);
      toast.success(`// ${c.name} removed.`);
      router.refresh();
    }),
    confirmLabel: '[ DELETE ]', cancelLabel: '[ CANCEL ]', danger: true,
  });

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div className="px-section-title">🛡️ GUILD_MEMBERS</div>
        <button id="add-client-btn" onClick={openAdd} className="px-btn px-btn-primary">+ ADD MEMBER</button>
      </div>
      {clients.length === 0 ? (
        <div className="border-2 border-dashed border-arcade-orange/20 p-16 text-center
                        font-pixel text-[18px] text-white/20 tracking-[0.08em]">
          {'// NO GUILD MEMBERS YET'}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {clients.map(c => (
            <ClientCard key={c.id} client={c} currency={currency}
              onEdit={() => openEdit(c)} onDelete={() => onDelete(c)} />
          ))}
        </div>
      )}
    </>
  );
}

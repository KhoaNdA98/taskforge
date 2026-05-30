'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { NumberInput, Checkbox, Stack } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { formatMoney } from '@/lib/format';
import { CLIENT } from '@/lib/strings';
import type { Client } from '@/lib/types';
import { saveClient, deleteClient } from './actions';

/* ── Client card ─────────────────────────────────────────────── */
function ClientCard({
  client, currency, onEdit, onDelete,
}: {
  client: Client;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = client.is_maintain_active ? '#a855f7' : 'rgba(255,255,255,0.2)';

  return (
    <div
      className="tf-quest-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0e0e18',
        border: `2px solid ${hovered ? accent : '#2d2d3d'}`,
        padding: '16px 18px',
        position: 'relative',
        boxShadow: hovered
          ? `8px 8px 0 rgba(0,0,0,0.7), 0 0 16px rgba(168,85,247,0.1) inset`
          : '6px 6px 0 rgba(0,0,0,0.6)',
        transition: 'all 0.12s ease',
      }}
    >
      {/* Action buttons top-right */}
      <div style={{
        position: 'absolute', top: 8, right: 10,
        display: 'flex', gap: 6,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.1s',
      }}>
        <button
          onClick={onEdit}
          aria-label="Edit"
          style={{
            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
            color: '#a855f7', cursor: 'pointer', padding: '2px 8px',
            fontFamily: 'var(--font-pixel), VT323, monospace', fontSize: 13,
          }}
        >
          EDIT
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete"
          style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', cursor: 'pointer', padding: '2px 8px',
            fontFamily: 'var(--font-pixel), VT323, monospace', fontSize: 13,
          }}
        >
          DEL
        </button>
      </div>

      {/* Client name */}
      <div style={{
        fontFamily: 'var(--font-pixel), VT323, monospace',
        fontSize: 20, color: '#e8e8f0',
        letterSpacing: '0.06em', marginBottom: 10,
        paddingRight: 90,
      }}>
        🛡️ {client.name.toUpperCase()}
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <span style={{
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 13, letterSpacing: '0.08em',
          padding: '1px 8px',
          border: `1px solid ${client.is_maintain_active ? 'rgba(168,85,247,0.5)' : '#2d2d3d'}`,
          background: client.is_maintain_active ? 'rgba(168,85,247,0.1)' : 'transparent',
          color: client.is_maintain_active ? '#a855f7' : 'rgba(255,255,255,0.3)',
        }}>
          {client.is_maintain_active ? '●MAINTAIN ACTIVE' : '○NO MAINTAIN'}
        </span>
      </div>

      {/* Retainer amount */}
      <div style={{
        fontFamily: 'var(--font-pixel), VT323, monospace',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: client.note ? 10 : 0,
      }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          RETAINER/MO
        </span>
        <span style={{
          fontSize: 22,
          color: client.is_maintain_active ? '#a855f7' : 'rgba(255,255,255,0.35)',
          textShadow: client.is_maintain_active ? '0 0 10px rgba(168,85,247,0.4)' : 'none',
        }}>
          {formatMoney(client.monthly_retainer, currency)}
        </span>
      </div>

      {/* Note */}
      {client.note && (
        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.3)',
          borderTop: '1px solid #2d2d3d', paddingTop: 8,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          letterSpacing: '0.02em',
        }}>
          {client.note}
        </div>
      )}
    </div>
  );
}

/* ── Main view ───────────────────────────────────────────────── */
export function ClientsView({ clients, currency }: { clients: Client[]; currency: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function openAdd() {
    modals.open({
      title: CLIENT.addClient,
      children: <ClientForm client={null} onDone={() => { modals.closeAll(); router.refresh(); }} />,
      size: 'sm',
    });
  }

  function openEdit(c: Client) {
    modals.open({
      title: CLIENT.editClient,
      children: <ClientForm client={c} onDone={() => { modals.closeAll(); router.refresh(); }} />,
      size: 'sm',
    });
  }

  function onDelete(c: Client) {
    modals.openConfirmModal({
      title: CLIENT.deleteConfirm(c.name),
      children: <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Tasks will be unlinked. This cannot be undone.</div>,
      labels: { confirm: '[ DELETE ]', cancel: '[ CANCEL ]' },
      confirmProps: { color: 'red' },
      onConfirm: () => startTransition(async () => {
        await deleteClient(c.id);
        notifications.show({ message: `// Client "${c.name}" removed.` });
        router.refresh();
      }),
    });
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 24, color: '#a855f7', letterSpacing: '0.1em',
          textShadow: '0 0 10px rgba(168,85,247,0.4)',
        }}>
          🛡️ GUILD_MEMBERS
        </div>
        <button
          onClick={openAdd}
          className="px-btn px-btn--primary"
          id="add-client-btn"
        >
          + ADD MEMBER
        </button>
      </div>

      {clients.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(168,85,247,0.2)',
          padding: '56px', textAlign: 'center',
          color: 'rgba(255,255,255,0.2)', fontSize: 18,
          fontFamily: 'var(--font-pixel), VT323, monospace',
          letterSpacing: '0.08em',
        }}>
          {'// NO GUILD MEMBERS YET'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {clients.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              currency={currency}
              onEdit={() => openEdit(c)}
              onDelete={() => onDelete(c)}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Client form ─────────────────────────────────────────────── */
function ClientForm({ client, onDone }: { client: Client | null; onDone: () => void }) {
  const [pending, setPending] = useState(false);

  const form = useForm({
    initialValues: {
      name:               client?.name ?? '',
      monthly_retainer:   client?.monthly_retainer != null ? Number(client.monthly_retainer) : 0,
      is_maintain_active: client?.is_maintain_active ?? false,
      note:               client?.note ?? '',
    },
    validate: {
      name: (v) => (v.trim() ? null : 'Name is required'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setPending(true);
    const fd = new FormData();
    if (client) fd.set('id', client.id);
    fd.set('name',               values.name.trim());
    fd.set('monthly_retainer',   String(values.monthly_retainer));
    fd.set('is_maintain_active', values.is_maintain_active ? 'on' : '');
    fd.set('note',               values.note);
    const res = await saveClient({}, fd);
    setPending(false);
    if (res?.error) {
      notifications.show({ color: 'red', message: res.error });
    } else {
      notifications.show({ message: client ? '// Client updated.' : '// Client added.' });
      onDone();
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-field">
        <label htmlFor="cf-name">CLIENT_NAME</label>
        <input id="cf-name" required {...form.getInputProps('name')} />
      </div>

      {/* Use Mantine NumberInput (keeps keyboard UX) with pixel override via CSS */}
      <div className="px-field">
        <label>RETAINER / MONTH</label>
        <NumberInput min={0} step={1000} {...form.getInputProps('monthly_retainer')} />
      </div>

      <Stack gap={4} mb="md">
        <Checkbox
          label="Maintain active"
          {...form.getInputProps('is_maintain_active', { type: 'checkbox' })}
        />
      </Stack>

      <div className="px-field">
        <label htmlFor="cf-note">NOTE</label>
        <textarea id="cf-note" rows={2} {...form.getInputProps('note')} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="px-btn px-btn--ghost" onClick={onDone}>CANCEL</button>
        <button type="submit" disabled={pending} className="px-btn px-btn--primary">
          {pending ? 'SAVING...' : 'SAVE'}
        </button>
      </div>
    </form>
  );
}

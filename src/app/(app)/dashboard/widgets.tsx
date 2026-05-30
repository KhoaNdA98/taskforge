'use client';

import Link from 'next/link';
import { Text, Group } from '@mantine/core';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { formatMoney } from '@/lib/format';

/* ── Pixel HP bar ──────────────────────────────────────────────────── */
function PixelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(value / max, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 14, position: 'relative',
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${color}33`,
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct * 100}%`,
          background: color,
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
      <span style={{ color, fontSize: 12, minWidth: 34, textAlign: 'right', letterSpacing: '0.04em' }}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

/* ── Completion (HP) widget ────────────────────────────────────────── */
export function CompletionWidget({ todo, doing, done }: { todo: number; doing: number; done: number }) {
  const total   = todo + doing + done;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: '4px solid #22c55e',
      padding: '16px 18px',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
    }}>
      <Text style={{ fontSize: 11, letterSpacing: '0.14em', color: '#22c55e', marginBottom: 12 }}>
        COMPLETION (HP)
      </Text>

      <div style={{ marginBottom: 10 }}>
        <PixelBar value={done} max={total} color="#22c55e" />
      </div>

      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 10 }}>
        {donePct}% Nhiệm vụ đã xong
      </Text>

      <div style={{ display: 'flex', gap: 14, fontSize: 13 }}>
        <span style={{ color: '#22c55e' }}>●DONE&nbsp;{done}</span>
        <span style={{ color: '#FCD34D' }}>●WIP&nbsp;&nbsp;{doing}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>○TODO&nbsp;{todo}</span>
      </div>
    </div>
  );
}

/* ── Profit (XP) widget ─────────────────────────────────────────────── */
export function DeltaWidget({ current, previous, currency }: { current: number; previous: number; currency: string }) {
  const delta  = current - previous;
  const pct    = previous === 0 ? (current > 0 ? 100 : 0) : Math.abs(Math.round((delta / previous) * 100));
  const up     = delta > 0;
  const flat   = delta === 0;
  const Icon   = flat ? Minus : up ? TrendingUp : TrendingDown;
  const accent = flat ? 'rgba(255,255,255,0.4)' : up ? '#A78BFA' : '#F87171';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: '4px solid #A78BFA',
      padding: '16px 18px',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
    }}>
      <Text style={{ fontSize: 11, letterSpacing: '0.14em', color: '#A78BFA', marginBottom: 12 }}>
        PROFIT (XP)
      </Text>

      <Text style={{ fontSize: 26, lineHeight: 1, color: '#E8E8F0', marginBottom: 6, letterSpacing: '-0.01em' }}>
        + {formatMoney(current, currency)}
      </Text>

      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 10 }}>
        Kinh nghiệm tích lũy tháng
      </Text>

      <Group gap="xs">
        <Icon size={13} style={{ color: accent }} />
        <Text style={{ color: accent, fontSize: 13 }}>
          {flat ? '±0%' : `${up ? '+' : '−'}${pct}%`}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
          prev: {formatMoney(previous, currency)}
        </Text>
      </Group>
    </div>
  );
}

/* ── Debt (Poison) widget ─────────────────────────────────────────── */
export function DebtWidget({ amount, currency }: { amount: number; currency: string }) {
  const accent = amount > 0 ? '#FCD34D' : '#22c55e';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `4px solid ${accent}`,
      padding: '16px 18px',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
    }}>
      <Text style={{ fontSize: 11, letterSpacing: '0.14em', color: accent, marginBottom: 12 }}>
        DEBT (POISON)
      </Text>

      <Text style={{ fontSize: 26, lineHeight: 1, color: accent, marginBottom: 6, textShadow: `0 0 16px ${accent}44`, letterSpacing: '-0.01em' }}>
        {formatMoney(amount, currency)}
      </Text>

      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
        {amount > 0 ? 'Trạng thái công nợ hiện tại' : '// NO DEBT REMAINING'}
      </Text>
    </div>
  );
}

/* ── Unbilled widget (legacy – kept for compatibility) ────────────── */
export function UnbilledWidget({ tasks, month }: { tasks: { id: string; name: string }[]; month: string }) {
  const count  = tasks.length;
  const accent = count > 0 ? '#FCD34D' : '#4ADE80';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `4px solid ${accent}`,
      padding: '16px 18px',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.8)',
    }}>
      <Text style={{ fontSize: 11, letterSpacing: '0.14em', color: accent, marginBottom: 12 }}>
        NEEDS_HOURS
      </Text>

      <Text style={{ fontSize: 44, lineHeight: 1, color: accent, marginBottom: 6, textShadow: `0 0 20px ${accent}44` }}>
        {count}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 10 }}>
        TASK{count !== 1 ? 'S' : ''} @ 0H
      </Text>

      {count === 0 ? (
        <Text style={{ color: '#4ADE80', fontSize: 13 }}>{'// ALL HOURS LOGGED'}</Text>
      ) : (
        <div>
          {tasks.slice(0, 3).map(t => (
            <Text key={t.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {'>'} {t.name}
            </Text>
          ))}
          {count > 3 && <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{'+ ' + (count - 3) + ' MORE...'}</Text>}
          <Link
            href={`/tasks?month=${month}&type=on_demand&view=table`}
            style={{ color: '#A78BFA', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}
          >
            LOG HOURS <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}

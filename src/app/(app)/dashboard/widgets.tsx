'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { formatMoney } from '@/lib/format';

function PixelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(value / max, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '10px', position: 'relative', border: '2px solid #111111', background: '#1a1a1a', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${pct * 100}%`, background: color, boxShadow: `0 0 6px ${color}88`, transition: 'width 0.5s ease' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(10,10,10,0.5) 7px, rgba(10,10,10,0.5) 8px)' }} />
      </div>
      <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color, minWidth: '40px', textAlign: 'right' }}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

export function CompletionWidget({ todo, doing, done }: { todo: number; doing: number; done: number }) {
  const total   = todo + doing + done;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div style={{ background: '#232323', border: '3px solid #111111', borderTop: '4px solid #6fcf5a', boxShadow: 'inset 0 0 0 1px rgba(111,207,90,0.15), 4px 4px 0 #111111', padding: '16px' }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#6fcf5a', textTransform: 'uppercase', marginBottom: '10px' }}>COMPLETION</div>
      <div style={{ marginBottom: '10px' }}><PixelBar value={done} max={total} color="#6fcf5a" /></div>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '22px', color: '#fceabb', marginBottom: '8px' }}>{donePct}% Nhiệm vụ đã xong</div>
      <div style={{ display: 'flex', gap: '14px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
        <span style={{ color: '#6fcf5a' }}>● DONE {done}</span>
        <span style={{ color: '#ff914d' }}>● WIP {doing}</span>
        <span style={{ color: 'rgba(252,234,187,0.3)' }}>○ TODO {todo}</span>
      </div>
    </div>
  );
}

export function DeltaWidget({ current, previous, currency }: { current: number; previous: number; currency: string }) {
  const delta  = current - previous;
  const pct    = previous === 0 ? (current > 0 ? 100 : 0) : Math.abs(Math.round((delta / previous) * 100));
  const up     = delta > 0;
  const flat   = delta === 0;
  const Icon   = flat ? Minus : up ? TrendingUp : TrendingDown;
  const accent = flat ? 'rgba(252,234,187,0.4)' : up ? '#ff914d' : '#ef4444';
  return (
    <div style={{ background: '#232323', border: '3px solid #111111', borderTop: '4px solid #ff914d', boxShadow: 'inset 0 0 0 1px rgba(255,145,77,0.15), 4px 4px 0 #111111', padding: '16px' }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#ff914d', textTransform: 'uppercase', marginBottom: '10px' }}>PROFIT (XP)</div>
      <div style={{
        fontFamily: "'VT323', monospace", fontSize: '32px', lineHeight: 1, marginBottom: '6px',
        color: '#111111',
        textShadow: '-1px -1px 0 #ffde59, 1px -1px 0 #ffde59, -1px 1px 0 #ffde59, 1px 1px 0 #ffde59, 2px 3px 0 #111111',
      }}>
        ✨ {formatMoney(current, currency)}
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(252,234,187,0.4)', marginBottom: '8px' }}>Kinh nghiệm tích lũy tháng</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600 }}>
        <Icon size={13} style={{ color: accent }} />
        <span style={{ color: accent }}>{flat ? '±0%' : `${up ? '+' : '−'}${pct}%`}</span>
        <span style={{ color: 'rgba(252,234,187,0.25)' }}>prev: {formatMoney(previous, currency)}</span>
      </div>
    </div>
  );
}

export function DebtWidget({ amount, currency }: { amount: number; currency: string }) {
  const hasDebt = amount > 0;
  const accent  = hasDebt ? '#ffde59' : '#6fcf5a';
  return (
    <div style={{ background: '#232323', border: '3px solid #111111', borderTop: `4px solid ${accent}`, boxShadow: `inset 0 0 0 1px ${accent}22, 4px 4px 0 #111111`, padding: '16px' }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: accent, textTransform: 'uppercase', marginBottom: '10px' }}>DEBT (POISON)</div>
      <div style={{
        fontFamily: "'VT323', monospace", fontSize: '32px', lineHeight: 1, marginBottom: '6px',
        color: '#111111',
        textShadow: `-1px -1px 0 ${accent}, 1px -1px 0 ${accent}, -1px 1px 0 ${accent}, 1px 1px 0 ${accent}, 2px 3px 0 #111111`,
      }}>
        {formatMoney(amount, currency)}
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(252,234,187,0.4)' }}>
        {hasDebt ? 'Trạng thái công nợ hiện tại' : '// NO DEBT REMAINING'}
      </div>
    </div>
  );
}

export function UnbilledWidget({ tasks, month }: { tasks: { id: string; name: string }[]; month: string }) {
  const count  = tasks.length;
  const accent = count > 0 ? '#ffde59' : '#6fcf5a';
  return (
    <div style={{ background: '#232323', border: '3px solid #111111', borderTop: `4px solid ${accent}`, boxShadow: `inset 0 0 0 1px ${accent}22, 4px 4px 0 #111111`, padding: '16px' }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: accent, textTransform: 'uppercase', marginBottom: '10px' }}>NEEDS HOURS</div>
      <div style={{ fontFamily: "'VT323', monospace", fontSize: '52px', lineHeight: 1, color: accent, marginBottom: '4px', textShadow: `2px 3px 0 #111` }}>{count}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(252,234,187,0.4)', marginBottom: '8px' }}>TASK{count !== 1 ? 'S' : ''} @ 0H</div>
      {count === 0 ? (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: '#6fcf5a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>✓ ALL HOURS LOGGED</span>
      ) : (
        <div>
          {tasks.slice(0, 3).map(t => (
            <div key={t.id} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(252,234,187,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>› {t.name}</div>
          ))}
          {count > 3 && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(252,234,187,0.25)' }}>+ {count - 3} more...</div>}
          <Link href={`/tasks?month=${month}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: '#ff914d', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            LOG HOURS <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}

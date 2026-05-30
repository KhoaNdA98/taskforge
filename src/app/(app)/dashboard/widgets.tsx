'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { formatMoney } from '@/lib/format';

function PixelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(value / max, 1);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3.5 relative border overflow-hidden"
           style={{ background: 'rgba(255,255,255,0.06)', borderColor: color + '33' }}>
        <div className="absolute inset-y-0 left-0 transition-[width] duration-500"
             style={{ width: `${pct * 100}%`, background: color, boxShadow: `0 0 8px ${color}88` }} />
      </div>
      <span className="font-pixel text-[12px] min-w-[34px] text-right tracking-[0.04em]"
            style={{ color }}>{Math.round(pct * 100)}%</span>
    </div>
  );
}

export function CompletionWidget({ todo, doing, done }: { todo: number; doing: number; done: number }) {
  const total   = todo + doing + done;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="bg-black/35 border border-white/5 border-l-4 border-l-px-green p-4 shadow-hard">
      <div className="font-pixel text-[11px] tracking-widest2 text-px-green mb-3">COMPLETION (HP)</div>
      <div className="mb-2.5"><PixelBar value={done} max={total} color="#22c55e" /></div>
      <div className="font-pixel text-[14px] text-white/45 mb-2.5">{donePct}% Nhiệm vụ đã xong</div>
      <div className="flex gap-3 font-pixel text-[13px]">
        <span className="text-px-green">●DONE&nbsp;{done}</span>
        <span className="text-px-yellow">●WIP&nbsp;&nbsp;{doing}</span>
        <span className="text-white/30">○TODO&nbsp;{todo}</span>
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
  const accent = flat ? 'rgba(255,255,255,0.4)' : up ? '#A78BFA' : '#F87171';
  return (
    <div className="bg-black/35 border border-white/5 border-l-4 p-4 shadow-hard" style={{ borderLeftColor: '#A78BFA' }}>
      <div className="font-pixel text-[11px] tracking-widest2 mb-3" style={{ color: '#A78BFA' }}>PROFIT (XP)</div>
      <div className="font-pixel text-[26px] leading-none text-[#E8E8F0] mb-1.5">
        + {formatMoney(current, currency)}
      </div>
      <div className="font-pixel text-[14px] text-white/35 mb-2.5">Kinh nghiệm tích lũy tháng</div>
      <div className="flex items-center gap-2 font-pixel text-[13px]">
        <Icon size={13} style={{ color: accent }} />
        <span style={{ color: accent }}>{flat ? '±0%' : `${up ? '+' : '−'}${pct}%`}</span>
        <span className="text-white/25">prev: {formatMoney(previous, currency)}</span>
      </div>
    </div>
  );
}

export function DebtWidget({ amount, currency }: { amount: number; currency: string }) {
  const accent = amount > 0 ? '#FCD34D' : '#22c55e';
  return (
    <div className="bg-black/35 border border-white/5 border-l-4 p-4 shadow-hard" style={{ borderLeftColor: accent }}>
      <div className="font-pixel text-[11px] tracking-widest2 mb-3" style={{ color: accent }}>DEBT (POISON)</div>
      <div className="font-pixel text-[26px] leading-none mb-1.5" style={{ color: accent, textShadow: `0 0 16px ${accent}44` }}>
        {formatMoney(amount, currency)}
      </div>
      <div className="font-pixel text-[14px] text-white/35">
        {amount > 0 ? 'Trạng thái công nợ hiện tại' : '// NO DEBT REMAINING'}
      </div>
    </div>
  );
}

export function UnbilledWidget({ tasks, month }: { tasks: { id: string; name: string }[]; month: string }) {
  const count  = tasks.length;
  const accent = count > 0 ? '#FCD34D' : '#4ADE80';
  return (
    <div className="bg-black/35 border border-white/5 border-l-4 p-4 shadow-hard" style={{ borderLeftColor: accent }}>
      <div className="font-pixel text-[11px] tracking-widest2 mb-3" style={{ color: accent }}>NEEDS_HOURS</div>
      <div className="font-pixel text-[44px] leading-none mb-1.5" style={{ color: accent, textShadow: `0 0 20px ${accent}44` }}>{count}</div>
      <div className="font-pixel text-[14px] text-white/35 mb-2.5">TASK{count !== 1 ? 'S' : ''} @ 0H</div>
      {count === 0 ? (
        <span className="font-pixel text-[13px] text-px-green">{'// ALL HOURS LOGGED'}</span>
      ) : (
        <div>
          {tasks.slice(0, 3).map(t => (
            <div key={t.id} className="font-pixel text-[12px] text-white/40 overflow-hidden text-ellipsis whitespace-nowrap">&gt; {t.name}</div>
          ))}
          {count > 3 && <div className="font-pixel text-[12px] text-white/25">+ {count - 3} MORE...</div>}
          <Link href={`/tasks?month=${month}`} className="font-pixel text-[13px] text-px-purple no-underline flex items-center gap-1 mt-1.5">
            LOG HOURS <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}

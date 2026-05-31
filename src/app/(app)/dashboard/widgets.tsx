'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { formatMoney } from '@/lib/format';

function PixelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(value / max, 1);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-4 relative border overflow-hidden"
           style={{ background: 'rgba(255,255,255,0.06)', borderColor: color + '33' }}>
        <div className="absolute inset-y-0 left-0 transition-[width] duration-500"
             style={{ width: `${pct * 100}%`, background: color, boxShadow: `0 0 8px ${color}88` }} />
      </div>
      <span style={{ fontFamily:"'VT323',monospace", fontSize:'18px', color, minWidth:'42px', textAlign:'right', letterSpacing:'0.04em' }}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

export function CompletionWidget({ todo, doing, done }: { todo: number; doing: number; done: number }) {
  const total   = todo + doing + done;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="bg-black/35 border border-white/5 border-l-4 border-l-px-green p-4 shadow-hard">
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'17px', letterSpacing:'0.14em', color:'#22c55e', marginBottom:'12px' }}>COMPLETION (HP)</div>
      <div style={{ marginBottom:'10px' }}><PixelBar value={done} max={total} color="#22c55e" /></div>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'20px', color:'rgba(255,255,255,0.5)', marginBottom:'10px' }}>{donePct}% Nhiệm vụ đã xong</div>
      <div style={{ display:'flex', gap:'16px', fontFamily:"'VT323',monospace", fontSize:'19px' }}>
        <span style={{ color:'#22c55e' }}>●DONE&nbsp;{done}</span>
        <span style={{ color:'#eab308' }}>●WIP&nbsp;&nbsp;{doing}</span>
        <span style={{ color:'rgba(255,255,255,0.35)' }}>○TODO&nbsp;{todo}</span>
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
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'17px', letterSpacing:'0.14em', color:'#A78BFA', marginBottom:'12px' }}>PROFIT (XP)</div>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'34px', lineHeight:1, color:'#ffffff', marginBottom:'6px', textShadow:'0 0 2px rgba(255,255,255,0.3)' }}>
        + {formatMoney(current, currency)}
      </div>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'19px', color:'rgba(255,255,255,0.45)', marginBottom:'10px' }}>Kinh nghiệm tích lũy tháng</div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:"'VT323',monospace", fontSize:'18px' }}>
        <Icon size={15} style={{ color: accent }} />
        <span style={{ color: accent }}>{flat ? '±0%' : `${up ? '+' : '−'}${pct}%`}</span>
        <span style={{ color:'rgba(255,255,255,0.3)' }}>prev: {formatMoney(previous, currency)}</span>
      </div>
    </div>
  );
}

export function DebtWidget({ amount, currency }: { amount: number; currency: string }) {
  const accent = amount > 0 ? '#FCD34D' : '#22c55e';
  return (
    <div className="bg-black/35 border border-white/5 border-l-4 p-4 shadow-hard" style={{ borderLeftColor: accent }}>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'17px', letterSpacing:'0.14em', color: accent, marginBottom:'12px' }}>DEBT (POISON)</div>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'34px', lineHeight:1, color: accent, textShadow:`0 0 16px ${accent}44`, marginBottom:'6px' }}>
        {formatMoney(amount, currency)}
      </div>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'19px', color:'rgba(255,255,255,0.45)' }}>
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
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'17px', letterSpacing:'0.14em', color: accent, marginBottom:'12px' }}>NEEDS_HOURS</div>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'52px', lineHeight:1, color: accent, textShadow:`0 0 20px ${accent}44`, marginBottom:'6px' }}>{count}</div>
      <div style={{ fontFamily:"'VT323',monospace", fontSize:'19px', color:'rgba(255,255,255,0.45)', marginBottom:'10px' }}>TASK{count !== 1 ? 'S' : ''} @ 0H</div>
      {count === 0 ? (
        <span style={{ fontFamily:"'VT323',monospace", fontSize:'18px', color:'#22c55e' }}>{'// ALL HOURS LOGGED'}</span>
      ) : (
        <div>
          {tasks.slice(0, 3).map(t => (
            <div key={t.id} style={{ fontFamily:"'VT323',monospace", fontSize:'17px', color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>&gt; {t.name}</div>
          ))}
          {count > 3 && <div style={{ fontFamily:"'VT323',monospace", fontSize:'17px', color:'rgba(255,255,255,0.3)' }}>+ {count - 3} MORE...</div>}
          <Link href={`/tasks?month=${month}`} style={{ fontFamily:"'VT323',monospace", fontSize:'18px', color:'#a855f7', textDecoration:'none', display:'flex', alignItems:'center', gap:'4px', marginTop:'6px' }}>
            LOG HOURS <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

import { formatMoney } from '@/lib/format';

interface Props {
  email: string; level: number; strength: number;
  intellect: number; totalRevenue: number; currency: string;
}

export function PlayerStatsBar({ email, level, strength, totalRevenue, currency }: Props) {
  const hpColor = strength >= 60 ? '#22c55e' : strength >= 30 ? '#eab308' : '#ef4444';
  const hpShadow = strength >= 60
    ? '0 0 6px rgba(34,197,94,0.6)'
    : strength >= 30
      ? '0 0 6px rgba(234,179,8,0.5)'
      : '0 0 6px rgba(239,68,68,0.6)';

  return (
    <header
      id="player-stats-bar"
      className="sticky top-0 z-50 flex items-center justify-between gap-4 px-5 py-2.5
                 border-b-2 border-px-border backdrop-blur-sm"
      style={{ background: 'rgba(5,5,8,0.95)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div style={{ width:8,height:8,background:'#7c3aed',flexShrink:0,
          boxShadow:'0 0 8px #7c3aed,2px 0 0 #a855f7,0 2px 0 #a855f7' }} />
        <span className="font-pixel text-[22px] text-px-purple tracking-[0.12em]"
              style={{ textShadow:'0 0 10px rgba(168,85,247,0.5)' }}>
          TASKFORGE
        </span>
        <span className="font-pixel text-[13px] text-px-purple/35 tracking-[0.1em]">
          LVL.{String(level).padStart(2,'0')}
        </span>
      </div>

      {/* HP bar — center */}
      <div className="flex-1 max-w-xs">
        <div className="flex justify-between mb-0.5">
          <span className="font-pixel text-[13px] tracking-[0.06em]" style={{ color: hpColor }}>HP</span>
          <span className="font-pixel text-[13px]" style={{ color: hpColor }}>{strength}%</span>
        </div>
        <div
          role="progressbar" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={100}
          aria-label={`HP: ${strength}%`}
          className="h-2.5 border border-px-border overflow-hidden relative"
          style={{ background: '#2d2d3d' }}
        >
          <div className="absolute inset-y-0 left-0 transition-[width] duration-500"
               style={{ width:`${strength}%`, background: hpColor, boxShadow: hpShadow }} />
          {/* Pixel segments */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ backgroundImage:'repeating-linear-gradient(90deg,transparent,transparent 8px,rgba(5,5,8,0.5) 8px,rgba(5,5,8,0.5) 9px)' }} />
        </div>
      </div>

      {/* XP + email — right */}
      <div className="text-right flex-shrink-0">
        <div className="font-pixel text-[24px] leading-none text-px-cyan"
             style={{ textShadow:'0 0 10px rgba(6,182,212,0.45)' }}>
          +{formatMoney(totalRevenue, currency)} XP
        </div>
        <div className="text-[11px] text-white/25 mt-0.5 tracking-[0.02em] max-w-[160px]
                        overflow-hidden text-ellipsis whitespace-nowrap">
          {email}
        </div>
      </div>
    </header>
  );
}

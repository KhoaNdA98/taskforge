import { formatMoney } from '@/lib/format';

interface Props {
  email: string; level: number; strength: number;
  intellect: number; totalRevenue: number; currency: string;
}

function getHpColor(pct: number): string {
  if (pct >= 60) return '#22c55e';
  if (pct >= 30) return '#eab308';
  return '#ef4444';
}

export function PlayerStatsBar({ email, level, strength, totalRevenue, currency }: Props) {
  const hpColor = getHpColor(strength);

  return (
    <header
      id="stats-header"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '2px solid #2d2d3d',
        background: 'rgba(19,19,28,0.85)',
        backdropFilter: 'blur(4px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}
    >
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 10, height: 10, background: '#7c3aed', flexShrink: 0,
          boxShadow: '0 0 10px #7c3aed, 3px 0 0 #a855f7, 0 3px 0 #a855f7',
        }} />
        <span style={{
          fontFamily: "'VT323', monospace", fontSize: '34px',
          color: '#a855f7', textShadow: '0 0 10px rgba(168,85,247,0.5)',
          letterSpacing: '0.05em',
        }}>
          ⚔ TASKFORGE
        </span>
        <span style={{
          fontFamily: "'VT323', monospace", fontSize: '17px',
          color: 'rgba(168,85,247,0.35)', letterSpacing: '0.1em',
        }}>
          LVL.{String(level).padStart(2, '0')}
        </span>
      </div>

      {/* Center: HP Bar */}
      <div style={{ flex: 1, maxWidth: '320px', margin: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: hpColor, letterSpacing: '0.05em' }}>
            HP
          </span>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: hpColor }}>
            {strength}/100
          </span>
        </div>
        <div
          role="progressbar" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={100}
          aria-label={`HP: ${strength}%`}
          style={{
            width: '100%', height: '14px',
            background: '#2d2d3d',
            border: '2px solid #3f3f50',
            overflow: 'hidden', position: 'relative',
          }}
        >
          <div style={{
            width: `${strength}%`, height: '100%',
            background: hpColor,
            boxShadow: `0 0 8px ${hpColor}80`,
            transition: 'width 0.4s ease',
          }} />
          {/* Pixel segments */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(10,10,15,0.4) 9px, rgba(10,10,15,0.4) 10px)',
          }} />
        </div>
      </div>

      {/* Right: XP */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: '#6b7280', letterSpacing: '0.08em' }}>
          MONTHLY XP
        </div>
        <div id="xp-counter" style={{
          fontFamily: "'VT323', monospace", fontSize: '38px',
          color: '#06b6d4', textShadow: '0 0 10px rgba(6,182,212,0.5)',
          lineHeight: 1.1,
        }}>
          +{formatMoney(totalRevenue, currency)} XP
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '2px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {email}
        </div>
      </div>
    </header>
  );
}

import { formatMoney } from '@/lib/format';

interface Props {
  email: string; level: number; strength: number;
  intellect: number; totalRevenue: number; currency: string;
}

function getHpColor(pct: number): string {
  if (pct >= 60) return '#6fcf5a';
  if (pct >= 30) return '#ffde59';
  return '#ef4444';
}

export function PlayerStatsBar({ email, level, strength, totalRevenue, currency }: Props) {
  const hpColor = getHpColor(strength);

  return (
    <header
      id="stats-header"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        background: '#141414',
        borderBottom: '3px solid #111111',
        boxShadow: 'inset 0 -1px 0 rgba(255,222,89,0.08)',
        position: 'sticky', top: 0, zIndex: 50,
      }}
    >
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Pixel coin logo */}
        <div style={{
          width: 12, height: 12, background: '#ff914d', flexShrink: 0,
          boxShadow: '2px 0 0 #ffde59, 0 2px 0 #ffde59, 2px 2px 0 #cc6b30',
        }} />
        <span style={{
          fontFamily: "'VT323', monospace", fontSize: '30px',
          color: '#ff914d',
          textShadow: '-1px -1px 0 #111, 1px -1px 0 #111, -1px 1px 0 #111, 1px 1px 0 #111, 2px 3px 0 #111',
          letterSpacing: '0.06em',
        }}>
          ⭐ TASKFORGE
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.12em', color: 'rgba(255,222,89,0.5)',
          background: '#1e1e1e', border: '2px solid #3d3020',
          padding: '1px 7px', textTransform: 'uppercase',
        }}>
          LVL {String(level).padStart(2, '0')}
        </span>
      </div>

      {/* Center: HP / Completion bar */}
      <div style={{ flex: 1, maxWidth: '340px', margin: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(252,234,187,0.45)', textTransform: 'uppercase' }}>
            COMPLETION
          </span>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: hpColor, letterSpacing: '0.04em' }}>
            {strength}/100
          </span>
        </div>
        <div
          role="progressbar" aria-valuenow={strength} aria-valuemin={0} aria-valuemax={100}
          aria-label={`Completion: ${strength}%`}
          style={{
            width: '100%', height: '12px',
            background: '#1a1a1a',
            border: '2px solid #111111',
            boxShadow: 'inset 0 0 0 1px rgba(255,145,77,0.15)',
            overflow: 'hidden', position: 'relative',
          }}
        >
          <div style={{
            width: `${strength}%`, height: '100%',
            background: `linear-gradient(90deg, ${hpColor}cc, ${hpColor})`,
            boxShadow: `0 0 6px ${hpColor}80`,
            transition: 'width 0.5s ease',
          }} />
          {/* Pixel segment dividers */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(10,10,10,0.5) 9px, rgba(10,10,10,0.5) 10px)',
          }} />
        </div>
      </div>

      {/* Right: XP Counter */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.12em', color: 'rgba(252,234,187,0.4)', textTransform: 'uppercase', marginBottom: '2px',
        }}>
          TOTAL EXPERIENCE
        </div>
        <div id="xp-counter" style={{
          fontFamily: "'VT323', monospace", fontSize: '34px', lineHeight: 1.1,
          color: '#111111',
          textShadow: '-1px -1px 0 #ffde59, 1px -1px 0 #ffde59, -1px 1px 0 #ffde59, 1px 1px 0 #ffde59, 2px 3px 0 #111111',
        }}>
          ✨ {formatMoney(totalRevenue, currency)} XP
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: '11px',
          color: 'rgba(252,234,187,0.25)', marginTop: '2px',
          maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {email}
        </div>
      </div>
    </header>
  );
}

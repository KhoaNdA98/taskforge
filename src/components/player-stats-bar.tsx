import { formatMoney } from '@/lib/format';

interface Props {
  email: string;
  level: number;
  strength: number;   // HP %
  intellect: number;  // INT %
  totalRevenue: number;
  currency: string;
}

export function PlayerStatsBar({ email, level, strength, totalRevenue, currency }: Props) {
  const hpColor = strength >= 60 ? '#22c55e' : strength >= 30 ? '#eab308' : '#ef4444';

  return (
    <header
      id="player-stats-bar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'rgba(5,5,8,0.92)',
        borderBottom: '2px solid rgba(139,92,246,0.18)',
        backdropFilter: 'blur(6px)',
        gap: 16,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 8,
          height: 8,
          background: '#7C3AED',
          boxShadow: '0 0 8px #7C3AED, 2px 0 0 #A78BFA, 0 2px 0 #A78BFA',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 22,
          color: '#A78BFA',
          letterSpacing: '0.12em',
          textShadow: '0 0 10px rgba(167,139,250,0.5)',
        }}>
          TASKFORGE
        </span>
        <span style={{
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 13,
          color: 'rgba(167,139,250,0.35)',
          letterSpacing: '0.1em',
        }}>
          // LVL.{String(level).padStart(2, '0')}
        </span>
      </div>

      {/* HP Bar (center) */}
      <div style={{ flex: 1, maxWidth: 300 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 3,
        }}>
          <span style={{
            fontFamily: 'var(--font-pixel), VT323, monospace',
            fontSize: 13,
            color: hpColor,
            letterSpacing: '0.06em',
          }}>
            HP
          </span>
          <span style={{
            fontFamily: 'var(--font-pixel), VT323, monospace',
            fontSize: 13,
            color: hpColor,
          }}>
            {strength}%
          </span>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={strength}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`HP: ${strength}%`}
          style={{
            height: 10,
            background: '#2d2d3d',
            border: '1px solid #3f3f50',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{
            width: `${strength}%`,
            height: '100%',
            background: hpColor,
            boxShadow: `0 0 6px ${hpColor}99`,
            transition: 'width 0.5s ease',
          }} />
          {/* Pixel segments overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(5,5,8,0.5) 8px, rgba(5,5,8,0.5) 9px)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Right: XP + email */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 24,
          color: '#06b6d4',
          textShadow: '0 0 10px rgba(6,182,212,0.45)',
          lineHeight: 1,
        }}>
          +{formatMoney(totalRevenue, currency)} XP
        </div>
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.25)',
          marginTop: 2,
          letterSpacing: '0.02em',
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {email}
        </div>
      </div>
    </header>
  );
}

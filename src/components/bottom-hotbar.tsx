'use client';

import { useCallback, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/ui/modal';
import { signOut } from '@/app/auth/actions';

const NAV_SLOTS = [
  { id: 'dashboard', hotkey: '1', emoji: '🛸', label: 'BASE',    href: '/dashboard' },
  { id: 'tasks',     hotkey: '2', emoji: '⭐', label: 'QUESTS',  href: '/tasks'     },
  { id: 'clients',   hotkey: '3', emoji: '🤝', label: 'GUILD',   href: '/clients'   },
  { id: 'settings',  hotkey: '4', emoji: '🪙', label: 'BILLING', href: '/settings'  },
] as const;

const SLOT_W = 68;
const SLOT_H = 68;

function NavSlot({ hotkey, emoji, label, href, active }: {
  hotkey: string; emoji: string; label: string; href: string; active: boolean;
}) {
  const bg     = active ? '#ff914d' : '#1e1e1e';
  const border = active ? '#111111' : '#111111';
  const shadow = active
    ? 'inset -2px -2px 0px rgba(0,0,0,0.25), inset 2px 2px 0px rgba(255,255,255,0.25), 0px 2px 0px #111111'
    : 'inset -3px -3px 0px rgba(0,0,0,0.2), inset 3px 3px 0px rgba(255,255,255,0.15), 3px 4px 0px #111111';
  const labelColor = active ? '#111111' : '#fceabb99';
  const translateY = active ? '2px' : '0px';

  return (
    <Link
      href={href}
      id={`nav-slot-${label.toLowerCase()}`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      style={{
        position: 'relative',
        width: `${SLOT_W}px`, height: `${SLOT_H}px`,
        background: bg,
        border: `3px solid ${border}`,
        boxShadow: shadow,
        transform: `translateY(${translateY})`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '2px',
        textDecoration: 'none',
        transition: 'all 0.08s ease',
        cursor: 'pointer', flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.background = 'rgba(255,145,77,0.15)';
          el.style.boxShadow = 'inset 0 0 0 2px #ff914d, 3px 4px 0px #111111';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.background = '#1e1e1e';
          el.style.boxShadow = 'inset -3px -3px 0px rgba(0,0,0,0.2), inset 3px 3px 0px rgba(255,255,255,0.15), 3px 4px 0px #111111';
        }
      }}
    >
      {/* Hotkey badge */}
      <span style={{
        position: 'absolute', top: '3px', left: '5px',
        fontFamily: "'VT323', monospace", fontSize: '13px',
        color: active ? 'rgba(0,0,0,0.4)' : 'rgba(252,234,187,0.3)', lineHeight: 1,
      }}>
        {hotkey}
      </span>

      {/* Icon */}
      <span role="img" aria-hidden style={{ fontSize: '26px', lineHeight: 1 }}>{emoji}</span>

      {/* Label */}
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '9px', fontWeight: 600,
        letterSpacing: '0.1em', color: labelColor,
        textTransform: 'uppercase', lineHeight: 1,
      }}>
        {label}
      </span>
    </Link>
  );
}

function ExitSlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      id="nav-slot-exit"
      aria-label="Exit"
      onClick={onClick}
      style={{
        position: 'relative', width: `${SLOT_W}px`, height: `${SLOT_H}px`,
        background: '#1e1e1e', border: '3px solid #111111',
        boxShadow: 'inset -3px -3px 0px rgba(0,0,0,0.2), inset 3px 3px 0px rgba(255,255,255,0.15), 3px 4px 0px #111111',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '2px',
        fontSize: '26px', cursor: 'pointer', flexShrink: 0,
        transition: 'all 0.08s ease', outline: 'none', padding: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = 'rgba(239,68,68,0.12)';
        el.style.boxShadow = 'inset 0 0 0 2px #ef4444, 3px 4px 0px #111111';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = '#1e1e1e';
        el.style.boxShadow = 'inset -3px -3px 0px rgba(0,0,0,0.2), inset 3px 3px 0px rgba(255,255,255,0.15), 3px 4px 0px #111111';
      }}
    >
      <span role="img" aria-hidden style={{ lineHeight: 1 }}>🚪</span>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '9px', fontWeight: 600,
        letterSpacing: '0.1em', color: 'rgba(252,234,187,0.3)',
        textTransform: 'uppercase', lineHeight: 1,
      }}>EXIT</span>
    </button>
  );
}

export function BottomHotbar() {
  const pathname = usePathname();
  const { open } = useModal();
  const [, startTransition] = useTransition();

  const handleExit = useCallback(() => {
    open({
      title: 'EXIT GAME',
      content: (
        <div>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: '#ffde59', marginBottom: '8px' }}>⚠ WARNING</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(252,234,187,0.7)', lineHeight: 1.6 }}>
            Your progress has been saved.<br />Are you sure you want to exit?
          </p>
        </div>
      ),
      onConfirm: () => startTransition(async () => { await signOut(); }),
      confirmLabel: '[ YES, EXIT ]',
      cancelLabel:  '[ STAY ]',
      danger: true,
    });
  }, [open, startTransition]);

  return (
    <nav
      aria-label="Game Navigation"
      style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '6px', zIndex: 100,
        padding: '8px 10px',
        background: '#141414',
        border: '3px solid #111111',
        boxShadow: 'inset 0 0 0 1px rgba(255,222,89,0.12), 4px 4px 0px #111111',
        backdropFilter: 'blur(4px)',
      }}
    >
      {NAV_SLOTS.map(slot => {
        const active = pathname === slot.href || pathname.startsWith(slot.href + '/');
        return <NavSlot key={slot.id} {...slot} active={active} />;
      })}
      <div style={{ width: '2px', background: '#2a2a2a', alignSelf: 'center', height: '44px', flexShrink: 0, margin: '0 2px' }} />
      <ExitSlot onClick={handleExit} />
    </nav>
  );
}

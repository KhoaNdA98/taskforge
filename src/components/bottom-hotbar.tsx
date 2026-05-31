'use client';

import { useCallback, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/ui/modal';
import { signOut } from '@/app/auth/actions';

const NAV_SLOTS = [
  { id: 'dashboard', hotkey: '1', emoji: '🗺️', label: 'Map',    href: '/dashboard' },
  { id: 'tasks',     hotkey: '2', emoji: '⚔️', label: 'Quests', href: '/tasks'     },
  { id: 'clients',   hotkey: '3', emoji: '🛡️', label: 'Guild',  href: '/clients'   },
  { id: 'settings',  hotkey: '4', emoji: '⚙️', label: 'System', href: '/settings'  },
] as const;

function NavSlot({ hotkey, emoji, label, href, active }: {
  hotkey: string; emoji: string; label: string; href: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      id={`nav-slot-${label.toLowerCase()}`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      style={{
        position: 'relative',
        width: '64px', height: '64px',
        background: active ? 'rgba(168,85,247,0.15)' : '#13131c',
        border: active ? '2px solid #a855f7' : '2px solid #2d2d3d',
        boxShadow: active
          ? 'inset 0 2px 0 rgba(168,85,247,0.3), 2px 2px 0 rgba(0,0,0,0.6)'
          : '6px 6px 0px 0px rgba(0,0,0,0.6)',
        transform: active ? 'translateY(2px)' : 'translateY(0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', textDecoration: 'none',
        transition: 'all 0.1s ease', cursor: 'pointer', flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.borderColor = '#a855f7';
          (e.currentTarget as HTMLElement).style.boxShadow = '8px 8px 0px 0px rgba(168,85,247,0.4)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.borderColor = '#2d2d3d';
          (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,0.6)';
        }
      }}
    >
      <span style={{ position: 'absolute', top: '3px', left: '5px', fontFamily: "'VT323', monospace", fontSize: '14px', color: active ? '#a855f7' : '#6b7280', lineHeight: 1 }}>
        {hotkey}
      </span>
      <span role="img" aria-hidden style={{ lineHeight: 1 }}>{emoji}</span>
      <span style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontFamily: "'VT323', monospace", fontSize: '13px', color: active ? '#a855f7' : '#6b7280', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
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
        position: 'relative', width: '64px', height: '64px',
        background: '#13131c', border: '2px solid #2d2d3d',
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', cursor: 'pointer', flexShrink: 0,
        transition: 'all 0.1s ease', outline: 'none', padding: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '8px 8px 0px 0px rgba(239,68,68,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#2d2d3d';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,0.6)';
      }}
    >
      <span style={{ position: 'absolute', top: '3px', left: '5px', fontFamily: "'VT323', monospace", fontSize: '14px', color: '#6b7280', lineHeight: 1 }}>0</span>
      <span role="img" aria-hidden style={{ lineHeight: 1 }}>🚪</span>
      <span style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontFamily: "'VT323', monospace", fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>Exit</span>
    </button>
  );
}

export function BottomHotbar() {
  const pathname = usePathname();
  const { open } = useModal();
  const [, startTransition] = useTransition();

  const handleExit = useCallback(() => {
    open({
      title: '// QUIT_GAME.exe',
      content: (
        <div>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#eab308', marginBottom: '8px' }}>WARNING</p>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Your progress has been auto-saved.<br />Exit this world?
          </p>
        </div>
      ),
      onConfirm: () => startTransition(async () => { await signOut(); }),
      confirmLabel: '[ YES, EXIT ]',
      cancelLabel:  '[ NO, STAY ]',
      danger: true,
    });
  }, [open, startTransition]);

  return (
    <nav
      aria-label="Game Navigation"
      style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '12px', zIndex: 100,
        padding: '8px 16px',
        background: 'rgba(10,10,15,0.9)',
        border: '2px solid #2d2d3d',
        boxShadow: '0 0 24px rgba(168,85,247,0.15)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {NAV_SLOTS.map(slot => {
        const active = pathname === slot.href || pathname.startsWith(slot.href + '/');
        return <NavSlot key={slot.id} {...slot} active={active} />;
      })}
      <div style={{ width: '1px', background: '#2d2d3d', alignSelf: 'center', height: '40px', flexShrink: 0 }} />
      <ExitSlot onClick={handleExit} />
    </nav>
  );
}

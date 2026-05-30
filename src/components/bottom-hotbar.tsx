'use client';

import { useState, useCallback, useTransition } from 'react';
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
      id={`hotbar-${label.toLowerCase()}`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`relative w-16 h-16 flex items-center justify-center no-underline
        border-2 transition-all duration-100 flex-shrink-0
        ${active
          ? 'bg-px-purple/15 border-px-purple shadow-[inset_0_2px_0_rgba(168,85,247,0.25),2px_2px_0_rgba(0,0,0,0.6)] translate-y-0.5'
          : 'bg-px-card border-px-border shadow-hard hover:border-px-purple/50 hover:shadow-hard-purple hover:-translate-y-0.5'
        }`}
    >
      <span className={`absolute top-1 left-1.5 font-pixel text-[13px] leading-none
        ${active ? 'text-px-purple' : 'text-white/25'}`}>{hotkey}</span>
      <span role="img" aria-hidden className="text-[26px] leading-none">{emoji}</span>
      <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 font-pixel text-[12px]
        whitespace-nowrap tracking-[0.06em]
        ${active ? 'text-px-purple' : 'text-white/25'}`}>
        {label.toUpperCase()}
      </span>
    </Link>
  );
}

function ActionSlot({ hotkey, emoji, label, onClick, danger = false }: {
  hotkey: string; emoji: string; label: string; onClick: () => void; danger?: boolean;
}) {
  const accent = danger ? 'px-red' : 'px-cyan';
  return (
    <button
      id={`hotbar-${label.toLowerCase().replace(/\s/g, '-')}`}
      aria-label={label}
      onClick={onClick}
      className={`relative w-16 h-16 flex items-center justify-center
        bg-px-card border-2 border-px-border shadow-hard
        transition-all duration-100 cursor-pointer p-0 flex-shrink-0
        hover:border-${accent} hover:shadow-hard`}
    >
      <span className="absolute top-1 left-1.5 font-pixel text-[13px] leading-none text-white/25">
        {hotkey}
      </span>
      <span role="img" aria-hidden className="text-[26px] leading-none">{emoji}</span>
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-pixel text-[12px] whitespace-nowrap tracking-[0.06em] text-white/25">
        {label.toUpperCase()}
      </span>
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
        <div className="space-y-2">
          <p className="font-pixel text-px-yellow text-[16px] tracking-[0.06em]">WARNING</p>
          <p className="font-pixel text-white/60 text-[16px] leading-relaxed">
            Your progress has been auto-saved.<br />Exit this world?
          </p>
          <p className="font-pixel text-white/25 text-[13px] tracking-[0.04em]">
            {'// session will be terminated'}
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
    <nav aria-label="Game Navigation" className="px-hotbar mb-6">
      {NAV_SLOTS.map(slot => {
        const active = pathname === slot.href || pathname.startsWith(slot.href + '/');
        return <NavSlot key={slot.id} {...slot} active={active} />;
      })}
      <div className="w-0.5 h-10 bg-px-border self-center flex-shrink-0" />
      <ActionSlot hotkey="0" emoji="🚪" label="Exit" onClick={handleExit} danger />
    </nav>
  );
}

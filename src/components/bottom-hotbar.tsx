'use client';

import { useState, useCallback, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Spotlight, spotlight } from '@mantine/spotlight';
import { modals } from '@mantine/modals';
import { Stack, Text } from '@mantine/core';
import { Search } from 'lucide-react';
import { signOut } from '@/app/auth/actions';

// ── Slot definitions ─────────────────────────────────────────────────────
const NAV_SLOTS = [
  { id: 'dashboard', hotkey: '1', emoji: '🗺️',  label: 'Map',    href: '/dashboard' },
  { id: 'tasks',     hotkey: '2', emoji: '⚔️',  label: 'Quests', href: '/tasks'     },
  { id: 'clients',   hotkey: '3', emoji: '🛡️',  label: 'Guild',  href: '/clients'   },
  { id: 'settings',  hotkey: '4', emoji: '⚙️',  label: 'System', href: '/settings'  },
] as const;

const SPOTLIGHT_ACTIONS = NAV_SLOTS.map(s => ({ id: s.id, label: s.label, href: s.href }));

// ── Individual nav slot ──────────────────────────────────────────────────
function NavSlot({
  hotkey,
  emoji,
  label,
  href,
  active,
}: {
  hotkey: string;
  emoji: string;
  label: string;
  href: string;
  active: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      id={`hotbar-slot-${label.toLowerCase()}`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        background: active
          ? 'rgba(168, 85, 247, 0.15)'
          : hovered
            ? 'rgba(168, 85, 247, 0.07)'
            : '#0e0e16',
        border: active
          ? '2px solid #a855f7'
          : hovered
            ? '2px solid rgba(168,85,247,0.5)'
            : '2px solid #2d2d3d',
        boxShadow: active
          ? 'inset 0 2px 0 rgba(168,85,247,0.25), 2px 2px 0 rgba(0,0,0,0.6)'
          : hovered
            ? '8px 8px 0px rgba(168,85,247,0.3)'
            : '6px 6px 0px rgba(0,0,0,0.6)',
        transform: active ? 'translateY(2px)' : 'translateY(0)',
        transition: 'all 0.1s ease',
        flexShrink: 0,
      }}
    >
      {/* Hotkey number */}
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: 5,
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 13,
          lineHeight: 1,
          color: active ? '#a855f7' : 'rgba(255,255,255,0.25)',
        }}
      >
        {hotkey}
      </span>

      {/* Emoji icon — rendered as text node, safe from XSS */}
      <span role="img" aria-hidden="true" style={{ fontSize: 26, lineHeight: 1 }}>
        {emoji}
      </span>

      {/* Label below slot */}
      <span
        style={{
          position: 'absolute',
          bottom: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 12,
          whiteSpace: 'nowrap',
          color: active ? '#a855f7' : 'rgba(255,255,255,0.25)',
          letterSpacing: '0.06em',
        }}
      >
        {label.toUpperCase()}
      </span>
    </Link>
  );
}

// ── Action slot (button variant) ─────────────────────────────────────────
function ActionSlot({
  hotkey,
  emoji,
  label,
  onClick,
  danger = false,
}: {
  hotkey: string;
  emoji: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor = danger ? '#ef4444' : '#06b6d4';

  return (
    <button
      id={`hotbar-slot-${label.toLowerCase().replace(/\s/g, '-')}`}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hovered ? `rgba(${danger ? '239,68,68' : '6,182,212'},0.1)` : '#0e0e16',
        border: hovered ? `2px solid ${accentColor}` : '2px solid #2d2d3d',
        boxShadow: hovered
          ? `8px 8px 0px rgba(${danger ? '239,68,68' : '6,182,212'},0.25)`
          : '6px 6px 0px rgba(0,0,0,0.6)',
        transform: 'translateY(0)',
        transition: 'all 0.1s ease',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: 5,
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 13,
          lineHeight: 1,
          color: hovered ? accentColor : 'rgba(255,255,255,0.25)',
        }}
      >
        {hotkey}
      </span>

      {/* Emoji rendered as text node — XSS-safe */}
      <span role="img" aria-hidden="true" style={{ fontSize: 26, lineHeight: 1 }}>
        {emoji}
      </span>

      <span
        style={{
          position: 'absolute',
          bottom: -20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-pixel), VT323, monospace',
          fontSize: 12,
          whiteSpace: 'nowrap',
          color: hovered ? accentColor : 'rgba(255,255,255,0.25)',
          letterSpacing: '0.06em',
        }}
      >
        {label.toUpperCase()}
      </span>
    </button>
  );
}

// ── Main BottomHotbar ────────────────────────────────────────────────────
export function BottomHotbar() {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const handleExit = useCallback(() => {
    modals.openConfirmModal({
      title: '// QUIT_GAME.exe',
      children: (
        <Stack gap={8}>
          <Text style={{ color: '#FCD34D', fontSize: 16, letterSpacing: '0.06em' }}>
            WARNING
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.5 }}>
            Your progress has been auto-saved.<br />
            Exit this world?
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, letterSpacing: '0.04em' }}>
            {'// session will be terminated'}
          </Text>
        </Stack>
      ),
      labels: { confirm: '[ YES, EXIT ]', cancel: '[ NO, STAY ]' },
      confirmProps: { color: 'red' },
      onConfirm: () => startTransition(async () => { await signOut(); }),
    });
  }, [startTransition]);

  return (
    <>
      <Spotlight
        actions={SPOTLIGHT_ACTIONS.map(a => ({
          ...a,
          onClick: () => window.location.assign(a.href),
        }))}
        shortcut={['mod + K']}
        nothingFound="No pages found…"
        highlightQuery
        searchProps={{
          leftSection: <Search size={16} />,
          placeholder: 'Search pages…',
        }}
      />

      <nav
        aria-label="Game Navigation"
        className="tf-hotbar"
      >
        {/* Nav slots */}
        {NAV_SLOTS.map(slot => {
          const active = pathname === slot.href || pathname.startsWith(slot.href + '/');
          return (
            <NavSlot
              key={slot.id}
              hotkey={slot.hotkey}
              emoji={slot.emoji}
              label={slot.label}
              href={slot.href}
              active={active}
            />
          );
        })}

        {/* Divider */}
        <div style={{
          width: 2,
          height: 40,
          background: '#2d2d3d',
          alignSelf: 'center',
          flexShrink: 0,
        }} />

        {/* Search slot */}
        <ActionSlot
          hotkey="5"
          emoji="🔍"
          label="Search"
          onClick={spotlight.open}
        />

        {/* Exit slot */}
        <ActionSlot
          hotkey="0"
          emoji="🚪"
          label="Exit"
          onClick={handleExit}
          danger
        />
      </nav>
    </>
  );
}

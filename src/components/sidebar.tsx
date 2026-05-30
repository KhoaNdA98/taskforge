'use client';

import { useState, useCallback, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Stack, Text } from '@mantine/core';
import { Spotlight, spotlight } from '@mantine/spotlight';
import { modals } from '@mantine/modals';
import { Search } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { NAV } from '@/lib/strings';

/* ── Pixel art icon engine ─────────────────────────────────────── */
function PixelIcon({ art, color, size = 2 }: { art: string; color: string; size?: number }) {
  const rows   = art.trim().split('\n');
  const width  = Math.max(...rows.map(r => r.length)) * size;
  const height = rows.length * size;
  const shadow = rows.flatMap((row, y) =>
    row.split('').flatMap((ch, x) =>
      ch === 'X' ? [`${x * size}px ${y * size}px 0 ${color}`] : []
    )
  ).join(',');

  return (
    <div style={{ width, height, position: 'relative', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, boxShadow: shadow }} />
    </div>
  );
}

/* ── Icon art definitions (5-wide pixel art) ───────────────────── */
const ART = {
  dashboard: `
XXXXX
X...X
X.X.X
X...X
XXXXX`.trim(),

  tasks: `
.XXX.
XXXXX
X...X
X...X
XXXXX
.XXX.`.trim(),

  clients: `
.XXX.
XXXXX
X...X
XXXXX`.trim(),

  settings: `
..X..
XXXXX
X...X
XXXXX
..X..`.trim(),

  search: `
.XXX.
X...X
X...X
.XXX.
....X
....X`.trim(),
};

/* ── Player avatar pixel sprite (5×8) ──────────────────────────── */
const AVATAR_ART = `
.XXX.
.X.X.
.XXX.
XXXXX
..X..
.XXX.
.X.X.
.X.X.`.trim();

function PlayerAvatar() {
  const headColor  = '#A78BFA';
  const eyeColor   = '#E8E8F0';
  const bodyColor  = '#4ADE80';
  const legsColor  = '#A78BFA';

  const rows = AVATAR_ART.split('\n');
  const size = 2;

  const colorMap: Record<number, string> = {
    0: headColor, 1: eyeColor, 2: headColor,
    3: bodyColor, 4: bodyColor, 5: bodyColor,
    6: legsColor, 7: legsColor,
  };

  const shadow = rows.flatMap((row, y) =>
    row.split('').flatMap((ch, x) =>
      ch === 'X' ? [`${x * size}px ${y * size}px 0 ${colorMap[y] ?? headColor}`] : []
    )
  ).join(',');

  const width  = 5 * size;
  const height = rows.length * size;

  return (
    <div style={{ width, height, position: 'relative', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, boxShadow: shadow }} />
    </div>
  );
}

/* ── Nav item with pixel icon ──────────────────────────────────── */
const NAV_ITEMS = [
  { href: '/dashboard', label: NAV.dashboard, art: ART.dashboard },
  { href: '/tasks',     label: NAV.tasks,     art: ART.tasks     },
  { href: '/clients',   label: NAV.clients,   art: ART.clients   },
  { href: '/settings',  label: NAV.settings,  art: ART.settings  },
] as const;

const SPOTLIGHT_ACTIONS = [
  { id: 'dashboard', label: NAV.dashboard, href: '/dashboard' },
  { id: 'tasks',     label: NAV.tasks,     href: '/tasks' },
  { id: 'clients',   label: NAV.clients,   href: '/clients' },
  { id: 'settings',  label: NAV.settings,  href: '/settings' },
];

function NavItem({ href, label, art, active }: { href: string; label: string; art: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  const color = active ? '#A78BFA' : hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '5px 8px',
        textDecoration: 'none',
        color,
        transition: 'color 0.1s',
        position: 'relative',
      }}
    >
      {/* Active left indicator */}
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 2, background: '#7C3AED',
          boxShadow: '0 0 6px #7C3AED',
        }} />
      )}

      {/* Icon box */}
      <div
        className={active ? 'tf-icon-box tf-icon-active' : 'tf-icon-box'}
        style={{
          border: `1px solid ${active ? '#7C3AED' : hovered ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
          background: active ? 'rgba(124,58,237,0.15)' : hovered ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.3)',
          padding: '5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'border-color 0.1s, background 0.1s',
        }}
      >
        <PixelIcon art={art} color={color} size={2} />
      </div>

      {/* Label */}
      <span style={{
        fontSize: 18, letterSpacing: '0.08em',
        fontFamily: 'inherit', fontWeight: active ? '700' : '400',
      }}>
        {active ? `> ${label.toUpperCase()}` : label.toUpperCase()}
      </span>
    </Link>
  );
}

/* ── Sidebar ───────────────────────────────────────────────────── */
export function Sidebar({ email, level = 1, strength = 0, intellect = 0 }: {
  email: string;
  level?: number;
  strength?: number;
  intellect?: number;
}) {
  const pathname = usePathname();
  const router   = useRouter();
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
        actions={SPOTLIGHT_ACTIONS.map(a => ({ ...a, onClick: () => router.push(a.href) }))}
        shortcut={['mod + K']}
        nothingFound="No pages found…"
        highlightQuery
        searchProps={{ leftSection: <Search size={16} />, placeholder: 'Search pages…' }}
      />

      <Stack
        gap={0}
        style={{
          background: '#050508',
          height: '100dvh',
          position: 'sticky',
          top: 0,
          borderRight: '2px solid rgba(139,92,246,0.15)',
        }}
        w={{ base: '100%', md: 220 }}
        mah="100dvh"
      >
        {/* Brand */}
        <div style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(139,92,246,0.12)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{
              width: 8, height: 8, flexShrink: 0,
              background: '#7C3AED',
              boxShadow: '0 0 8px #7C3AED, 2px 0 0 #A78BFA, 0 2px 0 #A78BFA',
            }} />
            <Text style={{ color: '#A78BFA', fontSize: 22, letterSpacing: '0.12em', textShadow: '0 0 10px rgba(167,139,250,0.5)' }}>
              TASKFORGE
            </Text>
          </div>
          <Text style={{ color: 'rgba(167,139,250,0.35)', fontSize: 14, letterSpacing: '0.1em', paddingLeft: 16 }}>
            {'// RPG EDITION v1.0'}
          </Text>
        </div>

        {/* Nav */}
        <Stack gap={0} px={6} style={{ flex: 1, paddingTop: 10, paddingBottom: 8 }}>
          {NAV_ITEMS.map(({ href, label, art }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return <NavItem key={href} href={href} label={label} art={art} active={active} />;
          })}

          {/* Search */}
          <button
            onClick={spotlight.open}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '5px 8px', marginTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              paddingTop: 12,
              background: 'none', border: 'none', cursor: 'pointer', width: '100%',
              color: 'rgba(255,255,255,0.28)',
            }}
          >
            <div style={{
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.2)',
              padding: '5px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <PixelIcon art={ART.search} color="rgba(255,255,255,0.28)" size={2} />
            </div>
            <span style={{ fontSize: 18, letterSpacing: '0.08em', fontFamily: 'inherit', flex: 1, textAlign: 'left' }}>
              SEARCH
            </span>
            <kbd style={{
              fontSize: 14, fontFamily: 'inherit',
              padding: '1px 5px',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              ⌘K
            </kbd>
          </button>
        </Stack>

        {/* Player profile footer */}
        <div style={{
          borderTop: '1px solid rgba(139,92,246,0.12)',
          padding: '10px 12px',
          flexShrink: 0,
        }}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              border: '1px solid rgba(167,139,250,0.25)',
              background: 'rgba(124,58,237,0.08)',
              padding: '4px 5px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <PlayerAvatar />
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: 15, color: '#A78BFA', letterSpacing: '0.08em', marginBottom: 2 }}>
                LVL.{String(level).padStart(2, '0')} DEVELOPER
              </div>
              <div style={{
                fontSize: 13, color: 'rgba(255,255,255,0.25)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}>
                {email}
              </div>
            </div>
          </div>

          {/* Stat bars */}
          <div style={{ marginBottom: 8 }}>
            {[
              { label: 'STR', value: strength, color: '#F87171' },
              { label: 'INT', value: intellect, color: '#60A5FA' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', width: 26, flexShrink: 0 }}>
                  {label}
                </span>
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${value}%`,
                    background: color,
                    boxShadow: `0 0 4px ${color}88`,
                  }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', width: 28, textAlign: 'right', letterSpacing: '0.02em' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Exit button */}
          <button
            onClick={handleExit}
            style={{
              width: '100%', padding: '5px 8px',
              border: '1px solid rgba(248,113,113,0.25)',
              background: 'transparent',
              color: 'rgba(248,113,113,0.5)',
              fontSize: 16, fontFamily: 'inherit',
              letterSpacing: '0.1em',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.1s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => {
              const t = e.currentTarget;
              t.style.borderColor = '#F87171';
              t.style.color = '#F87171';
              t.style.background = 'rgba(248,113,113,0.07)';
            }}
            onMouseLeave={e => {
              const t = e.currentTarget;
              t.style.borderColor = 'rgba(248,113,113,0.25)';
              t.style.color = 'rgba(248,113,113,0.5)';
              t.style.background = 'transparent';
            }}
          >
            <span>▶</span>
            <span>EXIT GAME</span>
          </button>
        </div>
      </Stack>
    </>
  );
}

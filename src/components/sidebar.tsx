'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Stack, Text } from '@mantine/core';
import { Spotlight, spotlight } from '@mantine/spotlight';
import { LayoutDashboard, ListTodo, Users, Settings, LogOut, Search } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { NAV } from '@/lib/strings';

const LINKS = [
  { href: '/dashboard', label: NAV.dashboard, icon: LayoutDashboard },
  { href: '/tasks',     label: NAV.tasks,     icon: ListTodo },
  { href: '/clients',   label: NAV.clients,   icon: Users },
  { href: '/settings',  label: NAV.settings,  icon: Settings },
] as const;

const SPOTLIGHT_ACTIONS = [
  { id: 'dashboard', label: NAV.dashboard, href: '/dashboard' },
  { id: 'tasks',     label: NAV.tasks,     href: '/tasks' },
  { id: 'clients',   label: NAV.clients,   href: '/clients' },
  { id: 'settings',  label: NAV.settings,  href: '/settings' },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router   = useRouter();

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
          borderRight: '2px solid rgba(139,92,246,0.2)',
        }}
        w={{ base: '100%', md: 220 }}
        mah="100dvh"
      >
        {/* Brand */}
        <div style={{
          padding: '14px 16px 12px',
          borderBottom: '2px solid rgba(139,92,246,0.15)',
          flexShrink: 0,
        }}>
          <Text style={{
            color: '#A78BFA',
            fontSize: 20,
            fontFamily: 'inherit',
            letterSpacing: '0.1em',
            lineHeight: 1.2,
            textShadow: '0 0 12px rgba(167,139,250,0.5)',
          }}>
            TASKFORGE
          </Text>
          <Text style={{ color: 'rgba(167,139,250,0.45)', fontSize: 13, letterSpacing: '0.08em' }}>
            {'// BILLING SYSTEM'}
          </Text>
        </div>

        {/* Nav links */}
        <Stack gap={0} px={6} style={{ flex: 1, paddingTop: 8 }}>
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`tf-nav-link${active ? ' tf-nav-link--active' : ''}`}
              >
                <span style={{ color: active ? '#A78BFA' : 'rgba(255,255,255,0.2)', fontSize: 14, width: 14, textAlign: 'center', flexShrink: 0 }}>
                  {active ? '▶' : '·'}
                </span>
                <Icon size={13} strokeWidth={1.5} />
                <span>{label.toUpperCase()}</span>
              </Link>
            );
          })}

          <button
            className="tf-nav-link"
            style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}
            onClick={spotlight.open}
          >
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, width: 14, textAlign: 'center', flexShrink: 0 }}>·</span>
            <Search size={13} strokeWidth={1.5} />
            <span style={{ flex: 1 }}>SEARCH</span>
            <kbd className="tf-kbd">⌘K</kbd>
          </button>
        </Stack>

        {/* Footer */}
        <div style={{ borderTop: '2px solid rgba(139,92,246,0.1)', padding: '8px 6px', flexShrink: 0 }}>
          <div style={{ padding: '2px 10px 6px', fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </div>
          <form action={signOut}>
            <button type="submit" className="tf-nav-link tf-nav-signout">
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14, width: 14, textAlign: 'center', flexShrink: 0 }}>·</span>
              <LogOut size={13} strokeWidth={1.5} />
              <span>{NAV.signOut.toUpperCase()}</span>
            </button>
          </form>
        </div>
      </Stack>
    </>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { NavLink, Stack, Text, Group, UnstyledButton, rem } from '@mantine/core';
import { Spotlight, spotlight } from '@mantine/spotlight';
import {
  LayoutDashboard, ListTodo, Users, Settings, Hexagon, LogOut, Search,
} from 'lucide-react';
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
        actions={SPOTLIGHT_ACTIONS.map(a => ({
          ...a,
          onClick: () => router.push(a.href),
        }))}
        shortcut={['mod + K']}
        nothingFound="No pages found…"
        highlightQuery
        searchProps={{ leftSection: <Search size={16} />, placeholder: 'Go to page…' }}
      />

      <Stack
        gap={0}
        style={{
          borderRight: '1px solid var(--mantine-color-gray-2)',
          background: 'white',
          height: '100dvh',
          position: 'sticky',
          top: 0,
        }}
        w={{ base: '100%', md: 220 }}
        mah="100dvh"
      >
        {/* Brand */}
        <Group gap="xs" px="md" py="md">
          <UnstyledButton
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: rem(32),
              height: rem(32),
              borderRadius: rem(10),
              background: 'var(--mantine-color-indigo-0)',
              border: '1px solid var(--mantine-color-indigo-2)',
              color: 'var(--mantine-color-indigo-6)',
              flexShrink: 0,
            }}
          >
            <Hexagon size={17} />
          </UnstyledButton>
          <Text fw={600} size="sm" style={{ letterSpacing: '-0.02em' }}>
            TaskForge
          </Text>
        </Group>

        {/* Nav */}
        <Stack gap={2} px="xs" style={{ flex: 1 }}>
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <NavLink
                key={href}
                component={Link}
                href={href}
                label={label}
                leftSection={<Icon size={16} />}
                active={active}
                variant="light"
                style={{ borderRadius: 'var(--mantine-radius-md)' }}
              />
            );
          })}

          {/* ⌘K hint */}
          <NavLink
            label="Search pages…"
            leftSection={<Search size={16} />}
            rightSection={
              <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>⌘K</Text>
            }
            onClick={spotlight.open}
            variant="subtle"
            style={{ borderRadius: 'var(--mantine-radius-md)', marginTop: 'auto' }}
          />
        </Stack>

        {/* User + sign out */}
        <Stack gap={4} px="xs" py="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Text size="xs" c="dimmed" px="sm" truncate>{email}</Text>
          <form action={signOut}>
            <NavLink
              component="button"
              type="submit"
              label={NAV.signOut}
              leftSection={<LogOut size={16} />}
              variant="subtle"
              c="red"
              style={{ borderRadius: 'var(--mantine-radius-md)', width: '100%' }}
            />
          </form>
        </Stack>
      </Stack>
    </>
  );
}

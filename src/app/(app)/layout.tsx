import { AppShell } from '@mantine/core';
import { requireUser } from '@/lib/dal';
import { Sidebar } from '@/components/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell
      navbar={{ width: 220, breakpoint: 'sm' }}
      padding="lg"
      style={{ background: 'var(--mantine-color-gray-0)' }}
    >
      <AppShell.Navbar>
        <Sidebar email={user.email ?? ''} />
      </AppShell.Navbar>
      <AppShell.Main>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
}

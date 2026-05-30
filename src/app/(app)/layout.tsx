import { AppShell, AppShellNavbar, AppShellMain } from '@mantine/core';
import { requireUser } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user    = await requireUser();
  const supabase = await createClient();

  const { data: taskStats } = await supabase
    .from('tasks')
    .select('status, type');

  const total     = taskStats?.length ?? 0;
  const done      = taskStats?.filter(t => t.status === 'done').length ?? 0;
  const onDemand  = taskStats?.filter(t => t.type === 'on_demand').length ?? 0;
  const level     = Math.max(1, Math.floor(done / 5) + 1);
  const strength  = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
  const intellect = total === 0 ? 0 : Math.min(100, Math.round((onDemand / total) * 100));

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding="lg"
      style={{ background: '#0D1117' }}
    >
      <AppShellNavbar style={{ background: '#010409', borderRight: 'none', padding: 0 }}>
        <Sidebar
          email={user.email ?? ''}
          level={level}
          strength={strength}
          intellect={intellect}
        />
      </AppShellNavbar>
      <AppShellMain style={{ background: '#0D1117' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {children}
        </div>
      </AppShellMain>
    </AppShell>
  );
}

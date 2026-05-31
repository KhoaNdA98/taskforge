import { requireUser } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { BottomHotbar } from '@/components/bottom-hotbar';
import { PlayerStatsBar } from '@/components/player-stats-bar';
import { ModalProvider } from '@/components/ui/modal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user     = await requireUser();
  const supabase = await createClient();

  const { data: taskStats } = await supabase.from('tasks').select('status, type, amount');

  const total    = taskStats?.length ?? 0;
  const done     = taskStats?.filter(t => t.status === 'done').length ?? 0;
  const onDemand = taskStats?.filter(t => t.type === 'on_demand').length ?? 0;
  const level    = Math.max(1, Math.floor(done / 5) + 1);
  const strength = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
  const intellect = total === 0 ? 0 : Math.min(100, Math.round((onDemand / total) * 100));

  const { data: settings } = await supabase.from('settings').select('currency').maybeSingle();
  const currency = settings?.currency ?? 'VND';

  const totalRevenue = taskStats
    ?.filter(t => t.type === 'on_demand' && typeof t.amount === 'number')
    .reduce((s, t) => s + (t.amount as number), 0) ?? 0;

  return (
    <ModalProvider>
      <div
        id="app-shell"
        className="crt-screen"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a1a' }}
      >
        <PlayerStatsBar
          email={user.email ?? ''}
          level={level}
          strength={strength}
          intellect={intellect}
          totalRevenue={totalRevenue}
          currency={currency}
        />
        <main style={{ flex: 1, width: '100%', padding: '24px 16px 140px' }}>
          {children}
        </main>
        <BottomHotbar />
      </div>
    </ModalProvider>
  );
}

import { requireUser } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { BottomHotbar } from '@/components/bottom-hotbar';
import { PlayerStatsBar } from '@/components/player-stats-bar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user     = await requireUser();
  const supabase = await createClient();

  // Fetch task stats for player HP/level
  const { data: taskStats } = await supabase
    .from('tasks')
    .select('status, type, amount');

  const total    = taskStats?.length ?? 0;
  const done     = taskStats?.filter(t => t.status === 'done').length ?? 0;
  const onDemand = taskStats?.filter(t => t.type === 'on_demand').length ?? 0;
  const level    = Math.max(1, Math.floor(done / 5) + 1);
  const strength = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
  const intellect = total === 0 ? 0 : Math.min(100, Math.round((onDemand / total) * 100));

  // Fetch settings for currency
  const { data: settings } = await supabase
    .from('settings')
    .select('currency')
    .maybeSingle();
  const currency = settings?.currency ?? 'VND';

  // Total revenue (sum of on-demand task amounts)
  const totalRevenue = taskStats
    ?.filter(t => t.type === 'on_demand' && typeof t.amount === 'number')
    .reduce((sum, t) => sum + (t.amount as number), 0) ?? 0;

  return (
    <div
      id="app-shell"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#08080E',
      }}
    >
      {/* Sticky top stats bar */}
      <PlayerStatsBar
        email={user.email ?? ''}
        level={level}
        strength={strength}
        intellect={intellect}
        totalRevenue={totalRevenue}
        currency={currency}
      />

      {/* Full-width main content — paddingBottom leaves room for hotbar */}
      <main
        style={{
          flex: 1,
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          padding: '24px 24px 120px',
        }}
      >
        {children}
      </main>

      {/* Fixed bottom MMORPG hotbar */}
      <BottomHotbar />
    </div>
  );
}

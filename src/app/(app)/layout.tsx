import { requireUser } from '@/lib/dal';
import { createClient } from '@/lib/supabase/server';
import { BottomHotbar } from '@/components/bottom-hotbar';
import { PlayerStatsBar } from '@/components/player-stats-bar';
import { ModalProvider } from '@/components/ui/modal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user     = await requireUser();
  const supabase = await createClient();

  const { data: taskStats } = await supabase
    .from('tasks').select('status, type, amount');

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
      <div className="min-h-dvh flex flex-col bg-px-bg">
        <PlayerStatsBar
          email={user.email ?? ''}
          level={level}
          strength={strength}
          intellect={intellect}
          totalRevenue={totalRevenue}
          currency={currency}
        />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 pt-6 pb-32">
          {children}
        </main>
        <BottomHotbar />
      </div>
    </ModalProvider>
  );
}

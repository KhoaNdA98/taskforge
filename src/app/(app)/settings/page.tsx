import { getSettings } from '@/lib/dal';
import { SETTINGS } from '@/lib/strings';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-5">
      <div>
        <div className="px-section-title">{SETTINGS.title}</div>
        <div className="font-pixel text-[14px] text-white/30 tracking-[0.06em] mt-0.5">{SETTINGS.subtitle}</div>
      </div>
      <div className="bg-px-card border-2 border-px-border p-6 max-w-sm shadow-hard">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}

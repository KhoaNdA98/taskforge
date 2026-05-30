'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { updateSettings } from './actions';
import { SETTINGS } from '@/lib/strings';
import type { Settings } from '@/lib/types';

export function SettingsForm({ settings }: { settings: Settings }) {
  const [pending, setPending] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true); setSaved(false);
    const fd = new FormData(e.currentTarget);
    const res = await updateSettings({}, fd);
    setPending(false);
    if (res?.error) { toast.error(res.error); }
    else { setSaved(true); toast.success(SETTINGS.saved); }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm flex flex-col gap-1">
      <div className="px-field">
        <label className="px-label" htmlFor="s-rate">{SETTINGS.fields.rate}</label>
        <input id="s-rate" name="hourly_rate" type="number" min={0} step={1000}
               defaultValue={settings.hourly_rate ?? 0} className="px-input" />
        <span className="font-pixel text-[12px] text-white/25">{SETTINGS.fields.rateHint}</span>
      </div>

      <div className="px-field">
        <label className="px-label" htmlFor="s-currency">{SETTINGS.fields.currency}</label>
        <select id="s-currency" name="currency" defaultValue={settings.currency} className="px-input">
          <option value="VND">{SETTINGS.currencies.VND}</option>
          <option value="USD">{SETTINGS.currencies.USD}</option>
        </select>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <button type="submit" disabled={pending} className="px-btn px-btn-primary">
          {pending ? 'SAVING...' : SETTINGS.save.toUpperCase()}
        </button>
        {saved && (
          <span className="font-pixel text-[15px] text-px-green tracking-[0.06em]">
            ✓ {SETTINGS.saved}
          </span>
        )}
      </div>
    </form>
  );
}

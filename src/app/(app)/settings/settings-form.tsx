'use client';

import { useState } from 'react';
import { useForm } from '@mantine/form';
import { NumberInput, Select, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Check } from 'lucide-react';
import { updateSettings } from './actions';
import { SETTINGS } from '@/lib/strings';
import type { Settings } from '@/lib/types';

export function SettingsForm({ settings }: { settings: Settings }) {
  const [pending, setPending] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const form = useForm({
    initialValues: {
      hourly_rate: settings.hourly_rate != null ? Number(settings.hourly_rate) : 0,
      currency:    settings.currency,
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setPending(true);
    setSaved(false);
    const fd = new FormData();
    fd.set('hourly_rate', String(values.hourly_rate));
    fd.set('currency',    values.currency);

    const res = await updateSettings({}, fd);
    setPending(false);
    if (res?.error) {
      notifications.show({ color: 'red', message: res.error });
    } else {
      setSaved(true);
      notifications.show({ message: SETTINGS.saved });
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <NumberInput
        label={SETTINGS.fields.rate}
        description={SETTINGS.fields.rateHint}
        min={0}
        step={1000}
        mb="md"
        {...form.getInputProps('hourly_rate')}
      />
      <Select
        label={SETTINGS.fields.currency}
        mb="xl"
        data={[
          { value: 'VND', label: SETTINGS.currencies.VND },
          { value: 'USD', label: SETTINGS.currencies.USD },
        ]}
        {...form.getInputProps('currency')}
      />
      <Group>
        <Button type="submit" loading={pending}>{SETTINGS.save}</Button>
        {saved && (
          <Group gap={4}>
            <Check size={14} color="var(--mantine-color-teal-6)" />
            <Text size="sm" c="teal">{SETTINGS.saved}</Text>
          </Group>
        )}
      </Group>
    </form>
  );
}

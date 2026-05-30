import { Stack, Title, Text } from '@mantine/core';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/dal';
import { CLIENT } from '@/lib/strings';
import { ClientsView } from './clients-view';
import type { Client } from '@/lib/types';

export default async function ClientsPage() {
  const settings = await getSettings();
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} style={{ letterSpacing: '-0.02em' }}>{CLIENT.title}</Title>
        <Text size="sm" c="dimmed">{CLIENT.subtitle}</Text>
      </div>
      <ClientsView clients={(data ?? []) as Client[]} currency={settings.currency} />
    </Stack>
  );
}

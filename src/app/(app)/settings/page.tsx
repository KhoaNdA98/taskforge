import { Stack, Title, Text, Card } from '@mantine/core';
import { getSettings } from '@/lib/dal';
import { SETTINGS } from '@/lib/strings';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <Stack gap="lg">
      <div>
        <Title order={2} style={{ letterSpacing: '-0.02em' }}>{SETTINGS.title}</Title>
        <Text size="sm" c="dimmed">{SETTINGS.subtitle}</Text>
      </div>
      <Card maw={480}>
        <SettingsForm settings={settings} />
      </Card>
    </Stack>
  );
}

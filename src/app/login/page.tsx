import { Center, Paper, Stack, ThemeIcon, Title, Text } from '@mantine/core';
import { Hexagon } from 'lucide-react';
import { LoginForm } from './login-form';
import { AUTH } from '@/lib/strings';

export default function LoginPage() {
  return (
    <Center mih="100dvh" bg="gray.0">
      <Stack w="100%" maw={420} px="md">
        <Stack align="center" gap="xs" mb="md">
          <ThemeIcon size={48} radius="xl" variant="light" color="indigo">
            <Hexagon size={24} />
          </ThemeIcon>
          <Title order={1} size="h2" style={{ letterSpacing: '-0.03em' }}>
            TaskForge
          </Title>
          <Text size="sm" c="dimmed">{AUTH.tagline}</Text>
        </Stack>

        <Paper shadow="xs" radius="lg" p="xl" withBorder>
          <LoginForm />
        </Paper>
      </Stack>
    </Center>
  );
}

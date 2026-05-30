import { Center, Paper, Stack, Text } from '@mantine/core';
import { LoginForm } from './login-form';
import { AUTH } from '@/lib/strings';

export default function LoginPage() {
  return (
    <Center mih="100dvh" style={{ background: '#0D1117' }}>
      <Stack w="100%" maw={380} px="md">
        <Stack gap={4} mb="lg">
          <Text style={{ color: 'rgba(99,102,241,0.8)', fontSize: 11, letterSpacing: '0.12em' }}>
            {'// TASKFORGE v1.0'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em' }}>
            SIGN IN
          </Text>
          <Text size="xs" c="dimmed">{AUTH.tagline}</Text>
        </Stack>

        <Paper p="xl" withBorder>
          <LoginForm />
        </Paper>
      </Stack>
    </Center>
  );
}

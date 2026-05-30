'use client';

import Link from 'next/link';
import {
  Card, Text, Group, Stack, Badge, RingProgress,
  ThemeIcon, List, Anchor,
} from '@mantine/core';
import {
  TrendingUp, TrendingDown, Minus, Timer, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { formatMoney } from '@/lib/format';

/* ── Completion widget ───────────────────────────────────────────────── */
export function CompletionWidget({
  todo, doing, done,
}: {
  todo: number; doing: number; done: number;
}) {
  const total   = todo + doing + done;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);

  const sections = [
    { value: total === 0 ? 0 : (done  / total) * 100, color: 'teal'   },
    { value: total === 0 ? 0 : (doing / total) * 100, color: 'yellow' },
    { value: total === 0 ? 0 : (todo  / total) * 100, color: 'gray'   },
  ];

  return (
    <Card h="100%">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" fw={500}>Completion</Text>
        <ThemeIcon variant="light" color="teal" size="sm" radius="xl">
          <CheckCircle2 size={13} />
        </ThemeIcon>
      </Group>

      <Group gap="md" align="center">
        <RingProgress
          size={72}
          thickness={7}
          roundCaps
          sections={sections}
          label={
            <Text ta="center" fw={700} size="sm">{donePct}%</Text>
          }
        />
        <Stack gap={4}>
          <Group gap="xs">
            <Badge color="teal" variant="dot" size="sm">Done</Badge>
            <Text size="xs" c="dimmed">{done}</Text>
          </Group>
          <Group gap="xs">
            <Badge color="yellow" variant="dot" size="sm">In progress</Badge>
            <Text size="xs" c="dimmed">{doing}</Text>
          </Group>
          <Group gap="xs">
            <Badge color="gray" variant="dot" size="sm">To do</Badge>
            <Text size="xs" c="dimmed">{todo}</Text>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

/* ── Delta widget ────────────────────────────────────────────────────── */
export function DeltaWidget({
  current, previous, currency,
}: {
  current: number; previous: number; currency: string;
}) {
  const delta     = current - previous;
  const pctChange = previous === 0
    ? (current > 0 ? 100 : 0)
    : Math.round((delta / previous) * 100);
  const up   = delta > 0;
  const flat = delta === 0;

  const Icon  = flat ? Minus : up ? TrendingUp : TrendingDown;
  const color = flat ? 'gray' : up ? 'teal' : 'red';

  return (
    <Card h="100%">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" fw={500}>vs last month</Text>
        <ThemeIcon variant="light" color={color} size="sm" radius="xl">
          <Icon size={13} />
        </ThemeIcon>
      </Group>

      <Text fw={700} size="xl" style={{ letterSpacing: '-0.02em' }}>
        {formatMoney(current, currency)}
      </Text>

      <Group gap="xs" mt={4}>
        <Badge color={color} variant="light" size="sm">
          {up ? '+' : ''}{pctChange}%
        </Badge>
        <Text size="xs" c="dimmed">last: {formatMoney(previous, currency)}</Text>
      </Group>
    </Card>
  );
}

/* ── Unbilled widget ─────────────────────────────────────────────────── */
export function UnbilledWidget({
  tasks, month,
}: {
  tasks: { id: string; name: string }[];
  month: string;
}) {
  const count = tasks.length;

  return (
    <Card h="100%">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" fw={500}>Needs hours</Text>
        <ThemeIcon variant="light" color={count > 0 ? 'yellow' : 'teal'} size="sm" radius="xl">
          <Timer size={13} />
        </ThemeIcon>
      </Group>

      <Group gap="xs" align="baseline" mb="xs">
        <Text fw={700} size="xl">{count}</Text>
        <Text size="xs" c="dimmed">on-demand task{count !== 1 ? 's' : ''} at 0h</Text>
      </Group>

      {count === 0 ? (
        <Text size="xs" c="dimmed">All on-demand tasks have hours logged.</Text>
      ) : (
        <>
          <List size="xs" c="dimmed" mb="xs">
            {tasks.slice(0, 3).map(t => (
              <List.Item key={t.id}>{t.name}</List.Item>
            ))}
            {count > 3 && <List.Item>+{count - 3} more…</List.Item>}
          </List>
          <Anchor
            component={Link}
            href={`/tasks?month=${month}&type=on_demand&view=table`}
            size="xs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Log hours <ArrowRight size={12} />
          </Anchor>
        </>
      )}
    </Card>
  );
}

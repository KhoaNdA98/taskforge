'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  SimpleGrid, Card, Text, Group, Badge, Button, ActionIcon,
  TextInput, Textarea, NumberInput, Checkbox, Stack, Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { CLIENT } from '@/lib/strings';
import type { Client } from '@/lib/types';
import { saveClient, deleteClient } from './actions';

export function ClientsView({ clients, currency }: { clients: Client[]; currency: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function openAdd() {
    modals.open({
      title: CLIENT.addClient,
      children: <ClientForm client={null} onDone={() => { modals.closeAll(); router.refresh(); }} />,
      size: 'sm',
    });
  }

  function openEdit(c: Client) {
    modals.open({
      title: CLIENT.editClient,
      children: <ClientForm client={c} onDone={() => { modals.closeAll(); router.refresh(); }} />,
      size: 'sm',
    });
  }

  function onDelete(c: Client) {
    modals.openConfirmModal({
      title: CLIENT.deleteConfirm(c.name),
      children: <Text size="sm" c="dimmed">Tasks assigned to this client will be unlinked.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        startTransition(async () => {
          await deleteClient(c.id);
          notifications.show({ message: `Client "${c.name}" deleted.` });
          router.refresh();
        });
      },
    });
  }

  return (
    <>
      <Group justify="flex-end" mb="md">
        <Button leftSection={<Plus size={16} />} onClick={openAdd}>
          {CLIENT.addClient}
        </Button>
      </Group>

      {clients.length === 0 ? (
        <Card>
          <Stack align="center" py="xl" gap="sm">
            <Users size={32} color="var(--mantine-color-dimmed)" />
            <Title order={5} c="dimmed">{CLIENT.empty.title}</Title>
            <Text size="sm" c="dimmed" ta="center">{CLIENT.empty.description}</Text>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {clients.map(c => (
            <Card key={c.id}>
              <Group justify="space-between" align="flex-start" mb="xs">
                <Text fw={500}>{c.name}</Text>
                <Group gap={4}>
                  <ActionIcon variant="subtle" color="gray" onClick={() => openEdit(c)} aria-label="Edit">
                    <Pencil size={14} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => onDelete(c)} aria-label="Delete">
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
              </Group>

              <Group gap="xs" mb="sm">
                {c.is_maintain_active ? (
                  <Badge color="indigo" variant="light">{CLIENT.maintainActive}</Badge>
                ) : (
                  <Badge color="gray" variant="light">{CLIENT.noRetainer}</Badge>
                )}
              </Group>

              <Text size="sm" ff="monospace">
                <Text span c="dimmed">{CLIENT.retainerLabel} </Text>
                {formatMoney(c.monthly_retainer, currency)}
                <Text span c="dimmed">{CLIENT.perMonth}</Text>
              </Text>

              {c.note && <Text size="xs" c="dimmed" lineClamp={2} mt="xs">{c.note}</Text>}
            </Card>
          ))}
        </SimpleGrid>
      )}
    </>
  );
}

function ClientForm({ client, onDone }: { client: Client | null; onDone: () => void }) {
  const [pending, setPending] = useState(false);

  const form = useForm({
    initialValues: {
      name:               client?.name ?? '',
      monthly_retainer:   client?.monthly_retainer != null ? Number(client.monthly_retainer) : 0,
      is_maintain_active: client?.is_maintain_active ?? false,
      note:               client?.note ?? '',
    },
    validate: {
      name: (v) => (v.trim() ? null : CLIENT.fields.name + ' is required'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setPending(true);
    const fd = new FormData();
    if (client) fd.set('id', client.id);
    fd.set('name',               values.name.trim());
    fd.set('monthly_retainer',   String(values.monthly_retainer));
    fd.set('is_maintain_active', values.is_maintain_active ? 'on' : '');
    fd.set('note',               values.note);

    const res = await saveClient({}, fd);
    setPending(false);
    if (res?.error) {
      notifications.show({ color: 'red', message: res.error });
    } else {
      notifications.show({ message: client ? 'Client updated.' : 'Client added.' });
      onDone();
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label={CLIENT.fields.name}
        required
        autoFocus
        mb="sm"
        {...form.getInputProps('name')}
      />
      <NumberInput
        label={CLIENT.fields.retainer}
        description={CLIENT.fields.retainerHint}
        min={0}
        step={1000}
        mb="sm"
        {...form.getInputProps('monthly_retainer')}
      />
      <Checkbox
        label={
          <div>
            <Text size="sm">{CLIENT.fields.maintainActive}</Text>
            <Text size="xs" c="dimmed">{CLIENT.fields.maintainActiveHint}</Text>
          </div>
        }
        mb="sm"
        {...form.getInputProps('is_maintain_active', { type: 'checkbox' })}
      />
      <Textarea
        label={CLIENT.fields.note}
        mb="md"
        autosize
        minRows={2}
        {...form.getInputProps('note')}
      />
      <Group justify="flex-end">
        <Button type="submit" loading={pending}>{CLIENT.save}</Button>
      </Group>
    </form>
  );
}

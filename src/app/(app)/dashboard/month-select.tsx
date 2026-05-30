'use client';

import { useRouter, usePathname } from 'next/navigation';
import { MonthPickerInput } from '@mantine/dates';
import dayjs from 'dayjs';

export function MonthSelect({ month }: { month: string }) {
  const router   = useRouter();
  const pathname = usePathname();

  const value = month ? dayjs(month + '-01').toDate() : null;

  return (
    <MonthPickerInput
      value={value}
      onChange={(d) => {
        if (d) router.push(`${pathname}?month=${dayjs(d).format('YYYY-MM')}`);
      }}
      valueFormat="MMMM YYYY"
      w={160}
      size="sm"
    />
  );
}

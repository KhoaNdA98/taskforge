'use client';

import { useRouter, usePathname } from 'next/navigation';

export function MonthSelect({ month }: { month: string }) {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <input
      type="month"
      value={month}
      onChange={e => { if (e.target.value) router.push(`${pathname}?month=${e.target.value}`); }}
      className="px-input w-40"
      aria-label="Select month"
    />
  );
}

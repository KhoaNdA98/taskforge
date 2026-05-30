"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui";

export function MonthSelect({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Input
      type="month"
      value={month}
      onChange={(e) =>
        router.push(`${pathname}?month=${e.target.value}`)
      }
      className="h-9 w-[150px]"
    />
  );
}

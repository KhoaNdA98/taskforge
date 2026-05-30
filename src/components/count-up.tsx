"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney, formatHours, formatNumber } from "@/lib/format";

type Mode = "money" | "hours" | "number";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number, duration = 750) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(target * easeOutCubic(progress));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      else setValue(target);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

export function CountUpMoney({
  amount,
  currency,
  className,
}: {
  amount: number;
  currency: string;
  className?: string;
}) {
  const v = useCountUp(amount);
  return (
    <span className={className}>{formatMoney(Math.round(v), currency)}</span>
  );
}

export function CountUpHours({ hours, className }: { hours: number; className?: string }) {
  const v = useCountUp(hours, 600);
  return <span className={className}>{formatHours(Math.round(v * 4) / 4)}</span>;
}

export function CountUpNumber({ value, className }: { value: number; className?: string }) {
  const v = useCountUp(value, 500);
  return <span className={className}>{formatNumber(Math.round(v))}</span>;
}

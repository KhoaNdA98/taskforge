/** Formatting helpers — VND is the primary currency. */

const CURRENCY_LOCALE: Record<string, string> = {
  VND: "vi-VN",
  USD: "en-US",
};

export function formatMoney(amount: number, currency = "VND"): string {
  const locale = CURRENCY_LOCALE[currency] ?? "vi-VN";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(amount || 0);
  } catch {
    return `${formatNumber(amount)} ${currency}`;
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
    n || 0,
  );
}

export function formatHours(h: number | null | undefined): string {
  if (h == null) return "—";
  return `${formatNumber(h)}h`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** YYYY-MM-DD in local time (for <input type="date"> and date columns). */
export function toDateInput(value: string | Date = new Date()): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/** First and last day (YYYY-MM-DD) of the month containing `ym` (YYYY-MM). */
export function monthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { start: toDateInput(start), end: toDateInput(end) };
}

export function currentMonth(): string {
  return toDateInput().slice(0, 7);
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `Tháng ${m}/${y}`;
}

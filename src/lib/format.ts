const nf = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/** 3519025.4 -> "3.519.025" */
export function vnd(value: number): string {
  return nf.format(Math.round(value));
}

export function kwh(value: number): string {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
}

/** "2026-10-01" -> "Tháng 10/2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

/** "2026-10-01" -> "T10/2026" (payment memo) */
export function monthShort(month: string): string {
  const [y, m] = month.split("-");
  return `T${Number(m)}/${y}`;
}

/** "2026-11-07" -> "07/11" */
export function dayMonth(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

/** "2026-11-07" -> "07/11/2026" */
export function fullDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** Today's date in Vietnam, YYYY-MM-DD. */
export function todayVN(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

/** Parse "1.460.000", "1460000", "1,460,000" -> 1460000. Empty -> null. */
export function parseMoney(input: FormDataEntryValue | string | null | undefined): number | null {
  if (input == null) return null;
  const digits = String(input).replace(/[^\d]/g, "");
  return digits === "" ? null : Number(digits);
}

/** Parse a meter reading; accepts "4.903" or "4903" or "4903,5". */
export function parseReading(input: FormDataEntryValue | string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).trim();
  if (s === "") return null;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// lib/format.ts
// Small presentation helpers. The backend returns Postgres aggregates as
// strings (COUNT/AVG → text) and unrounded floats; these keep the UI clean.

/** Coerce unknown (string | number | null) to a finite number, or null. */
export function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/** Integer with thousands separators. `—` when not a number. */
export function fmtInt(v: unknown): string {
  const n = toNum(v);
  if (n == null) return "—";
  return Math.round(n).toLocaleString();
}

/** Compact form for big counts: 1.2k, 3.4M. Falls back to fmtInt under 1000. */
export function fmtCompact(v: unknown): string {
  const n = toNum(v);
  if (n == null) return "—";
  if (Math.abs(n) < 1000) return String(Math.round(n));
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Percentage, rounded to `digits` (default 0). Accepts already-percentage values (0–100). */
export function fmtPercent(v: unknown, digits = 0): string {
  const n = toNum(v);
  if (n == null) return "—";
  return `${n.toFixed(digits)}%`;
}

/** Turn a 0–1 ratio into a percentage string. */
export function fmtRatioPercent(v: unknown, digits = 0): string {
  const n = toNum(v);
  if (n == null) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

/** Seconds → human duration: 0s, 47s, 3m 7s, 1h 4m. */
export function fmtDuration(v: unknown): string {
  const n = toNum(v);
  if (n == null) return "—";
  const total = Math.round(n);
  if (total < 60) return `${total}s`;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Milliseconds → "840ms" or "1.4s". */
export function fmtMs(v: unknown): string {
  const n = toNum(v);
  if (n == null) return "—";
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(n < 10000 ? 2 : 1)}s`;
}

/** Format an hour-of-day (0–23) as a 12h label: "9 AM", "12 PM", "11 PM". */
export function fmtHour(v: unknown): string {
  const n = toNum(v);
  if (n == null) return "—";
  const h = ((Math.round(n) % 24) + 24) % 24;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

/** Humanize a snake/kebab token: "book_appointment" → "Book appointment". */
export function humanize(v: unknown): string {
  if (typeof v !== "string" || !v.trim()) return "—";
  const s = v.trim().replace(/[_-]+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

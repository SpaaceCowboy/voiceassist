// components/ui/charts.tsx
// Dependency-free data-viz primitives built on SVG/CSS and the app's theme
// tokens (--surface, --border, --muted, --accent). No charting library, so
// `next build` stays safe and everything respects light/dark automatically.
"use client";

import * as React from "react";

/** Categorical palette (RGB triples) — reads well on light and dark surfaces. */
export const SERIES_COLORS = [
  "139 92 246", // violet (accent)
  "56 189 248", // sky
  "16 185 129", // emerald
  "251 191 36", // amber
  "244 63 94", // rose
  "168 85 247", // purple
  "20 184 166", // teal
  "249 115 22", // orange
] as const;

export function seriesColor(i: number): string {
  return SERIES_COLORS[i % SERIES_COLORS.length];
}

/* ------------------------------------------------------------------ */
/* Card shell for a chart/section                                      */
/* ------------------------------------------------------------------ */

export function ChartCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        background: "rgb(var(--surface))",
        borderColor: "rgb(var(--border))",
      }}
    >
      {(title || right) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && <div className="font-semibold">{title}</div>}
            {subtitle && (
              <div className="text-xs mt-0.5" style={{ color: "rgb(var(--muted))" }}>
                {subtitle}
              </div>
            )}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card — icon chip, big value, label, optional delta             */
/* ------------------------------------------------------------------ */

export function KpiCard({
  label,
  value,
  sub,
  icon,
  color = SERIES_COLORS[0],
  loading = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  /** RGB triple, e.g. "139 92 246" */
  color?: string;
  loading?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: "rgb(var(--surface))",
        borderColor: "rgb(var(--border))",
      }}
    >
      {/* accent wash in the corner */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
        style={{ background: `rgb(${color} / 0.18)` }}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
          {label}
        </div>
        {icon && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: `rgb(${color} / 0.14)`, color: `rgb(${color})` }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {loading ? <span className="opacity-40">…</span> : value}
      </div>
      {sub && (
        <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BarList — ranked horizontal bars (intents, tool usage, …)          */
/* ------------------------------------------------------------------ */

export type BarItem = { label: string; value: number; hint?: string };

export function BarList({
  items,
  colorful = false,
  valueFormat,
  emptyText = "No data yet.",
}: {
  items: BarItem[];
  /** Use the categorical palette per row instead of a single accent. */
  colorful?: boolean;
  valueFormat?: (v: number) => string;
  emptyText?: string;
}) {
  if (!items.length) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
        {emptyText}
      </div>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  const fmt = valueFormat ?? ((v: number) => v.toLocaleString());

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const pct = Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0);
        const color = colorful ? seriesColor(i) : SERIES_COLORS[0];
        return (
          <div key={`${item.label}-${i}`} className="group">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-medium" title={item.label}>
                {item.label}
              </span>
              <span className="shrink-0 tabular-nums" style={{ color: "rgb(var(--muted))" }}>
                {item.hint ?? fmt(item.value)}
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgb(var(--surface2))" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, rgb(${color} / 0.75), rgb(${color}))`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HourBars — 24-hour vertical bar chart                              */
/* ------------------------------------------------------------------ */

export function HourBars({
  data,
  valueFormat,
}: {
  /** Sparse list of {hour 0-23, value}; missing hours render as empty. */
  data: { hour: number; value: number }[];
  valueFormat?: (v: number) => string;
}) {
  const byHour = new Map<number, number>();
  for (const d of data) byHour.set(d.hour, (byHour.get(d.hour) ?? 0) + d.value);
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, value: byHour.get(h) ?? 0 }));
  const max = Math.max(...hours.map((h) => h.value), 1);
  const peak = hours.reduce((a, b) => (b.value > a.value ? b : a), hours[0]);
  const fmt = valueFormat ?? ((v: number) => v.toLocaleString());
  const ticks = [0, 6, 12, 18, 23];

  const total = hours.reduce((s, h) => s + h.value, 0);
  if (total === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
        No calls recorded in this window.
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]">
        {hours.map((h) => {
          const pct = (h.value / max) * 100;
          const isPeak = h.value === peak.value && h.value > 0;
          const color = isPeak ? SERIES_COLORS[0] : "148 163 184";
          return (
            <div
              key={h.hour}
              className="group relative flex flex-1 items-end"
              style={{ height: "100%" }}
              title={`${label12(h.hour)} · ${fmt(h.value)}`}
            >
              <div
                className="w-full rounded-t-md transition-[height] duration-700 ease-out"
                style={{
                  height: `${Math.max(pct, h.value > 0 ? 4 : 1.5)}%`,
                  background:
                    h.value > 0
                      ? `linear-gradient(180deg, rgb(${color}), rgb(${color} / 0.55))`
                      : "rgb(var(--surface2))",
                }}
              />
              {/* hover tooltip */}
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background: "rgb(var(--surface))",
                  borderColor: "rgb(var(--border))",
                  color: "rgb(var(--text))",
                }}
              >
                {label12(h.hour)}: {fmt(h.value)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px]" style={{ color: "rgb(var(--muted))" }}>
        {ticks.map((t) => (
          <span key={t}>{label12(t)}</span>
        ))}
      </div>
      <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
        Peak at <span style={{ color: "rgb(var(--text))" }}>{label12(peak.hour)}</span> ·{" "}
        {fmt(peak.value)}
      </div>
    </div>
  );
}

function label12(h: number): string {
  const x = ((h % 24) + 24) % 24;
  if (x === 0) return "12a";
  if (x === 12) return "12p";
  return x < 12 ? `${x}a` : `${x - 12}p`;
}

/* ------------------------------------------------------------------ */
/* Donut — composition breakdown with legend                          */
/* ------------------------------------------------------------------ */

export type DonutSegment = { label: string; value: number; color: string };

export function Donut({
  segments,
  centerLabel,
  size = 148,
  thickness = 16,
}: {
  segments: DonutSegment[];
  centerLabel?: { value: React.ReactNode; caption?: string };
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(var(--surface2))"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((seg, i) => {
              const frac = seg.value / total;
              const dash = frac * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={`rgb(${seg.color})`}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  style={{ transition: "stroke-dasharray 0.7s ease, stroke-dashoffset 0.7s ease" }}
                />
              );
              offset += dash;
              return el;
            })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-semibold tabular-nums">{centerLabel.value}</div>
            {centerLabel.caption && (
              <div className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>
                {centerLabel.caption}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: `rgb(${seg.color})` }}
              />
              <span className="truncate">{seg.label}</span>
              <span className="ml-auto shrink-0 tabular-nums" style={{ color: "rgb(var(--muted))" }}>
                {seg.value.toLocaleString()}
                <span className="ml-1 opacity-70">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatRing — single-value radial gauge (0–100%)                      */
/* ------------------------------------------------------------------ */

export function StatRing({
  percent,
  label,
  caption,
  color = SERIES_COLORS[2],
  size = 132,
  thickness = 14,
}: {
  percent: number; // 0–100
  label?: React.ReactNode;
  caption?: string;
  color?: string;
  size?: number;
  thickness?: number;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--surface2))" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`rgb(${color})`}
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-semibold tabular-nums">{label ?? `${Math.round(p)}%`}</div>
        {caption && (
          <div className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}

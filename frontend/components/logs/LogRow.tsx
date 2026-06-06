"use client";

import * as React from "react";
import Link from "next/link";
import type { LiveEvent } from "@/lib/logs/types";
import { SEVERITY_STYLE, SOURCE_META } from "./meta";

function fmtClock(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function metaPairs(meta: LiveEvent["meta"]): Array<[string, string]> {
  if (!meta) return [];
  const out: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null || v === "") continue;
    out.push([k, String(v)]);
  }
  return out;
}

export function LogRow({ event }: { event: LiveEvent }) {
  const [open, setOpen] = React.useState(false);
  const sev = SEVERITY_STYLE[event.severity];
  const src = SOURCE_META[event.source];
  const pairs = metaPairs(event.meta);
  const expandable = pairs.length > 0 || Boolean(event.ref);

  return (
    <div
      className="group relative flex gap-3 border-b px-3 py-2 transition-colors hover:bg-[rgb(var(--surface2))]"
      style={{ borderColor: "rgb(var(--border))" }}
    >
      {/* Severity bar */}
      <span className={`absolute left-0 top-0 h-full w-0.5 ${sev.bar} ${event.historical ? "opacity-30" : "opacity-90"}`} />

      {/* Timestamp */}
      <time
        className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums"
        style={{ color: "rgb(var(--muted))" }}
        dateTime={new Date(event.ts).toISOString()}
        title={new Date(event.ts).toLocaleString()}
      >
        {fmtClock(event.ts)}
      </time>

      {/* Severity dot */}
      <span className="mt-1.5 shrink-0">
        <span className={`block h-2 w-2 rounded-full ${sev.dot} ${event.historical ? "opacity-40" : ""}`} />
      </span>

      {/* Source chip */}
      <span
        className={`mt-0.5 hidden shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset sm:inline-flex ${sev.chip}`}
        title={`${src.label} · ${sev.label}`}
      >
        <src.Icon size={12} />
        {src.label}
      </span>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={expandable ? () => setOpen((o) => !o) : undefined}
          className={`flex w-full items-start gap-2 text-left ${expandable ? "cursor-pointer" : "cursor-default"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="text-sm font-medium" style={{ color: "rgb(var(--text))" }}>
              {event.title}
            </span>
            {event.detail ? (
              <span className="ml-2 text-xs" style={{ color: "rgb(var(--muted))" }}>
                {event.detail}
              </span>
            ) : null}
          </span>
          {event.historical ? (
            <span
              className="shrink-0 rounded px-1 py-0.5 text-[9px] uppercase tracking-wide"
              style={{ background: "rgb(var(--surface2))", color: "rgb(var(--muted))" }}
            >
              past
            </span>
          ) : null}
        </button>

        {open && expandable ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {pairs.map(([k, v]) => (
              <span key={k} className="font-mono text-[11px]" style={{ color: "rgb(var(--muted))" }}>
                <span className="opacity-70">{k}:</span>{" "}
                <span style={{ color: "rgb(var(--text))" }}>{v}</span>
              </span>
            ))}
            {event.ref ? (
              <Link
                href={event.ref.href}
                className="text-[11px] font-medium underline-offset-2 hover:underline"
                style={{ color: "rgb(var(--accent))" }}
              >
                {event.ref.label} →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

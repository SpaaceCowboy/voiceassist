"use client";

import * as React from "react";
import type { ConnStatus, HealthSnapshot } from "@/lib/logs/types";

function Tile({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "warn" | "neutral" | "accent";
  sub?: string;
}) {
  const dot: Record<string, string> = {
    good: "bg-emerald-500",
    bad: "bg-red-500",
    warn: "bg-amber-500",
    accent: "bg-violet-500",
    neutral: "bg-slate-400",
  };
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border p-3"
      style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot[tone]}`} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
          {label}
        </div>
        <div className="truncate text-sm font-semibold" style={{ color: "rgb(var(--text))" }}>
          {value}
          {sub ? (
            <span className="ml-1.5 font-normal text-xs" style={{ color: "rgb(var(--muted))" }}>
              {sub}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function fmtUptime(seconds?: number): string | undefined {
  if (seconds == null || !Number.isFinite(seconds)) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const CONN: Record<ConnStatus, { label: string; tone: "good" | "bad" | "warn" | "neutral" }> = {
  live: { label: "Live", tone: "good" },
  connecting: { label: "Connecting…", tone: "warn" },
  reconnecting: { label: "Reconnecting…", tone: "warn" },
  paused: { label: "Paused", tone: "neutral" },
  error: { label: "Error", tone: "bad" },
};

export function HealthStrip({
  status,
  health,
  eventCount,
}: {
  status: ConnStatus;
  health: HealthSnapshot | null;
  eventCount: number;
}) {
  const conn = CONN[status];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Tile label="Connection" value={conn.label} tone={conn.tone} />
      <Tile
        label="Database"
        value={health?.db ? (health.db.up ? "Healthy" : "Down") : "Unknown"}
        tone={health?.db ? (health.db.up ? "good" : "bad") : "neutral"}
        sub={health?.db?.latencyMs != null ? `${health.db.latencyMs}ms` : undefined}
      />
      <Tile
        label="Redis"
        value={health?.redis ? (health.redis.up ? "Healthy" : "Down") : "Unknown"}
        tone={health?.redis ? (health.redis.up ? "good" : "bad") : "neutral"}
        sub={health?.redis?.latencyMs != null ? `${health.redis.latencyMs}ms` : undefined}
      />
      <Tile
        label="Uptime"
        value={fmtUptime(health?.uptimeSeconds) ?? "—"}
        tone={health ? "accent" : "neutral"}
      />
      <Tile label="Events" value={eventCount.toLocaleString()} tone="accent" sub="buffered" />
    </div>
  );
}

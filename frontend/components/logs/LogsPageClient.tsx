"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LogsIcon } from "@/components/ui/icons";
import { useLogsStore } from "@/store/logs";
import { createLogSource } from "@/lib/logs/sources";
import type { ConnStatus, LiveEvent, LogSource } from "@/lib/logs/types";
import { HealthStrip } from "./HealthStrip";
import { LogControls } from "./LogControls";
import { LogStream } from "./LogStream";

const STATUS_LABEL: Record<ConnStatus, string> = {
  live: "Live",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  paused: "Paused",
  error: "Error",
};

function LiveBadge({ status }: { status: ConnStatus }) {
  const live = status === "live";
  const paused = status === "paused";
  const tone = live ? "bg-emerald-500" : paused ? "bg-slate-400" : "bg-amber-500";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
    >
      <span className="relative flex h-2 w-2">
        {live ? <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${tone} opacity-75`} /> : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${tone}`} />
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}

function matchesFilters(
  e: LiveEvent,
  q: string,
  severities: string[],
  sources: string[],
): boolean {
  if (severities.length && !severities.includes(e.severity)) return false;
  if (sources.length && !sources.includes(e.source)) return false;
  if (q) {
    const hay = [
      e.title,
      e.detail ?? "",
      e.source,
      e.severity,
      ...(e.meta ? Object.values(e.meta).map((v) => String(v ?? "")) : []),
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function LogsPageClient() {
  const events = useLogsStore((s) => s.events);
  const status = useLogsStore((s) => s.status);
  const statusDetail = useLogsStore((s) => s.statusDetail);
  const health = useLogsStore((s) => s.health);
  const paused = useLogsStore((s) => s.paused);
  const pollMs = useLogsStore((s) => s.pollMs);
  const query = useLogsStore((s) => s.query);
  const severities = useLogsStore((s) => s.severities);
  const sources = useLogsStore((s) => s.sources);

  const sourceRef = React.useRef<LogSource | null>(null);

  // Create the feed once and wire its callbacks to the store. Actions are read
  // via getState() so the source closure never goes stale.
  React.useEffect(() => {
    const store = useLogsStore.getState;
    const source = createLogSource(
      {
        onEvents: (evs) => store().ingest(evs),
        onStatus: (s) => store().setStatus(s),
        onHealth: (h) => store().setHealth(h),
      },
      store().pollMs,
    );
    sourceRef.current = source;
    if (!store().paused) source.start();
    return () => {
      source.stop();
      sourceRef.current = null;
    };
  }, []);

  // Pause / resume drives the underlying feed.
  React.useEffect(() => {
    const source = sourceRef.current;
    if (!source) return;
    if (paused) source.stop();
    else source.start();
  }, [paused]);

  // Poll-rate changes propagate to the feed.
  React.useEffect(() => {
    sourceRef.current?.setPollMs?.(pollMs);
  }, [pollMs]);

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(
    () => events.filter((e) => matchesFilters(e, q, severities, sources)),
    [events, q, severities, sources],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<LogsIcon />}
        title="Live Activity"
        subtitle="Real-time stream of calls, bookings and system health across the server."
        badge={<LiveBadge status={status} />}
      />

      <HealthStrip status={status} health={health} eventCount={events.length} />

      {statusDetail && (status === "error" || status === "reconnecting") ? (
        <div
          className="flex items-start gap-2 rounded-xl border px-3 py-2 text-xs"
          style={{
            background: status === "error" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)",
            borderColor: status === "error" ? "rgba(239,68,68,0.30)" : "rgba(245,158,11,0.30)",
            color: "rgb(var(--text))",
          }}
          role="status"
        >
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${status === "error" ? "bg-red-500" : "bg-amber-500"}`} />
          <span>{statusDetail}</span>
        </div>
      ) : null}

      <LogControls />

      <LogStream events={filtered} totalCount={events.length} />

      <p className="px-1 text-[11px]" style={{ color: "rgb(var(--muted))" }}>
        Live tail of server activity (SSE) — conversation turns, tool calls, bookings, requests and errors.
        If the stream is unavailable it falls back to gentle polling every {Math.round(pollMs / 1000)}s.
        Showing {filtered.length.toLocaleString()} of {events.length.toLocaleString()} buffered events
        (most recent 500 kept).
      </p>
    </div>
  );
}

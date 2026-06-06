"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import {
  SearchIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { useLogsStore } from "@/store/logs";
import {
  ALL_SEVERITIES,
  ALL_SOURCES,
  SEVERITY_STYLE,
  SOURCE_META,
} from "./meta";

// Cadence kept slow on purpose: the backend rate-limits to 100 req / 15 min / IP,
// so a faster poll would trip it and 429 the whole app.
const POLL_OPTIONS = [
  { label: "20s", ms: 20000 },
  { label: "30s", ms: 30000 },
  { label: "60s", ms: 60000 },
];

function FilterChip({
  active,
  onClick,
  children,
  dotClass,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active ? "" : "opacity-55 hover:opacity-90"
      }`}
      style={{
        background: active ? "rgba(var(--accent),0.12)" : "rgb(var(--surface2))",
        borderColor: active ? "rgba(var(--accent),0.5)" : "rgb(var(--border))",
        color: active ? "rgb(var(--accent))" : "rgb(var(--text))",
      }}
    >
      {dotClass ? <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} /> : null}
      {children}
    </button>
  );
}

export function LogControls() {
  const query = useLogsStore((s) => s.query);
  const severities = useLogsStore((s) => s.severities);
  const sources = useLogsStore((s) => s.sources);
  const paused = useLogsStore((s) => s.paused);
  const pollMs = useLogsStore((s) => s.pollMs);

  const setQuery = useLogsStore((s) => s.setQuery);
  const toggleSeverity = useLogsStore((s) => s.toggleSeverity);
  const toggleSource = useLogsStore((s) => s.toggleSource);
  const setPaused = useLogsStore((s) => s.setPaused);
  const setPollMs = useLogsStore((s) => s.setPollMs);
  const clear = useLogsStore((s) => s.clear);
  const resetFilters = useLogsStore((s) => s.resetFilters);

  const hasFilters = query.trim() !== "" || severities.length > 0 || sources.length > 0;

  return (
    <div
      className="space-y-3 rounded-2xl border p-3"
      style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
    >
      {/* Top row: search + primary actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "rgb(var(--muted))" }}>
            <SearchIcon size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, intents, patients…"
            className="w-full rounded-xl border py-2 pl-8 pr-3 text-sm outline-none focus:ring-2"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          />
        </div>

        <Button
          variant={paused ? "primary" : "ghost"}
          icon={paused ? <PlayIcon size={15} /> : <PauseIcon size={15} />}
          onClick={() => setPaused(!paused)}
          title={paused ? "Resume the live feed" : "Pause the live feed"}
        >
          {paused ? "Resume" : "Pause"}
        </Button>

        <Button variant="ghost" icon={<TrashIcon size={15} />} onClick={clear} title="Clear the current buffer">
          Clear
        </Button>

        {/* Poll rate segmented control */}
        <div
          className="inline-flex overflow-hidden rounded-xl border"
          style={{ borderColor: "rgb(var(--border))" }}
          title="How often the dashboard polls the server"
        >
          {POLL_OPTIONS.map((opt) => {
            const active = pollMs === opt.ms;
            return (
              <button
                key={opt.ms}
                type="button"
                onClick={() => setPollMs(opt.ms)}
                className="px-2.5 py-2 text-xs font-medium transition"
                style={{
                  background: active ? "rgba(var(--accent),0.12)" : "rgb(var(--surface2))",
                  color: active ? "rgb(var(--accent))" : "rgb(var(--muted))",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: filter chips */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11px] uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
            Level
          </span>
          {ALL_SEVERITIES.map((s) => (
            <FilterChip
              key={s}
              active={severities.length === 0 || severities.includes(s)}
              onClick={() => toggleSeverity(s)}
              dotClass={SEVERITY_STYLE[s].dot}
            >
              {SEVERITY_STYLE[s].label}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11px] uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
            Source
          </span>
          {ALL_SOURCES.map((s) => (
            <FilterChip
              key={s}
              active={sources.length === 0 || sources.includes(s)}
              onClick={() => toggleSource(s)}
            >
              {SOURCE_META[s].label}
            </FilterChip>
          ))}
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium underline-offset-2 hover:underline"
            style={{ color: "rgb(var(--accent))" }}
          >
            Reset filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

// lib/logs/types.ts
// Shared shapes for the live activity log. A LiveEvent is the single,
// source-agnostic unit the UI renders — whether it came from polling existing
// REST endpoints today or a real SSE log stream tomorrow.

/** Visual + semantic weight of an event. Drives row colour. */
export type EventSeverity = "info" | "success" | "warn" | "error";

/** Which part of the system the event is about. Drives the source chip + icon. */
export type EventSource =
  | "call"
  | "appointment"
  | "session"
  | "system"
  | "tool"
  | "ai";

/** For conversation events: who/what produced the turn (drives bubble styling). */
export type EventRole = "user" | "assistant" | "tool" | "system";

/** One line in the live feed. `id` must be stable so re-polling never duplicates. */
export interface LiveEvent {
  /** Stable dedupe key, e.g. `call:CA123:incoming` or `appt:42:status:confirmed`. */
  id: string;
  /** Epoch ms. Prefer the entity's own timestamp; fall back to arrival time. */
  ts: number;
  severity: EventSeverity;
  source: EventSource;
  /** For conversation turns: user utterance, assistant reply, tool call, etc. */
  role?: EventRole;
  /** Human one-liner an admin reads at a glance. */
  title: string;
  /** Optional secondary line (provider, intent, reason…). */
  detail?: string;
  /** Optional key/value pairs revealed when the row is expanded. */
  meta?: Record<string, string | number | undefined>;
  /** Optional deep link, e.g. to the call or appointment detail page. */
  ref?: { href: string; label: string };
  /** True for rows backfilled on first load (vs. captured live). */
  historical?: boolean;
}

/** Live connection state of whatever feed is wired up. */
export type ConnStatus =
  | "connecting"
  | "live"
  | "reconnecting"
  | "paused"
  | "error";

/** Parsed, defensive view of `GET /api/health?detailed=true`. */
export interface HealthSnapshot {
  ok: boolean;
  db: { up: boolean; latencyMs?: number } | null;
  redis: { up: boolean; latencyMs?: number } | null;
  uptimeSeconds?: number;
  at: number;
}

/** Snapshot the polling source diffs between ticks to derive events. */
export interface Snapshot {
  calls: Array<Record<string, unknown>>;
  appointments: Array<Record<string, unknown>>;
  activeSessions: number | null;
}

/** Callbacks every LogSource pushes into. The store wires these up. */
export interface LogSourceHandlers {
  onEvents: (events: LiveEvent[]) => void;
  onStatus: (status: ConnStatus, detail?: string) => void;
  onHealth: (health: HealthSnapshot) => void;
}

/** Common control surface so the page can drive any feed identically. */
export interface LogSource {
  start: () => void;
  stop: () => void;
  /** Polling sources honour this; streaming sources may ignore it. */
  setPollMs?: (ms: number) => void;
}

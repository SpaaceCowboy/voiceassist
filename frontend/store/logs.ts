// store/logs.ts
// Holds the live activity feed: a capped ring buffer of events, the current
// connection status, latest health snapshot, and the operator's view filters.

import { create } from "zustand";
import type {
  ConnStatus,
  EventSeverity,
  EventSource,
  HealthSnapshot,
  LiveEvent,
} from "@/lib/logs/types";

/** Hard cap on retained events to keep memory + render cost bounded. */
const MAX_EVENTS = 500;

type LogsState = {
  events: LiveEvent[]; // chronological: oldest first, newest last
  seen: Set<string>; // dedupe guard, kept out of render-critical comparisons
  health: HealthSnapshot | null;
  status: ConnStatus;
  statusDetail: string | null;
  paused: boolean;
  pollMs: number;

  // Filters
  query: string;
  severities: EventSeverity[]; // empty = all
  sources: EventSource[]; // empty = all

  // Actions
  ingest: (incoming: LiveEvent[]) => void;
  setHealth: (h: HealthSnapshot) => void;
  setStatus: (s: ConnStatus, detail?: string) => void;
  setPaused: (v: boolean) => void;
  setPollMs: (ms: number) => void;
  setQuery: (q: string) => void;
  toggleSeverity: (s: EventSeverity) => void;
  toggleSource: (s: EventSource) => void;
  resetFilters: () => void;
  clear: () => void;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export const useLogsStore = create<LogsState>((set, get) => ({
  events: [],
  seen: new Set<string>(),
  health: null,
  status: "connecting",
  statusDetail: null,
  paused: false,
  pollMs: 20000,

  query: "",
  severities: [],
  sources: [],

  ingest: (incoming) => {
    if (!incoming.length) return;
    const { events, seen } = get();
    const fresh = incoming.filter((e) => e.id && !seen.has(e.id));
    if (!fresh.length) return;

    const nextSeen = new Set(seen);
    for (const e of fresh) nextSeen.add(e.id);

    const merged = [...events, ...fresh].sort((a, b) => a.ts - b.ts);
    const capped = merged.length > MAX_EVENTS ? merged.slice(merged.length - MAX_EVENTS) : merged;

    // Keep `seen` from growing without bound: only track ids still in buffer.
    const liveIds = new Set(capped.map((e) => e.id));
    const prunedSeen = new Set<string>();
    for (const id of nextSeen) if (liveIds.has(id)) prunedSeen.add(id);

    set({ events: capped, seen: prunedSeen });
  },

  setHealth: (h) => set({ health: h }),
  setStatus: (s, detail) => set({ status: s, statusDetail: detail ?? null }),
  setPaused: (v) => set({ paused: v, status: v ? "paused" : "connecting", statusDetail: null }),
  setPollMs: (ms) => set({ pollMs: ms }),

  setQuery: (q) => set({ query: q }),
  toggleSeverity: (s) => set({ severities: toggle(get().severities, s) }),
  toggleSource: (s) => set({ sources: toggle(get().sources, s) }),
  resetFilters: () => set({ query: "", severities: [], sources: [] }),

  clear: () => set({ events: [], seen: new Set<string>() }),
}));

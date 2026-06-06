// lib/logs/sources.ts
// Pluggable feeds for the live activity log. Today we poll existing REST
// endpoints and diff snapshots; tomorrow a real backend SSE stream can be
// dropped in by setting NEXT_PUBLIC_LOG_SOURCE=sse — the UI never changes.
//
// Backend contract for the future SSE upgrade (out of frontend scope):
//   GET /api/logs/stream   (JWT cookie auth, same as every other proxied route)
//   Content-Type: text/event-stream
//   Each message: `data: {<LiveEvent JSON>}\n\n`
//   Optional `event: health` messages carry a HealthSnapshot payload.

import { getAppointments, getCalls, getHealth } from "@/lib/api/voiceAssistantApi";
import { BackendError } from "@/lib/backend";
import { deriveEvents, deriveHealthEvents } from "./deriveEvents";
import type {
  HealthSnapshot,
  LiveEvent,
  LogSource,
  LogSourceHandlers,
  Snapshot,
} from "./types";

// The backend rate-limits to 100 requests / 15 min / IP across ALL /api routes
// (backend/src/server.ts). A live feed must therefore be frugal: we fetch at
// most a couple of endpoints per tick, default to a slow cadence, skip work
// while the tab is hidden, and back off hard if we ever see a 429.
const DEFAULT_POLL_MS = 20_000;
const HEALTH_EVERY_N_TICKS = 3;
const RATE_LIMIT_COOLDOWN_MS = 60_000;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function asArray(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  }
  return [];
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function boolFromStatus(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (/(up|ok|connected|healthy|ready|true)/.test(s)) return true;
    if (/(down|fail|error|disconnect|false)/.test(s)) return false;
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const flag = o.connected ?? o.up ?? o.ok ?? o.status;
    return boolFromStatus(flag);
  }
  return null;
}

function latency(v: unknown): number | undefined {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return num(o.latencyMs ?? o.latency ?? o.responseTime ?? o.ms);
  }
  return undefined;
}

/** Best-effort parse of the loosely-typed /api/health payload. */
function parseHealth(payload: unknown): HealthSnapshot {
  const root =
    payload && typeof payload === "object"
      ? ((payload as { data?: unknown }).data ?? payload)
      : {};
  const o = (root && typeof root === "object" ? root : {}) as Record<string, unknown>;

  const dbRaw = o.database ?? o.db ?? o.postgres ?? o.pg;
  const redisRaw = o.redis ?? o.cache ?? o.upstash;

  const dbUp = boolFromStatus(dbRaw);
  const redisUp = boolFromStatus(redisRaw);
  const overall = boolFromStatus(o.status ?? o.ok ?? o.healthy);

  const db = dbRaw === undefined && dbUp === null ? null : { up: dbUp ?? true, latencyMs: latency(dbRaw) };
  const redis = redisRaw === undefined && redisUp === null ? null : { up: redisUp ?? true, latencyMs: latency(redisRaw) };

  const ok =
    overall ??
    ((db ? db.up : true) && (redis ? redis.up : true));

  return {
    ok: Boolean(ok),
    db,
    redis,
    uptimeSeconds: num(o.uptime ?? o.uptimeSeconds),
    at: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Polling source — the real, working feed against existing endpoints.
// ---------------------------------------------------------------------------
class PollingLogSource implements LogSource {
  private readonly h: LogSourceHandlers;
  private pollMs: number;
  private stopped = true;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private prev: Snapshot | null = null;
  private prevHealth: HealthSnapshot | null = null;
  private tickCount = 0;

  constructor(handlers: LogSourceHandlers, pollMs = DEFAULT_POLL_MS) {
    this.h = handlers;
    this.pollMs = pollMs;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.h.onStatus("connecting");
    void this.tick();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  setPollMs(ms: number): void {
    this.pollMs = ms;
  }

  private isRateLimited(results: PromiseSettledResult<unknown>[]): boolean {
    return results.some(
      (r) => r.status === "rejected" && r.reason instanceof BackendError && r.reason.status === 429,
    );
  }

  private async tick(): Promise<void> {
    if (this.stopped) return;

    // Don't spend the request budget while nobody's looking.
    if (typeof document !== "undefined" && document.hidden) {
      this.schedule(this.pollMs);
      return;
    }

    this.tickCount += 1;
    const wantHealth = this.tickCount % HEALTH_EVERY_N_TICKS === 1;

    // Two reads per tick (calls + appointments), health only occasionally.
    // Sessions/stats is intentionally dropped: moderator-only (403 noise) and
    // it would add a third request to every tick.
    const results = await Promise.allSettled(
      wantHealth
        ? [getCalls({ limit: 25, offset: 0 }), getAppointments({ date: todayISO(), limit: 25 }), getHealth()]
        : [getCalls({ limit: 25, offset: 0 }), getAppointments({ date: todayISO(), limit: 25 })],
    );

    // Rate limited → stop hammering. Long cooldown lets the 15-min window drain.
    if (this.isRateLimited(results)) {
      this.h.onStatus(
        "error",
        "Server rate limit hit (100 requests / 15 min). Polling paused — a backend log-stream (SSE) endpoint is the real fix.",
      );
      this.schedule(RATE_LIMIT_COOLDOWN_MS);
      return;
    }

    const callsR = results[0];
    const apptR = results[1];
    const healthR = wantHealth ? results[2] : undefined;

    if (callsR.status === "rejected" && apptR.status === "rejected") {
      const reason = callsR.reason instanceof Error ? callsR.reason.message : "connection lost";
      this.h.onStatus("reconnecting", reason);
      this.schedule(this.pollMs);
      return;
    }

    const snapshot: Snapshot = {
      calls: callsR.status === "fulfilled" ? asArray(callsR.value) : this.prev?.calls ?? [],
      appointments: apptR.status === "fulfilled" ? asArray(apptR.value) : this.prev?.appointments ?? [],
      activeSessions: null,
    };

    const events = deriveEvents(this.prev, snapshot);
    this.prev = snapshot;
    if (events.length) this.h.onEvents(events);

    if (healthR && healthR.status === "fulfilled") {
      const health = parseHealth(healthR.value);
      const hev = deriveHealthEvents(this.prevHealth, health);
      this.prevHealth = health;
      if (hev.length) this.h.onEvents(hev);
      this.h.onHealth(health);
    }

    this.h.onStatus("live");
    this.schedule(this.pollMs);
  }

  private schedule(delay: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.tick(), delay);
  }
}

// ---------------------------------------------------------------------------
// Mock source — a believable scripted stream for DATA_SOURCE=mock / demos,
// where static fixtures would otherwise never produce "new" events.
// ---------------------------------------------------------------------------
const MOCK_NAMES = ["John Carter", "Ava Thompson", "Noah Wilson", "Mia Hernandez", "Liam Patel", "Emma Brooks"];
const MOCK_DEPTS = ["Orthopedic", "Neurology", "Pain Management", "Spine Surgery"];
const MOCK_DOCTORS = ["Dr. Martinez", "Dr. Sharma", "Dr. Nguyen", "Dr. Lee"];
const MOCK_DAYS = ["Mon Jun 9", "Tue Jun 10", "Wed Jun 11", "Thu Jun 12"];
const MOCK_TIMES = ["9:30 AM", "11:00 AM", "2:00 PM", "3:45 PM"];

type Step = Omit<LiveEvent, "id" | "ts">;

class MockLogSource implements LogSource {
  private readonly h: LogSourceHandlers;
  private pollMs: number;
  private stopped = true;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private step = 0;
  private callSeq = 1042;
  private queue: Step[] = [];

  constructor(handlers: LogSourceHandlers, pollMs = 2200) {
    this.h = handlers;
    this.pollMs = pollMs;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.h.onStatus("connecting");
    const now = Date.now();
    // Small historical backlog so the page isn't empty on arrival.
    this.h.onEvents([
      { id: "mock:seed:1", ts: now - 240_000, severity: "success", source: "appointment", title: "Appointment booked", detail: "Ava Thompson · Dr. Lee · Mon Jun 9 9:30 AM", historical: true, meta: { callSid: "CA1039" } },
      { id: "mock:seed:2", ts: now - 150_000, severity: "warn", source: "call", title: "Transferred to staff", detail: "Routed to Pain Management", historical: true, meta: { callSid: "CA1040" } },
      { id: "mock:seed:3", ts: now - 60_000, severity: "info", source: "system", title: "GET /api/appointments", detail: "200 · 14ms", historical: true },
    ]);
    this.h.onHealth({ ok: true, db: { up: true, latencyMs: 11 }, redis: { up: true, latencyMs: 4 }, uptimeSeconds: 53_400, at: now });
    this.h.onStatus("live");
    this.schedule();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  setPollMs(ms: number): void {
    // The mock is offline; keep it lively regardless of the chosen poll rate.
    this.pollMs = Math.max(1200, Math.round(ms / 8));
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private schedule(): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      if (this.stopped) return;
      this.emitNext();
      if (this.step % 7 === 0) {
        this.h.onHealth({
          ok: true,
          db: { up: true, latencyMs: 8 + Math.floor(Math.random() * 14) },
          redis: { up: true, latencyMs: 3 + Math.floor(Math.random() * 5) },
          uptimeSeconds: 53_400 + this.step * 3,
          at: Date.now(),
        });
      }
      this.schedule();
    }, this.pollMs);
  }

  private emitNext(): void {
    if (this.queue.length === 0) this.queue = this.buildScenario();
    const next = this.queue.shift();
    if (!next) return;
    this.step += 1;
    this.h.onEvents([{ ...next, id: `mock:${this.step}:${Math.floor(Math.random() * 1e6)}`, ts: Date.now() }]);
  }

  /** Build one full, realistic call (greeting → turns → tool calls → outcome). */
  private buildScenario(): Step[] {
    this.callSeq += 1;
    const sid = `CA${this.callSeq}`;
    const name = this.pick(MOCK_NAMES);
    const doctor = this.pick(MOCK_DOCTORS);
    const dept = this.pick(MOCK_DEPTS);
    const day = this.pick(MOCK_DAYS);
    const time = this.pick(MOCK_TIMES);
    const ref = { href: `/calls/${sid}`, label: "View call" };
    const m = (extra?: Record<string, string | number>) => ({ callSid: sid, ...(extra ?? {}) });

    const user = (title: string, conf = 92 + Math.floor(Math.random() * 7)): Step => ({ source: "call", role: "user", severity: conf < 60 ? "warn" : "info", title, detail: `caller · ${conf}% confidence`, meta: m({ confidence: conf }) });
    const bot = (title: string): Step => ({ source: "ai", role: "assistant", severity: "info", title, detail: "assistant", meta: m() });
    const tool = (title: string, detail: string, extra?: Record<string, string | number>): Step => ({ source: "tool", role: "tool", severity: "info", title, detail, meta: m(extra) });

    const open: Step[] = [
      { source: "call", severity: "info", title: "Incoming call", detail: `From +1 415 555 0${10 + (this.callSeq % 89)}`, meta: m(), ref },
      { source: "session", severity: "info", title: "Session started", detail: this.callSeq % 2 ? "returning patient" : "new caller", meta: m() },
      bot("Thanks for calling NeuroSpine Institute — how can I help?"),
    ];

    const kind = this.callSeq % 4;

    if (kind === 0) {
      // Booking
      return [
        ...open,
        user(`I'd like to book an appointment with ${doctor}.`),
        bot("Of course. What day works best for you?"),
        tool("Checking availability", `${dept} · ${day}`, { department: dept, date: day }),
        user(`${time} on ${day} is perfect.`),
        { source: "appointment", role: "tool", severity: "success", title: "Appointment booked", detail: `${name} · ${doctor} · ${day} ${time}`, meta: m({ patientName: name, doctor, department: dept, date: day, time }), ref },
        bot(`Done — you're booked with ${doctor} on ${day} at ${time}. Anything else?`),
        user("No, that's everything. Thank you!"),
        { source: "call", severity: "info", title: "Call ended", detail: "completed · 1m 18s", meta: m() },
      ];
    }
    if (kind === 1) {
      // Reschedule
      const newDay = this.pick(MOCK_DAYS);
      const newTime = this.pick(MOCK_TIMES);
      return [
        ...open,
        user("I need to move my appointment to later in the week."),
        tool("Looked up patient appointments", `${name} · ${doctor}`, { patientName: name }),
        bot(`I see your ${day} visit. What new time would you like?`),
        user(`Can we do ${newDay} at ${newTime}?`),
        { source: "appointment", role: "tool", severity: "info", title: "Appointment rescheduled", detail: `${name} · ${day} ${time} → ${newDay} ${newTime}`, meta: m({ patientName: name, from: `${day} ${time}`, to: `${newDay} ${newTime}` }), ref },
        bot(`All set — moved to ${newDay} at ${newTime}.`),
        { source: "call", severity: "info", title: "Call ended", detail: "completed · 56s", meta: m() },
      ];
    }
    if (kind === 2) {
      // Cancellation
      return [
        ...open,
        user("Something came up — I have to cancel my visit."),
        tool("Looked up patient appointments", `${name}`, { patientName: name }),
        { source: "appointment", role: "tool", severity: "warn", title: "Appointment cancelled", detail: `${name} · ${doctor} · ${day} ${time}`, meta: m({ patientName: name, reason: "patient request" }), ref },
        bot("That's cancelled for you. Is there anything else I can help with?"),
        user("That's all, thanks."),
        { source: "call", severity: "info", title: "Call ended", detail: "completed · 41s", meta: m() },
      ];
    }
    // Transfer / FAQ
    return [
      ...open,
      user("I have a question about my insurance coverage."),
      tool("Answered FAQ", "insurance coverage", { query: "insurance coverage" }),
      bot("Here's what our billing policy covers… Would you like me to connect you to staff?"),
      user("Yes please, I'd rather talk to someone."),
      { source: "call", role: "tool", severity: "warn", title: "Transferred to staff", detail: `Routed to ${dept}`, meta: m({ reason: "insurance question", department: dept }), ref },
      { source: "call", severity: "info", title: "Call ended", detail: "transferred · 1m 02s", meta: m() },
    ];
  }
}

// ---------------------------------------------------------------------------
// SSE source — ready for the future backend endpoint. Inert until that ships,
// gated behind NEXT_PUBLIC_LOG_SOURCE=sse so polling stays the default.
// ---------------------------------------------------------------------------
/** Time to wait for the SSE handshake before falling back to polling. */
const SSE_CONNECT_TIMEOUT_MS = 7000;

class SseLogSource implements LogSource {
  private readonly h: LogSourceHandlers;
  private readonly makeFallback?: () => LogSource;
  private es: EventSource | null = null;
  private fallback: LogSource | null = null;
  private everOpened = false;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(handlers: LogSourceHandlers, makeFallback?: () => LogSource) {
    this.h = handlers;
    this.makeFallback = makeFallback;
  }

  start(): void {
    if (typeof window === "undefined" || this.es || this.fallback) return;
    this.h.onStatus("connecting");

    // Same-origin EventSource sends the httpOnly auth cookie automatically,
    // which the /api/backend proxy forwards to the backend as a Bearer token.
    this.es = new EventSource("/api/backend/api/logs/stream");

    // If the stream never opens (endpoint missing on an old deploy, proxy
    // buffering, etc.), degrade to polling instead of showing nothing.
    this.connectTimer = setTimeout(() => {
      if (!this.everOpened) this.degradeToFallback("stream did not open");
    }, SSE_CONNECT_TIMEOUT_MS);

    this.es.onopen = () => {
      this.everOpened = true;
      if (this.connectTimer) clearTimeout(this.connectTimer);
      this.h.onStatus("live");
    };

    this.es.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data) as LiveEvent;
        if (ev && ev.id) this.h.onEvents([ev]);
      } catch {
        /* ignore malformed frame */
      }
    };

    this.es.addEventListener("health", (m) => {
      try {
        const h = JSON.parse((m as MessageEvent).data) as HealthSnapshot;
        this.h.onHealth({ ...h, at: Date.now() });
      } catch {
        /* ignore */
      }
    });

    this.es.onerror = () => {
      if (!this.everOpened) {
        // Never connected → fall back rather than spin on a dead endpoint.
        this.degradeToFallback("stream unavailable");
      } else {
        // Connected before; EventSource auto-reconnects on its own.
        this.h.onStatus("reconnecting", "Live stream interrupted — reconnecting…");
      }
    };
  }

  private degradeToFallback(reason: string): void {
    if (this.fallback) return;
    if (this.connectTimer) clearTimeout(this.connectTimer);
    this.es?.close();
    this.es = null;
    if (this.makeFallback) {
      this.fallback = this.makeFallback();
      this.fallback.start();
    } else {
      this.h.onStatus("error", reason);
    }
  }

  stop(): void {
    if (this.connectTimer) clearTimeout(this.connectTimer);
    this.es?.close();
    this.es = null;
    this.fallback?.stop();
    this.fallback = null;
  }

  setPollMs(ms: number): void {
    this.fallback?.setPollMs?.(ms);
  }
}

/**
 * Pick the feed implementation:
 *   - mock data mode → scripted demo stream
 *   - NEXT_PUBLIC_LOG_SOURCE=poll → polling only
 *   - default (and =sse) → SSE live stream, auto-degrading to polling if the
 *     backend stream endpoint isn't reachable.
 */
export function createLogSource(
  handlers: LogSourceHandlers,
  pollMs = DEFAULT_POLL_MS,
): LogSource {
  const mode = (process.env.NEXT_PUBLIC_LOG_SOURCE || "").toLowerCase();
  const dataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE || "").toLowerCase();

  if (mode === "mock" || dataSource === "mock") return new MockLogSource(handlers);
  if (mode === "poll") return new PollingLogSource(handlers, pollMs);

  return new SseLogSource(handlers, () => new PollingLogSource(handlers, pollMs));
}

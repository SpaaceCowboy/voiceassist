// lib/logs/deriveEvents.ts
// Pure diff engine: given the previous and current snapshots of the system,
// produce the operator-friendly events that happened in between. No I/O here —
// kept pure so it is trivially testable and reusable by any source.

import type {
  EventSeverity,
  HealthSnapshot,
  LiveEvent,
  Snapshot,
} from "./types";

/** Most recent N items to backfill on first load (so the feed isn't empty). */
const BACKFILL_LIMIT = 12;

function asString(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return undefined;
}

function toTs(v: unknown): number {
  const s = asString(v);
  const d = s ? Date.parse(s) : NaN;
  return Number.isNaN(d) ? Date.now() : d;
}

function keyOf(row: Record<string, unknown>, fields: string[]): string {
  for (const f of fields) {
    const val = asString(row[f]);
    if (val) return val;
  }
  return "";
}

/** Map a finished call outcome to a friendly event. */
function callOutcomeEvent(
  sid: string,
  row: Record<string, unknown>,
  ts: number,
  historical: boolean,
): LiveEvent | null {
  const outcome = (asString(row.outcome) || "").toLowerCase();
  if (!outcome || outcome === "in_progress" || outcome === "active") return null;

  const intent = asString(row.intent);
  const dept = asString(row.transfer_department);
  const dur = asString(row.duration_seconds);
  const meta: LiveEvent["meta"] = {
    callSid: sid,
    intent,
    transferredTo: dept,
    durationSeconds: dur,
  };
  const ref = { href: `/calls/${sid}`, label: "View call" };

  const base = { id: `call:${sid}:outcome:${outcome}`, ts, source: "call" as const, meta, ref, historical };

  switch (outcome) {
    case "booked":
      return { ...base, severity: "success", title: "Appointment booked on call", detail: intent ? `Intent: ${intent}` : undefined };
    case "transferred":
      return { ...base, severity: "warn", title: "Call transferred to staff", detail: dept ? `Routed to ${dept}` : undefined };
    case "failed":
      return { ...base, severity: "error", title: "Call failed", detail: intent ? `Intent: ${intent}` : undefined };
    case "faq_only":
      return { ...base, severity: "info", title: "FAQ answered on call", detail: intent ? `Intent: ${intent}` : undefined };
    default:
      return { ...base, severity: "info", title: `Call ended — ${outcome.replace(/_/g, " ")}` };
  }
}

/** Severity + verb for an appointment status. */
function apptStatusMeta(status: string): { severity: EventSeverity; verb: string } {
  const s = status.toLowerCase();
  if (/cancel/.test(s)) return { severity: "warn", verb: "cancelled" };
  if (/no[_\s-]?show/.test(s)) return { severity: "error", verb: "marked no-show" };
  if (/confirm/.test(s)) return { severity: "success", verb: "confirmed" };
  if (/complete/.test(s)) return { severity: "success", verb: "completed" };
  if (/in[_\s-]?progress/.test(s)) return { severity: "info", verb: "in progress" };
  return { severity: "info", verb: status.replace(/_/g, " ") };
}

function apptDetail(row: Record<string, unknown>): string | undefined {
  const provider = asString(row.provider);
  const dept = asString(row.department);
  const when = asString(row.scheduled_time);
  const parts: string[] = [];
  if (provider) parts.push(provider);
  if (dept) parts.push(dept);
  if (when) {
    const d = new Date(when);
    if (!Number.isNaN(d.getTime())) {
      parts.push(d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
    }
  }
  return parts.length ? parts.join(" · ") : undefined;
}

/**
 * Diff two snapshots into events.
 * - First call (`prev === null`) backfills the most recent activity as historical rows.
 * - Subsequent calls emit only genuinely new or changed entities.
 */
export function deriveEvents(prev: Snapshot | null, curr: Snapshot): LiveEvent[] {
  const out: LiveEvent[] = [];
  const first = prev === null;

  // ---- Calls ----------------------------------------------------------------
  const prevCalls = new Map<string, Record<string, unknown>>();
  if (prev) for (const c of prev.calls) prevCalls.set(keyOf(c, ["callSid", "call_sid"]), c);

  for (const c of curr.calls) {
    const sid = keyOf(c, ["callSid", "call_sid"]);
    if (!sid) continue;
    const ts = toTs(c.created_at ?? c.createdAt);
    const before = prevCalls.get(sid);

    if (!before) {
      if (first) {
        // Backfill: a single summary row per historical call (its outcome).
        const ev = callOutcomeEvent(sid, c, ts, true)
          ?? {
            id: `call:${sid}:incoming`,
            ts,
            severity: "info" as const,
            source: "call" as const,
            title: "Call received",
            meta: { callSid: sid },
            ref: { href: `/calls/${sid}`, label: "View call" },
            historical: true,
          };
        out.push(ev);
      } else {
        // Live: a brand-new call just appeared.
        const from = asString(c.from) || asString(c.caller) || asString(c.phone);
        out.push({
          id: `call:${sid}:incoming`,
          ts: Date.now(),
          severity: "info",
          source: "call",
          title: "Incoming call",
          detail: from ? `From ${from}` : undefined,
          meta: { callSid: sid, intent: asString(c.intent) },
          ref: { href: `/calls/${sid}`, label: "View call" },
        });
        // If it arrived already-finished, also surface the outcome.
        const oc = callOutcomeEvent(sid, c, Date.now(), false);
        if (oc) out.push(oc);
      }
      continue;
    }

    // Existing call whose outcome changed → emit the new outcome.
    const prevOutcome = (asString(before.outcome) || "").toLowerCase();
    const currOutcome = (asString(c.outcome) || "").toLowerCase();
    if (currOutcome && currOutcome !== prevOutcome) {
      const oc = callOutcomeEvent(sid, c, Date.now(), false);
      if (oc) out.push(oc);
    }
  }

  // ---- Appointments ---------------------------------------------------------
  const prevAppts = new Map<string, Record<string, unknown>>();
  if (prev) for (const a of prev.appointments) prevAppts.set(keyOf(a, ["id"]), a);

  for (const a of curr.appointments) {
    const id = keyOf(a, ["id"]);
    if (!id) continue;
    const status = asString(a.status) || "scheduled";
    const before = prevAppts.get(id);

    if (!before) {
      const ts = toTs(a.created_at ?? a.createdAt);
      const via = asString(a.created_via);
      if (first) {
        out.push({
          id: `appt:${id}:seed:${status}`,
          ts,
          severity: "info",
          source: "appointment",
          title: `Appointment ${status.replace(/_/g, " ")}`,
          detail: apptDetail(a),
          meta: { appointmentId: id, patient: asString(a.patient_name), via },
          historical: true,
        });
      } else {
        out.push({
          id: `appt:${id}:created`,
          ts: Date.now(),
          severity: "success",
          source: via === "ai" ? "ai" : "appointment",
          title: via === "ai" ? "Appointment booked by assistant" : "Appointment created",
          detail: apptDetail(a),
          meta: { appointmentId: id, patient: asString(a.patient_name), via },
        });
      }
      continue;
    }

    const prevStatus = asString(before.status) || "scheduled";
    if (status !== prevStatus) {
      const { severity, verb } = apptStatusMeta(status);
      out.push({
        id: `appt:${id}:status:${status}`,
        ts: Date.now(),
        severity,
        source: "appointment",
        title: `Appointment ${verb}`,
        detail: apptDetail(a),
        meta: { appointmentId: id, patient: asString(before.patient_name), from: prevStatus, to: status },
      });
    }
  }

  // ---- Active sessions ------------------------------------------------------
  if (!first && prev && curr.activeSessions != null && prev.activeSessions != null) {
    const delta = curr.activeSessions - prev.activeSessions;
    if (delta !== 0) {
      out.push({
        id: `session:active:${Date.now()}`,
        ts: Date.now(),
        severity: "info",
        source: "session",
        title: `Active calls: ${curr.activeSessions}`,
        detail: delta > 0 ? `+${delta} started` : `${delta} ended`,
        meta: { active: curr.activeSessions },
      });
    }
  }

  // On first load, sort historical rows oldest→newest and cap them.
  if (first) {
    out.sort((a, b) => a.ts - b.ts);
    return out.slice(Math.max(0, out.length - BACKFILL_LIMIT));
  }
  return out.sort((a, b) => a.ts - b.ts);
}

/** Diff two health snapshots into system events (transitions only). */
export function deriveHealthEvents(
  prev: HealthSnapshot | null,
  curr: HealthSnapshot,
): LiveEvent[] {
  const out: LiveEvent[] = [];

  if (!prev) {
    out.push({
      id: `system:monitoring:start`,
      ts: curr.at,
      severity: curr.ok ? "success" : "warn",
      source: "system",
      title: curr.ok ? "System online — monitoring started" : "System reachable with warnings",
      meta: {
        database: curr.db ? (curr.db.up ? "up" : "down") : "n/a",
        redis: curr.redis ? (curr.redis.up ? "up" : "down") : "n/a",
      },
    });
    return out;
  }

  const flip = (
    label: string,
    p: { up: boolean } | null,
    c: { up: boolean; latencyMs?: number } | null,
  ) => {
    if (!c) return;
    if (p && p.up === c.up) return;
    out.push({
      id: `system:${label}:${c.up ? "up" : "down"}:${curr.at}`,
      ts: curr.at,
      severity: c.up ? "success" : "error",
      source: "system",
      title: c.up ? `${label} recovered` : `${label} unreachable`,
      detail: c.latencyMs != null ? `${c.latencyMs} ms` : undefined,
    });
  };

  flip("Database", prev.db, curr.db);
  flip("Redis", prev.redis, curr.redis);

  if (prev.ok !== curr.ok) {
    out.push({
      id: `system:overall:${curr.ok ? "ok" : "degraded"}:${curr.at}`,
      ts: curr.at,
      severity: curr.ok ? "success" : "error",
      source: "system",
      title: curr.ok ? "System healthy" : "System degraded",
    });
  }

  return out;
}

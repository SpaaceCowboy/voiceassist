/**
 * ===========================================
 * LIVE LOG EVENT BUS
 * ===========================================
 *
 * Turns the structured logger calls that already fire across the call pipeline
 * into operator-friendly "LiveEvent" objects, and broadcasts them to any
 * connected SSE clients (the dashboard's /dashboard/logs page).
 *
 * Design: the logger calls `publishLog(...)` on every info/warn/error. We map
 * the raw record to a LiveEvent (recognising known message strings like
 * "Transcript", "Assistant response", "Function call") and push it to:
 *   - an in-memory ring buffer (so a newly-connected client gets recent history)
 *   - an EventEmitter the SSE handler subscribes to (live tail)
 *
 * The LiveEvent shape is intentionally identical to the frontend
 * `frontend/lib/logs/types.ts` so the stream can be consumed with zero mapping.
 */

import { EventEmitter } from 'events';

export type LiveSeverity = 'info' | 'success' | 'warn' | 'error';
export type LiveSource = 'call' | 'appointment' | 'session' | 'system' | 'tool' | 'ai';
export type LiveRole = 'user' | 'assistant' | 'tool' | 'system';

export interface LiveEvent {
  id: string;
  ts: number;
  severity: LiveSeverity;
  source: LiveSource;
  role?: LiveRole;
  title: string;
  detail?: string;
  meta?: Record<string, string | number | undefined>;
  ref?: { href: string; label: string };
}

export interface RawLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
  callSid?: string;
}

const RING_SIZE = 200;
const ring: LiveEvent[] = [];
let seq = 0;

const bus = new EventEmitter();
bus.setMaxListeners(0); // many concurrent SSE clients are fine

// Messages we deliberately drop to keep the feed readable for a human operator.
const NOISE = new Set<string>(['Processing complete', 'Merged buffered fragment']);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === 'object' && !(data instanceof Error)
    ? (data as Record<string, unknown>)
    : {};
}

function str(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function joinDetail(parts: Array<string | undefined>): string | undefined {
  const kept = parts.filter((p): p is string => Boolean(p));
  return kept.length ? kept.join(' · ') : undefined;
}

function errMessage(data: unknown): string | undefined {
  if (data instanceof Error) return data.message;
  return str(data);
}

function summarize(d: Record<string, unknown>): string | undefined {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(d)) {
    if (v === undefined || v === null || v === '') continue;
    const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
    parts.push(`${k}=${val.length > 60 ? `${val.slice(0, 60)}…` : val}`);
    if (parts.length >= 4) break;
  }
  return parts.length ? parts.join(' ') : undefined;
}

function metaFromArgs(callSid: string, args: Record<string, unknown>): Record<string, string | number | undefined> {
  const meta: Record<string, string | number | undefined> = { callSid };
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue;
    meta[k] = typeof v === 'number' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  return meta;
}

function callRef(callSid?: string): { href: string; label: string } | undefined {
  return callSid ? { href: `/calls/${callSid}`, label: 'View call' } : undefined;
}

function make(p: {
  source: LiveSource;
  severity: LiveSeverity;
  title: string;
  detail?: string;
  role?: LiveRole;
  callSid?: string;
  meta?: Record<string, string | number | undefined>;
}): LiveEvent {
  seq += 1;
  const meta: Record<string, string | number | undefined> = {
    ...(p.callSid ? { callSid: p.callSid } : {}),
    ...(p.meta ?? {}),
  };
  return {
    id: `evt:${seq}`,
    ts: Date.now(),
    source: p.source,
    severity: p.severity,
    role: p.role,
    title: p.title,
    detail: p.detail,
    meta: Object.keys(meta).length ? meta : undefined,
    ref: callRef(p.callSid),
  };
}

// ---------------------------------------------------------------------------
// tool-call → friendly event ("what actually happened")
// ---------------------------------------------------------------------------
function mapToolCall(callSid: string, d: Record<string, unknown>): LiveEvent {
  const name = str(d.name) || 'tool';
  const a = asRecord(d.args);
  const meta = metaFromArgs(callSid, { ...a, tool: name });

  const who = str(a.patientName) || str(a.patient_name) || str(a.name) || str(a.fullName);
  const date = str(a.date) || str(a.appointmentDate) || str(a.appointment_date) || str(a.newDate);
  const time = str(a.time) || str(a.appointmentTime) || str(a.appointment_time) || str(a.newTime);
  const doctor = str(a.doctor) || str(a.provider) || str(a.doctorName) || str(a.provider_name);
  const dept = str(a.department) || str(a.dept);
  const when = date && time ? `${date} ${time}` : date || time;

  switch (name) {
    case 'book_appointment':
      return make({ source: 'appointment', severity: 'success', role: 'tool', callSid, meta, title: 'Appointment booked', detail: joinDetail([who, doctor || dept, when]) });
    case 'reschedule_appointment':
    case 'modify_appointment':
      return make({ source: 'appointment', severity: 'info', role: 'tool', callSid, meta, title: 'Appointment rescheduled', detail: joinDetail([who, when]) });
    case 'cancel_appointment':
      return make({ source: 'appointment', severity: 'warn', role: 'tool', callSid, meta, title: 'Appointment cancelled', detail: joinDetail([who, str(a.reason)]) });
    case 'check_availability':
      return make({ source: 'tool', severity: 'info', role: 'tool', callSid, meta, title: 'Checking availability', detail: joinDetail([dept || doctor, date]) });
    case 'get_patient_appointments':
      return make({ source: 'tool', severity: 'info', role: 'tool', callSid, meta, title: 'Looked up patient appointments', detail: who });
    case 'update_patient_info':
      return make({ source: 'session', severity: 'info', role: 'tool', callSid, meta, title: 'Patient info updated', detail: joinDetail(Object.keys(a)) });
    case 'transfer_to_staff':
      return make({ source: 'call', severity: 'warn', role: 'tool', callSid, meta, title: 'Transferred to staff', detail: str(a.reason) || dept });
    case 'answer_faq':
      return make({ source: 'ai', severity: 'info', role: 'tool', callSid, meta, title: 'Answered FAQ', detail: str(a.query) || str(a.question) });
    case 'end_call':
      return make({ source: 'call', severity: 'info', role: 'tool', callSid, meta, title: 'Call ended by assistant' });
    default:
      return make({ source: 'tool', severity: 'info', role: 'tool', callSid, meta, title: `Tool · ${name}`, detail: summarize(a) });
  }
}

// ---------------------------------------------------------------------------
// raw log → LiveEvent (or null to drop)
// ---------------------------------------------------------------------------
function toLiveEvent(raw: RawLog): LiveEvent | null {
  const { level, callSid } = raw;
  const m = (raw.message || '').trim();
  const d = asRecord(raw.data);

  if (level === 'debug') return null;
  if (!m || /^[=\-\s]+$/.test(m)) return null; // boot/decoration lines
  if (NOISE.has(m)) return null;

  // Structured HTTP request line emitted by logger.request()
  if (m === '__http__') {
    const status = Number(d.statusCode) || 0;
    const severity: LiveSeverity = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    return make({
      source: 'system',
      severity,
      title: `${str(d.method) ?? 'REQ'} ${str(d.path) ?? ''}`.trim(),
      detail: joinDetail([status ? String(status) : undefined, d.durationMs != null ? `${str(d.durationMs)}ms` : undefined]),
      meta: { method: str(d.method), path: str(d.path), status: status || undefined, durationMs: Number(d.durationMs) || undefined },
    });
  }

  // Conversation / call-scoped events
  if (callSid) {
    switch (m) {
      case 'Transcript': {
        const conf = typeof d.confidence === 'number' ? d.confidence : undefined;
        return make({ source: 'call', role: 'user', severity: conf != null && conf < 0.6 ? 'warn' : 'info', callSid, title: str(d.text) || '(unintelligible)', detail: conf != null ? `caller · ${Math.round(conf * 100)}% confidence` : 'caller', meta: { confidence: conf != null ? Math.round(conf * 100) : undefined } });
      }
      case 'Low confidence transcript buffered':
        return make({ source: 'call', role: 'user', severity: 'warn', callSid, title: str(d.text) || '(low confidence)', detail: 'buffered · low confidence' });
      case 'Short incomplete utterance buffered':
        return make({ source: 'call', role: 'user', severity: 'info', callSid, title: str(d.text) || '(partial)', detail: 'buffered · partial utterance' });
      case 'processing input':
        return make({ source: 'call', role: 'user', severity: 'info', callSid, title: str(d.input) || '(caller input)', detail: 'caller' });
      case 'Assistant response':
        return make({ source: 'ai', role: 'assistant', severity: 'info', callSid, title: str(d.text) || '(no text)', detail: 'assistant' });
      case 'Greeting':
        return make({ source: 'ai', role: 'assistant', severity: 'info', callSid, title: str(d.text) || 'Greeting', detail: 'assistant' });
      case 'Function call':
        return mapToolCall(callSid, d);
      case 'Incoming call':
      case 'Initializing conversation':
        return make({ source: 'call', severity: 'info', callSid, title: 'Incoming call', detail: joinDetail([str(d.from), str(d.to)]) });
      case 'Session initialized':
        return make({ source: 'session', severity: 'info', callSid, title: 'Session started', detail: d.hasName ? 'returning patient' : 'new caller' });
      case 'call ended':
        return make({ source: 'call', severity: 'info', callSid, title: 'Call ended', detail: joinDetail([str(d.status), d.duration != null ? `${str(d.duration)}s` : undefined]) });
      default:
        if (level === 'error') return make({ source: 'call', severity: 'error', callSid, title: m, detail: errMessage(raw.data) });
        if (level === 'warn') return make({ source: 'call', severity: 'warn', callSid, title: m, detail: summarize(d) });
        return make({ source: 'session', severity: 'info', callSid, title: m, detail: summarize(d) });
    }
  }

  // Global (non-call) events
  if (level === 'error') return make({ source: 'system', severity: 'error', title: m, detail: errMessage(raw.data) });
  if (level === 'warn') return make({ source: 'system', severity: 'warn', title: m, detail: summarize(d) });
  return make({ source: 'system', severity: 'info', title: m, detail: summarize(d) });
}

// ---------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------

/** Called by the logger on every (non-debug) log. Never throws. */
export function publishLog(raw: RawLog): void {
  try {
    const ev = toLiveEvent(raw);
    if (!ev) return;
    ring.push(ev);
    if (ring.length > RING_SIZE) ring.shift();
    bus.emit('event', ev);
  } catch {
    // logging must never break the request path
  }
}

/** Recent events for a freshly-connected client. */
export function getRecentEvents(limit = 100): LiveEvent[] {
  const n = Math.min(RING_SIZE, Math.max(1, limit));
  return ring.slice(Math.max(0, ring.length - n));
}

/** Subscribe to the live tail. Returns an unsubscribe function. */
export function subscribeLog(fn: (event: LiveEvent) => void): () => void {
  bus.on('event', fn);
  return () => {
    bus.off('event', fn);
  };
}

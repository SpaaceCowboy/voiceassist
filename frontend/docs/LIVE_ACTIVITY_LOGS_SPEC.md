# Live Activity / Server Logs — Full Spec

> This is the "AI-understandable prompt" distilled from the product owner's
> request, plus the technical facts gathered from the codebase. It is the
> source of truth for finishing the `/dashboard/logs` page.

## 1. What the owner asked for (verbatim intent)

> "We need a log for **every single API / action**. If a user calls and books an
> appointment, we must track **one by one** each conversation they had and each
> conversation our AI voice assistant had. When it books with a doctor, the log
> needs a line saying **what actually happened** in the real conversation, with
> **all data**: name, date, time, appointment, etc. If the user edits or removes
> an appointment — or does anything — track it.
>
> We already have this in the backend: a **terminal that shows everything**
> happening on the server. I want that on the frontend, with a **more beautiful
> UI**, so I never have to read backend logs again — same content as the backend
> terminal, just prettier and easier to understand.
>
> Also: the **global search (on all pages) must NOT surface live-activity data**.
> The logs page will get its **own dedicated search later** (not a priority now).
>
> And there's a **`{"error":"Too many requests"}` on every page** — fix it."

## 2. The hard constraint that shapes everything

The backend rate-limits **100 requests / 15 minutes / IP** across all `/api/*`
routes (`backend/src/server.ts:118`, `app.use('/api', apiLimiter)`).

Consequences:
- **Polling cannot deliver this feature.** "Track everything in real time" implies
  far more than 100 reads/15 min. The previous 4-endpoint/4s poll tripped the limit
  in ~100 s and 429'd the whole app (now fixed — see §6).
- **The REST API does not expose conversation-level data live.** Per-turn
  transcripts, assistant utterances, and tool calls are written by the backend
  `logger` and to the session store — not returned by `/api/calls` list. The full
  record only appears in `call_logs` *after* the call ends.

**Therefore the real feature requires a backend log-stream endpoint (SSE).**
The frontend is already built to consume it (`SseLogSource`); it just needs the
endpoint to exist.

## 3. What "everything" means — the event catalog

The backend already logs all of this (`backend/src/utils/logger.ts` +
`routes/twilio.ts` + `services/conversation.ts`). Each becomes one `LiveEvent`:

| Lifecycle stage | Backend log | Frontend event (source · severity) | Key data to show |
|---|---|---|---|
| Incoming call | `Incoming call` (twilio.ts:52) | call · info | callSid, from, to |
| Conversation init | `Initializing conversation` / `Session initialized` | session · info | patient id, name?, upcoming appts |
| User utterance (STT) | `Transcript` `{text, confidence}` (twilio.ts:268) | call · info | text, confidence |
| Low-confidence STT | `Low confidence transcript buffered` | call · warn | text, confidence, threshold |
| Assistant reply | `Assistant response` `{text}` (conversation.ts:318) | ai · info | what the assistant said |
| Tool / function call | `Function call` `{name, args}` (conversation.ts:223) | tool · info | name (check_availability, book_appointment, reschedule_appointment, cancel_appointment, get_patient_appointments, update_patient_info, transfer_to_staff, end_call…), args, result |
| Appointment booked | tool result + `call_logs.appointment_id` | appointment · success | patient name, date, time, doctor/provider, department, confirmation |
| Appointment rescheduled | reschedule tool result | appointment · info | old → new date/time |
| Appointment cancelled | cancel tool result | appointment · warn | which appt, reason |
| Patient created/updated | `update_patient_info` tool | session · info | fields changed |
| Call transferred | `transfer_to_staff` + `markTransferred` | call · warn | reason, department |
| Call ended | `call ended` `{status, duration}` | call · info | status, duration |
| HTTP request | `logger.request(method, path, status, ms)` | system · info/warn/error | method, path, status, duration |
| Error | `logger.error(...)` | system · error | message, stack (truncated) |
| Health change | DB/Redis connectivity | system · success/error | db, redis, latency |

**Threading:** events that belong to the same `callSid` should be visually
grouped/threaded so an operator can read one call's conversation top-to-bottom
(user turn → assistant turn → tool call → booking), exactly like the backend
terminal but grouped and colorized.

## STATUS (2026-06-04): IMPLEMENTED

The backend SSE endpoint described in §4 was built (owner authorized backend
work for this feature). `GET /api/logs/stream` + `GET /api/logs/recent` are live
(`backend/src/routes/logs.ts`), fed by `backend/src/utils/logEvents.ts` which the
logger publishes into. The frontend defaults to SSE and degrades to polling if
the stream is unreachable. §4 below is retained as the contract of record.

---

## 4. The backend contract to build (out of current frontend scope)

Primary — **live stream (SSE):**
```
GET /api/logs/stream
  Auth:    same JWT cookie the /api/backend proxy already forwards as Bearer.
  Headers: Content-Type: text/event-stream; Cache-Control: no-cache; Connection: keep-alive
  Rate limit: EXEMPT this route from apiLimiter (one long-lived connection).
  Body (per event):
      data: {<LiveEvent JSON, schema = frontend/lib/logs/types.ts>}\n\n
  Optional health frames:
      event: health\n
      data: {<HealthSnapshot JSON>}\n\n
  On connect: replay a small in-memory ring buffer (last ~100 events) so the
  client isn't empty, then stream live.
```
Feed it by having `logger` *also* emit to an in-process `EventEmitter` (or Redis
pub/sub channel `logs:all`); the SSE handler subscribes and serializes each log
call into a `LiveEvent`. Map existing log call-sites → `LiveEvent` per §3.

Secondary (nice-to-have, for history/replay):
- `GET /api/logs/recent?limit=200` — recent events as JSON (page reload backfill).
- `GET /api/calls/:callSid/turns` — per-turn history from
  `conversation_sessions.message_history` + `call_logs.metrics` for a finished call.

`LiveEvent` shape the backend must emit (already defined frontend-side):
```ts
{ id: string; ts: number; severity: "info"|"success"|"warn"|"error";
  source: "call"|"appointment"|"session"|"system"|"tool"|"ai";
  title: string; detail?: string; meta?: Record<string,string|number>;
  ref?: { href: string; label: string } }
```

## 5. Frontend plan (what I build)

1. **Primary feed = SSE.** Flip `createLogSource` to prefer SSE when available
   (`NEXT_PUBLIC_LOG_SOURCE=sse`). `SseLogSource` already implemented.
2. **Gentle polling stays as a fallback** for basic business events (new calls,
   bookings, health) — frugal + 429-safe (done, §6).
3. **Rich rendering for turn-level events:** conversation turns (user vs.
   assistant bubbles), tool calls with expandable args/result, appointment
   create/edit/cancel cards with full data (name/date/time/doctor/dept), grouped
   by `callSid` with a per-call header.
4. **Realistic mock scenario:** the mock feed plays a full call → greeting →
   user turns → tool calls → booking → edit → cancel, so the final UX is visible
   before the backend lands.
5. **Dedicated page search (later, low priority):** the page already has its own
   search box in `LogControls`; expand later. Do **not** add logs to global search.
6. **Search isolation (already true):** `GlobalSearch.tsx` only queries
   appointments/calls/patients/faqs. Live-activity events live solely in the
   `logs` Zustand store and are **never** indexed by global search. Keep it that way.

## 6. The 429 fix (done)

- Default cadence **20 s** (was 4 s); options 20/30/60 s (were 2/4/8 s).
- **≤2 reads per tick** (calls + appointments); health every 3rd tick; dropped
  sessions/stats (moderator-only 403 noise + extra request).
- **Pauses while the browser tab is hidden** (no budget spent unseen).
- **Hard 429 backoff:** on any 429, polling stops for 60 s and a clear banner
  explains the limit + points to the SSE fix.
- Net: well under 100 req / 15 min, and self-heals once the window drains.

> Note: the active 429 window is per-IP and lasts up to 15 minutes — after
> deploying this fix, existing 429s clear on their own once the window resets
> (or immediately if the backend is restarted).

# Changelog

Completed items from `pending-work.md`. Newest first.

## 2026-05-27 — Fuzzy matching & call analytics

- **Doctor name fuzzy matching** — `backend/src/services/conversation.ts`. Uses `pg_trgm` similarity to match misheard doctor names (e.g. Deepgram transcribes "Kamran" as "Cameron"). Falls back to fuzzy match (threshold 0.25) when exact LIKE fails. Also added fuzzy fallback for location names (threshold 0.2).
- **Call analytics metrics** — `backend/src/models/callLog.ts`, `backend/src/routes/api.ts`, `backend/types/index.ts`, `backend/migrations/004_call_metrics.sql`. Added `metrics` JSONB column to `call_logs`. Per-call metrics (response times, tool calls with durations, STT confidence scores, LLM call count, TTS chunks) tracked in Redis session and saved at call end. New `GET /api/analytics/metrics` endpoint returns aggregates: avg/p95 response time, avg confidence, low-confidence rate, avg LLM calls per call, avg TTS chunks, and tool usage breakdown with counts and avg durations.

## 2026-05-26 — Voice pipeline reliability & performance

- **STT confidence threshold + fragment buffering** — `backend/src/routes/twilio.ts`. Transcripts below 0.6 confidence are buffered and prepended to the next good transcript instead of being dropped. Prevents split sentences ("Can" + "we move it...") and garbage input to Claude.
- **Duplicate tool call detection (two-layer)** — `backend/src/services/conversation.ts`. Exact-match detection breaks on identical back-to-back calls. Per-tool count cap (max 2) catches repeated calls with different args (e.g. `transfer_to_staff` called 5x with different notes).
- **Post-hangup guards** — `backend/src/routes/twilio.ts`. `callEnded` flag prevents new transcript processing and audio sending after WebSocket `stop` event. Queue cleared on `end_call`/`transfer`.
- **Streaming TTS** — `backend/src/routes/twilio.ts`, `backend/src/services/conversation.ts`. Moved TTS out of `processInput` into route layer. Text split into sentences, TTS fired concurrently, chunks sent as ready. First audio in ~1.7s vs ~5s previously.
- **TTS caching** — `backend/src/services/tts.ts`. Redis-backed cache (SHA-256 key of text + provider config, 24h TTL). Greeting went from 5125ms → 0ms on repeat calls.
- **Transcript queue** — `backend/src/routes/twilio.ts`. Replaced `isProcessing` boolean with queue + `drainQueue()`. Caller speech during assistant processing is queued and processed next, not silently dropped.
- **Betterstack logging** — `backend/src/utils/logger.ts`. All logs shipped to Betterstack via HTTP POST with structured fields (`callSid`, `confidence`, `duration`, etc.) and inline summaries in the message for list view visibility.
- **Test call script** — `backend/scripts/test-call.ts`. 8 scripted scenarios (reschedule, book, cancel, FAQ, transfer, quick hangup, ambiguous, multi-intent) using Twilio REST API with `<Say>` TwiML for end-to-end testing without a real caller.

## 2026-05-21 — FAQ usage count batching

- **Buffered FAQ usage counts in-process** — `backend/src/models/faq.ts`. `incrementUsageCount(id)` is now synchronous and only bumps an in-memory `Map<id, delta>` — no DB I/O on the conversation hot path. Removes row-lock contention and WAL churn on popular FAQ rows that every matched call was updating.
- **Added `flushUsageCounts()`** — bulk `UPDATE … FROM (VALUES …) AS v(id, delta)` drains the map in a single round-trip. On query failure the snapshot is re-merged into the pending map so counts aren't lost across a transient DB blip.
- **Wired periodic + shutdown flush** — `backend/src/server.ts`. New 30s `setInterval` (unref'd) calls `flushUsageCounts()`; graceful `shutdown()` clears the timer and drains one final time before `database.closePool()`. Trade-off: up to 30s of counts can be lost on a hard crash — acceptable for an analytics counter.

Verified: `npm run typecheck` clean.

## 2026-05-21 — LOW backend audit sweep

- **Deleted internal docs from repo** — removed `backend/BUGFIX_REPORT.md` and `backend/test.md`. Audit history belongs in PRs/changelog, not shipped.
- **Validated `/api/sessions/cleanup` `hours` query** — `backend/src/routes/api.ts:978`. Now requires `1 ≤ hours ≤ 8760` (one year), falls back to 24 on non-finite or out-of-range input. Prevents a moderator accidentally passing `hours=0` (wipe everything) or a negative.
- **Fixed "Transfering" typo + capitalization** — `backend/src/routes/twilio.ts:366`. Caller-facing TTS now says "Transferring you now. Please hold."
- **Removed unused `notes` param in `handleTransfer`** — `backend/src/services/conversation.ts:689`. Was declared and never used; tool schema can keep `notes` since the LLM may still emit it harmlessly.
- **`inputys` typo** — not found in source (already corrected at some point); dropped from pending list.

Verified: `npm run typecheck` clean.

## 2026-05-21 — MEDIUM backend audit fixes

- **Date BETWEEN bugs fixed** — `backend/src/models/callLog.ts`. All five queries (`findRecent`, `findTransferredCalls`, `findCallsWithErrors`, `getStats` aggregate + intent + hourly + sentiment) now use `started_at >= $1::date AND started_at < ($2::date + INTERVAL '1 day')` so same-day end-date calls are included.
- **TZ-naive date parsing fixed** — `backend/src/utils/helpers.ts`. Added `parseLocalDate()` that splits `YYYY-MM-DD` and constructs a local-time `Date`. `formatDate()` switched to local components (no more UTC `.toISOString()` shift). `parseDate`, `isDateInPast`, `isTimeInPast`, and `validateAppointment` all use the local parser.
- **Greeting whitespace stripped** — `backend/src/services/conversation.ts:97-106`. Three multi-line greeting templates collapsed to single lines; the "schedile" typo was incidentally corrected to "schedule".
- **`AuthenticatedRequest` typed via `asyncHandler`** — `backend/src/routes/api.ts:29`. `asyncHandler<Req extends Request = AuthenticatedRequest>` lets handlers see `req.user` without per-route casts.
- **`unhandledRejection` now shuts down** — `backend/src/server.ts:302`. Calls `shutdown('unhandledRejection')` to match `uncaughtException` behavior.
- **`requestLogger` strips query string** — `backend/src/middleware/requestLogger.ts:13`. Logs `req.path` instead of `req.originalUrl` to avoid leaking tokens/PHI if ever passed as query params.
- **Swagger UI gated** — `backend/src/server.ts:135`. `/api/docs` only mounted when `NODE_ENV !== 'production'` or `ENABLE_API_DOCS === 'true'`.
- **Patient search index** — `backend/migrations/003_patient_search_trgm.sql`. Adds `pg_trgm` extension and GIN indexes on `patients.full_name`, `patients.phone`, `patients.email` to accelerate leading-`%` ILIKE searches without code changes.
- **PHI retention documented** — `backend/CLAUDE.md`. New "PHI / Data Retention" section spells out retention windows for `conversation_sessions.message_history` (24h via scheduled cleanup), Redis `session:{callSid}` (1h TTL), and `call_logs.transcript`/`summary` (indefinite, treat as PHI).

Verified: `npm run typecheck` clean.

## 2026-05-13 — HIGH backend audit fixes

- **`JWT_SECRET` now required unconditionally** — `backend/src/server.ts`. Removed the dev fallback to `'dev-secret-change-in-production'`; added to `requiredEnvVars` so startup fails fast if missing.
- **`NODE_ENV` must be set explicitly** — `backend/src/server.ts`. Process exits at startup if `NODE_ENV` is unset, so the Twilio dev-skip branch (which keys off `NODE_ENV==='development'`) cannot be enabled by an unset env.
- **Twilio dev-skip clarified** — `backend/src/middleware/twilioAuth.ts`. Added warning log when the skip path is taken; behavior gated on `NODE_ENV==='development'` (unchanged) but with explicit `NODE_ENV` enforcement above.
- **CORS allowlist enforced in prod** — `backend/src/server.ts`. `CORS_ORIGIN` parsed as comma-separated allowlist; production exits if `CORS_ORIGIN` is empty or contains `*`. Wildcard still allowed in non-prod.
- **`/auth/setup` race fixed** — `backend/src/routes/auth.ts`. Count + insert now wrapped in `db.transaction` with a `pg_advisory_xact_lock(47110001)`; concurrent setup requests serialize and only the first succeeds.
- **`appointment.modify` validates schedule changes** — `backend/src/routes/api.ts`. When `date` and/or `time` is in the payload, the handler loads the existing appointment, merges the unchanged field, and runs `validateAppointment` (past dates, weekends, business hours) before calling the model. 400 on failure.
- **`appointmentModel.findAll` honors `status`/`limit`/`offset`** — `backend/src/models/appointment.ts`, `backend/src/routes/api.ts`. Signature changed from `findAll(date?)` to `findAll(opts)`; route forwards all four query params. When `status` is provided the `NOT IN ('cancelled')` default is replaced with an explicit match.

Verified: `npm run typecheck` clean.

## 2026-05-13 — CRITICAL backend audit fixes

- **Removed default admin from seed** — `backend/migrations/seed_001_mock_data.sql`. Dropped the `INSERT INTO dashboard_users` for `admin@neurospine.com` and `front.desk@neurospine.com`. First moderator must now be created via `POST /auth/setup` on a fresh deployment.
- **Re-enabled startup DB check** — `backend/src/server.ts`. Uncommented `database.testConnection()` in `startServer()` so the process aborts if Postgres is unreachable instead of booting and failing on first query.
- **Authenticated `/media-stream` WebSocket** — `backend/src/routes/twilio.ts`. On the `start` event, look up the Redis session for the incoming `callSid` (created by the Twilio-HMAC-validated `/voice` webhook). Missing/unknown callSid → close with 1008. Prevents anonymous streams from burning Deepgram/OpenAI credits.
- **Patient search `q` now required** — `backend/src/middleware/validate.ts`, `backend/src/routes/api.ts`. `patientSearchSchema.q` is `min(1).max(200)`; the route trims and forwards. Eliminates the `ILIKE '%%'` mass-PII-enumeration path on `/api/patients/search`.

Verified: `npm run typecheck` clean.

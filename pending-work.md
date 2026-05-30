# Pending Work

Backend improvements, prioritized. Move items to `changelog.md` as they are completed.

## HIGH
- [x] **Streaming TTS** — Start sending audio chunks to caller while TTS is still generating. Current flow waits for full TTS completion (~2-5s) before any audio plays. Stream in chunks to cut perceived latency in half.
- [x] **TTS caching** — Cache common/repeated phrases (greeting, "could you repeat that?", goodbye) in Redis to skip redundant OpenAI TTS calls. Saves ~2s on greetings and reduces API costs.
- [x] **Transcript queue** — Replace `isProcessing` flag with a queue so caller input during assistant response is buffered and processed next, not silently dropped.

## MEDIUM
- [x] **Doctor name fuzzy matching** — Deepgram transcribes "Kamran" as "Cameron" at high confidence. Add Levenshtein/fuzzy matching against known doctor names in tool execution so availability checks and rescheduling still resolve correctly.
- [x] **Call analytics metrics** — Log aggregate metrics (avg response time, tool loop frequency, confidence distribution, tool usage breakdown) for dashboard visibility without digging through raw logs.

## LOW
- [ ] **Emoji logger** garbles non-UTF terminals — `backend/src/utils/logger.ts:24`.
- [ ] **`appointmentModel.modify`/`cancel` allow arbitrary status transitions** — add state-machine.

---

# Full-Stack Bug Review (2026-05-30)

Findings from a full frontend + backend review. Type checks pass; these are logic/correctness/security bugs. Verified items are marked ✓ (read against source); others are from detailed sub-agent review and should be confirmed before fixing. Note: the `req.query` reassignment in `validate.ts` is NOT a bug — this is Express 4.22, not 5.

## Backend — HIGH
- [ ] ✓ **Stray rejection kills the whole server** — `backend/src/server.ts:330-333`. `unhandledRejection` (and `uncaughtException`) call `shutdown()` → `process.exit`. Any transient fire-and-forget rejection (TTS prewarm, metric writers) drops every active call. `unhandledRejection` should log, not shut down.
- [ ] ✓ **Twilio signature validation fragile behind proxy** — `backend/src/middleware/twilioAuth.ts:45-47`. Rebuilds URL from `x-forwarded-proto`/`x-forwarded-host` which LBs may send as comma-lists → signature mismatch → 403 rejects ALL real Twilio calls. `trust proxy` is set; use `req.protocol`/`req.get('host')`.
- [ ] **Redis session race — lost messages & corrupted metrics** — `backend/src/config/redis.ts` (`updateSession`/`addMessage`), used in `conversation.ts` + `twilio.ts:317-322,538-543`. Non-atomic read-modify-write of full session blob; concurrent confidence/TTS writers race `processInput`. Last write wins → dropped transcript lines / undercounted metrics.
- [ ] **`llmCalls` metric grows quadratically** — `backend/src/services/conversation.ts:237`. `llmCalls += 1 + updatedSession.metrics.toolCalls.length` adds the cumulative tool-call array length each turn.
- [ ] **Barge-in unreliable** — `backend/src/routes/twilio.ts:236,467-487,521`. `isActive = () => !callEnded` ignores `isSpeaking`; `ws.send` streams frames with no back-pressure → assistant talks over caller after interruption.
- [ ] **Prod TLS verification disabled** — `backend/src/config/database.ts:11,23`, `backend/src/config/redis.ts:26`. `rejectUnauthorized:false` on DB + Redis (PHI system). Gate/document if provider requires it.

## Backend — MEDIUM
- [ ] **Malformed multi-round tool history** — `backend/src/services/llm.ts:149-170`. `continueAfterFunctionCall` fabricates empty `tool_use` (`input:{}`); prior tool_use/result pairs never persisted → inconsistent history to Claude → bogus "I didn't quite catch that" (`conversation.ts:184-190`) even when tool ran.
- [ ] **Analytics return strings not numbers** — `backend/src/models/appointment.ts:475-494`, `backend/src/models/callLog.ts:227-245`. pg returns COUNT/AVG as strings; `getStats`/intent/hourly don't parse → string-concat math.
- [ ] **`findAlternativeSlots` unbounded recursion** — `backend/src/models/appointment.ts:96-147`. `checkAvailability`→`findAlternativeSlots`→`checkAvailability` with no depth guard; DB fan-out on busy days.
- [ ] **Migrations not transactional** — `backend/src/config/migrate.ts:60-62`. Multi-statement `.sql` failing mid-file leaves DB half-migrated + unmarked → re-run errors on duplicate objects, blocks startup. Wrap in BEGIN/COMMIT.
- [ ] **Timezone inconsistency** — SQL `CURRENT_DATE`/`CURRENT_TIME` (Postgres TZ) vs JS `new Date()`/`getDay()` (Node TZ); `BUSINESS_TIMEZONE` documented but never applied. Disagreement near midnight. Also `conversation.ts` `formatDateForSpeech` off-by-one on date-only strings in PT.
- [ ] **`parseTime` false positives** — `backend/src/utils/helpers.ts:90-135`. Unanchored regex + `input.includes('one')` matches inside "phone" → misparses caller times.
- [ ] **Global transcript dedupe drops repeats** — `backend/src/routes/twilio.ts:207,310`. `if (text === lastTranscript) return` permanently drops a repeated "yes" (second confirmation lost).
- [ ] **`sentimentScore || null` drops a real 0** — `backend/src/models/callLog.ts:67`. Use `?? null`.
- [ ] **`findMatch` keyword `LIKE ALL` too strict + dead `keywordPattern` var** — `backend/src/models/faq.ts:55-66`.

## Frontend — HIGH/MEDIUM
- [ ] ✓ **Mock data source switch broken/dead** — `frontend/lib/backend.ts:43`. `base` always `/api/backend`; in mock mode `/api` is stripped → hits `/api/backend/appointments` (404), never `/api/mock/...`. `NEXT_PUBLIC_DATA_SOURCE=mock` breaks live calls instead of returning mock data. Also CLAUDE.md says backend.ts reads `auth-token` from localStorage + Bearer — real code does neither (cookie auth via proxy). Doc/impl mismatch.
- [ ] **No client-side auth guard** — `frontend/components/AppShell.tsx:32-47`. Only `/login`,`/signup` hide nav; protected routes render + fetch before any auth check. `getMe()` never gates rendering.
- [ ] **`Nav` crashes if `usePathname()` null** — `frontend/components/nav.tsx:20`. `pathname.startsWith(href)` unguarded (AppShell uses `?.`).
- [ ] **Stale-response races in paginated stores** — `frontend/store/appointments.ts`, `store/calls.ts`, `store/patients.ts`. `refresh()` has no request-sequence guard; old slow response overwrites newer; cached `lastKey` then blocks corrective refetch.
- [ ] **Calls search is a silent no-op** — `frontend/store/calls.ts:60,77`. `q`/`setQuery` exist but never sent to backend.
- [ ] **Broken search hand-off + pagination** — `frontend/components/appointments/AppointmentsPageClient.tsx:40-44,90-97`, `components/patients/PatientsPageClient.tsx`. `?search=` read once from `window.location` via ref → ignored on client nav from GlobalSearch. `hasNext` uses unfiltered server `count` while table shows client-filtered rows.
- [ ] **FAQ create/edit shows stale data ~8s** — `frontend/store/faqs.ts:123,136`. Post-mutation `refresh()` skipped by cache TTL (`lastFetchedAt` not invalidated).

## Frontend — LOW
- [ ] **Lint error**: `frontend/app/debug/data/page.tsx:48` — setState synchronously in useEffect (only hard error; rest are unused-import warnings).
- [ ] **Plaintext password inputs** — `frontend/app/users/page.tsx:136,169,174`, `app/debug/auth/page.tsx:45` omit `type="password"` (shared `Input` defaults to text).
- [ ] **No unmount guard on fetch** — `frontend/components/StatusPageClient.tsx:29-36` (setState-after-unmount).
- [ ] **`signup` → `/login?registered=1` flag never read** — no "account created" confirmation.
- [ ] **Dead/misleading config** — `frontend/app/config/env.ts` `AUTH_MODE:"token"` vs authApi `"cookie"`, `TOKEN_KEY:"auth_token"` vs real `"auth-token"`; `frontend/lib/local-auth.ts` plaintext passwords in module Map (unused).

**Fix-first 4:** server.ts unhandledRejection, twilioAuth URL, mock-data switch, missing auth guard.

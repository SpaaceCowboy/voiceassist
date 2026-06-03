# Changelog

Completed items from `pending-work.md`. Newest first.

## 2026-06-03 — Landing: metrics band → bento dashboard + scroll-perf pass

**Creative redesign of the metrics band.** The previous version (a uniform 2×3 grid of icon tiles) read as too plain. Replaced it with a **bento-style results dashboard** (new `frontend/components/landing/MetricsBand.tsx`) mixing tile sizes and three kinds of micro-visualisation, the pattern premium product sites use for a numbers section: a wide **hero card** (1,247 calls) with a gradient figure + an animated 7-bar weekly chart, two **radial progress rings** for the percentages (94.2% / 38%) whose arc fills in sync with the count-up, two compact stat cards, and a wide **after-hours card** (312) with an animated SVG **sparkline** (`pathLength`-normalised stroke-draw). Every card carries an emerald **trend delta** (↑/↓ vs last week) and lifts on hover. All charts animate in on scroll via the existing IntersectionObserver `active` flag + count-up hook, and are neutralised under `prefers-reduced-motion`.

**Scroll smoothness.** Addressed jank from the classic compositor offenders: the nav's `backdrop-filter` blur (trimmed 12→10px and isolated onto its own layer with `translateZ(0)` so it no longer forces a full-page repaint while scrolling), the fixed `body::before` ambient gradient (promoted to its own layer), and the hero's `blur-3xl` glow (layer-isolated). Also **gated the hero `DashboardFrame`'s infinite typewriter + waveform loops** behind an IntersectionObserver so they pause when scrolled out of view, freeing the main thread for the rest of the page. (Note: `next dev` in Docker is inherently jankier than a production build — a `next build` will be smoother still.)

- **`frontend/components/landing/MetricsBand.tsx`** (new) — the bento band: `HeroCard`/`Ring`/`CompactCard`/`WideCard` + `BarChart`/`Sparkline`/`Trend`/`IconPill`/`Tile` helpers.
- **`frontend/components/landing/Landing.tsx`** — imports `MetricsBand`; removed the old inline band; nav blur isolated + transition narrowed; hero glow layer-isolated; pruned now-unused imports.
- **`frontend/components/landing/DashboardFrame.tsx`** — visibility-gated `active` (IntersectionObserver) pauses the typewriter + waveform off-screen.
- **`frontend/app/globals.css`** — `body::before` promoted to its own compositor layer.

## 2026-06-03 — Landing: metrics band redesign + real feature mock-ups + polish

Reworked the two weakest sections flagged from screenshots. **Metrics band** (`MetricsBand`): was a flat slab with six stats crammed in one row (numbers like "11.4 hrs" / "2m 14s" wrapping unevenly) floating above dead space. Rebuilt as a structured card — a live-context header ("The week your front desk just had · Across 40+ pilot clinics · last 7 days"), a soft accent radial wash, and a balanced **2×3 grid of inset tiles**, each with its own accent glyph (phone/bolt/transfer/clock/activity/moon), a `whitespace-nowrap` count-up number, and a label. Tiles lift + the glyph scales on hover; count-up-on-scroll preserved. **Feature deep-dive** ("Everything the assistant does, in plain sight"): the previews were deliberate but empty-looking grey **skeleton** placeholders. Replaced with four **real, feature-specific mini-UIs** built from existing seed data — a live-call card (animated waveform + transcript + "Booked" chip), a scheduling day-strip with an availability/booked slot list, a recognised-patient profile card, and an FAQ chat (question → answer bubble + "Resolved · no transfer"). Cards lift on hover. Added an `equalize` keyframe for the CSS waveform.

Verified: frontend `tsc --noEmit` clean · `eslint` clean (only pre-existing warnings) · live page returns 200 and renders with the changes.

- **`frontend/components/landing/FeatureMocks.tsx`** (new) — `FeatureMock` switchboard + the four feature mock-ups (`CallsMock`/`SchedulingMock`/`PatientsMock`/`FaqMock`), `MiniWave`, `Tile`, `Chip` helpers.
- **`frontend/components/landing/Landing.tsx`** — redesigned `MetricItem`/`MetricsBand` (icon tiles, header, glow), removed the old skeleton `FeaturePreview`, `FeatureDeepDive` now renders `FeatureMock`; imported the metric glyphs.
- **`frontend/tailwind.config.js`** — added the `equalize` keyframe + `animate-equalize` utility.

## 2026-06-03 — Claymorphism landing page rebuilt (light + dark, real seed data)

Full rework of the `/` landing page to a brief-grade standard, replacing the first-pass version. Starts from a documented token extraction (`design-tokens.md`) and a `landing-plan.md`. Key fixes over the first pass: a **tuned (not maximal) Claymorphism recipe** re-derived for the dashboard's cool/violet palette, with a **correct dark mode** (surface lifted above the page bg, faint 0.05 top highlight, stronger underside, light-catching rim) implemented as CSS vars that flip on `.dark` — never inverted. One accent (violet) site-wide; category tints confined to the simulated dashboard frame only. Eleven sections with **real copy + seed data, zero placeholders** (Sarah Chen / Marcus Reyes …, metrics 1,247 · 94.2% · 312 …, the Dr. Patel reschedule transcript, regional clinic logos). Hero ships a cohesive **DashboardFrame** (live-call waveform, typing transcript, count-up metrics, recent callers). Motion via **GSAP + ScrollTrigger**: hero entrance timeline, scroll reveals, **magnetic + press-squish** primary CTA, card-hover lift, metric **count-up on scroll-in**, 2 idle-float blobs — all wrapped in `gsap.matchMedia` with a complete reduced-motion fallback (no loops, count-ups show finals). Also **loaded Inter + JetBrains Mono via `next/font`** (they were named in tokens but never loaded) and exempted `/` from the auth middleware so the public page renders.

Verified: `tsc --noEmit` clean · `eslint` clean · `next build` green with `/` **static** · prod-server smoke test returns **200** with all seed content in the SSR HTML.

- **`design-tokens.md`, `landing-plan.md`** (repo root) — extracted token source-of-truth + masterpiece plan.
- **`frontend/app/layout.tsx`** — `next/font` Inter + JetBrains Mono wired to `--font-inter` / `--font-jbmono`.
- **`frontend/app/globals.css`** — retuned clay kit (`--clay-bg/-surface/-border/-shadow/-shadow-hover/-shadow-pressed`, light+dark) + font vars consume next/font; `.clay-press` baseline.
- **`frontend/tailwind.config.js`** — `shadow-clay*`, `rounded-clay*`, `bg-clay-*` utilities.
- **`frontend/middleware.ts`** — `/` added to the public allowlist (was redirecting to `/login`).
- **`frontend/components/landing/`** — `Landing.tsx` (nav + 11 sections + GSAP), `DashboardFrame.tsx`, `primitives.tsx` (ClayCard/Pill/Button/Wordmark/ThemeButton/SectionHeading), `hooks.ts` (count-up, typewriter, reduced-motion, dark, scrolled), `data.ts`. Removed the first-pass `clay.ts` + `VoiceOrb.tsx`.

- **`frontend/package.json`** — added `gsap` + `@gsap/react`.
- **`frontend/app/page.tsx`** — replaced the login redirect with the `Landing` render + page metadata.
- **`frontend/app/globals.css`** — added the Claymorphism utility kit (`.clay`, `.clay-sm`, `.clay-blob`, `.clay-press`) driven by `--clay-tint`/`--clay-hl`/`--clay-carve` CSS vars with light/dark variants.
- **`frontend/tailwind.config.js`** — added clay border radii and ambient keyframes (`float`, `float-slow`, `ping-ring`, `shimmer`).
- **`frontend/components/AppShell.tsx`** — `/` now renders full-bleed (bypasses the dashboard sidebar), alongside the existing auth routes.
- **`frontend/components/landing/`** — new `Landing.tsx`, `VoiceOrb.tsx`, `clay.ts` (tint helper + brand palette).

## 2026-06-02 — Response latency overhaul

Driven by analysis of two real test calls (~3.6–4s end-of-speech → first-audio). Attacks the serial debounce → Claude → TTS pipeline.

- **Claude → TTS token streaming** — `backend/src/services/llm.ts`, `backend/src/services/conversation.ts`, `backend/src/routes/twilio.ts`. `chat`/`continueAfterFunctionCall` now accept an optional `onTextDelta` and use `anthropic.messages.stream()`. `processInput` threads an `onText` callback (and emits canned goodbye/transfer/fallback strings through it when the model produced no text of its own). The route's new `createSentenceSpeaker` detects sentences in the delta stream, kicks off TTS per sentence immediately (parallel generation) but sends audio strictly in order — so the first sentence plays while the rest is still generating, instead of waiting for the full completion.
- **Anthropic prompt caching** — `backend/src/services/llm.ts`, `backend/src/functions/tools.ts`. Tool definitions and the static portion of the system prompt are marked with `cache_control: ephemeral`. System prompt split into `SYSTEM_PROMPT_STATIC` (cacheable) + a per-call dynamic context block via new `getSystemPromptBlocks`; the last tool carries a cache breakpoint. Cuts repeated input-token processing every turn (and every tool-loop hop).
- **Adaptive debounce** — `backend/src/routes/twilio.ts`. Lowered base debounce 1500ms → 800ms, and 300ms when the buffered utterance already ends in sentence-final punctuation (likely complete). Removes most of the fixed dead-air on idle turns while still merging split STT fragments.
- **Barge-in on final transcripts** — `backend/src/routes/twilio.ts`. A qualifying final transcript arriving while the assistant is speaking now sends a `clear` event and stops playback, covering finals that arrive without a qualifying interim. Speaking state is set up front so a barge-in can interrupt mid-generation too.
- **Tighter responses + abuse handling** — `backend/src/functions/tools.ts`. System prompt now targets one sentence (two max), one question at a time, and adds a rule to stay professional / never repeat profanity / offer transfer on continued abuse.

Verified: `cd backend && npm run typecheck`; `cd backend && npm run build`. Live Twilio call testing still needed (streaming audio ordering, barge-in timing).

## 2026-06-02 — Patients page lists all patients on load (frontend-only)

The Patients page was blank on arrival because it never called the API until you typed — the backend `/api/patients/search` rejects an empty `q` with a 400. Rather than reintroduce the `GET /api/patients` browse route (removed 2026-05-31 under the frontend-only mandate), this lists everyone with **no backend change**: when the search box is empty the store now sends `q="%"`. The backend builds its filter as `ILIKE '%<q>%'` without escaping wildcards, so `"%"` becomes `"%%%"` and matches every patient. Verified live against the running stack: `?q=%` returns all 20 seeded patients (200); typed searches still work. Frontend `tsc --noEmit` clean.

- **`frontend/store/patients.ts`** — removed the empty-query early-return; added a `MATCH_ALL_QUERY = "%"` sentinel used when `q` is blank so `refresh()` always fetches.
- **`frontend/components/patients/PatientsPageClient.tsx`** — dropped the `!q.trim()` render gate so the table shows on load; the dashed empty state now appears only on a genuine zero-result set, with copy that distinguishes "no match for X" from "no patients found".

## 2026-06-01 — Assistant backend hardening

- **Atomic AI appointment booking** — `backend/src/services/conversation.ts`. `book_appointment` now validates appointment date/time, requires a known patient name, takes a per-slot Postgres advisory transaction lock, rechecks blocked times/capacity, inserts the appointment, increments patient stats, and links the call log in one transaction.
- **Tool call history persistence** — `backend/src/services/conversation.ts`, `backend/src/services/llm.ts`. Assistant tool-use messages and tool results are now stored in Redis session history and passed back to Claude on continuation turns, so later turns retain the exact checked/booked context.
- **Schema-validated assistant tools** — `backend/src/functions/tools.ts`. Added Zod validation for every tool's arguments, including date/time formats, enums, email format, string bounds, unknown-key rejection, and typed boolean handling.
- **Caller ownership checks** — `backend/src/services/conversation.ts`. Reschedule and cancel tool handlers now require the target appointment to belong to the current caller's patient record before mutating it.
- **Voice stream resilience** — `backend/src/routes/twilio.ts`. Added bounded STT fragment/debounce buffers, transcript queue caps, Deepgram live transcription restart attempts, and a staff-transfer fallback when STT remains unavailable.
- **Safer Redis session metrics** — `backend/src/config/redis.ts`, `backend/src/routes/twilio.ts`, `backend/src/services/conversation.ts`. Session updates now use Redis WATCH/MULTI retry logic, with dedicated append/increment helpers for response times, tool calls, STT confidence, LLM calls, and TTS chunks to reduce lost updates from concurrent async paths.
- **Provider clarity** — `backend/src/services/conversation.ts`, `backend/src/server.ts`. Conversation turns now import `llmService` directly while call summaries/intent/sentiment use `analysisService`; startup also requires `ANTHROPIC_API_KEY` because Claude is the active conversational LLM.
- **Tests updated** — `backend/src/functions/tools.test.ts`, `backend/src/services/conversation.test.ts`. Adjusted coverage for strict tool argument validation, persisted tool messages, and atomic metric helpers.

Verified: `cd backend && npm run typecheck`; `cd backend && npm test` (255 tests).

## 2026-05-31 — Reverted all backend changes (frontend-only mandate)

Per the user's directive to keep this project **frontend-only**, every backend edit made earlier today was reverted (`backend/**` restored to its committed state) and the dependent frontend was reworked to match. Verified: frontend `tsc` + `build` (24/24) + lint 0 errors; `backend/` git-clean.

- **Users member management — removed.** The `/auth/users` routes are gone; `frontend/app/users/page.tsx` is back to create-member + change-own-password forms plus a "Member directory (backend needed)" placeholder; `frontend/lib/api/usersApi.ts` restored.
- **Patients browse — removed.** The `GET /api/patients` route is gone; `frontend/store/patients.ts` + `components/patients/PatientsPageClient.tsx` are back to **search-only** (the list stays empty until you type a name/phone); `listPatients` removed from `lib/api/voiceAssistantApi.ts`.
- **Status board** dropped the now-nonexistent `/api/patients` entry and resolves its patient sample via `/api/patients/search`.

Everything else from today remains (all frontend): design-system retune, detail-page rebuilds, dashboard hub, status board, nav grouping, analytics date range, calls/appointments filters, local-dev proxy fallback.

## 2026-05-31 — Nav grouping, analytics date range, list filters, Users polish

Frontend-only information-architecture pass (no backend changes).

- **Grouped navigation** — `frontend/components/nav.tsx`. Sidebar split into Operations (Appointments/Patients/Calls), Insights (Analytics), Knowledge (FAQs) and System (Sessions/Status/Users) with section headers; nav area made scroll-safe.
- **Analytics date range** — `frontend/store/analytics.ts`, `lib/api/voiceAssistantApi.ts`, `components/analytics/AnalyticsPageClient.tsx`. 7d/30d/90d presets + custom start/end pickers wired to the existing `start_date`/`end_date` params the analytics endpoints already accept.
- **Calls filters + pagination** — `frontend/components/calls/list/CallsFiltersBar.tsx`, `components/calls/CallsPageClient.tsx`. Added an outcome filter (client-side) and pause server pagination while a search/filter narrows the current page (prevents misleading "Next" jumps). Same pagination guard added to `components/appointments/AppointmentsPageClient.tsx`.
- **Users page** — `frontend/app/users/page.tsx`. Added an honest "Member directory" placeholder that states listing/role-management needs a backend `GET /api/users` endpoint, so the page no longer looks half-finished.

## 2026-05-31 — Status board, Dashboard hub, local-dev proxy fix

- **Local dev login fixed** — `frontend/app/api/backend/[...path]/route.ts` read `BACKEND_BASE_URL` with no fallback, so running the frontend locally (backend in Docker on host `4001`) 500'd with "BACKEND_BASE_URL not set". Added a fallback to `http://localhost:4001` (canonical host port per `docker-compose.yml`) and set `BACKEND_BASE_URL` in `frontend/.env` (also corrected the stale `NEXT_PUBLIC_API_URL` `4000`→`4001`).
- **Status page → full API health board** — `frontend/app/api/status/run/route.ts` now catalogues every backend endpoint (System/Auth/Appointments/Patients/Calls/Analytics/Sessions/FAQs) with method, path, auth level (public/authenticated/moderator) and a description. It health-checks only safe read endpoints (resolving real sample IDs for by-id routes) and never hits mutating ones. `frontend/components/StatusPageClient.tsx` groups results by domain and gives each a plain-language interpretation (401 → "auth failed", 403 → "needs moderator" / "already set up", 404 → "no sample data", 5xx → "reachable but failing", network → "backend not connected", 2xx+empty → "connected but no data yet"), with per-endpoint latency and a collapsible response preview.
- **Dashboard → command center** — `frontend/app/dashboard/page.tsx`. Removed the duplicated analytics charts (they live on `/analytics`) and refocused the page on quick access: prominent global search, a compact 4-KPI pulse (numbers only), a quick-access tile grid linking to every section, and "Today's appointments" + "Recent calls" activity lists. A "Full analytics →" link points to the deep charts.

## 2026-05-31 — Dashboard UI/UX overhaul

Restyled every dashboard page on a shared design system and made the Patients page actually usable. Verified with frontend typecheck + lint (0 errors) + `next build` (24/24 routes) and backend typecheck.

- **Design system retune (light + dark)** — `frontend/app/globals.css`, `frontend/tailwind.config.js`, `frontend/app/layout.tsx`. Calm, low-fatigue palette: no pure black/white (dark `#121419` bg / `#1c1f26` cards, light `#f6f7f9` bg), refined violet accent (violet-600 light / violet-400 dark), `color-scheme` so native selects/scrollbars follow the theme, themed scrollbars, accent selection + focus rings, subtle ambient accent glow, font-smoothing + system/Inter font stack, and an inline **anti-FOUC theme script** to kill the light/dark flash on load. Tokens exposed as Tailwind utilities (`bg-surface`, `text-muted`, `border-border`, `shadow-sm/md`).
- **New shared UI primitives** — `frontend/components/ui/PageHeader.tsx`, `StatusPill.tsx` (semantic tone mapping + dot), `Field.tsx` (`Field`/`FieldGrid`/`Avatar`), upgraded `Button.tsx` (sizes, icons, link/`href`, `outline`/`subtle` variants), expanded `icons.tsx` (nav + action glyphs), `components/auth/AuthBrand.tsx`.
- **Detail pages rebuilt** — `AppointmentDetailClient.tsx` (fixed broken field bindings that rendered every value as `—`: it read `date`/`time`/`provider_name` instead of `scheduled_time`/`provider`/`type`; now a 2-column layout with patient hero, schedule grid, status panel, record meta), `patients/details/*` (profile shows all fields in view mode + avatar; history uses shared `StatusPill`/`TableShell`), `calls/details/CallDetailClient.tsx` + `CallMetaCard.tsx`.
- **Nav + chrome** — `components/nav.tsx` (icons per item, active accent bar, NeuroSpine brand mark), `themeToggle.tsx` (sun/moon segmented switch), `AppShell.tsx` (max-width content + page fade-in), `Card.tsx` (soft elevation).
- **List pages standardized** on `PageHeader` + shared pills/buttons + formatted dates — appointments, patients, calls, analytics, sessions, faqs, status, users, and the login/signup/forgot auth screens.
- **Patients table polish (frontend-only)** — `frontend/components/patients/list/PatientsTable.tsx` switched to the shared `TableShell`/`Button` and fixed the `preferred_language` snake-case mapping. (Note: a browse-all backend route was added then later reverted under the frontend-only mandate — see the top entry. The Patients list remains search-only.)

## 2026-05-30 — Dashboard & analytics data visualization overhaul

Rebuilt how the dashboard surfaces data: replaced bland text rows / empty tables with a dependency-free SVG/CSS chart layer (no new npm deps, so the Docker `next build` stays safe). Verified with frontend typecheck, lint, and `next build` (all clean).

- **New viz layer** — `frontend/lib/format.ts` (number/duration/percent/hour formatters so raw Postgres aggregate strings render cleanly), `frontend/components/ui/charts.tsx` (`KpiCard`, `BarList`, `HourBars`, `Donut`, `StatRing`, `ChartCard`, theme-token aware), `frontend/components/ui/icons.tsx` (inline icon set).
- **Dashboard redesigned** — `frontend/app/dashboard/page.tsx`. KPI cards with icons/sub-stats, call-completion ring + avg duration, appointment-status donut, top-intents bar list, and a 24-hour busy-hours bar chart with peak callout.
- **Analytics page fixed + redesigned** — fixed three broken field bindings that showed empty/`—` data: `OverviewCards` read flat `total_calls/transfers/failures` instead of the backend's nested `calls.{…}`/`appointments.{…}`; `HourlyTable` read `calls/appointments/transfers` instead of `call_count`; `IntentsTable` read a never-returned `avg_duration_seconds`. Replaced tables with charts and added a **call-performance panel** (avg/p95 response time, STT confidence gauge, low-confidence rate, tool-usage bars) sourced from `GET /api/analytics/metrics`.
  - `frontend/components/analytics/AnalyticsPageClient.tsx` · `overview/OverviewCards.tsx` · `intents/IntentsTable.tsx` · `hourly/HourlyTable.tsx` · `metrics/MetricsPanel.tsx` · `store/analytics.ts` · `lib/api/voiceAssistantApi.ts` · `lib/types.ts`
- **Sessions stat cards** unified onto the new `KpiCard` for visual consistency — `frontend/components/sessions/stats/SessionsStatsCards.tsx`.

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

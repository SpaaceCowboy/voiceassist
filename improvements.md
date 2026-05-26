# Improvements Log

Completed improvements, newest first.

## 2026-05-27 — LLM Latency: Switch to Claude Haiku for Real-Time Conversation

**Problem:** Claude Sonnet responses took 1.7-3.5s per turn, which is the biggest contributor to perceived latency in the voice conversation (more than TTS).

**Solution:** Switched the default real-time conversation model from `claude-sonnet-4-6` to `claude-haiku-4-5`, which should roughly halve response times (~0.8-1.5s). Sonnet can still be used by setting `LLM_MODEL=claude-sonnet-4-6` env var. Post-call analysis (summary, intent, sentiment) stays on `gpt-4o-mini` — unaffected.

**Files changed:**
- `backend/src/services/llm.ts` — changed default MODEL from `claude-sonnet-4-6` to `claude-haiku-4-5`

## 2026-05-27 — Utterance Debounce: Merge Split Transcripts

**Problem:** When a caller pauses mid-sentence (e.g. "On Friday," ... "May 9."), Deepgram's `utterance_end_ms: 1000` fires two separate final transcripts. Each triggered its own LLM round trip, wasting time and confusing context (the LLM got "On Friday," alone without the date).

**Solution:** Added a 1.5s debounce buffer. When a final transcript arrives and the system is idle, it's buffered for 1.5s. If another transcript arrives within that window, they're merged into a single input. If the system is already processing (busy), the debounce is skipped and transcripts queue immediately to avoid stacking delays. Buffer is cleared on call end.

**Files changed:**
- `backend/src/routes/twilio.ts` — added `debounceTimer`, `debounceBuffer`, `DEBOUNCE_MS` with merge logic in `onTranscript` and cleanup in `stop` event

## 2026-05-27 — TTS Pre-Warm Cache for Common Phrases

**Problem:** Common assistant phrases ("Let me check availability for you.", "Thank you for calling. Goodbye.", etc.) were generated fresh on the first call after deploy, adding 1-3s latency for each.

**Solution:** Added `prewarmCache()` to the TTS service with 12 common phrases. Called at server startup (non-blocking). Phrases that are already cached (from the 24h Redis TTL) are skipped. This means the first call after deploy gets instant TTS for predictable responses.

**Files changed:**
- `backend/src/services/tts.ts` — added `COMMON_PHRASES` array and `prewarmCache()` function
- `backend/src/server.ts` — import `ttsService`, call `prewarmCache()` after listen

## 2026-05-27 — Deepgram Model: nova-2-medical

**Problem:** General `nova-2` model misheard medical terms and location names on 8kHz phone audio (e.g. "back pain" → "back panel", "Palmdale" → "Palmville").

**Solution:** Switched Deepgram live transcription model from `nova-2` to `nova-2-medical`, which is optimized for medical vocabulary. Same pricing tier — zero cost increase.

**Files changed:**
- `backend/src/services/deepgram.ts` — changed model from `nova-2` to `nova-2-medical`

## 2026-05-27 — Barge-In Noise Filter

**Problem:** Breath sounds and ambient noise triggered false barge-in, causing the assistant to stop speaking mid-sentence. Deepgram would pick up sounds like "The", "the." with medium confidence (0.53-0.72) and both interim and final transcript handlers would clear audio.

**Solution:** Two filters:
1. Interim barge-in now requires 2+ words and 5+ chars before clearing audio
2. Final transcripts of 1-2 short words (under 8 chars) while the assistant is speaking are silently discarded

**Files changed:**
- `backend/src/routes/twilio.ts` — added word count/length checks in `onInterim` and `onTranscript` handlers

## 2026-05-26 — Transcript Queue

**Problem:** The `isProcessing` flag silently dropped any caller speech that arrived while the assistant was processing a previous response. If the caller spoke during the LLM + TTS cycle (~5-10s), their input was lost entirely.

**Solution:** Replaced the `isProcessing` boolean gate with a `transcriptQueue` array and `drainQueue()` loop. When a transcript arrives during processing, it's queued instead of dropped. After the current response finishes, the queue drains automatically — each queued transcript is processed sequentially with barge-in clearing any in-progress audio.

- Extracted `handleTranscript()` for single-transcript processing (LLM → TTS → send)
- `drainQueue()` runs the queue sequentially, checking `callEnded` between items
- Logged as `"Transcript queued"` when busy, `"Processing queued transcript"` when draining
- No risk of parallel LLM calls — the queue is drained serially

**Files changed:**
- `backend/src/routes/twilio.ts` — replaced `isProcessing` gate with `transcriptQueue` + `drainQueue()` + `handleTranscript()`

## 2026-05-26 — TTS Caching

**Problem:** Identical phrases (greetings with the same patient name, retry prompts, goodbye responses) were regenerated via OpenAI TTS on every call, wasting ~1-5s and API credits each time.

**Solution:** Added a Redis-backed cache layer in `textToSpeech()`. Before calling OpenAI, the text is hashed (SHA-256 of provider + voice + model + cleaned text) and checked against Redis. Cache hits return the stored mulaw buffer instantly. Misses generate normally and store the result with a 24-hour TTL.

- Cache is transparent — all callers of `textToSpeech()` benefit automatically (greeting, streaming chunks, etc.)
- Cache errors are silently ignored (non-critical path)
- Key includes provider/voice/model so changing TTS config doesn't serve stale audio
- Mulaw buffers are small (~8KB per second of audio), so Redis storage is minimal

**Files changed:**
- `backend/src/services/tts.ts` — added `getCached()`, `setCache()`, `getCacheKey()`, cache check in `textToSpeech()`

## 2026-05-26 — Streaming TTS

**Problem:** Caller heard nothing for 2-5s while the full TTS response was generated. `processInput` waited for the entire audio buffer before sending any audio.

**Solution:** Moved TTS out of `processInput` (conversation service) into the route layer. Text is split into sentences via `splitTextForStreaming`, TTS is fired concurrently for all sentences, and each chunk is sent to the caller as soon as it's ready. First sentence audio arrives in ~1-2s instead of waiting for the full response.

- Single-sentence responses fall back to the original single-call path (no overhead)
- `callEnded` guard checks before each chunk to prevent post-hangup waste
- `processInput` now returns text + control signals only; route layer owns audio generation

**Files changed:**
- `backend/src/services/conversation.ts` — removed TTS generation and `isActive` param
- `backend/src/routes/twilio.ts` — added `streamTTSResponse()`, imported `ttsService`
- `backend/src/services/conversation.test.ts` — updated tests for new TTS-free processInput

## 2026-05-26 — STT Confidence Threshold + Fragment Buffering

**Problem:** Low-confidence Deepgram transcripts (0.29-0.43) fed garbage to Claude, causing repeated identical tool calls. Additionally, Deepgram sometimes splits sentences into fragments where the first word has low confidence (e.g. "Can" at 0.50 + "we move it..." at 1.0).

**Solution:** Transcripts below 0.6 confidence are buffered (not dropped). When the next good-confidence transcript arrives, the buffer is prepended to form the complete sentence.

**Files changed:**
- `backend/src/routes/twilio.ts` — `pendingFragment` buffer, `MIN_CONFIDENCE` threshold

## 2026-05-26 — Duplicate Tool Call Detection

**Problem:** Claude got stuck calling the same tool with identical args up to 5 times in a row (the max loop limit), wasting ~6.5s of API time per loop. Additionally, Claude called `transfer_to_staff` 5 times with slightly different `notes` text — same tool, same intent, but different args so the exact-match check didn't catch it (23.6s wasted).

**Solution:** Two-layer detection:
1. Exact match: track `lastToolKey` (tool name + serialized args). If identical back-to-back, break the loop with a retry prompt.
2. Per-tool count: track how many times each tool name is called via `toolCallCounts` map. If any tool is called more than twice in one turn, break the loop.

**Files changed:**
- `backend/src/services/conversation.ts` — `lastToolKey` comparison + `toolCallCounts` map in tool loop

## 2026-05-26 — Post-Hangup TTS Prevention

**Problem:** When caller hung up mid-processing, TTS still generated (wasting ~4s of OpenAI API time) and `addMessage` hit a non-existent Redis session.

**Solution:** Two-layer guard:
- Route layer: `callEnded` flag set on WebSocket `stop` event; checked before sending audio and in `streamTTSResponse` before each chunk
- Conversation service: (previously had session-alive Redis check, now removed since TTS moved to route layer)

**Files changed:**
- `backend/src/routes/twilio.ts` — `callEnded` flag, guards in `onTranscript` and `streamTTSResponse`

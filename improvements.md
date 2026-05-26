# Improvements Log

Completed improvements, newest first.

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

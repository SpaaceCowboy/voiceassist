# Improvements Log

Completed improvements, newest first.

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

**Problem:** Claude got stuck calling the same tool with identical args up to 5 times in a row (the max loop limit), wasting ~6.5s of API time per loop.

**Solution:** Track `lastToolKey` (tool name + serialized args) across loop rounds. If Claude calls the same tool with the same args back-to-back, break the loop and respond with a retry prompt.

**Files changed:**
- `backend/src/services/conversation.ts` — `lastToolKey` comparison in tool loop

## 2026-05-26 — Post-Hangup TTS Prevention

**Problem:** When caller hung up mid-processing, TTS still generated (wasting ~4s of OpenAI API time) and `addMessage` hit a non-existent Redis session.

**Solution:** Two-layer guard:
- Route layer: `callEnded` flag set on WebSocket `stop` event; checked before sending audio and in `streamTTSResponse` before each chunk
- Conversation service: (previously had session-alive Redis check, now removed since TTS moved to route layer)

**Files changed:**
- `backend/src/routes/twilio.ts` — `callEnded` flag, guards in `onTranscript` and `streamTTSResponse`

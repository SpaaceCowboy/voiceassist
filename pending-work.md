# Pending Work

Backend improvements, prioritized. Move items to `changelog.md` as they are completed.

## HIGH
- [ ] **Streaming TTS** — Start sending audio chunks to caller while TTS is still generating. Current flow waits for full TTS completion (~2-5s) before any audio plays. Stream in chunks to cut perceived latency in half.
- [x] **TTS caching** — Cache common/repeated phrases (greeting, "could you repeat that?", goodbye) in Redis to skip redundant OpenAI TTS calls. Saves ~2s on greetings and reduces API costs.
- [ ] **Transcript queue** — Replace `isProcessing` flag with a queue so caller input during assistant response is buffered and processed next, not silently dropped.

## MEDIUM
- [ ] **Doctor name fuzzy matching** — Deepgram transcribes "Kamran" as "Cameron" at high confidence. Add Levenshtein/fuzzy matching against known doctor names in tool execution so availability checks and rescheduling still resolve correctly.
- [ ] **Call analytics metrics** — Log aggregate metrics (avg response time, tool loop frequency, confidence distribution, tool usage breakdown) for dashboard visibility without digging through raw logs.

## LOW
- [ ] **Emoji logger** garbles non-UTF terminals — `backend/src/utils/logger.ts:24`.
- [ ] **`appointmentModel.modify`/`cancel` allow arbitrary status transitions** — add state-machine.

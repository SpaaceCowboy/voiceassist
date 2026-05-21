# Pending Work

Backend audit findings, prioritized. Move items to `changelog.md` as they are completed.

## CRITICAL
(all complete — see changelog.md)

## HIGH
(all complete — see changelog.md)

## MEDIUM
- [ ] **Hot-row UPDATE on every FAQ match** — `backend/src/models/faq.ts:237`. Now fire-and-forget, but still one UPDATE per match. Real fix is batching (in-memory counter flushed periodically) or a side table.

## LOW
- [ ] **Delete `backend/BUGFIX_REPORT.md` and `backend/test.md`** — internal history shipped in repo.
- [ ] **Emoji logger** garbles non-UTF terminals — `backend/src/utils/logger.ts:24`.
- [ ] **Typos in comments** — "Transfering" in `backend/src/routes/twilio.ts:366`, "validate inputys".
- [ ] **`/api/sessions/cleanup` unvalidated `hours` query** — `backend/src/routes/api.ts:944`.
- [ ] **`appointmentModel.modify`/`cancel` allow arbitrary status transitions** — add state-machine.
- [ ] **Unused `notes` param in `handleTransfer`** — `backend/src/services/conversation.ts:699`.

# Pending Work

Backend audit findings, prioritized. Move items to `changelog.md` as they are completed.

## CRITICAL
(all complete — see changelog.md)

## HIGH
(all complete — see changelog.md)

## MEDIUM
- [ ] **Hot-row UPDATE on every FAQ match** — `backend/src/models/faq.ts:237`. Now fire-and-forget, but still one UPDATE per match. Real fix is batching (in-memory counter flushed periodically) or a side table.

## LOW
- [ ] **Emoji logger** garbles non-UTF terminals — `backend/src/utils/logger.ts:24`.
- [ ] **`appointmentModel.modify`/`cancel` allow arbitrary status transitions** — add state-machine.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Monorepo for NeuroSpine Institute's AI voice assistant.

- **`backend/`** — Express + TypeScript API. Handles Twilio voice webhooks, Deepgram STT, OpenAI function-calling, TTS, and a JWT-protected dashboard REST API. See `backend/CLAUDE.md` for full architecture, layer breakdown, call flow, and env vars.
- **`frontend/`** — Next.js 16 (App Router) + React 19 + Tailwind dashboard. Talks to the backend over HTTP for appointments, patients, calls, reservations, FAQs, and status.
- **`docker-compose.yml`** — Orchestrates Postgres 16, Redis 7, backend (port `4001→3000`), and frontend (port `3001→3000`) for local dev. Backend depends on healthy Postgres and Redis. Migrations in `backend/migrations/` are auto-applied via Postgres init scripts on first volume creation.
- **`.env`** at repo root supplies `DB_USER`/`DB_PASSWORD`/`DB_NAME` for compose and is mounted into the backend container.

## Common Commands

```bash
docker compose up --build       # Full stack (db + redis + backend + frontend)

# Backend (cd backend/)
npm run dev                     # nodemon src/server.ts
npm run build && npm start      # Compile + run dist/server.js
npm run lint                    # ESLint
npm run typecheck               # tsc --noEmit
npm test                        # vitest run
npm run test:watch              # vitest watch
npx vitest run path/to/file.test.ts   # single test file

# Frontend (cd frontend/)
npm run dev                     # next dev
npm run build                   # next build
npm run lint                    # eslint
```

## Frontend Architecture Notes

- **App Router** under `frontend/app/` — route groups like `(auth)`, feature folders (`appointments/`, `calls/`, `patients/`, `reservations/`, `faqs/`, `status/`, `dashboard/`, `config/`, `debug/`).
- **State**: Zustand stores in `store/` (`auth.ts`, `ui.ts`). No React Query in this project despite the global default — `lib/query.ts` and `lib/backend.ts` implement a thin fetch wrapper with `BackendError`.
- **Backend calls**: `lib/backend.ts` reads `auth-token` from `localStorage` and attaches `Authorization: Bearer …`. A `DATA_SOURCE` / `NEXT_PUBLIC_DATA_SOURCE` env switch toggles between live backend and mock data (`lib/mock-data.ts`).
- **Components** are grouped by feature (`components/appointments/`, `components/patients/`) plus shared `components/ui/`. `AppShell.tsx` + `nav.tsx` wrap pages.

## Cross-cutting Conventions

- Both packages are TypeScript-strict, Node 18+.
- Backend uses raw `pg` SQL (no Prisma) — do not introduce an ORM without discussion. See `backend/CLAUDE.md` §"Key Design Decisions".
- Backend has two auth surfaces: JWT for dashboard, HMAC-SHA1 for Twilio webhooks.
- Sessions live in Upstash Redis under `session:{callSid}`, 1h TTL.

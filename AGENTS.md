# Repository Guidelines

## Project Structure & Module Organization

This repository is split into a Next.js dashboard in `frontend/` and an Express voice-assistant API in `backend/`. Frontend routes live under `frontend/app/`, shared UI under `frontend/components/`, stores under `frontend/store/`, and client helpers under `frontend/lib/`. Backend source lives in `backend/src/`, organized by `config/`, `routes/`, `middleware/`, `services/`, `models/`, `functions/`, and `utils/`. Backend tests are colocated as `*.test.ts`. Migrations and seed data are in `backend/migrations/`.

## Build, Test, and Development Commands

Run commands from the package directory unless noted.

```bash
cd backend && npm run dev        # Start API with nodemon
cd backend && npm run build      # Compile TypeScript to dist/
cd backend && npm test           # Run Vitest test suite
cd backend && npm run typecheck  # Type-check without emitting files
cd backend && npm run lint       # Lint backend TypeScript

cd frontend && npm run dev       # Start Next.js dashboard
cd frontend && npm run build     # Build production frontend
cd frontend && npm run lint      # Run Next ESLint config
```

Use `docker-compose.yml` for stack checks.

## Coding Style & Naming Conventions

Use TypeScript throughout. Follow existing indentation: two spaces in frontend files and four spaces in backend files. Prefer named exports for shared helpers and keep modules focused by domain. React components use PascalCase names, such as `PatientsPageClient.tsx`; hooks use `useThing.ts`; stores use lowercase domain names like `appointments.ts`. Backend files use camelCase names, with tests matching the unit, like `conversation.test.ts`.

## Testing Guidelines

Backend tests use Vitest and live beside implementation files. Add or update `*.test.ts` files for service, model, middleware, and utility changes. Run `cd backend && npm test` before submitting backend logic changes, and include `npm run typecheck` for shared types or API contracts. The frontend currently has lint/build checks but no dedicated test runner; validate UI changes with `npm run lint` and `npm run build`.

## Commit & Pull Request Guidelines

Git history uses conventional-style prefixes: `fix:`, `feat:`, and `docs:`. Keep commits scoped and imperative, for example `fix: clear transcript queue on transfer`. Pull requests should include a concise summary, test results, linked issue or task, and screenshots for visible frontend changes. For voice, auth, or database behavior, document required environment variables, migrations, or Twilio/OpenAI/Deepgram impacts.

## Security & Configuration Tips

Do not commit secrets. Backend configuration depends on `.env` values such as `DATABASE_URL`, `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `TWILIO_AUTH_TOKEN`, `UPSTASH_REDIS_REST_TOKEN`, and `JWT_SECRET`. Keep `SKIP_TWILIO_VALIDATION=true` limited to local development.

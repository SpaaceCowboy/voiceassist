# Repository Guidelines

## Project Structure & Module Organization

This repository is an npm workspace containing three TypeScript applications:

- `apps/web/`: primary TermSpace Next.js application.
- `apps/blog/`: TermSpace editorial Next.js application. Routes live in `app/`, reusable UI in `components/`, and API/types/formatting helpers in `lib/`.
- `apps/api/`: shared Express REST API. Keep route definitions in `src/routes/`, request logic in `src/controllers/`, validation in `src/validation/`, and cross-cutting middleware in `src/middleware/`. Keep product and editorial domains in separate route/controller modules. Prisma schema and seed data live in `prisma/`.
- `docker-compose.yml`: local PostgreSQL 16 service, exposed on port `5433`.

Run shared checks and infrastructure commands from the repository root. Use npm workspace scripts to target an individual application.

## Build, Test, and Development Commands

Install all dependencies with `npm install` at the repository root.

- `docker compose up -d db`: start the local PostgreSQL database.
- `npm run dev:web`, `npm run dev:blog`, and `npm run dev:api`: start the main site on `3000`, blog on `3001`, or API on `4001`.
- `npm run typecheck`: type-check all workspaces.
- `npm test`: test all workspaces.
- `npm run build`: build all workspaces.
- API only: root `prisma:migrate`, `prisma:generate`, and `seed` scripts update, generate, and populate the database.

Copy each package's `.env.example` to `.env` before local development. Never commit secrets or local `.env` files.

Keep reader session cookies host-only in production; do not widen them to a
parent domain shared by sibling subdomains. Keep both frontends on
`NEXT_PUBLIC_API_URL=/backend` and route that path to the shared API so
authentication remains same-origin from each browser.

## Coding Style & Naming Conventions

Follow the existing TypeScript style: strict typing, ES modules, two-space indentation, semicolons, and double quotes. Use `PascalCase` for React components and their files (`ArticleCard.tsx`), `camelCase` for functions and variables, and descriptive suffixes such as `*Controller`, `*Routes`, and `*Manager`. Prefer the frontend `@/` alias for package-root imports. Keep route files thin and place reusable business or validation logic outside them.

## Testing Guidelines

Vitest runs automated tests in all workspaces; API tests use Supertest and frontend component tests use Testing Library with jsdom. Colocate tests as `*.test.ts` or `*.test.tsx`. Before submitting changes, run `npm run typecheck`, `npm test`, and `npm run build` from the repository root. Add regression coverage for changed API authorization, validation, and interactive UI behavior.

## Commit & Pull Request Guidelines

The repository has no commit history establishing a convention. Use concise, imperative commit subjects, optionally with a Conventional Commit prefix, for example `feat: add category filtering`. Keep commits focused. Pull requests should explain the change, list verification commands, mention schema or environment changes, link related issues, and include screenshots for visible UI changes.

## Pending Work Workflow

At the start of each task, check `pending.md` for relevant outstanding improvements before planning or editing. If a task completes an item from `pending.md`, remove that item from `pending.md` in the same change and add a dated entry to `changelog.md` describing what was completed and how it was verified. Keep `pending.md` limited to unfinished work; do not leave completed items there.

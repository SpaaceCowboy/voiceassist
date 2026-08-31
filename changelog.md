# Changelog

Project changes completed from `pending.md` should be recorded here with the date, a short summary, and any verification performed.

## 2026-08-31

- Consolidated the main TermSpace site, editorial frontend, and shared API into an npm-workspace monorepo under `apps/web`, `apps/blog`, and `apps/api`; added root commands and three-app CI coverage. Verification: root type-check, 40 tests, and production builds for all workspaces.
- Added the missing initial Prisma content migration, allowing a clean database to create authors, categories, and articles before later editorial migrations alter them.
- Added shared marketplace persistence and API routes for catalog discovery, product detail, creators, categories, versions, reviews, account favorites, and idempotent acquisition; connected the main TermSpace frontend and newsletter form to those APIs.
- Corrected both frontend API clients to prefer private `API_URL` during server rendering and browser-safe `NEXT_PUBLIC_API_URL` in client code.
- Made `/api/health` execute a database readiness query and return `503 DATABASE_UNAVAILABLE` when the shared backend loses its database.
- Added configurable `SESSION_COOKIE_DOMAIN` support and documented the sibling-subdomain deployment contract so reader login can be shared between the main site and Blog while remaining host-only in local development. Verification: all workspace type-checks and 40 tests pass.

## 2026-08-24

- Fixed markdown HTML escaping so article body rendering converts `&`, `<`, and `>` to entities before using `dangerouslySetInnerHTML`. Verification: `npm run typecheck` in `frontend/`.
- Added token-based admin authentication for the `/admin` UI, protected backend article/category write routes, and required admin authorization for draft article listing. Verification: `npm run prisma:generate` and `npm run typecheck` in `backend/`; `npm run typecheck` in `frontend/`.
- Hid unpublished article detail pages from public requests while still allowing authenticated admin edit fetches. Verification: `npm run typecheck` in `backend/` and `frontend/`.
- Set `publishedAt` automatically when creating or first publishing an article, while preserving existing publish dates when articles are unpublished. Verification: `npm run typecheck` in `backend/`.
- Added persistent newsletter signup with a Prisma subscriber model, backend subscription endpoint, and frontend form submission. Verification: `npm run prisma:generate` and `npm run typecheck` in `backend/`; `npm run typecheck` in `frontend/`.
- Added rendered markdown preview support to the article editor. Verification: `npm run typecheck` in `frontend/`.
- Added admin article search, status/category filters, sorting, and pagination backed by the existing article list API. Verification: `npm run typecheck` in `frontend/`.

## 2026-08-25

- Added a self-hosted English editorial type system using Manrope for interface/body text and Newsreader for headings and long-form prose; both are SIL OFL 1.1 licensed.
- Replaced the partial Persian pathname checks with a centralized `next-intl` message provider, persistent locale-aware public links, complete RTL document/prose rules, and localized public error, topic, tag, series, card, newsletter, and hero UI. Verification: frontend type-check, 8 tests, and production build.
- Replaced the Persian system-font fallback with the self-hosted Estedad variable family, an OFL-licensed geometric Persian typeface, across RTL body, display, and label typography.
- Added Persian as a public locale under `/fa`, including RTL document layout, localized navigation, editions, journal controls, resources, reader accounts, library, newsletter, comments, current-edition metadata, featured article metadata, language switching, and explicit English article-body fallbacks.
- Added numbered editorial editions with admin composition, ordered article selections, cover imagery, editor notes, per-edition accent palettes, a public archive, and a redesigned current-edition homepage experience.
- Replaced code-managed Markdown downloads with an admin resource manager supporting validated `.md` uploads, metadata editing, previews, draft/published status, downloads, and deletion; migrated the public catalog to database-backed resources.
- Added optional reader accounts with email/password and Google sign-in, secure independent sessions, cross-device bookmark/history/progress syncing, and anonymous local-library migration. All published content remains public without authentication.
- Added a public Markdown resource library with rendered previews, direct downloads, curated project templates, and navigation links. Verification: frontend type-check, tests, and production build.
- Replaced raw article and author image tags with Next.js `Image` components and configured remote image patterns. Verification: `npm run typecheck` in `frontend/`.
- Strengthened the homepage hero with a first-viewport editorial background image and readable overlay treatment. Verification: `npm run typecheck` in `frontend/`.
- Improved mobile admin table rendering with horizontal overflow and stable minimum table widths for article and category management. Verification: `npm run typecheck` in `frontend/`.
- Fixed the article card border token to use the configured `border-line` Tailwind color. Verification: `npm run typecheck` in `frontend/`.
- Added backend-computed article reading minutes from full content for list responses and updated article cards to display that value. Verification: `npm run typecheck` in `backend/` and `frontend/`.
- Debounced public blog search requests and synchronized search, category, and page state to URL query parameters. Verification: `npm run typecheck` in `frontend/`.
- Added public blog sort controls for newest, oldest, and title ordering. Verification: `npm run typecheck` in `frontend/`.
- Replaced destructive admin `window.confirm` prompts with an accessible in-app confirmation dialog for article and category deletion. Verification: `npm run typecheck` in `frontend/`.
- Added dirty-form protection for article create/edit flows with browser unload prevention and an in-app discard confirmation. Verification: `npm run typecheck` in `frontend/`.
- Added dynamic article and category page metadata with descriptions, canonical URLs, and Open Graph fields. Verification: `npm run typecheck` in `frontend/`.
- Replaced shared admin tokens with bcrypt-backed administrator accounts and expiring database sessions stored in `HttpOnly` cookies, including login/logout flows and rate limiting.
- Added local image fallbacks, runtime image failure recovery, HTTPS/host validation, and restricted Next.js remote image configuration.
- Added Helmet headers, structured/redacted request logging, request-size limits, global/auth/newsletter rate limits, trusted-proxy configuration, and bounded graceful shutdown.
- Added Vitest/Supertest/Testing Library coverage and a GitHub Actions matrix that type-checks, tests, and builds both packages.
- Updated vulnerable dependencies to audited releases and added production Prisma migration support. Verification: both packages pass type-check, tests, and production builds; npm reports zero vulnerabilities.
- Updated article, category, admin-edit, blog-filter, and login routes for Next.js 16 asynchronous `params`/`searchParams`, fixing seeded article detail pages that incorrectly returned 404. Verification: frontend type-check, tests, build, and live HTTP 200 checks for seeded article and category routes.
- Added an admin media library with local development storage and Cloudflare R2 production storage, server-side type/size validation, Sharp rotation/cropping/WebP compression, required alt text, reusable URLs, and safe deletion.
- Added article autosave, optimistic edit-conflict detection, snapshot revision history with restore, unlisted preview links, series ordering, and scheduled publishing with an explicit cron command.
- Added tag and series management, public topic/tag/series pages, seeded relationships, and tag-aware related-content recommendations.
- Replaced substring search with a PostgreSQL GIN-indexed full-text query, added highlighted matches and popular-query tracking, and exposed popular searches in the blog explorer.
- Added browser-private bookmarks, reading history/progress, share controls, RSS, moderated comments, and admin comment approval/deletion.
- Verification: applied `202608250002_content_platform_features`; seeded 7 tags and 2 series; passed backend/frontend type-checks, tests, builds, and live API smoke tests including upload/delete and full-text search.

## 2026-08-27

- Replaced the planned administrator-management expansion with reader profiles that show account details, bookmarks, reading history, and progress; added password setting/changing with current-password verification and invalidation of other reader sessions. Verification: backend type-check, 16 tests, and production build; frontend type-check, 12 tests, and production build.

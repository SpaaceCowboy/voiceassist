# Pending Improvements

This file tracks known improvement work that has not been completed yet. When an item is finished, remove it from this file and add a dated entry to `changelog.md`.

## Product Features

- Add immersive article formats such as visual timelines, annotated case studies, interviews, data stories, and side-by-side arguments.
- Add living topic dossiers that collect key ideas, timelines, people, resources, and new coverage around an evolving subject.
- Add a concise editorial Signals format for notable product changes, statistics, patterns, quotations, and tools between major articles.
- Add curated reader perspectives with focused prompts and editor-selected responses presented as article margin notes.
- Add newsletter subscriber export, unsubscribe links, campaign creation, article-to-email publishing, and delivery analytics.
- Add threaded replies to comments, including moderation and clear parent-comment context.

## Bug Audit — 2026-08-27

### High Priority

- Make admin authentication work when frontend and API use different hostnames; the API host-only session cookie is currently unavailable to the frontend proxy.

### Medium Priority

- Render the homepage `featured` article or keep it in `latest`; the current destructuring silently drops the newest article and displays nothing when only one article exists.
- Separate invalid Google credentials from database/session failures and log non-credential failures instead of returning `INVALID_GOOGLE_CREDENTIAL` for every exception.
- Make article optimistic concurrency atomic and include revision creation and the article update in one transaction.
- Reject or normalize conflicting article publication state so `published: true` cannot coexist with a future `scheduledAt` and release scheduled content early.
- Snapshot the current article before restoring an older revision so restoration can be undone.
- Filter unpublished nested articles from public edition responses, or reject publishing editions that contain drafts.
- Validate admin sessions rather than checking only for cookie presence, and redirect stale sessions to login instead of rendering a backend 401 as a frontend error.
- Convert only genuine backend 404 responses to `notFound()` on article and series pages; propagate network and server failures as retryable errors.
- Make seed reruns preserve administrator credentials, editorial taxonomy changes, and edition ordering unless an explicit reset is requested.

### Lower Priority

- Replace the 200-article admin edit lookup and edition-selection cap with direct article lookup and paginated/searchable selection.
- Paginate sitemap article retrieval so published articles after the first 200 are included.
- Add pagination to category and tag archives instead of silently truncating them at 50 articles.
- Roll back both React state and `localStorage` when a signed-in bookmark API mutation fails.
- Format article dates with the active locale instead of hard-coded `en-US` on Persian pages.
- Fetch enough related articles to retain three results after excluding the current article.
- Point the homepage subject-browsing CTA to `/topics` rather than `/blog`.
- Make logout idempotent so expired or invalid session cookies can still be cleared.

## Bug Audit — 2026-09-02

### High Priority

- Populate the marketplace catalog; `MarketplaceProduct`, `MarketplaceCreator` and `MarketplaceCategory` are all empty, so `/explore` correctly reports zero products and the homepage rails render nothing.
- Make the API base URL runtime-configurable through a route handler or runtime config so the `/backend` rewrite destination is not frozen into `.next/routes-manifest.json` at build time and can no longer drift from the deployed API.

### Medium Priority

- Surface the underlying failure in the discovery error banner instead of the single generic retry string, which renders a `429 RATE_LIMITED` response identically to a network outage, and give the banner a retry control rather than requiring a page reload.
- Localize `features/discovery/`, the only feature with hard-coded English strings and no entries in `lib/i18n.ts`; its error, empty-state and filter copy stays English on Persian pages.
- Localize the footer column headings and link labels, which bypass `t` entirely and remain English in Persian mode.
- Point the footer links at their real destinations; all nine currently resolve to `/explore`.
- Give the `Read the creator guide` button in the homepage `#creators` section an `href` or handler; it is presently a `<button>` that does nothing when clicked.
- Make the locale switcher preserve the current path instead of swapping between `/` and `/fa`, which drops a reader on the homepage when they switch language from any subpage.
- Restore a creator entry point in the header once seller onboarding exists; the `For creators` nav item and both `Start selling` buttons were removed because they pointed at an anchor with no product behind it.

### Lower Priority

- Skip the redundant client-side product request on first mount in `features/discovery/discovery-experience.tsx`; the effect refetches data the server already rendered into `initial`.
- Fix the `react-hooks/set-state-in-effect` error and five warnings reported by `npm run lint --workspace @termspace/web` in `features/account/marketplace-session.tsx`, `features/product/product-actions.tsx` and `app/page.tsx`.
- Add a lint step to CI and run the workflow on `development`; the current workflow triggers only on pushes to `main` and never invokes the `apps/web` lint script.
- Copy each app's `next.config` into the runtime container image, or move the settings elsewhere, so `images.remotePatterns` and `reactStrictMode` apply at runtime rather than only at build time.
- Remove the `CountUp` component and its tests or adopt it somewhere real; it has no production call sites after the hero stat rail was removed.
- Pin the `apps/web` dependencies currently declared as `latest` so installs are reproducible without relying solely on `package-lock.json`.

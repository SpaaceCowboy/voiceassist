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
- Prevent reader-account pre-hijacking: verify password-registration email ownership and require authenticated linking before attaching Google to an existing email account.
- Separate invalid Google credentials from database/session failures and log non-credential failures instead of returning `INVALID_GOOGLE_CREDENTIAL` for every exception.
- Make article optimistic concurrency atomic and include revision creation and the article update in one transaction.
- Reject or normalize conflicting article publication state so `published: true` cannot coexist with a future `scheduledAt` and release scheduled content early.
- Snapshot the current article before restoring an older revision so restoration can be undone.
- Filter unpublished nested articles from public edition responses, or reject publishing editions that contain drafts.
- Return preview tokens through an authenticated admin-only response so the article editor's preview link can appear without exposing tokens publicly.
- Validate admin sessions rather than checking only for cookie presence, and redirect stale sessions to login instead of rendering a backend 401 as a frontend error.
- Convert only genuine backend 404 responses to `notFound()` on article and series pages; propagate network and server failures as retryable errors.
- Make media object and database operations failure-safe, clean up orphaned uploads, avoid rows pointing to deleted objects, and prevent deletion of referenced media.
- Stop exposing raw visitor search text through popular searches; apply aggregation/count thresholds and avoid retaining potentially sensitive queries unnecessarily.
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

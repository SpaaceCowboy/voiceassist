# TermSpace Blog

A Next.js + TypeScript + Tailwind editorial frontend for TermSpace. It consumes
the shared Express/Prisma API in `../api`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the API URL. Copy `.env.example` to `.env` and set both API URL
   values to the backend base URL.

   Reader accounts are optional and never gate public content. To enable Google
   sign-in, create a Google Identity Services Web client, allow the frontend
   origin, and use the same client ID for backend `GOOGLE_CLIENT_ID` and frontend
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. The Google button is hidden when unset. See
   [Google's Web client setup guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

3. Run the development server:

   ```bash
   npm run dev
   ```

The site is served at `http://localhost:3001`; the main TermSpace site uses port
`3000`.

## Languages

English uses unprefixed routes and Persian uses `/fa` routes. The request proxy
rewrites Persian URLs to the same App Router pages while setting `lang="fa"` and
`dir="rtl"`. Shared interface messages live in `messages/` and are provided
through `next-intl`; curated Persian
edition and article metadata lives in `lib/faContent.ts`. The language switcher
preserves the current page. Articles without a Persian body explicitly display
the original English text as a left-to-right fallback. Persian UI typography
uses the self-hosted Estedad variable font (SIL OFL 1.1), loaded only from the
application bundle without a third-party font CDN.

English typography uses the self-hosted Manrope variable family for interface
and body copy, paired with Newsreader for editorial headings and article prose.
Both families are distributed under SIL OFL 1.1.

## Routes

| Route | Description |
| --- | --- |
| `/` | Home — hero, featured article, latest grid, topics, newsletter |
| `/blog` | Blog listing — category filter, search, pagination |
| `/blog/[slug]` | Article detail — rich body, author, related, prev/next |
| `/blog/category/[slug]` | Category archive |
| `/admin` | Admin dashboard — list, publish/unpublish, delete |
| `/admin/articles/new` | Create article |
| `/admin/articles/[id]/edit` | Edit article |
| `/admin/categories` | Manage categories |
| `/admin/media` | Upload, optimize, reuse, and remove media |
| `/admin/resources` | Upload, preview, edit, publish, and delete Markdown resources |
| `/admin/editions` | Compose and publish numbered editorial editions |
| `/admin/taxonomy` | Manage tags and article series |
| `/admin/comments` | Moderate reader comments |
| `/admin/login` | Email/password administrator login |
| `/topics` | Browse categories, tags, and series |
| `/library` | Local or account-synced bookmarks and reading history |
| `/account` | Optional reader registration and email/Google sign-in |
| `/resources` | Review and download useful Markdown templates |
| `/editions` | Browse thematic editorial releases |
| `/rss.xml` | RSS 2.0 feed |

## Architecture

- **Server components** fetch data from the API for public pages (home, blog,
  article, category), keeping the initial render fast and SEO-friendly.
- **Client components** (`BlogExplorer`, admin forms) handle interactive
  filtering, search, pagination, and CRUD with loading/empty/error states.
- **`lib/api.ts`** is the typed API client; **`lib/types.ts`** mirrors the API
  response shapes; **`lib/markdown.ts`** renders the article body subset.

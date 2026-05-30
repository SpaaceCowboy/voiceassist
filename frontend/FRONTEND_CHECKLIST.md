# Frontend Checklist

> Short memory of what we've done and what's left, for the dashboard frontend.
> Companion to `FRONTEND_CAPABILITIES.md` (the detailed guide).
> Frontend-only — backend/DB work is tracked elsewhere.

Legend: `[x]` done · `[ ]` to do · 🐞 bug · ✨ feature/nice-to-have · ⚠️ needs a decision

---

## ✅ Done
- [x] 🎨 **Dashboard & Analytics visualization overhaul.** Replaced plain text rows / empty tables with a dependency-free SVG/CSS chart layer (`components/ui/charts.tsx`: `KpiCard`, `BarList`, `HourBars`, `Donut`, `StatRing`, `ChartCard`) + `lib/format.ts` formatters + `components/ui/icons.tsx`. Dashboard now has KPI cards, a completion ring, an appointment-status donut, an intents bar list, and a 24h busy-hours chart. No new npm deps — `next build` verified clean.
- [x] 🐞 **Analytics page showed empty/`—` data (wrong field bindings).** `OverviewCards` read flat `total_calls/transfers/failures` but backend returns nested `calls.{…}`/`appointments.{…}`; `HourlyTable` read `calls/appointments/transfers` instead of `call_count`; `IntentsTable` read a never-returned `avg_duration_seconds`. All fixed; tables replaced with charts; added a call-performance panel (avg/p95 latency, STT confidence gauge, tool usage) from `GET /api/analytics/metrics`.
  - `components/analytics/*` · `store/analytics.ts` · `lib/api/voiceAssistantApi.ts` · `lib/types.ts`
- [x] 🐞 **Patients page 400 ("`q` Required").** Empty search no longer fires a request that 400s; it shows a "type to search" prompt and only searches when there's a term.
  - `store/patients.ts` (skip fetch when `q` is empty) · `components/patients/PatientsPageClient.tsx` (empty-state prompt)

---

## 🐞 Bugs to fix later
- [ ] **FAQ "Deactivate" actually deletes.** Button says Deactivate but calls `DELETE /api/faqs/{id}`. Either rename the button to "Delete", or switch to a `PATCH { isActive:false }` if we want true deactivation.
  - `store/faqs.ts:135` · `components/faqs/FaqsPageClient.tsx:102`
- [ ] **Signup page is not protected.** A logged-in user can still open `/signup`. Login redirects logged-in users away; signup should too.
  - `app/(auth)/signup/page.tsx`
- [ ] **`useSearchParams()` without a Suspense boundary** on Calls and FAQs pages — risks build/prerender warnings. Patients page avoids this by reading `window.location.search` client-side; copy that pattern.
  - `components/calls/CallsPageClient.tsx:46` · `components/faqs/FaqsPageClient.tsx:43`
- [ ] **List search filters only on-screen rows, not the whole dataset.** Appointments and Calls search the already-loaded page, so "Showing X of Y" can mislead when paginated.
  - `components/appointments/AppointmentsPageClient.tsx:90-94` · `components/calls/CallsPageClient.tsx:62-66`

---

## ✨ Features / gaps (safe to edit or drop later)
- [ ] ⚠️ **Patients "list all" view.** The page is search-only because the backend only offers `/patients/search` (requires `q`). If we want to browse all patients, that needs a backend list endpoint — a product decision.
- [ ] **Users: list existing users.** Right now you can only create users, not see them. Marked "we'll add later" in code.
  - `app/users/page.tsx:154-155`
- [ ] **Users: reset another user's password.** Currently a future feature.
  - `app/users/page.tsx:192-193`
- [ ] **Show Global Search shortcuts in the UI.** `/`, `Ctrl+K`, `Esc` work but aren't hinted anywhere.
  - `components/dashboard/GlobalSearch.tsx`
- [ ] **Centralize pagination limits.** Page sizes (25, 120) are hardcoded across stores; pull into one config so a backend max-limit change can't silently break the UI.
  - `store/patients.ts:37` · `store/calls.ts:49` · `components/dashboard/GlobalSearch.tsx:271,274,280`
- [ ] **Keep mock data in sync.** `lib/mock-data.ts` is hardcoded; if we use `DATA_SOURCE=mock` it can drift from the real schema.

---

## 🧭 Notes for working together
- Data source is currently **live backend** (not mock). Toggle with `DATA_SOURCE` / `NEXT_PUBLIC_DATA_SOURCE`.
- All backend calls go through `lib/backend.ts` → `/api/backend/...` proxy, with the auth token attached automatically.
- Each list page owns its Zustand store in `store/`; most cache for ~8s.
- When adding a page that reads URL query params, read `window.location.search` client-side (see Patients) or wrap in `<Suspense>` to avoid prerender errors.

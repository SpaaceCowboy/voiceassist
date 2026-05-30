# Frontend Capabilities Guide

> Plain-language reference for the NeuroSpine dashboard (Next.js App Router).
> Explains **every page, what it shows, and what you can do on it**.
> This file is frontend-only. It does not cover backend/server internals.

---

## How the app is shaped (the basics)

- **Framework:** Next.js 16 (App Router) + React 19 + Tailwind. Pages live in `app/`, reusable pieces in `components/`, page state in `store/` (Zustand), and helpers in `lib/`.
- **Login wall:** Every page sits behind a login. The sidebar (`components/nav.tsx`) is hidden on `/login` and `/signup`. `components/AppShell.tsx` wraps everything and loads your saved login on startup.
- **How data is fetched:** Pages call the backend through one wrapper (`lib/backend.ts`). Every request goes through a proxy route at `/api/backend/...`. You attach a login token automatically.
- **Live vs. mock data:** A switch (`DATA_SOURCE` / `NEXT_PUBLIC_DATA_SOURCE`) decides whether the app talks to the real backend (default) or to fake in-memory data (`lib/mock-data.ts`). Right now it uses the **real backend**.
- **Theme:** Light/dark theme + sidebar state are remembered in your browser (`store/ui.ts`).

---

## The pages (what each one does)

### 🔐 Login — `/login`
Email + password form. If you are already logged in, it sends you to the dashboard. On success it saves your token and loads your account.

### 🆕 Signup — `/signup`
Creates the **very first** admin account (only works when no users exist yet). Used once to set up the system.

### 📊 Dashboard — `/dashboard`
Your landing page after login. Shows overview numbers (total calls, appointments, transfers, errors) plus "Top Intents" and "Busy Hours" tables. Also hosts the **Global Search** box.

### 🔎 Global Search (on the dashboard)
One search box that looks across appointments, calls, patients, and FAQs at the same time. Results are grouped by type with a "View all" link for each.
- **Shortcuts:** press `/` or `Ctrl+K` to jump to it, `Esc` to close. (These shortcuts aren't shown on screen yet.)

### 🧑‍⚕️ Patients — `/patients`
**Search-first page.** You type a name or phone number and it lists matching patients. Each row links to that patient's profile. Has page-size and next/previous controls.
- With an empty search box it shows a prompt ("Start typing…") instead of a list — the patient lookup only works **with** a search term.

### 🧑‍⚕️ Patient profile — `/patients/[id]`
One patient's details: name, phone, date of birth, email, address, insurance, plus their appointment/visit history.

### 📅 Appointments — `/appointments`
A list of appointments. You can filter by **scope** (today / a specific date / all), filter by **status** (scheduled, confirmed, completed, cancelled, no-show), search, and page through results. Each row links to the appointment's detail page.
- Note: the search box filters the rows already loaded on screen, not the whole database.

### 📅 Appointment detail — `/appointments/[id]`
One appointment's full information, with an edit form.

### ☎️ Calls — `/calls`
A list of phone calls handled by the assistant. Search, page through, and click a row to open the call. (Search filters the loaded rows on screen.)

### ☎️ Call detail — `/calls/[callSid]`
Everything about one call: full transcript, metadata (outcome, intent, problem, mood, duration, transfer info), and the list of tools the assistant used during the call.

### 📈 Analytics — `/analytics`
Aggregated stats: overview cards (total calls, completed, average duration, transferred), an intents breakdown table, and an hourly activity table.

### ❓ FAQs — `/faqs`
Manage the assistant's canned answers. List/search FAQs, filter by category, and **create / edit / remove** them through a popup editor.
- Heads-up: the button labeled "Deactivate" currently **deletes** the FAQ rather than just hiding it.

### 🧹 Sessions — `/sessions`
Shows how many assistant sessions are active/total and gives you a "cleanup" button to clear them.

### 👤 Users — `/users`
Create new dashboard users (moderator only) and change your own password.
- Limitation: there's **no list of existing users** yet, and you can't reset another person's password here.

### 🩺 Status — `/status`
A health check screen. It pings each backend endpoint and shows the status code, response time, and a preview of the reply — handy for spotting what's up or down.

### 🐞 Debug: Data — `/debug/data`
A raw API tester. Fires sample requests (health, patient search, appointments, calls, FAQs) and prints the raw responses.

### 🐞 Debug: Auth — `/debug/auth`
A manual login tester. Posts credentials and prints the raw response — useful when login is misbehaving.

---

## Shared building blocks

- **Navigation (`components/nav.tsx`):** left sidebar with links to Dashboard, Users, Appointments, Patients, Calls, Analytics, Sessions, FAQs, Status, plus the theme toggle and your account menu (with logout).
- **UI kit (`components/ui/`):** Badge, Button, Card, Input, Section, Skeleton (loading placeholders), Table shell, ErrorCard. Reused everywhere for a consistent look.
- **Per-feature components:** each feature has its own folder (`components/patients/`, `components/appointments/`, `components/calls/`, `components/faqs/`, `components/analytics/`, `components/sessions/`) holding its list view, filters bar, table, and detail view.

## State (where each page keeps its memory)

Each list page has its own Zustand store in `store/`:
`auth.ts` (who's logged in), `ui.ts` (theme/sidebar), `patients.ts`, `appointments.ts`, `calls.ts`, `faqs.ts`, `analytics.ts`, `sessions.ts`, `reservations.ts`.
Most list stores cache results for ~8 seconds so quick navigation doesn't re-fetch constantly.

---

_For the running task list and known issues, see `FRONTEND_CHECKLIST.md` in this folder._

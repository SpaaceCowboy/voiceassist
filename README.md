# NeuroSpine Voice Assistant

AI-powered phone assistant for the NeuroSpine Institute — handles incoming calls via Twilio, transcribes speech with Deepgram, manages appointments through Claude (Anthropic) function calling, and responds with text-to-speech.

## Architecture

```
Phone Call → Twilio → WebSocket Media Stream
                              ↓
                   Deepgram (Speech-to-Text)
                              ↓
                    Conversation Service
                       ↙           ↘
                Claude Haiku       PostgreSQL
           (Function Calling)     (Patients, Appointments,
                       ↘          Doctors, Departments)
                  TTS (OpenAI / ElevenLabs)
                              ↓
                     Audio → Twilio → Caller
```

## Project Structure

```
voiceassist/
├── backend/                   # Express + TypeScript API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # PostgreSQL connection pool (pg)
│   │   │   ├── redis.ts           # Upstash Redis (REST client)
│   │   │   └── swagger.ts         # OpenAPI 3.0 spec configuration
│   │   ├── functions/
│   │   │   └── tools.ts           # Claude tool definitions + system prompt
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT authentication + role-based access
│   │   │   ├── twilioAuth.ts      # Twilio webhook signature validation
│   │   │   ├── validate.ts        # Zod request validation schemas
│   │   │   ├── requestLogger.ts   # HTTP request logging
│   │   │   └── index.ts
│   │   ├── models/
│   │   │   ├── patient.ts         # Patient CRUD + history
│   │   │   ├── appointment.ts     # Appointment scheduling + availability
│   │   │   ├── callLog.ts         # Call logging + analytics
│   │   │   ├── session.ts         # Conversation session persistence
│   │   │   ├── faq.ts             # FAQ lookup
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── twilio.ts          # Twilio webhooks + WebSocket media stream
│   │   │   ├── api.ts             # REST API (appointments, patients, analytics)
│   │   │   ├── auth.ts            # JWT login, register, setup
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── conversation.ts    # Main orchestrator (call flow + function execution)
│   │   │   ├── llm.ts             # Claude (Anthropic) chat + tool use
│   │   │   ├── openai.ts          # OpenAI for TTS + call analysis
│   │   │   ├── deepgram.ts        # Live speech-to-text (nova-2-medical)
│   │   │   ├── tts.ts             # Text-to-speech (OpenAI / ElevenLabs)
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── helpers.ts         # Date/time parsing utilities
│   │   │   └── logger.ts          # Structured logging
│   │   └── server.ts              # Entry point
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── migrations/
│   │   ├── 002_neurospine_clinic.sql
│   │   └── seed_001_mock_data.sql
│   ├── package.json
│   └── tsconfig.json
├── frontend/                  # Next.js 16 (App Router) dashboard
│   ├── app/                       # Route groups and pages
│   ├── components/                # Feature-grouped UI components
│   ├── lib/                       # Backend client, mock data
│   ├── store/                     # Zustand stores (auth, ui)
│   └── package.json
├── docker-compose.yml         # Postgres + Redis + backend + frontend
├── .env                       # Shared env vars for compose
└── README.md
```

## Tech Stack

- **Backend**: Express.js, TypeScript, raw SQL (pg), Upstash Redis
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Zustand
- **LLM**: Claude Haiku (Anthropic) with function calling
- **STT**: Deepgram (nova-2-medical)
- **TTS**: OpenAI or ElevenLabs
- **Telephony**: Twilio (WebSocket media streams)
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Upstash Redis (REST API)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Twilio account with a phone number
- Deepgram API key
- Anthropic API key (Claude)
- OpenAI API key (TTS + call analysis)
- Upstash Redis instance (REST API)
- (Optional) ElevenLabs API key for alternative TTS

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env   # configure env vars
docker compose up --build
```

This starts Postgres, Redis, backend (port 4001), and frontend (port 3001).

### Manual

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Database Setup (manual only)

```bash
createdb neurospine
psql -d neurospine -f backend/migrations/002_neurospine_clinic.sql
psql -d neurospine -f backend/migrations/seed_001_mock_data.sql  # optional
```

### Twilio Configuration

1. Go to Twilio Console > Phone Numbers
2. Select your phone number
3. Set Voice Configuration:
   - **A Call Comes In**: Webhook
   - **URL**: `https://your-domain/twilio/voice`
   - **Method**: POST
4. Set Status Callback:
   - **URL**: `https://your-domain/twilio/status`

## Scripts

```bash
# Backend (cd backend/)
npm run dev          # Hot-reload dev server
npm run build        # Compile TypeScript
npm start            # Build + run production
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm test             # Vitest
npm run test:watch   # Vitest watch mode

# Frontend (cd frontend/)
npm run dev          # Next.js dev server
npm run build        # Next.js production build
npm run lint         # ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | Yes |
| `DEEPGRAM_API_KEY` | Deepgram API key | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key (Claude LLM) | Yes |
| `OPENAI_API_KEY` | OpenAI API key (TTS + analysis) | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `PORT` | Server port (default: 3000) | No |
| `LLM_MODEL` | Claude model (default: claude-haiku-4-5) | No |
| `TTS_PROVIDER` | `openai` or `elevenlabs` (default: openai) | No |
| `OPENAI_TTS_VOICE` | Voice for OpenAI TTS | No |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | No |
| `BUSINESS_NAME` | Clinic name | No |
| `BUSINESS_TIMEZONE` | Timezone (default: America/Los_Angeles) | No |
| `SKIP_TWILIO_VALIDATION` | Skip webhook signature check in dev | No |
| `TRANSFER_NUMBER` | Number to transfer calls to staff | No |
| `LOG_LEVEL` | Logging level | No |

## Authentication

Two separate auth systems:

**Dashboard API** — JWT Bearer tokens with role-based access (`user` | `moderator`):
- `POST /auth/setup` — One-time first moderator creation (locks after first use)
- `POST /auth/login` — Email + password returns JWT
- `POST /auth/register` — Create new user (moderator-only)
- `GET /auth/me` — Current user profile
- `PATCH /auth/password` — Change own password

**Twilio Webhooks** — HMAC-SHA1 signature validation (skip with `SKIP_TWILIO_VALIDATION=true` in dev)

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:3000/api/docs
```

The raw OpenAPI 3.0 JSON spec is served at:

```
http://localhost:3000/api/docs.json
```

Both endpoints are public (no authentication required).

## API Endpoints

All `/api` routes require a valid JWT Bearer token.

### Health
- `GET /api/health` — Server health check (public)

### Appointments
- `GET /api/appointments?date=YYYY-MM-DD` — List appointments by date
- `GET /api/appointments/:id` — Get appointment details
- `PATCH /api/appointments/:id` — Update appointment
- `DELETE /api/appointments/:id` — Cancel appointment

### Patients
- `GET /api/patients/search?q=query` — Search patients by name/phone
- `GET /api/patients/:id` — Get patient with appointment history
- `PATCH /api/patients/:id` — Update patient info (moderator)

### Call Logs
- `GET /api/calls` — List recent calls
- `GET /api/calls/:callSid` — Get call details

### Analytics
- `GET /api/analytics/overview` — Call and appointment stats
- `GET /api/analytics/intents` — Intent breakdown
- `GET /api/analytics/hourly` — Hourly call distribution

### Sessions
- `GET /api/sessions/stats` — Session statistics (moderator)
- `POST /api/sessions/cleanup` — Trigger session cleanup (moderator)

### FAQs
- `GET /api/faqs` — List FAQs (filterable by category)
- `GET /api/faqs/categories` — List FAQ categories
- `POST /api/faqs` — Create FAQ (moderator)
- `PATCH /api/faqs/:id` — Update FAQ (moderator)
- `DELETE /api/faqs/:id` — Deactivate FAQ (moderator)

## AI Function Calling

During a phone call, Claude can invoke these tools:

| Function | Description |
|----------|-------------|
| `check_availability` | Check if a date/time/doctor slot is available |
| `book_appointment` | Book a new appointment |
| `reschedule_appointment` | Reschedule an existing appointment |
| `cancel_appointment` | Cancel an appointment |
| `get_patient_appointments` | List patient's upcoming appointments |
| `update_patient_info` | Update patient name, insurance, or email |
| `get_department_info` | Get department details, doctors, and services |
| `answer_faq` | Look up clinic FAQ answers |
| `transfer_to_staff` | Transfer call to a human staff member |
| `end_call` | End the conversation |

## WebSocket vs Simple Mode

**WebSocket Mode** (`/twilio/voice`) — Recommended
- Lowest latency, real-time bidirectional audio
- Uses Twilio media streams + Deepgram live transcription

**Simple Mode** (`/twilio/voice-simple`)
- Higher latency but simpler setup
- Uses Twilio's built-in Gather verb with Polly TTS

## Database Schema

Key tables (PostgreSQL):

- `patients` — Patient contact info, insurance, preferences
- `appointments` — Scheduling records with confirmation codes
- `doctors` — Provider profiles with specialties
- `departments` — Clinical departments (Neurosurgery, Neurology, etc.)
- `locations` — Clinic locations (Palmdale, Sherman Oaks, Valencia, Thousand Oaks)
- `doctor_locations` — Doctor-location availability mapping
- `call_logs` — Call history, transcripts, sentiment analysis
- `faq_responses` — Pre-defined Q&A for the AI
- `conversation_sessions` — Session state backup
- `blocked_times` — Unavailable time slots
- `dashboard_users` — Admin dashboard accounts

## Security

- Parameterized SQL queries (no ORM, no string interpolation)
- Twilio webhook signature validation (HMAC-SHA1)
- JWT authentication with role-based access control
- Helmet middleware for HTTP security headers
- Rate limiting on API routes
- CORS configuration
- Zod schema validation on all request inputs
- bcryptjs password hashing (12 rounds)

## Production Deployment

The backend is deployed on **Render**, the frontend on **Vercel**.

```bash
# Manual backend deploy
cd backend
npm run build
pm2 start dist/server.js --name neurospine-voice
```

Ensure:
- SSL/TLS is configured (required by Twilio)
- All required environment variables are set
- `JWT_SECRET` is a strong random secret
- `SKIP_TWILIO_VALIDATION` is **not** set

## License

MIT

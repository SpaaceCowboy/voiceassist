# Deployment & QA Test Plan

> NeuroSpine Voice Assistant — created 2026-05-24

---

## Phase 1 — Local Smoke Test

```bash
# 1. Start the full stack
cd ~/voiceassist
docker compose up --build

# 2. Verify health
curl http://localhost:4001/api/health?detailed=true
# Expect: { status: "ok", components: { database: "ok", redis: "ok" } }

# 3. Run backend unit tests
cd backend && npm test
```

Confirms Postgres, Redis, and the backend boot correctly with migrations applied.

---

## Phase 2 — Test Each AI Service in Isolation

### Deepgram (STT)

```bash
# From backend/, run:
npx ts-node -e "
import { createClient } from '@deepgram/sdk';
const dg = createClient(process.env.DEEPGRAM_API_KEY!);
dg.listen.prerecorded.transcribeUrl(
  { url: 'https://dpgr.am/spacewalk.wav' },
  { model: 'nova-2', smart_format: true }
).then(r => console.log(r.result?.results.channels[0].alternatives[0].transcript))
 .catch(e => console.error('DEEPGRAM FAIL:', e));
"
```

If this prints a transcript, your API key and Deepgram connectivity are good.

### OpenAI — Chat + Function-Calling

```bash
npx ts-node -e "
import OpenAI from 'openai';
const client = new OpenAI();
client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
  max_tokens: 50
}).then(r => console.log(r.choices[0].message.content))
 .catch(e => console.error('OPENAI FAIL:', e));
"
```

### OpenAI TTS

```bash
npx ts-node -e "
import OpenAI from 'openai';
import fs from 'fs';
const client = new OpenAI();
client.audio.speech.create({
  model: 'tts-1', voice: 'nova',
  input: 'Hello, this is a test of the NeuroSpine voice assistant.'
}).then(async r => {
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync('/tmp/tts-test.mp3', buf);
  console.log('TTS OK — saved to /tmp/tts-test.mp3 (' + buf.length + ' bytes)');
}).catch(e => console.error('TTS FAIL:', e));
"
```

Play `/tmp/tts-test.mp3` to verify audio quality.

---

## Phase 3 — End-to-End Voice Call Test (with ngrok)

Twilio needs a public URL to send webhooks.

```bash
# 1. Start the stack
docker compose up --build

# 2. Expose backend publicly
ngrok http 4001
# Note the https://xxxx.ngrok-free.app URL

# 3. Configure Twilio
#    Go to https://console.twilio.com -> Phone Numbers -> your number
#    Set Voice webhook to: https://xxxx.ngrok-free.app/twilio/voice  (POST)
#    Set Status callback to: https://xxxx.ngrok-free.app/twilio/status (POST)

# 4. Call the Twilio number from your phone
```

### What to test on the call

| Scenario | What it validates |
|---|---|
| "What are your hours?" | Deepgram STT -> OpenAI -> `answer_faq` tool -> TTS |
| "I'd like to book an appointment" | Full conversation flow, `check_availability` + `book_appointment` |
| "Can I reschedule my appointment?" | `get_patient_appointments` + `reschedule_appointment` |
| Silence / hang up | Session cleanup, `handleCallEnded()`, call_log persistence |
| "Transfer me to someone" | `transfer_to_staff` tool, Twilio call transfer |

---

## Phase 4 — Dashboard Verification

```bash
# Frontend at http://localhost:3001
# 1. Log in (check seed data in migrations/seed_001_mock_data.sql for credentials)
# 2. Verify each page loads:
#    - /appointments — list and search
#    - /patients — patient search
#    - /calls — call logs (should show your test call from Phase 3)
#    - /faqs — FAQ management
#    - /status — health indicators
```

---

## Phase 5 — Production Deployment Checklist

1. **Rotate all secrets** in `.env` — especially `JWT_SECRET`:
   ```bash
   openssl rand -base64 48
   ```

2. **Production environment variables:**
   ```env
   NODE_ENV=production
   SKIP_TWILIO_VALIDATION=false
   CORS_ORIGIN=https://yourdomain.com
   JWT_SECRET=<generated-secret>
   ```

3. **Twilio webhook URL** — Point to production domain (HTTPS required), not ngrok.

4. **Database** — Use managed Postgres (Supabase, RDS, Neon). Update `DATABASE_URL`.

5. **Redis** — Use Upstash Redis. Update `REDIS_URL`.

6. **TLS** — Backend must be behind HTTPS for Twilio media streams (`wss://` requires it).

7. **Build production images:**
   ```bash
   docker build -f backend/Dockerfile.dev --target production -t neurospine-backend ./backend
   docker build -f frontend/Dockerfile.dev --target runner -t neurospine-frontend ./frontend
   ```

8. **Process management** — PM2 or container orchestration (ECS, Cloud Run, Fly.io).

---

## Phase 6 — Monitoring After Deploy

- Hit `GET /api/health?detailed=true` from an uptime monitor (UptimeRobot, Checkly).
- Watch backend logs for Deepgram connection errors, OpenAI rate limits, Twilio signature validation failures.
- Check `/calls` page after each test call to confirm call logs persist with transcripts, intent, and sentiment.

---

## Call-Side QA Test Script

Run these by actually calling the Twilio number. Have someone who didn't build the system test too.

### Happy Paths

| # | Say this | Expected behavior |
|---|---------|-------------------|
| 1 | *(silence for 5s)* | Assistant re-prompts, no crash or hang |
| 2 | "Hi, what are your office hours?" | Correct FAQ answer, natural voice |
| 3 | "I'd like to make an appointment" | Asks for date, time, doctor preference |
| 4 | "Next Tuesday at 2pm with Dr. [name]" | Confirms availability, books it, gives confirmation code |
| 5 | "I need to reschedule my appointment" | Asks for identifying info, finds it, offers new slots |
| 6 | "Cancel my appointment" | Confirms before canceling |
| 7 | "What insurance do you accept?" | FAQ answer |
| 8 | "Transfer me to a real person" | Call transfers (or graceful message if `TRANSFER_NUMBER` not set) |
| 9 | "Goodbye" / hang up | Session cleans up, call log appears in dashboard |

### Edge Cases

| # | Scenario | What to watch for |
|---|---------|-------------------|
| 10 | Mumble or speak very quietly | Does Deepgram pick it up? Does assistant ask to repeat? |
| 11 | Speak in a noisy environment | Does assistant handle garbled input gracefully? |
| 12 | Interrupt the assistant mid-sentence | Does it stop and listen, or talk over you? |
| 13 | Off-topic: "What's the weather?" | Politely redirects to clinic topics |
| 14 | Impossible date: "February 30th" | Catches it, doesn't crash or book garbage |
| 15 | Past date: "I want an appointment yesterday" | Says it can't, offers future dates |
| 16 | Non-existent doctor | Says not found, lists available doctors |
| 17 | Rapid-fire two questions | Answers both, doesn't drop one |
| 18 | Long pause mid-conversation (30s+) | Re-prompts or handles timeout, no silent disconnect |
| 19 | Call back immediately after hanging up | New session, no bleed-over from previous call |
| 20 | Two simultaneous calls | Both work independently (concurrency test) |

### Latency & Quality Checks

For every call, note:

- **Response delay** — Seconds between finishing a sentence and hearing a reply. Under 2s = good, over 4s = problem.
- **Voice quality** — Natural or robotic/choppy? Glitches indicate a mulaw conversion bug.
- **Transcription accuracy** — Check transcript in dashboard `/calls`. Does it match what you said?
- **Cut-off responses** — Does assistant stop mid-sentence? (500 max_tokens limit may truncate long answers)

### Dashboard Verification After Each Call

- [ ] Call appears in `/calls` with correct duration
- [ ] Transcript is complete and accurate
- [ ] Intent classified correctly (new_appointment, faq, cancel, etc.)
- [ ] Sentiment score seems reasonable
- [ ] Appointment shows in `/appointments` if one was booked
- [ ] Patient record created/updated in `/patients` if caller gave info

### Failure Mode Testing

| Scenario | How to simulate | Expected |
|----------|----------------|----------|
| OpenAI down | Set a bad `OPENAI_API_KEY` | Graceful error message to caller, not silence |
| Deepgram down | Bad `DEEPGRAM_API_KEY` | Tells caller there's an issue, doesn't hang |
| Redis down | `docker compose stop redis` | Calls work degraded or fail gracefully |
| Database down | `docker compose stop postgres` | Booking fails gracefully with apology, no crash |
| Slow network | Throttle with `tc` or test from distant region | Measure if latency becomes unusable |

---

## Bug Tracking Template

```
Scenario:     [what you said / did]
Expected:     [what should have happened]
Actual:       [what actually happened]
Severity:     [blocker / major / minor / cosmetic]
Call SID:     [from /calls page]
Timestamp:    [when it happened]
Reproducible: [always / sometimes / once]
```

---

## Who Should Test

- **You** — technical validation, edge cases, failure modes
- **A non-technical person** — natural conversation patterns, confusing prompts, things a real patient would say
- **Someone with an accent or ESL** — STT accuracy varies across speakers
- **Someone on a bad phone connection** — cell signal, speakerphone, car bluetooth

---

## Deployment Log (2026-05-24)

### What's been done

- [x] **Backend deployed on Render** — Web Service, root directory `backend`
  - URL: `https://voiceassist-y334.onrender.com`
  - Build command: `npm install && npm run build`
  - Start command: `node dist/src/server.js`
  - Fixed `dist/server.js` → `dist/src/server.js` path issue (tsconfig `baseUrl` causes nested output)

- [x] **Postgres created on Render** — set `DATABASE_URL` in backend env vars (use Internal URL)
  - Migrations still need to be run (see below)

- [x] **Redis created on Upstash** — set `REDIS_URL` in backend env vars
  - Must use `rediss://` (TLS), no surrounding quotes
  - Copy full password from Upstash dashboard (use the Copy button)

- [x] **Frontend deployed on Vercel** — root directory `frontend`
  - Set `NEXT_PUBLIC_BACKEND_URL=https://voiceassist-y334.onrender.com`

### What's left to do

- [ ] **Fix Redis auth** — `WRONGPASS` error in logs. Re-copy the full `REDIS_URL` from Upstash dashboard and update in Render env vars. Redeploy.

- [ ] **Run database migrations** — from local machine using the Render External Database URL:
  ```bash
  psql "<external-database-url>" -f backend/migrations/002_neurospine_clinic.sql
  psql "<external-database-url>" -f backend/migrations/003_patient_search_trgm.sql
  psql "<external-database-url>" -f backend/migrations/seed_001_mock_data.sql
  ```

- [ ] **Set production env vars on Render backend** (if not already set):
  ```
  NODE_ENV=production
  SKIP_TWILIO_VALIDATION=false
  CORS_ORIGIN=https://<your-vercel-app>.vercel.app
  JWT_SECRET=<generate with: openssl rand -base64 48>
  OPENAI_API_KEY=<key>
  DEEPGRAM_API_KEY=<key>
  TWILIO_ACCOUNT_SID=<sid>
  TWILIO_AUTH_TOKEN=<token>
  TWILIO_PHONE_NUMBER=<number>
  ```

- [ ] **Set Twilio webhooks** — in Twilio console, point to:
  - Voice: `POST https://voiceassist-y334.onrender.com/twilio/voice`
  - Status: `POST https://voiceassist-y334.onrender.com/twilio/status`

- [ ] **Verify health endpoint**: `curl https://voiceassist-y334.onrender.com/api/health?detailed=true`

- [ ] **Run the Call-Side QA Test Script** (see above) — test all happy paths, edge cases, and failure modes

- [ ] **Set up first dashboard admin** — `POST /auth/setup` to create the initial moderator account

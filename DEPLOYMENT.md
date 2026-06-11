# Deploying NeuroSpine Voice Assistant on an Ubuntu VPS

Single-server Docker deployment. Caddy terminates TLS and reverse-proxies two
subdomains:

```
app.<domain>  → frontend (Next.js dashboard)
api.<domain>  → backend  (Twilio webhooks + REST API + /media-stream WebSocket)
```

Postgres, Redis, and the two app containers run on a private Docker network; only
Caddy publishes ports 80/443. Files used: `docker-compose.prod.yml`, `Caddyfile`,
`backend/Dockerfile`, `frontend/Dockerfile`, `.env` (from `.env.prod.example`).

---

## 0. Prerequisites

- An Ubuntu 22.04/24.04 VPS (1 vCPU / 2 GB RAM minimum; 2 vCPU / 4 GB recommended
  for the Docker build) with a public IPv4.
- Root or sudo SSH access.
- Twilio account with a voice-capable phone number.
- OpenAI + Deepgram API keys.

---

## 1. Register a domain and point DNS

You don't have a domain yet, so:

1. Register one (Namecheap, Cloudflare Registrar, Porkbun, etc.).
2. In the DNS panel create **two A records** pointing at your VPS public IP:

   | Type | Host  | Value (VPS IP)   |
   |------|-------|------------------|
   | A    | `app` | `203.0.113.10`   |
   | A    | `api` | `203.0.113.10`   |

3. If you use Cloudflare, set both records to **DNS only (grey cloud)** for the
   first deploy — proxied/orange-cloud breaks the Let's Encrypt HTTP challenge and
   the Twilio WebSocket. You can revisit proxying later.
4. Verify propagation (may take minutes to hours):
   ```bash
   dig +short app.yourdomain.com
   dig +short api.yourdomain.com
   ```
   Both must return your VPS IP before TLS will issue.

---

## 2. Initial server hardening

SSH in as root, then:

```bash
# Create a sudo user (replace 'deploy')
adduser deploy
usermod -aG sudo deploy

# Copy your SSH key to the new user (run from your laptop instead if preferred)
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/

# Update packages
apt update && apt upgrade -y

# Firewall: allow SSH + HTTP + HTTPS only
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

Reconnect as `deploy` and confirm sudo works. (Optional: install `fail2ban`,
disable root SSH login in `/etc/ssh/sshd_config`.)

---

## 3. Install Docker + Compose plugin

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in so the group applies, then verify:
docker --version
docker compose version
```

---

## 4. Get the code on the server

```bash
cd ~
git clone https://github.com/SpaaceCowboy/voiceassist.git
cd voiceassist
```

(Private repo? Use a deploy key or a GitHub PAT for the clone.)

---

## 5. Configure environment

```bash
cp .env.prod.example .env
nano .env
```

Fill in:

- `APP_DOMAIN`, `API_DOMAIN`, `ACME_EMAIL` — your two subdomains + a real email
  for Let's Encrypt expiry notices.
- `DB_USER` / `DB_PASSWORD` / `DB_NAME` — and make sure the same user/password/db
  appear in `DATABASE_URL` (`postgresql://USER:PASSWORD@postgres:5432/DBNAME`).
  Keep the password URL-safe (no `@ : / ? #`).
- `REDIS_URL=redis://redis:6379` (leave as-is).
- `JWT_SECRET` — generate one: `openssl rand -hex 32`.
- `SKIP_TWILIO_VALIDATION=false` (keep webhook signature checks on in prod).
- Twilio, OpenAI, Deepgram keys.

`.env` is gitignored — it stays only on the server.

---

## 6. Build and start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

First build takes a few minutes. Then watch boot:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

On the backend you should see migrations apply and the server listen on port 3000.
Caddy will request certs automatically once DNS resolves:

```bash
docker compose -f docker-compose.prod.yml logs -f caddy
```

---

## 7. Verify

```bash
# Backend health (through Caddy + TLS)
curl https://api.yourdomain.com/api/health

# Dashboard loads
curl -I https://app.yourdomain.com
```

Open `https://app.yourdomain.com` in a browser — the login page should render over
valid HTTPS.

---

## 8. Create the first admin account

The dashboard's first moderator is created once via the backend setup endpoint:

```bash
curl -X POST https://api.yourdomain.com/auth/setup \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@yourdomain.com","password":"a-strong-password"}'
```

Then log in at `https://app.yourdomain.com/login`.

---

## 9. Point Twilio at the backend

In the Twilio Console → your phone number → **Voice Configuration**:

- **A call comes in** → Webhook → `https://api.yourdomain.com/twilio/voice`
  → HTTP **POST**.

(The TwiML returned points the media stream at `wss://api.yourdomain.com/media-stream`,
which Caddy upgrades automatically.) Place a test call to confirm the assistant
answers.

---

## 10. Updates / redeploy

```bash
cd ~/voiceassist
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Useful ops:

```bash
docker compose -f docker-compose.prod.yml logs -f          # all services
docker compose -f docker-compose.prod.yml restart backend  # restart one
docker compose -f docker-compose.prod.yml down             # stop (keeps volumes)
```

Backup the database volume:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U "$DB_USER" "$DB_NAME" > backup-$(date +%F).sql
```

---

## Known issues to address before going fully live

1. **`004_call_metrics.sql` is not in the auto-migration list**
   (`backend/src/config/migrate.ts` runs only `002`, `003`, `seed_001`). The call
   analytics metrics table/columns won't be created, so metrics endpoints may
   error. Either add `004_call_metrics.sql` to `MIGRATION_FILES`, or apply it once
   manually:
   ```bash
   docker compose -f docker-compose.prod.yml exec -T postgres \
     psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/004_call_metrics.sql
   ```

2. **Twilio signature validation behind a proxy** — `twilioAuth.ts` rebuilds the
   request URL from forwarded headers. With a single Caddy in front this should
   match, but if test calls return 403, this is the place to look (see
   `pending-work.md`, backend HIGH). Do **not** paper over it with
   `SKIP_TWILIO_VALIDATION=true` in production.

3. **`unhandledRejection` shuts the server down** (`server.ts`) — a transient
   background rejection can drop active calls. Tracked in `pending-work.md`;
   worth fixing before heavy traffic.

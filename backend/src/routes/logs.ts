/**
 * ===========================================
 * LIVE LOGS ROUTES (JWT-protected)
 * ===========================================
 *
 * GET /api/logs/stream  — Server-Sent Events tail of everything happening on
 *                         the server (calls, conversation turns, tool calls,
 *                         bookings, HTTP requests, errors, …). One long-lived
 *                         connection instead of polling, so it does not fight
 *                         the per-IP rate limiter (which exempts /api/logs).
 *                         Also pushes periodic `event: health` frames so the
 *                         dashboard's health tiles populate without polling.
 * GET /api/logs/recent  — Recent events as JSON (page-reload backfill).
 *
 * Event payloads use the same LiveEvent shape as frontend/lib/logs/types.ts.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware';
import { getRecentEvents, subscribeLog } from '../utils/logEvents';
import database from '../config/database';
import redis from '../config/redis';

const router = Router();

router.use(authenticate);

// ---------------------------------------------------------------------------
// Health snapshots — shape matches frontend/lib/logs/types.ts HealthSnapshot.
// A single shared timer pings the dependencies and fans the result out to every
// connected stream, so N concurrent admins do not mean N× DB/Redis pings. The
// timer is lazily started with the first stream and torn down with the last, so
// we never ping anything in the background when nobody is watching.
// ---------------------------------------------------------------------------
interface HealthSnapshot {
  ok: boolean;
  db: { up: boolean; latencyMs?: number } | null;
  redis: { up: boolean; latencyMs?: number } | null;
  uptimeSeconds?: number;
  at: number;
}

const HEALTH_INTERVAL_MS = 15_000;
type HealthListener = (h: HealthSnapshot) => void;

const healthListeners = new Set<HealthListener>();
let healthTimer: NodeJS.Timeout | null = null;
let lastHealth: HealthSnapshot | null = null;

async function computeHealth(): Promise<HealthSnapshot> {
  const t0 = Date.now();
  const dbUp = await database.testConnection().catch(() => false);
  const dbMs = Date.now() - t0;

  const t1 = Date.now();
  const redisUp = await redis
    .ping()
    .then((r) => r !== false)
    .catch(() => false);
  const redisMs = Date.now() - t1;

  return {
    ok: Boolean(dbUp) && redisUp,
    db: { up: Boolean(dbUp), latencyMs: dbMs },
    redis: { up: redisUp, latencyMs: redisMs },
    uptimeSeconds: Math.round(process.uptime()),
    at: Date.now(),
  };
}

async function tickHealth(): Promise<void> {
  const h = await computeHealth();
  lastHealth = h;
  for (const fn of healthListeners) fn(h);
}

function subscribeHealth(fn: HealthListener): () => void {
  healthListeners.add(fn);
  // Hand the newcomer the last known snapshot immediately, then refresh soon.
  if (lastHealth) fn(lastHealth);
  if (!healthTimer) {
    void tickHealth();
    healthTimer = setInterval(() => void tickHealth(), HEALTH_INTERVAL_MS);
    healthTimer.unref();
  }
  return () => {
    healthListeners.delete(fn);
    if (healthListeners.size === 0 && healthTimer) {
      clearInterval(healthTimer);
      healthTimer = null;
      lastHealth = null;
    }
  };
}

router.get('/recent', (req: Request, res: Response) => {
  const raw = parseInt(String(req.query.limit ?? '100'), 10);
  const limit = Number.isFinite(raw) ? Math.min(500, Math.max(1, raw)) : 100;
  res.json({ success: true, data: getRecentEvents(limit) });
});

router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Disable proxy buffering (nginx and similar) so events flush immediately.
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const send = (data: string): void => {
    res.write(`data: ${data}\n\n`);
  };

  // Backfill recent history so the client isn't empty on connect. These are
  // flagged `historical` so the dashboard renders them dimmed and does not treat
  // the replay (which repeats on every EventSource reconnect) as fresh activity.
  for (const event of getRecentEvents(100)) {
    send(JSON.stringify({ ...event, historical: true }));
  }
  // Signal that the historical backfill is done and live tail begins.
  res.write('event: ready\ndata: {}\n\n');

  const unsubscribe = subscribeLog((event) => send(JSON.stringify(event)));
  const unsubscribeHealth = subscribeHealth((h) =>
    res.write(`event: health\ndata: ${JSON.stringify(h)}\n\n`),
  );

  // Comment heartbeat keeps the connection alive through intermediaries.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
  heartbeat.unref();

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    unsubscribeHealth();
    res.end();
  });
});

export default router;

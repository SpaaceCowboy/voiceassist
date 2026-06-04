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
 * GET /api/logs/recent  — Recent events as JSON (page-reload backfill).
 *
 * Event payloads use the same LiveEvent shape as frontend/lib/logs/types.ts.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware';
import { getRecentEvents, subscribeLog } from '../utils/logEvents';

const router = Router();

router.use(authenticate);

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

  // Backfill recent history so the client isn't empty on connect.
  for (const event of getRecentEvents(100)) {
    send(JSON.stringify(event));
  }
  // Signal that the historical backfill is done and live tail begins.
  res.write('event: ready\ndata: {}\n\n');

  const unsubscribe = subscribeLog((event) => send(JSON.stringify(event)));

  // Comment heartbeat keeps the connection alive through intermediaries.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
  heartbeat.unref();

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

export default router;

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { validateTwilioWebhook } from './twilioAuth';

// Twilio's signature algorithm: HMAC-SHA1(url + sorted(key+value)...) base64.
// Recompute the same way so tests don't depend on Twilio's helper internals.
function signTwilio(authToken: string, url: string, params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const data = sortedKeys.reduce((acc, key) => acc + key + params[key], url);
  return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

const AUTH_TOKEN = 'test-twilio-auth-token';
const URL = 'https://example.com/twilio/voice';
const PARAMS = { CallSid: 'CA123', From: '+15551234567', To: '+15557654321' };

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function buildReq(opts: {
  signature?: string;
  body?: Record<string, string>;
  host?: string;
  proto?: string;
  originalUrl?: string;
} = {}): Request {
  return {
    headers: {
      ...(opts.signature !== undefined ? { 'x-twilio-signature': opts.signature } : {}),
      host: opts.host ?? 'example.com',
      ...(opts.proto ? { 'x-forwarded-proto': opts.proto } : {}),
    },
    body: opts.body ?? PARAMS,
    protocol: 'https',
    originalUrl: opts.originalUrl ?? '/twilio/voice',
    ip: '1.2.3.4',
    path: '/twilio/voice',
  } as unknown as Request;
}

describe('validateTwilioWebhook', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    process.env.TWILIO_AUTH_TOKEN = AUTH_TOKEN;
    delete process.env.SKIP_TWILIO_VALIDATION;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls next() when signature is valid', () => {
    const signature = signTwilio(AUTH_TOKEN, URL, PARAMS);
    const req = buildReq({ signature });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when signature header is missing', () => {
    const req = buildReq({});
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/missing signature/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when signature is invalid', () => {
    const req = buildReq({ signature: 'totally-wrong-signature' });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/invalid signature/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when a body param is tampered', () => {
    const signature = signTwilio(AUTH_TOKEN, URL, PARAMS);
    const req = buildReq({ signature, body: { ...PARAMS, From: '+19999999999' } });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when signature was computed for a different URL', () => {
    const signature = signTwilio(AUTH_TOKEN, 'https://example.com/twilio/other', PARAMS);
    const req = buildReq({ signature });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('honors x-forwarded-proto/host when reconstructing the URL', () => {
    const forwardedUrl = 'https://proxied.example.com/twilio/voice';
    const signature = signTwilio(AUTH_TOKEN, forwardedUrl, PARAMS);
    const req = buildReq({
      signature,
      host: 'internal-host', // would mismatch without x-forwarded-host
      proto: 'https',
    });
    (req.headers as any)['x-forwarded-host'] = 'proxied.example.com';
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 500 when TWILIO_AUTH_TOKEN is not configured', () => {
    delete process.env.TWILIO_AUTH_TOKEN;
    const req = buildReq({ signature: 'anything' });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  it('skips validation when NODE_ENV=development and SKIP_TWILIO_VALIDATION=true', () => {
    process.env.NODE_ENV = 'development';
    process.env.SKIP_TWILIO_VALIDATION = 'true';
    const req = buildReq({ signature: 'invalid' });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('does NOT skip validation when SKIP_TWILIO_VALIDATION=true but NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SKIP_TWILIO_VALIDATION = 'true';
    const req = buildReq({ signature: 'invalid' });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('does NOT skip validation when NODE_ENV=development but SKIP_TWILIO_VALIDATION is unset', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SKIP_TWILIO_VALIDATION;
    const req = buildReq({ signature: 'invalid' });
    const res = mockRes();

    validateTwilioWebhook(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validateBody,
  validateQuery,
  loginSchema,
  registerSchema,
  appointmentModifySchema,
  appointmentCancelSchema,
  appointmentQuerySchema,
  patientUpdateSchema,
  patientSearchSchema,
  callsQuerySchema,
  faqCreateSchema,
  faqUpdateSchema,
  dateRangeQuerySchema,
} from './validate';

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

// ==========================================
// validateBody / validateQuery
// ==========================================

describe('validateBody', () => {
  let next: NextFunction;
  beforeEach(() => { next = vi.fn(); });

  const schema = z.object({ name: z.string().min(1), age: z.number().int().min(0) });

  it('calls next() and assigns parsed body on success', () => {
    const req = { body: { name: 'Alice', age: 30 } } as Request;
    const res = mockRes();

    validateBody(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Alice', age: 30 });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with structured details on validation failure', () => {
    const req = { body: { name: '', age: -1 } } as Request;
    const res = mockRes();

    validateBody(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: expect.any(String), message: expect.any(String) }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards non-Zod errors to next()', () => {
    const throwingSchema = {
      parse: () => { throw new Error('boom'); },
    } as unknown as z.ZodSchema;
    const req = { body: {} } as Request;
    const res = mockRes();

    validateBody(throwingSchema)(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('validateQuery', () => {
  let next: NextFunction;
  beforeEach(() => { next = vi.fn(); });

  it('parses and assigns query on success', () => {
    const schema = z.object({ q: z.string() });
    const req = { query: { q: 'hello' } } as unknown as Request;
    const res = mockRes();

    validateQuery(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual({ q: 'hello' });
  });

  it('returns 400 with "Invalid query parameters" on failure', () => {
    const schema = z.object({ q: z.string().min(1) });
    const req = { query: {} } as unknown as Request;
    const res = mockRes();

    validateQuery(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Invalid query parameters' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

// ==========================================
// Schema spot-checks (focus on security-relevant boundaries)
// ==========================================

describe('loginSchema', () => {
  it('accepts well-formed credentials', () => {
    expect(loginSchema.parse({ email: 'a@b.com', password: 'pw' })).toEqual({
      email: 'a@b.com',
      password: 'pw',
    });
  });

  it('rejects invalid email', () => {
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'pw' })).toThrow();
  });

  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).toThrow();
  });

  it('rejects oversized email (>255)', () => {
    const email = 'a'.repeat(250) + '@b.com';
    expect(() => loginSchema.parse({ email, password: 'pw' })).toThrow();
  });

  it('rejects oversized password (>128)', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: 'p'.repeat(129) })).toThrow();
  });
});

describe('registerSchema', () => {
  it('defaults role to "user" when omitted', () => {
    const parsed = registerSchema.parse({
      email: 'a@b.com',
      password: 'longenough',
      fullName: 'Test User',
    });
    expect(parsed.role).toBe('user');
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() =>
      registerSchema.parse({ email: 'a@b.com', password: 'short', fullName: 'X' })
    ).toThrow();
  });

  it('rejects role values outside the enum (privilege escalation guard)', () => {
    expect(() =>
      registerSchema.parse({
        email: 'a@b.com',
        password: 'longenough',
        fullName: 'X',
        role: 'admin',
      })
    ).toThrow();
  });

  it('accepts role=moderator', () => {
    const parsed = registerSchema.parse({
      email: 'a@b.com',
      password: 'longenough',
      fullName: 'X',
      role: 'moderator',
    });
    expect(parsed.role).toBe('moderator');
  });
});

describe('appointmentModifySchema', () => {
  it('accepts a single valid field', () => {
    expect(appointmentModifySchema.parse({ date: '2026-05-21' })).toEqual({ date: '2026-05-21' });
  });

  it('rejects empty object (must provide at least one field)', () => {
    expect(() => appointmentModifySchema.parse({})).toThrow();
  });

  it('rejects malformed date', () => {
    expect(() => appointmentModifySchema.parse({ date: '5/21/2026' })).toThrow();
  });

  it('rejects malformed time', () => {
    expect(() => appointmentModifySchema.parse({ time: '9:00 AM' })).toThrow();
  });

  it('rejects negative durationMinutes', () => {
    expect(() => appointmentModifySchema.parse({ durationMinutes: -1 })).toThrow();
  });

  it('rejects durationMinutes beyond max (480)', () => {
    expect(() => appointmentModifySchema.parse({ durationMinutes: 500 })).toThrow();
  });

  it('rejects invalid status enum', () => {
    expect(() => appointmentModifySchema.parse({ status: 'pending' })).toThrow();
  });

  it('rejects invalid appointmentType enum', () => {
    expect(() => appointmentModifySchema.parse({ appointmentType: 'massage' })).toThrow();
  });

  it('rejects non-positive doctorId', () => {
    expect(() => appointmentModifySchema.parse({ doctorId: 0 })).toThrow();
  });
});

describe('appointmentCancelSchema', () => {
  it('accepts empty body (reason optional)', () => {
    expect(appointmentCancelSchema.parse({})).toEqual({});
  });

  it('rejects reason >500 chars', () => {
    expect(() => appointmentCancelSchema.parse({ reason: 'x'.repeat(501) })).toThrow();
  });
});

describe('appointmentQuerySchema', () => {
  it('coerces numeric strings for limit/offset', () => {
    const parsed = appointmentQuerySchema.parse({ limit: '50', offset: '10' });
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(10);
  });

  it('rejects limit above 200', () => {
    expect(() => appointmentQuerySchema.parse({ limit: '500' })).toThrow();
  });

  it('rejects non-numeric limit', () => {
    expect(() => appointmentQuerySchema.parse({ limit: 'abc' })).toThrow();
  });

  it('rejects negative offset', () => {
    expect(() => appointmentQuerySchema.parse({ offset: '-1' })).toThrow();
  });
});

describe('patientUpdateSchema', () => {
  it('requires at least one field', () => {
    expect(() => patientUpdateSchema.parse({})).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => patientUpdateSchema.parse({ email: 'no-at-sign' })).toThrow();
  });

  it('rejects notes >2000 chars', () => {
    expect(() => patientUpdateSchema.parse({ notes: 'x'.repeat(2001) })).toThrow();
  });
});

describe('patientSearchSchema', () => {
  it('requires non-empty q', () => {
    expect(() => patientSearchSchema.parse({ q: '' })).toThrow();
  });

  it('caps limit at 100', () => {
    expect(() => patientSearchSchema.parse({ q: 'a', limit: '101' })).toThrow();
  });
});

describe('callsQuerySchema', () => {
  it('rejects unsupported transferred value', () => {
    expect(() => callsQuerySchema.parse({ transferred: 'yes' })).toThrow();
  });

  it('accepts transferred=true / false', () => {
    expect(callsQuerySchema.parse({ transferred: 'true' }).transferred).toBe('true');
    expect(callsQuerySchema.parse({ transferred: 'false' }).transferred).toBe('false');
  });

  it('caps limit at 500', () => {
    expect(() => callsQuerySchema.parse({ limit: '501' })).toThrow();
  });
});

describe('faqCreateSchema', () => {
  it('accepts a valid FAQ', () => {
    const parsed = faqCreateSchema.parse({
      questionPattern: 'What are your hours?',
      answer: 'Mon-Fri 9-5',
      category: 'hours',
    });
    expect(parsed.questionPattern).toBe('What are your hours?');
  });

  it('rejects answer >5000 chars', () => {
    expect(() =>
      faqCreateSchema.parse({
        questionPattern: 'q',
        answer: 'a'.repeat(5001),
        category: 'c',
      })
    ).toThrow();
  });

  it('rejects more than 20 question variations', () => {
    expect(() =>
      faqCreateSchema.parse({
        questionPattern: 'q',
        answer: 'a',
        category: 'c',
        questionVariations: Array.from({ length: 21 }, (_, i) => `v${i}`),
      })
    ).toThrow();
  });

  it('rejects priority outside 0-100', () => {
    expect(() =>
      faqCreateSchema.parse({ questionPattern: 'q', answer: 'a', category: 'c', priority: 101 })
    ).toThrow();
  });
});

describe('faqUpdateSchema', () => {
  it('requires at least one field', () => {
    expect(() => faqUpdateSchema.parse({})).toThrow();
  });

  it('allows answerShort to be null', () => {
    const parsed = faqUpdateSchema.parse({ answerShort: null });
    expect(parsed.answerShort).toBeNull();
  });
});

describe('dateRangeQuerySchema', () => {
  it('accepts well-formed dates', () => {
    expect(dateRangeQuerySchema.parse({ start_date: '2026-01-01', end_date: '2026-12-31' })).toEqual({
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    });
  });

  it('rejects malformed date', () => {
    expect(() => dateRangeQuerySchema.parse({ start_date: '2026/01/01' })).toThrow();
  });

  it('accepts empty object (both optional)', () => {
    expect(dateRangeQuerySchema.parse({})).toEqual({});
  });
});

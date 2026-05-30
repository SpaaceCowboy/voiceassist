import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/database', () => ({
  default: { query: mockQuery },
  query: mockQuery,
}));

vi.mock('../utils/helpers', async () => {
  const actual = await vi.importActual<typeof import('../utils/helpers')>('../utils/helpers');
  return {
    ...actual,
    generateConfirmationCode: vi.fn(() => 'ABC123'),
  };
});

import {
  checkAvailability,
  create,
  findById,
  findByConfirmationCode,
  findAll,
  modify,
  cancel,
  markCompleted,
  markNoShow,
  confirm,
  getStats,
} from './appointment';

function rows<T>(r: T[]) {
  return { rows: r, rowCount: r.length };
}

beforeEach(() => {
  mockQuery.mockReset();
});

// ==========================================
// checkAvailability
// ==========================================

describe('checkAvailability', () => {
  it('returns unavailable when blocked_times has a matching row', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ reason: 'Holiday' }]));

    const result = await checkAvailability('2026-12-25', '10:00');

    expect(result.available).toBe(false);
    expect(result.reason).toBe('Holiday');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('falls back to default reason if blocked row has no reason', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ reason: null }]));

    const result = await checkAvailability('2026-12-25', '10:00');

    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/not available/i);
  });

  it('returns available when no blocks and count is below max', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([]))                  // blocked
      .mockResolvedValueOnce(rows([{ count: '1' }]));   // count

    const result = await checkAvailability('2026-05-21', '10:00');

    expect(result.available).toBe(true);
    expect(result.currentBookings).toBe(1);
    expect(result.maxCapacity).toBe(3);
  });

  it('returns unavailable with alternatives when slot is full', async () => {
    process.env.MAX_APPOINTMENTS_PER_SLOT = '3';
    mockQuery
      // First checkAvailability call
      .mockResolvedValueOnce(rows([]))                  // blocked
      .mockResolvedValueOnce(rows([{ count: '3' }]))    // count (full)
      // First alternative: offset +1 → 11:00, available
      .mockResolvedValueOnce(rows([]))
      .mockResolvedValueOnce(rows([{ count: '0' }]))
      // offset -1 → 09:00, available
      .mockResolvedValueOnce(rows([]))
      .mockResolvedValueOnce(rows([{ count: '0' }]))
      // offset +2 → 12:00, available (this would be #3, stops here)
      .mockResolvedValueOnce(rows([]))
      .mockResolvedValueOnce(rows([{ count: '0' }]));

    const result = await checkAvailability('2026-05-21', '10:00');

    expect(result.available).toBe(false);
    expect(result.currentBookings).toBe(3);
    expect(result.reason).toMatch(/fully booked/i);
    expect(result.alternativeSlots).toHaveLength(3);
    expect(result.alternativeSlots?.[0].time).toBe('11:00');
  });

  it('passes doctorId and locationId into the count query', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([]))
      .mockResolvedValueOnce(rows([{ count: '0' }]));

    await checkAvailability('2026-05-21', '10:00', 7, 2);

    const blockedCall = mockQuery.mock.calls[0];
    expect(blockedCall[1]).toEqual(['2026-05-21', 7, '10:00']);

    const countCall = mockQuery.mock.calls[1];
    expect(countCall[0]).toContain('doctor_id = $3');
    expect(countCall[0]).toContain('location_id = $4');
    expect(countCall[1]).toEqual(['2026-05-21', '10:00', 7, 2]);
  });
});

// ==========================================
// create
// ==========================================

describe('create', () => {
  it('inserts with defaults and returns the row', async () => {
    const fakeRow = { id: 99, confirmation_code: 'ABC123' };
    mockQuery.mockResolvedValueOnce(rows([fakeRow]));

    const result = await create({
      patientId: 1,
      date: '2026-05-21',
      time: '10:00',
    });

    expect(result).toEqual(fakeRow);
    const [, params] = mockQuery.mock.calls[0];
    // patientId
    expect(params[0]).toBe(1);
    // doctorId, departmentId, locationId default to null
    expect(params[1]).toBeNull();
    expect(params[2]).toBeNull();
    expect(params[3]).toBeNull();
    // date / time
    expect(params[4]).toBe('2026-05-21');
    expect(params[5]).toBe('10:00');
    // duration default
    expect(params[6]).toBe(30);
    // type default
    expect(params[7]).toBe('consultation');
    // source default
    expect(params[13]).toBe('phone_ai');
    // confirmation code from mocked helper
    expect(params[14]).toBe('ABC123');
  });

  it('preserves explicit overrides', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));

    await create({
      patientId: 1,
      doctorId: 5,
      departmentId: 2,
      locationId: 3,
      date: '2026-05-21',
      time: '10:00',
      durationMinutes: 60,
      appointmentType: 'procedure',
      isNewPatient: true,
      source: 'website',
    });

    const [, params] = mockQuery.mock.calls[0];
    expect(params[1]).toBe(5);
    expect(params[6]).toBe(60);
    expect(params[7]).toBe('procedure');
    expect(params[10]).toBe(true);
    expect(params[13]).toBe('website');
  });
});

// ==========================================
// findById / findByConfirmationCode
// ==========================================

describe('findById', () => {
  it('returns row when found', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    expect(await findById(1)).toEqual({ id: 1 });
  });

  it('returns null when not found', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await findById(999)).toBeNull();
  });
});

describe('findByConfirmationCode', () => {
  it('uppercases the code before querying', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));

    await findByConfirmationCode('abc123');

    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBe('ABC123');
  });

  it('returns null when not found', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await findByConfirmationCode('XYZ')).toBeNull();
  });
});

// ==========================================
// findAll — dynamic WHERE/LIMIT/OFFSET
// ==========================================

describe('findAll', () => {
  it('excludes cancelled by default when no status filter is given', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));

    await findAll();

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("a.status NOT IN ('cancelled')");
    expect(params).toEqual([]);
  });

  it('filters by explicit status', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));

    await findAll({ status: 'confirmed' });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('a.status = $1');
    expect(sql).not.toContain("NOT IN ('cancelled')");
    expect(params).toEqual(['confirmed']);
  });

  it('combines date + limit + offset', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));

    await findAll({ date: '2026-05-21', limit: 50, offset: 10 });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('a.appointment_date = $1');
    expect(sql).toMatch(/LIMIT \$2/);
    expect(sql).toMatch(/OFFSET \$3/);
    expect(params).toEqual(['2026-05-21', 50, 10]);
  });
});

// ==========================================
// modify
// ==========================================

describe('modify', () => {
  it('returns findById result when no fields are provided', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    const result = await modify(5, {});

    expect(result).toEqual({ id: 5 });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][0]).toContain('FROM appointments a');
    expect(mockQuery.mock.calls[0][0]).toContain('WHERE a.id = $1');
  });

  it('builds SET clause from provided fields only', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    await modify(5, { date: '2026-06-01', time: '14:00' });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('appointment_date = $1');
    expect(sql).toContain('appointment_time = $2');
    expect(sql).not.toContain('status = ');
    expect(params).toEqual(['2026-06-01', '14:00', 5]);
  });

  it('maps camelCase input keys to snake_case columns', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    await modify(5, {
      doctorId: 7,
      durationMinutes: 45,
      reasonForVisit: 'follow-up',
    });

    const [sql] = mockQuery.mock.calls[0];
    expect(sql).toContain('doctor_id = $1');
    expect(sql).toContain('duration_minutes = $2');
    expect(sql).toContain('reason_for_visit = $3');
  });

  it('returns null when UPDATE affects no rows', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));

    const result = await modify(999, { status: 'confirmed' });

    expect(result).toBeNull();
  });

  // SECURITY/STATE-MACHINE NOTE:
  // This documents the current behavior — modify() will accept ANY status
  // transition the caller provides (e.g. cancelled → scheduled). The LOW
  // pending-work item is to add a state machine here. When that's added,
  // this test should flip to expect a rejection.
  it('currently allows arbitrary status transitions (no state machine)', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5, status: 'scheduled' }]));

    const result = await modify(5, { status: 'scheduled' });

    expect(result).not.toBeNull();
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('status = $1');
    expect(params[0]).toBe('scheduled');
  });
});

// ==========================================
// status transitions
// ==========================================

describe('cancel', () => {
  it("sets status='cancelled' with reason", async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5, status: 'cancelled' }]));

    const result = await cancel(5, 'patient request');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("status = 'cancelled'");
    expect(sql).toContain('cancelled_at = CURRENT_TIMESTAMP');
    expect(params).toEqual([5, 'patient request']);
    expect(result).toEqual({ id: 5, status: 'cancelled' });
  });

  it('passes null reason when omitted', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    await cancel(5);

    expect(mockQuery.mock.calls[0][1]).toEqual([5, null]);
  });

  it('returns null when no row updated', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await cancel(999)).toBeNull();
  });
});

describe('markCompleted / markNoShow / confirm', () => {
  it("markCompleted sets status='completed'", async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await markCompleted(1);
    expect(mockQuery.mock.calls[0][0]).toContain("status = 'completed'");
    expect(mockQuery.mock.calls[0][1]).toEqual([1]);
  });

  it("markNoShow sets status='no_show'", async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await markNoShow(1);
    expect(mockQuery.mock.calls[0][0]).toContain("status = 'no_show'");
  });

  it("confirm sets status='confirmed'", async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await confirm(1);
    expect(mockQuery.mock.calls[0][0]).toContain("status = 'confirmed'");
  });
});

// ==========================================
// getStats
// ==========================================

describe('getStats', () => {
  it('returns aggregated counts for the date range', async () => {
    const stats = {
      total: '10',
      scheduled: '4',
      confirmed: '3',
      completed: '2',
      cancelled: '1',
      no_shows: '0',
      from_ai: '5',
    };
    mockQuery.mockResolvedValueOnce(rows([stats]));

    const result = await getStats('2026-05-01', '2026-05-31');

    expect(result).toEqual(stats);
    expect(mockQuery.mock.calls[0][1]).toEqual(['2026-05-01', '2026-05-31']);
  });
});

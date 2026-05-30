import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/database', () => ({
  default: { query: mockQuery },
  query: mockQuery,
}));

import {
  findOrCreate,
  findByPhone,
  findById,
  getPatientWithHistory,
  search,
  update,
  updateName,
  updateInsurance,
  incrementAppointmentCount,
  addNote,
} from './patient';

const rows = <T,>(r: T[]) => ({ rows: r, rowCount: r.length });

beforeEach(() => {
  mockQuery.mockReset();
});

describe('findOrCreate', () => {
  it('returns existing patient when phone matches', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1, phone: '+15551234567' }]));

    const p = await findOrCreate('+15551234567');

    expect(p.id).toBe(1);
    expect(mockQuery).toHaveBeenCalledTimes(1); // no INSERT
  });

  it('inserts new patient when not found', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([])) // findByPhone miss
      .mockResolvedValueOnce(rows([{ id: 7, phone: '+15559999999' }])); // INSERT

    const p = await findOrCreate('+15559999999');

    expect(p.id).toBe(7);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[1][0]).toMatch(/insert into patients/i);
    expect(mockQuery.mock.calls[1][1]).toEqual(['+15559999999']);
  });
});

describe('findByPhone / findById', () => {
  it('returns null when not found', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await findByPhone('+1')).toBeNull();

    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await findById(999)).toBeNull();
  });

  it('returns the row when found', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    expect(await findById(1)).toEqual({ id: 1 });
  });
});

describe('getPatientWithHistory', () => {
  it('returns null when patient does not exist', async () => {
    mockQuery.mockResolvedValueOnce(rows([])); // findByPhone miss
    expect(await getPatientWithHistory('+1')).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('returns patient + appointments + recent_calls', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([{ id: 1, phone: '+1', full_name: 'A' }])) // findByPhone
      .mockResolvedValueOnce(rows([{ id: 10 }, { id: 11 }]))                  // appts
      .mockResolvedValueOnce(rows([{ id: 100 }]));                            // calls

    const result = await getPatientWithHistory('+1');

    expect(result).toMatchObject({
      id: 1,
      appointments: [{ id: 10 }, { id: 11 }],
      recent_calls: [{ id: 100 }],
    });
  });
});

describe('search', () => {
  it('wraps query in %...% and applies default limit 20', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await search('alice');
    expect(mockQuery.mock.calls[0][1]).toEqual(['%alice%', 20]);
  });

  it('honors explicit limit', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await search('alice', 50);
    expect(mockQuery.mock.calls[0][1]).toEqual(['%alice%', 50]);
  });
});

describe('update', () => {
  it('short-circuits to findById when no fields are provided', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    const result = await update(5, {});

    expect(result).toEqual({ id: 5 });
    expect(mockQuery.mock.calls[0][0]).toMatch(/SELECT \* FROM patients WHERE id = \$1/);
  });

  it('builds SET clause only for provided fields', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    await update(5, { full_name: 'New Name', email: 'new@test.com' });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('full_name = $1');
    expect(sql).toContain('email = $2');
    expect(sql).not.toContain('insurance_provider');
    expect(params).toEqual(['New Name', 'new@test.com', 5]);
  });

  it('returns null when no row updated', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await update(999, { full_name: 'X' })).toBeNull();
  });
});

describe('updateName / updateInsurance', () => {
  it('updateName forwards to update()', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await updateName(1, 'Bob');
    expect(mockQuery.mock.calls[0][1]).toEqual(['Bob', 1]);
  });

  it('updateInsurance sets provider only when id omitted', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await updateInsurance(1, 'Aetna');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('insurance_provider = $1');
    expect(sql).not.toContain('insurance_id');
    expect(params).toEqual(['Aetna', 1]);
  });

  it('updateInsurance sets provider + id when both supplied', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await updateInsurance(1, 'Aetna', 'A12345');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('insurance_provider = $1');
    expect(sql).toContain('insurance_id = $2');
    expect(params).toEqual(['Aetna', 'A12345', 1]);
  });
});

describe('incrementAppointmentCount', () => {
  it('runs an UPDATE += 1 query', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await incrementAppointmentCount(42);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('total_appointments + 1');
    expect(params).toEqual([42]);
  });
});

describe('addNote', () => {
  it('prepends an ISO timestamp and uses COALESCE-style append', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));

    await addNote(1, 'patient prefers AM slots');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('notes IS NULL');
    expect(params[0]).toBe(1);
    expect(params[1]).toMatch(/^\[\d{4}-\d{2}-\d{2}T.*\] patient prefers AM slots$/);
  });

  it('returns null when no row updated', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await addNote(999, 'x')).toBeNull();
  });
});

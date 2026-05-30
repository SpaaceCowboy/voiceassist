import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/database', () => ({
  default: { query: mockQuery },
  query: mockQuery,
}));

import {
  findMatch,
  findById,
  findAll,
  findByCategory,
  getCategories,
  create,
  update,
  deactivate,
  incrementUsageCount,
  flushUsageCounts,
  getMostUsed,
  getUnused,
} from './faq';

function rows<T>(r: T[]) {
  return { rows: r, rowCount: r.length };
}

beforeEach(async () => {
  mockQuery.mockReset();
  // Drain any pending usage from prior tests so each test starts clean.
  mockQuery.mockResolvedValue(rows([]));
  await flushUsageCounts();
  mockQuery.mockReset();
});

// ==========================================
// findMatch — three-tier fallback
// ==========================================

describe('findMatch', () => {
  it('returns first-tier (pattern) match and buffers a usage increment', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1, answer: 'hi' }]));

    const result = await findMatch('What are your HOURS?');

    expect(result).toEqual({ id: 1, answer: 'hi' });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('LOWER(question_pattern) LIKE');
    expect(params[0]).toBe('%what are your hours?%'); // lowercased + trimmed

    // Usage increment is buffered, not flushed yet.
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce(rows([]));
    await flushUsageCounts();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const flushParams = mockQuery.mock.calls[0][1];
    expect(flushParams).toEqual([1, 1]); // id=1, delta=1
  });

  it('falls through to variations when pattern match misses', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([]))                       // pattern miss
      .mockResolvedValueOnce(rows([{ id: 2, answer: 'v' }])); // variations hit

    const result = await findMatch('parking?');

    expect(result).toEqual({ id: 2, answer: 'v' });
    expect(mockQuery.mock.calls[1][0]).toContain('unnest(question_variations)');
  });

  it('falls through to keyword match when pattern and variations miss', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([]))                          // pattern
      .mockResolvedValueOnce(rows([]))                          // variations
      .mockResolvedValueOnce(rows([{ id: 3, answer: 'kw' }]));  // keyword

    const result = await findMatch('where is parking located');

    expect(result).toEqual({ id: 3, answer: 'kw' });
    const [sql, params] = mockQuery.mock.calls[2];
    expect(sql).toContain('LIKE ALL($1::text[])');
    // Words shorter than 4 chars are dropped ("is").
    expect(params[0]).toEqual(['%where%', '%parking%', '%located%']);
  });

  it('skips keyword query when no words exceed 3 chars', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([])) // pattern
      .mockResolvedValueOnce(rows([])); // variations

    const result = await findMatch('hi ok no');

    expect(result).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(2); // no 3rd keyword query
  });

  it('returns null when nothing matches', async () => {
    mockQuery
      .mockResolvedValueOnce(rows([]))
      .mockResolvedValueOnce(rows([]))
      .mockResolvedValueOnce(rows([]));

    expect(await findMatch('unmatched question text')).toBeNull();
  });
});

// ==========================================
// Simple finders
// ==========================================

describe('findById / findAll / findByCategory / getCategories', () => {
  it('findById returns row or null', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    expect(await findById(1)).toEqual({ id: 1 });

    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await findById(999)).toBeNull();
  });

  it('findAll filters by is_active', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }, { id: 2 }]));
    const result = await findAll();
    expect(result).toHaveLength(2);
    expect(mockQuery.mock.calls[0][0]).toContain('is_active = true');
  });

  it('findByCategory passes category param', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await findByCategory('hours');
    expect(mockQuery.mock.calls[0][1]).toEqual(['hours']);
  });

  it('getCategories maps rows to strings', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ category: 'hours' }, { category: 'parking' }]));
    expect(await getCategories()).toEqual(['hours', 'parking']);
  });
});

// ==========================================
// create / update / deactivate
// ==========================================

describe('create', () => {
  it('applies defaults for variations / answerShort / priority', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));

    await create({
      questionPattern: 'q',
      answer: 'a',
      category: 'c',
    });

    const [, params] = mockQuery.mock.calls[0];
    expect(params[1]).toEqual([]);   // questionVariations default
    expect(params[3]).toBeNull();    // answerShort default
    expect(params[5]).toBe(0);       // priority default
  });
});

describe('update', () => {
  it('returns findById result when no fields are provided', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    const result = await update(5, {});

    expect(result).toEqual({ id: 5 });
    expect(mockQuery.mock.calls[0][0]).toContain('SELECT * FROM faq_responses WHERE id = $1');
  });

  it('builds SET clause from provided fields only', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    await update(5, { answer: 'new', priority: 10 });

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('answer = $1');
    expect(sql).toContain('priority = $2');
    expect(sql).not.toContain('category = ');
    expect(params).toEqual(['new', 10, 5]);
  });

  it('handles explicit null for answer_short', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 5 }]));

    await update(5, { answer_short: null as unknown as string });

    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBeNull();
  });

  it('returns null when no row updated', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await update(999, { answer: 'x' })).toBeNull();
  });
});

describe('deactivate', () => {
  it('sets is_active=false', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await deactivate(7);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('is_active = false');
    expect(params).toEqual([7]);
  });
});

// ==========================================
// In-memory usage counter (the new batcher)
// ==========================================

describe('incrementUsageCount / flushUsageCounts', () => {
  it('flush is a no-op when nothing is buffered', async () => {
    await flushUsageCounts();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('coalesces multiple increments per id into a single UPDATE row', async () => {
    incrementUsageCount(1);
    incrementUsageCount(1);
    incrementUsageCount(1);
    incrementUsageCount(2);

    mockQuery.mockResolvedValueOnce(rows([]));
    await flushUsageCounts();

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('UPDATE faq_responses');
    expect(sql).toContain('FROM (VALUES');
    expect(sql).toContain('times_used = faq_responses.times_used + v.delta');
    // Don't touch updated_at on the analytics counter.
    expect(sql).not.toContain('updated_at');
    // Params alternate (id, delta) per row.
    expect(params).toEqual([1, 3, 2, 1]);
  });

  it('clears the buffer on successful flush', async () => {
    incrementUsageCount(1);
    mockQuery.mockResolvedValueOnce(rows([]));
    await flushUsageCounts();

    mockQuery.mockReset();
    await flushUsageCounts();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('re-queues counts on flush failure so they are not lost', async () => {
    incrementUsageCount(1);
    incrementUsageCount(2);
    incrementUsageCount(2);

    mockQuery.mockRejectedValueOnce(new Error('db down'));
    await flushUsageCounts(); // does NOT throw

    // Next flush should retry the same (id, delta) pairs.
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce(rows([]));
    await flushUsageCounts();

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][1]).toEqual([1, 1, 2, 2]);
  });

  it('merges concurrent increments that arrive during a failed flush', async () => {
    incrementUsageCount(1); // pre-flush: id=1 delta=1

    let resolveQuery: (v: unknown) => void;
    const queryPromise = new Promise((_, reject) => {
      resolveQuery = reject;
    });
    mockQuery.mockReturnValueOnce(queryPromise);

    const flushPromise = flushUsageCounts();

    // Concurrent increment lands while the DB call is in flight — should
    // go into the *next* flush window since the buffer was already snapshotted.
    incrementUsageCount(1);

    resolveQuery!(new Error('db blew up'));
    await flushPromise;

    // After failure: snapshot is restored (+1) and merged with the in-flight (+1) → 2.
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce(rows([]));
    await flushUsageCounts();
    expect(mockQuery.mock.calls[0][1]).toEqual([1, 2]);
  });

  it('snapshots before await: increments during the in-flight flush are NOT lost', async () => {
    incrementUsageCount(1);

    let resolveQuery: (v: unknown) => void;
    const queryPromise = new Promise((resolve) => {
      resolveQuery = resolve;
    });
    mockQuery.mockReturnValueOnce(queryPromise);

    const flushPromise = flushUsageCounts();

    // Concurrent increment while flush is awaiting the DB.
    incrementUsageCount(1);

    resolveQuery!(rows([]));
    await flushPromise;

    // The concurrent increment should appear in the *next* flush.
    mockQuery.mockReset();
    mockQuery.mockResolvedValueOnce(rows([]));
    await flushUsageCounts();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][1]).toEqual([1, 1]);
  });
});

// ==========================================
// Analytics finders
// ==========================================

describe('getMostUsed / getUnused', () => {
  it('getMostUsed defaults limit to 10', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await getMostUsed();
    expect(mockQuery.mock.calls[0][1]).toEqual([10]);
  });

  it('getMostUsed honors explicit limit', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await getMostUsed(25);
    expect(mockQuery.mock.calls[0][1]).toEqual([25]);
  });

  it('getUnused filters times_used = 0', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await getUnused();
    expect(mockQuery.mock.calls[0][0]).toContain('times_used = 0');
  });
});

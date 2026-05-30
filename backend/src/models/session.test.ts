import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/database', () => ({
  default: { query: mockQuery },
  query: mockQuery,
}));

import {
  upsertSession,
  markInactive,
  deleteOldSessions,
  getSessionStats,
} from './session';

const rows = <T,>(r: T[], rowCount?: number) => ({
  rows: r,
  rowCount: rowCount ?? r.length,
});

beforeEach(() => mockQuery.mockReset());

describe('upsertSession', () => {
  it('runs ON CONFLICT upsert with JSON-encoded payload', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));

    const state = { currentStep: 'listening' };
    const messages = [{ role: 'user', content: 'hi' }];
    const collected = { name: 'Alice' };

    await upsertSession('CA123', state, messages, collected, true);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('INSERT INTO conversation_sessions');
    expect(sql).toContain('ON CONFLICT (call_sid) DO UPDATE');
    expect(params[0]).toBe('CA123');
    expect(params[1]).toBe(JSON.stringify(state));
    expect(params[2]).toBe(JSON.stringify(messages));
    expect(params[3]).toBe(JSON.stringify(collected));
    expect(params[4]).toBe(true);
  });

  it('passes is_active=false through', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await upsertSession('CA123', {}, [], {}, false);
    expect(mockQuery.mock.calls[0][1][4]).toBe(false);
  });
});

describe('markInactive', () => {
  it('sets is_active=FALSE for the given call_sid', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await markInactive('CA123');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('is_active = FALSE');
    expect(params).toEqual(['CA123']);
  });
});

describe('deleteOldSessions', () => {
  it('defaults retention to 24 hours and returns row count', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }, { id: 2 }], 2));

    const count = await deleteOldSessions();

    expect(count).toBe(2);
    expect(mockQuery.mock.calls[0][1]).toEqual([24]);
    expect(mockQuery.mock.calls[0][0]).toContain('is_active = FALSE');
    expect(mockQuery.mock.calls[0][0]).toContain("INTERVAL '1 hour'");
  });

  it('honors custom retention window', async () => {
    mockQuery.mockResolvedValueOnce(rows([], 0));
    const count = await deleteOldSessions(72);
    expect(count).toBe(0);
    expect(mockQuery.mock.calls[0][1]).toEqual([72]);
  });

  it('returns 0 when rowCount is null/undefined', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: null });
    expect(await deleteOldSessions()).toBe(0);
  });
});

describe('getSessionStats', () => {
  it('parses counts and exposes camelCase oldestInactive', async () => {
    mockQuery.mockResolvedValueOnce(
      rows([
        {
          total: '10',
          active: '3',
          inactive: '7',
          oldest_inactive: '2026-05-20T00:00:00Z',
        },
      ])
    );

    const stats = await getSessionStats();

    expect(stats).toEqual({
      total: 10,
      active: 3,
      inactive: 7,
      oldestInactive: '2026-05-20T00:00:00Z',
    });
  });

  it('returns null for oldestInactive when there are no inactive sessions', async () => {
    mockQuery.mockResolvedValueOnce(
      rows([{ total: '0', active: '0', inactive: '0', oldest_inactive: null }])
    );
    const stats = await getSessionStats();
    expect(stats.oldestInactive).toBeNull();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({ mockQuery: vi.fn() }));

vi.mock('../config/database', () => ({
  default: { query: mockQuery },
  query: mockQuery,
}));

import {
  create,
  completeCall,
  appendToTranscript,
  markTransferred,
  logError,
  linkAppointment,
  findByCallSid,
  findByPatient,
  findRecent,
  findTransferredCalls,
  findCallsWithErrors,
  getStats,
  getIntentBreakdown,
  getHourlyDistribution,
  getSentimentTrend,
} from './callLog';

const rows = <T,>(r: T[]) => ({ rows: r, rowCount: r.length });

beforeEach(() => mockQuery.mockReset());

describe('create', () => {
  it("inserts with status='in-progress' and patient_id null when omitted", async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1, call_sid: 'CA123' }]));

    const result = await create('CA123', '+15551111111', '+15552222222');

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("'in-progress'");
    expect(params).toEqual(['CA123', null, '+15551111111', '+15552222222']);
    expect(result.id).toBe(1);
  });

  it('passes customerId when provided', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await create('CA123', '+1', '+2', 42);
    expect(mockQuery.mock.calls[0][1][1]).toBe(42);
  });
});

describe('completeCall', () => {
  it('passes nulls for omitted optional fields', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));

    await completeCall('CA123', { status: 'completed' });

    const params = mockQuery.mock.calls[0][1];
    expect(params).toEqual(['CA123', 'completed', null, null, null, null, null, null, null, null]);
  });

  it('passes through provided fields in correct slots', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));

    await completeCall('CA123', {
      status: 'completed',
      durationSeconds: 60,
      transcript: 't',
      summary: 's',
      intent: 'booking',
      sentiment: 'positive',
      sentimentScore: 0.8,
      reservationId: 99,
    });

    const params = mockQuery.mock.calls[0][1];
    expect(params).toEqual(['CA123', 'completed', 60, 't', 's', 'booking', 'positive', 0.8, 99, null]);
  });

  it('returns null when no row updated', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await completeCall('missing', { status: 'completed' })).toBeNull();
  });
});

describe('appendToTranscript', () => {
  it('uppercases the speaker label and appends a newline', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await appendToTranscript('CA123', 'user', 'hello');
    expect(mockQuery.mock.calls[0][1]).toEqual(['CA123', '[USER]: hello\n']);
  });

  it('handles assistant speaker', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await appendToTranscript('CA123', 'assistant', 'hi back');
    expect(mockQuery.mock.calls[0][1]).toEqual(['CA123', '[ASSISTANT]: hi back\n']);
  });

  it('uses COALESCE so initial NULL transcripts seed correctly', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await appendToTranscript('CA123', 'user', 'x');
    expect(mockQuery.mock.calls[0][0]).toContain("COALESCE(transcript, '')");
  });
});

describe('markTransferred', () => {
  it('sets was_transferred + transfer_reason', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1 }]));
    await markTransferred('CA123', 'complex_request');
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('was_transferred = true');
    expect(params).toEqual(['CA123', 'complex_request']);
  });

  it('returns null when no row updated', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await markTransferred('missing', 'r')).toBeNull();
  });
});

describe('logError', () => {
  it('prepends ISO timestamp and appends newline', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await logError('CA123', 'tts failed');

    const params = mockQuery.mock.calls[0][1];
    expect(params[0]).toBe('CA123');
    expect(params[1]).toMatch(/^\[\d{4}-\d{2}-\d{2}T.*\] tts failed$/);
  });
});

describe('linkAppointment', () => {
  it('sets appointment_id', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await linkAppointment('CA123', 55);
    expect(mockQuery.mock.calls[0][1]).toEqual(['CA123', 55]);
  });
});

describe('finders', () => {
  it('findByCallSid returns row or null', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ id: 1, patient_name: 'A' }]));
    expect(await findByCallSid('CA123')).toEqual({ id: 1, patient_name: 'A' });

    mockQuery.mockResolvedValueOnce(rows([]));
    expect(await findByCallSid('missing')).toBeNull();
  });

  it('findByPatient passes customerId + limit', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await findByPatient(42, 10);
    expect(mockQuery.mock.calls[0][1]).toEqual([42, 10]);
  });

  it('findRecent defaults limit to 50', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await findRecent('2026-01-01', '2026-01-31');
    expect(mockQuery.mock.calls[0][1]).toEqual(['2026-01-01', '2026-01-31', 50]);
  });

  it('findTransferredCalls filters was_transferred=true', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await findTransferredCalls('2026-01-01', '2026-01-31');
    expect(mockQuery.mock.calls[0][0]).toContain('was_transferred = true');
  });

  it('findCallsWithErrors filters error_message IS NOT NULL', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await findCallsWithErrors('2026-01-01', '2026-01-31');
    expect(mockQuery.mock.calls[0][0]).toContain('error_message IS NOT NULL');
  });
});

describe('analytics', () => {
  it('getStats returns first row', async () => {
    const stats = { total_calls: '10', completed_calls: '8' };
    mockQuery.mockResolvedValueOnce(rows([stats]));
    expect(await getStats('2026-01-01', '2026-01-31')).toEqual(stats);
  });

  it('getIntentBreakdown returns full rows array', async () => {
    mockQuery.mockResolvedValueOnce(rows([{ intent: 'booking', count: '5' }]));
    expect(await getIntentBreakdown('2026-01-01', '2026-01-31')).toEqual([
      { intent: 'booking', count: '5' },
    ]);
  });

  it('getHourlyDistribution groups by EXTRACT(HOUR ...)', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await getHourlyDistribution('2026-01-01', '2026-01-31');
    expect(mockQuery.mock.calls[0][0]).toContain('EXTRACT(HOUR FROM started_at)');
  });

  it('getSentimentTrend filters sentiment_score IS NOT NULL', async () => {
    mockQuery.mockResolvedValueOnce(rows([]));
    await getSentimentTrend('2026-01-01', '2026-01-31');
    expect(mockQuery.mock.calls[0][0]).toContain('sentiment_score IS NOT NULL');
  });
});

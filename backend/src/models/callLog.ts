import db from '../config/database'
import logger from '../utils/logger'
import type {
    CallLog,
    CallStats,
    CallMetrics,
    IntentBreakdown,
    HourlyDistribution,
    AggregateMetrics,
} from '../../types/index'

//create a new log entry when the call starts
export async function create(
    callSid: string,
    fromNumber: string,
    toNumber: string,
    customerId?: number
): Promise<CallLog> {
    const result = await db.query<CallLog> (
        `INSERT INTO call_logs (call_sid, patient_id, from_number, to_number, status)
        VALUES ($1, $2, $3, $4, 'in-progress')
        RETURNING *`,
    [callSid, customerId || null,fromNumber, toNumber])
    
    logger.info(`Call log created`, {callSid})
    return result.rows[0]
}

//complete a call log with full detail
export async function completeCall(
    callSid: string,
    data: {
        status: string;
        durationSeconds?: number;
        transcript?: string;
        summary?: string;
        intent?: string,
        sentiment?: string;
        sentimentScore?: number;
        reservationId?: number;
        metrics?: CallMetrics;
    }
): Promise<CallLog | null> {
    const result = await db.query<CallLog>(
        `UPDATE call_logs SET
        ended_at = CURRENT_TIMESTAMP,
        status = $2,
        duration_seconds = $3,
        transcript = $4,
        summary = $5,
        intent = $6,
        sentiment = $7,
        sentiment_score = $8,
        appointment_id = $9,
        metrics = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE call_sid = $1
      RETURNING *`,
      [
        callSid,
        data.status,
        data.durationSeconds || null,
        data.transcript || null,
        data.summary || null,
        data.intent || null,
        data.sentiment || null,
        data.sentimentScore || null,
        data.reservationId || null,
        data.metrics ? JSON.stringify(data.metrics) : null,
      ]
    )

    if (result.rows[0]) {
        logger.info('call log complete', {callSid, status: data.status})
    }

    return result.rows[0] || null
}

//append text to the transcript

export async function appendToTranscript(
    callSid: string,
    speaker: 'user' | 'assistant',
    text: string
): Promise<void> {
    const line = `[${speaker.toLocaleUpperCase()}]: ${text}\n`

    await db.query(
        `UPDATE call_logs SET
        transcript = COALESCE(transcript, '') || $2,
        updated_at = CURRENT_TIMESTAMP
        WHERE call_sid = $1`,
        [callSid, line]
    )
}

//mart a call as transferred
export async function markTransferred(
    callSid: string,
    reason: string
): Promise<CallLog | null> {
    const result = await db.query<CallLog>(
        `UPDATE call_logs SET
        was_transferred = true,
        transfer_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE call_sid = $1
      RETURNING *`,
     [callSid, reason]
    )

    return result.rows[0] || null
}

// log errors during a call
export async function logError(
    callSid: string,
    errorMessage: string
): Promise<void> {
    await db.query(
        `UPDATE call_logs SET
        error_message = COALESCE(error_message, '') || $2 || E'\n',
        updated_at = CURRENT_TIMESTAMP
      WHERE call_sid = $1`,
     [callSid, `[${new Date().toISOString()}] ${errorMessage}`]
    )
}

//link a reservation to a call
export async function linkAppointment(
    callSid: string,
    reservationId: number
): Promise<void> {
    await db.query(
        `UPDATE call_logs SET
        appointment_id = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE call_sid = $1`,
     [callSid, reservationId]   
    )
} 

//find call log by call SID
export async function findByCallSid(callSid: string): Promise<CallLog | null> {
    const result = await db.query<CallLog>(
      `SELECT cl.*, c.full_name as patient_name
       FROM call_logs cl
       LEFT JOIN patients c ON cl.patient_id = c.id
       WHERE cl.call_sid = $1`,
      [callSid]
    );
    return result.rows[0] || null;
  }

//find calls by customer ID
export async function findByPatient(
    customerId: number,
    limit: number ,
): Promise<CallLog[]> {
    const result = await db.query<CallLog>(
        `SELECT * FROM call_logs
        WHERE patient_id = $1
        ORDER BY started_at DESC
        LIMIT $2`,
       [customerId, limit]
    )
    return result.rows;
}

//find recent calls within a date range
export async function findRecent(
  startDate: string,
  endDate: string,
  limit: number = 50
): Promise<CallLog[]> {
  const result = await db.query<CallLog>(
      `SELECT cl.*, c.full_name as patient_name
      FROM call_logs cl
      LEFT JOIN patients c ON cl.patient_id = c.id
      WHERE cl.started_at >= $1::date
        AND cl.started_at < ($2::date + INTERVAL '1 day')
      ORDER BY cl.started_at DESC
      LIMIT $3`,
     [startDate, endDate, limit]
  )
  return result.rows
}

//find transferred calls (for review)
export async function findTransferredCalls(
    startDate: string,
    endDate: string
): Promise<CallLog[]> {
    const result = await db.query<CallLog>(
        `SELECT cl.*, c.full_name as patient_name
        FROM call_logs cl
        LEFT JOIN patients c ON cl.patient_id = c.id
        WHERE cl.was_transferred = true
          AND cl.started_at >= $1::date
          AND cl.started_at < ($2::date + INTERVAL '1 day')
        ORDER BY cl.started_at DESC`,
       [startDate, endDate]
    )
    return result.rows
}

// find calls with errors
export async function findCallsWithErrors(
    startDate: string,
    endDate: string
): Promise<CallLog[]> {
    const result = await db.query<CallLog>(
        `SELECT cl.*, c.full_name as patient_name
        FROM call_logs cl
        LEFT JOIN patients c ON cl.patient_id = c.id
        WHERE cl.error_message IS NOT NULL
          AND cl.started_at >= $1::date
          AND cl.started_at < ($2::date + INTERVAL '1 day')
        ORDER BY cl.started_at DESC`,
       [startDate, endDate]
    )
    return result.rows
}

//get call statistics for a date range
export async function getStats(
    startDate: string,
    endDate: string
  ): Promise<CallStats> {
    const result = await db.query<CallStats>(
      `SELECT 
         COUNT(*) as total_calls,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_calls,
         AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL) as avg_duration,
         COUNT(*) FILTER (WHERE was_transferred = true) as transferred_calls,
         COUNT(*) FILTER (WHERE error_message IS NOT NULL) as calls_with_errors
       FROM call_logs
       WHERE started_at >= $1::date
         AND started_at < ($2::date + INTERVAL '1 day')`,
      [startDate, endDate]
    );
    
    return result.rows[0];
  }

  // get intent breakdown

  export async function getIntentBreakdown(
    startDate: string,
    endDate: string
  ): Promise<IntentBreakdown[]> {
    const result = await db.query<IntentBreakdown>(
      `SELECT 
         intent,
         COUNT(*) as count,
         ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
       FROM call_logs
       WHERE started_at >= $1::date
         AND started_at < ($2::date + INTERVAL '1 day')
         AND intent IS NOT NULL
       GROUP BY intent
       ORDER BY count DESC`,
      [startDate, endDate]
    );
    
    return result.rows;
  }

  //get hourly call distribution

  export async function getHourlyDistribution(
    startDate: string,
    endDate: string
  ): Promise<HourlyDistribution[]> {
    const result = await db.query<HourlyDistribution>(
      `SELECT 
         EXTRACT(HOUR FROM started_at) as hour,
         COUNT(*) as call_count
       FROM call_logs
       WHERE started_at >= $1::date
         AND started_at < ($2::date + INTERVAL '1 day')
       GROUP BY hour
       ORDER BY hour`,
      [startDate, endDate]
    );
    
    return result.rows;
  }

  //get average sentiment by day
  export async function getSentimentTrend(
    startDate: string,
    endDate: string
  ): Promise<Array<{ date: string; avg_sentiment: number; call_count: number }>> {
    const result = await db.query<{ date: string; avg_sentiment: number; call_count: number }>(
      `SELECT
         DATE(started_at) as date,
         AVG(sentiment_score) as avg_sentiment,
         COUNT(*) as call_count
       FROM call_logs
       WHERE started_at >= $1::date
         AND started_at < ($2::date + INTERVAL '1 day')
         AND sentiment_score IS NOT NULL
       GROUP BY DATE(started_at)
       ORDER BY date`,
      [startDate, endDate]
    );
    return result.rows
  }

  export async function getAggregateMetrics(
    startDate: string,
    endDate: string
  ): Promise<AggregateMetrics> {
    const result = await db.query<{
      calls_with_metrics: string;
      all_response_times: number[][] | null;
      all_confidence_scores: number[][] | null;
      all_tool_calls: { name: string; durationMs: number }[][] | null;
      avg_llm_calls: string;
      avg_tts_chunks: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE metrics IS NOT NULL) AS calls_with_metrics,
         array_agg(metrics->'responseTimes') FILTER (WHERE metrics IS NOT NULL) AS all_response_times,
         array_agg(metrics->'confidenceScores') FILTER (WHERE metrics IS NOT NULL) AS all_confidence_scores,
         array_agg(metrics->'toolCalls') FILTER (WHERE metrics IS NOT NULL) AS all_tool_calls,
         AVG((metrics->>'llmCalls')::numeric) FILTER (WHERE metrics IS NOT NULL) AS avg_llm_calls,
         AVG((metrics->>'ttsChunks')::numeric) FILTER (WHERE metrics IS NOT NULL) AS avg_tts_chunks
       FROM call_logs
       WHERE started_at >= $1::date
         AND started_at < ($2::date + INTERVAL '1 day')`,
      [startDate, endDate]
    );

    const row = result.rows[0];
    const callCount = parseInt(row.calls_with_metrics) || 0;

    if (callCount === 0) {
      return {
        callsWithMetrics: 0,
        avgResponseTimeMs: 0,
        p95ResponseTimeMs: 0,
        avgConfidence: 0,
        lowConfidenceRate: 0,
        avgLlmCallsPerCall: 0,
        avgTtsChunksPerCall: 0,
        toolUsage: [],
      };
    }

    // Flatten arrays from all calls
    const allTimes = (row.all_response_times || []).flat().filter(Boolean).map(Number);
    const allConfidences = (row.all_confidence_scores || []).flat().filter(Boolean).map(Number);
    const allTools = (row.all_tool_calls || []).flat().filter(Boolean);

    // Response time stats
    allTimes.sort((a, b) => a - b);
    const avgResponseTime = allTimes.length > 0
      ? allTimes.reduce((s, t) => s + t, 0) / allTimes.length
      : 0;
    const p95Index = Math.floor(allTimes.length * 0.95);
    const p95ResponseTime = allTimes.length > 0 ? allTimes[p95Index] || allTimes[allTimes.length - 1] : 0;

    // Confidence stats
    const avgConfidence = allConfidences.length > 0
      ? allConfidences.reduce((s, c) => s + c, 0) / allConfidences.length
      : 0;
    const lowConfidenceCount = allConfidences.filter(c => c < 0.6).length;
    const lowConfidenceRate = allConfidences.length > 0
      ? lowConfidenceCount / allConfidences.length
      : 0;

    // Tool usage breakdown
    const toolMap = new Map<string, { count: number; totalMs: number }>();
    for (const tc of allTools) {
      const entry = toolMap.get(tc.name) || { count: 0, totalMs: 0 };
      entry.count += 1;
      entry.totalMs += tc.durationMs || 0;
      toolMap.set(tc.name, entry);
    }
    const toolUsage = Array.from(toolMap.entries())
      .map(([name, { count, totalMs }]) => ({
        name,
        count,
        avgDurationMs: Math.round(totalMs / count),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      callsWithMetrics: callCount,
      avgResponseTimeMs: Math.round(avgResponseTime),
      p95ResponseTimeMs: Math.round(p95ResponseTime),
      avgConfidence: Math.round(avgConfidence * 1000) / 1000,
      lowConfidenceRate: Math.round(lowConfidenceRate * 1000) / 1000,
      avgLlmCallsPerCall: Math.round(parseFloat(row.avg_llm_calls || '0') * 10) / 10,
      avgTtsChunksPerCall: Math.round(parseFloat(row.avg_tts_chunks || '0') * 10) / 10,
      toolUsage,
    };
  }

  export default {
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
    getAggregateMetrics,
  };
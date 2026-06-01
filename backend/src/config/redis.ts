import Redis from 'ioredis'
import logger from '../utils/logger';
import type { Session, Message, SessionState, CollectedData } from '../../types/index';

// Upstash Redis client
//if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
 // throw new Error('Missing required environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
//}

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('Missing required environment variables: REDIS_URL');
}

function parseRedisUrl(url: string) {
  const useTls = url.startsWith('rediss://');
  const normalized = url.replace(/^rediss:\/\//, 'redis://');
  const parsed = new URL(normalized);

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
    password: decodeURIComponent(parsed.password),
    username: parsed.username || 'default',
    tls: useTls ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
  };
}

const client = new Redis(parseRedisUrl(redisUrl));
// Session constants
const SESSION_PREFIX = 'session:';
const SESSION_TTL = 3600; // 1 hour

async function updateSessionAtomically(
  callSid: string,
  mutate: (session: Session) => Session
): Promise<Session | null> {
  const key = `${SESSION_PREFIX}${callSid}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    await client.watch(key);
    const data = await client.get(key);

    if (!data) {
      await client.unwatch();
      logger.warn('Cannot update non-existent session', { callSid });
      return null;
    }

    let session: Session;
    try {
      session = JSON.parse(data) as Session;
    } catch (error) {
      await client.unwatch();
      logger.error('Failed to parse session', { callSid, error });
      return null;
    }

    const updatedSession = mutate(session);
    const result = await client
      .multi()
      .setex(key, SESSION_TTL, JSON.stringify(updatedSession))
      .exec();

    if (result) {
      return updatedSession;
    }
  }

  logger.warn('Session update conflict retries exhausted', { callSid });
  return getSession(callSid);
}

// Session functions
export async function setSession(callSid: string, session: Session): Promise<void> {
  const key = `${SESSION_PREFIX}${callSid}`;
  await client.setex(key, SESSION_TTL, JSON.stringify(session));
  logger.debug('Session saved', { callSid });
}

export async function getSession(callSid: string): Promise<Session | null> {
  const key = `${SESSION_PREFIX}${callSid}`;
  const data = await client.get(key);

  if (!data) {
    return null;
  }

  try {
    return typeof data === 'string' ? JSON.parse(data) : data as Session;
  } catch (error) {
    logger.error('Failed to parse session', { callSid, error });
    return null;
  }
}

export async function updateSession(
  callSid: string,
  updates: Partial<Session>
): Promise<Session | null> {  
  return updateSessionAtomically(callSid, (session) => ({
    ...session,
    ...updates,
  }));
}

export async function updateSessionState(
  callSid: string,
  stateUpdates: Partial<SessionState>
): Promise<Session | null> {
  return updateSessionAtomically(callSid, (session) => ({
    ...session,
    state: {
      ...session.state,
      ...stateUpdates,
    },
  }));
}

export async function updateCollectedData(
  callSid: string,
  dataUpdates: Partial<CollectedData>
): Promise<Session | null> {
  return updateSessionAtomically(callSid, (session) => ({
    ...session,
    collectedData: {
      ...session.collectedData,
      ...dataUpdates,
    },
  }));
}

export async function addMessage(callSid: string, message: Message): Promise<void> {
  await updateSessionAtomically(callSid, (session) => ({
    ...session,
    messageHistory: [...session.messageHistory, message],
  }));
}

export async function appendResponseTime(callSid: string, durationMs: number): Promise<void> {
  await updateSessionAtomically(callSid, (session) => ({
    ...session,
    metrics: {
      ...session.metrics,
      responseTimes: [...session.metrics.responseTimes, durationMs],
    },
  }));
}

export async function appendToolCallMetric(
  callSid: string,
  toolCall: { name: string; durationMs: number }
): Promise<void> {
  await updateSessionAtomically(callSid, (session) => ({
    ...session,
    metrics: {
      ...session.metrics,
      toolCalls: [...session.metrics.toolCalls, toolCall],
    },
  }));
}

export async function appendConfidenceScore(callSid: string, confidence: number): Promise<void> {
  await updateSessionAtomically(callSid, (session) => ({
    ...session,
    metrics: {
      ...session.metrics,
      confidenceScores: [...session.metrics.confidenceScores, confidence],
    },
  }));
}

export async function incrementLlmCalls(callSid: string, count: number = 1): Promise<void> {
  await updateSessionAtomically(callSid, (session) => ({
    ...session,
    metrics: {
      ...session.metrics,
      llmCalls: session.metrics.llmCalls + count,
    },
  }));
}

export async function incrementTtsChunks(callSid: string, count: number = 1): Promise<void> {
  await updateSessionAtomically(callSid, (session) => ({
    ...session,
    metrics: {
      ...session.metrics,
      ttsChunks: session.metrics.ttsChunks + count,
    },
  }));
}

export async function deleteSession(callSid: string): Promise<void> {
  const key = `${SESSION_PREFIX}${callSid}`;
  await client.del(key);
  logger.debug('Session deleted', { callSid });
}

export async function getActiveSessions(): Promise<string[]> {
  const keys = await client.keys(`${SESSION_PREFIX}*`);
  return keys.map(key => key.replace(SESSION_PREFIX, ''));
}

export async function refreshSessionTTL(callSid: string): Promise<void> {
  const key = `${SESSION_PREFIX}${callSid}`;
  await client.expire(key, SESSION_TTL);
}

export async function ping(): Promise<boolean> {
  try {
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis ping failed', error);
    return false;
  }
}

// Connection management (not needed for REST API, but kept for compatibility)
export async function connect(): Promise<void> {
  logger.info('Redis: Connected (Upstash REST)');
}

export async function disconnect(): Promise<void> {
  logger.info('Redis: Disconnected');
}

export default {
  client,
  setSession,
  getSession,
  updateSession,
  updateSessionState,
  updateCollectedData,
  addMessage,
  appendResponseTime,
  appendToolCallMetric,
  appendConfidenceScore,
  incrementLlmCalls,
  incrementTtsChunks,
  deleteSession,
  getActiveSessions,
  refreshSessionTTL,
  ping,
  connect,
  disconnect,
};

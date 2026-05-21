import db from '../config/database';
import logger from '../utils/logger';
import type { FAQ, FAQCreateInput } from '../../types/index';

// -------------------------------------------
// FIND OPERATIONS
// -------------------------------------------

/**
 * Find a matching FAQ for a question
 * Uses pattern matching (in production, consider full-text search or embeddings)
 */
export async function findMatch(question: string): Promise<FAQ | null> {
  const normalizedQuestion = question.toLowerCase().trim();
  
  // First try exact pattern match
  const patternResult = await db.query<FAQ>(
    `SELECT * FROM faq_responses
     WHERE is_active = true
       AND LOWER(question_pattern) LIKE $1
     ORDER BY priority DESC
     LIMIT 1`,
    [`%${normalizedQuestion}%`]
  );
  
  if (patternResult.rows.length > 0) {
    incrementUsageCount(patternResult.rows[0].id);
    return patternResult.rows[0];
  }
  
  // Try matching against variations
  const variationsResult = await db.query<FAQ>(
    `SELECT * FROM faq_responses
     WHERE is_active = true
       AND EXISTS (
         SELECT 1 FROM unnest(question_variations) AS variation
         WHERE LOWER(variation) LIKE $1
       )
     ORDER BY priority DESC
     LIMIT 1`,
    [`%${normalizedQuestion}%`]
  );
  
  if (variationsResult.rows.length > 0) {
    incrementUsageCount(variationsResult.rows[0].id);
    return variationsResult.rows[0];
  }
  
  // Try keyword matching
  const keywords = normalizedQuestion
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  if (keywords.length > 0) {
    const keywordPattern = keywords.map(k => `%${k}%`).join(' ');
    
    const keywordResult = await db.query<FAQ>(
      `SELECT * FROM faq_responses
       WHERE is_active = true
         AND (LOWER(question_pattern) LIKE ALL($1::text[])
              OR LOWER(answer) LIKE ALL($1::text[]))
       ORDER BY priority DESC
       LIMIT 1`,
      [keywords.map(k => `%${k}%`)]
    );
    
    if (keywordResult.rows.length > 0) {
      incrementUsageCount(keywordResult.rows[0].id);
      return keywordResult.rows[0];
    }
  }
  
  return null;
}

/**
 * Find FAQs by category
 */
export async function findByCategory(category: string): Promise<FAQ[]> {
  const result = await db.query<FAQ>(
    `SELECT * FROM faq_responses
     WHERE category = $1 AND is_active = true
     ORDER BY priority DESC`,
    [category]
  );
  return result.rows;
}

/**
 * Find FAQ by ID
 */
export async function findById(id: number): Promise<FAQ | null> {
  const result = await db.query<FAQ>(
    'SELECT * FROM faq_responses WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get all active FAQs
 */
export async function findAll(): Promise<FAQ[]> {
  const result = await db.query<FAQ>(
    `SELECT * FROM faq_responses
     WHERE is_active = true
     ORDER BY category, priority DESC`
  );
  return result.rows;
}

/**
 * Get all FAQ categories
 */
export async function getCategories(): Promise<string[]> {
  const result = await db.query<{ category: string }>(
    `SELECT DISTINCT category FROM faq_responses
     WHERE is_active = true
     ORDER BY category`
  );
  return result.rows.map(row => row.category);
}

// -------------------------------------------
// CREATE/UPDATE
// -------------------------------------------

/**
 * Create a new FAQ
 */
export async function create(input: FAQCreateInput): Promise<FAQ> {
  const result = await db.query<FAQ>(
    `INSERT INTO faq_responses (
       question_pattern, question_variations, answer, 
       answer_short, category, priority
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.questionPattern,
      input.questionVariations || [],
      input.answer,
      input.answerShort || null,
      input.category,
      input.priority || 0,
    ]
  );
  
  logger.info('FAQ created', { id: result.rows[0].id });
  return result.rows[0];
}

/**
 * Update an FAQ
 */
export async function update(
  id: number,
  data: Partial<Omit<FAQ, 'id' | 'created_at' | 'updated_at'>>
): Promise<FAQ | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  
  if (data.question_pattern !== undefined) {
    fields.push(`question_pattern = $${paramIndex++}`);
    values.push(data.question_pattern);
  }
  
  if (data.question_variations !== undefined) {
    fields.push(`question_variations = $${paramIndex++}`);
    values.push(data.question_variations);
  }
  
  if (data.answer !== undefined) {
    fields.push(`answer = $${paramIndex++}`);
    values.push(data.answer);
  }
  
  if (data.answer_short !== undefined) {
    fields.push(`answer_short = $${paramIndex++}`);
    values.push(data.answer_short);
  }
  
  if (data.category !== undefined) {
    fields.push(`category = $${paramIndex++}`);
    values.push(data.category);
  }
  
  if (data.priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(data.priority);
  }
  
  if (data.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(data.is_active);
  }
  
  if (fields.length === 0) {
    return findById(id);
  }
  
  values.push(id);
  
  const result = await db.query<FAQ>(
    `UPDATE faq_responses 
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );
  
  return result.rows[0] || null;
}

/**
 * Deactivate an FAQ (soft delete)
 */
export async function deactivate(id: number): Promise<void> {
  await db.query(
    `UPDATE faq_responses 
     SET is_active = false, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id]
  );
  logger.info('FAQ deactivated', { id });
}

// -------------------------------------------
// ANALYTICS
// -------------------------------------------

// In-memory usage counter. Each FAQ match calls incrementUsageCount() which
// only bumps the in-process Map; flushUsageCounts() (called on a timer from
// server.ts and again during shutdown) drains it into a single bulk UPDATE.
// Trade-off: counts buffered in memory are lost on hard crash. Acceptable
// because times_used is analytics, not a billing/audit counter.
const pendingUsage = new Map<number, number>();

/**
 * Buffer an FAQ match for the next flush. Synchronous — no DB I/O on the
 * conversation hot path.
 */
export function incrementUsageCount(id: number): void {
  pendingUsage.set(id, (pendingUsage.get(id) ?? 0) + 1);
}

/**
 * Drain the in-memory counter into a single bulk UPDATE. Safe to call on a
 * timer and during shutdown — a no-op when the map is empty.
 */
export async function flushUsageCounts(): Promise<void> {
  if (pendingUsage.size === 0) return;

  // Snapshot + clear up front so concurrent increments during the awaited
  // query land in the next flush window instead of being lost on success
  // or double-counted on failure.
  const snapshot = Array.from(pendingUsage.entries());
  pendingUsage.clear();

  // Bulk update via a VALUES table. One round-trip regardless of row count.
  // Don't touch updated_at — this is an analytics counter, not a content edit.
  const placeholders = snapshot
    .map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::int)`)
    .join(', ');
  const params = snapshot.flatMap(([id, delta]) => [id, delta]);

  try {
    await db.query(
      `UPDATE faq_responses
       SET times_used = faq_responses.times_used + v.delta
       FROM (VALUES ${placeholders}) AS v(id, delta)
       WHERE faq_responses.id = v.id`,
      params
    );
  } catch (err) {
    // Restore the snapshot so we retry on the next flush instead of losing
    // counts. Merge with anything that arrived in the meantime.
    for (const [id, delta] of snapshot) {
      pendingUsage.set(id, (pendingUsage.get(id) ?? 0) + delta);
    }
    logger.warn('FAQ usage flush failed; counts re-queued', { size: snapshot.length, err });
  }
}

/**
 * Get most frequently used FAQs
 */
export async function getMostUsed(limit: number = 10): Promise<FAQ[]> {
  const result = await db.query<FAQ>(
    `SELECT * FROM faq_responses
     WHERE is_active = true AND times_used > 0
     ORDER BY times_used DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get FAQs that have never been used
 */
export async function getUnused(): Promise<FAQ[]> {
  const result = await db.query<FAQ>(
    `SELECT * FROM faq_responses
     WHERE is_active = true AND times_used = 0
     ORDER BY created_at`
  );
  return result.rows;
}

// -------------------------------------------
// Export
// -------------------------------------------

export default {
  findMatch,
  findByCategory,
  findById,
  findAll,
  getCategories,
  create,
  update,
  deactivate,
  incrementUsageCount,
  flushUsageCounts,
  getMostUsed,
  getUnused,
};

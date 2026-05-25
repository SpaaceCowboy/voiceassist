import fs from 'fs';
import path from 'path';
import database from './database';
import logger from '../utils/logger';

// Works in both dev (src/config/) and prod (dist/src/config/) because
// we resolve from the package root, not __dirname.
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

const MIGRATION_FILES = [
  '002_neurospine_clinic.sql',
  '003_patient_search_trgm.sql',
  'seed_001_mock_data.sql',
];

async function ensureMigrationsTable(): Promise<void> {
  await database.pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function hasRun(filename: string): Promise<boolean> {
  const result = await database.pool.query(
    'SELECT 1 FROM _migrations WHERE filename = $1',
    [filename]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

async function markRun(filename: string): Promise<void> {
  await database.pool.query(
    'INSERT INTO _migrations (filename) VALUES ($1)',
    [filename]
  );
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  for (const filename of MIGRATION_FILES) {
    if (await hasRun(filename)) {
      logger.info(`Migration already applied: ${filename}`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      logger.error(`Migration file not found: ${filePath}`);
      throw new Error(`Migration file not found: ${filename}`);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    logger.info(`Running migration: ${filename}...`);

    try {
      await database.pool.query(sql);
      await markRun(filename);
      logger.info(`Migration applied: ${filename}`);
    } catch (error) {
      logger.error(`Migration failed: ${filename}`, error);
      throw error;
    }
  }

  logger.info('All migrations up to date');
}

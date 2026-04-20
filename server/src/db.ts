import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import * as schema from './schema';

const sqlite = new Database(path.join(__dirname, '../../data/trapper.db'));

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function initDb(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS trappers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trapId TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      destinationUrl TEXT NOT NULL,
      retryPolicy TEXT NOT NULL DEFAULT 'none',
      authType TEXT NOT NULL DEFAULT 'none',
      authValue TEXT,
      rateLimit INTEGER,
      rateLimitWindowMs INTEGER,
      hmacSecret TEXT,
      hmacHeader TEXT,
      hmacAlgorithm TEXT NOT NULL DEFAULT 'sha256',
      overrideEnabled INTEGER NOT NULL DEFAULT 0,
      overridePayload TEXT,
      skipTlsVerify INTEGER NOT NULL DEFAULT 0,
      customAuthHeader TEXT,
      deliveryMode TEXT NOT NULL DEFAULT 'broadcast',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS filter_rules (
      id TEXT PRIMARY KEY,
      trapperId TEXT NOT NULL,
      fieldPath TEXT NOT NULL,
      operator TEXT NOT NULL,
      value TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      logicOp TEXT NOT NULL DEFAULT 'AND',
      groupBefore INTEGER NOT NULL DEFAULT 0,
      groupAfter INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS webhook_logs (
      id TEXT PRIMARY KEY,
      trapperId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      sourceIp TEXT NOT NULL,
      method TEXT NOT NULL,
      headers TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      responseCode INTEGER,
      latency INTEGER,
      errorMessage TEXT,
      parentLogId TEXT,
      destinationId TEXT,
      destinationLabel TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS destinations (
      id TEXT PRIMARY KEY,
      trapperId TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      authType TEXT NOT NULL DEFAULT 'none',
      authValue TEXT,
      customAuthHeader TEXT,
      skipTlsVerify INTEGER NOT NULL DEFAULT 0,
      retryPolicy TEXT NOT NULL DEFAULT 'none',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrations for existing databases
  try { sqlite.exec(`ALTER TABLE trappers ADD COLUMN overrideEnabled INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE trappers ADD COLUMN overridePayload TEXT`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE trappers ADD COLUMN skipTlsVerify INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE trappers ADD COLUMN customAuthHeader TEXT`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE webhook_logs ADD COLUMN parentLogId TEXT`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE webhook_logs ADD COLUMN destinationId TEXT`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE webhook_logs ADD COLUMN destinationLabel TEXT`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE trappers ADD COLUMN deliveryMode TEXT NOT NULL DEFAULT 'broadcast'`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE filter_rules ADD COLUMN logicOp TEXT NOT NULL DEFAULT 'AND'`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE filter_rules ADD COLUMN groupBefore INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE filter_rules ADD COLUMN groupAfter INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
  try { sqlite.exec(`ALTER TABLE webhook_logs ADD COLUMN updatedAt TEXT NOT NULL DEFAULT (datetime('now'))`); } catch { /* already exists */ }
}

export default db;

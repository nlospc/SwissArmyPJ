import Database from 'better-sqlite3';
import * as path from 'path';

let db: Database.Database | null = null;

export function initDatabase(): void {
  const dbPath = path.join(process.cwd(), 'swiss-army-pm.db');
  db = new Database(dbPath);
  createTables();
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function createTables(): void {
  if (!db) return;
  db.exec(\`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  \`);
}

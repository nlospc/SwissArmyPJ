import Database from 'better-sqlite3';
import * as path from 'path';
import { MigrationRunner } from './migrationRunner';

let db: Database.Database | null = null;

export function initDatabase(): void {
  const dbPath = path.join(process.cwd(), 'swiss-army-pm.db');
  db = new Database(dbPath);
  createTables();
  runMigrations();
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function runMigrations(): void {
  if (!db) return;

  try {
    const runner = new MigrationRunner(db);
    runner.runMigrations();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

function createTables(): void {
  if (!db) return;

  db.exec(`
    -- Workspace (singleton)
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Portfolios
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Portfolio-Project junction table
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      portfolio_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      PRIMARY KEY (portfolio_id, project_id),
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Projects (expanded)
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      owner TEXT,
      status TEXT CHECK(status IN ('not_started','in_progress','done','blocked')) DEFAULT 'not_started',
      start_date TEXT,
      end_date TEXT,
      portfolio_id INTEGER,
      tags_json TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL
    );

    -- Work Items (hierarchical, 2 levels)
    CREATE TABLE IF NOT EXISTS work_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      project_id INTEGER NOT NULL,
      parent_id INTEGER,
      type TEXT CHECK(type IN ('task','issue','milestone','phase','remark','clash')) NOT NULL,
      title TEXT NOT NULL,
      status TEXT CHECK(status IN ('not_started','in_progress','done','blocked')) DEFAULT 'not_started',
      start_date TEXT,
      end_date TEXT,
      level INTEGER CHECK(level IN (1,2)) DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES work_items(id) ON DELETE CASCADE
    );

    -- Inbox
    CREATE TABLE IF NOT EXISTS inbox_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      source_type TEXT CHECK(source_type IN ('text','file','link')) DEFAULT 'text',
      raw_text TEXT NOT NULL,
      processed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Settings (key-value store)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Todos (for calendar feature)
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      due_date TEXT,
      priority TEXT CHECK(priority IN ('low','medium','high')),
      created_at TEXT NOT NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_work_items_project ON work_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_work_items_parent ON work_items(parent_id);
    CREATE INDEX IF NOT EXISTS idx_projects_portfolio ON projects(portfolio_id);
    CREATE INDEX IF NOT EXISTS idx_inbox_processed ON inbox_items(processed);
    CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
  `);

  // Initialize workspace if not exists
  const workspace = db.prepare('SELECT * FROM workspaces LIMIT 1').get();
  if (!workspace) {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO workspaces (uuid, name, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(uuid, 'My Workspace', now, now);
  }
}

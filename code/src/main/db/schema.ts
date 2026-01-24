import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const DB_NAME = 'swissarmypm.db';

// Get the user data path for the database
function getDbPath(appInstance: any): string {
  const userDataPath = appInstance.getPath('userData');
  return path.join(userDataPath, DB_NAME);
}

// Initialize database and create tables
export function initDatabase(appInstance: any): Database.Database {
  const dbPath = getDbPath(appInstance);
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'on_hold', 'cancelled')),
      budget_planned REAL DEFAULT 0,
      budget_actual REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create Work Packages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      project_id INTEGER NOT NULL,
      parent_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      duration_days INTEGER,
      progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done', 'blocked')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      budget_planned REAL DEFAULT 0,
      budget_actual REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES work_packages(id) ON DELETE CASCADE
    )
  `);

  // Create Dependencies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      predecessor_id INTEGER NOT NULL,
      successor_id INTEGER NOT NULL,
      type TEXT DEFAULT 'finish_to_start' CHECK(type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
      lag_days INTEGER DEFAULT 0,
      FOREIGN KEY (predecessor_id) REFERENCES work_packages(id) ON DELETE CASCADE,
      FOREIGN KEY (successor_id) REFERENCES work_packages(id) ON DELETE CASCADE,
      UNIQUE(predecessor_id, successor_id)
    )
  `);

  // Create Members table (Phase 2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT,
      hourly_rate REAL DEFAULT 0,
      weekly_capacity_hours INTEGER DEFAULT 40,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create Assignments table (Phase 2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_package_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      planned_hours REAL DEFAULT 0,
      actual_hours REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (work_package_id) REFERENCES work_packages(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE(work_package_id, member_id)
    )
  `);

  // Create Inbox Files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inbox_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE NOT NULL,
      file_type TEXT NOT NULL CHECK(file_type IN ('md', 'csv', 'txt')),
      processed_at TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed', 'failed')),
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create AI Proposals table (Phase 3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inbox_file_id INTEGER,
      proposal_type TEXT NOT NULL,
      proposed_changes TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (inbox_file_id) REFERENCES inbox_files(id) ON DELETE SET NULL
    )
  `);

  // Create AI Providers table (Phase 3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      api_endpoint TEXT,
      api_key_encrypted TEXT,
      model_name TEXT,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_work_packages_project ON work_packages(project_id);
    CREATE INDEX IF NOT EXISTS idx_work_packages_parent ON work_packages(parent_id);
    CREATE INDEX IF NOT EXISTS idx_dependencies_predecessor ON dependencies(predecessor_id);
    CREATE INDEX IF NOT EXISTS idx_dependencies_successor ON dependencies(successor_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_work_package ON assignments(work_package_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_member ON assignments(member_id);
    CREATE INDEX IF NOT EXISTS idx_inbox_files_status ON inbox_files(status);
    CREATE INDEX IF NOT EXISTS idx_ai_proposals_status ON ai_proposals(status);
  `);

  return db;
}

// Get database instance (singleton)
let dbInstance: Database.Database | null = null;
let appInstance: any = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return dbInstance;
}

export function initDatabaseSingleton(appInstance: any): void {
  appInstance = appInstance;
  dbInstance = initDatabase(appInstance);
}

// Close database connection
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

-- Migration 004: My Work - Time Tracking & Pomodoro (Simplified for SQLite 3.22)
-- Date: 2026-02-01
-- Note: This version removes json_object() calls for compatibility with older SQLite

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT,
  source TEXT,
  old_values_json TEXT,
  new_values_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);

-- =============================================================================
-- TIME LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS time_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  work_item_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER,
  log_type TEXT NOT NULL CHECK(log_type IN ('manual', 'timer', 'pomodoro')),
  pomodoro_count INTEGER DEFAULT 0,
  notes TEXT,
  edited_at TEXT,
  edited_by TEXT,
  edit_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (work_item_id) REFERENCES work_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_time_logs_work_item ON time_logs(work_item_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON time_logs(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_time_logs_active ON time_logs(user_id, work_item_id) WHERE end_time IS NULL;

-- =============================================================================
-- POMODORO SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  time_log_id INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK(session_type IN ('work', 'short_break', 'long_break')),
  duration_minutes INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  interrupted INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_time_log ON pomodoro_sessions(time_log_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_started_at ON pomodoro_sessions(started_at);

-- =============================================================================
-- USER PREFERENCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  pomodoro_work_duration INTEGER DEFAULT 25,
  pomodoro_short_break INTEGER DEFAULT 5,
  pomodoro_long_break INTEGER DEFAULT 15,
  pomodoro_sessions_before_long INTEGER DEFAULT 4,
  daily_time_target INTEGER DEFAULT 480,
  enable_desktop_notifications INTEGER DEFAULT 1,
  notification_sound INTEGER DEFAULT 1,
  auto_start_breaks INTEGER DEFAULT 0,
  default_group_by TEXT DEFAULT 'project',
  default_sort_by TEXT DEFAULT 'due_date',
  show_completed_tasks INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- CALENDAR TABLES (Phase 2)
-- =============================================================================

CREATE TABLE IF NOT EXISTS calendar_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('google', 'microsoft', 'ical')),
  calendar_id TEXT NOT NULL,
  calendar_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TEXT,
  sync_enabled INTEGER DEFAULT 1,
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON calendar_connections(user_id);

CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL,
  date TEXT NOT NULL,
  local_name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  is_public_holiday INTEGER DEFAULT 1,
  year INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(country_code, date)
);

CREATE INDEX IF NOT EXISTS idx_holidays_country_year ON holidays(country_code, year);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  connection_id INTEGER NOT NULL,
  external_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  is_all_day INTEGER DEFAULT 0,
  location TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (connection_id) REFERENCES calendar_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_connection ON calendar_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_external ON calendar_events(connection_id, external_id);

-- =============================================================================
-- SCHEMA MIGRATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- ALTER WORK_ITEMS TABLE
-- =============================================================================

-- Add columns (will fail silently if they already exist)
ALTER TABLE work_items ADD COLUMN estimated_minutes INTEGER;
ALTER TABLE work_items ADD COLUMN assigned_to TEXT;
ALTER TABLE work_items ADD COLUMN completed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_work_items_assigned_to ON work_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_items_completed_at ON work_items(completed_at) WHERE completed_at IS NOT NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER IF NOT EXISTS work_items_auto_complete
AFTER UPDATE OF status ON work_items
FOR EACH ROW
WHEN NEW.status = 'done' AND OLD.status != 'done'
BEGIN
  UPDATE work_items SET completed_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS work_items_auto_uncomplete
AFTER UPDATE OF status ON work_items
FOR EACH ROW
WHEN NEW.status != 'done' AND OLD.status = 'done'
BEGIN
  UPDATE work_items SET completed_at = NULL WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS time_logs_track_edits
AFTER UPDATE ON time_logs
FOR EACH ROW
WHEN OLD.start_time != NEW.start_time
  OR OLD.end_time != NEW.end_time
  OR OLD.notes != NEW.notes
  OR OLD.duration_minutes != NEW.duration_minutes
BEGIN
  UPDATE time_logs
  SET
    edited_at = datetime('now'),
    edited_by = NEW.user_id,
    edit_count = OLD.edit_count + 1,
    updated_at = datetime('now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS time_logs_updated_at
AFTER UPDATE ON time_logs
FOR EACH ROW
BEGIN
  UPDATE time_logs SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS user_preferences_updated_at
AFTER UPDATE ON user_preferences
FOR EACH ROW
BEGIN
  UPDATE user_preferences SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS calendar_connections_updated_at
AFTER UPDATE ON calendar_connections
FOR EACH ROW
BEGIN
  UPDATE calendar_connections SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Simplified audit triggers (without json_object)
CREATE TRIGGER IF NOT EXISTS audit_time_logs_insert
AFTER INSERT ON time_logs
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (uuid, entity_type, entity_id, action, user_id, source, new_values_json)
  VALUES (
    lower(hex(randomblob(16))),
    'TimeLog',
    NEW.uuid,
    'create',
    NEW.user_id,
    'ui',
    'work_item_id:' || NEW.work_item_id || ',start_time:' || NEW.start_time || ',log_type:' || NEW.log_type
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_time_logs_update
AFTER UPDATE ON time_logs
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (uuid, entity_type, entity_id, action, user_id, source, old_values_json, new_values_json)
  VALUES (
    lower(hex(randomblob(16))),
    'TimeLog',
    NEW.uuid,
    'update',
    NEW.user_id,
    'ui',
    'start_time:' || OLD.start_time || ',end_time:' || COALESCE(OLD.end_time, 'NULL') || ',duration:' || COALESCE(OLD.duration_minutes, 0),
    'start_time:' || NEW.start_time || ',end_time:' || COALESCE(NEW.end_time, 'NULL') || ',duration:' || COALESCE(NEW.duration_minutes, 0)
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_time_logs_delete
BEFORE DELETE ON time_logs
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (uuid, entity_type, entity_id, action, user_id, source, old_values_json)
  VALUES (
    lower(hex(randomblob(16))),
    'TimeLog',
    OLD.uuid,
    'delete',
    OLD.user_id,
    'ui',
    'work_item_id:' || OLD.work_item_id || ',duration:' || COALESCE(OLD.duration_minutes, 0)
  );
END;

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT OR IGNORE INTO user_preferences (user_id) VALUES ('default-user');

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (name) VALUES ('004_my_work_time_tracking.sql');

INSERT INTO audit_log (uuid, entity_type, entity_id, action, source, new_values_json)
VALUES (
  lower(hex(randomblob(16))),
  'Migration',
  '004',
  'create',
  'system',
  'name:004_my_work_time_tracking,description:Time tracking and Pomodoro,applied_at:' || datetime('now')
);

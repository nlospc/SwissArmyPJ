-- Migration 004: My Work - Time Tracking & Pomodoro
-- Date: 2026-02-01
-- Description: Adds time logging, Pomodoro timer, and user preferences for My Work view

-- =============================================================================
-- AUDIT LOG TABLE (Dependency for all other features)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,                    -- 'WorkItem', 'Project', 'TimeLog', etc.
  entity_id TEXT NOT NULL,                      -- UUID of the entity
  action TEXT NOT NULL,                         -- 'create', 'update', 'delete'
  user_id TEXT,                                 -- Who made the change
  source TEXT,                                  -- 'ui', 'api', 'sync', 'system'
  old_values_json TEXT,                         -- JSON snapshot of old values
  new_values_json TEXT,                         -- JSON snapshot of new values
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
  work_item_id INTEGER NOT NULL,               -- FK to work_items table
  user_id TEXT NOT NULL,                        -- Who logged the time
  start_time TEXT NOT NULL,                     -- ISO 8601 datetime
  end_time TEXT,                                -- NULL if timer is currently running
  duration_minutes INTEGER,                     -- Calculated: (end_time - start_time) in minutes
  log_type TEXT NOT NULL CHECK(log_type IN ('manual', 'timer', 'pomodoro')),
  pomodoro_count INTEGER DEFAULT 0,             -- Number of completed pomodoros in this session
  notes TEXT,                                   -- Optional notes about the work done

  -- Edit tracking
  edited_at TEXT,                               -- When this log was last edited
  edited_by TEXT,                               -- Who edited it
  edit_count INTEGER DEFAULT 0,                 -- Number of times edited

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (work_item_id) REFERENCES work_items(id) ON DELETE CASCADE
);

-- Indexes for time_logs
CREATE INDEX IF NOT EXISTS idx_time_logs_work_item ON time_logs(work_item_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON time_logs(user_id, start_time);

-- Partial index for active timers (end_time IS NULL)
CREATE INDEX IF NOT EXISTS idx_time_logs_active ON time_logs(user_id, work_item_id)
  WHERE end_time IS NULL;

-- =============================================================================
-- POMODORO SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  time_log_id INTEGER NOT NULL,                -- FK to time_logs
  session_number INTEGER NOT NULL,              -- 1st, 2nd, 3rd, 4th in sequence
  session_type TEXT NOT NULL CHECK(session_type IN ('work', 'short_break', 'long_break')),
  duration_minutes INTEGER NOT NULL,            -- 25 for work, 5 for short break, 15 for long break
  started_at TEXT NOT NULL,                     -- When session started
  completed_at TEXT,                            -- When session completed (NULL if in progress)
  interrupted INTEGER DEFAULT 0,                -- Boolean: 1 if user stopped early, 0 if completed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (time_log_id) REFERENCES time_logs(id) ON DELETE CASCADE
);

-- Indexes for pomodoro_sessions
CREATE INDEX IF NOT EXISTS idx_pomodoro_time_log ON pomodoro_sessions(time_log_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_started_at ON pomodoro_sessions(started_at);

-- =============================================================================
-- USER PREFERENCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,                 -- User identifier

  -- Pomodoro Settings
  pomodoro_work_duration INTEGER DEFAULT 25,    -- Work session duration in minutes
  pomodoro_short_break INTEGER DEFAULT 5,       -- Short break duration in minutes
  pomodoro_long_break INTEGER DEFAULT 15,       -- Long break duration in minutes
  pomodoro_sessions_before_long INTEGER DEFAULT 4, -- Number of work sessions before long break

  -- Time Tracking Settings
  daily_time_target INTEGER DEFAULT 480,        -- Daily time goal in minutes (8 hours)
  enable_desktop_notifications INTEGER DEFAULT 1, -- Boolean: show notifications
  notification_sound INTEGER DEFAULT 1,         -- Boolean: play sound with notifications
  auto_start_breaks INTEGER DEFAULT 0,          -- Boolean: auto-start break after work session

  -- Todo List Settings
  default_group_by TEXT DEFAULT 'project',      -- 'project', 'due_date', 'priority', 'status'
  default_sort_by TEXT DEFAULT 'due_date',      -- 'due_date', 'priority', 'created', 'estimated_time'
  show_completed_tasks INTEGER DEFAULT 0,       -- Boolean: show completed tasks in main list

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- CALENDAR CONNECTIONS TABLE (Phase 2 - Calendar Integration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS calendar_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,                        -- User identifier
  provider TEXT NOT NULL CHECK(provider IN ('google', 'microsoft', 'ical')),
  calendar_id TEXT NOT NULL,                    -- External calendar ID
  calendar_name TEXT,                           -- Display name
  access_token TEXT,                            -- OAuth access token (should be encrypted in production)
  refresh_token TEXT,                           -- OAuth refresh token (should be encrypted)
  token_expires_at TEXT,                        -- When access token expires
  sync_enabled INTEGER DEFAULT 1,               -- Boolean: sync enabled/disabled
  last_sync_at TEXT,                            -- Last successful sync timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON calendar_connections(user_id);

-- =============================================================================
-- HOLIDAYS TABLE (Phase 2 - Calendar Integration)
-- =============================================================================

CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL,                   -- 'US', 'CN', 'GB', 'JP', etc.
  date TEXT NOT NULL,                           -- ISO date 'YYYY-MM-DD'
  local_name TEXT NOT NULL,                     -- "春节", "Thanksgiving", etc.
  english_name TEXT NOT NULL,                   -- "Spring Festival", "Thanksgiving"
  is_public_holiday INTEGER DEFAULT 1,          -- Boolean: official public holiday
  year INTEGER NOT NULL,                        -- Year for quick filtering
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  UNIQUE(country_code, date)
);

CREATE INDEX IF NOT EXISTS idx_holidays_country_year ON holidays(country_code, year);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- =============================================================================
-- CALENDAR EVENTS CACHE TABLE (Phase 2 - Read-only calendar sync)
-- =============================================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  connection_id INTEGER NOT NULL,               -- FK to calendar_connections
  external_id TEXT NOT NULL,                    -- Google/Outlook event ID
  summary TEXT NOT NULL,                        -- Event title
  description TEXT,                             -- Event description
  start_time TEXT NOT NULL,                     -- Start datetime
  end_time TEXT,                                -- End datetime (NULL for all-day events)
  is_all_day INTEGER DEFAULT 0,                 -- Boolean: all-day event
  location TEXT,                                -- Event location
  synced_at TEXT NOT NULL DEFAULT (datetime('now')), -- When this was last synced

  FOREIGN KEY (connection_id) REFERENCES calendar_connections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_connection ON calendar_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_external ON calendar_events(connection_id, external_id);

-- =============================================================================
-- ALTER WORK_ITEMS TABLE - Add My Work fields
-- =============================================================================

-- Add estimated time field
ALTER TABLE work_items ADD COLUMN estimated_minutes INTEGER;

-- Add assignment field
ALTER TABLE work_items ADD COLUMN assigned_to TEXT;

-- Add completed_at timestamp for auto-archive feature
ALTER TABLE work_items ADD COLUMN completed_at TEXT;

-- Add priority field (if not exists)
-- Note: Check if this already exists in your schema
-- ALTER TABLE work_items ADD COLUMN priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical'));

-- Create index for assigned_to queries
CREATE INDEX IF NOT EXISTS idx_work_items_assigned_to ON work_items(assigned_to)
  WHERE assigned_to IS NOT NULL;

-- Create index for completed_at queries
CREATE INDEX IF NOT EXISTS idx_work_items_completed_at ON work_items(completed_at)
  WHERE completed_at IS NOT NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger: Auto-set completed_at when work_item status changes to 'done'
CREATE TRIGGER IF NOT EXISTS work_items_auto_complete
AFTER UPDATE OF status ON work_items
FOR EACH ROW
WHEN NEW.status = 'done' AND OLD.status != 'done'
BEGIN
  UPDATE work_items SET completed_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger: Clear completed_at when work_item status changes from 'done' to something else
CREATE TRIGGER IF NOT EXISTS work_items_auto_uncomplete
AFTER UPDATE OF status ON work_items
FOR EACH ROW
WHEN NEW.status != 'done' AND OLD.status = 'done'
BEGIN
  UPDATE work_items SET completed_at = NULL WHERE id = NEW.id;
END;

-- Trigger: Track time_logs edits
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

-- Trigger: Auto-update time_logs.updated_at
CREATE TRIGGER IF NOT EXISTS time_logs_updated_at
AFTER UPDATE ON time_logs
FOR EACH ROW
BEGIN
  UPDATE time_logs SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Trigger: Auto-update user_preferences.updated_at
CREATE TRIGGER IF NOT EXISTS user_preferences_updated_at
AFTER UPDATE ON user_preferences
FOR EACH ROW
BEGIN
  UPDATE user_preferences SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Trigger: Auto-update calendar_connections.updated_at
CREATE TRIGGER IF NOT EXISTS calendar_connections_updated_at
AFTER UPDATE ON calendar_connections
FOR EACH ROW
BEGIN
  UPDATE calendar_connections SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- =============================================================================
-- AUDIT LOG TRIGGERS (Track changes to time_logs)
-- =============================================================================

-- Trigger: Audit time_log creation
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
    json_object(
      'work_item_id', NEW.work_item_id,
      'start_time', NEW.start_time,
      'log_type', NEW.log_type
    )
  );
END;

-- Trigger: Audit time_log updates
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
    json_object(
      'start_time', OLD.start_time,
      'end_time', OLD.end_time,
      'duration_minutes', OLD.duration_minutes,
      'notes', OLD.notes
    ),
    json_object(
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'duration_minutes', NEW.duration_minutes,
      'notes', NEW.notes
    )
  );
END;

-- Trigger: Audit time_log deletion
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
    json_object(
      'work_item_id', OLD.work_item_id,
      'start_time', OLD.start_time,
      'end_time', OLD.end_time,
      'duration_minutes', OLD.duration_minutes
    )
  );
END;

-- =============================================================================
-- SEED DATA (Optional: Default user preferences)
-- =============================================================================

-- Insert default preferences for 'default-user' if not exists
INSERT OR IGNORE INTO user_preferences (user_id)
VALUES ('default-user');

-- =============================================================================
-- MIGRATION AUDIT LOG
-- =============================================================================

-- Record this migration in audit log
INSERT INTO audit_log (uuid, entity_type, entity_id, action, source, new_values_json)
VALUES (
  lower(hex(randomblob(16))),
  'Migration',
  '004',
  'create',
  'system',
  json_object(
    'name', '004_my_work_time_tracking',
    'description', 'Time tracking, Pomodoro, and calendar integration',
    'applied_at', datetime('now')
  )
);

-- =============================================================================
-- END OF MIGRATION 004
-- =============================================================================

-- Verification Queries (Comment out after running migration)
/*
SELECT 'Audit Log Table' as entity, COUNT(*) as count FROM audit_log
UNION ALL
SELECT 'Time Logs', COUNT(*) FROM time_logs
UNION ALL
SELECT 'Pomodoro Sessions', COUNT(*) FROM pomodoro_sessions
UNION ALL
SELECT 'User Preferences', COUNT(*) FROM user_preferences
UNION ALL
SELECT 'Calendar Connections', COUNT(*) FROM calendar_connections
UNION ALL
SELECT 'Holidays', COUNT(*) FROM holidays
UNION ALL
SELECT 'Calendar Events', COUNT(*) FROM calendar_events;
*/

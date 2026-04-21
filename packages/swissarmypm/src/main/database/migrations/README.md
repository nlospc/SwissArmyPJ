# Database Migrations

This directory contains SQL migration files for the SwissArmyPM database schema.

## Overview

Migrations are executed automatically when the application starts via `initDatabase()`. The migration runner tracks which migrations have been applied to prevent re-running them.

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `004_my_work_time_tracking.sql` | Time tracking, Pomodoro timer, user preferences, calendar integration | ✅ Ready |

## Migration Naming Convention

```
<number>_<descriptive_name>.sql
```

- **Number**: Sequential number (001, 002, 003, etc.)
- **Name**: Snake_case description of what the migration does
- **Extension**: `.sql`

Example: `004_my_work_time_tracking.sql`

## Running Migrations

### Automatic (Recommended)

Migrations run automatically when the app starts:

```bash
npm run dev
```

The `initDatabase()` function calls the migration runner automatically.

### Manual (CLI)

You can also run migrations manually:

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration (removes record only, doesn't undo schema changes)
npm run migrate:rollback
```

## Migration Tracking

Applied migrations are tracked in the `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Migration 004 Details

**File**: `004_my_work_time_tracking.sql`

**Creates**:
- `audit_log` table - Change tracking for governance
- `time_logs` table - Time tracking with edit support
- `pomodoro_sessions` table - Pomodoro timer sessions
- `user_preferences` table - User settings (Pomodoro, notifications, etc.)
- `calendar_connections` table - OAuth connections to Google/Outlook (Phase 2)
- `holidays` table - Holiday calendar cache (Phase 2)
- `calendar_events` table - Synced calendar events (Phase 2)

**Alters**:
- `work_items` table - Adds columns:
  - `estimated_minutes` - Estimated time to complete
  - `assigned_to` - User assigned to this item
  - `completed_at` - When item was completed (for 24h auto-archive)

**Triggers**:
- `work_items_auto_complete` - Auto-set `completed_at` when status → 'done'
- `work_items_auto_uncomplete` - Clear `completed_at` when status changes from 'done'
- `time_logs_track_edits` - Track edits to time logs (increments `edit_count`)
- `time_logs_updated_at` - Auto-update `updated_at` timestamp
- `audit_time_logs_*` - Audit log triggers for time log changes

**Indexes**:
- Performance indexes for queries on:
  - `time_logs(user_id, start_time)` - Daily/weekly summaries
  - `time_logs(user_id, work_item_id) WHERE end_time IS NULL` - Active timers
  - `work_items(assigned_to)` - Todo list queries
  - `work_items(completed_at)` - Archive queries
  - `holidays(country_code, year)` - Holiday lookups

## Writing New Migrations

### Step 1: Create Migration File

```bash
# Create new file with next sequential number
touch src/main/database/migrations/005_add_feature_name.sql
```

### Step 2: Write SQL

```sql
-- Migration 005: Add Feature Name
-- Date: YYYY-MM-DD
-- Description: What this migration does

-- Create tables
CREATE TABLE IF NOT EXISTS new_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  -- ...
);

-- Alter existing tables
ALTER TABLE existing_table ADD COLUMN new_field TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_new_table_field ON new_table(field);

-- Create triggers
CREATE TRIGGER IF NOT EXISTS trigger_name
AFTER INSERT ON new_table
FOR EACH ROW
BEGIN
  -- ...
END;

-- Record migration in audit log
INSERT INTO audit_log (uuid, entity_type, entity_id, action, source, new_values_json)
VALUES (
  lower(hex(randomblob(16))),
  'Migration',
  '005',
  'create',
  'system',
  json_object('name', '005_add_feature_name', 'applied_at', datetime('now'))
);
```

### Step 3: Test Migration

```bash
# Check status before
npm run migrate:status

# Run migration
npm run migrate

# Verify in SQLite
sqlite3 swiss-army-pm.db "SELECT * FROM schema_migrations;"
```

## Best Practices

1. **Always use `IF NOT EXISTS`** for CREATE statements to make migrations idempotent
2. **Use transactions** - Migration runner wraps each migration in a transaction
3. **Never modify existing migrations** - Once applied to production, create a new migration instead
4. **Test on a copy** - Test migrations on a copy of your database first
5. **Add comments** - Explain why changes are being made
6. **Use indexes wisely** - Add indexes for frequently queried fields
7. **Document breaking changes** - If migration requires data transformation, document it

## Troubleshooting

### Migration Failed Mid-Execution

The migration runner uses transactions, so partial failures will rollback. Check the error message and fix the SQL, then re-run.

### Migration Already Applied Error

If you see "UNIQUE constraint failed: schema_migrations.name":
- The migration was already applied
- Check `SELECT * FROM schema_migrations;`
- Remove the duplicate entry if needed: `DELETE FROM schema_migrations WHERE name = '004_my_work_time_tracking.sql';`

### Need to Undo a Migration

1. **Option A**: Write a DOWN migration
   ```sql
   -- 006_undo_feature.sql
   DROP TABLE IF EXISTS unwanted_table;
   ALTER TABLE my_table DROP COLUMN unwanted_column;
   ```

2. **Option B**: Manually rollback (use with caution)
   ```bash
   npm run migrate:rollback
   # Then manually undo schema changes in SQLite
   ```

## Verification Queries

After running migration 004, verify with:

```sql
-- Check all new tables exist
SELECT name FROM sqlite_master WHERE type='table' AND name IN (
  'audit_log',
  'time_logs',
  'pomodoro_sessions',
  'user_preferences',
  'calendar_connections',
  'holidays',
  'calendar_events'
);

-- Check work_items columns added
PRAGMA table_info(work_items);

-- Check triggers created
SELECT name FROM sqlite_master WHERE type='trigger';

-- Check indexes created
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';

-- View migration history
SELECT * FROM schema_migrations ORDER BY id;
```

## SQLite Notes

### Data Types
- `INTEGER` - Signed integer (1-8 bytes)
- `TEXT` - UTF-8 text string
- `REAL` - Floating point
- `BLOB` - Binary data

### Boolean Values
SQLite doesn't have a native BOOLEAN type. Use `INTEGER`:
- `0` = false
- `1` = true

### Timestamps
Use `TEXT` with ISO 8601 format:
- `datetime('now')` → "2026-02-01 14:30:00"
- Store as TEXT, query with date/time functions

### JSON Support
SQLite has built-in JSON functions:
```sql
json_object('key', 'value')
json_extract(column, '$.key')
```

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [PRD-011: My Work View](../../../docs/PRD/PRD-011-MyWork.md)
- [My Work Blueprint](../../../docs/architecture/my-work-blueprint.md)

---

*Last updated: 2026-02-01*

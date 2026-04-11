# Migration 004: My Work - Time Tracking Setup Guide

**Status**: ✅ Ready to apply
**Date**: 2026-02-01
**PRD**: [PRD-011-MyWork.md](./docs/PRD/PRD-011-MyWork.md)
**Blueprint**: [my-work-blueprint.md](./docs/architecture/my-work-blueprint.md)

---

## 📋 What This Migration Does

Migration 004 sets up the complete database schema for the **My Work** feature, including:

### New Tables (7 total)
1. **`audit_log`** - Change tracking for governance (all data changes logged)
2. **`time_logs`** - Time tracking with manual/timer/Pomodoro support
3. **`pomodoro_sessions`** - Pomodoro timer sessions (work/break tracking)
4. **`user_preferences`** - User settings (Pomodoro durations, notifications, todo defaults)
5. **`calendar_connections`** - OAuth connections to Google/Outlook (Phase 2)
6. **`holidays`** - Holiday calendar cache (Phase 2)
7. **`calendar_events`** - Synced calendar events (Phase 2)

### Extended Tables
- **`work_items`** table gets 3 new columns:
  - `estimated_minutes` - Estimated time to complete
  - `assigned_to` - User assigned to this item
  - `completed_at` - When item was completed (for 24h auto-archive)

### Automation (Triggers)
- Auto-set `completed_at` when task status → 'done'
- Auto-clear `completed_at` when status changes from 'done'
- Track edits to time logs (increments `edit_count`)
- Auto-update timestamps
- Audit log all time log changes

### Performance (Indexes)
- 18 indexes for optimized queries on:
  - Todo list queries (`assigned_to`, `completed_at`)
  - Time log queries (`user_id + start_time`, active timers)
  - Holiday lookups (`country_code + year`)
  - Calendar events (`start_time`)

---

## 🚀 How to Apply Migration

### Step 1: Backup Your Database (IMPORTANT!)

```bash
# Copy current database
cp swiss-army-pm.db swiss-army-pm.db.backup-$(date +%Y%m%d)
```

### Step 2: Check Migration Status

```bash
npm run migrate:status
```

**Expected output:**
```
📊 Migration Status:

⏳ Pending  004_my_work_time_tracking.sql

Total: 0/1 migrations applied
```

### Step 3: Apply Migration

```bash
npm run migrate
```

**Expected output:**
```
🚀 Starting database migrations...

📋 Found 1 pending migration(s):
   - 004_my_work_time_tracking.sql

📄 Applying migration: 004_my_work_time_tracking.sql
✅ Migration 004_my_work_time_tracking.sql applied successfully

✨ All migrations completed successfully!
```

### Step 4: Verify Migration

```bash
node scripts/verify-migration.js
```

**Expected output:**
```
🔍 Verifying Migration 004: My Work Time Tracking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Checking Tables...
   ✅ All tables exist
      • audit_log
      • time_logs
      • pomodoro_sessions
      • user_preferences
      • calendar_connections
      • holidays
      • calendar_events
      • schema_migrations

🔧 Checking work_items Columns...
   ✅ All columns added to work_items
      • estimated_minutes
      • assigned_to
      • completed_at

⚡ Checking Triggers...
   ✅ All triggers created
      • work_items_auto_complete
      • work_items_auto_uncomplete
      • time_logs_track_edits
      • ...

📊 Checking Indexes...
   ✅ All indexes created
      • idx_time_logs_work_item
      • idx_time_logs_user
      • ...

📝 Checking Migration Record...
   ✅ Migration 004 recorded in schema_migrations
      Applied at: 2026-02-01 14:30:00

⚙️  Checking Default User Preferences...
   ✅ Default user preferences created
      Pomodoro work: 25 min
      Pomodoro short break: 5 min
      Pomodoro long break: 15 min
      Daily target: 480 min (8h)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All verification checks passed! (6/6)

🎉 Migration 004 successfully applied!
```

---

## 🗂️ Files Created

```
src/main/database/
├── migrations/
│   ├── 004_my_work_time_tracking.sql    # The migration SQL
│   └── README.md                         # Migration documentation
├── migrationRunner.ts                    # TypeScript migration runner
└── schema.ts                             # Updated to run migrations on init

scripts/
├── migrate.js                            # JavaScript migration runner (CLI)
└── verify-migration.js                   # Verification script

docs/PRD/
├── PRD-011-MyWork.md                     # Full feature specification
└── PRD-011-DECISIONS.md                  # Design decisions summary

docs/architecture/
└── my-work-blueprint.md                  # Technical implementation guide

MIGRATION-004-GUIDE.md                    # This file
```

---

## 🔍 Manual Verification (SQLite CLI)

If you prefer to verify manually with SQLite CLI:

```bash
sqlite3 swiss-army-pm.db
```

### Check Tables
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

### Check work_items Columns
```sql
PRAGMA table_info(work_items);
```

### Check Triggers
```sql
SELECT name FROM sqlite_master WHERE type='trigger';
```

### Check Migration Record
```sql
SELECT * FROM schema_migrations;
```

### Check Default Preferences
```sql
SELECT * FROM user_preferences;
```

### Count Records in New Tables
```sql
SELECT
  'audit_log' as table_name, COUNT(*) as count FROM audit_log
UNION ALL
SELECT 'time_logs', COUNT(*) FROM time_logs
UNION ALL
SELECT 'pomodoro_sessions', COUNT(*) FROM pomodoro_sessions
UNION ALL
SELECT 'user_preferences', COUNT(*) FROM user_preferences;
```

---

## ⚠️ Troubleshooting

### Error: "UNIQUE constraint failed: schema_migrations.name"

**Cause**: Migration was already applied.

**Solution**:
```bash
# Check migration status
npm run migrate:status

# If already applied, no action needed
# If record exists but tables are missing, rollback and re-run:
npm run migrate:rollback
npm run migrate
```

### Error: "no such table: work_items"

**Cause**: Base schema not initialized.

**Solution**:
```bash
# Run the app once to create base tables
npm run dev

# Then apply migration
npm run migrate
```

### Error: "near 'ALTER': syntax error"

**Cause**: SQLite version too old (need 3.25.0+ for ALTER TABLE ADD COLUMN IF NOT EXISTS).

**Solution**:
```bash
# Check SQLite version
sqlite3 --version

# If < 3.25.0, upgrade SQLite or manually check if columns exist before altering
```

### Migration Applied but Verification Fails

**Cause**: Migration partially completed.

**Solution**:
```bash
# Restore from backup
cp swiss-army-pm.db.backup-YYYYMMDD swiss-army-pm.db

# Re-run migration
npm run migrate
```

---

## 🧹 Rollback (If Needed)

### Remove Migration Record Only
```bash
npm run migrate:rollback
```

**⚠️ WARNING**: This only removes the migration record. It does NOT undo schema changes.

### Full Rollback (Manual)

If you need to fully undo the migration:

1. **Restore from backup**:
   ```bash
   cp swiss-army-pm.db.backup-YYYYMMDD swiss-army-pm.db
   ```

2. **Or manually drop tables**:
   ```sql
   DROP TABLE IF EXISTS audit_log;
   DROP TABLE IF EXISTS time_logs;
   DROP TABLE IF EXISTS pomodoro_sessions;
   DROP TABLE IF EXISTS user_preferences;
   DROP TABLE IF EXISTS calendar_connections;
   DROP TABLE IF EXISTS holidays;
   DROP TABLE IF EXISTS calendar_events;

   -- Remove columns (not supported in SQLite, need to recreate table)
   -- Manually recreate work_items table without new columns
   ```

---

## 📊 Database Size Impact

**Before Migration**: ~50 KB (base schema)
**After Migration**: ~60 KB (empty tables)
**With 1000 time logs**: ~150 KB
**With 10,000 time logs**: ~800 KB

The migration adds minimal overhead. Most space will be used by time logs over time.

---

## 🔐 Security Notes

1. **OAuth Tokens**: The `calendar_connections` table stores OAuth tokens in plain text. In production, these should be encrypted using a library like `node-keytar` or OS keychain.

2. **Audit Log**: All time log changes are tracked. Ensure GDPR compliance if deploying in EU.

3. **User IDs**: Currently using string user IDs (`'default-user'`). Replace with actual authentication system in production.

---

## 🎯 Next Steps After Migration

### 1. Implement IPC Handlers
Create `src/main/ipc/myWorkHandlers.ts`:
- `mywork:getTodos`
- `mywork:markDone`
- `timelog:start`
- `timelog:stop`
- `timelog:edit`
- `pomodoro:start`
- `pomodoro:complete`

### 2. Build Zustand Store
Create `src/renderer/stores/useMyWorkStore.ts` (see blueprint section 3.2)

### 3. Create UI Components
- `TodoListContainer.tsx`
- `PomodoroTimer/TimerWidget.tsx`
- `TodayLog/LogEntry.tsx`
- `EditTimeLogDialog.tsx`

### 4. Test the Feature
- Start timer on task
- Log manual time
- Start Pomodoro session
- Edit time log
- Verify audit trail

---

## 📚 Related Documentation

- [PRD-011: My Work View](./docs/PRD/PRD-011-MyWork.md) - Full feature specification
- [My Work Blueprint](./docs/architecture/my-work-blueprint.md) - Technical architecture
- [Design Decisions](./docs/PRD/PRD-011-DECISIONS.md) - Approved design decisions
- [Migration README](./src/main/database/migrations/README.md) - Migration system docs

---

## ✅ Migration Checklist

- [ ] Backup database (`cp swiss-army-pm.db swiss-army-pm.db.backup-YYYYMMDD`)
- [ ] Check migration status (`npm run migrate:status`)
- [ ] Apply migration (`npm run migrate`)
- [ ] Verify migration (`node scripts/verify-migration.js`)
- [ ] Test basic queries in SQLite CLI
- [ ] Commit migration files to git
- [ ] Update team/documentation about new schema

---

## 🎉 You're All Set!

The database is now ready for the **My Work** feature implementation. Start building the IPC handlers and UI components!

Need help? Check the PRD and blueprint documents for detailed implementation guidance.

---

*Last updated: 2026-02-01*

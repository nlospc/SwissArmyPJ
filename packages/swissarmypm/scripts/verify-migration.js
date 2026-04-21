#!/usr/bin/env node

/**
 * Migration Verification Script
 *
 * Verifies that migration 004 was applied successfully by checking:
 * - All tables exist
 * - All columns added to work_items
 * - All triggers created
 * - All indexes created
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'swiss-army-pm.db');
const db = new Database(dbPath, { readonly: true });

console.log('\n🔍 Verifying Migration 004: My Work Time Tracking\n');
console.log('━'.repeat(60));

// Helper to check if something exists
const exists = (query, expected) => {
  const result = db.prepare(query).all();
  const found = result.map(r => r.name);
  const missing = expected.filter(e => !found.includes(e));

  return { found, missing, success: missing.length === 0 };
};

// 1. Check Tables
console.log('\n📋 Checking Tables...');
const tables = exists(
  "SELECT name FROM sqlite_master WHERE type='table'",
  [
    'audit_log',
    'time_logs',
    'pomodoro_sessions',
    'user_preferences',
    'calendar_connections',
    'holidays',
    'calendar_events',
    'schema_migrations'
  ]
);

if (tables.success) {
  console.log('   ✅ All tables exist');
  tables.found
    .filter(t => !t.startsWith('sqlite_'))
    .forEach(t => console.log(`      • ${t}`));
} else {
  console.log('   ❌ Missing tables:');
  tables.missing.forEach(t => console.log(`      • ${t}`));
}

// 2. Check work_items columns
console.log('\n🔧 Checking work_items Columns...');
const workItemsInfo = db.prepare("PRAGMA table_info(work_items)").all();
const workItemsColumns = workItemsInfo.map(c => c.name);
const expectedColumns = ['estimated_minutes', 'assigned_to', 'completed_at'];
const missingColumns = expectedColumns.filter(c => !workItemsColumns.includes(c));

if (missingColumns.length === 0) {
  console.log('   ✅ All columns added to work_items');
  expectedColumns.forEach(c => console.log(`      • ${c}`));
} else {
  console.log('   ❌ Missing columns:');
  missingColumns.forEach(c => console.log(`      • ${c}`));
}

// 3. Check Triggers
console.log('\n⚡ Checking Triggers...');
const triggers = exists(
  "SELECT name FROM sqlite_master WHERE type='trigger'",
  [
    'work_items_auto_complete',
    'work_items_auto_uncomplete',
    'time_logs_track_edits',
    'time_logs_updated_at',
    'user_preferences_updated_at',
    'calendar_connections_updated_at',
    'audit_time_logs_insert',
    'audit_time_logs_update',
    'audit_time_logs_delete'
  ]
);

if (triggers.success) {
  console.log('   ✅ All triggers created');
  triggers.found.forEach(t => console.log(`      • ${t}`));
} else {
  console.log('   ❌ Missing triggers:');
  triggers.missing.forEach(t => console.log(`      • ${t}`));
}

// 4. Check Indexes
console.log('\n📊 Checking Indexes...');
const indexes = exists(
  "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'",
  [
    'idx_audit_log_entity',
    'idx_audit_log_created_at',
    'idx_audit_log_user',
    'idx_time_logs_work_item',
    'idx_time_logs_user',
    'idx_time_logs_start_time',
    'idx_time_logs_user_date',
    'idx_time_logs_active',
    'idx_pomodoro_time_log',
    'idx_pomodoro_started_at',
    'idx_calendar_connections_user',
    'idx_holidays_country_year',
    'idx_holidays_date',
    'idx_calendar_events_connection',
    'idx_calendar_events_start_time',
    'idx_calendar_events_external',
    'idx_work_items_assigned_to',
    'idx_work_items_completed_at'
  ]
);

if (indexes.success) {
  console.log('   ✅ All indexes created');
  indexes.found.forEach(i => console.log(`      • ${i}`));
} else {
  console.log('   ❌ Missing indexes:');
  indexes.missing.forEach(i => console.log(`      • ${i}`));
}

// 5. Check Migration Record
console.log('\n📝 Checking Migration Record...');
const migrationRecord = db
  .prepare("SELECT * FROM schema_migrations WHERE name = ?")
  .get('004_my_work_time_tracking.sql');

if (migrationRecord) {
  console.log('   ✅ Migration 004 recorded in schema_migrations');
  console.log(`      Applied at: ${migrationRecord.applied_at}`);
} else {
  console.log('   ❌ Migration 004 not found in schema_migrations');
}

// 6. Check Audit Log Entry
console.log('\n📋 Checking Audit Log...');
const auditRecord = db
  .prepare("SELECT * FROM audit_log WHERE entity_type = 'Migration' AND entity_id = '004'")
  .get();

if (auditRecord) {
  console.log('   ✅ Migration 004 recorded in audit_log');
  const details = JSON.parse(auditRecord.new_values_json);
  console.log(`      Name: ${details.name}`);
  console.log(`      Applied at: ${details.applied_at}`);
} else {
  console.log('   ⚠️  Migration 004 not found in audit_log (might be expected)');
}

// 7. Check Default User Preferences
console.log('\n⚙️  Checking Default User Preferences...');
const defaultPrefs = db
  .prepare("SELECT * FROM user_preferences WHERE user_id = 'default-user'")
  .get();

if (defaultPrefs) {
  console.log('   ✅ Default user preferences created');
  console.log(`      Pomodoro work: ${defaultPrefs.pomodoro_work_duration} min`);
  console.log(`      Pomodoro short break: ${defaultPrefs.pomodoro_short_break} min`);
  console.log(`      Pomodoro long break: ${defaultPrefs.pomodoro_long_break} min`);
  console.log(`      Daily target: ${defaultPrefs.daily_time_target} min (${defaultPrefs.daily_time_target / 60}h)`);
} else {
  console.log('   ❌ Default user preferences not found');
}

// Summary
console.log('\n' + '━'.repeat(60));

const allChecks = [
  tables.success,
  missingColumns.length === 0,
  triggers.success,
  indexes.success,
  !!migrationRecord,
  !!defaultPrefs
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

if (passedChecks === totalChecks) {
  console.log(`\n✅ All verification checks passed! (${passedChecks}/${totalChecks})`);
  console.log('\n🎉 Migration 004 successfully applied!\n');
} else {
  console.log(`\n⚠️  ${passedChecks}/${totalChecks} checks passed`);
  console.log('\n❌ Some verification checks failed. Review the output above.\n');
  process.exit(1);
}

db.close();

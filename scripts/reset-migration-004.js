// Reset migration 004 so it runs again
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'swiss-army-pm.db');
const backupPath = path.join(__dirname, '..', 'swiss-army-pm.db.backup');

// Backup first
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, backupPath);
  console.log('✅ Database backed up to swiss-army-pm.db.backup');
}

// Now read and print SQL to manually apply
const migrationFile = path.join(__dirname, '..', 'src', 'main', 'database', 'migrations', '004_my_work_time_tracking_simple.sql');
if (fs.existsSync(migrationFile)) {
  console.log('\n📄 Migration file:', migrationFile);
  console.log('\nRun this SQL directly or restart the app to apply it.\n');
} else {
  console.log('❌ Migration file not found:', migrationFile);
}

console.log('\nTo fix:');
console.log('1. Delete swiss-army-pm.db (backup saved)');
console.log('2. Run: npm run dev');
console.log('   (App will recreate DB with all migrations)');

// Force run migration 004 manually
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'swiss-army-pm.db');

if (fs.existsSync(dbPath)) {
  console.log('❌ Database already exists. Delete it first.');
  process.exit(1);
}

console.log('Creating database and running migration 004...\n');

// Create database
const db = new Database(dbPath);
const migrationFile = path.join(__dirname, '..', 'dist', 'main', 'database', 'migrations', '004_my_work_time_tracking_simple.sql');

if (!fs.existsSync(migrationFile)) {
  console.log('❌ Migration file not found:', migrationFile);
  process.exit(1);
}

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Read and execute migration
const sql = fs.readFileSync(migrationFile, 'utf8');
console.log('Executing migration 004...\n');

try {
  db.exec(sql);

  // Mark as applied
  db.prepare('INSERT INTO schema_migrations (name) VALUES (?)')
    .run('004_my_work_time_tracking_simple.sql');

  console.log('✅ Migration 004 applied successfully!\n');

  // Check created tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('Tables created:');
  tables.forEach(t => console.log('  -', t.name));

} catch (error) {
  console.log('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('\n✨ Database ready. Run `npm run dev` to start the app.');

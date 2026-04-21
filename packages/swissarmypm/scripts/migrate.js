#!/usr/bin/env node

/**
 * Migration runner script (JavaScript version)
 * Run with: node scripts/migrate.js [command]
 *
 * Commands:
 *   run      - Run all pending migrations (default)
 *   status   - Show migration status
 *   rollback - Rollback last migration
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor(db) {
    this.db = db;
    this.migrationsDir = path.join(__dirname, '..', 'src', 'main', 'database', 'migrations');
    this.ensureMigrationsTable();
  }

  ensureMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  getAppliedMigrations() {
    const rows = this.db.prepare('SELECT name FROM schema_migrations ORDER BY id').all();
    return new Set(rows.map(row => row.name));
  }

  getAvailableMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('No migrations directory found.');
      return [];
    }

    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  applyMigration(filename) {
    const filePath = path.join(this.migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`\n📄 Applying migration: ${filename}`);

    try {
      const transaction = this.db.transaction(() => {
        this.db.exec(sql);
        this.db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(filename);
      });

      transaction();
      console.log(`✅ Migration ${filename} applied successfully`);
    } catch (error) {
      console.error(`❌ Failed to apply migration ${filename}:`, error.message);
      throw error;
    }
  }

  runMigrations() {
    console.log('\n🚀 Starting database migrations...\n');

    const appliedMigrations = this.getAppliedMigrations();
    const availableMigrations = this.getAvailableMigrations();

    const pendingMigrations = availableMigrations.filter(
      migration => !appliedMigrations.has(migration)
    );

    if (pendingMigrations.length === 0) {
      console.log('✨ No pending migrations. Database is up to date.\n');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach(m => console.log(`   - ${m}`));

    for (const migration of pendingMigrations) {
      this.applyMigration(migration);
    }

    console.log('\n✨ All migrations completed successfully!\n');
  }

  showStatus() {
    console.log('\n📊 Migration Status:\n');

    const appliedMigrations = this.getAppliedMigrations();
    const availableMigrations = this.getAvailableMigrations();

    if (availableMigrations.length === 0) {
      console.log('No migration files found.\n');
      return;
    }

    availableMigrations.forEach(migration => {
      const status = appliedMigrations.has(migration) ? '✅ Applied' : '⏳ Pending';
      console.log(`${status}  ${migration}`);
    });

    console.log(`\nTotal: ${appliedMigrations.size}/${availableMigrations.length} migrations applied\n`);
  }

  rollbackLast() {
    const lastMigration = this.db
      .prepare('SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 1')
      .get();

    if (!lastMigration) {
      console.log('❌ No migrations to rollback.\n');
      return;
    }

    console.log(`\n⚠️  Rolling back migration: ${lastMigration.name}`);
    console.log('⚠️  WARNING: This only removes the migration record.');
    console.log('⚠️  You must manually revert schema changes!\n');

    this.db.prepare('DELETE FROM schema_migrations WHERE id = ?').run(lastMigration.id);
    console.log(`✅ Migration record removed: ${lastMigration.name}\n`);
  }
}

// Main execution
const dbPath = path.join(process.cwd(), 'swiss-army-pm.db');
const db = new Database(dbPath);
const runner = new MigrationRunner(db);

const command = process.argv[2] || 'run';

switch (command) {
  case 'status':
    runner.showStatus();
    break;
  case 'rollback':
    runner.rollbackLast();
    break;
  case 'run':
  default:
    runner.runMigrations();
    break;
}

db.close();

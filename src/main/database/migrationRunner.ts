/**
 * Database Migration Runner
 *
 * Executes SQL migration files in order to evolve the database schema.
 * Tracks applied migrations to prevent re-running.
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}

export class MigrationRunner {
  private db: Database.Database;
  private migrationsDir: string;

  constructor(db: Database.Database) {
    this.db = db;
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.ensureMigrationsTable();
  }

  /**
   * Create migrations tracking table if it doesn't exist
   */
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  /**
   * Get list of already applied migrations
   */
  private getAppliedMigrations(): Set<string> {
    const rows = this.db
      .prepare('SELECT name FROM schema_migrations ORDER BY id')
      .all() as MigrationRecord[];

    return new Set(rows.map(row => row.name));
  }

  /**
   * Get list of available migration files
   */
  private getAvailableMigrations(): string[] {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log('No migrations directory found, creating...');
      fs.mkdirSync(this.migrationsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files;
  }

  /**
   * Apply a single migration file
   */
  private applyMigration(filename: string): void {
    const filePath = path.join(this.migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`\n📄 Applying migration: ${filename}`);

    try {
      // Execute migration in a transaction
      this.db.transaction(() => {
        // Run the migration SQL
        this.db.exec(sql);

        // Record migration as applied
        this.db
          .prepare('INSERT INTO schema_migrations (name) VALUES (?)')
          .run(filename);
      })();

      console.log(`✅ Migration ${filename} applied successfully`);
    } catch (error) {
      console.error(`❌ Failed to apply migration ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  public runMigrations(): void {
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

    // Apply each pending migration
    for (const migration of pendingMigrations) {
      this.applyMigration(migration);
    }

    console.log('\n✨ All migrations completed successfully!\n');
  }

  /**
   * Show migration status
   */
  public showStatus(): void {
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

  /**
   * Rollback last migration (DANGER: Use with caution)
   * Note: This doesn't automatically undo schema changes, you need to write DOWN migrations
   */
  public rollbackLast(): void {
    const lastMigration = this.db
      .prepare('SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 1')
      .get() as MigrationRecord | undefined;

    if (!lastMigration) {
      console.log('❌ No migrations to rollback.\n');
      return;
    }

    console.log(`\n⚠️  Rolling back migration: ${lastMigration.name}`);
    console.log('⚠️  WARNING: This only removes the migration record.');
    console.log('⚠️  You must manually revert schema changes!\n');

    const confirm = true; // In production, add user confirmation prompt

    if (confirm) {
      this.db
        .prepare('DELETE FROM schema_migrations WHERE id = ?')
        .run(lastMigration.id);

      console.log(`✅ Migration record removed: ${lastMigration.name}\n`);
    }
  }
}

/**
 * CLI entry point (run this file directly to execute migrations)
 */
if (require.main === module) {
  const dbPath = path.join(process.cwd(), 'swiss-army-pm.db');
  const db = new Database(dbPath);
  const runner = new MigrationRunner(db);

  const command = process.argv[2];

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
}

/**
 * Database migration system
 * Handles schema versioning and incremental updates
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

/**
 * Migration metadata
 */
export interface Migration {
  id: number;
  name: string;
  filename: string;
  applied_at?: string;
}

/**
 * Migration manager class
 */
export class MigrationManager {
  private db: Database.Database;
  private migrationsDir: string;

  constructor(db: Database.Database, migrationsDir?: string) {
    this.db = db;
    this.migrationsDir = migrationsDir || __dirname;
  }

  /**
   * Initialize migrations table to track applied migrations
   */
  public initializeMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migrations table initialized');
  }

  /**
   * Get list of all available migration files
   */
  private getAvailableMigrations(): Migration[] {
    const files = fs.readdirSync(this.migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith('.sql') && file.match(/^\d+_/));

    return sqlFiles
      .map((filename) => {
        const match = filename.match(/^(\d+)_(.+)\.sql$/);
        if (!match) return null;

        return {
          id: parseInt(match[1], 10),
          name: match[2],
          filename
        };
      })
      .filter((m): m is Migration => m !== null)
      .sort((a, b) => a.id - b.id);
  }

  /**
   * Get list of applied migrations
   */
  private getAppliedMigrations(): Migration[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM _migrations ORDER BY id');
      return stmt.all() as Migration[];
    } catch {
      return [];
    }
  }

  /**
   * Check if a migration has been applied
   */
  private isMigrationApplied(migrationId: number): boolean {
    const stmt = this.db.prepare('SELECT id FROM _migrations WHERE id = ?');
    const result = stmt.get(migrationId);
    return result !== undefined;
  }

  /**
   * Apply a single migration
   */
  private applyMigration(migration: Migration): void {
    const migrationPath = path.join(this.migrationsDir, migration.filename);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    const applyTransaction = this.db.transaction(() => {
      this.db.exec(sql);

      this.db
        .prepare(
          'INSERT INTO _migrations (id, name, filename) VALUES (?, ?, ?)'
        )
        .run(migration.id, migration.name, migration.filename);
    });

    try {
      applyTransaction();
      console.log(`Applied migration: ${migration.id}_${migration.name}`);
    } catch (error) {
      console.error(`Failed to apply migration ${migration.id}_${migration.name}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  public runPendingMigrations(): void {
    this.initializeMigrationsTable();

    const available = this.getAvailableMigrations();
    const applied = this.getAppliedMigrations();

    console.log(`Found ${available.length} available migrations`);
    console.log(`Found ${applied.length} applied migrations`);

    const pending = available.filter((migration) => !this.isMigrationApplied(migration.id));

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pending.length} pending migrations...`);

    for (const migration of pending) {
      this.applyMigration(migration);
    }

    console.log('All migrations applied successfully');
  }

  /**
   * Get migration status
   */
  public getStatus(): {
    available: Migration[];
    applied: Migration[];
    pending: Migration[];
  } {
    this.initializeMigrationsTable();

    const available = this.getAvailableMigrations();
    const applied = this.getAppliedMigrations();
    const pending = available.filter((migration) => !this.isMigrationApplied(migration.id));

    return { available, applied, pending };
  }

  /**
   * Rollback last migration (use with caution)
   * Note: This requires migrations to have corresponding rollback SQL files
   */
  public rollbackLastMigration(): void {
    const applied = this.getAppliedMigrations();

    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = applied[applied.length - 1];
    const rollbackFilename = lastMigration.filename.replace('.sql', '.rollback.sql');
    const rollbackPath = path.join(this.migrationsDir, rollbackFilename);

    if (!fs.existsSync(rollbackPath)) {
      throw new Error(
        `Rollback file not found: ${rollbackFilename}. Cannot rollback migration ${lastMigration.id}`
      );
    }

    const sql = fs.readFileSync(rollbackPath, 'utf-8');

    const rollbackTransaction = this.db.transaction(() => {
      this.db.exec(sql);

      this.db.prepare('DELETE FROM _migrations WHERE id = ?').run(lastMigration.id);
    });

    try {
      rollbackTransaction();
      console.log(`Rolled back migration: ${lastMigration.id}_${lastMigration.name}`);
    } catch (error) {
      console.error(`Failed to rollback migration ${lastMigration.id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  public createMigration(name: string): string {
    const applied = this.getAppliedMigrations();
    const available = this.getAvailableMigrations();

    const allMigrations = [...applied, ...available];
    const nextId = allMigrations.length > 0 ? Math.max(...allMigrations.map((m) => m.id)) + 1 : 1;

    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const filename = `${String(nextId).padStart(3, '0')}_${sanitizedName}.sql`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add description here

-- Add your SQL statements below

`;

    fs.writeFileSync(filepath, template, 'utf-8');
    console.log(`Created migration file: ${filename}`);

    return filename;
  }
}

/**
 * Export convenience function to run migrations
 */
export function runMigrations(db: Database.Database, migrationsDir?: string): void {
  const manager = new MigrationManager(db, migrationsDir);
  manager.runPendingMigrations();
}

/**
 * Export convenience function to get migration status
 */
export function getMigrationStatus(
  db: Database.Database,
  migrationsDir?: string
): ReturnType<MigrationManager['getStatus']> {
  const manager = new MigrationManager(db, migrationsDir);
  return manager.getStatus();
}

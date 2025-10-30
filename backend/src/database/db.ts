/**
 * Database connection and initialization module
 * Handles SQLite database setup, migrations, and connection management
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Database configuration options
 */
interface DatabaseConfig {
  filename: string;
  readonly?: boolean;
  verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
  fileMustExist?: boolean;
}

/**
 * Database instance singleton
 */
class DatabaseConnection {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;
  private isInitialized = false;

  constructor(config?: Partial<DatabaseConfig>) {
    const defaultConfig: DatabaseConfig = {
      filename: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'mck-suite.db'),
      readonly: false,
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      fileMustExist: false
    };

    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get the database instance
   * @throws {Error} If database is not initialized
   */
  public getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Initialize the database connection
   * Creates the database file and directory if they don't exist
   */
  public initialize(): void {
    if (this.isInitialized && this.db) {
      console.log('Database already initialized');
      return;
    }

    try {
      const dbDir = path.dirname(this.config.filename);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Created database directory: ${dbDir}`);
      }

      this.db = new Database(this.config.filename, {
        readonly: this.config.readonly,
        verbose: this.config.verbose,
        fileMustExist: this.config.fileMustExist
      });

      this.enableForeignKeys();

      this.isInitialized = true;
      console.log(`Database initialized: ${this.config.filename}`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Enable foreign key constraints
   * CRITICAL: SQLite doesn't enforce foreign keys by default
   */
  private enableForeignKeys(): void {
    if (!this.db) return;

    this.db.pragma('foreign_keys = ON');
    const result = this.db.pragma('foreign_keys', { simple: true });

    if (result !== 1) {
      throw new Error('Failed to enable foreign key constraints');
    }

    console.log('Foreign key constraints enabled');
  }

  /**
   * Run the schema SQL to create all tables
   */
  public async runSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

      this.db.exec(schemaSQL);
      console.log('Database schema created successfully');
    } catch (error) {
      console.error('Failed to run schema:', error);
      throw error;
    }
  }

  /**
   * Check if all required tables exist
   */
  public validateSchema(): boolean {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const requiredTables = [
      'Users',
      'Instances',
      'UserInstancePermissions',
      'SettingTemplates',
      'SharedUserGroups',
      'InstanceSharedGroups',
      'WhitelistRequests'
    ];

    try {
      const stmt = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
      );

      for (const tableName of requiredTables) {
        const result = stmt.get(tableName);
        if (!result) {
          console.error(`Missing required table: ${tableName}`);
          return false;
        }
      }

      console.log('Schema validation passed');
      return true;
    } catch (error) {
      console.error('Schema validation failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics and information
   */
  public getStats(): {
    filename: string;
    size: number;
    tables: Array<{ name: string; rows: number }>;
  } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stats = fs.statSync(this.config.filename);
    const tables = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;

    const tablesWithRows = tables.map((table) => {
      const countResult = this.db!.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      return {
        name: table.name,
        rows: countResult.count
      };
    });

    return {
      filename: this.config.filename,
      size: stats.size,
      tables: tablesWithRows
    };
  }

  /**
   * Execute a raw SQL query (use with caution)
   * @param sql SQL query string
   */
  public exec(sql: string): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    this.db.exec(sql);
  }

  /**
   * Create a prepared statement
   * @param sql SQL query string
   */
  public prepare<T = unknown>(sql: string): Database.Statement<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.prepare<T[]>(sql);
  }

  /**
   * Begin a transaction
   */
  public transaction<T>(fn: () => T): T {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const txn = this.db.transaction(fn);
    return txn();
  }

  /**
   * Backup the database to a file
   * @param backupPath Path to backup file
   */
  public async backup(backupPath: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      await this.db.backup(backupPath);
      console.log(`Database backed up to: ${backupPath}`);
    } catch (error) {
      console.error('Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  /**
   * Optimize database (vacuum and analyze)
   */
  public optimize(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    console.log('Optimizing database...');
    this.db.exec('VACUUM');
    this.db.exec('ANALYZE');
    console.log('Database optimization complete');
  }
}

/**
 * Singleton database connection instance
 */
export const dbConnection = new DatabaseConnection();

/**
 * Initialize database and create schema
 * Call this during application startup
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');

    dbConnection.initialize();

    await dbConnection.runSchema();

    if (!dbConnection.validateSchema()) {
      throw new Error('Database schema validation failed');
    }

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get the database instance
 * Convenience function for accessing the singleton
 */
export function getDatabase(): Database.Database {
  return dbConnection.getDb();
}

/**
 * Close database connection
 * Call this during application shutdown
 */
export function closeDatabase(): void {
  dbConnection.close();
}

/**
 * Export database connection class for testing
 */
export { DatabaseConnection };

/**
 * Default export
 */
export default dbConnection;

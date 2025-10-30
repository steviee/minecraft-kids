/**
 * Database module main export
 * Provides centralized access to all database functionality
 */

export {
  dbConnection,
  DatabaseConnection,
  initializeDatabase,
  getDatabase,
  closeDatabase,
} from './db';

export { MigrationManager, runMigrations, getMigrationStatus } from './migrations';

export { DatabaseSeeder, seedDatabase, seedAdminUser, seedTestData } from './seed';

export * from './types';

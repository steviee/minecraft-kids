/**
 * Database verification and test script
 * Tests database initialization, schema creation, and basic operations
 */

import path from 'path';
import fs from 'fs';
import { DatabaseConnection, seedDatabase } from './index';

/**
 * Test result interface
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * Database test suite
 */
class DatabaseTestSuite {
  private dbConnection: DatabaseConnection;
  private testDbPath: string;
  private results: TestResult[] = [];

  constructor() {
    this.testDbPath = path.join(process.cwd(), 'data', 'test-mck-suite.db');

    this.dbConnection = new DatabaseConnection({
      filename: this.testDbPath,
      verbose: undefined,
    });
  }

  /**
   * Run a single test
   */
  private async runTest(name: string, testFn: () => Promise<void> | void): Promise<void> {
    try {
      await testFn();
      this.results.push({ name, passed: true });
      console.log(`✓ ${name}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up test database
   */
  private cleanup(): void {
    try {
      this.dbConnection.close();

      if (fs.existsSync(this.testDbPath)) {
        fs.unlinkSync(this.testDbPath);
        console.log('Test database cleaned up');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Test 1: Database initialization
   */
  private testInitialization(): void {
    this.dbConnection.initialize();

    if (!this.dbConnection.isReady()) {
      throw new Error('Database not initialized');
    }

    if (!fs.existsSync(this.testDbPath)) {
      throw new Error('Database file not created');
    }
  }

  /**
   * Test 2: Schema creation
   */
  private async testSchemaCreation(): Promise<void> {
    await this.dbConnection.runSchema();

    if (!this.dbConnection.validateSchema()) {
      throw new Error('Schema validation failed');
    }
  }

  /**
   * Test 3: Foreign key constraints
   */
  private testForeignKeys(): void {
    const db = this.dbConnection.getDb();
    const result = db.pragma('foreign_keys', { simple: true });

    if (result !== 1) {
      throw new Error('Foreign keys not enabled');
    }
  }

  /**
   * Test 4: Table existence
   */
  private testTablesExist(): void {
    const db = this.dbConnection.getDb();

    const requiredTables = [
      'Users',
      'Instances',
      'UserInstancePermissions',
      'SettingTemplates',
      'SharedUserGroups',
      'InstanceSharedGroups',
      'WhitelistRequests',
    ];

    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tables = stmt.all() as Array<{ name: string }>;
    const tableNames = tables.map((t) => t.name);

    for (const tableName of requiredTables) {
      if (!tableNames.includes(tableName)) {
        throw new Error(`Missing required table: ${tableName}`);
      }
    }
  }

  /**
   * Test 5: Views existence
   */
  private testViewsExist(): void {
    const db = this.dbConnection.getDb();

    const requiredViews = [
      'InstancePermissionsView',
      'PendingWhitelistRequestsView',
      'InstanceStatsView',
    ];

    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name");
    const views = stmt.all() as Array<{ name: string }>;
    const viewNames = views.map((v) => v.name);

    for (const viewName of requiredViews) {
      if (!viewNames.includes(viewName)) {
        throw new Error(`Missing required view: ${viewName}`);
      }
    }
  }

  /**
   * Test 6: Indexes existence
   */
  private testIndexesExist(): void {
    const db = this.dbConnection.getDb();

    const stmt = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
    );
    const indexes = stmt.all() as Array<{ name: string }>;

    if (indexes.length === 0) {
      throw new Error('No indexes found');
    }

    console.log(`  Found ${indexes.length} indexes`);
  }

  /**
   * Test 7: Triggers existence
   */
  private testTriggersExist(): void {
    const db = this.dbConnection.getDb();

    const requiredTriggers = [
      'update_users_timestamp',
      'update_instances_timestamp',
      'update_setting_templates_timestamp',
      'update_shared_user_groups_timestamp',
    ];

    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name");
    const triggers = stmt.all() as Array<{ name: string }>;
    const triggerNames = triggers.map((t) => t.name);

    for (const triggerName of requiredTriggers) {
      if (!triggerNames.includes(triggerName)) {
        throw new Error(`Missing required trigger: ${triggerName}`);
      }
    }
  }

  /**
   * Test 8: Seed admin user
   */
  private async testSeedAdminUser(): Promise<void> {
    const db = this.dbConnection.getDb();

    await seedDatabase(db, {
      adminUsername: 'testadmin',
      adminEmail: 'testadmin@test.com',
      adminPassword: 'testpass123',
      includeTestData: false,
    });

    const stmt = db.prepare('SELECT * FROM Users WHERE username = ?');
    const user = stmt.get('testadmin');

    if (!user) {
      throw new Error('Admin user not created');
    }
  }

  /**
   * Test 9: User insert and query
   */
  private async testUserOperations(): Promise<void> {
    const db = this.dbConnection.getDb();

    const insertStmt = db.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const info = insertStmt.run('testuser', 'test@test.com', 'hashedpass', 'junior-admin');

    const selectStmt = db.prepare('SELECT * FROM Users WHERE id = ?');
    const user = selectStmt.get(info.lastInsertRowid);

    if (!user) {
      throw new Error('Failed to insert and retrieve user');
    }
  }

  /**
   * Test 10: Instance insert and query
   */
  private testInstanceOperations(): void {
    const db = this.dbConnection.getDb();

    const userStmt = db.prepare('SELECT id FROM Users LIMIT 1');
    const user = userStmt.get() as { id: number } | undefined;

    if (!user) {
      throw new Error('No user found for instance test');
    }

    const insertStmt = db.prepare(`
      INSERT INTO Instances (name, minecraft_version, server_port, rcon_port, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = insertStmt.run('testserver', '1.21.1', 25565, 25575, user.id);

    const selectStmt = db.prepare('SELECT * FROM Instances WHERE id = ?');
    const instance = selectStmt.get(info.lastInsertRowid);

    if (!instance) {
      throw new Error('Failed to insert and retrieve instance');
    }
  }

  /**
   * Test 11: Foreign key constraint enforcement
   */
  private testForeignKeyConstraints(): void {
    const db = this.dbConnection.getDb();

    try {
      const stmt = db.prepare(`
        INSERT INTO Instances (name, minecraft_version, server_port, rcon_port, created_by)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run('invalidserver', '1.21.1', 25567, 25577, 99999);

      throw new Error('Foreign key constraint not enforced (should have failed)');
    } catch (error) {
      if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Test 12: Unique constraint enforcement
   */
  private testUniqueConstraints(): void {
    const db = this.dbConnection.getDb();

    try {
      const stmt = db.prepare(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run('testadmin', 'duplicate@test.com', 'hashedpass', 'admin');

      throw new Error('Unique constraint not enforced (should have failed)');
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return;
      }
      throw error;
    }
  }

  /**
   * Test 13: Timestamp triggers
   */
  private async testTimestampTriggers(): Promise<void> {
    const db = this.dbConnection.getDb();

    const userStmt = db.prepare('SELECT id, updated_at FROM Users WHERE username = ?');
    const userBefore = userStmt.get('testadmin') as { id: number; updated_at: string } | undefined;

    if (!userBefore) {
      throw new Error('Test user not found');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const updateStmt = db.prepare('UPDATE Users SET email = ? WHERE id = ?');
    updateStmt.run('newemail@test.com', userBefore.id);

    const userAfter = userStmt.get('testadmin') as { id: number; updated_at: string } | undefined;

    if (!userAfter) {
      throw new Error('User not found after update');
    }

    if (userBefore.updated_at === userAfter.updated_at) {
      throw new Error('Timestamp trigger did not update updated_at field');
    }
  }

  /**
   * Test 14: Database statistics
   */
  private testDatabaseStats(): void {
    const stats = this.dbConnection.getStats();

    if (!stats.filename) {
      throw new Error('No filename in stats');
    }

    if (!stats.tables || stats.tables.length === 0) {
      throw new Error('No tables in stats');
    }

    console.log(`  Database size: ${stats.size} bytes`);
    console.log(`  Tables: ${stats.tables.length}`);
  }

  /**
   * Test 15: Transaction support
   */
  private testTransactions(): void {
    const db = this.dbConnection.getDb();

    const result = this.dbConnection.transaction(() => {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM Users');
      const countBefore = stmt.get() as { count: number };

      const insertStmt = db.prepare(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `);
      insertStmt.run('txuser', 'tx@test.com', 'hashedpass', 'admin');

      const countAfter = stmt.get() as { count: number };

      return countAfter.count - countBefore.count;
    });

    if (result !== 1) {
      throw new Error('Transaction did not work correctly');
    }
  }

  /**
   * Run all tests
   */
  public async runAllTests(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Minecraft Kids Server Management Suite');
    console.log('  Database Test Suite');
    console.log('═══════════════════════════════════════════════════════════\n');

    await this.runTest('1. Database initialization', () => this.testInitialization());
    await this.runTest('2. Schema creation', () => this.testSchemaCreation());
    await this.runTest('3. Foreign key constraints enabled', () => this.testForeignKeys());
    await this.runTest('4. All required tables exist', () => this.testTablesExist());
    await this.runTest('5. All required views exist', () => this.testViewsExist());
    await this.runTest('6. Indexes created', () => this.testIndexesExist());
    await this.runTest('7. Triggers created', () => this.testTriggersExist());
    await this.runTest('8. Seed admin user', () => this.testSeedAdminUser());
    await this.runTest('9. User CRUD operations', () => this.testUserOperations());
    await this.runTest('10. Instance CRUD operations', () => this.testInstanceOperations());
    await this.runTest('11. Foreign key constraint enforcement', () =>
      this.testForeignKeyConstraints()
    );
    await this.runTest('12. Unique constraint enforcement', () => this.testUniqueConstraints());
    await this.runTest('13. Timestamp triggers', () => this.testTimestampTriggers());
    await this.runTest('14. Database statistics', () => this.testDatabaseStats());
    await this.runTest('15. Transaction support', () => this.testTransactions());

    this.printResults();
    this.cleanup();
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Test Results Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.name}`);
          console.log(`    Error: ${r.error}`);
        });
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    if (failed === 0) {
      console.log('✓ All tests passed! Database implementation is working correctly.\n');
    } else {
      console.log('✗ Some tests failed. Please review the errors above.\n');
      process.exit(1);
    }
  }
}

/**
 * Run tests if executed directly
 */
if (require.main === module) {
  const testSuite = new DatabaseTestSuite();
  testSuite.runAllTests().catch((error) => {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  });
}

export { DatabaseTestSuite };

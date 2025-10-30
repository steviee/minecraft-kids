import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

let testDb: Database.Database | null = null;
const testDbPath = path.join(process.cwd(), 'tests', 'test-rbac.db');

/**
 * Initialize test database with schema
 */
export async function initializeTestDatabase(): Promise<void> {
  // Ensure tests directory exists
  const testsDir = path.dirname(testDbPath);
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  // Remove old test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create new database
  testDb = new Database(testDbPath);
  testDb.pragma('foreign_keys = ON');

  // Run schema
  const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  testDb.exec(schema);
}

/**
 * Get test database instance
 */
export function getTestDatabase(): Database.Database {
  if (!testDb) {
    throw new Error('Test database not initialized. Call initializeTestDatabase first.');
  }
  return testDb;
}

/**
 * Cleanup test database
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (testDb) {
    testDb.close();
    testDb = null;
  }

  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
}

/**
 * Insert a test user
 */
export function insertTestUser(email: string, role: string, username: string): number {
  const db = getTestDatabase();

  const stmt = db.prepare(`
    INSERT INTO Users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(username, email, 'hashed_password', role);
  return Number(result.lastInsertRowid);
}

/**
 * Insert a test instance
 */
export function insertTestInstance(
  name: string,
  _displayName: string,
  createdBy: number,
  serverPort?: number,
  rconPort?: number
): number {
  const db = getTestDatabase();

  // Generate unique ports if not provided
  const stmt = db.prepare(`
    INSERT INTO Instances (
      name,
      minecraft_version,
      server_port,
      rcon_port,
      created_by
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  // Use random ports if not specified to avoid conflicts
  const finalServerPort = serverPort || 25565 + Math.floor(Math.random() * 1000);
  const finalRconPort = rconPort || 25575 + Math.floor(Math.random() * 1000);

  const result = stmt.run(name, '1.21.1', finalServerPort, finalRconPort, createdBy);
  return Number(result.lastInsertRowid);
}

/**
 * Insert a user instance permission
 */
export function insertTestUserInstancePermission(
  userId: number,
  instanceId: number,
  grantedBy?: number
): number {
  const db = getTestDatabase();

  const stmt = db.prepare(`
    INSERT INTO UserInstancePermissions (user_id, instance_id, granted_by)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(userId, instanceId, grantedBy || userId);
  return Number(result.lastInsertRowid);
}

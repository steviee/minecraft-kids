/**
 * Database usage example
 * Demonstrates how to use the database module in your application
 */

import {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  seedAdminUser,
  User,
  Instance,
  CreateInstanceData,
} from './index';

/**
 * Example: Initialize and seed database
 */
async function example1_InitializeAndSeed(): Promise<void> {
  console.log('Example 1: Initialize and seed database\n');

  await initializeDatabase();

  await seedAdminUser(getDatabase(), {
    adminUsername: 'admin',
    adminEmail: 'admin@minecraft-kids.de',
    adminPassword: 'securepassword123',
  });

  console.log('Database initialized and seeded\n');
}

/**
 * Example: Query users
 */
function example2_QueryUsers(): void {
  console.log('Example 2: Query users\n');

  const db = getDatabase();

  const stmt = db.prepare('SELECT id, username, email, role FROM Users');
  const users = stmt.all() as User[];

  console.log(`Found ${users.length} users:`);
  users.forEach((user) => {
    console.log(`  - ${user.username} (${user.role}): ${user.email}`);
  });
  console.log('');
}

/**
 * Example: Create a server instance
 */
function example3_CreateInstance(): void {
  console.log('Example 3: Create server instance\n');

  const db = getDatabase();

  const adminStmt = db.prepare('SELECT id FROM Users WHERE role = ? LIMIT 1');
  const admin = adminStmt.get('admin') as { id: number } | undefined;

  if (!admin) {
    console.log('No admin user found, skipping instance creation\n');
    return;
  }

  const instanceData: CreateInstanceData = {
    name: 'survival',
    minecraft_version: '1.21.1',
    fabric_version: '0.16.14',
    server_port: 25565,
    rcon_port: 25575,
    rcon_password: 'minecraft123',
    max_players: 20,
    memory_allocation: '4G',
    created_by: admin.id,
  };

  try {
    const insertStmt = db.prepare(`
      INSERT INTO Instances (
        name, minecraft_version, fabric_version, server_port,
        rcon_port, rcon_password, max_players, memory_allocation, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStmt.run(
      instanceData.name,
      instanceData.minecraft_version,
      instanceData.fabric_version,
      instanceData.server_port,
      instanceData.rcon_port,
      instanceData.rcon_password,
      instanceData.max_players,
      instanceData.memory_allocation,
      instanceData.created_by
    );

    const selectStmt = db.prepare('SELECT * FROM Instances WHERE id = ?');
    const instance = selectStmt.get(info.lastInsertRowid) as Instance;

    console.log('Created instance:');
    console.log(`  Name: ${instance.name}`);
    console.log(`  Version: ${instance.minecraft_version}`);
    console.log(`  Port: ${instance.server_port}`);
    console.log(`  Status: ${instance.status}`);
    console.log('');
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      console.log('Instance already exists, skipping\n');
    } else {
      throw error;
    }
  }
}

/**
 * Example: Use transactions
 */
function example4_Transactions(): void {
  console.log('Example 4: Use transactions\n');

  const db = getDatabase();

  const result = db.transaction(() => {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM Instances');
    const countBefore = countStmt.get() as { count: number };

    console.log(`Instances before: ${countBefore.count}`);

    const countAfter = countStmt.get() as { count: number };
    console.log(`Instances after: ${countAfter.count}`);

    return countAfter.count;
  })();

  console.log(`Transaction completed, total instances: ${result}\n`);
}

/**
 * Example: Query with views
 */
function example5_QueryViews(): void {
  console.log('Example 5: Query with views\n');

  const db = getDatabase();

  const stmt = db.prepare('SELECT * FROM InstanceStatsView');
  const stats = stmt.all();

  console.log(`Instance statistics:`);
  if (stats.length === 0) {
    console.log('  No instances found');
  } else {
    stats.forEach((stat: unknown) => {
      const s = stat as { name: string; status: string; created_by_username: string };
      console.log(`  - ${s.name}: ${s.status} (created by ${s.created_by_username})`);
    });
  }
  console.log('');
}

/**
 * Example: Prepared statements with parameters
 */
function example6_PreparedStatements(): void {
  console.log('Example 6: Prepared statements\n');

  const db = getDatabase();

  const stmt = db.prepare('SELECT * FROM Users WHERE role = ?');
  const admins = stmt.all('admin') as User[];

  console.log(`Found ${admins.length} admin users:`);
  admins.forEach((admin) => {
    console.log(`  - ${admin.username} (${admin.email})`);
  });
  console.log('');
}

/**
 * Run all examples
 */
async function runExamples(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Database Usage Examples');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await example1_InitializeAndSeed();
    example2_QueryUsers();
    example3_CreateInstance();
    example4_Transactions();
    example5_QueryViews();
    example6_PreparedStatements();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  All examples completed successfully');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    closeDatabase();
  }
}

if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  example1_InitializeAndSeed,
  example2_QueryUsers,
  example3_CreateInstance,
  example4_Transactions,
  example5_QueryViews,
  example6_PreparedStatements,
};

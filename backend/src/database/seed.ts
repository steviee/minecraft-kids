/**
 * Database seeding script
 * Creates initial admin user and optional test data
 */

import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import { User, CreateUserData } from './types';

/**
 * Seed configuration options
 */
export interface SeedOptions {
  adminUsername?: string;
  adminEmail?: string;
  adminPassword?: string;
  includeTestData?: boolean;
}

/**
 * Default admin credentials
 * IMPORTANT: Change these in production!
 */
const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@minecraft-kids.de',
  password: 'admin123',
};

/**
 * Database seeder class
 */
export class DatabaseSeeder {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Hash a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Check if a user exists by username
   */
  private userExists(username: string): boolean {
    const stmt = this.db.prepare('SELECT id FROM Users WHERE username = ?');
    const result = stmt.get(username);
    return result !== undefined;
  }

  /**
   * Create a user
   */
  private async createUser(userData: CreateUserData): Promise<User> {
    const stmt = this.db.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(userData.username, userData.email, userData.password_hash, userData.role);

    const selectStmt = this.db.prepare('SELECT * FROM Users WHERE id = ?');
    const user = selectStmt.get(info.lastInsertRowid) as User;

    return user;
  }

  /**
   * Seed initial admin user
   */
  public async seedAdminUser(options?: SeedOptions): Promise<User | null> {
    const username = options?.adminUsername || DEFAULT_ADMIN_CREDENTIALS.username;
    const email = options?.adminEmail || DEFAULT_ADMIN_CREDENTIALS.email;
    const password = options?.adminPassword || DEFAULT_ADMIN_CREDENTIALS.password;

    if (this.userExists(username)) {
      console.log(`Admin user '${username}' already exists, skipping...`);
      return null;
    }

    console.log('Creating initial admin user...');

    const passwordHash = await this.hashPassword(password);

    const adminUser = await this.createUser({
      username,
      email,
      password_hash: passwordHash,
      role: 'admin',
    });

    console.log(`Admin user created successfully: ${username}`);
    console.log(`Email: ${email}`);
    console.log('IMPORTANT: Change the default password immediately!');

    return adminUser;
  }

  /**
   * Seed test data (for development only)
   */
  public async seedTestData(): Promise<void> {
    console.log('Seeding test data...');

    const testUsers = [
      {
        username: 'junior1',
        email: 'junior1@minecraft-kids.de',
        password: 'test123',
        role: 'junior-admin' as const,
      },
      {
        username: 'junior2',
        email: 'junior2@minecraft-kids.de',
        password: 'test123',
        role: 'junior-admin' as const,
      },
    ];

    for (const userData of testUsers) {
      if (!this.userExists(userData.username)) {
        const passwordHash = await this.hashPassword(userData.password);
        await this.createUser({
          username: userData.username,
          email: userData.email,
          password_hash: passwordHash,
          role: userData.role,
        });
        console.log(`Created test user: ${userData.username}`);
      }
    }

    const adminStmt = this.db.prepare('SELECT id FROM Users WHERE role = ? LIMIT 1');
    const admin = adminStmt.get('admin') as { id: number } | undefined;

    if (!admin) {
      console.log('No admin user found, skipping test instances');
      return;
    }

    const instanceExists = (name: string): boolean => {
      const stmt = this.db.prepare('SELECT id FROM Instances WHERE name = ?');
      const result = stmt.get(name);
      return result !== undefined;
    };

    const testInstances = [
      {
        name: 'survival',
        minecraft_version: '1.21.1',
        fabric_version: '0.16.14',
        server_port: 25565,
        rcon_port: 25575,
        rcon_password: 'minecraft',
        max_players: 20,
        memory_allocation: '4G',
      },
      {
        name: 'creative',
        minecraft_version: '1.21.1',
        fabric_version: '0.16.14',
        server_port: 25566,
        rcon_port: 25576,
        rcon_password: 'minecraft',
        max_players: 10,
        memory_allocation: '2G',
      },
    ];

    for (const instance of testInstances) {
      if (!instanceExists(instance.name)) {
        const stmt = this.db.prepare(`
          INSERT INTO Instances (
            name, minecraft_version, fabric_version, server_port,
            rcon_port, rcon_password, max_players, memory_allocation,
            status, created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          instance.name,
          instance.minecraft_version,
          instance.fabric_version,
          instance.server_port,
          instance.rcon_port,
          instance.rcon_password,
          instance.max_players,
          instance.memory_allocation,
          'stopped',
          admin.id
        );

        console.log(`Created test instance: ${instance.name}`);
      }
    }

    const templateExists = (name: string): boolean => {
      const stmt = this.db.prepare('SELECT id FROM SettingTemplates WHERE name = ?');
      const result = stmt.get(name);
      return result !== undefined;
    };

    const testTemplate = {
      name: 'Default Server',
      description: 'Default server configuration with common mods',
      minecraft_version: '1.21.1',
      fabric_version: '0.16.14',
      memory_allocation: '4G',
      max_players: 20,
      mods_config: JSON.stringify([
        { name: 'fabric-api', version: '0.100.0' },
        { name: 'simple-voice-chat', version: '2.5.20' },
      ]),
    };

    if (!templateExists(testTemplate.name)) {
      const stmt = this.db.prepare(`
        INSERT INTO SettingTemplates (
          name, description, minecraft_version, fabric_version,
          memory_allocation, max_players, mods_config, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        testTemplate.name,
        testTemplate.description,
        testTemplate.minecraft_version,
        testTemplate.fabric_version,
        testTemplate.memory_allocation,
        testTemplate.max_players,
        testTemplate.mods_config,
        admin.id
      );

      console.log(`Created test template: ${testTemplate.name}`);
    }

    const groupExists = (name: string): boolean => {
      const stmt = this.db.prepare('SELECT id FROM SharedUserGroups WHERE name = ?');
      const result = stmt.get(name);
      return result !== undefined;
    };

    const testGroup = {
      name: 'Kids Group',
      description: 'Default group for all kids',
      group_type: 'whitelist' as const,
      player_list: JSON.stringify(['player1', 'player2', 'player3']),
    };

    if (!groupExists(testGroup.name)) {
      const stmt = this.db.prepare(`
        INSERT INTO SharedUserGroups (
          name, description, group_type, player_list, created_by
        )
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        testGroup.name,
        testGroup.description,
        testGroup.group_type,
        testGroup.player_list,
        admin.id
      );

      console.log(`Created test shared user group: ${testGroup.name}`);
    }

    console.log('Test data seeding complete');
  }

  /**
   * Run complete seeding (admin + optional test data)
   */
  public async seed(options?: SeedOptions): Promise<void> {
    console.log('Starting database seeding...');

    await this.seedAdminUser(options);

    if (options?.includeTestData) {
      await this.seedTestData();
    }

    console.log('Database seeding complete');
  }

  /**
   * Clear all data from all tables (use with caution!)
   */
  public clearAllData(): void {
    console.warn('WARNING: Clearing all database data...');

    const tables = [
      'WhitelistRequests',
      'InstanceSharedGroups',
      'UserInstancePermissions',
      'SharedUserGroups',
      'SettingTemplates',
      'Instances',
      'Users',
    ];

    const clearTransaction = this.db.transaction(() => {
      for (const table of tables) {
        this.db.prepare(`DELETE FROM ${table}`).run();
        console.log(`Cleared table: ${table}`);
      }
    });

    clearTransaction();
    console.log('All data cleared');
  }
}

/**
 * Convenience function to seed database
 */
export async function seedDatabase(db: Database.Database, options?: SeedOptions): Promise<void> {
  const seeder = new DatabaseSeeder(db);
  await seeder.seed(options);
}

/**
 * Convenience function to seed admin user only
 */
export async function seedAdminUser(
  db: Database.Database,
  options?: SeedOptions
): Promise<User | null> {
  const seeder = new DatabaseSeeder(db);
  return seeder.seedAdminUser(options);
}

/**
 * Convenience function to seed test data
 */
export async function seedTestData(db: Database.Database): Promise<void> {
  const seeder = new DatabaseSeeder(db);
  await seeder.seedTestData();
}

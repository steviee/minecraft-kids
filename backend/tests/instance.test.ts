/**
 * Instance Service Tests
 * Comprehensive test suite for instance creation and management
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { DatabaseConnection } from '../src/database/db';
import { InstanceService, InstanceServiceError } from '../src/services/instance.service';
import { hashPassword } from '../src/services/auth.service';
import path from 'path';
import fs from 'fs';
import type { CreateInstanceRequest } from '../src/types/instance.types';

const TEST_DB_PATH = path.join(__dirname, 'test-instance.db');

let testDb: DatabaseConnection;
let instanceService: InstanceService;
let testAdminId: number;

// Mock Docker commands
vi.mock('child_process', () => ({
  execSync: vi.fn((command: string) => {
    if (command.includes('docker ps')) {
      return Buffer.from('');
    }
    if (command.includes('docker inspect')) {
      throw new Error('Container not found');
    }
    if (command.includes('docker run')) {
      return Buffer.from('container-id-12345');
    }
    if (command.includes('docker stop')) {
      return Buffer.from('');
    }
    if (command.includes('docker start')) {
      return Buffer.from('');
    }
    if (command.includes('docker rm')) {
      return Buffer.from('');
    }
    if (command.includes('docker logs')) {
      return Buffer.from('[Server thread/INFO]: Starting Minecraft server\n');
    }
    return Buffer.from('');
  }),
}));

beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  testDb = new DatabaseConnection({ filename: TEST_DB_PATH });
  testDb.initialize();
  await testDb.runSchema();

  // Create test admin user
  const passwordHash = await hashPassword('TestPassword123');
  const stmt = testDb.prepare(`
    INSERT INTO Users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run('testadmin', 'admin@test.com', passwordHash, 'admin');
  testAdminId = result.lastInsertRowid as number;

  instanceService = new InstanceService(testDb);
});

afterAll(() => {
  testDb.close();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

beforeEach(() => {
  testDb.exec('DELETE FROM Instances');
});

describe('Instance Creation - Basic', () => {
  it('should create an instance with required fields only', async () => {
    const request: CreateInstanceRequest = {
      name: 'test-server',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    const instance = await instanceService.createInstance(request, testAdminId);

    expect(instance).toBeDefined();
    expect(instance.id).toBeDefined();
    expect(instance.name).toBe('test-server');
    expect(instance.serverPort).toBe(25565);
    expect(instance.rconPort).toBe(25575);
    expect(instance.status).toBe('stopped');
    expect(instance.createdBy).toBe(testAdminId);
    expect(instance.containerId).toBeDefined();
  });

  it('should create an instance with optional fields', async () => {
    const request: CreateInstanceRequest = {
      name: 'test-server-full',
      minecraftVersion: '1.20.4',
      fabricVersion: '0.15.0',
      serverPort: 25566,
      rconPort: 25576,
      rconPassword: 'test-password',
      voiceChatPort: 24454,
      geyserEnabled: true,
      geyserPort: 19132,
      maxPlayers: 30,
      memoryAllocation: '4G',
    };

    const instance = await instanceService.createInstance(request, testAdminId);

    expect(instance).toBeDefined();
    expect(instance.name).toBe('test-server-full');
    expect(instance.minecraftVersion).toBe('1.20.4');
    expect(instance.fabricVersion).toBe('0.15.0');
    expect(instance.voiceChatPort).toBe(24454);
    expect(instance.geyserEnabled).toBe(true);
    expect(instance.geyserPort).toBe(19132);
    expect(instance.maxPlayers).toBe(30);
    expect(instance.memoryAllocation).toBe('4G');
  });

  it('should enforce name immutability by storing in database', async () => {
    const request: CreateInstanceRequest = {
      name: 'immutable-name',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    const instance = await instanceService.createInstance(request, testAdminId);

    // Verify name is stored in database
    const dbInstance = testDb
      .prepare('SELECT name FROM Instances WHERE id = ?')
      .get(instance.id) as { name: string };

    expect(dbInstance.name).toBe('immutable-name');
  });
});

describe('Instance Creation - Validation', () => {
  it('should reject duplicate instance names', async () => {
    const request: CreateInstanceRequest = {
      name: 'duplicate-server',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    await instanceService.createInstance(request, testAdminId);

    const request2: CreateInstanceRequest = {
      ...request,
      serverPort: 25566,
      rconPort: 25576,
    };

    await expect(instanceService.createInstance(request2, testAdminId)).rejects.toThrow(
      InstanceServiceError
    );
  });

  it('should reject duplicate server ports', async () => {
    const request1: CreateInstanceRequest = {
      name: 'server1',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    await instanceService.createInstance(request1, testAdminId);

    const request2: CreateInstanceRequest = {
      name: 'server2',
      serverPort: 25565, // Duplicate port
      rconPort: 25576,
      rconPassword: 'test-password',
    };

    await expect(instanceService.createInstance(request2, testAdminId)).rejects.toThrow(
      InstanceServiceError
    );
  });

  it('should reject duplicate RCON ports', async () => {
    const request1: CreateInstanceRequest = {
      name: 'server1',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    await instanceService.createInstance(request1, testAdminId);

    const request2: CreateInstanceRequest = {
      name: 'server2',
      serverPort: 25566,
      rconPort: 25575, // Duplicate port
      rconPassword: 'test-password',
    };

    await expect(instanceService.createInstance(request2, testAdminId)).rejects.toThrow(
      InstanceServiceError
    );
  });

  it('should reject invalid instance names', async () => {
    const invalidNames = [
      'ab', // Too short
      'server_with_underscore', // Invalid character
      'Server-With-Capitals', // Uppercase
      'server with spaces', // Spaces
      '-starts-with-dash', // Starts with dash
      'ends-with-dash-', // Ends with dash
      'a'.repeat(33), // Too long
    ];

    for (const name of invalidNames) {
      const request: CreateInstanceRequest = {
        name,
        serverPort: 25565,
        rconPort: 25575,
        rconPassword: 'test-password',
      };

      await expect(instanceService.createInstance(request, testAdminId)).rejects.toThrow();
    }
  });

  it('should reject non-existent creator user', async () => {
    const request: CreateInstanceRequest = {
      name: 'test-server',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    await expect(instanceService.createInstance(request, 99999)).rejects.toThrow();
  });
});

describe('Instance Creation - Port Management', () => {
  it('should track used ports correctly', async () => {
    const request1: CreateInstanceRequest = {
      name: 'server1',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
      voiceChatPort: 24454,
    };

    const request2: CreateInstanceRequest = {
      name: 'server2',
      serverPort: 25566,
      rconPort: 25576,
      rconPassword: 'test-password',
      geyserEnabled: true,
      geyserPort: 19132,
    };

    await instanceService.createInstance(request1, testAdminId);
    await instanceService.createInstance(request2, testAdminId);

    const usedPorts = (instanceService as any).getUsedPorts();

    expect(usedPorts.serverPorts).toContain(25565);
    expect(usedPorts.serverPorts).toContain(25566);
    expect(usedPorts.rconPorts).toContain(25575);
    expect(usedPorts.rconPorts).toContain(25576);
    expect(usedPorts.voiceChatPorts).toContain(24454);
    expect(usedPorts.geyserPorts).toContain(19132);
  });

  it('should allow same voice chat port for different instances', async () => {
    // Voice chat ports can be shared
    const request1: CreateInstanceRequest = {
      name: 'server1',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
      voiceChatPort: 24454,
    };

    const request2: CreateInstanceRequest = {
      name: 'server2',
      serverPort: 25566,
      rconPort: 25576,
      rconPassword: 'test-password',
      voiceChatPort: 24454, // Same voice chat port
    };

    const instance1 = await instanceService.createInstance(request1, testAdminId);
    const instance2 = await instanceService.createInstance(request2, testAdminId);

    expect(instance1).toBeDefined();
    expect(instance2).toBeDefined();
    expect(instance2.voiceChatPort).toBe(24454);
  });
});

describe('Instance Creation - Transaction Handling', () => {
  it('should rollback database on container creation failure', async () => {
    // Mock docker run to fail
    vi.doMock('child_process', () => ({
      execSync: vi.fn(() => {
        throw new Error('Docker daemon not running');
      }),
    }));

    const request: CreateInstanceRequest = {
      name: 'failing-server',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    await expect(instanceService.createInstance(request, testAdminId)).rejects.toThrow();

    // Verify no database entry was created
    const instance = testDb
      .prepare('SELECT * FROM Instances WHERE name = ?')
      .get('failing-server');

    expect(instance).toBeUndefined();
  });
});

describe('Instance Retrieval', () => {
  beforeEach(async () => {
    // Create multiple test instances
    await instanceService.createInstance(
      {
        name: 'server1',
        serverPort: 25565,
        rconPort: 25575,
        rconPassword: 'test-password',
      },
      testAdminId
    );

    await instanceService.createInstance(
      {
        name: 'server2',
        serverPort: 25566,
        rconPort: 25576,
        rconPassword: 'test-password',
      },
      testAdminId
    );
  });

  it('should retrieve instance by ID', () => {
    const instances = instanceService.getAllInstances(testAdminId, 'admin');
    const instance = instanceService.getInstanceById(instances[0].id);

    expect(instance).toBeDefined();
    expect(instance?.name).toBe(instances[0].name);
  });

  it('should return null for non-existent instance', () => {
    const instance = instanceService.getInstanceById(99999);

    expect(instance).toBeNull();
  });

  it('should list all instances for admin', () => {
    const instances = instanceService.getAllInstances(testAdminId, 'admin');

    expect(instances).toBeDefined();
    expect(instances.length).toBe(2);
  });
});

describe('Instance Update', () => {
  let instanceId: number;

  beforeEach(async () => {
    const instance = await instanceService.createInstance(
      {
        name: 'updateable-server',
        serverPort: 25565,
        rconPort: 25575,
        rconPassword: 'test-password',
        maxPlayers: 20,
      },
      testAdminId
    );
    instanceId = instance.id;
  });

  it('should update instance configuration', async () => {
    const updateRequest = {
      maxPlayers: 30,
      memoryAllocation: '4G',
      minecraftVersion: '1.20.4',
    };

    const updated = await instanceService.updateInstance(instanceId, updateRequest);

    expect(updated.maxPlayers).toBe(30);
    expect(updated.memoryAllocation).toBe('4G');
    expect(updated.minecraftVersion).toBe('1.20.4');
  });

  it('should not allow name updates', async () => {
    // Name is immutable - update should ignore name field
    const updateRequest = {
      name: 'new-name', // This should be ignored
      maxPlayers: 30,
    } as any;

    const updated = await instanceService.updateInstance(instanceId, updateRequest);

    expect(updated.name).toBe('updateable-server'); // Original name preserved
  });

  it('should throw error for non-existent instance', async () => {
    await expect(
      instanceService.updateInstance(99999, { maxPlayers: 30 })
    ).rejects.toThrow(InstanceServiceError);
  });
});

describe('Instance Deletion', () => {
  let instanceId: number;

  beforeEach(async () => {
    const instance = await instanceService.createInstance(
      {
        name: 'deletable-server',
        serverPort: 25565,
        rconPort: 25575,
        rconPassword: 'test-password',
      },
      testAdminId
    );
    instanceId = instance.id;
  });

  it('should delete instance and container', async () => {
    await instanceService.deleteInstance(instanceId);

    const instance = instanceService.getInstanceById(instanceId);
    expect(instance).toBeNull();
  });

  it('should throw error when deleting non-existent instance', async () => {
    await expect(instanceService.deleteInstance(99999)).rejects.toThrow(InstanceServiceError);
  });
});

describe('Instance Lifecycle Operations', () => {
  let instanceId: number;

  beforeEach(async () => {
    const instance = await instanceService.createInstance(
      {
        name: 'lifecycle-server',
        serverPort: 25565,
        rconPort: 25575,
        rconPassword: 'test-password',
      },
      testAdminId
    );
    instanceId = instance.id;
  });

  it('should start a stopped instance', async () => {
    const result = await instanceService.startInstance(instanceId);

    expect(result.success).toBe(true);
    expect(result.message).toContain('started');
  });

  it('should stop a running instance', async () => {
    await instanceService.startInstance(instanceId);
    const result = await instanceService.stopInstance(instanceId);

    expect(result.success).toBe(true);
    expect(result.message).toContain('stopped');
  });

  it('should restart an instance', async () => {
    await instanceService.startInstance(instanceId);
    const result = await instanceService.restartInstance(instanceId);

    expect(result.success).toBe(true);
    expect(result.message).toContain('restarted');
  });

  it('should retrieve instance logs', async () => {
    await instanceService.startInstance(instanceId);
    const logs = await instanceService.getInstanceLogs(instanceId, 100);

    expect(logs).toBeDefined();
    expect(typeof logs).toBe('string');
  });
});

describe('Instance Creation - Default Values', () => {
  it('should use default values for optional fields', async () => {
    const request: CreateInstanceRequest = {
      name: 'default-server',
      serverPort: 25565,
      rconPort: 25575,
      rconPassword: 'test-password',
    };

    const instance = await instanceService.createInstance(request, testAdminId);

    expect(instance.maxPlayers).toBe(20); // Default
    expect(instance.memoryAllocation).toBe('2G'); // Default
    expect(instance.geyserEnabled).toBe(false); // Default
    expect(instance.minecraftVersion).toBeNull(); // Not specified
    expect(instance.fabricVersion).toBeNull(); // Not specified
  });
});

/**
 * Integration tests for DockerService
 * Requires Docker daemon to be running
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DockerService, dockerService } from '../src/services/docker.service';
import { DockerServiceError } from '../src/types/docker.types';

describe('DockerService Integration Tests', () => {
  let dockerAvailable = false;
  const testInstanceName = 'test-integration';
  const testConfig = {
    name: testInstanceName,
    minecraftVersion: '1.20.4',
    serverPort: 25599,
    rconPort: 25598,
    rconPassword: 'test-rcon-password',
    maxPlayers: 10,
    memoryAllocation: '1G',
    createdBy: 1,
  };

  beforeAll(async () => {
    // Check if Docker is available
    dockerAvailable = await dockerService.ping();
    if (!dockerAvailable) {
      console.warn('Docker is not available, skipping integration tests');
    }
  });

  afterAll(async () => {
    // Clean up test container if it exists
    if (dockerAvailable) {
      try {
        await dockerService.deleteContainer(testInstanceName, true);
      } catch {
        // Container might not exist, that's ok
      }
    }
  });

  describe('Constructor and initialization', () => {
    it('should create DockerService instance', () => {
      const service = new DockerService();
      expect(service).toBeInstanceOf(DockerService);
    });

    it('should have singleton instance available', () => {
      expect(dockerService).toBeInstanceOf(DockerService);
    });
  });

  describe('ping()', () => {
    it('should check if Docker daemon is accessible', async () => {
      const result = await dockerService.ping();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Container operations', () => {
    it.skipIf(!dockerAvailable)('should create a Minecraft container', async () => {
      const result = await dockerService.createInstance(testConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('created successfully');
      expect(result.containerId).toBeDefined();
      expect(result.containerId).toMatch(/^[a-f0-9]+$/);
    });

    it.skipIf(!dockerAvailable)('should fail to create duplicate container', async () => {
      // Container should already exist from previous test
      await expect(dockerService.createInstance(testConfig)).rejects.toThrow(DockerServiceError);
      await expect(dockerService.createInstance(testConfig)).rejects.toThrow('already exists');
    });

    it.skipIf(!dockerAvailable)('should get container information', async () => {
      const info = await dockerService.getContainerInfo(testInstanceName);

      expect(info).toBeDefined();
      expect(info?.name).toBe(testInstanceName);
      expect(info?.status).toBe('stopped'); // Container starts stopped
      expect(info?.ports.server).toBe(testConfig.serverPort);
      expect(info?.ports.rcon).toBe(testConfig.rconPort);
    });

    it.skipIf(!dockerAvailable)('should list all managed containers', async () => {
      const containers = await dockerService.listContainers();

      expect(Array.isArray(containers)).toBe(true);
      const testContainer = containers.find((c) => c.name === testInstanceName);
      expect(testContainer).toBeDefined();
    });

    it.skipIf(!dockerAvailable)('should start container', async () => {
      const result = await dockerService.startContainer(testInstanceName);

      expect(result.success).toBe(true);
      expect(result.message).toContain('started successfully');

      // Wait a bit for container to fully start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const info = await dockerService.getContainerInfo(testInstanceName);
      expect(info?.status).toBe('running');
    });

    it.skipIf(!dockerAvailable)('should get container logs', async () => {
      // Wait a bit for logs to be generated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const logs = await dockerService.getLogs(testInstanceName, { tail: 50 });

      expect(typeof logs).toBe('string');
      expect(logs.length).toBeGreaterThan(0);
    });

    it.skipIf(!dockerAvailable)('should restart container', async () => {
      const result = await dockerService.restartContainer(testInstanceName);

      expect(result.success).toBe(true);
      expect(result.message).toContain('restarted successfully');
    });

    it.skipIf(!dockerAvailable)('should stop container', async () => {
      const result = await dockerService.stopContainer(testInstanceName);

      expect(result.success).toBe(true);
      expect(result.message).toContain('stopped successfully');

      // Wait a bit for container to fully stop
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const info = await dockerService.getContainerInfo(testInstanceName);
      expect(info?.status).toBe('stopped');
    });

    it.skipIf(!dockerAvailable)('should fail to start already running container', async () => {
      // Start the container first
      await dockerService.startContainer(testInstanceName);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to start again
      const result = await dockerService.startContainer(testInstanceName);
      expect(result.success).toBe(false);
      expect(result.message).toContain('already running');

      // Stop it again for cleanup
      await dockerService.stopContainer(testInstanceName);
    });

    it.skipIf(!dockerAvailable)('should fail to stop already stopped container', async () => {
      // Make sure container is stopped
      try {
        await dockerService.stopContainer(testInstanceName);
      } catch {
        // Already stopped
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to stop again
      const result = await dockerService.stopContainer(testInstanceName);
      expect(result.success).toBe(false);
      expect(result.message).toContain('not running');
    });

    it.skipIf(!dockerAvailable)('should delete container and volume', async () => {
      const result = await dockerService.deleteContainer(testInstanceName, true);

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');

      // Verify container no longer exists
      const info = await dockerService.getContainerInfo(testInstanceName);
      expect(info).toBeNull();
    });

    it.skipIf(!dockerAvailable)('should fail operations on non-existent container', async () => {
      // Container was deleted in previous test
      await expect(dockerService.startContainer('nonexistent')).rejects.toThrow(DockerServiceError);
      await expect(dockerService.stopContainer('nonexistent')).rejects.toThrow(DockerServiceError);
      await expect(dockerService.getLogs('nonexistent')).rejects.toThrow(DockerServiceError);
    });
  });

  describe('Container configuration', () => {
    it.skipIf(!dockerAvailable)('should create container with custom memory allocation', async () => {
      const customConfig = {
        ...testConfig,
        name: `${testInstanceName}-memory`,
        serverPort: 25597,
        rconPort: 25596,
        memoryAllocation: '512M',
      };

      const result = await dockerService.createInstance(customConfig);
      expect(result.success).toBe(true);

      // Cleanup
      await dockerService.deleteContainer(customConfig.name, true);
    });

    it.skipIf(!dockerAvailable)('should create container with Geyser enabled', async () => {
      const geyserConfig = {
        ...testConfig,
        name: `${testInstanceName}-geyser`,
        serverPort: 25595,
        rconPort: 25594,
        geyserEnabled: true,
        geyserPort: 19132,
      };

      const result = await dockerService.createInstance(geyserConfig);
      expect(result.success).toBe(true);

      // Cleanup
      await dockerService.deleteContainer(geyserConfig.name, true);
    });

    it.skipIf(!dockerAvailable)('should create container with voice chat port', async () => {
      const voiceChatConfig = {
        ...testConfig,
        name: `${testInstanceName}-voice`,
        serverPort: 25593,
        rconPort: 25592,
        voiceChatPort: 24454,
      };

      const result = await dockerService.createInstance(voiceChatConfig);
      expect(result.success).toBe(true);

      // Cleanup
      await dockerService.deleteContainer(voiceChatConfig.name, true);
    });
  });

  describe('Error handling', () => {
    it('should throw DockerServiceError with proper structure', async () => {
      try {
        await dockerService.startContainer('invalid-container-name');
      } catch (error) {
        expect(error).toBeInstanceOf(DockerServiceError);
        expect((error as DockerServiceError).code).toBeDefined();
        expect((error as DockerServiceError).message).toBeDefined();
      }
    });
  });
});

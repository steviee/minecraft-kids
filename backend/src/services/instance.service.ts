/**
 * Instance Service - Manages Minecraft server instances
 * Bridges Docker container management with database persistence
 * Minecraft Kids Server Management Suite
 */

import type Database from 'better-sqlite3';
import { getDatabase } from '../database/db';
import { dockerService } from './docker.service';
import { minecraftVersionsService } from './minecraft-versions.service';
import {
  InstanceRecord,
  InstanceData,
  CreateInstanceRequest,
  UpdateInstanceRequest,
  instanceRecordToData,
} from '../types/instance.types';
import { DockerServiceError, ContainerOperationResult } from '../types/docker.types';

/**
 * Custom error class for Instance operations
 */
export class InstanceServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'InstanceServiceError';
  }
}

/**
 * InstanceService handles all instance-related operations
 */
export class InstanceService {
  private _db?: Database.Database;

  constructor(db?: Database.Database) {
    this._db = db;
  }

  /**
   * Get database instance (lazy loading)
   */
  private get db(): Database.Database {
    if (!this._db) {
      this._db = getDatabase();
    }
    return this._db;
  }

  /**
   * Find available port in a range
   * TODO: Use for automatic port allocation feature
   */
  // private findAvailablePort(startPort: number, endPort: number, usedPorts: number[]): number {
  //   for (let port = startPort; port <= endPort; port++) {
  //     if (!usedPorts.includes(port)) {
  //       return port;
  //     }
  //   }
  //   throw new InstanceServiceError(
  //     `No available ports in range ${startPort}-${endPort}`,
  //     'NO_AVAILABLE_PORT',
  //     500
  //   );
  // }

  /**
   * Get all used ports from database
   */
  private getUsedPorts(): {
    serverPorts: number[];
    rconPorts: number[];
    voiceChatPorts: number[];
    geyserPorts: number[];
  } {
    const instances = this.db
      .prepare(
        `SELECT server_port, rcon_port, voice_chat_port, geyser_port
         FROM Instances`
      )
      .all() as Array<{
      server_port: number;
      rcon_port: number;
      voice_chat_port: number | null;
      geyser_port: number | null;
    }>;

    return {
      serverPorts: instances.map((i) => i.server_port),
      rconPorts: instances.map((i) => i.rcon_port),
      voiceChatPorts: instances
        .map((i) => i.voice_chat_port)
        .filter((p): p is number => p !== null),
      geyserPorts: instances.map((i) => i.geyser_port).filter((p): p is number => p !== null),
    };
  }

  /**
   * Validate port availability
   */
  private validatePorts(request: CreateInstanceRequest): void {
    const usedPorts = this.getUsedPorts();

    if (usedPorts.serverPorts.includes(request.serverPort)) {
      throw new InstanceServiceError(
        `Server port ${request.serverPort} is already in use`,
        'PORT_IN_USE',
        400
      );
    }

    if (usedPorts.rconPorts.includes(request.rconPort)) {
      throw new InstanceServiceError(
        `RCON port ${request.rconPort} is already in use`,
        'PORT_IN_USE',
        400
      );
    }

    if (request.voiceChatPort && usedPorts.voiceChatPorts.includes(request.voiceChatPort)) {
      throw new InstanceServiceError(
        `Voice chat port ${request.voiceChatPort} is already in use`,
        'PORT_IN_USE',
        400
      );
    }

    if (request.geyserPort && usedPorts.geyserPorts.includes(request.geyserPort)) {
      throw new InstanceServiceError(
        `Geyser port ${request.geyserPort} is already in use`,
        'PORT_IN_USE',
        400
      );
    }
  }

  /**
   * Validate instance name
   */
  private validateInstanceName(name: string): void {
    // Name must be DNS-compliant (lowercase, alphanumeric, hyphens)
    const dnsPattern = /^[a-z0-9-]+$/;
    if (!dnsPattern.test(name)) {
      throw new InstanceServiceError(
        'Instance name must contain only lowercase letters, numbers, and hyphens',
        'INVALID_NAME',
        400
      );
    }

    if (name.length < 3 || name.length > 32) {
      throw new InstanceServiceError(
        'Instance name must be between 3 and 32 characters',
        'INVALID_NAME',
        400
      );
    }

    if (name.startsWith('-') || name.endsWith('-')) {
      throw new InstanceServiceError(
        'Instance name cannot start or end with a hyphen',
        'INVALID_NAME',
        400
      );
    }

    // Check if name already exists
    const existing = this.db.prepare('SELECT id FROM Instances WHERE name = ?').get(name);
    if (existing) {
      throw new InstanceServiceError(
        `Instance with name '${name}' already exists`,
        'NAME_EXISTS',
        409
      );
    }
  }

  /**
   * Validate Minecraft and Fabric versions
   */
  private async validateVersions(request: CreateInstanceRequest): Promise<void> {
    // Validate Minecraft version if provided
    if (request.minecraftVersion) {
      const isValidMinecraft = await minecraftVersionsService.isValidMinecraftVersion(
        request.minecraftVersion
      );
      if (!isValidMinecraft) {
        throw new InstanceServiceError(
          `Invalid Minecraft version: ${request.minecraftVersion}`,
          'INVALID_MINECRAFT_VERSION',
          400
        );
      }
    }

    // Validate Fabric version if provided
    if (request.fabricVersion) {
      const isValidFabric = await minecraftVersionsService.isValidFabricVersion(
        request.fabricVersion
      );
      if (!isValidFabric) {
        throw new InstanceServiceError(
          `Invalid Fabric version: ${request.fabricVersion}`,
          'INVALID_FABRIC_VERSION',
          400
        );
      }
    }
  }

  /**
   * Create a new instance with transaction support for atomicity
   */
  async createInstance(request: CreateInstanceRequest, createdBy: number): Promise<InstanceData> {
    let containerResult: ContainerOperationResult | null = null;

    try {
      // Validate inputs first (before any side effects)
      this.validateInstanceName(request.name);
      this.validatePorts(request);
      await this.validateVersions(request);

      // Create Docker container
      containerResult = await dockerService.createInstance({
        ...request,
        createdBy,
      });

      if (!containerResult.success || !containerResult.containerId) {
        throw new InstanceServiceError(
          `Failed to create container: ${containerResult.message}`,
          'CONTAINER_CREATE_FAILED',
          500
        );
      }

      // Use transaction for database operations
      // If any database operation fails, the transaction will rollback automatically
      const createTransaction = this.db.transaction(() => {
        // Insert into database
        const insert = this.db.prepare(`
          INSERT INTO Instances (
            name, minecraft_version, fabric_version,
            server_port, rcon_port, rcon_password,
            voice_chat_port, geyser_enabled, geyser_port,
            max_players, memory_allocation, status,
            container_id, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insert.run(
          request.name,
          request.minecraftVersion || null,
          request.fabricVersion || null,
          request.serverPort,
          request.rconPort,
          request.rconPassword,
          request.voiceChatPort || null,
          request.geyserEnabled ? 1 : 0,
          request.geyserPort || null,
          request.maxPlayers || 20,
          request.memoryAllocation || '2G',
          'stopped',
          containerResult!.containerId,
          createdBy
        );

        const instanceId = result.lastInsertRowid as number;

        // Assign Junior-Admins if specified
        if (request.assignedJuniorAdmins && request.assignedJuniorAdmins.length > 0) {
          const assignStmt = this.db.prepare(`
            INSERT INTO UserInstancePermissions (user_id, instance_id, granted_by)
            VALUES (?, ?, ?)
          `);

          for (const juniorAdminId of request.assignedJuniorAdmins) {
            assignStmt.run(juniorAdminId, instanceId, createdBy);
          }
        }

        return instanceId;
      });

      // Execute transaction
      const instanceId = createTransaction();

      // Fetch and return the created instance
      const instance = this.getInstanceById(instanceId);
      if (!instance) {
        throw new InstanceServiceError('Failed to retrieve created instance', 'CREATE_FAILED', 500);
      }

      return instance;
    } catch (error) {
      // If database operations failed and we created a container, clean it up
      if (containerResult?.containerId) {
        try {
          console.error(
            `Database operation failed, cleaning up container ${containerResult.containerId}`
          );
          await dockerService.deleteContainer(request.name, true);
        } catch (cleanupError) {
          console.error('Failed to clean up container after database error:', cleanupError);
        }
      }

      // Re-throw the original error
      if (error instanceof InstanceServiceError) {
        throw error;
      }
      if (error instanceof DockerServiceError) {
        throw new InstanceServiceError(
          `Docker error: ${error.message}`,
          'DOCKER_ERROR',
          500,
          error
        );
      }
      throw new InstanceServiceError(
        `Failed to create instance: ${(error as Error).message}`,
        'CREATE_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get all instances (with optional filtering for Junior-Admins)
   */
  getAllInstances(userId?: number, userRole?: string): InstanceData[] {
    try {
      let query: string;
      let params: unknown[];

      if (userRole === 'admin' || !userId) {
        // Admin sees all instances
        query = 'SELECT * FROM Instances ORDER BY created_at DESC';
        params = [];
      } else {
        // Junior-Admin sees only assigned instances
        query = `
          SELECT i.* FROM Instances i
          INNER JOIN UserInstancePermissions uip ON i.id = uip.instance_id
          WHERE uip.user_id = ?
          ORDER BY i.created_at DESC
        `;
        params = [userId];
      }

      const instances = this.db.prepare(query).all(...params) as InstanceRecord[];
      return instances.map(instanceRecordToData);
    } catch (error) {
      throw new InstanceServiceError(
        `Failed to fetch instances: ${(error as Error).message}`,
        'FETCH_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get instance by ID
   */
  getInstanceById(id: number): InstanceData | null {
    try {
      const instance = this.db.prepare('SELECT * FROM Instances WHERE id = ?').get(id) as
        | InstanceRecord
        | undefined;

      return instance ? instanceRecordToData(instance) : null;
    } catch (error) {
      throw new InstanceServiceError(
        `Failed to fetch instance: ${(error as Error).message}`,
        'FETCH_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get instance by name
   */
  getInstanceByName(name: string): InstanceData | null {
    try {
      const instance = this.db.prepare('SELECT * FROM Instances WHERE name = ?').get(name) as
        | InstanceRecord
        | undefined;

      return instance ? instanceRecordToData(instance) : null;
    } catch (error) {
      throw new InstanceServiceError(
        `Failed to fetch instance: ${(error as Error).message}`,
        'FETCH_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Update an instance (name is immutable)
   */
  async updateInstance(id: number, request: UpdateInstanceRequest): Promise<InstanceData> {
    try {
      const instance = this.getInstanceById(id);
      if (!instance) {
        throw new InstanceServiceError(`Instance with ID ${id} not found`, 'NOT_FOUND', 404);
      }

      // Build update query dynamically based on provided fields
      const updates: string[] = [];
      const params: unknown[] = [];

      if (request.minecraftVersion !== undefined) {
        updates.push('minecraft_version = ?');
        params.push(request.minecraftVersion);
      }
      if (request.fabricVersion !== undefined) {
        updates.push('fabric_version = ?');
        params.push(request.fabricVersion);
      }
      if (request.voiceChatPort !== undefined) {
        updates.push('voice_chat_port = ?');
        params.push(request.voiceChatPort);
      }
      if (request.geyserEnabled !== undefined) {
        updates.push('geyser_enabled = ?');
        params.push(request.geyserEnabled ? 1 : 0);
      }
      if (request.geyserPort !== undefined) {
        updates.push('geyser_port = ?');
        params.push(request.geyserPort);
      }
      if (request.maxPlayers !== undefined) {
        updates.push('max_players = ?');
        params.push(request.maxPlayers);
      }
      if (request.memoryAllocation !== undefined) {
        updates.push('memory_allocation = ?');
        params.push(request.memoryAllocation);
      }

      if (updates.length === 0) {
        // No updates provided, return current instance
        return instance;
      }

      // Add ID to params
      params.push(id);

      // Execute update
      const updateQuery = `UPDATE Instances SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(updateQuery).run(...params);

      // Return updated instance
      const updated = this.getInstanceById(id);
      if (!updated) {
        throw new InstanceServiceError('Failed to retrieve updated instance', 'UPDATE_FAILED', 500);
      }

      return updated;
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        throw error;
      }
      throw new InstanceServiceError(
        `Failed to update instance: ${(error as Error).message}`,
        'UPDATE_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Delete an instance
   */
  async deleteInstance(id: number): Promise<void> {
    try {
      const instance = this.getInstanceById(id);
      if (!instance) {
        throw new InstanceServiceError(`Instance with ID ${id} not found`, 'NOT_FOUND', 404);
      }

      // Delete Docker container first
      try {
        await dockerService.deleteContainer(instance.name, true);
      } catch (dockerError) {
        // Log but don't fail if container doesn't exist
        console.warn(`Failed to delete container for instance ${instance.name}:`, dockerError);
      }

      // Delete from database (cascade will handle permissions)
      this.db.prepare('DELETE FROM Instances WHERE id = ?').run(id);
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        throw error;
      }
      throw new InstanceServiceError(
        `Failed to delete instance: ${(error as Error).message}`,
        'DELETE_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Start an instance
   */
  async startInstance(id: number): Promise<ContainerOperationResult> {
    try {
      const instance = this.getInstanceById(id);
      if (!instance) {
        throw new InstanceServiceError(`Instance with ID ${id} not found`, 'NOT_FOUND', 404);
      }

      // Start container
      const result = await dockerService.startContainer(instance.name);

      // Update status in database
      if (result.success) {
        this.db.prepare("UPDATE Instances SET status = 'running' WHERE id = ?").run(id);
      }

      return result;
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        throw error;
      }
      if (error instanceof DockerServiceError) {
        throw new InstanceServiceError(
          `Docker error: ${error.message}`,
          'DOCKER_ERROR',
          500,
          error
        );
      }
      throw new InstanceServiceError(
        `Failed to start instance: ${(error as Error).message}`,
        'START_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Stop an instance
   */
  async stopInstance(id: number): Promise<ContainerOperationResult> {
    try {
      const instance = this.getInstanceById(id);
      if (!instance) {
        throw new InstanceServiceError(`Instance with ID ${id} not found`, 'NOT_FOUND', 404);
      }

      // Stop container
      const result = await dockerService.stopContainer(instance.name);

      // Update status in database
      if (result.success) {
        this.db.prepare("UPDATE Instances SET status = 'stopped' WHERE id = ?").run(id);
      }

      return result;
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        throw error;
      }
      if (error instanceof DockerServiceError) {
        throw new InstanceServiceError(
          `Docker error: ${error.message}`,
          'DOCKER_ERROR',
          500,
          error
        );
      }
      throw new InstanceServiceError(
        `Failed to stop instance: ${(error as Error).message}`,
        'STOP_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Restart an instance
   */
  async restartInstance(id: number): Promise<ContainerOperationResult> {
    try {
      const instance = this.getInstanceById(id);
      if (!instance) {
        throw new InstanceServiceError(`Instance with ID ${id} not found`, 'NOT_FOUND', 404);
      }

      // Restart container
      const result = await dockerService.restartContainer(instance.name);

      // Update status in database
      if (result.success) {
        this.db.prepare("UPDATE Instances SET status = 'running' WHERE id = ?").run(id);
      }

      return result;
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        throw error;
      }
      if (error instanceof DockerServiceError) {
        throw new InstanceServiceError(
          `Docker error: ${error.message}`,
          'DOCKER_ERROR',
          500,
          error
        );
      }
      throw new InstanceServiceError(
        `Failed to restart instance: ${(error as Error).message}`,
        'RESTART_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get instance logs
   */
  async getInstanceLogs(id: number, tail = 100): Promise<string> {
    try {
      const instance = this.getInstanceById(id);
      if (!instance) {
        throw new InstanceServiceError(`Instance with ID ${id} not found`, 'NOT_FOUND', 404);
      }

      return await dockerService.getLogs(instance.name, { tail });
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        throw error;
      }
      if (error instanceof DockerServiceError) {
        throw new InstanceServiceError(
          `Docker error: ${error.message}`,
          'DOCKER_ERROR',
          500,
          error
        );
      }
      throw new InstanceServiceError(
        `Failed to get logs: ${(error as Error).message}`,
        'LOGS_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Check if user has access to instance
   */
  hasInstanceAccess(userId: number, instanceId: number, userRole: string): boolean {
    // Admins always have access
    if (userRole === 'admin') {
      return true;
    }

    // Junior-Admins need explicit permission
    const permission = this.db
      .prepare(
        `SELECT 1 FROM UserInstancePermissions
         WHERE user_id = ? AND instance_id = ?`
      )
      .get(userId, instanceId);

    return permission !== undefined;
  }

  /**
   * Get instance RCON password (for internal use only)
   */
  getInstanceRconPassword(id: number): string | null {
    try {
      const result = this.db.prepare('SELECT rcon_password FROM Instances WHERE id = ?').get(id) as
        | { rcon_password: string }
        | undefined;

      return result?.rcon_password || null;
    } catch (error) {
      throw new InstanceServiceError(
        `Failed to fetch RCON password: ${(error as Error).message}`,
        'FETCH_FAILED',
        500,
        error
      );
    }
  }
}

// Export singleton instance
export const instanceService = new InstanceService();

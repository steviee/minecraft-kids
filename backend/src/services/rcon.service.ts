/**
 * RCON Service - Manages RCON connections to Minecraft servers
 * Minecraft Kids Server Management Suite
 */

import { RCON } from 'minecraft-server-util';

/**
 * Custom error class for RCON operations
 */
export class RconServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'RconServiceError';
  }
}

/**
 * RCON connection pool entry
 */
interface RconConnection {
  client: RCON;
  lastUsed: Date;
  instanceId: number;
}

/**
 * RconService handles RCON connections and command execution
 */
export class RconService {
  private connections: Map<number, RconConnection> = new Map();
  private connectionTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get or create RCON connection for an instance
   */
  private async getConnection(
    instanceId: number,
    host: string,
    port: number,
    password: string
  ): Promise<RCON> {
    // Check if we have an existing connection
    const existing = this.connections.get(instanceId);
    if (existing) {
      // Update last used timestamp
      existing.lastUsed = new Date();
      return existing.client;
    }

    // Create new connection
    try {
      const client = new RCON();
      await client.connect(host, port, { timeout: 5000 });
      await client.login(password);

      this.connections.set(instanceId, {
        client,
        lastUsed: new Date(),
        instanceId,
      });

      return client;
    } catch (error) {
      throw new RconServiceError(
        `Failed to connect to RCON: ${(error as Error).message}`,
        'RCON_CONNECT_FAILED',
        error
      );
    }
  }

  /**
   * Execute RCON command on an instance
   */
  async executeCommand(
    instanceId: number,
    command: string,
    host: string,
    port: number,
    password: string
  ): Promise<string> {
    try {
      const client = await this.getConnection(instanceId, host, port, password);
      const response = await client.execute(command);
      return response;
    } catch (error) {
      if (error instanceof RconServiceError) {
        throw error;
      }
      throw new RconServiceError(
        `Failed to execute RCON command: ${(error as Error).message}`,
        'RCON_COMMAND_FAILED',
        error
      );
    }
  }

  /**
   * Close RCON connection for an instance
   */
  async closeConnection(instanceId: number): Promise<void> {
    const connection = this.connections.get(instanceId);
    if (connection) {
      try {
        await connection.client.close();
      } catch (error) {
        console.warn(`Failed to close RCON connection for instance ${instanceId}:`, error);
      }
      this.connections.delete(instanceId);
    }
  }

  /**
   * Clean up stale connections (older than connectionTimeout)
   */
  async cleanupStaleConnections(): Promise<void> {
    const now = new Date();
    const staleConnections: number[] = [];

    for (const [instanceId, connection] of this.connections.entries()) {
      const age = now.getTime() - connection.lastUsed.getTime();
      if (age > this.connectionTimeout) {
        staleConnections.push(instanceId);
      }
    }

    for (const instanceId of staleConnections) {
      await this.closeConnection(instanceId);
    }
  }

  /**
   * Close all RCON connections
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map((instanceId) =>
      this.closeConnection(instanceId)
    );
    await Promise.all(closePromises);
  }

  /**
   * Check if connection exists for an instance
   */
  hasConnection(instanceId: number): boolean {
    return this.connections.has(instanceId);
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

// Export singleton instance
export const rconService = new RconService();

// Set up periodic cleanup of stale connections (every 5 minutes)
setInterval(
  () => {
    rconService.cleanupStaleConnections().catch((error) => {
      console.error('Failed to cleanup stale RCON connections:', error);
    });
  },
  5 * 60 * 1000
);

/**
 * Docker-related TypeScript type definitions
 * Minecraft Kids Server Management Suite
 */

/**
 * Instance status as defined in database schema
 */
export type InstanceStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'error';

/**
 * Configuration for creating a new Minecraft instance
 */
export interface CreateInstanceConfig {
  name: string;
  minecraftVersion?: string;
  fabricVersion?: string;
  serverPort: number;
  rconPort: number;
  rconPassword: string;
  voiceChatPort?: number;
  geyserEnabled?: boolean;
  geyserPort?: number;
  maxPlayers?: number;
  memoryAllocation?: string;
  createdBy: number;
  assignedJuniorAdmins?: number[];
}

/**
 * Docker container information
 */
export interface ContainerInfo {
  id: string;
  name: string;
  status: InstanceStatus;
  created: Date;
  ports: {
    server?: number;
    rcon?: number;
    voiceChat?: number;
    geyser?: number;
  };
}

/**
 * Docker container logs options
 */
export interface ContainerLogsOptions {
  tail?: number;
  since?: number;
  until?: number;
  timestamps?: boolean;
  follow?: boolean;
}

/**
 * Result of container operation
 */
export interface ContainerOperationResult {
  success: boolean;
  message: string;
  containerId?: string;
  error?: string;
}

/**
 * Docker service error
 */
export class DockerServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DockerServiceError';
  }
}

/**
 * Minecraft server environment variables
 */
export interface MinecraftEnvVars {
  EULA: string;
  VERSION: string;
  TYPE: string;
  MEMORY: string;
  SERVER_PORT: string;
  ENABLE_RCON: string;
  RCON_PASSWORD: string;
  RCON_PORT: string;
  MAX_PLAYERS: string;
  SERVER_NAME: string;
  MOTD: string;
  WHITELIST_ENABLED?: string;
  [key: string]: string | undefined;
}

/**
 * Ops.json entry structure for Minecraft server
 */
export interface MinecraftOpsEntry {
  uuid: string;
  name: string;
  level: number;
  bypassesPlayerLimit: boolean;
}

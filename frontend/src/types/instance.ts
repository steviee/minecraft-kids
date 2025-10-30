/**
 * Instance TypeScript type definitions (Frontend)
 * Minecraft Kids Server Management Suite
 */

export type InstanceStatus = 'running' | 'stopped' | 'starting' | 'error';

/**
 * Instance data from API
 */
export interface Instance {
  id: number;
  name: string;
  minecraftVersion: string | null;
  fabricVersion: string | null;
  serverPort: number;
  rconPort: number;
  voiceChatPort: number | null;
  geyserEnabled: boolean;
  geyserPort: number | null;
  maxPlayers: number;
  memoryAllocation: string;
  status: InstanceStatus;
  containerId: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request body for creating a new instance
 */
export interface CreateInstanceRequest {
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
  assignedJuniorAdmins?: number[];
}

/**
 * Request body for updating an instance
 */
export interface UpdateInstanceRequest {
  minecraftVersion?: string;
  fabricVersion?: string;
  voiceChatPort?: number;
  geyserEnabled?: boolean;
  geyserPort?: number;
  maxPlayers?: number;
  memoryAllocation?: string;
}

/**
 * Response for instance operations
 */
export interface InstanceOperationResponse {
  success: boolean;
  message: string;
  instance?: Instance;
  error?: string;
}

/**
 * Response for list instances
 */
export interface ListInstancesResponse {
  success: boolean;
  instances: Instance[];
  total: number;
}

/**
 * Response for start/stop/restart operations
 */
export interface InstanceActionResponse {
  success: boolean;
  message: string;
}

/**
 * Response for logs
 */
export interface InstanceLogsResponse {
  success: boolean;
  logs: string;
}

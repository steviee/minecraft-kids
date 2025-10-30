/**
 * Instance API TypeScript type definitions
 * Minecraft Kids Server Management Suite
 */

import { InstanceStatus } from './docker.types';

/**
 * Instance record from database
 */
export interface InstanceRecord {
  id: number;
  name: string;
  minecraft_version: string | null;
  fabric_version: string | null;
  server_port: number;
  rcon_port: number;
  rcon_password: string;
  voice_chat_port: number | null;
  geyser_enabled: number;
  geyser_port: number | null;
  max_players: number;
  memory_allocation: string;
  status: InstanceStatus;
  container_id: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Instance data for API responses
 */
export interface InstanceData {
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
  instance?: InstanceData;
  error?: string;
}

/**
 * Response for list instances
 */
export interface ListInstancesResponse {
  success: boolean;
  instances: InstanceData[];
  total: number;
}

/**
 * Convert database record to API data
 */
export function instanceRecordToData(record: InstanceRecord): InstanceData {
  return {
    id: record.id,
    name: record.name,
    minecraftVersion: record.minecraft_version,
    fabricVersion: record.fabric_version,
    serverPort: record.server_port,
    rconPort: record.rcon_port,
    voiceChatPort: record.voice_chat_port,
    geyserEnabled: record.geyser_enabled === 1,
    geyserPort: record.geyser_port,
    maxPlayers: record.max_players,
    memoryAllocation: record.memory_allocation,
    status: record.status,
    containerId: record.container_id,
    createdBy: record.created_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

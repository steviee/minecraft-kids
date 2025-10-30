/**
 * TypeScript type definitions for database models
 * Minecraft Kids Server Management Suite
 */

/**
 * User role enumeration
 */
export type UserRole = 'admin' | 'junior-admin';

/**
 * Server instance status enumeration
 */
export type InstanceStatus = 'running' | 'stopped' | 'starting' | 'stopping' | 'error';

/**
 * Shared user group type enumeration
 */
export type GroupType = 'whitelist' | 'ops' | 'both';

/**
 * Whitelist request status enumeration
 */
export type WhitelistRequestStatus = 'pending' | 'approved' | 'denied' | 'expired';

/**
 * User account record
 */
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * User creation data (without generated fields)
 */
export interface CreateUserData {
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
}

/**
 * User update data (partial)
 */
export interface UpdateUserData {
  username?: string;
  email?: string;
  password_hash?: string;
  role?: UserRole;
}

/**
 * Minecraft server instance record
 */
export interface Instance {
  id: number;
  name: string;
  minecraft_version: string | null;
  fabric_version: string | null;
  server_port: number | null;
  rcon_port: number | null;
  rcon_password: string | null;
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
 * Instance creation data
 */
export interface CreateInstanceData {
  name: string;
  minecraft_version?: string;
  fabric_version?: string;
  server_port?: number;
  rcon_port?: number;
  rcon_password?: string;
  voice_chat_port?: number;
  geyser_enabled?: boolean;
  geyser_port?: number;
  max_players?: number;
  memory_allocation?: string;
  created_by: number;
}

/**
 * Instance update data (excluding immutable name field)
 */
export interface UpdateInstanceData {
  minecraft_version?: string;
  fabric_version?: string;
  server_port?: number;
  rcon_port?: number;
  rcon_password?: string;
  voice_chat_port?: number;
  geyser_enabled?: boolean;
  geyser_port?: number;
  max_players?: number;
  memory_allocation?: string;
  status?: InstanceStatus;
  container_id?: string;
}

/**
 * User-Instance permission mapping
 */
export interface UserInstancePermission {
  id: number;
  user_id: number;
  instance_id: number;
  granted_at: string;
  granted_by: number;
}

/**
 * Permission creation data
 */
export interface CreatePermissionData {
  user_id: number;
  instance_id: number;
  granted_by: number;
}

/**
 * Reusable server configuration template
 */
export interface SettingTemplate {
  id: number;
  name: string;
  description: string | null;
  minecraft_version: string | null;
  fabric_version: string | null;
  memory_allocation: string;
  max_players: number;
  mods_config: string | null;
  server_properties: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Template creation data
 */
export interface CreateTemplateData {
  name: string;
  description?: string;
  minecraft_version?: string;
  fabric_version?: string;
  memory_allocation?: string;
  max_players?: number;
  mods_config?: string;
  server_properties?: string;
  created_by: number;
}

/**
 * Template update data
 */
export interface UpdateTemplateData {
  name?: string;
  description?: string;
  minecraft_version?: string;
  fabric_version?: string;
  memory_allocation?: string;
  max_players?: number;
  mods_config?: string;
  server_properties?: string;
}

/**
 * Shared user group (whitelist/ops)
 */
export interface SharedUserGroup {
  id: number;
  name: string;
  description: string | null;
  group_type: GroupType;
  player_list: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Shared user group creation data
 */
export interface CreateSharedUserGroupData {
  name: string;
  description?: string;
  group_type: GroupType;
  player_list: string;
  created_by: number;
}

/**
 * Shared user group update data
 */
export interface UpdateSharedUserGroupData {
  name?: string;
  description?: string;
  group_type?: GroupType;
  player_list?: string;
}

/**
 * Instance-SharedUserGroup mapping
 */
export interface InstanceSharedGroup {
  id: number;
  instance_id: number;
  group_id: number;
  assigned_at: string;
  assigned_by: number;
}

/**
 * Instance-SharedUserGroup assignment data
 */
export interface CreateInstanceSharedGroupData {
  instance_id: number;
  group_id: number;
  assigned_by: number;
}

/**
 * Whitelist request record
 */
export interface WhitelistRequest {
  id: number;
  instance_id: number;
  player_name: string;
  player_uuid: string | null;
  request_timestamp: string;
  ip_address: string | null;
  status: WhitelistRequestStatus;
  approved_by: number | null;
  approved_at: string | null;
  denial_reason: string | null;
}

/**
 * Whitelist request creation data
 */
export interface CreateWhitelistRequestData {
  instance_id: number;
  player_name: string;
  player_uuid?: string;
  ip_address?: string;
}

/**
 * Whitelist request update data
 */
export interface UpdateWhitelistRequestData {
  status?: WhitelistRequestStatus;
  approved_by?: number;
  approved_at?: string;
  denial_reason?: string;
}

/**
 * Instance permissions view record
 */
export interface InstancePermissionView {
  id: number;
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  instance_id: number;
  instance_name: string;
  instance_status: InstanceStatus;
  granted_at: string;
  granted_by: number;
  granted_by_username: string;
}

/**
 * Pending whitelist requests view record
 */
export interface PendingWhitelistRequestView {
  id: number;
  instance_id: number;
  instance_name: string;
  player_name: string;
  player_uuid: string | null;
  request_timestamp: string;
  ip_address: string | null;
}

/**
 * Instance statistics view record
 */
export interface InstanceStatsView {
  id: number;
  name: string;
  status: InstanceStatus;
  minecraft_version: string | null;
  max_players: number;
  created_at: string;
  created_by_username: string;
  assigned_users_count: number;
  pending_whitelist_count: number;
}

/**
 * Database query result type helper
 */
export type QueryResult<T> = T | undefined;

/**
 * Database query results array type helper
 */
export type QueryResults<T> = T[];

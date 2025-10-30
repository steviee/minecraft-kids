/**
 * WebSocket TypeScript type definitions (Frontend)
 * Minecraft Kids Server Management Suite
 */

/**
 * WebSocket authentication request
 */
export interface WSAuthRequest {
  type: 'auth';
  token: string;
}

/**
 * WebSocket subscribe to instance logs
 */
export interface WSSubscribeRequest {
  type: 'subscribe';
  instanceId: number;
}

/**
 * WebSocket unsubscribe from instance logs
 */
export interface WSUnsubscribeRequest {
  type: 'unsubscribe';
  instanceId: number;
}

/**
 * WebSocket RCON command request
 */
export interface WSRconCommandRequest {
  type: 'rcon_command';
  instanceId: number;
  command: string;
}

/**
 * WebSocket ping/pong for keep-alive
 */
export interface WSPingRequest {
  type: 'ping';
}

/**
 * Union type for all WebSocket requests
 */
export type WSRequest =
  | WSAuthRequest
  | WSSubscribeRequest
  | WSUnsubscribeRequest
  | WSRconCommandRequest
  | WSPingRequest;

/**
 * WebSocket authentication response
 */
export interface WSAuthResponse {
  type: 'auth';
  success: boolean;
  message?: string;
  userId?: number;
  userRole?: string;
}

/**
 * WebSocket log message
 */
export interface WSLogMessage {
  type: 'log';
  instanceId: number;
  timestamp: string;
  message: string;
}

/**
 * WebSocket RCON response
 */
export interface WSRconResponse {
  type: 'rcon_response';
  instanceId: number;
  success: boolean;
  response?: string;
  error?: string;
}

/**
 * WebSocket error message
 */
export interface WSErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

/**
 * WebSocket pong response
 */
export interface WSPongResponse {
  type: 'pong';
}

/**
 * Union type for all WebSocket responses
 */
export type WSResponse =
  | WSAuthResponse
  | WSLogMessage
  | WSRconResponse
  | WSErrorMessage
  | WSPongResponse;

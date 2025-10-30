/**
 * WebSocket Service - Manages WebSocket connections for live console
 * Minecraft Kids Server Management Suite
 */

import { Server as WebSocketServer } from 'ws';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { instanceService } from './instance.service';
import { rconService } from './rcon.service';
import { dockerService } from './docker.service';
import type {
  AuthenticatedWebSocket,
  WSRequest,
  WSResponse,
  WSAuthResponse,
  WSErrorMessage,
  WSRconResponse,
  WSLogMessage,
  WSPongResponse,
} from '../types/websocket.types';

/**
 * WebSocketService manages WebSocket connections and real-time communication
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private subscriptions: Map<number, Set<AuthenticatedWebSocket>> = new Map();
  private logStreams: Map<number, NodeJS.Timeout> = new Map();
  private readonly LOG_POLL_INTERVAL = 1000; // 1 second

  /**
   * Initialize WebSocket server
   */
  initialize(server: HTTPServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedWebSocket) => {
      console.log('New WebSocket connection');

      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data).catch((error) => {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Internal server error');
        });
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Set up ping/pong heartbeat
    const heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(heartbeatInterval);
    });

    console.log('WebSocket server initialized on /ws');
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(ws: AuthenticatedWebSocket, data: Buffer): Promise<void> {
    let message: WSRequest;

    try {
      message = JSON.parse(data.toString());
    } catch {
      this.sendError(ws, 'Invalid JSON message');
      return;
    }

    switch (message.type) {
      case 'auth':
        await this.handleAuth(ws, message.token);
        break;

      case 'subscribe':
        await this.handleSubscribe(ws, message.instanceId);
        break;

      case 'unsubscribe':
        await this.handleUnsubscribe(ws, message.instanceId);
        break;

      case 'rcon_command':
        await this.handleRconCommand(ws, message.instanceId, message.command);
        break;

      case 'ping':
        this.handlePing(ws);
        break;

      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuth(ws: AuthenticatedWebSocket, token: string): Promise<void> {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, secret) as { userId: number; role: string };

      ws.userId = decoded.userId;
      ws.userRole = decoded.role;

      const response: WSAuthResponse = {
        type: 'auth',
        success: true,
        userId: decoded.userId,
        userRole: decoded.role,
      };

      this.send(ws, response);
    } catch {
      const response: WSAuthResponse = {
        type: 'auth',
        success: false,
        message: 'Invalid token',
      };

      this.send(ws, response);
      ws.close();
    }
  }

  /**
   * Handle log subscription
   */
  private async handleSubscribe(ws: AuthenticatedWebSocket, instanceId: number): Promise<void> {
    if (!ws.userId || !ws.userRole) {
      this.sendError(ws, 'Not authenticated');
      return;
    }

    // Check instance access
    const hasAccess = instanceService.hasInstanceAccess(ws.userId, instanceId, ws.userRole);
    if (!hasAccess) {
      this.sendError(ws, 'Access denied to this instance');
      return;
    }

    // Check instance exists
    const instance = instanceService.getInstanceById(instanceId);
    if (!instance) {
      this.sendError(ws, 'Instance not found');
      return;
    }

    // Add subscription
    if (!this.subscriptions.has(instanceId)) {
      this.subscriptions.set(instanceId, new Set());
    }

    this.subscriptions.get(instanceId)!.add(ws);

    // Start log streaming if not already started
    if (!this.logStreams.has(instanceId)) {
      this.startLogStream(instanceId);
    }

    console.log(`Client subscribed to instance ${instanceId} logs`);
  }

  /**
   * Handle log unsubscription
   */
  private async handleUnsubscribe(ws: AuthenticatedWebSocket, instanceId: number): Promise<void> {
    const subscribers = this.subscriptions.get(instanceId);
    if (subscribers) {
      subscribers.delete(ws);

      // Stop log streaming if no more subscribers
      if (subscribers.size === 0) {
        this.stopLogStream(instanceId);
        this.subscriptions.delete(instanceId);
      }

      console.log(`Client unsubscribed from instance ${instanceId} logs`);
    }
  }

  /**
   * Handle RCON command execution
   */
  private async handleRconCommand(
    ws: AuthenticatedWebSocket,
    instanceId: number,
    command: string
  ): Promise<void> {
    if (!ws.userId || !ws.userRole) {
      this.sendError(ws, 'Not authenticated');
      return;
    }

    // Check instance access
    const hasAccess = instanceService.hasInstanceAccess(ws.userId, instanceId, ws.userRole);
    if (!hasAccess) {
      const response: WSRconResponse = {
        type: 'rcon_response',
        instanceId,
        success: false,
        error: 'Access denied to this instance',
      };
      this.send(ws, response);
      return;
    }

    // Get instance details
    const instance = instanceService.getInstanceById(instanceId);
    if (!instance) {
      const response: WSRconResponse = {
        type: 'rcon_response',
        instanceId,
        success: false,
        error: 'Instance not found',
      };
      this.send(ws, response);
      return;
    }

    // Check instance is running
    if (instance.status !== 'running') {
      const response: WSRconResponse = {
        type: 'rcon_response',
        instanceId,
        success: false,
        error: 'Instance is not running',
      };
      this.send(ws, response);
      return;
    }

    // Get RCON password
    const rconPassword = instanceService.getInstanceRconPassword(instanceId);
    if (!rconPassword) {
      const response: WSRconResponse = {
        type: 'rcon_response',
        instanceId,
        success: false,
        error: 'RCON password not found',
      };
      this.send(ws, response);
      return;
    }

    // Execute RCON command
    try {
      const result = await rconService.executeCommand(
        instanceId,
        command,
        'localhost',
        instance.rconPort,
        rconPassword
      );

      const response: WSRconResponse = {
        type: 'rcon_response',
        instanceId,
        success: true,
        response: result,
      };

      this.send(ws, response);
    } catch (error) {
      const response: WSRconResponse = {
        type: 'rcon_response',
        instanceId,
        success: false,
        error: (error as Error).message,
      };

      this.send(ws, response);
    }
  }

  /**
   * Handle ping
   */
  private handlePing(ws: AuthenticatedWebSocket): void {
    const response: WSPongResponse = {
      type: 'pong',
    };
    this.send(ws, response);
  }

  /**
   * Start log streaming for an instance
   */
  private startLogStream(instanceId: number): void {
    let lastLogLength = 0;

    const interval = setInterval(async () => {
      try {
        // Get logs from Docker
        const logs = await dockerService.getLogs(
          instanceService.getInstanceById(instanceId)?.name || '',
          { tail: 100 }
        );

        const logLines = logs.split('\n').filter((line) => line.trim().length > 0);

        // Send only new logs
        const newLogs = logLines.slice(lastLogLength);
        lastLogLength = logLines.length;

        if (newLogs.length > 0) {
          this.broadcastLogs(instanceId, newLogs);
        }
      } catch (error) {
        console.error(`Failed to fetch logs for instance ${instanceId}:`, error);
      }
    }, this.LOG_POLL_INTERVAL);

    this.logStreams.set(instanceId, interval);
  }

  /**
   * Stop log streaming for an instance
   */
  private stopLogStream(instanceId: number): void {
    const interval = this.logStreams.get(instanceId);
    if (interval) {
      clearInterval(interval);
      this.logStreams.delete(instanceId);
      console.log(`Stopped log streaming for instance ${instanceId}`);
    }
  }

  /**
   * Broadcast logs to all subscribers of an instance
   */
  private broadcastLogs(instanceId: number, logs: string[]): void {
    const subscribers = this.subscriptions.get(instanceId);
    if (!subscribers) return;

    const timestamp = new Date().toISOString();

    logs.forEach((log) => {
      const message: WSLogMessage = {
        type: 'log',
        instanceId,
        timestamp,
        message: log,
      };

      subscribers.forEach((ws) => {
        this.send(ws, message);
      });
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(ws: AuthenticatedWebSocket): void {
    // Remove from all subscriptions
    for (const [instanceId, subscribers] of this.subscriptions.entries()) {
      if (subscribers.has(ws)) {
        subscribers.delete(ws);

        // Stop log streaming if no more subscribers
        if (subscribers.size === 0) {
          this.stopLogStream(instanceId);
          this.subscriptions.delete(instanceId);
        }
      }
    }

    console.log('WebSocket client disconnected');
  }

  /**
   * Send message to client
   */
  private send(ws: AuthenticatedWebSocket, message: WSResponse): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error to client
   */
  private sendError(ws: AuthenticatedWebSocket, message: string, code?: string): void {
    const errorMessage: WSErrorMessage = {
      type: 'error',
      message,
      code,
    };
    this.send(ws, errorMessage);
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    // Stop all log streams
    for (const instanceId of this.logStreams.keys()) {
      this.stopLogStream(instanceId);
    }

    // Close all connections
    if (this.wss) {
      this.wss.clients.forEach((ws) => {
        ws.close();
      });

      this.wss.close();
      this.wss = null;
    }

    console.log('WebSocket server shut down');
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

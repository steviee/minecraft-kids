import { Request } from 'express';
import { TokenPayload } from './auth.types.js';

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  /**
   * Skip authentication check
   */
  skipAuth?: boolean;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  /**
   * Whether the user has permission
   */
  hasPermission: boolean;
  /**
   * Reason for denial (if applicable)
   */
  reason?: string;
}

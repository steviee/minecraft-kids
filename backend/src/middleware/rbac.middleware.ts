import { Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../types/middleware.types';

// Allow overriding database for testing
let testDatabase: Database.Database | null = null;

export function setTestDatabase(db: Database.Database | null): void {
  testDatabase = db;
}

function getDatabaseInstance(): Database.Database {
  return testDatabase || getDatabase();
}

/**
 * Role-based access control middleware
 * Ensures only users with specified roles can access the route
 * @param allowedRoles - Array of roles that can access this route
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this action',
      });
      return;
    }

    next();
  };
}

/**
 * Admin-only access middleware
 * Shorthand for requireRole('admin')
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  return requireRole('admin')(req, res, next);
}

/**
 * Instance permission middleware for Junior-Admins
 * Checks if a Junior-Admin has access to a specific instance
 * Admins always have access
 * @param instanceIdParam - Name of the route parameter containing the instance ID (default: 'instanceId')
 */
export function requireInstanceAccess(instanceIdParam = 'instanceId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Validate instance ID first (for all roles)
    const instanceId = parseInt(req.params[instanceIdParam], 10);

    if (isNaN(instanceId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid instance ID',
      });
      return;
    }

    // Admins have access to all instances
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Junior-Admins must have explicit permission
    if (req.user.role === 'junior-admin') {
      const db = getDatabaseInstance();
      const permission = db
        .prepare(
          `
        SELECT 1 FROM UserInstancePermissions
        WHERE user_id = ? AND instance_id = ?
      `
        )
        .get(req.user.userId, instanceId);

      if (!permission) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this instance',
        });
        return;
      }

      next();
      return;
    }

    // Unknown role
    res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions for this action',
    });
  };
}

/**
 * Checks if a user can manage other users
 * Only admins can manage users
 */
export function requireUserManagementAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only administrators can manage users',
    });
    return;
  }

  next();
}

/**
 * Checks if a user can access their own data or is an admin
 * @param userIdParam - Name of the route parameter containing the user ID (default: 'userId')
 */
export function requireSelfOrAdmin(userIdParam = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const targetUserId = parseInt(req.params[userIdParam], 10);

    if (isNaN(targetUserId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user ID',
      });
      return;
    }

    // Allow if user is accessing their own data or if user is admin
    if (req.user.userId === targetUserId || req.user.role === 'admin') {
      next();
      return;
    }

    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own data',
    });
  };
}

import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/middleware.types';

/**
 * Authentication middleware that verifies JWT tokens
 * Extracts user data from valid tokens and attaches to request
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired',
        });
        return;
      }
      if (error.message.includes('invalid')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid authentication token',
        });
        return;
      }
    }
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware for public routes
 * Attaches user data if valid token is provided, but allows request to proceed without token
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
}

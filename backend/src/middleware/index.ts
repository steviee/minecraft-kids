/**
 * Middleware exports
 */
export { authenticateToken, optionalAuth } from './auth.middleware.js';
export {
  requireRole,
  requireAdmin,
  requireInstanceAccess,
  requireUserManagementAccess,
  requireSelfOrAdmin,
  setTestDatabase,
} from './rbac.middleware.js';

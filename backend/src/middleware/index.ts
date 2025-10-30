/**
 * Middleware exports
 */
export { authenticateToken, optionalAuth } from './auth.middleware';
export {
  requireRole,
  requireAdmin,
  requireInstanceAccess,
  requireUserManagementAccess,
  requireSelfOrAdmin,
  setTestDatabase,
} from './rbac.middleware';

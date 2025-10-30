import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireInstanceAccess,
  requireUserManagementAccess,
  requireSelfOrAdmin,
  setTestDatabase,
} from '../src/middleware/index.js';
import { generateAccessToken } from '../src/services/auth.service.js';
import {
  initializeTestDatabase,
  cleanupTestDatabase,
  getTestDatabase,
  insertTestUser,
  insertTestInstance,
  insertTestUserInstancePermission,
} from '../src/database/test-helpers.js';

describe('RBAC Middleware', () => {
  let app: Express;
  let adminToken: string;
  let juniorAdminToken: string;
  let adminUserId: number;
  let juniorAdminUserId: number;
  let instanceId: number;

  beforeEach(async () => {
    await initializeTestDatabase();

    // Set test database for middleware
    setTestDatabase(getTestDatabase());

    // Create test users
    adminUserId = insertTestUser('admin@example.com', 'admin', 'admin');
    juniorAdminUserId = insertTestUser(
      'junior@example.com',
      'junior-admin',
      'junior-admin'
    );

    // Create test instance
    instanceId = insertTestInstance('test-server', 'Test Server', adminUserId);

    // Grant Junior-Admin access to the instance
    insertTestUserInstancePermission(juniorAdminUserId, instanceId, adminUserId);

    // Generate tokens
    adminToken = generateAccessToken(adminUserId, 'admin');
    juniorAdminToken = generateAccessToken(
      juniorAdminUserId,
      'junior-admin'
    );

    // Setup Express app with test routes
    app = express();
    app.use(express.json());

    // Test routes for authentication
    app.get('/api/protected', authenticateToken, (_req, res) => {
      res.json({ message: 'Success' });
    });

    app.get('/api/public', optionalAuth, (req, res) => {
      res.json({
        message: 'Success',
        authenticated: !!(req as any).user,
      });
    });

    // Test routes for role-based access
    app.get('/api/admin-only', authenticateToken, requireAdmin, (_req, res) => {
      res.json({ message: 'Admin access granted' });
    });

    app.get(
      '/api/any-role',
      authenticateToken,
      requireRole('admin', 'junior-admin'),
      (_req, res) => {
        res.json({ message: 'Role access granted' });
      }
    );

    // Test routes for instance access
    app.get(
      '/api/instances/:instanceId',
      authenticateToken,
      requireInstanceAccess('instanceId'),
      (_req, res) => {
        res.json({ message: 'Instance access granted' });
      }
    );

    // Test routes for user management
    app.get(
      '/api/users',
      authenticateToken,
      requireUserManagementAccess,
      (_req, res) => {
        res.json({ message: 'User management access granted' });
      }
    );

    // Test routes for self-or-admin access
    app.get(
      '/api/users/:userId',
      authenticateToken,
      requireSelfOrAdmin('userId'),
      (_req, res) => {
        res.json({ message: 'User data access granted' });
      }
    );
  });

  afterEach(async () => {
    setTestDatabase(null);
    await cleanupTestDatabase();
  });

  describe('authenticateToken middleware', () => {
    it('should allow requests with valid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Success');
    });

    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('No authentication token');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject requests with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', adminToken);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('optionalAuth middleware', () => {
    it('should attach user data when valid token is provided', async () => {
      const response = await request(app)
        .get('/api/public')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
    });

    it('should allow requests without token', async () => {
      const response = await request(app).get('/api/public');

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
    });

    it('should allow requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/public')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
    });
  });

  describe('requireAdmin middleware', () => {
    it('should allow admin users', async () => {
      const response = await request(app)
        .get('/api/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should reject junior-admin users', async () => {
      const response = await request(app)
        .get('/api/admin-only')
        .set('Authorization', `Bearer ${juniorAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/admin-only');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('requireRole middleware', () => {
    it('should allow admin users', async () => {
      const response = await request(app)
        .get('/api/any-role')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Role access granted');
    });

    it('should allow junior-admin users', async () => {
      const response = await request(app)
        .get('/api/any-role')
        .set('Authorization', `Bearer ${juniorAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Role access granted');
    });

    it('should reject users with invalid role in token', async () => {
      // Create a token with an invalid role (simulate tampering)
      const invalidToken = generateAccessToken(adminUserId, 'invalid-role');

      const response = await request(app)
        .get('/api/any-role')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });
  });

  describe('requireInstanceAccess middleware', () => {
    it('should allow admin users to access any instance', async () => {
      const response = await request(app)
        .get(`/api/instances/${instanceId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Instance access granted');
    });

    it('should allow junior-admin users to access assigned instances', async () => {
      const response = await request(app)
        .get(`/api/instances/${instanceId}`)
        .set('Authorization', `Bearer ${juniorAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Instance access granted');
    });

    it('should reject junior-admin users accessing unassigned instances', async () => {
      const otherInstanceId = insertTestInstance(
        'other-server',
        'Other Server',
        adminUserId
      );

      const response = await request(app)
        .get(`/api/instances/${otherInstanceId}`)
        .set('Authorization', `Bearer ${juniorAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('do not have access');
    });

    it('should reject requests with invalid instance ID', async () => {
      const response = await request(app)
        .get('/api/instances/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid instance ID');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get(`/api/instances/${instanceId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('requireUserManagementAccess middleware', () => {
    it('should allow admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User management access granted');
    });

    it('should reject junior-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${juniorAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('Only administrators');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('requireSelfOrAdmin middleware', () => {
    it('should allow users to access their own data', async () => {
      const response = await request(app)
        .get(`/api/users/${juniorAdminUserId}`)
        .set('Authorization', `Bearer ${juniorAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User data access granted');
    });

    it('should allow admin users to access any user data', async () => {
      const response = await request(app)
        .get(`/api/users/${juniorAdminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User data access granted');
    });

    it('should reject users accessing other user data', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${juniorAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('only access your own data');
    });

    it('should reject requests with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Invalid user ID');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get(`/api/users/${adminUserId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});

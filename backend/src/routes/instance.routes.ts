/**
 * Instance Management API Routes
 * Minecraft Kids Server Management Suite
 */

import { Router, Response } from 'express';
import { instanceService, InstanceServiceError } from '../services/instance.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin, requireInstanceAccess } from '../middleware/rbac.middleware';
import { AuthenticatedRequest } from '../types/middleware.types';
import {
  CreateInstanceRequest,
  UpdateInstanceRequest,
  InstanceOperationResponse,
  ListInstancesResponse,
} from '../types/instance.types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/instances
 * List all instances (filtered by role)
 * - Admins see all instances
 * - Junior-Admins see only assigned instances
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const instances = instanceService.getAllInstances(req.user.userId, req.user.role);

    const response: ListInstancesResponse = {
      success: true,
      instances,
      total: instances.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing instances:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch instances',
    });
  }
});

/**
 * POST /api/instances
 * Create a new instance (Admin only)
 */
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const createRequest = req.body as CreateInstanceRequest;

    // Basic validation
    if (
      !createRequest.name ||
      !createRequest.serverPort ||
      !createRequest.rconPort ||
      !createRequest.rconPassword
    ) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required fields: name, serverPort, rconPort, rconPassword',
      });
      return;
    }

    const instance = await instanceService.createInstance(createRequest, req.user.userId);

    const response: InstanceOperationResponse = {
      success: true,
      message: 'Instance created successfully',
      instance,
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof InstanceServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.code,
        message: error.message,
      });
      return;
    }

    console.error('Error creating instance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create instance',
    });
  }
});

/**
 * GET /api/instances/:id
 * Get a specific instance
 */
router.get(
  '/:id',
  requireInstanceAccess('id'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const instance = instanceService.getInstanceById(id);

      if (!instance) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Instance with ID ${id} not found`,
        });
        return;
      }

      const response: InstanceOperationResponse = {
        success: true,
        message: 'Instance retrieved successfully',
        instance,
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching instance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch instance',
      });
    }
  }
);

/**
 * PATCH /api/instances/:id
 * Update an instance (name is immutable)
 */
router.patch(
  '/:id',
  requireInstanceAccess('id'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const updateRequest = req.body as UpdateInstanceRequest;

      // Explicitly reject name updates
      if ('name' in req.body) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Instance name cannot be changed after creation',
        });
        return;
      }

      const instance = await instanceService.updateInstance(id, updateRequest);

      const response: InstanceOperationResponse = {
        success: true,
        message: 'Instance updated successfully',
        instance,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Error updating instance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update instance',
      });
    }
  }
);

/**
 * DELETE /api/instances/:id
 * Delete an instance (Admin only)
 */
router.delete(
  '/:id',
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      await instanceService.deleteInstance(id);

      res.json({
        success: true,
        message: 'Instance deleted successfully',
      });
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Error deleting instance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete instance',
      });
    }
  }
);

/**
 * POST /api/instances/:id/start
 * Start an instance
 */
router.post(
  '/:id/start',
  requireInstanceAccess('id'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await instanceService.startInstance(id);

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Error starting instance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to start instance',
      });
    }
  }
);

/**
 * POST /api/instances/:id/stop
 * Stop an instance
 */
router.post(
  '/:id/stop',
  requireInstanceAccess('id'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await instanceService.stopInstance(id);

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Error stopping instance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to stop instance',
      });
    }
  }
);

/**
 * POST /api/instances/:id/restart
 * Restart an instance
 */
router.post(
  '/:id/restart',
  requireInstanceAccess('id'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await instanceService.restartInstance(id);

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Error restarting instance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to restart instance',
      });
    }
  }
);

/**
 * GET /api/instances/:id/logs
 * Get instance logs
 */
router.get(
  '/:id/logs',
  requireInstanceAccess('id'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const tail = req.query.tail ? parseInt(req.query.tail as string, 10) : 100;

      const logs = await instanceService.getInstanceLogs(id, tail);

      res.json({
        success: true,
        logs,
      });
    } catch (error) {
      if (error instanceof InstanceServiceError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }

      console.error('Error fetching logs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch logs',
      });
    }
  }
);

export default router;

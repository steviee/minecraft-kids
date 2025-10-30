/**
 * Public API Routes (No Authentication Required)
 * Minecraft Kids Server Management Suite
 */

import { Router, Request, Response } from 'express';
import { instanceService } from '../services/instance.service.js';

const router = Router();

/**
 * GET /api/public/servers
 * List all servers (public status page)
 * No authentication required
 */
router.get('/servers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const instances = instanceService.getAllInstances();

    res.json({
      success: true,
      servers: instances,
      total: instances.length,
    });
  } catch (error) {
    console.error('Error fetching public servers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch servers',
    });
  }
});

export default router;

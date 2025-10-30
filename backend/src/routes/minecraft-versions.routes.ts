/**
 * Minecraft Versions Routes
 * Minecraft Kids Server Management Suite
 */

import { Router, Response } from 'express';
import { minecraftVersionsService } from '../services/minecraft-versions.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/middleware.types';

const router = Router();

/**
 * GET /api/minecraft-versions
 * Get available Minecraft and Fabric versions (authenticated)
 */
router.get('/', authenticateToken, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const versions = await minecraftVersionsService.getVersions();
    res.json({
      success: true,
      ...versions,
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch Minecraft and Fabric versions',
    });
  }
});

/**
 * GET /api/minecraft-versions/fabric/:minecraftVersion
 * Get compatible Fabric versions for a specific Minecraft version (authenticated)
 */
router.get(
  '/fabric/:minecraftVersion',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { minecraftVersion } = req.params;
      const fabricVersions = await minecraftVersionsService.getFabricVersionsForMinecraft(
        minecraftVersion
      );
      res.json({
        success: true,
        minecraftVersion,
        fabricVersions,
      });
    } catch (error) {
      console.error('Error fetching Fabric versions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch compatible Fabric versions',
      });
    }
  }
);

export default router;

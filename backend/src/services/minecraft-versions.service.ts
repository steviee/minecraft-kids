/**
 * Minecraft Versions Service - Fetches available Minecraft and Fabric versions
 * Minecraft Kids Server Management Suite
 */

import axios from 'axios';

/**
 * Minecraft version from Mojang API
 */
export interface MinecraftVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  releaseTime: string;
}

/**
 * Fabric loader version from Fabric API
 */
export interface FabricVersion {
  version: string;
  stable: boolean;
}

/**
 * Combined response for frontend
 */
export interface VersionsResponse {
  minecraftVersions: MinecraftVersion[];
  fabricVersions: FabricVersion[];
}

/**
 * Service for fetching Minecraft and Fabric versions
 */
export class MinecraftVersionsService {
  private readonly MOJANG_VERSION_MANIFEST = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';
  private readonly FABRIC_VERSIONS_API = 'https://meta.fabricmc.net/v2/versions/loader';

  // Cache versions for 1 hour
  private cache: {
    data: VersionsResponse | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0,
  };

  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Fetch Minecraft versions from Mojang
   */
  private async fetchMinecraftVersions(): Promise<MinecraftVersion[]> {
    try {
      const response = await axios.get(this.MOJANG_VERSION_MANIFEST, {
        timeout: 10000,
      });

      const versions = response.data.versions as Array<{
        id: string;
        type: string;
        releaseTime: string;
      }>;

      // Filter only release versions (no snapshots)
      return versions
        .filter((v) => v.type === 'release')
        .map((v) => ({
          id: v.id,
          type: v.type as 'release',
          releaseTime: v.releaseTime,
        }));
    } catch (error) {
      console.error('Failed to fetch Minecraft versions:', error);
      throw new Error('Failed to fetch Minecraft versions from Mojang API');
    }
  }

  /**
   * Fetch Fabric loader versions
   */
  private async fetchFabricVersions(): Promise<FabricVersion[]> {
    try {
      const response = await axios.get(this.FABRIC_VERSIONS_API, {
        timeout: 10000,
      });

      const versions = response.data as Array<{
        version: string;
        stable: boolean;
      }>;

      return versions.map((v) => ({
        version: v.version,
        stable: v.stable,
      }));
    } catch (error) {
      console.error('Failed to fetch Fabric versions:', error);
      throw new Error('Failed to fetch Fabric versions from Fabric API');
    }
  }

  /**
   * Fetch Fabric loader versions compatible with a specific Minecraft version
   */
  async getFabricVersionsForMinecraft(minecraftVersion: string): Promise<FabricVersion[]> {
    try {
      // Fabric API endpoint for game version specific loaders
      const url = `https://meta.fabricmc.net/v2/versions/loader/${minecraftVersion}`;
      const response = await axios.get(url, {
        timeout: 10000,
      });

      const loaders = response.data as Array<{
        loader: {
          version: string;
          stable: boolean;
        };
      }>;

      return loaders.map((item) => ({
        version: item.loader.version,
        stable: item.loader.stable,
      }));
    } catch (error) {
      console.error(
        `Failed to fetch Fabric versions for Minecraft ${minecraftVersion}:`,
        error
      );
      // Fallback to all versions if specific lookup fails
      return this.fetchFabricVersions();
    }
  }

  /**
   * Get all versions (with caching)
   */
  async getVersions(): Promise<VersionsResponse> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.cache.data && now - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache.data;
    }

    // Fetch fresh data
    const [minecraftVersions, fabricVersions] = await Promise.all([
      this.fetchMinecraftVersions(),
      this.fetchFabricVersions(),
    ]);

    this.cache.data = {
      minecraftVersions,
      fabricVersions,
    };
    this.cache.timestamp = now;

    return this.cache.data;
  }

  /**
   * Validate if a Minecraft version exists
   */
  async isValidMinecraftVersion(version: string): Promise<boolean> {
    const versions = await this.getVersions();
    return versions.minecraftVersions.some((v) => v.id === version);
  }

  /**
   * Validate if a Fabric version exists
   */
  async isValidFabricVersion(version: string): Promise<boolean> {
    const versions = await this.getVersions();
    return versions.fabricVersions.some((v) => v.version === version);
  }
}

// Export singleton instance
export const minecraftVersionsService = new MinecraftVersionsService();

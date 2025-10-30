/**
 * Docker Service - Manages Minecraft server containers
 * Minecraft Kids Server Management Suite
 */

import Docker from 'dockerode';
import {
  CreateInstanceConfig,
  ContainerInfo,
  ContainerLogsOptions,
  ContainerOperationResult,
  DockerServiceError,
  MinecraftEnvVars,
  InstanceStatus,
} from '../types/docker.types';

/**
 * DockerService handles all Docker container operations for Minecraft servers
 */
export class DockerService {
  private docker: Docker;
  private networkName: string;
  private mcSubdomain: string;

  constructor() {
    // Initialize Docker client with socket from environment or default
    const socketPath = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
    this.docker = new Docker({ socketPath });

    // Load domain configuration from environment
    this.networkName = process.env.DOCKER_NETWORK_NAME || 'mck-network';
    this.mcSubdomain = process.env.MC_SUBDOMAIN || 'mc.mck.local';
  }

  /**
   * Generate container name following DNS scheme
   * Format: mck-minecraft-{name}
   */
  private getContainerName(instanceName: string): string {
    return `mck-minecraft-${instanceName}`;
  }

  /**
   * Generate hostname for Minecraft server
   * Format: {name}.mc.mck.local
   */
  private getHostname(instanceName: string): string {
    return `${instanceName}.${this.mcSubdomain}`;
  }

  /**
   * Generate volume name for server data
   */
  private getVolumeName(instanceName: string): string {
    return `mck-minecraft-${instanceName}-data`;
  }

  /**
   * Build environment variables for Minecraft container
   */
  private buildEnvVars(config: CreateInstanceConfig): MinecraftEnvVars {
    const env: MinecraftEnvVars = {
      EULA: 'TRUE',
      VERSION: config.minecraftVersion || process.env.MINECRAFT_VERSION || '1.20.4',
      TYPE: 'FABRIC',
      MEMORY: config.memoryAllocation || '2G',
      SERVER_PORT: config.serverPort.toString(),
      ENABLE_RCON: 'true',
      RCON_PASSWORD: config.rconPassword,
      RCON_PORT: config.rconPort.toString(),
      MAX_PLAYERS: (config.maxPlayers || 20).toString(),
      SERVER_NAME: config.name,
      MOTD: `MCK Suite - ${config.name}`,
      WHITELIST_ENABLED: 'true',
    };

    // Add Fabric version if specified
    if (config.fabricVersion) {
      env.FABRIC_VERSION = config.fabricVersion;
    }

    // Add Geyser configuration if enabled
    if (config.geyserEnabled && config.geyserPort) {
      env.ENABLE_GEYSER = 'true';
      env.GEYSER_PORT = config.geyserPort.toString();
    }

    return env;
  }

  /**
   * Generate ops.json content for Junior-Admin users
   * TODO: Implement when Junior-Admin assignment is added
   */
  // private async generateOpsJson(juniorAdminUsernames: string[]): Promise<MinecraftOpsEntry[]> {
  //   // In a real implementation, we would fetch UUIDs from Mojang API
  //   // For now, we'll create entries with placeholder UUIDs
  //   return juniorAdminUsernames.map((username) => ({
  //     uuid: '00000000-0000-0000-0000-000000000000', // Placeholder - should be fetched from Mojang API
  //     name: username,
  //     level: 4, // Full operator permissions
  //     bypassesPlayerLimit: true,
  //   }));
  // }

  /**
   * Create a new Minecraft server instance
   */
  async createInstance(config: CreateInstanceConfig): Promise<ContainerOperationResult> {
    try {
      const containerName = this.getContainerName(config.name);
      const volumeName = this.getVolumeName(config.name);
      const hostname = this.getHostname(config.name);

      // Check if container already exists
      const existingContainers = await this.docker.listContainers({ all: true });
      const containerExists = existingContainers.some((c) => c.Names.includes(`/${containerName}`));

      if (containerExists) {
        throw new DockerServiceError(
          `Container with name ${containerName} already exists`,
          'CONTAINER_EXISTS'
        );
      }

      // Create volume for persistent data
      await this.docker.createVolume({
        Name: volumeName,
        Driver: 'local',
        Labels: {
          'mck.instance.name': config.name,
          'mck.managed': 'true',
        },
      });

      // Build environment variables
      const env = this.buildEnvVars(config);
      const envArray = Object.entries(env).map(([key, value]) => `${key}=${value}`);

      // Create container configuration
      const containerConfig: Docker.ContainerCreateOptions = {
        name: containerName,
        Image: 'itzg/minecraft-server:latest',
        Hostname: hostname,
        Env: envArray,
        ExposedPorts: {
          [`${config.serverPort}/tcp`]: {},
          [`${config.rconPort}/tcp`]: {},
        },
        HostConfig: {
          Binds: [`${volumeName}:/data`],
          PortBindings: {
            '25565/tcp': [{ HostPort: config.serverPort.toString() }],
            '25575/tcp': [{ HostPort: config.rconPort.toString() }],
          },
          RestartPolicy: {
            Name: 'unless-stopped',
          },
          NetworkMode: this.networkName,
        },
        Labels: {
          'mck.instance.name': config.name,
          'mck.instance.server-port': config.serverPort.toString(),
          'mck.instance.rcon-port': config.rconPort.toString(),
          'mck.managed': 'true',
          'traefik.enable': 'true',
          [`traefik.tcp.routers.${config.name}.rule`]: 'HostSNI(`*`)',
          [`traefik.tcp.routers.${config.name}.entrypoints`]: 'minecraft',
          [`traefik.tcp.services.${config.name}.loadbalancer.server.port`]: '25565',
        },
      };

      // Add voice chat port if configured
      if (config.voiceChatPort) {
        containerConfig.ExposedPorts![`${config.voiceChatPort}/udp`] = {};
        containerConfig.HostConfig!.PortBindings![`${config.voiceChatPort}/udp`] = [
          { HostPort: config.voiceChatPort.toString() },
        ];
        containerConfig.Labels!['mck.instance.voice-chat-port'] = config.voiceChatPort.toString();
      }

      // Add Geyser port if enabled
      if (config.geyserEnabled && config.geyserPort) {
        containerConfig.ExposedPorts![`${config.geyserPort}/udp`] = {};
        containerConfig.HostConfig!.PortBindings![`${config.geyserPort}/udp`] = [
          { HostPort: config.geyserPort.toString() },
        ];
        containerConfig.Labels!['mck.instance.geyser-port'] = config.geyserPort.toString();
        containerConfig.Labels!['mck.instance.geyser-enabled'] = 'true';
      }

      // Create the container
      const container = await this.docker.createContainer(containerConfig);

      return {
        success: true,
        message: `Container ${containerName} created successfully`,
        containerId: container.id,
      };
    } catch (error) {
      if (error instanceof DockerServiceError) {
        throw error;
      }
      throw new DockerServiceError(
        `Failed to create instance: ${(error as Error).message}`,
        'CREATE_FAILED',
        error
      );
    }
  }

  /**
   * Start a container
   */
  async startContainer(containerName: string): Promise<ContainerOperationResult> {
    try {
      const fullContainerName = this.getContainerName(containerName);
      const container = this.docker.getContainer(fullContainerName);

      const info = await container.inspect();
      if (info.State.Running) {
        return {
          success: false,
          message: `Container ${fullContainerName} is already running`,
        };
      }

      await container.start();

      return {
        success: true,
        message: `Container ${fullContainerName} started successfully`,
        containerId: info.Id,
      };
    } catch (error) {
      throw new DockerServiceError(
        `Failed to start container: ${(error as Error).message}`,
        'START_FAILED',
        error
      );
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(containerName: string): Promise<ContainerOperationResult> {
    try {
      const fullContainerName = this.getContainerName(containerName);
      const container = this.docker.getContainer(fullContainerName);

      const info = await container.inspect();
      if (!info.State.Running) {
        return {
          success: false,
          message: `Container ${fullContainerName} is not running`,
        };
      }

      await container.stop({ t: 30 }); // 30 second grace period

      return {
        success: true,
        message: `Container ${fullContainerName} stopped successfully`,
        containerId: info.Id,
      };
    } catch (error) {
      throw new DockerServiceError(
        `Failed to stop container: ${(error as Error).message}`,
        'STOP_FAILED',
        error
      );
    }
  }

  /**
   * Restart a container
   */
  async restartContainer(containerName: string): Promise<ContainerOperationResult> {
    try {
      const fullContainerName = this.getContainerName(containerName);
      const container = this.docker.getContainer(fullContainerName);

      await container.restart({ t: 30 });

      const info = await container.inspect();

      return {
        success: true,
        message: `Container ${fullContainerName} restarted successfully`,
        containerId: info.Id,
      };
    } catch (error) {
      throw new DockerServiceError(
        `Failed to restart container: ${(error as Error).message}`,
        'RESTART_FAILED',
        error
      );
    }
  }

  /**
   * Delete a container and its associated volume
   */
  async deleteContainer(
    containerName: string,
    deleteVolume = true
  ): Promise<ContainerOperationResult> {
    try {
      const fullContainerName = this.getContainerName(containerName);
      const volumeName = this.getVolumeName(containerName);
      const container = this.docker.getContainer(fullContainerName);

      // Stop container if running
      const info = await container.inspect();
      if (info.State.Running) {
        await container.stop({ t: 30 });
      }

      // Remove container
      await container.remove({ v: false }); // Don't auto-remove volumes

      // Remove volume if requested
      if (deleteVolume) {
        try {
          const volume = this.docker.getVolume(volumeName);
          await volume.remove();
        } catch (volumeError) {
          console.warn(`Failed to remove volume ${volumeName}:`, volumeError);
        }
      }

      return {
        success: true,
        message: `Container ${fullContainerName} deleted successfully`,
        containerId: info.Id,
      };
    } catch (error) {
      throw new DockerServiceError(
        `Failed to delete container: ${(error as Error).message}`,
        'DELETE_FAILED',
        error
      );
    }
  }

  /**
   * Get container logs
   */
  async getLogs(containerName: string, options: ContainerLogsOptions = {}): Promise<string> {
    try {
      const fullContainerName = this.getContainerName(containerName);
      const container = this.docker.getContainer(fullContainerName);

      const dockerOptions: Docker.ContainerLogsOptions & { follow?: false } = {
        stdout: true,
        stderr: true,
        tail: options.tail || 100,
        timestamps: options.timestamps || false,
        follow: false,
      };

      if (options.since) {
        dockerOptions.since = options.since;
      }

      if (options.until) {
        dockerOptions.until = options.until;
      }

      const buffer = await container.logs(dockerOptions);
      return buffer.toString('utf-8');
    } catch (error) {
      throw new DockerServiceError(
        `Failed to get logs: ${(error as Error).message}`,
        'LOGS_FAILED',
        error
      );
    }
  }

  /**
   * Get container information
   */
  async getContainerInfo(containerName: string): Promise<ContainerInfo | null> {
    try {
      const fullContainerName = this.getContainerName(containerName);
      const container = this.docker.getContainer(fullContainerName);
      const info = await container.inspect();

      // Map Docker status to our InstanceStatus
      let status: InstanceStatus = 'stopped';
      if (info.State.Running) {
        status = 'running';
      } else if (info.State.Restarting) {
        status = 'starting';
      } else if (info.State.Status === 'exited') {
        status = info.State.ExitCode === 0 ? 'stopped' : 'error';
      }

      // Extract port mappings
      const ports: ContainerInfo['ports'] = {};
      const portBindings = info.HostConfig?.PortBindings;

      if (portBindings) {
        for (const [containerPort, hostPorts] of Object.entries(portBindings)) {
          if (hostPorts && Array.isArray(hostPorts) && hostPorts.length > 0) {
            const hostPort = hostPorts[0]?.HostPort;
            if (hostPort) {
              const port = parseInt(hostPort, 10);
              if (containerPort.includes('25565')) {
                ports.server = port;
              } else if (containerPort.includes('25575')) {
                ports.rcon = port;
              }
            }
          }
        }
      }

      return {
        id: info.Id,
        name: containerName,
        status,
        created: new Date(info.Created),
        ports,
      };
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null;
      }
      throw new DockerServiceError(
        `Failed to get container info: ${(error as Error).message}`,
        'INFO_FAILED',
        error
      );
    }
  }

  /**
   * List all managed Minecraft containers
   */
  async listContainers(): Promise<ContainerInfo[]> {
    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: {
          label: ['mck.managed=true'],
        },
      });

      const containerInfos: ContainerInfo[] = [];

      for (const containerData of containers) {
        const instanceName = containerData.Labels['mck.instance.name'];
        if (instanceName) {
          const info = await this.getContainerInfo(instanceName);
          if (info) {
            containerInfos.push(info);
          }
        }
      }

      return containerInfos;
    } catch (error) {
      throw new DockerServiceError(
        `Failed to list containers: ${(error as Error).message}`,
        'LIST_FAILED',
        error
      );
    }
  }

  /**
   * Check if Docker daemon is accessible
   */
  async ping(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const dockerService = new DockerService();

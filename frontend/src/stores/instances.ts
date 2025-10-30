/**
 * Instances Pinia Store
 * Manages Minecraft server instances state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { instancesApi } from '../api/client';
import type { Instance, CreateInstanceRequest, UpdateInstanceRequest } from '../types/instance';

export const useInstancesStore = defineStore('instances', () => {
  const instances = ref<Instance[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const runningInstances = computed(() => instances.value.filter((i) => i.status === 'running'));
  const stoppedInstances = computed(() => instances.value.filter((i) => i.status === 'stopped'));
  const totalInstances = computed(() => instances.value.length);
  const runningCount = computed(() => runningInstances.value.length);

  async function fetchInstances(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await instancesApi.getAll();
      instances.value = response.instances;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch instances';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function getInstanceById(id: number): Promise<Instance | null> {
    try {
      const response = await instancesApi.getById(id);
      if (response.success && response.instance) {
        const index = instances.value.findIndex((i) => i.id === id);
        if (index !== -1) {
          instances.value[index] = response.instance;
        } else {
          instances.value.push(response.instance);
        }
        return response.instance;
      }
      return null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch instance';
      throw err;
    }
  }

  async function createInstance(data: CreateInstanceRequest): Promise<Instance> {
    loading.value = true;
    error.value = null;

    try {
      const response = await instancesApi.create(data);
      if (response.success && response.instance) {
        instances.value.push(response.instance);
        return response.instance;
      }
      throw new Error(response.message || 'Failed to create instance');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create instance';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateInstance(id: number, data: UpdateInstanceRequest): Promise<Instance> {
    error.value = null;

    try {
      const response = await instancesApi.update(id, data);
      if (response.success && response.instance) {
        const index = instances.value.findIndex((i) => i.id === id);
        if (index !== -1) {
          instances.value[index] = response.instance;
        }
        return response.instance;
      }
      throw new Error(response.message || 'Failed to update instance');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update instance';
      throw err;
    }
  }

  async function deleteInstance(id: number): Promise<void> {
    error.value = null;

    try {
      await instancesApi.delete(id);
      instances.value = instances.value.filter((i) => i.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete instance';
      throw err;
    }
  }

  async function startInstance(id: number): Promise<void> {
    error.value = null;

    try {
      const response = await instancesApi.start(id);
      if (response.success) {
        const instance = instances.value.find((i) => i.id === id);
        if (instance) {
          instance.status = 'running';
        }
      } else {
        throw new Error(response.message || 'Failed to start instance');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start instance';
      throw err;
    }
  }

  async function stopInstance(id: number): Promise<void> {
    error.value = null;

    try {
      const response = await instancesApi.stop(id);
      if (response.success) {
        const instance = instances.value.find((i) => i.id === id);
        if (instance) {
          instance.status = 'stopped';
        }
      } else {
        throw new Error(response.message || 'Failed to stop instance');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to stop instance';
      throw err;
    }
  }

  async function restartInstance(id: number): Promise<void> {
    error.value = null;

    try {
      const response = await instancesApi.restart(id);
      if (response.success) {
        const instance = instances.value.find((i) => i.id === id);
        if (instance) {
          instance.status = 'running';
        }
      } else {
        throw new Error(response.message || 'Failed to restart instance');
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restart instance';
      throw err;
    }
  }

  async function getInstanceLogs(id: number, tail = 100): Promise<string> {
    try {
      const response = await instancesApi.getLogs(id, tail);
      if (response.success) {
        return response.logs;
      }
      throw new Error('Failed to fetch logs');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch logs';
      throw err;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  return {
    instances,
    loading,
    error,
    runningInstances,
    stoppedInstances,
    totalInstances,
    runningCount,
    fetchInstances,
    getInstanceById,
    createInstance,
    updateInstance,
    deleteInstance,
    startInstance,
    stopInstance,
    restartInstance,
    getInstanceLogs,
    clearError,
  };
});

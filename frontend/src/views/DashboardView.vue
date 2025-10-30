<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useInstancesStore } from '../stores/instances';
import InstanceCard from '../components/InstanceCard.vue';
import InstanceCreateForm from '../components/InstanceCreateForm.vue';
import type { CreateInstanceRequest } from '../types/instance';

const router = useRouter();
const authStore = useAuthStore();
const instancesStore = useInstancesStore();

const showCreateForm = ref(false);
const deleteConfirmId = ref<number | null>(null);
const actionLoading = ref<number | null>(null);

const systemStats = computed(() => ({
  cpu: { usage: 45, cores: 8 },
  memory: { used: 12.4, total: 32, unit: 'GB' },
  disk: { used: 245, total: 500, unit: 'GB' },
  servers: {
    online: instancesStore.runningCount,
    total: instancesStore.totalInstances,
  },
}));

const cpuPercentage = computed(() => systemStats.value.cpu.usage);
const memoryPercentage = computed(
  () => (systemStats.value.memory.used / systemStats.value.memory.total) * 100
);
const diskPercentage = computed(
  () => (systemStats.value.disk.used / systemStats.value.disk.total) * 100
);
const serversPercentage = computed(() => {
  const { online, total } = systemStats.value.servers;
  return total > 0 ? (online / total) * 100 : 0;
});

onMounted(async () => {
  await instancesStore.fetchInstances();
});

function navigateToUsers(): void {
  router.push('/admin/users');
}

async function handleCreateInstance(data: CreateInstanceRequest): Promise<void> {
  try {
    await instancesStore.createInstance(data);
    showCreateForm.value = false;
  } catch (error) {
    console.error('Failed to create instance:', error);
    alert('Fehler beim Erstellen der Instanz: ' + (error as Error).message);
  }
}

async function handleStartInstance(id: number): Promise<void> {
  actionLoading.value = id;
  try {
    await instancesStore.startInstance(id);
  } catch (error) {
    console.error('Failed to start instance:', error);
    alert('Fehler beim Starten der Instanz: ' + (error as Error).message);
  } finally {
    actionLoading.value = null;
  }
}

async function handleStopInstance(id: number): Promise<void> {
  actionLoading.value = id;
  try {
    await instancesStore.stopInstance(id);
  } catch (error) {
    console.error('Failed to stop instance:', error);
    alert('Fehler beim Stoppen der Instanz: ' + (error as Error).message);
  } finally {
    actionLoading.value = null;
  }
}

async function handleRestartInstance(id: number): Promise<void> {
  actionLoading.value = id;
  try {
    await instancesStore.restartInstance(id);
  } catch (error) {
    console.error('Failed to restart instance:', error);
    alert('Fehler beim Neustarten der Instanz: ' + (error as Error).message);
  } finally {
    actionLoading.value = null;
  }
}

function handleDeleteInstance(id: number): void {
  deleteConfirmId.value = id;
}

async function confirmDelete(): Promise<void> {
  if (deleteConfirmId.value === null) return;

  const id = deleteConfirmId.value;
  actionLoading.value = id;

  try {
    await instancesStore.deleteInstance(id);
    deleteConfirmId.value = null;
  } catch (error) {
    console.error('Failed to delete instance:', error);
    alert('Fehler beim Löschen der Instanz: ' + (error as Error).message);
  } finally {
    actionLoading.value = null;
  }
}

function cancelDelete(): void {
  deleteConfirmId.value = null;
}

function handleViewLogs(id: number): void {
  router.push({ name: 'console', params: { id: id.toString() } });
}
</script>

<template>
  <div class="dashboard-container">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">🖥️</span>
          <h3 class="stat-title">CPU</h3>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ cpuPercentage }}%</div>
          <div class="stat-label">{{ systemStats.cpu.cores }} Kerne</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${cpuPercentage}%` }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">💾</span>
          <h3 class="stat-title">Arbeitsspeicher</h3>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ memoryPercentage.toFixed(1) }}%</div>
          <div class="stat-label">
            {{ systemStats.memory.used }} / {{ systemStats.memory.total }}
            {{ systemStats.memory.unit }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${memoryPercentage}%` }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">💿</span>
          <h3 class="stat-title">Festplatte</h3>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ diskPercentage.toFixed(1) }}%</div>
          <div class="stat-label">
            {{ systemStats.disk.used }} / {{ systemStats.disk.total }}
            {{ systemStats.disk.unit }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${diskPercentage}%` }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">🎮</span>
          <h3 class="stat-title">Server</h3>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ systemStats.servers.online }}</div>
          <div class="stat-label">von {{ systemStats.servers.total }} online</div>
          <div class="progress-bar">
            <div class="progress-fill success" :style="{ width: `${serversPercentage}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="authStore.isAdmin" class="quick-actions">
      <h2 class="section-title">Schnellzugriff</h2>
      <div class="actions-grid">
        <button @click="navigateToUsers" class="action-btn">
          <span class="action-icon">👥</span>
          <span class="action-label">Benutzerverwaltung</span>
        </button>
        <button @click="showCreateForm = true" class="action-btn">
          <span class="action-icon">➕</span>
          <span class="action-label">Neuer Server</span>
        </button>
        <button class="action-btn" disabled>
          <span class="action-icon">⚙️</span>
          <span class="action-label">Einstellungen</span>
        </button>
        <button class="action-btn" disabled>
          <span class="action-icon">📊</span>
          <span class="action-label">Statistiken</span>
        </button>
      </div>
    </div>

    <div class="servers-section">
      <div class="section-header">
        <h2 class="section-title">
          {{ authStore.isAdmin ? 'Alle Server' : 'Ihre zugewiesenen Server' }}
        </h2>
        <button v-if="authStore.isAdmin" class="btn-primary" @click="showCreateForm = true">
          Neuen Server erstellen
        </button>
      </div>

      <div v-if="instancesStore.loading && instancesStore.instances.length === 0" class="loading">
        Lade Server...
      </div>

      <div v-else-if="instancesStore.instances.length > 0" class="servers-grid">
        <InstanceCard
          v-for="instance in instancesStore.instances"
          :key="instance.id"
          :instance="instance"
          :loading="actionLoading === instance.id"
          @start="handleStartInstance"
          @stop="handleStopInstance"
          @restart="handleRestartInstance"
          @delete="handleDeleteInstance"
          @view-logs="handleViewLogs"
        />
      </div>

      <div v-else class="empty-state">
        <p>
          {{
            authStore.isAdmin
              ? 'Noch keine Server vorhanden.'
              : 'Ihnen wurden noch keine Server zugewiesen.'
          }}
        </p>
        <button v-if="authStore.isAdmin" class="btn-primary" @click="showCreateForm = true">
          Ersten Server erstellen
        </button>
      </div>
    </div>

    <InstanceCreateForm
      v-if="showCreateForm"
      @submit="handleCreateInstance"
      @cancel="showCreateForm = false"
    />

    <div v-if="deleteConfirmId !== null" class="modal-overlay" @click.self="cancelDelete">
      <div class="confirm-dialog">
        <h3>Server löschen?</h3>
        <p>
          Möchten Sie diesen Server wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
          werden.
        </p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="cancelDelete">Abbrechen</button>
          <button class="btn btn-danger" @click="confirmDelete">Löschen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  container-type: inline-size;
  container-name: dashboard;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 1.5rem;
}

@container dashboard (min-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: oklch(100% 0 0);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.08);
  border: 1px solid oklch(95% 0 0);
  transition: box-shadow 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.12);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-block-end: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: oklch(50% 0 0);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: oklch(25% 0 0);
}

.stat-label {
  font-size: 0.875rem;
  color: oklch(55% 0 0);
}

.progress-bar {
  block-size: 8px;
  background-color: oklch(95% 0 0);
  border-radius: 4px;
  overflow: hidden;
  margin-block-start: 0.5rem;
}

.progress-fill {
  block-size: 100%;
  background: linear-gradient(90deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.success {
  background: linear-gradient(90deg, oklch(65% 0.15 145) 0%, oklch(55% 0.18 160) 100%);
}

.quick-actions {
  background: oklch(100% 0 0);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.08);
  border: 1px solid oklch(95% 0 0);
}

.section-title {
  margin: 0 0 1.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: oklch(25% 0 0);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 1rem;
}

@container dashboard (min-width: 800px) {
  .actions-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  background: oklch(98% 0 0);
  border: 2px solid oklch(90% 0 0);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
  border-color: transparent;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px oklch(65% 0.15 264 / 0.25);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-icon {
  font-size: 2.5rem;
}

.action-label {
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: center;
}

.servers-section {
  background: oklch(100% 0 0);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.08);
  border: 1px solid oklch(95% 0 0);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px oklch(65% 0.15 264 / 0.35);
}

.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 1.5rem;
}

.loading,
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
}

.loading {
  color: oklch(50% 0 0);
  font-size: 1.0625rem;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: oklch(50% 0 0);
  font-size: 1.0625rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: oklch(0% 0 0 / 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.confirm-dialog {
  background: oklch(100% 0 0);
  border-radius: 16px;
  box-shadow: 0 20px 60px oklch(0% 0 0 / 0.3);
  padding: 2rem;
  max-inline-size: 400px;
  inline-size: 100%;
}

.confirm-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: oklch(25% 0 0);
}

.confirm-dialog p {
  margin: 0 0 1.5rem 0;
  color: oklch(40% 0 0);
  line-height: 1.6;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background-color: oklch(95% 0 0);
  color: oklch(30% 0 0);
  border: 2px solid oklch(85% 0 0);
}

.btn-secondary:hover {
  background-color: oklch(90% 0 0);
}

.btn-danger {
  background-color: oklch(55% 0.18 10);
  color: oklch(100% 0 0);
}

.btn-danger:hover {
  background-color: oklch(45% 0.2 10);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px oklch(55% 0.18 10 / 0.35);
}

@media (width < 768px) {
  .dashboard-container {
    gap: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-primary {
    inline-size: 100%;
  }

  .servers-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Mock system stats (will be replaced with real API data in Phase 2)
const systemStats = ref({
  cpu: { usage: 45, cores: 8 },
  memory: { used: 12.4, total: 32, unit: 'GB' },
  disk: { used: 245, total: 500, unit: 'GB' },
  servers: { online: 2, total: 5 },
});

const cpuPercentage = computed(() => systemStats.value.cpu.usage);
const memoryPercentage = computed(
  () => (systemStats.value.memory.used / systemStats.value.memory.total) * 100
);
const diskPercentage = computed(
  () => (systemStats.value.disk.used / systemStats.value.disk.total) * 100
);
const serversPercentage = computed(
  () => (systemStats.value.servers.online / systemStats.value.servers.total) * 100
);

// Mock server list (will be replaced with real API data in Phase 2)
const servers = ref([
  {
    id: 1,
    name: 'Survival',
    status: 'online',
    players: 3,
    maxPlayers: 20,
    version: '1.20.4',
  },
  {
    id: 2,
    name: 'Creative',
    status: 'online',
    players: 1,
    maxPlayers: 10,
    version: '1.20.4',
  },
  {
    id: 3,
    name: 'Minigames',
    status: 'offline',
    players: 0,
    maxPlayers: 30,
    version: '1.20.4',
  },
]);

function navigateToUsers(): void {
  router.push('/admin/users');
}

function getStatusClass(status: string): string {
  return status === 'online' ? 'status-online' : 'status-offline';
}
</script>

<template>
  <div class="dashboard-container">
    <!-- System Statistics Cards -->
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

    <!-- Quick Actions (Admin only) -->
    <div v-if="authStore.isAdmin" class="quick-actions">
      <h2 class="section-title">Schnellzugriff</h2>
      <div class="actions-grid">
        <button @click="navigateToUsers" class="action-btn">
          <span class="action-icon">👥</span>
          <span class="action-label">Benutzerverwaltung</span>
        </button>
        <button class="action-btn" disabled>
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

    <!-- Server List -->
    <div class="servers-section">
      <div class="section-header">
        <h2 class="section-title">
          {{ authStore.isAdmin ? 'Alle Server' : 'Ihre zugewiesenen Server' }}
        </h2>
        <button v-if="authStore.isAdmin" class="btn-primary" disabled>
          Neuen Server erstellen
        </button>
      </div>

      <div v-if="servers.length > 0" class="servers-grid">
        <div v-for="server in servers" :key="server.id" class="server-card">
          <div class="server-header">
            <h3 class="server-name">{{ server.name }}</h3>
            <span class="server-status" :class="getStatusClass(server.status)">
              {{ server.status === 'online' ? 'Online' : 'Offline' }}
            </span>
          </div>
          <div class="server-info">
            <div class="info-row">
              <span class="info-label">Spieler:</span>
              <span class="info-value">{{ server.players }} / {{ server.maxPlayers }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Version:</span>
              <span class="info-value">{{ server.version }}</span>
            </div>
          </div>
          <div class="server-actions">
            <button class="btn-small" :disabled="server.status === 'online'">Start</button>
            <button class="btn-small" :disabled="server.status === 'offline'">Stop</button>
            <button class="btn-small" disabled>Konsole</button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>Keine Server verfügbar.</p>
        <p class="note">Server-Verwaltung wird in Phase 2 implementiert.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dashboard Container */
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  container-type: inline-size;
  container-name: dashboard;
}

/* System Statistics Grid */
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

/* Quick Actions Section */
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

/* Servers Section */
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Servers Grid */
.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 1.5rem;
}

.server-card {
  background: oklch(98% 0 0);
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid oklch(92% 0 0);
  transition: all 0.2s ease;
}

.server-card:hover {
  border-color: oklch(65% 0.15 264);
  box-shadow: 0 4px 12px oklch(0% 0 0 / 0.1);
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 1rem;
  padding-block-end: 1rem;
  border-block-end: 1px solid oklch(90% 0 0);
}

.server-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: oklch(25% 0 0);
}

.server-status {
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-online {
  background-color: oklch(85% 0.1 145);
  color: oklch(35% 0.15 145);
  border: 2px solid oklch(65% 0.12 145);
}

.status-offline {
  background-color: oklch(85% 0.08 25);
  color: oklch(40% 0.12 25);
  border: 2px solid oklch(70% 0.1 25);
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-block-end: 1.25rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.9375rem;
  color: oklch(50% 0 0);
  font-weight: 500;
}

.info-value {
  font-size: 0.9375rem;
  color: oklch(25% 0 0);
  font-weight: 600;
}

.server-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-small {
  flex: 1;
  padding: 0.625rem 1rem;
  background-color: oklch(95% 0 0);
  color: oklch(25% 0 0);
  border: 2px solid oklch(85% 0 0);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-small:hover:not(:disabled) {
  background-color: oklch(65% 0.15 264);
  color: oklch(100% 0 0);
  border-color: transparent;
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-state p {
  margin: 0 0 0.5rem 0;
  color: oklch(50% 0 0);
  font-size: 1.0625rem;
}

.empty-state p:last-child {
  margin-bottom: 0;
}

.note {
  color: oklch(60% 0 0);
  font-style: italic;
  font-size: 0.9375rem;
}

/* Responsive Design */
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

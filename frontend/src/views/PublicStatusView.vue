<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Instance } from '../types/instance';

const router = useRouter();

const servers = ref<Instance[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const pollingInterval = ref<number | null>(null);

const POLL_INTERVAL_MS = 30000;

async function fetchPublicServers(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch('http://localhost:3000/api/public/servers');
    if (!response.ok) {
      throw new Error('Failed to fetch servers');
    }
    const data = await response.json();
    servers.value = data.servers || [];
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Ein Fehler ist beim Laden der Server aufgetreten';
    console.error('Failed to fetch public servers:', err);
  } finally {
    loading.value = false;
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'running':
      return 'status-online';
    case 'stopped':
      return 'status-offline';
    case 'starting':
      return 'status-starting';
    case 'error':
      return 'status-error';
    default:
      return 'status-offline';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'running':
      return 'Online';
    case 'stopped':
      return 'Offline';
    case 'starting':
      return 'Startet...';
    case 'error':
      return 'Fehler';
    default:
      return 'Unbekannt';
  }
}

function goToLogin(): void {
  router.push('/login');
}

function downloadLauncher(): void {
  alert('Launcher-Download wird in Phase 4 implementiert');
}

onMounted(async () => {
  await fetchPublicServers();

  pollingInterval.value = window.setInterval(() => {
    fetchPublicServers();
  }, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
});
</script>

<template>
  <div class="public-status">
    <header class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Minecraft Kids Server</h1>
        <p class="hero-subtitle">
          Willkommen auf unserem Server-Netzwerk! Wähle einen Server und starte dein Abenteuer.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" @click="downloadLauncher">Launcher herunterladen</button>
          <button class="btn btn-secondary" @click="goToLogin">Admin-Login</button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="servers-section">
        <h2 class="section-title">Server-Status</h2>

        <div v-if="loading && servers.length === 0" class="loading">
          <div class="spinner"></div>
          <p>Lade Server-Status...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button class="btn btn-secondary" @click="fetchPublicServers">Erneut versuchen</button>
        </div>

        <div v-else-if="servers.length > 0" class="servers-grid">
          <div v-for="server in servers" :key="server.id" class="server-card">
            <div class="server-header">
              <h3 class="server-name">{{ server.name }}</h3>
              <span class="server-status" :class="getStatusClass(server.status)">
                {{ getStatusText(server.status) }}
              </span>
            </div>

            <div class="server-info">
              <div class="info-row">
                <span class="info-label">Minecraft:</span>
                <span class="info-value">{{ server.minecraftVersion || 'Standard' }}</span>
              </div>
              <div v-if="server.fabricVersion" class="info-row">
                <span class="info-label">Mods:</span>
                <span class="info-value">Fabric {{ server.fabricVersion }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Max. Spieler:</span>
                <span class="info-value">{{ server.maxPlayers }}</span>
              </div>
              <div v-if="server.geyserEnabled" class="info-row">
                <span class="info-label">Bedrock:</span>
                <span class="info-value">✓ Unterstützt</span>
              </div>
              <div class="info-row server-address">
                <span class="info-label">Server-Adresse:</span>
                <span class="info-value address">{{ server.name }}.mc.minecraft-kids.de</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Derzeit sind keine Server verfügbar.</p>
          <p class="note">Schau später noch einmal vorbei!</p>
        </div>
      </section>

      <section class="info-section">
        <div class="info-card">
          <h3>🎮 Wie kann ich spielen?</h3>
          <ol>
            <li>Lade unseren Launcher herunter</li>
            <li>Installiere den Launcher auf deinem Computer</li>
            <li>Wähle einen Server aus der Liste</li>
            <li>Starte das Spiel und habe Spaß!</li>
          </ol>
        </div>

        <div class="info-card">
          <h3>🔧 Was ist besonders?</h3>
          <ul>
            <li>Automatische Mod-Installation</li>
            <li>Voice Chat mit anderen Spielern</li>
            <li>Bedrock-Unterstützung (Geyser)</li>
            <li>Regelmäßige Updates und Events</li>
          </ul>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>&copy; 2025 Minecraft Kids Server. Alle Rechte vorbehalten.</p>
      <p class="footer-note">
        Status wird alle 30 Sekunden aktualisiert. Letzte Aktualisierung:
        {{ new Date().toLocaleTimeString('de-DE') }}
      </p>
    </footer>
  </div>
</template>

<style scoped>
.public-status {
  min-block-size: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, oklch(98% 0 0) 0%, oklch(95% 0.02 264) 100%);
}

.hero {
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
  padding: 4rem 1.5rem;
  text-align: center;
}

.hero-content {
  max-inline-size: 800px;
  margin: 0 auto;
}

.hero-title {
  margin: 0 0 1rem 0;
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 0 2px 10px oklch(0% 0 0 / 0.3);
}

.hero-subtitle {
  margin: 0 0 2rem 0;
  font-size: 1.25rem;
  opacity: 0.95;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: oklch(100% 0 0);
  color: oklch(65% 0.15 264);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px oklch(0% 0 0 / 0.3);
}

.btn-secondary {
  background-color: transparent;
  color: oklch(100% 0 0);
  border: 2px solid oklch(100% 0 0);
}

.btn-secondary:hover {
  background-color: oklch(100% 0 0);
  color: oklch(65% 0.15 264);
}

.main-content {
  flex: 1;
  max-inline-size: 1200px;
  inline-size: 100%;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.section-title {
  margin: 0 0 2rem 0;
  font-size: 2rem;
  font-weight: 600;
  color: oklch(25% 0 0);
  text-align: center;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1.5rem;
}

.spinner {
  inline-size: 3rem;
  block-size: 3rem;
  border: 4px solid oklch(90% 0 0);
  border-block-start-color: oklch(65% 0.15 264);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  color: oklch(50% 0 0);
  font-size: 1.125rem;
}

.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
}

.error-state p,
.empty-state p {
  margin: 0 0 1rem 0;
  color: oklch(50% 0 0);
  font-size: 1.125rem;
}

.empty-state .note {
  color: oklch(60% 0 0);
  font-style: italic;
}

.servers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 350px), 1fr));
  gap: 2rem;
  margin-block-end: 4rem;
}

.server-card {
  background: oklch(100% 0 0);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.08);
  border: 2px solid oklch(92% 0 0);
  transition: all 0.3s ease;
}

.server-card:hover {
  border-color: oklch(65% 0.15 264);
  box-shadow: 0 8px 24px oklch(0% 0 0 / 0.12);
  transform: translateY(-4px);
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 1.5rem;
  padding-block-end: 1.5rem;
  border-block-end: 2px solid oklch(90% 0 0);
}

.server-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: oklch(25% 0 0);
  text-transform: capitalize;
}

.server-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
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

.status-starting {
  background-color: oklch(85% 0.1 60);
  color: oklch(40% 0.15 60);
  border: 2px solid oklch(70% 0.12 60);
}

.status-error {
  background-color: oklch(85% 0.12 10);
  color: oklch(40% 0.18 10);
  border: 2px solid oklch(70% 0.15 10);
}

.server-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row.server-address {
  margin-block-start: 0.5rem;
  padding-block-start: 1rem;
  border-block-start: 1px dashed oklch(85% 0 0);
}

.info-label {
  font-size: 1rem;
  color: oklch(50% 0 0);
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: oklch(25% 0 0);
  font-weight: 600;
}

.info-value.address {
  font-family: monospace;
  background-color: oklch(95% 0 0);
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 2rem;
  margin-block-start: 3rem;
}

.info-card {
  background: oklch(100% 0 0);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.08);
  border: 2px solid oklch(92% 0 0);
}

.info-card h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: oklch(25% 0 0);
}

.info-card ol,
.info-card ul {
  margin: 0;
  padding-inline-start: 1.5rem;
  line-height: 2;
  color: oklch(35% 0 0);
}

.footer {
  background-color: oklch(25% 0 0);
  color: oklch(90% 0 0);
  padding: 2rem 1.5rem;
  text-align: center;
}

.footer p {
  margin: 0.5rem 0;
}

.footer-note {
  font-size: 0.875rem;
  opacity: 0.7;
}

@media (width < 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .servers-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .info-section {
    grid-template-columns: 1fr;
  }
}
</style>

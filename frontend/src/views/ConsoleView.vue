<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { Instance } from '../types/instance';
import type {
  WSRequest,
  WSResponse,
  WSLogMessage,
  WSRconResponse,
  WSAuthResponse,
  WSErrorMessage,
} from '../types/websocket';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const instanceId = computed(() => parseInt(route.params.id as string, 10));
const instance = ref<Instance | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// WebSocket connection state
const ws = ref<WebSocket | null>(null);
const wsConnected = ref(false);
const wsError = ref<string | null>(null);
const reconnectTimer = ref<number | null>(null);
const reconnectAttempts = ref(0);
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

// Console state
const logs = ref<Array<{ timestamp: string; message: string }>>([]);
const command = ref('');
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const sendingCommand = ref(false);
const logContainer = ref<HTMLElement | null>(null);
const autoScroll = ref(true);

/**
 * Fetch instance details
 */
async function fetchInstance(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`http://localhost:3000/api/instances/${instanceId.value}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Server nicht gefunden');
      } else if (response.status === 403) {
        throw new Error('Keine Berechtigung für diesen Server');
      }
      throw new Error('Fehler beim Laden des Servers');
    }

    const data = await response.json();
    instance.value = data.instance;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten';
    console.error('Failed to fetch instance:', err);
  } finally {
    loading.value = false;
  }
}

/**
 * Connect to WebSocket server
 */
function connectWebSocket(): void {
  if (!authStore.token) {
    wsError.value = 'Nicht authentifiziert';
    return;
  }

  const wsUrl = 'ws://localhost:3000/ws';
  ws.value = new WebSocket(wsUrl);

  ws.value.onopen = () => {
    console.log('WebSocket connected');
    reconnectAttempts.value = 0;

    // Authenticate
    const authMessage: WSRequest = {
      type: 'auth',
      token: authStore.token!,
    };
    ws.value?.send(JSON.stringify(authMessage));
  };

  ws.value.onmessage = (event: MessageEvent) => {
    try {
      const message: WSResponse = JSON.parse(event.data);
      handleWebSocketMessage(message);
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  };

  ws.value.onerror = (event: Event) => {
    console.error('WebSocket error:', event);
    wsError.value = 'WebSocket-Verbindungsfehler';
  };

  ws.value.onclose = () => {
    console.log('WebSocket disconnected');
    wsConnected.value = false;

    // Attempt reconnection
    if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts.value++;
      console.log(`Reconnecting... Attempt ${reconnectAttempts.value}/${MAX_RECONNECT_ATTEMPTS}`);
      reconnectTimer.value = window.setTimeout(() => {
        connectWebSocket();
      }, RECONNECT_DELAY);
    } else {
      wsError.value = 'WebSocket-Verbindung verloren. Seite neu laden um erneut zu verbinden.';
    }
  };
}

/**
 * Handle incoming WebSocket message
 */
function handleWebSocketMessage(message: WSResponse): void {
  switch (message.type) {
    case 'auth':
      handleAuthResponse(message as WSAuthResponse);
      break;

    case 'log':
      handleLogMessage(message as WSLogMessage);
      break;

    case 'rcon_response':
      handleRconResponse(message as WSRconResponse);
      break;

    case 'error':
      handleErrorMessage(message as WSErrorMessage);
      break;

    case 'pong':
      // Heartbeat response, no action needed
      break;

    default:
      console.warn('Unknown WebSocket message type:', message);
  }
}

/**
 * Handle authentication response
 */
function handleAuthResponse(message: WSAuthResponse): void {
  if (message.success) {
    console.log('WebSocket authenticated');
    wsConnected.value = true;
    wsError.value = null;

    // Subscribe to instance logs
    const subscribeMessage: WSRequest = {
      type: 'subscribe',
      instanceId: instanceId.value,
    };
    ws.value?.send(JSON.stringify(subscribeMessage));
  } else {
    wsError.value = message.message || 'Authentifizierung fehlgeschlagen';
    ws.value?.close();
  }
}

/**
 * Handle log message
 */
function handleLogMessage(message: WSLogMessage): void {
  if (message.instanceId === instanceId.value) {
    logs.value.push({
      timestamp: message.timestamp,
      message: message.message,
    });

    // Auto-scroll to bottom if enabled
    if (autoScroll.value) {
      nextTick(() => {
        if (logContainer.value) {
          logContainer.value.scrollTop = logContainer.value.scrollHeight;
        }
      });
    }

    // Limit log buffer to 1000 lines
    if (logs.value.length > 1000) {
      logs.value = logs.value.slice(-1000);
    }
  }
}

/**
 * Handle RCON response
 */
function handleRconResponse(message: WSRconResponse): void {
  if (message.instanceId === instanceId.value) {
    sendingCommand.value = false;

    if (message.success && message.response) {
      // Add command response to logs
      logs.value.push({
        timestamp: new Date().toISOString(),
        message: `> ${message.response}`,
      });
    } else if (message.error) {
      // Show error
      logs.value.push({
        timestamp: new Date().toISOString(),
        message: `[ERROR] ${message.error}`,
      });
    }

    // Auto-scroll
    if (autoScroll.value) {
      nextTick(() => {
        if (logContainer.value) {
          logContainer.value.scrollTop = logContainer.value.scrollHeight;
        }
      });
    }
  }
}

/**
 * Handle error message
 */
function handleErrorMessage(message: WSErrorMessage): void {
  console.error('WebSocket error:', message);
  logs.value.push({
    timestamp: new Date().toISOString(),
    message: `[ERROR] ${message.message}`,
  });
}

/**
 * Send RCON command
 */
function sendCommand(): void {
  if (!command.value.trim() || !wsConnected.value || sendingCommand.value) {
    return;
  }

  const cmd = command.value.trim();

  // Add to history
  commandHistory.value.push(cmd);
  if (commandHistory.value.length > 50) {
    commandHistory.value = commandHistory.value.slice(-50);
  }
  historyIndex.value = -1;

  // Add command to log display
  logs.value.push({
    timestamp: new Date().toISOString(),
    message: `$ ${cmd}`,
  });

  // Send via WebSocket
  const rconMessage: WSRequest = {
    type: 'rcon_command',
    instanceId: instanceId.value,
    command: cmd,
  };

  sendingCommand.value = true;
  ws.value?.send(JSON.stringify(rconMessage));

  // Clear input
  command.value = '';
}

/**
 * Handle command history navigation
 */
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (commandHistory.value.length === 0) return;

    if (historyIndex.value === -1) {
      historyIndex.value = commandHistory.value.length - 1;
    } else if (historyIndex.value > 0) {
      historyIndex.value--;
    }

    command.value = commandHistory.value[historyIndex.value];
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (historyIndex.value === -1) return;

    if (historyIndex.value < commandHistory.value.length - 1) {
      historyIndex.value++;
      command.value = commandHistory.value[historyIndex.value];
    } else {
      historyIndex.value = -1;
      command.value = '';
    }
  } else if (event.key === 'Enter') {
    sendCommand();
  }
}

/**
 * Toggle auto-scroll
 */
function toggleAutoScroll(): void {
  autoScroll.value = !autoScroll.value;
}

/**
 * Clear console
 */
function clearConsole(): void {
  logs.value = [];
}

/**
 * Disconnect WebSocket
 */
function disconnectWebSocket(): void {
  if (reconnectTimer.value) {
    clearTimeout(reconnectTimer.value);
    reconnectTimer.value = null;
  }

  if (ws.value) {
    // Unsubscribe before closing
    if (wsConnected.value) {
      const unsubscribeMessage: WSRequest = {
        type: 'unsubscribe',
        instanceId: instanceId.value,
      };
      ws.value.send(JSON.stringify(unsubscribeMessage));
    }

    ws.value.close();
    ws.value = null;
  }
}

/**
 * Go back to dashboard
 */
function goBack(): void {
  router.push({ name: 'dashboard' });
}

onMounted(async () => {
  await fetchInstance();

  if (!error.value) {
    connectWebSocket();

    // Set up ping interval
    const pingInterval = setInterval(() => {
      if (wsConnected.value && ws.value) {
        const pingMessage: WSRequest = { type: 'ping' };
        ws.value.send(JSON.stringify(pingMessage));
      }
    }, 30000); // 30 seconds

    onUnmounted(() => {
      clearInterval(pingInterval);
    });
  }
});

onUnmounted(() => {
  disconnectWebSocket();
});
</script>

<template>
  <div class="console-view">
    <!-- Header -->
    <header class="console-header">
      <div class="header-content">
        <button class="btn-back" @click="goBack" aria-label="Zurück zum Dashboard">
          <span class="back-icon">←</span>
          Zurück
        </button>

        <div v-if="instance" class="instance-info">
          <h1 class="instance-name">{{ instance.name }}</h1>
          <span class="instance-status" :class="`status-${instance.status}`">
            {{ instance.status === 'running' ? 'Online' : 'Offline' }}
          </span>
        </div>

        <div class="connection-status">
          <span v-if="wsConnected" class="status-indicator connected">
            <span class="indicator-dot"></span>
            Verbunden
          </span>
          <span v-else class="status-indicator disconnected">
            <span class="indicator-dot"></span>
            {{ reconnectAttempts > 0 ? 'Verbinde...' : 'Getrennt' }}
          </span>
        </div>
      </div>
    </header>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <div class="error-card">
        <h2>Fehler</h2>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="goBack">Zurück zum Dashboard</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Lade Konsole...</p>
    </div>

    <!-- Console -->
    <div v-else class="console-container">
      <!-- Toolbar -->
      <div class="console-toolbar">
        <button
          class="btn-toolbar"
          @click="toggleAutoScroll"
          :class="{ active: autoScroll }"
          title="Auto-Scroll"
        >
          <span>{{ autoScroll ? '📌' : '📍' }}</span>
          Auto-Scroll
        </button>
        <button class="btn-toolbar" @click="clearConsole" title="Konsole leeren">
          <span>🗑️</span>
          Leeren
        </button>
      </div>

      <!-- WebSocket Error -->
      <div v-if="wsError" class="ws-error">
        <span class="error-icon">⚠️</span>
        {{ wsError }}
      </div>

      <!-- Log Display -->
      <div ref="logContainer" class="log-container">
        <div v-if="logs.length === 0" class="log-empty">
          <p>Warte auf Server-Logs...</p>
          <p class="note">Logs erscheinen hier sobald der Server gestartet wird.</p>
        </div>
        <div v-for="(log, index) in logs" :key="index" class="log-line">
          <span class="log-timestamp">{{
            new Date(log.timestamp).toLocaleTimeString('de-DE')
          }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>

      <!-- Command Input -->
      <div class="command-input-container">
        <div class="input-wrapper">
          <span class="input-prompt">$</span>
          <input
            v-model="command"
            type="text"
            class="command-input"
            placeholder="RCON-Befehl eingeben... (z.B. list, say Hello, help)"
            :disabled="!wsConnected || sendingCommand || instance?.status !== 'running'"
            @keydown="handleKeyDown"
          />
          <button
            class="btn-send"
            @click="sendCommand"
            :disabled="
              !wsConnected || sendingCommand || !command.trim() || instance?.status !== 'running'
            "
          >
            {{ sendingCommand ? 'Sende...' : 'Senden' }}
          </button>
        </div>
        <div class="input-help">
          <span v-if="instance?.status !== 'running'" class="help-text warning">
            ⚠️ Server muss laufen um Befehle zu senden
          </span>
          <span v-else class="help-text">
            💡 Verwende ↑/↓ um durch den Befehlsverlauf zu navigieren
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.console-view {
  min-block-size: 100vh;
  display: flex;
  flex-direction: column;
  background-color: oklch(15% 0 0);
  color: oklch(90% 0 0);
}

.console-header {
  background-color: oklch(20% 0 0);
  border-block-end: 2px solid oklch(30% 0 0);
  padding: 1rem 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: oklch(25% 0 0);
  color: oklch(85% 0 0);
  border: 1px solid oklch(35% 0 0);
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background-color: oklch(30% 0 0);
  border-color: oklch(45% 0 0);
}

.back-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.instance-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.instance-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: oklch(95% 0 0);
  text-transform: capitalize;
}

.instance-status {
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-running {
  background-color: oklch(35% 0.15 145);
  color: oklch(95% 0 0);
}

.status-stopped,
.status-error {
  background-color: oklch(35% 0.15 25);
  color: oklch(95% 0 0);
}

.connection-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-indicator.connected {
  background-color: oklch(30% 0.1 145);
  color: oklch(85% 0.08 145);
}

.status-indicator.disconnected {
  background-color: oklch(30% 0.1 25);
  color: oklch(85% 0.08 25);
}

.indicator-dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.error-state,
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.error-card {
  background-color: oklch(20% 0 0);
  padding: 2rem;
  border-radius: 12px;
  border: 2px solid oklch(30% 0.1 25);
  text-align: center;
  max-inline-size: 500px;
}

.error-card h2 {
  margin: 0 0 1rem 0;
  color: oklch(85% 0.12 25);
}

.error-card p {
  margin: 0 0 1.5rem 0;
  color: oklch(80% 0 0);
}

.spinner {
  inline-size: 3rem;
  block-size: 3rem;
  border: 4px solid oklch(30% 0 0);
  border-block-start-color: oklch(65% 0.15 264);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin-block-start: 1rem;
  color: oklch(70% 0 0);
  font-size: 1.125rem;
}

.console-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
}

.console-toolbar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: oklch(25% 0 0);
  color: oklch(80% 0 0);
  border: 1px solid oklch(35% 0 0);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-toolbar:hover {
  background-color: oklch(30% 0 0);
  border-color: oklch(45% 0 0);
}

.btn-toolbar.active {
  background-color: oklch(40% 0.12 264);
  border-color: oklch(50% 0.15 264);
  color: oklch(95% 0 0);
}

.ws-error {
  padding: 0.75rem 1rem;
  background-color: oklch(25% 0.08 25);
  border: 1px solid oklch(35% 0.1 25);
  border-radius: 6px;
  color: oklch(85% 0.12 25);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1.25rem;
}

.log-container {
  flex: 1;
  background-color: oklch(18% 0 0);
  border: 1px solid oklch(28% 0 0);
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  min-block-size: 400px;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  color: oklch(60% 0 0);
  text-align: center;
}

.log-empty p {
  margin: 0.5rem 0;
}

.log-empty .note {
  font-size: 0.875rem;
  color: oklch(50% 0 0);
  font-style: italic;
}

.log-line {
  display: flex;
  gap: 1rem;
  margin-block-end: 0.25rem;
  word-wrap: break-word;
}

.log-timestamp {
  color: oklch(60% 0 0);
  flex-shrink: 0;
}

.log-message {
  color: oklch(85% 0 0);
  flex: 1;
  white-space: pre-wrap;
}

.command-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: oklch(20% 0 0);
  border: 2px solid oklch(30% 0 0);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.input-prompt {
  color: oklch(70% 0.15 145);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace;
  font-weight: 700;
  font-size: 1.125rem;
}

.command-input {
  flex: 1;
  background: transparent;
  border: none;
  color: oklch(90% 0 0);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.95rem;
  outline: none;
}

.command-input::placeholder {
  color: oklch(50% 0 0);
}

.command-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-send {
  padding: 0.5rem 1rem;
  background-color: oklch(45% 0.15 264);
  color: oklch(95% 0 0);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-send:hover:not(:disabled) {
  background-color: oklch(55% 0.18 264);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-help {
  padding-inline-start: 1rem;
}

.help-text {
  font-size: 0.875rem;
  color: oklch(60% 0 0);
}

.help-text.warning {
  color: oklch(75% 0.12 60);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: oklch(65% 0.15 264);
  color: oklch(100% 0 0);
}

.btn-primary:hover {
  background-color: oklch(70% 0.18 264);
}

@media (width < 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .instance-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .console-toolbar {
    flex-direction: column;
  }

  .btn-toolbar {
    inline-size: 100%;
  }

  .log-line {
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-wrapper {
    flex-wrap: wrap;
  }

  .btn-send {
    inline-size: 100%;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import type { Instance } from '../types/instance';

interface Props {
  instance: Instance;
  loading?: boolean;
}

interface Emits {
  (e: 'start', id: number): void;
  (e: 'stop', id: number): void;
  (e: 'restart', id: number): void;
  (e: 'delete', id: number): void;
  (e: 'viewLogs', id: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const authStore = useAuthStore();

const isRunning = computed(() => props.instance.status === 'running');
const isStopped = computed(() => props.instance.status === 'stopped');
const isStarting = computed(() => props.instance.status === 'starting');

const statusClass = computed(() => {
  switch (props.instance.status) {
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
});

const statusText = computed(() => {
  switch (props.instance.status) {
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
});

function handleStart(): void {
  emit('start', props.instance.id);
}

function handleStop(): void {
  emit('stop', props.instance.id);
}

function handleRestart(): void {
  emit('restart', props.instance.id);
}

function handleDelete(): void {
  emit('delete', props.instance.id);
}

function handleViewLogs(): void {
  emit('viewLogs', props.instance.id);
}
</script>

<template>
  <div class="server-card">
    <div class="server-header">
      <h3 class="server-name">{{ instance.name }}</h3>
      <span class="server-status" :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <div class="server-info">
      <div class="info-row">
        <span class="info-label">Minecraft:</span>
        <span class="info-value">{{ instance.minecraftVersion || 'Standard' }}</span>
      </div>
      <div v-if="instance.fabricVersion" class="info-row">
        <span class="info-label">Fabric:</span>
        <span class="info-value">{{ instance.fabricVersion }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Max. Spieler:</span>
        <span class="info-value">{{ instance.maxPlayers }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">RAM:</span>
        <span class="info-value">{{ instance.memoryAllocation }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Port:</span>
        <span class="info-value">{{ instance.serverPort }}</span>
      </div>
      <div v-if="instance.geyserEnabled" class="info-row">
        <span class="info-label">Geyser:</span>
        <span class="info-value">✓ Port {{ instance.geyserPort }}</span>
      </div>
    </div>

    <div class="server-actions">
      <button
        class="btn-small btn-success"
        :disabled="isRunning || isStarting || loading"
        @click="handleStart"
      >
        Start
      </button>
      <button class="btn-small btn-danger" :disabled="isStopped || loading" @click="handleStop">
        Stop
      </button>
      <button class="btn-small" :disabled="isStopped || loading" @click="handleRestart">
        Neustart
      </button>
    </div>

    <div class="server-actions-secondary">
      <button class="btn-small btn-info" :disabled="loading" @click="handleViewLogs">
        Konsole
      </button>
      <button
        v-if="authStore.isAdmin"
        class="btn-small btn-danger"
        :disabled="loading"
        @click="handleDelete"
      >
        Löschen
      </button>
    </div>
  </div>
</template>

<style scoped>
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

.server-actions,
.server-actions-secondary {
  display: flex;
  gap: 0.75rem;
}

.server-actions-secondary {
  margin-block-start: 0.75rem;
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

.btn-success {
  background-color: oklch(85% 0.1 145);
  color: oklch(35% 0.15 145);
  border-color: oklch(65% 0.12 145);
}

.btn-success:hover:not(:disabled) {
  background-color: oklch(65% 0.12 145);
  color: oklch(100% 0 0);
  border-color: transparent;
}

.btn-danger {
  background-color: oklch(85% 0.12 10);
  color: oklch(40% 0.18 10);
  border-color: oklch(70% 0.15 10);
}

.btn-danger:hover:not(:disabled) {
  background-color: oklch(55% 0.18 10);
  color: oklch(100% 0 0);
  border-color: transparent;
}

.btn-info {
  background-color: oklch(85% 0.1 230);
  color: oklch(35% 0.15 230);
  border-color: oklch(70% 0.12 230);
}

.btn-info:hover:not(:disabled) {
  background-color: oklch(60% 0.15 230);
  color: oklch(100% 0 0);
  border-color: transparent;
}
</style>

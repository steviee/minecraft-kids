<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CreateInstanceRequest } from '../types/instance';

interface Emits {
  (e: 'submit', data: CreateInstanceRequest): void;
  (e: 'cancel'): void;
}

const emit = defineEmits<Emits>();

interface FormData {
  name: string;
  minecraftVersion: string;
  fabricVersion: string;
  serverPort: number;
  rconPort: number;
  rconPassword: string;
  voiceChatPort: number | null;
  geyserEnabled: boolean;
  geyserPort: number | null;
  maxPlayers: number;
  memoryAllocation: string;
}

const formData = ref<FormData>({
  name: '',
  minecraftVersion: '1.20.4',
  fabricVersion: '',
  serverPort: 25565,
  rconPort: 25575,
  rconPassword: '',
  voiceChatPort: null,
  geyserEnabled: false,
  geyserPort: null,
  maxPlayers: 20,
  memoryAllocation: '2G',
});

const errors = ref<Partial<Record<keyof FormData, string>>>({});

const isValid = computed(() => {
  return (
    formData.value.name.trim().length >= 3 &&
    formData.value.serverPort > 0 &&
    formData.value.rconPort > 0 &&
    formData.value.rconPassword.trim().length > 0 &&
    formData.value.maxPlayers > 0
  );
});

function validateName(): void {
  const name = formData.value.name.trim();
  if (name.length < 3) {
    errors.value.name = 'Name muss mindestens 3 Zeichen lang sein';
  } else if (name.length > 32) {
    errors.value.name = 'Name darf maximal 32 Zeichen lang sein';
  } else if (!/^[a-z0-9-]+$/.test(name)) {
    errors.value.name = 'Name darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten';
  } else if (name.startsWith('-') || name.endsWith('-')) {
    errors.value.name = 'Name darf nicht mit einem Bindestrich beginnen oder enden';
  } else {
    delete errors.value.name;
  }
}

function validatePort(field: 'serverPort' | 'rconPort'): void {
  const port = formData.value[field];
  if (port < 1024 || port > 65535) {
    errors.value[field] = 'Port muss zwischen 1024 und 65535 liegen';
  } else {
    delete errors.value[field];
  }
}

function generateRandomPassword(): void {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  formData.value.rconPassword = password;
}

function handleSubmit(): void {
  if (!isValid.value) {
    return;
  }

  const request: CreateInstanceRequest = {
    name: formData.value.name.trim().toLowerCase(),
    minecraftVersion: formData.value.minecraftVersion || undefined,
    fabricVersion: formData.value.fabricVersion || undefined,
    serverPort: formData.value.serverPort,
    rconPort: formData.value.rconPort,
    rconPassword: formData.value.rconPassword,
    voiceChatPort: formData.value.voiceChatPort || undefined,
    geyserEnabled: formData.value.geyserEnabled,
    geyserPort: formData.value.geyserPort || undefined,
    maxPlayers: formData.value.maxPlayers,
    memoryAllocation: formData.value.memoryAllocation,
  };

  emit('submit', request);
}

function handleCancel(): void {
  emit('cancel');
}
</script>

<template>
  <div class="modal-overlay" @click.self="handleCancel">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Neue Minecraft-Instanz erstellen</h2>
        <button class="close-btn" @click="handleCancel">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="name" class="form-label"> Instanzname <span class="required">*</span> </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ 'input-error': errors.name }"
            placeholder="z.B. survival, creative, minigames"
            @blur="validateName"
          />
          <p v-if="errors.name" class="error-text">{{ errors.name }}</p>
          <p class="help-text">
            Nur Kleinbuchstaben, Zahlen und Bindestriche. Wird im DNS verwendet.
          </p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="minecraftVersion" class="form-label">Minecraft Version</label>
            <input
              id="minecraftVersion"
              v-model="formData.minecraftVersion"
              type="text"
              class="form-input"
              placeholder="1.20.4"
            />
          </div>

          <div class="form-group">
            <label for="fabricVersion" class="form-label">Fabric Version (optional)</label>
            <input
              id="fabricVersion"
              v-model="formData.fabricVersion"
              type="text"
              class="form-input"
              placeholder="z.B. 0.15.3"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="serverPort" class="form-label">
              Server Port <span class="required">*</span>
            </label>
            <input
              id="serverPort"
              v-model.number="formData.serverPort"
              type="number"
              class="form-input"
              :class="{ 'input-error': errors.serverPort }"
              min="1024"
              max="65535"
              @blur="validatePort('serverPort')"
            />
            <p v-if="errors.serverPort" class="error-text">{{ errors.serverPort }}</p>
          </div>

          <div class="form-group">
            <label for="rconPort" class="form-label">
              RCON Port <span class="required">*</span>
            </label>
            <input
              id="rconPort"
              v-model.number="formData.rconPort"
              type="number"
              class="form-input"
              :class="{ 'input-error': errors.rconPort }"
              min="1024"
              max="65535"
              @blur="validatePort('rconPort')"
            />
            <p v-if="errors.rconPort" class="error-text">{{ errors.rconPort }}</p>
          </div>
        </div>

        <div class="form-group">
          <label for="rconPassword" class="form-label">
            RCON Passwort <span class="required">*</span>
          </label>
          <div class="input-with-button">
            <input
              id="rconPassword"
              v-model="formData.rconPassword"
              type="text"
              class="form-input"
              placeholder="Mindestens 8 Zeichen"
            />
            <button type="button" class="btn-generate" @click="generateRandomPassword">
              Generieren
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="maxPlayers" class="form-label">Max. Spieler</label>
            <input
              id="maxPlayers"
              v-model.number="formData.maxPlayers"
              type="number"
              class="form-input"
              min="1"
              max="100"
            />
          </div>

          <div class="form-group">
            <label for="memoryAllocation" class="form-label">RAM Zuteilung</label>
            <select id="memoryAllocation" v-model="formData.memoryAllocation" class="form-input">
              <option value="1G">1 GB</option>
              <option value="2G">2 GB</option>
              <option value="3G">3 GB</option>
              <option value="4G">4 GB</option>
              <option value="6G">6 GB</option>
              <option value="8G">8 GB</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="formData.geyserEnabled" type="checkbox" class="form-checkbox" />
            Geyser aktivieren (Bedrock-Unterstützung)
          </label>
        </div>

        <div v-if="formData.geyserEnabled" class="form-group">
          <label for="geyserPort" class="form-label">Geyser Port (UDP)</label>
          <input
            id="geyserPort"
            v-model.number="formData.geyserPort"
            type="number"
            class="form-input"
            placeholder="19132"
            min="1024"
            max="65535"
          />
        </div>

        <div class="form-group">
          <label for="voiceChatPort" class="form-label">Voice Chat Port (optional, UDP)</label>
          <input
            id="voiceChatPort"
            v-model.number="formData.voiceChatPort"
            type="number"
            class="form-input"
            placeholder="24454"
            min="1024"
            max="65535"
          />
        </div>
      </form>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="handleCancel">Abbrechen</button>
        <button type="button" class="btn btn-primary" :disabled="!isValid" @click="handleSubmit">
          Instanz erstellen
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.modal-container {
  background: oklch(100% 0 0);
  border-radius: 16px;
  box-shadow: 0 20px 60px oklch(0% 0 0 / 0.3);
  max-inline-size: 600px;
  inline-size: 100%;
  max-block-size: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-block-end: 1px solid oklch(90% 0 0);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: oklch(25% 0 0);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: oklch(50% 0 0);
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: oklch(25% 0 0);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-block-end: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  display: block;
  margin-block-end: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: oklch(30% 0 0);
}

.required {
  color: oklch(55% 0.18 10);
}

.form-input {
  inline-size: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  border: 2px solid oklch(85% 0 0);
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: oklch(100% 0 0);
  color: oklch(25% 0 0);
}

.form-input:focus {
  outline: none;
  border-color: oklch(65% 0.15 264);
  box-shadow: 0 0 0 3px oklch(65% 0.15 264 / 0.1);
}

.form-input.input-error {
  border-color: oklch(55% 0.18 10);
}

.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.input-with-button .form-input {
  flex: 1;
}

.btn-generate {
  padding: 0.75rem 1rem;
  background-color: oklch(95% 0 0);
  color: oklch(25% 0 0);
  border: 2px solid oklch(85% 0 0);
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-generate:hover {
  background-color: oklch(65% 0.15 264);
  color: oklch(100% 0 0);
  border-color: transparent;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: oklch(30% 0 0);
  cursor: pointer;
}

.form-checkbox {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  cursor: pointer;
}

.error-text {
  margin: 0.5rem 0 0 0;
  font-size: 0.8125rem;
  color: oklch(55% 0.18 10);
}

.help-text {
  margin: 0.5rem 0 0 0;
  font-size: 0.8125rem;
  color: oklch(55% 0 0);
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-block-start: 1px solid oklch(90% 0 0);
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

.btn-primary {
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
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

@media (width < 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-container {
    max-block-size: 95vh;
  }
}
</style>

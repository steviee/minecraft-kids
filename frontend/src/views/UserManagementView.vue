<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { authApi, usersApi } from '../api/client';
import { AxiosError } from 'axios';
import type { User, RegisterRequest, ApiError } from '../types/auth';

const router = useRouter();
const authStore = useAuthStore();

const users = ref<User[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingUser = ref<User | null>(null);

const formData = ref<RegisterRequest>({
  username: '',
  email: '',
  password: '',
  role: 'junior-admin',
});

const formErrors = ref({
  username: '',
  email: '',
  password: '',
});

async function fetchUsers(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    users.value = await usersApi.getAll();
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      errorMessage.value =
        apiError?.error || 'Benutzer konnten nicht geladen werden.';
    } else {
      errorMessage.value = 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  } finally {
    isLoading.value = false;
  }
}

function openCreateModal(): void {
  formData.value = {
    username: '',
    email: '',
    password: '',
    role: 'junior-admin',
  };
  formErrors.value = {
    username: '',
    email: '',
    password: '',
  };
  showCreateModal.value = true;
}

function closeCreateModal(): void {
  showCreateModal.value = false;
}

function openEditModal(user: User): void {
  editingUser.value = user;
  formData.value = {
    username: user.username,
    email: user.email,
    password: '',
    role: user.role,
  };
  formErrors.value = {
    username: '',
    email: '',
    password: '',
  };
  showEditModal.value = true;
}

function closeEditModal(): void {
  showEditModal.value = false;
  editingUser.value = null;
}

function validateForm(isEdit: boolean): boolean {
  let isValid = true;

  if (!formData.value.username.trim()) {
    formErrors.value.username = 'Benutzername ist erforderlich';
    isValid = false;
  } else if (formData.value.username.length < 3) {
    formErrors.value.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
    isValid = false;
  } else {
    formErrors.value.username = '';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.value.email.trim()) {
    formErrors.value.email = 'E-Mail ist erforderlich';
    isValid = false;
  } else if (!emailRegex.test(formData.value.email)) {
    formErrors.value.email = 'Ungültige E-Mail-Adresse';
    isValid = false;
  } else {
    formErrors.value.email = '';
  }

  if (!isEdit) {
    if (!formData.value.password) {
      formErrors.value.password = 'Passwort ist erforderlich';
      isValid = false;
    } else if (formData.value.password.length < 6) {
      formErrors.value.password = 'Passwort muss mindestens 6 Zeichen lang sein';
      isValid = false;
    } else {
      formErrors.value.password = '';
    }
  } else {
    if (formData.value.password && formData.value.password.length < 6) {
      formErrors.value.password = 'Passwort muss mindestens 6 Zeichen lang sein';
      isValid = false;
    } else {
      formErrors.value.password = '';
    }
  }

  return isValid;
}

async function handleCreateUser(): Promise<void> {
  if (!validateForm(false)) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await authApi.register(formData.value);
    await fetchUsers();
    closeCreateModal();
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      errorMessage.value =
        apiError?.error || 'Benutzer konnte nicht erstellt werden.';
    } else {
      errorMessage.value = 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleUpdateUser(): Promise<void> {
  if (!editingUser.value) return;

  if (!validateForm(true)) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const updateData: Partial<RegisterRequest> = {
      username: formData.value.username,
      email: formData.value.email,
      role: formData.value.role,
    };

    if (formData.value.password) {
      updateData.password = formData.value.password;
    }

    await usersApi.update(editingUser.value.id, updateData);
    await fetchUsers();
    closeEditModal();
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      errorMessage.value =
        apiError?.error || 'Benutzer konnte nicht aktualisiert werden.';
    } else {
      errorMessage.value = 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleDeleteUser(user: User): Promise<void> {
  if (
    !confirm(
      `Möchten Sie den Benutzer "${user.username}" wirklich löschen?`
    )
  ) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await usersApi.delete(user.id);
    await fetchUsers();
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      errorMessage.value =
        apiError?.error || 'Benutzer konnte nicht gelöscht werden.';
    } else {
      errorMessage.value = 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  } finally {
    isLoading.value = false;
  }
}

function goToDashboard(): void {
  router.push('/dashboard');
}

function handleLogout(): void {
  authStore.logout();
  router.push('/login');
}

onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="user-management-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>Benutzerverwaltung</h1>
        <div class="user-info">
          <span class="username">{{ authStore.user?.username }}</span>
          <button @click="goToDashboard" class="btn btn-secondary">
            Dashboard
          </button>
          <button @click="handleLogout" class="btn btn-secondary">
            Abmelden
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div v-if="errorMessage" class="alert alert-error" role="alert">
        {{ errorMessage }}
      </div>

      <div class="actions-bar">
        <button @click="openCreateModal" class="btn btn-primary">
          Neuen Benutzer erstellen
        </button>
        <button @click="fetchUsers" class="btn btn-outline" :disabled="isLoading">
          Aktualisieren
        </button>
      </div>

      <div v-if="isLoading && users.length === 0" class="loading">
        Lädt Benutzer...
      </div>

      <div v-else-if="users.length > 0" class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Benutzername</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Erstellt am</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span
                  class="role-badge"
                  :class="{
                    admin: user.role === 'admin',
                    'junior-admin': user.role === 'junior-admin',
                  }"
                >
                  {{ user.role }}
                </span>
              </td>
              <td>{{ new Date(user.created_at).toLocaleDateString('de-DE') }}</td>
              <td class="actions">
                <button
                  @click="openEditModal(user)"
                  class="btn btn-small btn-edit"
                  :disabled="isLoading"
                >
                  Bearbeiten
                </button>
                <button
                  @click="handleDeleteUser(user)"
                  class="btn btn-small btn-delete"
                  :disabled="isLoading || user.id === authStore.user?.id"
                  :title="
                    user.id === authStore.user?.id
                      ? 'Sie können sich nicht selbst löschen'
                      : ''
                  "
                >
                  Löschen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="no-users">
        <p>Keine Benutzer gefunden.</p>
      </div>
    </main>

    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Neuen Benutzer erstellen</h2>
          <button @click="closeCreateModal" class="close-btn" aria-label="Schließen">
            &times;
          </button>
        </div>

        <form @submit.prevent="handleCreateUser">
          <div class="form-group">
            <label for="create-username">Benutzername</label>
            <input
              id="create-username"
              v-model="formData.username"
              type="text"
              :class="{ error: formErrors.username }"
              :disabled="isLoading"
              required
              aria-describedby="create-username-error"
            />
            <span
              v-if="formErrors.username"
              id="create-username-error"
              class="error-text"
              role="alert"
            >
              {{ formErrors.username }}
            </span>
          </div>

          <div class="form-group">
            <label for="create-email">E-Mail</label>
            <input
              id="create-email"
              v-model="formData.email"
              type="email"
              :class="{ error: formErrors.email }"
              :disabled="isLoading"
              required
              aria-describedby="create-email-error"
            />
            <span
              v-if="formErrors.email"
              id="create-email-error"
              class="error-text"
              role="alert"
            >
              {{ formErrors.email }}
            </span>
          </div>

          <div class="form-group">
            <label for="create-password">Passwort</label>
            <input
              id="create-password"
              v-model="formData.password"
              type="password"
              :class="{ error: formErrors.password }"
              :disabled="isLoading"
              required
              aria-describedby="create-password-error"
            />
            <span
              v-if="formErrors.password"
              id="create-password-error"
              class="error-text"
              role="alert"
            >
              {{ formErrors.password }}
            </span>
          </div>

          <div class="form-group">
            <label for="create-role">Rolle</label>
            <select
              id="create-role"
              v-model="formData.role"
              :disabled="isLoading"
              required
            >
              <option value="admin">admin</option>
              <option value="junior-admin">junior-admin</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeCreateModal" class="btn btn-outline">
              Abbrechen
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Benutzer bearbeiten</h2>
          <button @click="closeEditModal" class="close-btn" aria-label="Schließen">
            &times;
          </button>
        </div>

        <form @submit.prevent="handleUpdateUser">
          <div class="form-group">
            <label for="edit-username">Benutzername</label>
            <input
              id="edit-username"
              v-model="formData.username"
              type="text"
              :class="{ error: formErrors.username }"
              :disabled="isLoading"
              required
              aria-describedby="edit-username-error"
            />
            <span
              v-if="formErrors.username"
              id="edit-username-error"
              class="error-text"
              role="alert"
            >
              {{ formErrors.username }}
            </span>
          </div>

          <div class="form-group">
            <label for="edit-email">E-Mail</label>
            <input
              id="edit-email"
              v-model="formData.email"
              type="email"
              :class="{ error: formErrors.email }"
              :disabled="isLoading"
              required
              aria-describedby="edit-email-error"
            />
            <span
              v-if="formErrors.email"
              id="edit-email-error"
              class="error-text"
              role="alert"
            >
              {{ formErrors.email }}
            </span>
          </div>

          <div class="form-group">
            <label for="edit-password">Neues Passwort (optional)</label>
            <input
              id="edit-password"
              v-model="formData.password"
              type="password"
              :class="{ error: formErrors.password }"
              :disabled="isLoading"
              placeholder="Leer lassen, um nicht zu ändern"
              aria-describedby="edit-password-error"
            />
            <span
              v-if="formErrors.password"
              id="edit-password-error"
              class="error-text"
              role="alert"
            >
              {{ formErrors.password }}
            </span>
          </div>

          <div class="form-group">
            <label for="edit-role">Rolle</label>
            <select
              id="edit-role"
              v-model="formData.role"
              :disabled="isLoading"
              required
            >
              <option value="admin">admin</option>
              <option value="junior-admin">junior-admin</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn btn-outline">
              Abbrechen
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              Aktualisieren
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-management-container {
  min-height: 100vh;
  background-color: #f7fafc;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 1.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-weight: 600;
  font-size: 1.1rem;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.alert-error {
  background-color: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.actions-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.loading,
.no-users {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.users-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background-color: #f7fafc;
}

.users-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e1e8ed;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #e1e8ed;
}

.users-table tbody tr:hover {
  background-color: #f7fafc;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin {
  background-color: #667eea;
  color: white;
}

.role-badge.junior-admin {
  background-color: #e1e8ed;
  color: #333;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.btn-outline {
  background-color: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover:not(:disabled) {
  background-color: #667eea;
  color: white;
}

.btn-edit {
  background-color: #4299e1;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background-color: #3182ce;
}

.btn-delete {
  background-color: #e53e3e;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background-color: #c53030;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.close-btn:hover {
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

input,
select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #667eea;
}

input.error {
  border-color: #e53e3e;
}

input:disabled,
select:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

.error-text {
  display: block;
  margin-top: 0.5rem;
  color: #e53e3e;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}
</style>

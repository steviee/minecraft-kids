<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

function handleLogout(): void {
  authStore.logout();
  router.push('/login');
}

function navigateToUsers(): void {
  router.push('/admin/users');
}
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div class="header-content">
        <h1>MCK Suite Dashboard</h1>
        <div class="user-info">
          <span class="username">{{ authStore.user?.username }}</span>
          <span
            class="role-badge"
            :class="{
              admin: authStore.isAdmin,
              'junior-admin': authStore.isJuniorAdmin,
            }"
          >
            {{ authStore.user?.role }}
          </span>
          <button @click="handleLogout" class="btn btn-secondary">Abmelden</button>
        </div>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="welcome-card">
        <h2>Willkommen, {{ authStore.user?.username }}!</h2>
        <p>
          Sie sind als <strong>{{ authStore.user?.role }}</strong> angemeldet.
        </p>
      </div>

      <div v-if="authStore.isAdmin" class="admin-section">
        <h3>Administratorfunktionen</h3>
        <div class="admin-actions">
          <button @click="navigateToUsers" class="btn btn-primary">Benutzerverwaltung</button>
          <button class="btn btn-outline" disabled>Server-Instanzen (Bald verfügbar)</button>
          <button class="btn btn-outline" disabled>Einstellungen (Bald verfügbar)</button>
        </div>
      </div>

      <div v-else class="junior-admin-section">
        <h3>Ihre zugewiesenen Server</h3>
        <div class="info-card">
          <p>Hier werden Ihre zugewiesenen Minecraft-Server-Instanzen angezeigt.</p>
          <p class="note">Diese Funktion wird in Phase 2 implementiert.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Modern 2025 CSS for Dashboard */
.dashboard-container {
  min-block-size: 100vh;
  min-block-size: 100dvh;
  background-color: oklch(97% 0 0);
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
  padding-block: 1.5rem;
  padding-inline: clamp(1rem, 4vw, 3rem);
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.1);
}

.header-content {
  max-inline-size: min(1600px, 90vw);
  margin-inline: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(0.75rem, 2vw, 1.5rem);
}

@media (width < 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-content h1 {
    font-size: clamp(1.25rem, 4vw, 1.5rem);
  }
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

.role-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin {
  background-color: rgba(255, 255, 255, 0.25);
  border: 2px solid white;
}

.role-badge.junior-admin {
  background-color: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.dashboard-main {
  inline-size: 100%;
  max-inline-size: min(1600px, 90vw);
  margin-inline: auto;
  padding-block: clamp(1.5rem, 3vw, 3rem);
  padding-inline: clamp(1rem, 4vw, 3rem);
  flex: 1;
  container-type: inline-size;
  container-name: dashboard-main;
  box-sizing: border-box;
}

@media (width < 768px) {
  .dashboard-main {
    padding-block: 1.5rem;
    padding-inline: 1rem;
  }
}

.welcome-card {
  background: oklch(100% 0 0);
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border-radius: 16px;
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.08);
  margin-block-end: clamp(1.5rem, 3vw, 2.5rem);
  border: 1px solid oklch(95% 0 0);
}

.welcome-card h2 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.75rem;
}

.welcome-card p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.admin-section,
.junior-admin-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.admin-section h3,
.junior-admin-section h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.admin-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
}

/* Use container queries for better responsiveness */
@container dashboard-main (min-width: 900px) {
  .admin-actions {
    grid-template-columns: repeat(3, 1fr);
  }
}

@container dashboard-main (min-width: 1200px) {
  .admin-actions {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

.info-card {
  background-color: #f7fafc;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.info-card p {
  margin: 0 0 0.75rem 0;
  color: #333;
}

.info-card p:last-child {
  margin-bottom: 0;
}

.note {
  color: #666;
  font-style: italic;
  font-size: 0.95rem;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>

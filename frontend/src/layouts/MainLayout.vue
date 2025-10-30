<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isSidebarCollapsed = ref(false);

interface NavItem {
  label: string;
  path: string;
  icon: string;
  requiresAdmin?: boolean;
}

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [{ label: 'Dashboard', path: '/dashboard', icon: '📊' }];

  if (authStore.isAdmin) {
    items.push(
      { label: 'Benutzerverwaltung', path: '/admin/users', icon: '👥', requiresAdmin: true },
      { label: 'Server-Instanzen', path: '/admin/servers', icon: '🖥️', requiresAdmin: true },
      { label: 'Einstellungen', path: '/admin/settings', icon: '⚙️', requiresAdmin: true }
    );
  }

  return items;
});

function toggleSidebar(): void {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function handleLogout(): void {
  authStore.logout();
  router.push('/login');
}

function isActiveRoute(path: string): boolean {
  return route.path === path;
}
</script>

<template>
  <div class="main-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <h1 v-if="!isSidebarCollapsed" class="sidebar-title">MCK Suite</h1>
        <h1 v-else class="sidebar-title-collapsed">MCK</h1>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActiveRoute(item.path) }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!isSidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button
          @click="toggleSidebar"
          class="toggle-btn"
          :title="isSidebarCollapsed ? 'Expand' : 'Collapse'"
        >
          <span v-if="!isSidebarCollapsed">◀</span>
          <span v-else>▶</span>
        </button>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="main-content">
      <!-- Top header bar -->
      <header class="top-header">
        <div class="header-left">
          <h2 class="page-title">{{ route.meta.title || 'Dashboard' }}</h2>
        </div>
        <div class="header-right">
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
          </div>
          <button @click="handleLogout" class="btn-logout">Abmelden</button>
        </div>
      </header>

      <!-- Page content (router-view) -->
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Main Layout Grid */
.main-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-block-size: 100vh;
  min-block-size: 100dvh;
  background-color: oklch(97% 0 0);
  transition: grid-template-columns 0.3s ease;
}

.main-layout:has(.sidebar.collapsed) {
  grid-template-columns: 70px 1fr;
}

/* Sidebar */
.sidebar {
  background: linear-gradient(180deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
  display: flex;
  flex-direction: column;
  border-inline-end: 1px solid oklch(90% 0 0);
  box-shadow: 2px 0 8px oklch(0% 0 0 / 0.1);
  position: sticky;
  top: 0;
  block-size: 100vh;
  block-size: 100dvh;
  transition: all 0.3s ease;
}

.sidebar-header {
  padding: 1.5rem;
  border-block-end: 1px solid oklch(100% 0 0 / 0.2);
}

.sidebar-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}

.sidebar-title-collapsed {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
}

.sidebar-nav {
  flex: 1;
  padding-block: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: oklch(100% 0 0);
  text-decoration: none;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  border-inline-start: 4px solid transparent;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding-inline: 1rem;
}

.nav-item:hover {
  background-color: oklch(100% 0 0 / 0.15);
}

.nav-item.active {
  background-color: oklch(100% 0 0 / 0.25);
  border-inline-start-color: oklch(100% 0 0);
  font-weight: 600;
}

.nav-icon {
  font-size: 1.5rem;
  inline-size: 1.5rem;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  font-size: 1rem;
}

.sidebar-footer {
  padding: 1rem;
  border-block-start: 1px solid oklch(100% 0 0 / 0.2);
}

.toggle-btn {
  inline-size: 100%;
  padding: 0.75rem;
  background-color: oklch(100% 0 0 / 0.2);
  border: none;
  color: oklch(100% 0 0);
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.toggle-btn:hover {
  background-color: oklch(100% 0 0 / 0.3);
}

/* Main Content Area */
.main-content {
  display: flex;
  flex-direction: column;
  min-block-size: 100vh;
  min-block-size: 100dvh;
  overflow-x: hidden;
}

/* Top Header */
.top-header {
  background: oklch(100% 0 0);
  padding: 1.25rem 2rem;
  border-block-end: 1px solid oklch(90% 0 0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px oklch(0% 0 0 / 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  color: oklch(25% 0 0);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.username {
  font-weight: 600;
  color: oklch(25% 0 0);
  font-size: 1rem;
}

.role-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin {
  background: linear-gradient(135deg, oklch(65% 0.15 264) 0%, oklch(55% 0.18 308) 100%);
  color: oklch(100% 0 0);
}

.role-badge.junior-admin {
  background-color: oklch(90% 0.05 264);
  color: oklch(45% 0.15 264);
  border: 2px solid oklch(65% 0.15 264);
}

.btn-logout {
  padding: 0.625rem 1.25rem;
  background-color: oklch(95% 0 0);
  color: oklch(25% 0 0);
  border: 2px solid oklch(85% 0 0);
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background-color: oklch(90% 0 0);
  border-color: oklch(75% 0 0);
}

/* Page Content */
.page-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  container-type: inline-size;
  container-name: page-content;
}

/* Responsive Design */
@media (width < 1024px) {
  .main-layout {
    grid-template-columns: 70px 1fr;
  }

  .sidebar {
    inline-size: 70px;
  }

  .sidebar-title,
  .nav-label {
    display: none;
  }

  .sidebar-title-collapsed {
    display: block;
  }

  .nav-item {
    justify-content: center;
    padding-inline: 1rem;
  }
}

@media (width < 768px) {
  .top-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .header-right {
    inline-size: 100%;
    justify-content: space-between;
  }

  .page-content {
    padding: 1rem;
  }
}
</style>

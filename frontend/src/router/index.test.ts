import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import type { Router } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { User } from '../types/auth';

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        redirect: '/dashboard',
      },
      {
        path: '/login',
        name: 'login',
        component: { template: '<div>Login</div>' },
        meta: { requiresGuest: true },
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: { template: '<div>Dashboard</div>' },
        meta: { requiresAuth: true },
      },
      {
        path: '/admin/users',
        name: 'users',
        component: { template: '<div>Users</div>' },
        meta: { requiresAuth: true, requiresAdmin: true },
      },
    ],
  });
}

describe('Router Guards', () => {
  let router: Router;
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    router = createTestRouter();
    authStore = useAuthStore();

    router.beforeEach((to, _from, next) => {
      const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
      const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
      const requiresGuest = to.matched.some((record) => record.meta.requiresGuest);

      if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login', query: { redirect: to.fullPath } });
        return;
      }

      if (requiresAdmin && !authStore.isAdmin) {
        next({ name: 'dashboard' });
        return;
      }

      if (requiresGuest && authStore.isAuthenticated) {
        next({ name: 'dashboard' });
        return;
      }

      next();
    });
  });

  it('redirects to login when accessing protected route without authentication', async () => {
    await router.push('/dashboard');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard');
  });

  it('allows access to protected route when authenticated', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    authStore.user = mockUser;
    authStore.accessToken = 'test-token';
    authStore.refreshToken = 'refresh-token';

    await router.push('/dashboard');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('redirects junior-admin from admin-only route to dashboard', async () => {
    const mockUser: User = {
      id: 2,
      username: 'junioradmin',
      email: 'junior@example.com',
      role: 'junior-admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    authStore.user = mockUser;
    authStore.accessToken = 'test-token';
    authStore.refreshToken = 'refresh-token';

    await router.push('/admin/users');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('allows admin to access admin-only routes', async () => {
    const mockUser: User = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    authStore.user = mockUser;
    authStore.accessToken = 'test-token';
    authStore.refreshToken = 'refresh-token';

    await router.push('/admin/users');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('users');
  });

  it('redirects authenticated user from login page to dashboard', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    authStore.user = mockUser;
    authStore.accessToken = 'test-token';
    authStore.refreshToken = 'refresh-token';

    await router.push('/login');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('allows unauthenticated user to access login page', async () => {
    await router.push('/login');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('login');
  });

  it('redirects root path to dashboard', async () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    authStore.user = mockUser;
    authStore.accessToken = 'test-token';
    authStore.refreshToken = 'refresh-token';

    await router.push('/');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('dashboard');
  });
});

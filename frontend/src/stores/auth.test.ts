import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';
import { authApi } from '../api/client';
import type { LoginResponse, User } from '../types/auth';

vi.mock('../api/client', () => ({
  authApi: {
    login: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null state when no stored data exists', () => {
    const store = useAuthStore();

    expect(store.user).toBeNull();
    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isAdmin).toBe(false);
    expect(store.isJuniorAdmin).toBe(false);
  });

  it('loads data from localStorage on initialization', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    localStorage.setItem('accessToken', 'test-access-token');
    localStorage.setItem('refreshToken', 'test-refresh-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    setActivePinia(createPinia());
    const store = useAuthStore();

    expect(store.accessToken).toBe('test-access-token');
    expect(store.refreshToken).toBe('test-refresh-token');
    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(true);
  });

  it('successfully logs in and stores data', async () => {
    const store = useAuthStore();
    const mockResponse: LoginResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: {
        id: 2,
        username: 'junioradmin',
        email: 'junior@example.com',
        role: 'junior-admin',
        created_at: '2025-10-30T00:00:00Z',
      },
    };

    vi.mocked(authApi.login).mockResolvedValue(mockResponse);

    await store.login({
      email: 'junior@example.com',
      password: 'password123',
    });

    expect(store.accessToken).toBe('new-access-token');
    expect(store.refreshToken).toBe('new-refresh-token');
    expect(store.user).toEqual(mockResponse.user);
    expect(store.isAuthenticated).toBe(true);
    expect(store.isJuniorAdmin).toBe(true);
    expect(store.isAdmin).toBe(false);

    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
  });

  it('clears state on login failure', async () => {
    const store = useAuthStore();

    vi.mocked(authApi.login).mockRejectedValue(new Error('Login failed'));

    await expect(
      store.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow('Login failed');

    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('logs out and clears all data', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    localStorage.setItem('accessToken', 'test-access-token');
    localStorage.setItem('refreshToken', 'test-refresh-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    setActivePinia(createPinia());
    const store = useAuthStore();

    expect(store.isAuthenticated).toBe(true);

    store.logout();

    expect(store.accessToken).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('refreshes access token successfully', async () => {
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        username: 'test',
        email: 'test@example.com',
        role: 'admin',
        created_at: '2025-10-30T00:00:00Z',
      })
    );

    setActivePinia(createPinia());
    const storeWithData = useAuthStore();

    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'new-access-token',
    });

    await storeWithData.refreshAccessToken();

    expect(storeWithData.accessToken).toBe('new-access-token');
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
  });

  it('logs out on refresh token failure', async () => {
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        username: 'test',
        email: 'test@example.com',
        role: 'admin',
        created_at: '2025-10-30T00:00:00Z',
      })
    );

    setActivePinia(createPinia());
    const storeWithData = useAuthStore();

    vi.mocked(authApi.refresh).mockRejectedValue(new Error('Refresh failed'));

    await expect(storeWithData.refreshAccessToken()).rejects.toThrow('Refresh failed');

    expect(storeWithData.accessToken).toBeNull();
    expect(storeWithData.refreshToken).toBeNull();
    expect(storeWithData.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('checkAuth returns true when authenticated', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      created_at: '2025-10-30T00:00:00Z',
    };

    localStorage.setItem('accessToken', 'test-access-token');
    localStorage.setItem('refreshToken', 'test-refresh-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const store = useAuthStore();

    expect(store.checkAuth()).toBe(true);
  });

  it('checkAuth returns false when not authenticated', () => {
    const store = useAuthStore();

    expect(store.checkAuth()).toBe(false);
  });
});

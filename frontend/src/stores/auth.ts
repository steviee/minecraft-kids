import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/client';
import type { User, LoginRequest } from '../types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isJuniorAdmin = computed(() => user.value?.role === 'junior-admin');

  function loadFromStorage(): void {
    const storedToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedRefreshToken && storedUser) {
      accessToken.value = storedToken;
      refreshToken.value = storedRefreshToken;
      try {
        user.value = JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        clearStorage();
      }
    }
  }

  function saveToStorage(newAccessToken: string, newRefreshToken: string, newUser: User): void {
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  function clearStorage(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async function login(credentials: LoginRequest): Promise<void> {
    try {
      const response = await authApi.login(credentials);

      accessToken.value = response.accessToken;
      refreshToken.value = response.refreshToken;
      user.value = response.user;

      saveToStorage(response.accessToken, response.refreshToken, response.user);
    } catch (error) {
      clearStorage();
      accessToken.value = null;
      refreshToken.value = null;
      user.value = null;
      throw error;
    }
  }

  function logout(): void {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    clearStorage();
  }

  async function refreshAccessToken(): Promise<void> {
    try {
      const response = await authApi.refresh();
      accessToken.value = response.accessToken;
      localStorage.setItem('accessToken', response.accessToken);
    } catch (error) {
      logout();
      throw error;
    }
  }

  function checkAuth(): boolean {
    loadFromStorage();
    return isAuthenticated.value;
  }

  loadFromStorage();

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isAdmin,
    isJuniorAdmin,
    login,
    logout,
    refreshAccessToken,
    checkAuth,
  };
});

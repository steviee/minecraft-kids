import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth';
import type {
  CreateInstanceRequest,
  UpdateInstanceRequest,
  InstanceOperationResponse,
  ListInstancesResponse,
  InstanceActionResponse,
  InstanceLogsResponse,
} from '../types/instance';

const API_BASE_URL = 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        onTokenRefreshed(accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/api/auth/register', userData);
    return response.data;
  },

  refresh: async (): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post<RefreshTokenResponse>('/api/auth/refresh');
    return response.data;
  },
};

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/api/users/${id}`);
    return response.data;
  },

  update: async (id: number, userData: Partial<RegisterRequest>): Promise<User> => {
    const response = await apiClient.put<User>(`/api/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },
};

export const instancesApi = {
  getAll: async (): Promise<ListInstancesResponse> => {
    const response = await apiClient.get<ListInstancesResponse>('/api/instances');
    return response.data;
  },

  getById: async (id: number): Promise<InstanceOperationResponse> => {
    const response = await apiClient.get<InstanceOperationResponse>(`/api/instances/${id}`);
    return response.data;
  },

  create: async (data: CreateInstanceRequest): Promise<InstanceOperationResponse> => {
    const response = await apiClient.post<InstanceOperationResponse>('/api/instances', data);
    return response.data;
  },

  update: async (id: number, data: UpdateInstanceRequest): Promise<InstanceOperationResponse> => {
    const response = await apiClient.patch<InstanceOperationResponse>(`/api/instances/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/instances/${id}`);
  },

  start: async (id: number): Promise<InstanceActionResponse> => {
    const response = await apiClient.post<InstanceActionResponse>(`/api/instances/${id}/start`);
    return response.data;
  },

  stop: async (id: number): Promise<InstanceActionResponse> => {
    const response = await apiClient.post<InstanceActionResponse>(`/api/instances/${id}/stop`);
    return response.data;
  },

  restart: async (id: number): Promise<InstanceActionResponse> => {
    const response = await apiClient.post<InstanceActionResponse>(`/api/instances/${id}/restart`);
    return response.data;
  },

  getLogs: async (id: number, tail = 100): Promise<InstanceLogsResponse> => {
    const response = await apiClient.get<InstanceLogsResponse>(`/api/instances/${id}/logs`, {
      params: { tail },
    });
    return response.data;
  },
};

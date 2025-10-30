export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'junior-admin';
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'junior-admin';
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'junior-admin';
  created_at: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

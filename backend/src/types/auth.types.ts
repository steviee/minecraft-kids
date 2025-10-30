/**
 * Authentication-related TypeScript type definitions
 * Minecraft Kids Server Management Suite
 */

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  userId: number;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Decoded refresh token payload
 */
export interface RefreshTokenPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

/**
 * User registration request body
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'junior-admin';
}

/**
 * User registration response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * User login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * User login response with tokens
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Refresh token request body
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken?: string;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Username validation result
 */
export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

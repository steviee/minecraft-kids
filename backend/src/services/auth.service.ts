/**
 * Authentication Service
 * Handles password hashing, JWT token generation and verification
 */

import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import {
  TokenPayload,
  RefreshTokenPayload,
  PasswordValidationResult,
  EmailValidationResult,
  UsernameValidationResult,
} from '../types/auth.types';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 */
const SALT_ROUNDS = 12;

/**
 * JWT configuration from environment variables
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-change-this';
const REFRESH_TOKEN_EXPIRES_IN: string | number = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Hash a plain text password using bcrypt
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error(
      `Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password Plain text password to check
 * @param hash Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    throw new Error(
      `Failed to compare passwords: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a JWT access token
 * @param userId User ID to include in token
 * @param role User role to include in token
 * @returns Signed JWT access token
 */
export function generateAccessToken(userId: number, role: string): string {
  try {
    const payload = {
      userId,
      role,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);

    return token;
  } catch (error) {
    throw new Error(
      `Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a JWT refresh token
 * @param userId User ID to include in token
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(userId: number): string {
  try {
    const payload = {
      userId,
    };

    const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    } as SignOptions);

    return token;
  } catch (error) {
    throw new Error(
      `Failed to generate refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify and decode a JWT access token
 * @param token JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      throw new Error(
        `Failed to verify access token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Verify and decode a JWT refresh token
 * @param token JWT refresh token to verify
 * @returns Decoded refresh token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error(
        `Failed to verify refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Validate password strength
 * Requirements: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
 * @param password Password to validate
 * @returns Validation result with errors if any
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 * @param email Email address to validate
 * @returns Validation result with error if any
 */
export function validateEmail(email: string): EmailValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validate username format
 * Requirements: 3-20 chars, alphanumeric + underscore
 * @param username Username to validate
 * @returns Validation result with error if any
 */
export function validateUsername(username: string): UsernameValidationResult {
  if (!username || username.length < 3 || username.length > 20) {
    return {
      valid: false,
      error: 'Username must be between 3 and 20 characters',
    };
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return {
    valid: true,
  };
}

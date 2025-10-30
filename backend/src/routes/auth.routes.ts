/**
 * Authentication Routes
 * Handles user registration, login, and token refresh
 */

import { Router, Request, Response } from 'express';
import { getDatabase } from '../database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  validatePassword,
  validateEmail,
  validateUsername,
} from '../services/auth.service';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../types/auth.types';
import { User, CreateUserData } from '../database/types';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user account
 * Note: This endpoint will be protected by RBAC middleware in Phase 1
 */
router.post(
  '/register',
  async (
    req: Request<object, RegisterResponse, RegisterRequest>,
    res: Response<RegisterResponse>
  ) => {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Username, email, and password are required',
        });
        return;
      }

      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        res.status(400).json({
          success: false,
          message: usernameValidation.error || 'Invalid username',
        });
        return;
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        res.status(400).json({
          success: false,
          message: emailValidation.error || 'Invalid email',
        });
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          message: passwordValidation.errors.join(', '),
        });
        return;
      }

      const userRole = role || 'junior-admin';
      if (userRole !== 'admin' && userRole !== 'junior-admin') {
        res.status(400).json({
          success: false,
          message: 'Invalid role. Must be either "admin" or "junior-admin"',
        });
        return;
      }

      const db = getDatabase();

      const existingUserByEmail = db.prepare('SELECT id FROM Users WHERE email = ?').get(email) as
        | User
        | undefined;
      if (existingUserByEmail) {
        res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
        return;
      }

      const existingUserByUsername = db
        .prepare('SELECT id FROM Users WHERE username = ?')
        .get(username) as User | undefined;
      if (existingUserByUsername) {
        res.status(409).json({
          success: false,
          message: 'Username already taken',
        });
        return;
      }

      const passwordHash = await hashPassword(password);

      const userData: CreateUserData = {
        username,
        email,
        password_hash: passwordHash,
        role: userRole,
      };

      const insertStmt = db.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (@username, @email, @password_hash, @role)
    `);

      const result = insertStmt.run(userData);

      const newUser = db
        .prepare('SELECT id, username, email, role FROM Users WHERE id = ?')
        .get(result.lastInsertRowid) as Omit<User, 'password_hash' | 'created_at' | 'updated_at'>;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post(
  '/login',
  async (req: Request<object, LoginResponse, LoginRequest>, res: Response<LoginResponse>) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
        return;
      }

      const db = getDatabase();

      const user = db
        .prepare('SELECT id, username, email, password_hash, role FROM Users WHERE email = ?')
        .get(email) as User | undefined;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const isPasswordValid = await comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  async (
    req: Request<object, RefreshTokenResponse, RefreshTokenRequest>,
    res: Response<RefreshTokenResponse>
  ) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (error) {
        res.status(401).json({
          success: false,
          message: error instanceof Error ? error.message : 'Invalid refresh token',
        });
        return;
      }

      const db = getDatabase();

      const user = db.prepare('SELECT id, role FROM Users WHERE id = ?').get(decoded.userId) as
        | Pick<User, 'id' | 'role'>
        | undefined;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      const newAccessToken = generateAccessToken(user.id, user.role);

      res.status(200).json({
        success: true,
        message: 'Access token refreshed successfully',
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh',
      });
    }
  }
);

export default router;

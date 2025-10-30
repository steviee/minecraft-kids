/**
 * Authentication Service and Routes Tests
 * Comprehensive test suite for JWT authentication
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  validatePassword,
  validateEmail,
  validateUsername
} from '../src/services/auth.service';
import { DatabaseConnection } from '../src/database/db';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, 'test-auth.db');

let testDb: DatabaseConnection;

beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  testDb = new DatabaseConnection({ filename: TEST_DB_PATH });
  testDb.initialize();
  await testDb.runSchema();
});

afterAll(() => {
  testDb.close();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

describe('Password Hashing and Comparison', () => {
  it('should hash a password successfully', async () => {
    const password = 'TestPassword123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should generate different hashes for the same password', async () => {
    const password = 'TestPassword123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it('should correctly compare matching passwords', async () => {
    const password = 'TestPassword123';
    const hash = await hashPassword(password);
    const isMatch = await comparePassword(password, hash);

    expect(isMatch).toBe(true);
  });

  it('should correctly reject non-matching passwords', async () => {
    const password = 'TestPassword123';
    const wrongPassword = 'WrongPassword456';
    const hash = await hashPassword(password);
    const isMatch = await comparePassword(wrongPassword, hash);

    expect(isMatch).toBe(false);
  });
});

describe('JWT Token Generation and Verification', () => {
  it('should generate a valid access token', () => {
    const userId = 1;
    const role = 'admin';
    const token = generateAccessToken(userId, role);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('should generate a valid refresh token', () => {
    const userId = 1;
    const token = generateRefreshToken(userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('should verify and decode access token correctly', () => {
    const userId = 42;
    const role = 'junior-admin';
    const token = generateAccessToken(userId, role);
    const decoded = verifyAccessToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(userId);
    expect(decoded.role).toBe(role);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('should verify and decode refresh token correctly', () => {
    const userId = 42;
    const token = generateRefreshToken(userId);
    const decoded = verifyRefreshToken(token);

    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(userId);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('should reject invalid access token', () => {
    const invalidToken = 'invalid.token.string';

    expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid access token');
  });

  it('should reject invalid refresh token', () => {
    const invalidToken = 'invalid.token.string';

    expect(() => verifyRefreshToken(invalidToken)).toThrow('Invalid refresh token');
  });

  it('should reject tampered access token', () => {
    const token = generateAccessToken(1, 'admin');
    const tamperedToken = token.slice(0, -5) + 'xxxxx';

    expect(() => verifyAccessToken(tamperedToken)).toThrow();
  });
});

describe('Password Validation', () => {
  it('should accept valid password', () => {
    const result = validatePassword('ValidPass123');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Short1A');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('lowercase123');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('UPPERCASE123');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('NoNumbersHere');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should return multiple errors for invalid password', () => {
    const result = validatePassword('short');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.com',
      'user123@test-domain.org'
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'notanemail',
      '@nodomain.com',
      'user@',
      'user @domain.com',
      'user@domain',
      ''
    ];

    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });
});

describe('Username Validation', () => {
  it('should accept valid usernames', () => {
    const validUsernames = ['user123', 'test_user', 'Admin', 'user_name_123', 'abc'];

    validUsernames.forEach((username) => {
      const result = validateUsername(username);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject username shorter than 3 characters', () => {
    const result = validateUsername('ab');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username must be between 3 and 20 characters');
  });

  it('should reject username longer than 20 characters', () => {
    const result = validateUsername('this_username_is_way_too_long_to_be_valid');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username must be between 3 and 20 characters');
  });

  it('should reject username with special characters', () => {
    const invalidUsernames = ['user@name', 'test-user', 'user.name', 'user name', 'user!123'];

    invalidUsernames.forEach((username) => {
      const result = validateUsername(username);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Username can only contain letters, numbers, and underscores');
    });
  });

  it('should reject empty username', () => {
    const result = validateUsername('');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username must be between 3 and 20 characters');
  });
});

describe('Database Integration - User Registration', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM Users');
  });

  it('should create a user with hashed password in database', async () => {
    const username = 'testuser';
    const email = 'test@example.com';
    const password = 'TestPassword123';
    const role = 'admin';

    const passwordHash = await hashPassword(password);

    const stmt = testDb.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, email, passwordHash, role);

    expect(result.lastInsertRowid).toBeDefined();
    expect(result.changes).toBe(1);

    const user = testDb.prepare('SELECT * FROM Users WHERE id = ?').get(result.lastInsertRowid) as {
      id: number;
      username: string;
      email: string;
      password_hash: string;
      role: string;
    };

    expect(user).toBeDefined();
    expect(user.username).toBe(username);
    expect(user.email).toBe(email);
    expect(user.role).toBe(role);
    expect(user.password_hash).not.toBe(password);

    const isPasswordValid = await comparePassword(password, user.password_hash);
    expect(isPasswordValid).toBe(true);
  });

  it('should prevent duplicate email registration', async () => {
    const email = 'duplicate@example.com';
    const passwordHash = await hashPassword('TestPassword123');

    const stmt = testDb.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run('user1', email, passwordHash, 'admin');

    expect(() => {
      stmt.run('user2', email, passwordHash, 'admin');
    }).toThrow();
  });

  it('should prevent duplicate username registration', async () => {
    const username = 'duplicateuser';
    const passwordHash = await hashPassword('TestPassword123');

    const stmt = testDb.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(username, 'user1@example.com', passwordHash, 'admin');

    expect(() => {
      stmt.run(username, 'user2@example.com', passwordHash, 'admin');
    }).toThrow();
  });
});

describe('Database Integration - User Login', () => {
  beforeEach(async () => {
    testDb.exec('DELETE FROM Users');

    const passwordHash = await hashPassword('TestPassword123');
    const stmt = testDb.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run('testuser', 'test@example.com', passwordHash, 'admin');
  });

  it('should authenticate user with correct credentials', async () => {
    const email = 'test@example.com';
    const password = 'TestPassword123';

    const user = testDb.prepare('SELECT * FROM Users WHERE email = ?').get(email) as {
      id: number;
      username: string;
      email: string;
      password_hash: string;
      role: string;
    };

    expect(user).toBeDefined();

    const isPasswordValid = await comparePassword(password, user.password_hash);
    expect(isPasswordValid).toBe(true);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    const decodedAccess = verifyAccessToken(accessToken);
    expect(decodedAccess.userId).toBe(user.id);
    expect(decodedAccess.role).toBe(user.role);

    const decodedRefresh = verifyRefreshToken(refreshToken);
    expect(decodedRefresh.userId).toBe(user.id);
  });

  it('should reject authentication with incorrect password', async () => {
    const email = 'test@example.com';
    const wrongPassword = 'WrongPassword456';

    const user = testDb.prepare('SELECT * FROM Users WHERE email = ?').get(email) as {
      id: number;
      password_hash: string;
    };

    expect(user).toBeDefined();

    const isPasswordValid = await comparePassword(wrongPassword, user.password_hash);
    expect(isPasswordValid).toBe(false);
  });

  it('should not find user with non-existent email', () => {
    const email = 'nonexistent@example.com';

    const user = testDb.prepare('SELECT * FROM Users WHERE email = ?').get(email);

    expect(user).toBeUndefined();
  });
});

describe('Token Refresh Flow', () => {
  it('should successfully refresh access token', async () => {
    testDb.exec('DELETE FROM Users');

    const passwordHash = await hashPassword('TestPassword123');
    const stmt = testDb.prepare(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run('testuser', 'test@example.com', passwordHash, 'admin');
    const userId = result.lastInsertRowid as number;

    const refreshToken = generateRefreshToken(userId);
    const decoded = verifyRefreshToken(refreshToken);

    const user = testDb.prepare('SELECT id, role FROM Users WHERE id = ?').get(decoded.userId) as {
      id: number;
      role: string;
    };

    expect(user).toBeDefined();
    expect(user.id).toBe(userId);

    const newAccessToken = generateAccessToken(user.id, user.role);
    const decodedAccess = verifyAccessToken(newAccessToken);

    expect(decodedAccess.userId).toBe(userId);
    expect(decodedAccess.role).toBe('admin');
  });
});

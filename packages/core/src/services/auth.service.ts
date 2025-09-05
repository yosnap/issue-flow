/**
 * @fileoverview Authentication Service
 * 
 * Handles user authentication, JWT token generation/validation,
 * OAuth integration, and session management.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { 
  User, 
  UserRole, 
  AuthTokens, 
  UserClaims, 
  LoginCredentials,
  RegisterInput,
  OAuthProvider,
  OAuthProfile,
  RefreshTokenData
} from '@/types/auth.types';
import type { DatabaseService } from './database.service';
import type { RedisService, CacheKeys, CacheTTL } from './redis.service';
import type { Logger } from '@/utils/logger';
import type { AppConfig } from '@/config';

export class AuthService {
  private database: DatabaseService;
  private redis: RedisService;
  private logger: Logger;
  private config: AppConfig;

  constructor(
    database: DatabaseService,
    redis: RedisService,
    logger: Logger,
    config: AppConfig
  ) {
    this.database = database;
    this.redis = redis;
    this.logger = logger.child('AuthService');
    this.config = config;
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput, organizationSlug?: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await this.database.queryOne<User>(
        'SELECT * FROM users WHERE email = $1',
        [input.email]
      );

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, this.config.auth.bcryptSaltRounds);

      // Start transaction
      const result = await this.database.transaction(async (trx) => {
        // Create user
        const user = await trx.queryOne<User>(
          `INSERT INTO users (email, name, password_hash, role, metadata) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [input.email, input.name, passwordHash, input.role || 'member', input.metadata || {}]
        );

        if (!user) {
          throw new Error('Failed to create user');
        }

        // If organization slug provided, add user to organization
        if (organizationSlug) {
          const org = await trx.queryOne(
            'SELECT id FROM organizations WHERE slug = $1',
            [organizationSlug]
          );

          if (org) {
            await trx.query(
              'INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)',
              [org.id, user.id, input.role || 'member']
            );
          }
        }

        return user;
      });

      // Generate tokens
      const tokens = await this.generateTokens(result);

      // Store refresh token
      await this.storeRefreshToken(result.id, tokens.refreshToken);

      this.logger.info(`User registered: ${result.email}`);

      return { user: result, tokens };
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Find user
      const user = await this.database.queryOne<User & { password_hash: string }>(
        'SELECT * FROM users WHERE email = $1',
        [credentials.email]
      );

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValid = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.database.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      this.logger.info(`User logged in: ${user.email}`);

      return { user: userWithoutPassword, tokens };
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      const key = this.redis.getCacheKey('REFRESH_TOKEN' as CacheKeys, { token: refreshToken });
      await this.redis.delete(key);

      // Remove user session
      const sessionKey = this.redis.getCacheKey('USER_SESSION' as CacheKeys, { userId });
      await this.redis.delete(sessionKey);

      this.logger.info(`User logged out: ${userId}`);
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const claims = jwt.verify(refreshToken, this.config.auth.jwtSecret) as UserClaims;

      // Check if refresh token exists in Redis
      const key = this.redis.getCacheKey('REFRESH_TOKEN' as CacheKeys, { token: refreshToken });
      const tokenData = await this.redis.get<RefreshTokenData>(key);

      if (!tokenData || tokenData.userId !== claims.userId) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await this.database.queryOne<User>(
        'SELECT * FROM users WHERE id = $1',
        [claims.userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Remove old refresh token
      await this.redis.delete(key);

      // Store new refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<UserClaims> {
    try {
      const claims = jwt.verify(token, this.config.auth.jwtSecret) as UserClaims;
      return claims;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * OAuth login/register
   */
  async oauthLogin(provider: OAuthProvider, profile: OAuthProfile): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      // Check if user exists with this OAuth provider
      let user = await this.database.queryOne<User>(
        `SELECT u.* FROM users u 
         JOIN oauth_accounts oa ON u.id = oa.user_id 
         WHERE oa.provider = $1 AND oa.provider_id = $2`,
        [provider, profile.id]
      );

      if (!user) {
        // Check if user exists with same email
        user = await this.database.queryOne<User>(
          'SELECT * FROM users WHERE email = $1',
          [profile.email]
        );

        if (user) {
          // Link OAuth account to existing user
          await this.database.query(
            `INSERT INTO oauth_accounts (user_id, provider, provider_id, profile) 
             VALUES ($1, $2, $3, $4)`,
            [user.id, provider, profile.id, profile]
          );
        } else {
          // Create new user
          user = await this.database.transaction(async (trx) => {
            const newUser = await trx.queryOne<User>(
              `INSERT INTO users (email, name, role, avatar_url, email_verified) 
               VALUES ($1, $2, $3, $4, true) 
               RETURNING *`,
              [profile.email, profile.name, 'member', profile.avatar]
            );

            if (!newUser) {
              throw new Error('Failed to create user');
            }

            // Link OAuth account
            await trx.query(
              `INSERT INTO oauth_accounts (user_id, provider, provider_id, profile) 
               VALUES ($1, $2, $3, $4)`,
              [newUser.id, provider, profile.id, profile]
            );

            return newUser;
          });
        }
      }

      // Update last login
      await this.database.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      this.logger.info(`OAuth login successful: ${provider} - ${user.email}`);

      return { user, tokens };
    } catch (error) {
      this.logger.error('OAuth login failed:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const claims: UserClaims = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: await this.getUserPermissions(user.id),
    };

    const accessToken = jwt.sign(claims, this.config.auth.jwtSecret, {
      expiresIn: this.config.auth.jwtExpiresIn,
      issuer: 'issueflow',
      audience: 'issueflow-api',
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.config.auth.jwtSecret,
      {
        expiresIn: this.config.auth.refreshTokenExpiresIn,
        issuer: 'issueflow',
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiresIn(this.config.auth.jwtExpiresIn),
    };
  }

  /**
   * Store refresh token in Redis
   */
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const key = this.redis.getCacheKey('REFRESH_TOKEN' as CacheKeys, { token });
    const data: RefreshTokenData = {
      userId,
      createdAt: new Date().toISOString(),
    };

    await this.redis.set(key, data, 30 * 24 * 60 * 60); // 30 days
  }

  /**
   * Get user permissions
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    // Get permissions based on role and custom permissions
    const permissions = await this.database.query<{ permission: string }>(
      `SELECT DISTINCT p.name as permission 
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN users u ON u.role = rp.role
       WHERE u.id = $1
       UNION
       SELECT p.name as permission
       FROM permissions p
       JOIN user_permissions up ON p.id = up.permission_id
       WHERE up.user_id = $1`,
      [userId]
    );

    return permissions.map(p => p.permission);
  }

  /**
   * Parse expires in string to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await this.database.queryOne<User>(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (!user) {
        // Don't reveal if user exists
        return '';
      }

      const token = randomBytes(32).toString('hex');
      const key = this.redis.getCacheKey('PASSWORD_RESET' as CacheKeys, { token });

      await this.redis.set(key, { userId: user.id, email }, 3600); // 1 hour

      this.logger.info(`Password reset token generated for: ${email}`);

      return token;
    } catch (error) {
      this.logger.error('Failed to generate password reset token:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const key = this.redis.getCacheKey('PASSWORD_RESET' as CacheKeys, { token });
      const data = await this.redis.get<{ userId: string; email: string }>(key);

      if (!data) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.config.auth.bcryptSaltRounds);

      // Update password
      await this.database.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, data.userId]
      );

      // Delete reset token
      await this.redis.delete(key);

      this.logger.info(`Password reset for user: ${data.email}`);
    } catch (error) {
      this.logger.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.database.queryOne<User>(
        'SELECT id, email, name, role, status, avatar_url, email_verified, created_at, updated_at, last_login_at FROM users WHERE id = $1',
        [userId]
      );
    } catch (error) {
      this.logger.error('Failed to get user by ID:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'avatar_url'>>): Promise<User | null> {
    try {
      const user = await this.database.queryOne<User>(
        `UPDATE users 
         SET name = COALESCE($1, name),
             avatar_url = COALESCE($2, avatar_url),
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, email, name, role, status, avatar_url, email_verified, created_at, updated_at, last_login_at`,
        [updates.name, updates.avatar_url, userId]
      );

      if (user) {
        this.logger.info(`User profile updated: ${user.email}`);
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get current password hash
      const user = await this.database.queryOne<{ password_hash: string }>(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.config.auth.bcryptSaltRounds);

      // Update password
      await this.database.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, userId]
      );

      this.logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      this.logger.error('Password change failed:', error);
      throw error;
    }
  }
}
/**
 * @fileoverview Authentication Controller
 * 
 * Handles HTTP requests for user authentication, registration,
 * and profile management.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { AuthService } from '@/services/auth.service';
import type { Logger } from '@/utils/logger';

// Request schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'member']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export class AuthController {
  private authService: AuthService;
  private logger: Logger;

  constructor(authService: AuthService, logger: Logger) {
    this.authService = authService;
    this.logger = logger.child('AuthController');
  }

  /**
   * Register a new user
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = registerSchema.parse(request.body);
      const organizationSlug = request.organizationSlug;

      const result = await this.authService.register(body, organizationSlug);

      // Don't include refresh token in response for security
      const response = {
        user: result.user,
        token: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      };

      // Set refresh token as httpOnly cookie
      reply.setCookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return reply.status(201).send({
        success: true,
        data: response,
        message: 'User registered successfully'
      });
      
    } catch (error) {
      this.logger.error('Registration failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          details: error.errors
        });
      }
      
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return reply.status(409).send({
            success: false,
            error: 'Conflict',
            message: error.message
          });
        }
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Registration failed'
      });
    }
  }

  /**
   * Login user
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);

      const result = await this.authService.login(body);

      // Don't include refresh token in response for security
      const response = {
        user: result.user,
        token: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
      };

      // Set refresh token as httpOnly cookie
      reply.setCookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return reply.send({
        success: true,
        data: response,
        message: 'Login successful'
      });
      
    } catch (error) {
      this.logger.error('Login failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          details: error.errors
        });
      }
      
      if (error instanceof Error && error.message.includes('Invalid credentials')) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Login failed'
      });
    }
  }

  /**
   * Logout user
   */
  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const refreshToken = request.cookies.refreshToken;
      
      if (refreshToken && request.user) {
        await this.authService.logout(request.user.id, refreshToken);
      }

      // Clear refresh token cookie
      reply.clearCookie('refreshToken');

      return reply.send({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      this.logger.error('Logout failed:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Logout failed'
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Try to get refresh token from cookie first, then body
      let refreshToken = request.cookies.refreshToken;
      
      if (!refreshToken) {
        const body = refreshTokenSchema.parse(request.body);
        refreshToken = body.refreshToken;
      }

      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Refresh token is required'
        });
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      // Update refresh token cookie
      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return reply.send({
        success: true,
        data: {
          token: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        },
        message: 'Token refreshed successfully'
      });
      
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          details: error.errors
        });
      }
      
      if (error instanceof Error && error.message.includes('Invalid')) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Token refresh failed'
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      return reply.send({
        success: true,
        data: request.user,
        message: 'Profile retrieved successfully'
      });
      
    } catch (error) {
      this.logger.error('Get profile failed:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve profile'
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const body = updateProfileSchema.parse(request.body);

      const updatedUser = await this.authService.updateProfile(request.user.id, body);

      if (!updatedUser) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      return reply.send({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
      
    } catch (error) {
      this.logger.error('Update profile failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          details: error.errors
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const body = changePasswordSchema.parse(request.body);

      await this.authService.changePassword(
        request.user.id,
        body.currentPassword,
        body.newPassword
      );

      return reply.send({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (error) {
      this.logger.error('Change password failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          details: error.errors
        });
      }
      
      if (error instanceof Error) {
        if (error.message.includes('Current password is incorrect')) {
          return reply.status(400).send({
            success: false,
            error: 'Bad Request',
            message: 'Current password is incorrect'
          });
        }
        
        if (error.message.includes('User not found')) {
          return reply.status(404).send({
            success: false,
            error: 'Not Found',
            message: 'User not found'
          });
        }
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to change password'
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = resetPasswordRequestSchema.parse(request.body);

      // Generate reset token (always return success for security)
      await this.authService.generatePasswordResetToken(body.email);

      return reply.send({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
      
    } catch (error) {
      this.logger.error('Password reset request failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          details: error.errors
        });
      }
      
      // Always return success for security
      return reply.send({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = resetPasswordSchema.parse(request.body);

      await this.authService.resetPassword(body.token, body.newPassword);

      return reply.send({
        success: true,
        message: 'Password reset successfully'
      });
      
    } catch (error) {
      this.logger.error('Password reset failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation Error',
          details: error.errors
        });
      }
      
      if (error instanceof Error && error.message.includes('Invalid or expired')) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid or expired reset token'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to reset password'
      });
    }
  }
}
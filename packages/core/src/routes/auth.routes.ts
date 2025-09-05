/**
 * @fileoverview Authentication Routes
 * 
 * Defines API routes for user authentication, registration,
 * and profile management.
 */

import type { FastifyInstance } from 'fastify';
import type { AuthController } from '@/controllers/auth.controller';
import type { AuthService } from '@/services/auth.service';
import type { Logger } from '@/utils/logger';
import { requireAuth, optionalAuth, createAuthRateLimit } from '@/middleware';
import type { RedisService } from '@/services/redis.service';
import type { AppConfig } from '@/config';

export async function authRoutes(
  fastify: FastifyInstance,
  authController: AuthController,
  authService: AuthService,
  redis: RedisService,
  logger: Logger,
  config: AppConfig
) {
  // Apply rate limiting for auth endpoints
  const authRateLimit = createAuthRateLimit(redis, logger, config);
  
  // Public routes (no authentication required)
  fastify.post('/register', {
    preHandler: [authRateLimit]
  }, authController.register.bind(authController));
  
  fastify.post('/login', {
    preHandler: [authRateLimit]
  }, authController.login.bind(authController));
  
  fastify.post('/refresh-token', {
    preHandler: [authRateLimit]
  }, authController.refreshToken.bind(authController));
  
  fastify.post('/request-password-reset', {
    preHandler: [authRateLimit]
  }, authController.requestPasswordReset.bind(authController));
  
  fastify.post('/reset-password', {
    preHandler: [authRateLimit]
  }, authController.resetPassword.bind(authController));
  
  // Protected routes (authentication required)
  fastify.post('/logout', {
    preHandler: [requireAuth(authService, logger)]
  }, authController.logout.bind(authController));
  
  fastify.get('/profile', {
    preHandler: [requireAuth(authService, logger)]
  }, authController.getProfile.bind(authController));
  
  fastify.put('/profile', {
    preHandler: [requireAuth(authService, logger)]
  }, authController.updateProfile.bind(authController));
  
  fastify.post('/change-password', {
    preHandler: [requireAuth(authService, logger)]
  }, authController.changePassword.bind(authController));
}
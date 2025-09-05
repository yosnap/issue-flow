/**
 * @fileoverview Authentication Middleware
 * 
 * Handles JWT token validation, user authentication,
 * and security context setup for requests.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthService } from '@/services/auth.service';
import type { User, UserClaims } from '@/types/auth.types';
import type { Logger } from '@/utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    claims?: UserClaims;
    isAuthenticated: boolean;
  }
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
}

export function createAuthMiddleware(
  authService: AuthService,
  logger: Logger
) {
  return function authMiddleware(options: AuthMiddlewareOptions = {}) {
    return async function(request: FastifyRequest, reply: FastifyReply) {
      try {
        const { required = true, roles = [], permissions = [] } = options;
        
        request.isAuthenticated = false;
        
        // Extract token from header
        const authHeader = request.headers.authorization;
        
        if (!authHeader) {
          if (required) {
            return reply.status(401).send({
              error: 'Unauthorized',
              message: 'Authorization header required'
            });
          }
          return;
        }

        const token = authHeader.startsWith('Bearer ') 
          ? authHeader.slice(7) 
          : authHeader;

        if (!token) {
          if (required) {
            return reply.status(401).send({
              error: 'Unauthorized',
              message: 'Bearer token required'
            });
          }
          return;
        }

        // Verify token
        let claims: UserClaims;
        try {
          claims = await authService.verifyToken(token);
        } catch (error) {
          if (required) {
            return reply.status(401).send({
              error: 'Unauthorized',
              message: 'Invalid or expired token'
            });
          }
          return;
        }

        // Get user details from database
        const user = await authService.getUserById(claims.userId);
        if (!user) {
          if (required) {
            return reply.status(401).send({
              error: 'Unauthorized',
              message: 'User not found'
            });
          }
          return;
        }

        // Check if user is active
        if (user.status !== 'active') {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User account is not active'
          });
        }

        // Check role requirements
        if (roles.length > 0 && !roles.includes(user.role)) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: `Required role: ${roles.join(' or ')}`
          });
        }

        // Check permission requirements
        if (permissions.length > 0) {
          const hasPermission = permissions.some(permission => 
            claims.permissions?.includes(permission)
          );
          
          if (!hasPermission) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: `Required permission: ${permissions.join(' or ')}`
            });
          }
        }

        // Set user context
        request.user = user;
        request.claims = claims;
        request.isAuthenticated = true;

        logger.debug(`User authenticated: ${user.email}`);
        
      } catch (error) {
        logger.error('Authentication middleware error:', error);
        
        if (options.required) {
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Authentication failed'
          });
        }
      }
    };
  };
}

/**
 * Middleware to require authentication
 */
export function requireAuth(authService: AuthService, logger: Logger) {
  return createAuthMiddleware(authService, logger)({ required: true });
}

/**
 * Middleware for optional authentication
 */
export function optionalAuth(authService: AuthService, logger: Logger) {
  return createAuthMiddleware(authService, logger)({ required: false });
}

/**
 * Middleware to require specific role
 */
export function requireRole(role: string | string[], authService: AuthService, logger: Logger) {
  const roles = Array.isArray(role) ? role : [role];
  return createAuthMiddleware(authService, logger)({ required: true, roles });
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: string | string[], authService: AuthService, logger: Logger) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  return createAuthMiddleware(authService, logger)({ required: true, permissions });
}
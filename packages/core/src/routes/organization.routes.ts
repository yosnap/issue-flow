/**
 * @fileoverview Organization Routes
 * 
 * Defines API routes for organization management,
 * member operations, and tenant administration.
 */

import type { FastifyInstance } from 'fastify';
import type { OrganizationController } from '@/controllers/organization.controller';
import type { AuthService } from '@/services/auth.service';
import type { TenantService } from '@/services/tenant.service';
import type { DatabaseService } from '@/services/database.service';
import type { Logger } from '@/utils/logger';
import { requireAuth, requireTenant, requireOrgRole, createAPIRateLimit } from '@/middleware';
import type { RedisService } from '@/services/redis.service';
import type { AppConfig } from '@/config';

export async function organizationRoutes(
  fastify: FastifyInstance,
  organizationController: OrganizationController,
  authService: AuthService,
  tenantService: TenantService,
  databaseService: DatabaseService,
  redis: RedisService,
  logger: Logger,
  config: AppConfig
) {
  // Apply rate limiting for API endpoints
  const apiRateLimit = createAPIRateLimit(redis, logger, config);
  
  // Public organization creation (authenticated users only)
  fastify.post('/organizations', {
    preHandler: [
      requireAuth(authService, logger),
      apiRateLimit
    ]
  }, organizationController.createOrganization.bind(organizationController));
  
  // Get user's organizations
  fastify.get('/organizations', {
    preHandler: [
      requireAuth(authService, logger),
      apiRateLimit
    ]
  }, organizationController.getUserOrganizations.bind(organizationController));
  
  // Organization-specific routes (require tenant context)
  fastify.register(async function(fastify) {
    // Apply tenant middleware to all routes in this context
    fastify.addHook('preHandler', requireTenant(tenantService, databaseService, logger));
    fastify.addHook('preHandler', apiRateLimit);
    
    // Get current organization
    fastify.get('/:orgSlug', {
      preHandler: [requireAuth(authService, logger)]
    }, organizationController.getOrganization.bind(organizationController));
    
    // Update organization (admin only)
    fastify.put('/:orgSlug', {
      preHandler: [
        requireAuth(authService, logger),
        requireOrgRole('admin', tenantService, databaseService, logger)
      ]
    }, organizationController.updateOrganization.bind(organizationController));
    
    // Delete organization (admin only)
    fastify.delete('/:orgSlug', {
      preHandler: [
        requireAuth(authService, logger),
        requireOrgRole('admin', tenantService, databaseService, logger)
      ]
    }, organizationController.deleteOrganization.bind(organizationController));
    
    // Member management routes
    fastify.register(async function(fastify) {
      fastify.addHook('preHandler', requireAuth(authService, logger));
      
      // Get members
      fastify.get('/:orgSlug/members', 
        organizationController.getMembers.bind(organizationController)
      );
      
      // Add member (admin only)
      fastify.post('/:orgSlug/members', {
        preHandler: [requireOrgRole('admin', tenantService, databaseService, logger)]
      }, organizationController.addMember.bind(organizationController));
      
      // Update member (admin only)
      fastify.put('/:orgSlug/members/:userId', {
        preHandler: [requireOrgRole('admin', tenantService, databaseService, logger)]
      }, organizationController.updateMember.bind(organizationController));
      
      // Remove member (admin only)
      fastify.delete('/:orgSlug/members/:userId', {
        preHandler: [requireOrgRole('admin', tenantService, databaseService, logger)]
      }, organizationController.removeMember.bind(organizationController));
    });
  });
}
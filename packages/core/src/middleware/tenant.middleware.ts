/**
 * @fileoverview Tenant Middleware
 * 
 * Handles multi-tenant context resolution, organization access control,
 * and tenant-specific database connection setup.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { TenantService } from '@/services/tenant.service';
import type { DatabaseService } from '@/services/database.service';
import type { TenantContext } from '@/types/tenant.types';
import type { Logger } from '@/utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
    organizationSlug?: string;
  }
}

export interface TenantMiddlewareOptions {
  required?: boolean;
  paramName?: string; // URL parameter name for org slug
  headerName?: string; // Header name for org slug
  queryName?: string; // Query parameter name for org slug
}

export function createTenantMiddleware(
  tenantService: TenantService,
  databaseService: DatabaseService,
  logger: Logger
) {
  return function tenantMiddleware(options: TenantMiddlewareOptions = {}) {
    return async function(request: FastifyRequest, reply: FastifyReply) {
      try {
        const {
          required = true,
          paramName = 'orgSlug',
          headerName = 'x-organization',
          queryName = 'org'
        } = options;

        // Extract organization slug from various sources
        let organizationSlug: string | undefined;
        
        // 1. URL parameter (most common)
        if (request.params && typeof request.params === 'object') {
          organizationSlug = (request.params as any)[paramName];
        }
        
        // 2. Header
        if (!organizationSlug && request.headers[headerName]) {
          organizationSlug = request.headers[headerName] as string;
        }
        
        // 3. Query parameter
        if (!organizationSlug && request.query && typeof request.query === 'object') {
          organizationSlug = (request.query as any)[queryName];
        }

        if (!organizationSlug) {
          if (required) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'Organization identifier required'
            });
          }
          return;
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(organizationSlug)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid organization identifier format'
          });
        }

        // Set organization slug for reference
        request.organizationSlug = organizationSlug;

        // Check if user has access to this organization (if authenticated)
        if (request.isAuthenticated && request.user) {
          const hasAccess = await tenantService.hasAccess(request.user.id, organizationSlug);
          if (!hasAccess) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: 'Access denied to this organization'
            });
          }
        }

        // Create tenant context
        try {
          const tenant = await tenantService.createTenantContext(
            organizationSlug,
            request.user
          );
          
          request.tenant = tenant;
          
          logger.debug(`Tenant context set: ${organizationSlug}`);
          
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('not found')) {
              return reply.status(404).send({
                error: 'Not Found',
                message: 'Organization not found'
              });
            }
            
            if (error.message.includes('does not have access')) {
              return reply.status(403).send({
                error: 'Forbidden',
                message: 'Access denied to this organization'
              });
            }
          }
          
          throw error;
        }
        
      } catch (error) {
        logger.error('Tenant middleware error:', error);
        
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to resolve tenant context'
        });
      }
    };
  };
}

/**
 * Middleware to require tenant context
 */
export function requireTenant(
  tenantService: TenantService,
  databaseService: DatabaseService,
  logger: Logger
) {
  return createTenantMiddleware(tenantService, databaseService, logger)({
    required: true
  });
}

/**
 * Middleware for optional tenant context
 */
export function optionalTenant(
  tenantService: TenantService,
  databaseService: DatabaseService,
  logger: Logger
) {
  return createTenantMiddleware(tenantService, databaseService, logger)({
    required: false
  });
}

/**
 * Middleware to require specific role within organization
 */
export function requireOrgRole(
  role: string | string[],
  tenantService: TenantService,
  databaseService: DatabaseService,
  logger: Logger
) {
  const roles = Array.isArray(role) ? role : [role];
  
  return async function(request: FastifyRequest, reply: FastifyReply) {
    // First ensure tenant context
    await requireTenant(tenantService, databaseService, logger)(request, reply);
    
    if (reply.sent) return; // Response already sent
    
    // Check organization role
    if (!request.tenant?.userRole || !roles.includes(request.tenant.userRole)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `Required organization role: ${roles.join(' or ')}`
      });
    }
  };
}

/**
 * Middleware to check plan limits
 */
export function checkPlanLimits(
  action: 'create_project' | 'add_member' | 'create_integration',
  tenantService: TenantService,
  databaseService: DatabaseService,
  logger: Logger
) {
  return async function(request: FastifyRequest, reply: FastifyReply) {
    if (!request.tenant) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Tenant context required'
      });
    }

    try {
      // Get current count based on action
      let currentCount = 0;
      const stats = await tenantService.getOrganizationStats(request.tenant.organization.slug);
      
      switch (action) {
        case 'create_project':
          currentCount = stats.projects;
          break;
        case 'add_member':
          currentCount = stats.members;
          break;
        case 'create_integration':
          currentCount = stats.integrations;
          break;
      }

      // Check if action is allowed
      const canPerform = await tenantService.canPerformAction(
        request.tenant.organization.slug,
        action,
        currentCount
      );

      if (!canPerform) {
        return reply.status(402).send({
          error: 'Payment Required',
          message: `Plan limit reached for ${action.replace('_', ' ')}. Please upgrade your plan.`,
          currentPlan: request.tenant.organization.plan,
          limits: request.tenant.limits
        });
      }
      
    } catch (error) {
      logger.error('Plan limits check error:', error);
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to check plan limits'
      });
    }
  };
}
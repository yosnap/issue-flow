/**
 * @fileoverview Organization Controller
 * 
 * Handles HTTP requests for organization management,
 * member operations, and tenant administration.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { TenantService } from '@/services/tenant.service';
import type { Logger } from '@/utils/logger';

// Request schemas
const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
  settings: z.object({}).optional(),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  settings: z.object({}).optional(),
});

const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export class OrganizationController {
  private tenantService: TenantService;
  private logger: Logger;

  constructor(tenantService: TenantService, logger: Logger) {
    this.tenantService = tenantService;
    this.logger = logger.child('OrganizationController');
  }

  /**
   * Create a new organization
   */
  async createOrganization(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const body = createOrganizationSchema.parse(request.body);

      // Check if slug is already taken
      const existingOrg = await this.tenantService.getOrganizationBySlug(body.slug);
      if (existingOrg) {
        return reply.status(409).send({
          success: false,
          error: 'Conflict',
          message: 'Organization slug already exists'
        });
      }

      const organization = await this.tenantService.createOrganization(body, request.user.id);

      return reply.status(201).send({
        success: true,
        data: organization,
        message: 'Organization created successfully'
      });
      
    } catch (error) {
      this.logger.error('Create organization failed:', error);
      
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
        message: 'Failed to create organization'
      });
    }
  }

  /**
   * Get current organization
   */
  async getOrganization(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenant) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Organization context required'
        });
      }

      // Get organization stats
      const stats = await this.tenantService.getOrganizationStats(request.tenant.organization.slug);

      return reply.send({
        success: true,
        data: {
          ...request.tenant.organization,
          stats,
          limits: request.tenant.limits,
          userRole: request.tenant.userRole
        },
        message: 'Organization retrieved successfully'
      });
      
    } catch (error) {
      this.logger.error('Get organization failed:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve organization'
      });
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenant) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Organization context required'
        });
      }

      // Check if user has admin role
      if (request.tenant.userRole !== 'admin') {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin role required'
        });
      }

      const body = updateOrganizationSchema.parse(request.body);

      const updatedOrganization = await this.tenantService.updateOrganization(
        request.tenant.organization.id,
        body
      );

      if (!updatedOrganization) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: 'Organization not found'
        });
      }

      return reply.send({
        success: true,
        data: updatedOrganization,
        message: 'Organization updated successfully'
      });
      
    } catch (error) {
      this.logger.error('Update organization failed:', error);
      
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
        message: 'Failed to update organization'
      });
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenant) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Organization context required'
        });
      }

      // Check if user has admin role
      if (request.tenant.userRole !== 'admin') {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin role required'
        });
      }

      const success = await this.tenantService.deleteOrganization(request.tenant.organization.id);

      if (!success) {
        return reply.status(404).send({
          success: false,
          error: 'Not Found',
          message: 'Organization not found'
        });
      }

      return reply.send({
        success: true,
        message: 'Organization deleted successfully'
      });
      
    } catch (error) {
      this.logger.error('Delete organization failed:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete organization'
      });
    }
  }

  /**
   * Get organization members
   */
  async getMembers(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenant) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Organization context required'
        });
      }

      const members = await this.tenantService.getMembers(request.tenant.organization.id);

      return reply.send({
        success: true,
        data: members,
        message: 'Members retrieved successfully'
      });
      
    } catch (error) {
      this.logger.error('Get members failed:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve members'
      });
    }
  }

  /**
   * Add member to organization
   */
  async addMember(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenant) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Organization context required'
        });
      }

      // Check if user has admin role
      if (request.tenant.userRole !== 'admin') {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin role required'
        });
      }

      const body = addMemberSchema.parse(request.body);

      // Check plan limits
      const stats = await this.tenantService.getOrganizationStats(request.tenant.organization.slug);
      const canAdd = await this.tenantService.canPerformAction(
        request.tenant.organization.slug,
        'add_member',
        stats.members
      );

      if (!canAdd) {
        return reply.status(402).send({
          success: false,
          error: 'Payment Required',
          message: 'Plan limit reached for members. Please upgrade your plan.',
          currentPlan: request.tenant.organization.plan,
          limits: request.tenant.limits
        });
      }

      await this.tenantService.addMember(
        request.tenant.organization.id,
        body.userId,
        body.role
      );

      return reply.status(201).send({
        success: true,
        message: 'Member added successfully'
      });
      
    } catch (error) {
      this.logger.error('Add member failed:', error);
      
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
        message: 'Failed to add member'
      });
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenant) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Organization context required'
        });
      }

      // Check if user has admin role
      if (request.tenant.userRole !== 'admin') {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin role required'
        });
      }

      const { userId } = request.params as { userId: string };

      // Prevent removing self
      if (request.user?.id === userId) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Cannot remove yourself from organization'
        });
      }

      await this.tenantService.removeMember(request.tenant.organization.id, userId);

      return reply.send({
        success: true,
        message: 'Member removed successfully'
      });
      
    } catch (error) {
      this.logger.error('Remove member failed:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to remove member'
      });
    }
  }

  /**
   * Update member role
   */
  async updateMember(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.tenant) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Organization context required'
        });
      }

      // Check if user has admin role
      if (request.tenant.userRole !== 'admin') {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin role required'
        });
      }

      const { userId } = request.params as { userId: string };
      const body = updateMemberSchema.parse(request.body);

      // Prevent changing own role
      if (request.user?.id === userId) {
        return reply.status(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Cannot change your own role'
        });
      }

      await this.tenantService.addMember(
        request.tenant.organization.id,
        userId,
        body.role
      );

      return reply.send({
        success: true,
        message: 'Member role updated successfully'
      });
      
    } catch (error) {
      this.logger.error('Update member failed:', error);
      
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
        message: 'Failed to update member'
      });
    }
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const organizations = await this.tenantService.getUserOrganizations(request.user.id);

      return reply.send({
        success: true,
        data: organizations,
        message: 'Organizations retrieved successfully'
      });
      
    } catch (error) {
      this.logger.error('Get user organizations failed:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve organizations'
      });
    }
  }
}
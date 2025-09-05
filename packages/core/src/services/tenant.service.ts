/**
 * @fileoverview Tenant Service
 * 
 * Manages multi-tenant operations, organization context resolution,
 * and tenant-specific data isolation.
 */

import type { 
  Organization, 
  TenantContext, 
  PlanTier,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  PLAN_LIMITS
} from '@/types/tenant.types';
import type { DatabaseService } from './database.service';
import type { RedisService, CacheKeys, CacheTTL } from './redis.service';
import type { Logger } from '@/utils/logger';
import type { User } from '@/types/auth.types';

export class TenantService {
  private database: DatabaseService;
  private redis: RedisService;
  private logger: Logger;

  constructor(
    database: DatabaseService,
    redis: RedisService,
    logger: Logger
  ) {
    this.database = database;
    this.redis = redis;
    this.logger = logger.child('TenantService');
  }

  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput, ownerId: string): Promise<Organization> {
    try {
      const organization = await this.database.transaction(async (trx) => {
        // Create organization
        const org = await trx.queryOne<Organization>(
          `INSERT INTO organizations (name, slug, plan, settings, created_by) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [input.name, input.slug, input.plan, input.settings || {}, ownerId]
        );

        if (!org) {
          throw new Error('Failed to create organization');
        }

        // Add owner as admin member
        await trx.query(
          `INSERT INTO organization_members (organization_id, user_id, role) 
           VALUES ($1, $2, 'admin')`,
          [org.id, ownerId]
        );

        return org;
      });

      // Create tenant schema
      await this.database.createTenantSchema(organization.slug);

      // Clear organization cache
      await this.clearOrganizationCache(organization.slug);

      this.logger.info(`Organization created: ${organization.name} (${organization.slug})`);

      return organization;
    } catch (error) {
      this.logger.error('Failed to create organization:', error);
      throw error;
    }
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      // Try cache first
      const cacheKey = this.redis.getCacheKey('ORGANIZATION_SETTINGS' as CacheKeys, { orgId: slug });
      let organization = await this.redis.get<Organization>(cacheKey);

      if (!organization) {
        // Query database
        organization = await this.database.queryOne<Organization>(
          'SELECT * FROM organizations WHERE slug = $1',
          [slug]
        );

        if (organization) {
          // Cache for 1 hour
          await this.redis.set(cacheKey, organization, 3600);
        }
      }

      return organization;
    } catch (error) {
      this.logger.error(`Failed to get organization ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      return await this.database.queryOne<Organization>(
        'SELECT * FROM organizations WHERE id = $1',
        [id]
      );
    } catch (error) {
      this.logger.error(`Failed to get organization ${id}:`, error);
      return null;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<Organization | null> {
    try {
      const organization = await this.database.queryOne<Organization>(
        `UPDATE organizations 
         SET name = COALESCE($1, name), 
             settings = COALESCE($2, settings),
             plan = COALESCE($3, plan),
             updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [input.name, input.settings, input.plan, id]
      );

      if (organization) {
        // Clear cache
        await this.clearOrganizationCache(organization.slug);
        this.logger.info(`Organization updated: ${organization.slug}`);
      }

      return organization;
    } catch (error) {
      this.logger.error(`Failed to update organization ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(id: string): Promise<boolean> {
    try {
      const org = await this.getOrganizationById(id);
      if (!org) return false;

      await this.database.transaction(async (trx) => {
        // Delete all organization data
        await trx.query('DELETE FROM organization_members WHERE organization_id = $1', [id]);
        await trx.query('DELETE FROM organizations WHERE id = $1', [id]);
        
        // Drop tenant schema
        await trx.raw(`DROP SCHEMA IF EXISTS org_${org.slug} CASCADE`);
      });

      // Clear cache
      await this.clearOrganizationCache(org.slug);

      this.logger.info(`Organization deleted: ${org.slug}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete organization ${id}:`, error);
      return false;
    }
  }

  /**
   * Add user to organization
   */
  async addMember(organizationId: string, userId: string, role: string): Promise<void> {
    try {
      await this.database.query(
        `INSERT INTO organization_members (organization_id, user_id, role) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (organization_id, user_id) 
         DO UPDATE SET role = $3`,
        [organizationId, userId, role]
      );

      this.logger.info(`Member added to organization: ${userId} -> ${organizationId} (${role})`);
    } catch (error) {
      this.logger.error('Failed to add member:', error);
      throw error;
    }
  }

  /**
   * Remove user from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<void> {
    try {
      await this.database.query(
        'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [organizationId, userId]
      );

      this.logger.info(`Member removed from organization: ${userId} -> ${organizationId}`);
    } catch (error) {
      this.logger.error('Failed to remove member:', error);
      throw error;
    }
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      return await this.database.query<OrganizationMember>(
        `SELECT 
           om.role,
           om.joined_at,
           u.id,
           u.email,
           u.name,
           u.avatar_url
         FROM organization_members om
         JOIN users u ON om.user_id = u.id
         WHERE om.organization_id = $1
         ORDER BY om.joined_at ASC`,
        [organizationId]
      );
    } catch (error) {
      this.logger.error(`Failed to get members for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      return await this.database.query<Organization>(
        `SELECT o.*, om.role as user_role
         FROM organizations o
         JOIN organization_members om ON o.id = om.organization_id
         WHERE om.user_id = $1
         ORDER BY o.created_at ASC`,
        [userId]
      );
    } catch (error) {
      this.logger.error(`Failed to get organizations for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if user has access to organization
   */
  async hasAccess(userId: string, organizationSlug: string): Promise<boolean> {
    try {
      const result = await this.database.queryOne<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM organization_members om
         JOIN organizations o ON om.organization_id = o.id
         WHERE om.user_id = $1 AND o.slug = $2`,
        [userId, organizationSlug]
      );

      return parseInt(result?.count || '0') > 0;
    } catch (error) {
      this.logger.error('Failed to check organization access:', error);
      return false;
    }
  }

  /**
   * Get user's role in organization
   */
  async getUserRole(userId: string, organizationSlug: string): Promise<string | null> {
    try {
      const result = await this.database.queryOne<{ role: string }>(
        `SELECT om.role
         FROM organization_members om
         JOIN organizations o ON om.organization_id = o.id
         WHERE om.user_id = $1 AND o.slug = $2`,
        [userId, organizationSlug]
      );

      return result?.role || null;
    } catch (error) {
      this.logger.error('Failed to get user role:', error);
      return null;
    }
  }

  /**
   * Create tenant context for request
   */
  async createTenantContext(organizationSlug: string, user?: User): Promise<TenantContext> {
    const organization = await this.getOrganizationBySlug(organizationSlug);
    
    if (!organization) {
      throw new Error(`Organization not found: ${organizationSlug}`);
    }

    let userRole: string | null = null;
    if (user) {
      userRole = await this.getUserRole(user.id, organizationSlug);
      if (!userRole) {
        throw new Error('User does not have access to this organization');
      }
    }

    return {
      organization,
      user,
      userRole,
      schema: `org_${organizationSlug}`,
      limits: this.getPlanLimits(organization.plan),
    };
  }

  /**
   * Get plan limits
   */
  private getPlanLimits(plan: PlanTier): typeof PLAN_LIMITS[keyof typeof PLAN_LIMITS] {
    const limits = {
      free: {
        projects: 3,
        issuesPerProject: 100,
        membersPerOrganization: 3,
        storageGB: 1,
        integrations: 2,
        apiCallsPerMonth: 1000,
      },
      starter: {
        projects: 10,
        issuesPerProject: 1000,
        membersPerOrganization: 10,
        storageGB: 10,
        integrations: 5,
        apiCallsPerMonth: 10000,
      },
      professional: {
        projects: 50,
        issuesPerProject: 10000,
        membersPerOrganization: 50,
        storageGB: 100,
        integrations: 20,
        apiCallsPerMonth: 100000,
      },
      enterprise: {
        projects: -1, // unlimited
        issuesPerProject: -1,
        membersPerOrganization: -1,
        storageGB: -1,
        integrations: -1,
        apiCallsPerMonth: -1,
      },
    };

    return limits[plan];
  }

  /**
   * Check if organization can perform action based on limits
   */
  async canPerformAction(
    organizationSlug: string, 
    action: 'create_project' | 'add_member' | 'create_integration',
    currentCount: number
  ): Promise<boolean> {
    try {
      const organization = await this.getOrganizationBySlug(organizationSlug);
      if (!organization) return false;

      const limits = this.getPlanLimits(organization.plan);

      switch (action) {
        case 'create_project':
          return limits.projects === -1 || currentCount < limits.projects;
        case 'add_member':
          return limits.membersPerOrganization === -1 || currentCount < limits.membersPerOrganization;
        case 'create_integration':
          return limits.integrations === -1 || currentCount < limits.integrations;
        default:
          return true;
      }
    } catch (error) {
      this.logger.error('Failed to check action limits:', error);
      return false;
    }
  }

  /**
   * Clear organization cache
   */
  private async clearOrganizationCache(slug: string): Promise<void> {
    const cacheKey = this.redis.getCacheKey('ORGANIZATION_SETTINGS' as CacheKeys, { orgId: slug });
    await this.redis.delete(cacheKey);
  }

  /**
   * Get organization stats
   */
  async getOrganizationStats(organizationSlug: string): Promise<{
    projects: number;
    members: number;
    issues: number;
    integrations: number;
  }> {
    try {
      const organization = await this.getOrganizationBySlug(organizationSlug);
      if (!organization) {
        throw new Error(`Organization not found: ${organizationSlug}`);
      }

      // Get stats from tenant schema
      const client = await this.database.getTenantConnection(organizationSlug);
      
      try {
        const [projects, issues, integrations] = await Promise.all([
          client.query('SELECT COUNT(*) as count FROM projects'),
          client.query('SELECT COUNT(*) as count FROM issues'),
          client.query('SELECT COUNT(*) as count FROM integrations')
        ]);

        // Get members count from main schema
        const members = await this.database.queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1',
          [organization.id]
        );

        return {
          projects: parseInt(projects.rows[0].count),
          members: parseInt(members?.count || '0'),
          issues: parseInt(issues.rows[0].count),
          integrations: parseInt(integrations.rows[0].count),
        };
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Failed to get organization stats for ${organizationSlug}:`, error);
      return {
        projects: 0,
        members: 0,
        issues: 0,
        integrations: 0,
      };
    }
  }
}
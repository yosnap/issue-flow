/**
 * Multi-Tenant Types
 */

export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  AGENCY = 'agency',
  ENTERPRISE = 'enterprise'
}

export interface PlanLimits {
  maxProjects: number;
  maxIssuesPerMonth: number;
  maxUsers: number;
  maxIntegrations: number;
  hasWhiteLabel: boolean;
  hasAdvancedAnalytics: boolean;
  hasCustomDomain: boolean;
  hasPrioritySupport: boolean;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  logo?: string;
  planTier: PlanTier;
  limits: PlanLimits;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  branding: {
    primaryColor?: string;
    logo?: string;
    customDomain?: string;
    hideIssueFlowBranding?: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    slackWebhook?: string;
    discordWebhook?: string;
  };
  integrations: {
    github?: {
      defaultRepo?: string;
      autoAssign?: string;
    };
    clickup?: {
      defaultList?: string;
      autoAssign?: string;
    };
  };
  security: {
    allowedDomains?: string[];
    requireEmailVerification: boolean;
    sessionTimeout: number; // minutes
  };
}

export interface TenantContext {
  organizationId: string;
  slug: string;
  schema: string;
  limits: PlanLimits;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: {
    maxProjects: 1,
    maxIssuesPerMonth: 100,
    maxUsers: 3,
    maxIntegrations: 2,
    hasWhiteLabel: false,
    hasAdvancedAnalytics: false,
    hasCustomDomain: false,
    hasPrioritySupport: false
  },
  [PlanTier.PRO]: {
    maxProjects: 10,
    maxIssuesPerMonth: 1000,
    maxUsers: 5,
    maxIntegrations: 10,
    hasWhiteLabel: false,
    hasAdvancedAnalytics: true,
    hasCustomDomain: false,
    hasPrioritySupport: true
  },
  [PlanTier.AGENCY]: {
    maxProjects: -1, // unlimited
    maxIssuesPerMonth: 5000,
    maxUsers: 25,
    maxIntegrations: -1, // unlimited
    hasWhiteLabel: true,
    hasAdvancedAnalytics: true,
    hasCustomDomain: true,
    hasPrioritySupport: true
  },
  [PlanTier.ENTERPRISE]: {
    maxProjects: -1, // unlimited
    maxIssuesPerMonth: -1, // unlimited
    maxUsers: -1, // unlimited
    maxIntegrations: -1, // unlimited
    hasWhiteLabel: true,
    hasAdvancedAnalytics: true,
    hasCustomDomain: true,
    hasPrioritySupport: true
  }
};
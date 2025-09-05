/**
 * Authentication and Authorization Types
 */

export enum UserRole {
  OWNER = 'owner',         // Full access to organization
  ADMIN = 'admin',         // All except billing
  DEVELOPER = 'developer', // Technical operations
  VIEWER = 'viewer'        // Read-only access
}

export enum Permission {
  // Issues
  ISSUES_READ = 'issues:read',
  ISSUES_WRITE = 'issues:write',
  ISSUES_DELETE = 'issues:delete',
  
  // Projects
  PROJECTS_READ = 'projects:read',
  PROJECTS_WRITE = 'projects:write',
  PROJECTS_DELETE = 'projects:delete',
  
  // Integrations
  INTEGRATIONS_READ = 'integrations:read',
  INTEGRATIONS_WRITE = 'integrations:write',
  
  // Admin
  ADMIN_USERS = 'admin:users',
  ADMIN_BILLING = 'admin:billing',
  ADMIN_ANALYTICS = 'admin:analytics'
}

export interface UserClaims {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: Permission[];
  tenantSlug: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;   // 15 minutes
  refreshToken: string;  // 30 days
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OAuthState {
  provider: 'github' | 'google' | 'microsoft';
  returnUrl?: string;
  organizationSlug?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
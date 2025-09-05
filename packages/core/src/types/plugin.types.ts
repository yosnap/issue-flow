/**
 * Plugin System Types
 */

export enum PluginType {
  FRONTEND_ADAPTER = 'frontend-adapter',
  INTEGRATION = 'integration',
  NOTIFICATION = 'notification',
  WORKFLOW = 'workflow',
  ANALYTICS = 'analytics'
}

export enum PluginStatus {
  INSTALLED = 'installed',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error'
}

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  compatibility: string; // semver range
  permissions: Permission[];
  hooks: string[];
  config?: {
    schema: string; // JSON Schema
    required: string[];
  };
  endpoints?: PluginEndpoint[];
}

export interface PluginEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;
  auth?: boolean;
  permissions?: Permission[];
}

export interface PluginConfig {
  [key: string]: any;
}

export interface Plugin {
  id: string;
  organizationId?: string; // null for global plugins
  manifest: PluginManifest;
  config: PluginConfig;
  status: PluginStatus;
  installedAt: Date;
  lastUpdatedAt: Date;
  errorMessage?: string;
}

export interface PluginEvent {
  name: string;
  data: any;
  timestamp: Date;
  organizationId: string;
  userId?: string;
}

// Base interface that all plugins must implement
export interface IssueFlowPlugin {
  name: string;
  version: string;
  type: PluginType;
  
  // Lifecycle methods
  install(config: PluginConfig): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  uninstall(): Promise<void>;
  
  // Configuration
  getConfigSchema(): object;
  validateConfig(config: PluginConfig): boolean;
  
  // Event handlers (optional)
  onIssueCreated?(event: IssueCreatedEvent): Promise<void>;
  onIssueUpdated?(event: IssueUpdatedEvent): Promise<void>;
  onIssueStatusChanged?(event: IssueStatusChangedEvent): Promise<void>;
  onUserAction?(event: UserActionEvent): Promise<void>;
  onWebhookReceived?(event: WebhookEvent): Promise<void>;
}

// Plugin Events
export interface IssueCreatedEvent extends PluginEvent {
  name: 'issue.created';
  data: {
    issue: Issue;
    project: Project;
  };
}

export interface IssueUpdatedEvent extends PluginEvent {
  name: 'issue.updated';
  data: {
    issue: Issue;
    previousValues: Partial<Issue>;
    project: Project;
  };
}

export interface IssueStatusChangedEvent extends PluginEvent {
  name: 'issue.status_changed';
  data: {
    issue: Issue;
    previousStatus: IssueStatus;
    project: Project;
  };
}

export interface UserActionEvent extends PluginEvent {
  name: 'user.action';
  data: {
    action: string;
    userId: string;
    metadata?: any;
  };
}

export interface WebhookEvent extends PluginEvent {
  name: 'webhook.received';
  data: {
    provider: string;
    payload: any;
    headers: Record<string, string>;
  };
}

import type { Issue, Project } from './issue.types';
import type { IssueStatus } from './issue.types';
import type { Permission } from './auth.types';
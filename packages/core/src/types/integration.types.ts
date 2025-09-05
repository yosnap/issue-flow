/**
 * External Integration Types
 */

export enum IntegrationType {
  GITHUB = 'github',
  CLICKUP = 'clickup',
  LINEAR = 'linear',
  SLACK = 'slack',
  DISCORD = 'discord',
  TEAMS = 'teams',
  ASANA = 'asana',
  TRELLO = 'trello',
  NOTION = 'notion'
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

export interface Integration {
  id: string;
  organizationId: string;
  projectId?: string; // null for organization-level integrations
  type: IntegrationType;
  name: string;
  config: IntegrationConfig;
  status: IntegrationStatus;
  lastSyncAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationConfig = 
  | GitHubIntegrationConfig
  | ClickUpIntegrationConfig
  | LinearIntegrationConfig
  | SlackIntegrationConfig
  | DiscordIntegrationConfig;

export interface GitHubIntegrationConfig {
  repository: string; // owner/repo
  token: string;
  autoAssign?: string;
  labels?: string[];
  createLabels?: boolean;
  syncBidirectional?: boolean;
}

export interface ClickUpIntegrationConfig {
  token: string;
  listId: string;
  autoAssign?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  customFields?: Record<string, any>;
}

export interface LinearIntegrationConfig {
  token: string;
  teamId: string;
  autoAssign?: string;
  labels?: string[];
  priority?: number; // 0-4
}

export interface SlackIntegrationConfig {
  webhookUrl: string;
  channel?: string;
  mentionUsers?: string[];
  template?: string;
}

export interface DiscordIntegrationConfig {
  webhookUrl: string;
  mentionRoles?: string[];
  template?: string;
}

export interface CreateIntegrationInput {
  type: IntegrationType;
  name: string;
  projectId?: string;
  config: IntegrationConfig;
}

export interface UpdateIntegrationInput {
  name?: string;
  config?: Partial<IntegrationConfig>;
  status?: IntegrationStatus;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface WebhookPayload {
  integrationId: string;
  provider: IntegrationType;
  event: string;
  data: any;
  headers: Record<string, string>;
  timestamp: Date;
}

// External API response types
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string }>;
  assignee?: { login: string };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  status: { status: string };
  priority: { priority: string };
  assignees: Array<{ username: string }>;
  date_created: string;
  date_updated: string;
  url: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  state: { name: string };
  priority: number;
  assignee?: { displayName: string };
  createdAt: string;
  updatedAt: string;
  url: string;
}
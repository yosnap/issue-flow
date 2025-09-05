/**
 * Project Management Types
 */

export enum ProjectFramework {
  REACT = 'react',
  VUE = 'vue',
  NEXTJS = 'nextjs',
  NUXT = 'nuxt',
  ASTRO = 'astro',
  SVELTE = 'svelte',
  ANGULAR = 'angular',
  VANILLA = 'vanilla',
  WORDPRESS = 'wordpress',
  OTHER = 'other'
}

export enum ProjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  domain: string;
  framework: ProjectFramework;
  status: ProjectStatus;
  config: ProjectConfig;
  stats: ProjectStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectConfig {
  widget: {
    theme: 'light' | 'dark' | 'auto';
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    primaryColor: string;
    customCSS?: string;
    showPoweredBy: boolean;
    collectMetadata: boolean;
    requireEmail: boolean;
    allowAttachments: boolean;
    maxAttachmentSize: number; // bytes
    allowedFileTypes: string[];
  };
  notifications: {
    emailEnabled: boolean;
    emailTemplate?: string;
    slackEnabled: boolean;
    slackChannel?: string;
    discordEnabled: boolean;
    discordWebhook?: string;
  };
  integrations: {
    github?: {
      enabled: boolean;
      repository: string;
      autoAssign?: string;
      labels?: string[];
    };
    clickup?: {
      enabled: boolean;
      listId: string;
      autoAssign?: string;
      priority?: string;
    };
    linear?: {
      enabled: boolean;
      teamId: string;
      autoAssign?: string;
      labels?: string[];
    };
  };
  security: {
    allowedOrigins: string[];
    rateLimitPerHour: number;
    requireCaptcha: boolean;
    moderationEnabled: boolean;
  };
}

export interface ProjectStats {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  averageResolutionTime: number; // hours
  issuesThisMonth: number;
  lastIssueAt?: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  domain: string;
  framework: ProjectFramework;
  config?: Partial<ProjectConfig>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  domain?: string;
  framework?: ProjectFramework;
  status?: ProjectStatus;
  config?: Partial<ProjectConfig>;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  framework?: ProjectFramework[];
  search?: string;
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  widget: {
    theme: 'auto',
    position: 'bottom-right',
    primaryColor: '#3B82F6',
    showPoweredBy: true,
    collectMetadata: true,
    requireEmail: true,
    allowAttachments: true,
    maxAttachmentSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },
  notifications: {
    emailEnabled: true,
    slackEnabled: false,
    discordEnabled: false
  },
  integrations: {},
  security: {
    allowedOrigins: ['*'],
    rateLimitPerHour: 100,
    requireCaptcha: false,
    moderationEnabled: false
  }
};
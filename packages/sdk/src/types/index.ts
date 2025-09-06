/**
 * @fileoverview IssueFlow Type Definitions
 * 
 * TypeScript type definitions for the IssueFlow SDK.
 */

import { z } from 'zod';

/**
 * Issue Status Enum
 */
export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Issue Priority Enum
 */
export enum IssuePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Issue Category Enum
 */
export enum IssueCategory {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  IMPROVEMENT = 'improvement',
  QUESTION = 'question',
  OTHER = 'other',
}

/**
 * SDK Configuration
 */
export interface IssueFlowConfig {
  /** API base URL */
  apiUrl: string;
  /** Project ID */
  projectId: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * User information
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

/**
 * Attachment information
 */
export interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: Date;
}

/**
 * Custom field definition
 */
export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean';
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: any;
}

/**
 * Issue entity
 */
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  category: IssueCategory;
  projectId: string;
  reporter: User;
  assignee?: User;
  attachments: Attachment[];
  customFields: Record<string, any>;
  metadata: {
    userAgent?: string;
    url?: string;
    viewport?: { width: number; height: number };
    timestamp: Date;
    ipAddress?: string;
    sessionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Issue Request
 */
export interface CreateIssueRequest {
  title: string;
  description: string;
  priority?: IssuePriority;
  category?: IssueCategory;
  reporter: {
    email: string;
    name: string;
  };
  attachments?: string[]; // Attachment IDs
  customFields?: Record<string, any>;
  metadata?: {
    userAgent?: string;
    url?: string;
    viewport?: { width: number; height: number };
    sessionId?: string;
  };
}

/**
 * Widget Configuration
 */
export interface WidgetConfig extends IssueFlowConfig {
  /** Widget position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Widget trigger text */
  triggerText?: string;
  /** Widget theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Primary color */
  primaryColor?: string;
  /** Enable screenshot capture */
  enableScreenshot?: boolean;
  /** Enable console error capture */
  captureConsoleErrors?: boolean;
  /** Custom fields */
  customFields?: CustomField[];
  /** Required fields */
  requiredFields?: string[];
  /** Welcome message */
  welcomeMessage?: string;
  /** Success message */
  successMessage?: string;
  /** Show powered by link */
  showPoweredBy?: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: 'issue.created' | 'issue.updated' | 'issue.deleted';
  data: Issue;
  timestamp: Date;
  projectId: string;
}

/**
 * Zod schemas for validation
 */
export const IssueStatusSchema = z.nativeEnum(IssueStatus);
export const IssuePrioritySchema = z.nativeEnum(IssuePriority);
export const IssueCategorySchema = z.nativeEnum(IssueCategory);

export const CreateIssueRequestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  priority: IssuePrioritySchema.optional(),
  category: IssueCategorySchema.optional(),
  reporter: z.object({
    email: z.string().email(),
    name: z.string().min(1),
  }),
  attachments: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  metadata: z.object({
    userAgent: z.string().optional(),
    url: z.string().url().optional(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }).optional(),
    sessionId: z.string().optional(),
  }).optional(),
});

export const WidgetConfigSchema = z.object({
  apiUrl: z.string().url(),
  projectId: z.string(),
  apiKey: z.string().optional(),
  timeout: z.number().optional(),
  debug: z.boolean().optional(),
  headers: z.record(z.string()).optional(),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  triggerText: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  primaryColor: z.string().optional(),
  enableScreenshot: z.boolean().optional(),
  captureConsoleErrors: z.boolean().optional(),
  customFields: z.array(z.any()).optional(),
  requiredFields: z.array(z.string()).optional(),
  welcomeMessage: z.string().optional(),
  successMessage: z.string().optional(),
  showPoweredBy: z.boolean().optional(),
});
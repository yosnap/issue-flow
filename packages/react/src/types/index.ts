/**
 * @fileoverview React Adapter Types
 * 
 * TypeScript definitions for React components and hooks.
 */

import type { ReactNode } from 'react';

// Core IssueFlow types
export interface IssueFlowConfig {
  projectId: string;
  apiKey?: string;
  apiUrl?: string;
  organizationSlug?: string;
  
  // Widget configuration
  widget?: WidgetConfig;
  
  // Theme configuration
  theme?: ThemeConfig;
  
  // Behavior configuration
  behavior?: BehaviorConfig;
  
  // User identification
  user?: UserIdentification;
}

export interface WidgetConfig {
  // Position
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: { x: number; y: number };
  
  // Appearance
  trigger?: 'button' | 'tab' | 'custom';
  triggerText?: string;
  triggerIcon?: ReactNode | string;
  
  // Size and behavior
  width?: number | string;
  height?: number | string;
  zIndex?: number;
  
  // Customization
  customCSS?: string;
  className?: string;
}

export interface ThemeConfig {
  mode?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  fontFamily?: string;
  fontSize?: number;
}

export interface BehaviorConfig {
  // Auto-capture
  captureConsoleErrors?: boolean;
  captureUnhandledRejections?: boolean;
  captureScreenshot?: boolean;
  
  // Form behavior
  requireEmail?: boolean;
  allowAnonymous?: boolean;
  enableAttachments?: boolean;
  maxAttachmentSize?: number;
  
  // Notifications
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export interface UserIdentification {
  id?: string;
  email?: string;
  name?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

// Issue types
export interface IssueData {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  metadata?: Record<string, any>;
  attachments?: File[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdAt: string;
  updatedAt: string;
  reporter: {
    email: string;
    name?: string;
    metadata?: Record<string, any>;
  };
  metadata: Record<string, any>;
}

// Component props
export interface IssueFlowProviderProps {
  config: IssueFlowConfig;
  children: ReactNode;
}

export interface IssueFlowWidgetProps {
  // Override provider config
  config?: Partial<IssueFlowConfig>;
  
  // Event handlers
  onIssueSubmit?: (issue: IssueData) => void | Promise<void>;
  onIssueSuccess?: (issue: Issue) => void;
  onIssueError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  
  // Custom trigger
  trigger?: ReactNode;
  
  // Visibility control
  visible?: boolean;
  disabled?: boolean;
}

export interface IssueFormProps {
  // Configuration
  config?: Partial<IssueFlowConfig>;
  
  // Event handlers
  onSubmit: (issue: IssueData) => void | Promise<void>;
  onCancel?: () => void;
  
  // Form state
  loading?: boolean;
  error?: string;
  
  // Customization
  fields?: FormField[];
  className?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | undefined;
}

// Hook types
export interface UseIssueFlowReturn {
  // State
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  submitIssue: (issue: IssueData) => Promise<Issue>;
  clearError: () => void;
  
  // Configuration
  config: IssueFlowConfig;
  updateConfig: (updates: Partial<IssueFlowConfig>) => void;
}

export interface UseIssueListReturn {
  // Data
  issues: Issue[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Actions
  fetchIssues: () => Promise<void>;
  fetchMore: () => Promise<void>;
  refreshIssues: () => Promise<void>;
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  
  // Filters
  filters: IssueFilters;
  setFilters: (filters: Partial<IssueFilters>) => void;
}

export interface IssueFilters {
  status?: ('open' | 'in_progress' | 'resolved' | 'closed')[];
  priority?: ('low' | 'medium' | 'high' | 'critical')[];
  category?: string[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Context types
export interface IssueFlowContextValue {
  config: IssueFlowConfig;
  client: any; // IssueFlowClient from @issueflow/core
  isInitialized: boolean;
  updateConfig: (updates: Partial<IssueFlowConfig>) => void;
}

// Event types
export interface IssueFlowEvents {
  'widget:opened': void;
  'widget:closed': void;
  'issue:submitted': IssueData;
  'issue:success': Issue;
  'issue:error': Error;
  'config:updated': Partial<IssueFlowConfig>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type EventHandler<T> = (data: T) => void;
export type AsyncEventHandler<T> = (data: T) => Promise<void>;

// CSS-in-JS types
export interface StyleObject {
  [key: string]: string | number | StyleObject;
}

export interface ThemeVariables {
  // Colors
  '--if-primary': string;
  '--if-background': string;
  '--if-text': string;
  '--if-border': string;
  '--if-error': string;
  '--if-success': string;
  '--if-warning': string;
  
  // Spacing
  '--if-spacing-sm': string;
  '--if-spacing-md': string;
  '--if-spacing-lg': string;
  
  // Typography
  '--if-font-family': string;
  '--if-font-size': string;
  '--if-line-height': string;
  
  // Borders
  '--if-border-radius': string;
  '--if-border-width': string;
  
  // Shadows
  '--if-shadow': string;
  '--if-shadow-lg': string;
  
  // Z-index
  '--if-z-index': string;
}
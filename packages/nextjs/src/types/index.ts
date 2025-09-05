/**
 * @fileoverview Next.js Adapter Type Definitions
 * 
 * TypeScript definitions specific to the Next.js adapter.
 * Extends core types with Next.js-specific interfaces and utilities.
 */

import type { ReactNode, ComponentProps } from 'react';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { 
  IssueFlowConfig as BaseConfig,
  Issue,
  IssueSubmissionResult,
  User,
  IssueType,
  IssuePriority
} from '@issueflow/sdk';

// Re-export core types
export type {
  Issue,
  IssueType,
  IssuePriority,
  IssueStatus,
  User,
  Organization,
  Project,
  ThemeConfig,
  WidgetConfig,
  BehaviorConfig,
  IntegrationConfig,
  StyleObject,
  IssueSubmissionResult,
} from '@issueflow/sdk';

/**
 * Next.js-specific configuration extensions
 */
export interface NextJSIssueFlowConfig {
  /** Next.js specific configuration */
  nextjs?: {
    /** Enable server-side rendering */
    ssr?: boolean;
    /** Enable static generation */
    ssg?: boolean;
    /** API routes configuration */
    api?: {
      /** Base path for API routes */
      basePath?: string;
      /** Enable CORS */
      cors?: boolean;
      /** Rate limiting */
      rateLimit?: {
        windowMs: number;
        max: number;
      };
    };
    /** App Router configuration */
    appRouter?: {
      /** Enable App Router support */
      enabled?: boolean;
      /** Layout integration */
      layout?: boolean;
    };
    /** Pages Router configuration */
    pagesRouter?: {
      /** Enable Pages Router support */
      enabled?: boolean;
      /** Custom document integration */
      document?: boolean;
    };
    /** Middleware integration */
    middleware?: {
      /** Enable middleware */
      enabled?: boolean;
      /** Matcher patterns */
      matcher?: string[];
    };
  };
}

/**
 * Extended configuration for Next.js
 */
export interface IssueFlowConfig extends BaseConfig, NextJSIssueFlowConfig {}

/**
 * React Context type for IssueFlow
 */
export interface IssueFlowContextValue {
  // State
  /** Current configuration */
  config: IssueFlowConfig | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Current user */
  user: User | null;
  /** Issues list */
  issues: Issue[];
  /** Widget open state */
  isOpen: boolean;
  
  // Computed
  /** Is service initialized */
  isInitialized: boolean;
  /** Has error occurred */
  hasError: boolean;
  /** Total issues count */
  totalIssues: number;
  
  // Methods
  /** Initialize service */
  initialize: (config: IssueFlowConfig) => Promise<void>;
  /** Submit an issue */
  submitIssue: (issue: Partial<Issue>) => Promise<IssueSubmissionResult>;
  /** Load issues */
  loadIssues: (filters?: any) => Promise<Issue[]>;
  /** Update configuration */
  updateConfig: (config: Partial<IssueFlowConfig>) => void;
  /** Open widget */
  openWidget: () => void;
  /** Close widget */
  closeWidget: () => void;
  /** Toggle widget */
  toggleWidget: () => void;
  /** Clear error */
  clearError: () => void;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook return type
 */
export interface UseIssueFlowReturn extends IssueFlowContextValue {}

/**
 * Provider props
 */
export interface IssueFlowProviderProps {
  /** Configuration */
  config: IssueFlowConfig;
  /** Children components */
  children: ReactNode;
  /** Auto initialize on mount */
  autoInit?: boolean;
  /** Enable SSR */
  ssr?: boolean;
}

/**
 * Widget component props
 */
export interface IssueFlowWidgetProps {
  /** Widget configuration override */
  config?: IssueFlowConfig;
  /** Widget position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Trigger text */
  triggerText?: string;
  /** Custom CSS class */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Hidden state */
  hidden?: boolean;
  /** Theme override */
  theme?: any;
  /** Show trigger button */
  showTrigger?: boolean;
  /** Auto open on mount */
  autoOpen?: boolean;
  /** Auto close after submit */
  autoClose?: boolean;
  /** Auto close delay */
  autoCloseDelay?: number;
  /** Custom fields */
  customFields?: FormField[];
  /** Show priority selector */
  showPriority?: boolean;
  /** Require email */
  requireEmail?: boolean;
  /** Allow file uploads */
  allowFileUploads?: boolean;
  /** Event handlers */
  onIssueSubmitted?: (result: IssueSubmissionResult) => void;
  onWidgetOpened?: () => void;
  onWidgetClosed?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Form component props
 */
export interface IssueFormProps {
  /** Initial form data */
  initialData?: Partial<Issue>;
  /** Require email */
  requireEmail?: boolean;
  /** Allow file uploads */
  allowFileUploads?: boolean;
  /** Max attachment size */
  maxAttachmentSize?: number;
  /** Allowed file types */
  allowedFileTypes?: string[];
  /** Custom fields */
  customFields?: FormField[];
  /** Show priority selector */
  showPriority?: boolean;
  /** Show type selector */
  showType?: boolean;
  /** Auto focus */
  autoFocus?: boolean;
  /** Form submission handler */
  onSubmit?: (issue: Partial<Issue>) => Promise<void>;
  /** Custom CSS class */
  className?: string;
}

/**
 * Form field definition
 */
export interface FormField {
  /** Field name */
  name: string;
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'textarea' | 'email' | 'select' | 'checkbox' | 'radio' | 'file';
  /** Required field */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Options for select/radio */
  options?: { label: string; value: any }[];
  /** Validation rules */
  rules?: ValidationRule[];
  /** Default value */
  defaultValue?: any;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule type */
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  /** Error message */
  message: string;
  /** Value for min/max */
  value?: number;
  /** Pattern for regex */
  pattern?: RegExp;
  /** Custom validator */
  validator?: (value: any) => boolean;
}

/**
 * List component props
 */
export interface IssueListProps {
  /** Filter options */
  filters?: IssueFilters;
  /** Items per page */
  pageSize?: number;
  /** Enable search */
  searchable?: boolean;
  /** Enable sorting */
  sortable?: boolean;
  /** Show statistics */
  showStats?: boolean;
  /** Enable actions */
  enableActions?: boolean;
  /** Custom columns */
  columns?: ListColumn[];
  /** Custom CSS class */
  className?: string;
}

/**
 * Issue filters
 */
export interface IssueFilters {
  /** Filter by type */
  type?: IssueType | IssueType[];
  /** Filter by priority */
  priority?: IssuePriority | IssuePriority[];
  /** Filter by status */
  status?: string | string[];
  /** Date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Search query */
  search?: string;
  /** Custom filters */
  custom?: Record<string, any>;
}

/**
 * List column definition
 */
export interface ListColumn {
  /** Column key */
  key: string;
  /** Column label */
  label: string;
  /** Sortable column */
  sortable?: boolean;
  /** Column width */
  width?: string | number;
  /** Custom formatter */
  formatter?: (value: any, row: Issue) => ReactNode;
  /** Custom component */
  component?: React.ComponentType<{ value: any; row: Issue }>;
}

/**
 * Server-side API handler types
 */
export interface IssueFlowApiRequest extends NextApiRequest {
  body: {
    issue?: Partial<Issue>;
    config?: Partial<IssueFlowConfig>;
    filters?: IssueFilters;
  };
}

export interface IssueFlowApiResponse extends NextApiResponse {
  json: (body: ApiResponse) => void;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Middleware types
 */
export interface IssueFlowMiddlewareConfig {
  /** Rate limiting */
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  /** CORS configuration */
  cors?: {
    origin: string | string[] | boolean;
    methods: string[];
    credentials: boolean;
  };
  /** Authentication */
  auth?: {
    required: boolean;
    apiKey?: string;
    validateToken?: (token: string) => Promise<boolean>;
  };
}

/**
 * SSR/SSG utilities
 */
export interface IssueFlowSSRProps {
  /** Initial configuration */
  config: IssueFlowConfig;
  /** Initial issues data */
  initialIssues?: Issue[];
  /** Initial user data */
  initialUser?: User | null;
  /** SSR flags */
  ssr: {
    isLoading: boolean;
    error: string | null;
  };
}

/**
 * App Router types
 */
export interface IssueFlowLayoutProps {
  /** Configuration */
  config: IssueFlowConfig;
  /** Children components */
  children: ReactNode;
}

export interface IssueFlowPageProps {
  /** Route parameters */
  params: Record<string, string>;
  /** Search parameters */
  searchParams: Record<string, string>;
}

/**
 * Plugin configuration for Next.js projects
 */
export interface NextJSPluginConfig {
  /** Auto-inject widget */
  autoInject?: boolean;
  /** Inject position */
  injectPosition?: 'head' | 'body' | 'custom';
  /** Bundle optimization */
  optimize?: {
    /** Tree shaking */
    treeShaking?: boolean;
    /** Code splitting */
    codeSplitting?: boolean;
    /** CSS optimization */
    cssOptimization?: boolean;
  };
  /** Development features */
  dev?: {
    /** Debug mode */
    debug?: boolean;
    /** Hot reload */
    hotReload?: boolean;
  };
}

/**
 * Hook options
 */
export interface UseIssueFlowOptions {
  /** Auto-initialize on mount */
  autoInit?: boolean;
  /** Initial configuration */
  config?: IssueFlowConfig;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Success handler */
  onSuccess?: (result: IssueSubmissionResult) => void;
  /** SSR mode */
  ssr?: boolean;
}

/**
 * Error types
 */
export class IssueFlowNextJSError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'IssueFlowNextJSError';
  }
}

/**
 * Event names
 */
export const ISSUE_FLOW_EVENTS = {
  INITIALIZED: 'issueflow:initialized',
  ISSUE_SUBMITTED: 'issueflow:issue:submitted',
  WIDGET_OPENED: 'issueflow:widget:opened',
  WIDGET_CLOSED: 'issueflow:widget:closed',
  ERROR_OCCURRED: 'issueflow:error',
  CONFIG_UPDATED: 'issueflow:config:updated',
} as const;

/**
 * Testing utilities
 */
export interface IssueFlowTestUtils {
  /** Mock provider */
  MockProvider: React.ComponentType<{ children: ReactNode; config?: Partial<IssueFlowConfig> }>;
  /** Mock service */
  mockService: {
    submitIssue: jest.Mock<Promise<IssueSubmissionResult>>;
    loadIssues: jest.Mock<Promise<Issue[]>>;
    initialize: jest.Mock<Promise<void>>;
  };
}

/**
 * Webpack plugin types
 */
export interface IssueFlowWebpackPluginOptions {
  /** Auto-inject configuration */
  autoInject?: boolean;
  /** Development mode */
  dev?: boolean;
  /** Bundle analysis */
  analyze?: boolean;
}
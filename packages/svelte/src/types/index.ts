/**
 * @fileoverview Svelte Adapter Type Definitions
 * 
 * TypeScript definitions specific to the Svelte adapter.
 * Extends core types with Svelte-specific interfaces and stores.
 */

import type { Writable, Readable } from 'svelte/store';
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
 * Svelte-specific configuration extensions
 */
export interface SvelteIssueFlowConfig {
  /** Svelte specific configuration */
  svelte?: {
    /** Auto-init stores */
    autoInit?: boolean;
    /** Store names customization */
    stores?: {
      config?: string;
      issues?: string;
      user?: string;
      loading?: string;
      error?: string;
    };
    /** Component configuration */
    components?: {
      /** Global component registration */
      global?: boolean;
      /** Component prefix */
      prefix?: string;
    };
    /** SvelteKit specific settings */
    kit?: {
      /** Enable SSR support */
      ssr?: boolean;
      /** Enable prerendering */
      prerender?: boolean;
      /** Service worker integration */
      serviceWorker?: boolean;
    };
  };
}

/**
 * Extended configuration for Svelte
 */
export interface IssueFlowConfig extends BaseConfig, SvelteIssueFlowConfig {}

/**
 * Store interface for IssueFlow state
 */
export interface IssueFlowStore {
  /** Configuration store */
  config: Writable<IssueFlowConfig | null>;
  /** Loading state store */
  loading: Writable<boolean>;
  /** Error state store */
  error: Writable<Error | null>;
  /** User store */
  user: Writable<User | null>;
  /** Issues store */
  issues: Writable<Issue[]>;
  /** Widget open state */
  isOpen: Writable<boolean>;
}

/**
 * Derived store interface
 */
export interface IssueFlowDerivedStore {
  /** Is initialized */
  isInitialized: Readable<boolean>;
  /** Has error */
  hasError: Readable<boolean>;
  /** Total issues count */
  totalIssues: Readable<number>;
}

/**
 * Service interface for actions
 */
export interface IssueFlowService {
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
  /** Cleanup */
  cleanup: () => void;
}

/**
 * Combined store and service interface
 */
export interface IssueFlowContext extends IssueFlowStore, IssueFlowDerivedStore, IssueFlowService {}

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
  class?: string;
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
  /** Custom CSS class */
  class?: string;
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
  class?: string;
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
  formatter?: (value: any, row: Issue) => string;
}

/**
 * Action parameters for use:issueflow
 */
export interface IssueFlowActionParams {
  /** Configuration */
  config?: IssueFlowConfig;
  /** Auto initialize */
  autoInit?: boolean;
  /** Event handlers */
  onError?: (error: Error) => void;
  onSuccess?: (result: IssueSubmissionResult) => void;
  onConfigChanged?: (config: IssueFlowConfig) => void;
}

/**
 * Action return type
 */
export interface IssueFlowActionReturn {
  update?: (params: IssueFlowActionParams) => void;
  destroy?: () => void;
}

/**
 * Store creation options
 */
export interface CreateIssueFlowStoreOptions {
  /** Initial configuration */
  config?: IssueFlowConfig;
  /** Auto initialize */
  autoInit?: boolean;
  /** SSR mode */
  ssr?: boolean;
}

/**
 * SSR context for SvelteKit
 */
export interface IssueFlowSSRContext {
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
 * SvelteKit load function return type
 */
export interface IssueFlowPageData {
  /** IssueFlow context */
  issueflow: IssueFlowSSRContext;
}

/**
 * Plugin configuration for SvelteKit
 */
export interface SvelteKitPluginConfig {
  /** Auto-inject widget */
  autoInject?: boolean;
  /** Inject position */
  injectPosition?: 'head' | 'body' | 'app';
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
    /** Hot module replacement */
    hmr?: boolean;
  };
}

/**
 * Error types
 */
export class IssueFlowSvelteError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'IssueFlowSvelteError';
  }
}

/**
 * Event names for custom events
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
 * Custom event detail types
 */
export interface IssueFlowEventDetail {
  [ISSUE_FLOW_EVENTS.INITIALIZED]: { config: IssueFlowConfig };
  [ISSUE_FLOW_EVENTS.ISSUE_SUBMITTED]: { result: IssueSubmissionResult };
  [ISSUE_FLOW_EVENTS.WIDGET_OPENED]: {};
  [ISSUE_FLOW_EVENTS.WIDGET_CLOSED]: {};
  [ISSUE_FLOW_EVENTS.ERROR_OCCURRED]: { error: Error };
  [ISSUE_FLOW_EVENTS.CONFIG_UPDATED]: { config: IssueFlowConfig };
}

/**
 * Testing utilities
 */
export interface IssueFlowTestUtils {
  /** Mock stores */
  mockStores: IssueFlowStore;
  /** Mock service */
  mockService: IssueFlowService;
  /** Cleanup function */
  cleanup: () => void;
}

/**
 * Vite plugin options
 */
export interface IssueFlowVitePluginOptions {
  /** Auto-inject configuration */
  autoInject?: boolean;
  /** Development mode */
  dev?: boolean;
  /** Bundle analysis */
  analyze?: boolean;
}
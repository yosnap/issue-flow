/**
 * @fileoverview Vue Adapter Type Definitions
 * 
 * TypeScript definitions specific to the Vue 3 adapter.
 * Extends core types with Vue-specific interfaces and composables.
 */

import type { Ref, ComputedRef, App, Plugin, InjectionKey } from 'vue';
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
 * Vue-specific configuration extensions
 */
export interface VueIssueFlowConfig {
  /** Vue-specific configuration */
  vue?: {
    /** Register as global plugin */
    global?: boolean;
    /** Provide/inject key */
    injectionKey?: string | symbol;
    /** Component name prefix */
    componentPrefix?: string;
    /** Enable Vue DevTools integration */
    devtools?: boolean;
    /** Custom error handler */
    errorHandler?: (error: Error, componentName: string) => void;
  };
}

/**
 * Extended configuration for Vue
 */
export interface IssueFlowConfig extends BaseConfig, VueIssueFlowConfig {}

/**
 * Composable return type
 */
export interface UseIssueFlowReturn {
  // State
  /** Current configuration */
  config: Readonly<Ref<IssueFlowConfig | null>>;
  /** Loading state */
  isLoading: Readonly<Ref<boolean>>;
  /** Error state */
  error: Readonly<Ref<Error | null>>;
  /** Current user */
  user: Readonly<Ref<User | null>>;
  /** Issues list */
  issues: Readonly<Ref<Issue[]>>;
  /** Widget open state */
  isOpen: Ref<boolean>;
  
  // Computed
  /** Is service initialized */
  isInitialized: ComputedRef<boolean>;
  /** Has error occurred */
  hasError: ComputedRef<boolean>;
  /** Total issues count */
  totalIssues: ComputedRef<number>;
  
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
  /** Cleanup */
  cleanup: () => void;
}

/**
 * Widget props interface
 */
export interface IssueFlowWidgetProps {
  /** Widget configuration */
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
}

/**
 * Widget emits interface
 */
export interface IssueFlowWidgetEmits {
  (event: 'issue-submitted', result: IssueSubmissionResult): void;
  (event: 'widget-opened'): void;
  (event: 'widget-closed'): void;
  (event: 'error', error: Error): void;
  (event: 'config-changed', config: IssueFlowConfig): void;
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
  /** Custom component */
  component?: any;
}

/**
 * Plugin options for Vue
 */
export interface IssueFlowPluginOptions {
  /** Global configuration */
  config: IssueFlowConfig;
  /** Component registration options */
  components?: {
    /** Register components globally */
    global?: boolean;
    /** Component name prefix */
    prefix?: string;
    /** Components to register */
    include?: string[];
    /** Components to exclude */
    exclude?: string[];
  };
  /** Router integration */
  router?: {
    /** Enable router integration */
    enabled?: boolean;
    /** Route for admin panel */
    adminRoute?: string;
  };
  /** Store integration */
  store?: {
    /** Enable store integration */
    enabled?: boolean;
    /** Store module name */
    moduleName?: string;
  };
}

/**
 * Injection keys for provide/inject
 */
export const ISSUEFLOW_CONFIG_KEY: InjectionKey<Readonly<Ref<IssueFlowConfig>>> = Symbol('issueflow:config');
export const ISSUEFLOW_SERVICE_KEY: InjectionKey<UseIssueFlowReturn> = Symbol('issueflow:service');

/**
 * Store module state
 */
export interface IssueFlowStoreState {
  config: IssueFlowConfig | null;
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  issues: Issue[];
  isWidgetOpen: boolean;
  stats: {
    total: number;
    byType: Record<IssueType, number>;
    byPriority: Record<IssuePriority, number>;
  };
}

/**
 * Store module actions
 */
export interface IssueFlowStoreActions {
  initialize(config: IssueFlowConfig): Promise<void>;
  submitIssue(issue: Partial<Issue>): Promise<IssueSubmissionResult>;
  loadIssues(filters?: IssueFilters): Promise<Issue[]>;
  updateConfig(config: Partial<IssueFlowConfig>): void;
  openWidget(): void;
  closeWidget(): void;
  clearError(): void;
  reset(): void;
}

/**
 * Error types
 */
export class IssueFlowVueError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'IssueFlowVueError';
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
 * Composable options
 */
export interface UseIssueFlowOptions {
  /** Auto-initialize on mount */
  autoInit?: boolean;
  /** Initial configuration */
  config?: IssueFlowConfig;
  /** Enable DevTools */
  devtools?: boolean;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Success handler */
  onSuccess?: (result: IssueSubmissionResult) => void;
}

/**
 * Testing utilities
 */
export interface IssueFlowMockService {
  submitIssue: jest.Mock<Promise<IssueSubmissionResult>>;
  loadIssues: jest.Mock<Promise<Issue[]>>;
  initialize: jest.Mock<Promise<void>>;
  config: Ref<IssueFlowConfig | null>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
}
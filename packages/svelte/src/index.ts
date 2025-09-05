/**
 * @fileoverview Main entry point for IssueFlow Svelte adapter
 * 
 * Exports all public APIs for Svelte integration including
 * stores, actions, components, and utilities.
 */

// Stores
export { 
  createIssueFlowStore, 
  getIssueFlowStore, 
  resetGlobalStore, 
  createMockIssueFlowStore 
} from './stores/issueflow.js';

// Actions
export {
  issueflow,
  widgetTrigger,
  autoSubmitIssue,
  clickOutside,
  escapeKey,
  focusTrap,
  portal,
  autoResize,
  copyToClipboard,
} from './lib/actions.js';

// Components
export { default as IssueFlowWidget } from './components/IssueFlowWidget.svelte';

// Types
export type {
  // Configuration
  IssueFlowConfig,
  SvelteIssueFlowConfig,
  
  // Core types
  Issue,
  IssueType,
  IssuePriority,
  IssueStatus,
  User,
  Organization,
  Project,
  
  // Store types
  IssueFlowStore,
  IssueFlowDerivedStore,
  IssueFlowService,
  IssueFlowContext,
  CreateIssueFlowStoreOptions,
  
  // Component types
  IssueFlowWidgetProps,
  IssueFormProps,
  IssueListProps,
  
  // Form types
  FormField,
  ValidationRule,
  IssueFilters,
  ListColumn,
  
  // Action types
  IssueFlowActionParams,
  IssueFlowActionReturn,
  
  // SSR types
  IssueFlowSSRContext,
  IssueFlowPageData,
  
  // Plugin types
  SvelteKitPluginConfig,
  IssueFlowVitePluginOptions,
  
  // Event types
  IssueFlowEventDetail,
  
  // Results
  IssueSubmissionResult,
  
  // Error types
  IssueFlowSvelteError,
  
  // Testing
  IssueFlowTestUtils,
} from './types/index.js';

// Constants
export { ISSUE_FLOW_EVENTS } from './types/index.js';

// Version
export const VERSION = '0.2.0';

/**
 * Default configuration for Svelte
 */
export const DEFAULT_SVELTE_CONFIG = {
  svelte: {
    autoInit: true,
    stores: {
      config: 'ifConfig',
      issues: 'ifIssues',
      user: 'ifUser',
      loading: 'ifLoading',
      error: 'ifError',
    },
    components: {
      global: false,
      prefix: 'If',
    },
    kit: {
      ssr: true,
      prerender: false,
      serviceWorker: false,
    },
  },
} as const;
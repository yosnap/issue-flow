/**
 * @fileoverview Main entry point for IssueFlow Vue adapter
 * 
 * Exports all public APIs for Vue 3 integration
 */

// Main composable
export { useIssueFlow, createMockIssueFlowService } from './composables/useIssueFlow';

// Components
export { default as IssueFlowWidget } from './components/IssueFlowWidget.vue';

// Plugin
export { IssueFlowPlugin, createIssueFlow } from './plugins/issueflow';

// Types
export type {
  // Configuration
  IssueFlowConfig,
  VueIssueFlowConfig,
  
  // Core types
  Issue,
  IssueType,
  IssuePriority,
  IssueStatus,
  User,
  Organization,
  Project,
  
  // Widget types
  IssueFlowWidgetProps,
  IssueFlowWidgetEmits,
  
  // Form types
  IssueFormProps,
  FormField,
  ValidationRule,
  
  // List types
  IssueListProps,
  IssueFilters,
  ListColumn,
  
  // Store types
  IssueFlowStoreState,
  IssueFlowStoreActions,
  
  // Plugin types
  IssueFlowPluginOptions,
  
  // Composable types
  UseIssueFlowReturn,
  UseIssueFlowOptions,
  
  // Results
  IssueSubmissionResult,
  
  // Error types
  IssueFlowVueError,
} from './types';

// Constants
export { 
  ISSUEFLOW_CONFIG_KEY,
  ISSUEFLOW_SERVICE_KEY,
  ISSUE_FLOW_EVENTS 
} from './types';

// Version
export const VERSION = '0.2.0';
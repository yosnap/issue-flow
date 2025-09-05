/**
 * @fileoverview Public API for IssueFlow Angular Adapter
 * 
 * Main export file exposing all public components, services,
 * modules, and types for the Angular integration.
 */

// Core module exports
export { IssueFlowModule, IssueFlowWidgetModule, IssueFlowTestingModule } from './lib/issue-flow.module';

// Service exports
export { IssueFlowService, ISSUEFLOW_CONFIG } from './services/issue-flow.service';

// Component exports
export { IssueFlowWidgetComponent } from './components/issue-flow-widget.component';

// Type exports
export type {
  // Core types (re-exported from SDK)
  IssueFlowConfig,
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
  
  // Angular-specific types
  AngularIssueFlowConfig,
  IssueFlowAngularService,
  IssueFlowWidgetInputs,
  IssueFlowWidgetOutputs,
  IssueFormComponent,
  IssueListComponent,
  IssueTriggerComponent,
  IssueFlowDirective,
  IssueFlowGuard,
  IssueFlowInterceptor,
  IssueFlowResolver,
  IssueFlowModuleConfig,
  IssueFlowWidgetModule as IssueFlowWidgetModuleInterface,
  IssueFlowFormModule,
  IssueFlowListModule,
  IssueFlowAdminModule,
  IssueFlowTestingModule as IssueFlowTestingModuleInterface,
} from './types';

// Error classes
export { 
  IssueFlowAngularError, 
  IssueFlowConfigError, 
  IssueFlowSubmissionError 
} from './types';

// Utility functions
export { createIssueFlowConfiguration } from './utils/configuration';
export { IssueFlowValidators } from './utils/validators';

// Version
export const ANGULAR_ADAPTER_VERSION = '0.1.0';
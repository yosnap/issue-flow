/**
 * @fileoverview Angular Adapter Type Definitions
 * 
 * TypeScript definitions specific to the Angular adapter.
 * Extends core types with Angular-specific interfaces.
 */

import { InjectionToken, Type } from '@angular/core';
import { Observable } from 'rxjs';

// Re-export core types
export type {
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
} from '@issueflow/sdk';

/**
 * Angular-specific configuration
 */
export interface AngularIssueFlowConfig {
  /** Angular-specific module configuration */
  module?: {
    /** Lazy load the widget module */
    lazyLoad?: boolean;
    /** Preload strategy */
    preload?: boolean;
  };
  
  /** Angular Forms integration */
  forms?: {
    /** Use reactive forms */
    reactive?: boolean;
    /** Custom validators */
    validators?: Type<any>[];
  };
  
  /** Angular Animations */
  animations?: {
    /** Enable animations */
    enabled?: boolean;
    /** Animation duration in ms */
    duration?: number;
    /** Custom animation configs */
    custom?: any[];
  };
  
  /** Dependency Injection configuration */
  injection?: {
    /** Provide at root level */
    providedIn?: 'root' | 'platform' | 'any' | null;
    /** Custom injection tokens */
    tokens?: InjectionToken<any>[];
  };
}

/**
 * Angular service interface
 */
export interface IssueFlowAngularService {
  /** Configuration observable */
  config$: Observable<any>;
  
  /** Loading state */
  loading$: Observable<boolean>;
  
  /** Error state */
  error$: Observable<Error | null>;
  
  /** Initialize the service */
  initialize(config: any): Promise<void>;
  
  /** Submit an issue */
  submitIssue(issue: any): Promise<any>;
  
  /** Get current user */
  getCurrentUser(): Observable<any>;
  
  /** Update configuration */
  updateConfig(config: Partial<any>): void;
  
  /** Destroy service */
  destroy(): void;
}

/**
 * Widget component inputs
 */
export interface IssueFlowWidgetInputs {
  /** Widget configuration */
  config?: any;
  
  /** Widget position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /** Custom CSS classes */
  cssClass?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Hidden state */
  hidden?: boolean;
  
  /** Custom theme */
  theme?: any;
}

/**
 * Widget component outputs
 */
export interface IssueFlowWidgetOutputs {
  /** Issue submitted event */
  issueSubmitted: any;
  
  /** Widget opened event */
  widgetOpened: void;
  
  /** Widget closed event */
  widgetClosed: void;
  
  /** Error occurred event */
  error: Error;
  
  /** Configuration changed event */
  configChanged: any;
}

/**
 * Form component interface
 */
export interface IssueFormComponent {
  /** Form data */
  formData: any;
  
  /** Form validity */
  isValid: boolean;
  
  /** Submission state */
  isSubmitting: boolean;
  
  /** Submit the form */
  onSubmit(): void;
  
  /** Reset the form */
  onReset(): void;
  
  /** Handle form changes */
  onFormChange(data: any): void;
}

/**
 * List component interface
 */
export interface IssueListComponent {
  /** Issues list */
  issues: any[];
  
  /** Loading state */
  loading: boolean;
  
  /** Pagination info */
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  /** Load issues */
  loadIssues(filters?: any): void;
  
  /** Handle issue selection */
  onIssueSelect(issue: any): void;
  
  /** Handle issue update */
  onIssueUpdate(issue: any): void;
}

/**
 * Trigger component interface
 */
export interface IssueTriggerComponent {
  /** Trigger text */
  text: string;
  
  /** Trigger icon */
  icon?: string;
  
  /** Trigger position */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /** Click handler */
  onClick(): void;
}

/**
 * Angular directive interfaces
 */
export interface IssueFlowDirective {
  /** Auto-capture errors from this element */
  ifAutoCapture: boolean;
  
  /** Custom metadata */
  ifMetadata: Record<string, any>;
  
  /** Trigger feedback on specific events */
  ifTriggerOn: string[];
}

/**
 * Angular guard interface
 */
export interface IssueFlowGuard {
  /** Can activate route */
  canActivate(): boolean | Observable<boolean>;
  
  /** Can deactivate route */
  canDeactivate(): boolean | Observable<boolean>;
}

/**
 * Angular interceptor interface
 */
export interface IssueFlowInterceptor {
  /** Intercept HTTP requests */
  intercept(req: any, next: any): Observable<any>;
}

/**
 * Angular resolver interface
 */
export interface IssueFlowResolver {
  /** Resolve data for route */
  resolve(): Observable<any> | Promise<any> | any;
}

/**
 * Module configuration
 */
export interface IssueFlowModuleConfig {
  /** Global configuration */
  config?: any;
  
  /** Feature modules to load */
  features?: ('widget' | 'form' | 'list' | 'admin')[];
  
  /** Custom components */
  customComponents?: {
    widget?: Type<any>;
    form?: Type<any>;
    list?: Type<any>;
    trigger?: Type<any>;
  };
  
  /** Providers to include */
  providers?: any[];
  
  /** Imports to include */
  imports?: any[];
}

/**
 * Feature module interfaces
 */
export interface IssueFlowWidgetModule {}
export interface IssueFlowFormModule {}
export interface IssueFlowListModule {}
export interface IssueFlowAdminModule {}

/**
 * Testing utilities
 */
export interface IssueFlowTestingModule {
  /** Mock service */
  mockService: Partial<IssueFlowAngularService>;
  
  /** Test configuration */
  testConfig: any;
  
  /** Helper methods */
  helpers: {
    createMockIssue(): any;
    createMockUser(): any;
    createMockConfig(): any;
  };
}

/**
 * Error types
 */
export class IssueFlowAngularError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'IssueFlowAngularError';
  }
}

export class IssueFlowConfigError extends IssueFlowAngularError {
  constructor(message: string, context?: any) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'IssueFlowConfigError';
  }
}

export class IssueFlowSubmissionError extends IssueFlowAngularError {
  constructor(message: string, context?: any) {
    super(message, 'SUBMISSION_ERROR', context);
    this.name = 'IssueFlowSubmissionError';
  }
}
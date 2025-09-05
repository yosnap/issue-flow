/**
 * @fileoverview IssueFlow Angular Service
 * 
 * Main service for Angular integration providing reactive state management,
 * dependency injection, and Angular-specific functionality.
 */

import { Injectable, OnDestroy, Inject, Optional } from '@angular/core';
import { BehaviorSubject, Observable, Subject, throwError, EMPTY } from 'rxjs';
import { catchError, finalize, tap, shareReplay } from 'rxjs/operators';
import { IssueFlowClient } from '@issueflow/sdk';
import type { 
  IssueFlowConfig, 
  Issue, 
  User, 
  IssueSubmissionResult 
} from '@issueflow/sdk';
import { 
  IssueFlowAngularService, 
  IssueFlowAngularError,
  IssueFlowSubmissionError 
} from '../types';

/**
 * Injection token for IssueFlow configuration
 */
export const ISSUEFLOW_CONFIG = new InjectionToken<IssueFlowConfig>('ISSUEFLOW_CONFIG');

/**
 * Angular service implementation for IssueFlow
 */
@Injectable({
  providedIn: 'root'
})
export class IssueFlowService implements IssueFlowAngularService, OnDestroy {
  private client: IssueFlowClient | null = null;
  private destroyed$ = new Subject<void>();
  
  // Reactive state
  private configSubject = new BehaviorSubject<IssueFlowConfig | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<Error | null>(null);
  private userSubject = new BehaviorSubject<User | null>(null);
  private issuesSubject = new BehaviorSubject<Issue[]>([]);
  
  // Public observables
  readonly config$ = this.configSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly user$ = this.userSubject.asObservable();
  readonly issues$ = this.issuesSubject.asObservable();
  
  // Event streams
  private issueSubmittedSubject = new Subject<IssueSubmissionResult>();
  private widgetOpenedSubject = new Subject<void>();
  private widgetClosedSubject = new Subject<void>();
  
  readonly issueSubmitted$ = this.issueSubmittedSubject.asObservable();
  readonly widgetOpened$ = this.widgetOpenedSubject.asObservable();
  readonly widgetClosed$ = this.widgetClosedSubject.asObservable();

  constructor(
    @Optional() @Inject(ISSUEFLOW_CONFIG) private injectedConfig?: IssueFlowConfig
  ) {
    // Auto-initialize if config is injected
    if (this.injectedConfig) {
      this.initialize(this.injectedConfig);
    }
  }

  /**
   * Initialize the service with configuration
   */
  async initialize(config: IssueFlowConfig): Promise<void> {
    try {
      this.setLoading(true);
      this.clearError();
      
      // Validate configuration
      this.validateConfig(config);
      
      // Create client instance
      this.client = new IssueFlowClient(config);
      
      // Initialize client
      await this.client.initialize();
      
      // Update state
      this.configSubject.next(config);
      
      // Load initial user data if authenticated
      if (config.apiKey || config.token) {
        await this.loadCurrentUser();
      }
      
      console.log('[IssueFlow] Service initialized successfully');
      
    } catch (error) {
      const issueFlowError = error instanceof Error 
        ? new IssueFlowAngularError(`Failed to initialize IssueFlow: ${error.message}`, 'INIT_ERROR', { config })
        : new IssueFlowAngularError('Failed to initialize IssueFlow', 'INIT_ERROR', { config });
      
      this.setError(issueFlowError);
      throw issueFlowError;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Submit a new issue
   */
  async submitIssue(issueData: Partial<Issue>): Promise<IssueSubmissionResult> {
    this.ensureInitialized();
    
    try {
      this.setLoading(true);
      this.clearError();
      
      // Add Angular-specific metadata
      const enhancedIssueData = {
        ...issueData,
        metadata: {
          ...issueData.metadata,
          platform: 'angular',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        },
      };
      
      const result = await this.client!.issues.create(enhancedIssueData);
      
      // Update local state
      const currentIssues = this.issuesSubject.value;
      this.issuesSubject.next([result.issue, ...currentIssues]);
      
      // Emit event
      this.issueSubmittedSubject.next(result);
      
      console.log('[IssueFlow] Issue submitted successfully:', result);
      
      return result;
      
    } catch (error) {
      const submissionError = error instanceof Error
        ? new IssueFlowSubmissionError(`Failed to submit issue: ${error.message}`, { issueData })
        : new IssueFlowSubmissionError('Failed to submit issue', { issueData });
      
      this.setError(submissionError);
      throw submissionError;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser(): Observable<User | null> {
    return this.user$;
  }

  /**
   * Load current user from API
   */
  async loadCurrentUser(): Promise<User | null> {
    this.ensureInitialized();
    
    try {
      const user = await this.client!.auth.getCurrentUser();
      this.userSubject.next(user);
      return user;
    } catch (error) {
      console.warn('[IssueFlow] Failed to load current user:', error);
      return null;
    }
  }

  /**
   * Load issues with optional filters
   */
  async loadIssues(filters?: any): Promise<Issue[]> {
    this.ensureInitialized();
    
    try {
      this.setLoading(true);
      
      const issues = await this.client!.issues.list(filters);
      this.issuesSubject.next(issues);
      
      return issues;
      
    } catch (error) {
      const loadError = error instanceof Error
        ? new IssueFlowAngularError(`Failed to load issues: ${error.message}`, 'LOAD_ERROR', { filters })
        : new IssueFlowAngularError('Failed to load issues', 'LOAD_ERROR', { filters });
      
      this.setError(loadError);
      throw loadError;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(configUpdate: Partial<IssueFlowConfig>): void {
    const currentConfig = this.configSubject.value;
    
    if (!currentConfig) {
      throw new IssueFlowAngularError('Service not initialized', 'NOT_INITIALIZED');
    }
    
    const newConfig = { ...currentConfig, ...configUpdate };
    this.validateConfig(newConfig);
    
    if (this.client) {
      this.client.updateConfig(configUpdate);
    }
    
    this.configSubject.next(newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): IssueFlowConfig | null {
    return this.configSubject.value;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.client !== null && this.configSubject.value !== null;
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    
    // Reset state
    this.configSubject.next(null);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
    this.userSubject.next(null);
    this.issuesSubject.next([]);
    
    console.log('[IssueFlow] Service destroyed');
  }

  /**
   * Widget event handlers
   */
  onWidgetOpened(): void {
    this.widgetOpenedSubject.next();
  }

  onWidgetClosed(): void {
    this.widgetClosedSubject.next();
  }

  /**
   * Error handling utilities
   */
  createRetryableOperation<T>(operation: () => Observable<T>, maxRetries: number = 3): Observable<T> {
    return operation().pipe(
      catchError((error, caught) => {
        if (maxRetries > 0) {
          console.warn(`[IssueFlow] Operation failed, retrying... (${maxRetries} attempts left)`, error);
          return this.createRetryableOperation(operation, maxRetries - 1);
        } else {
          console.error('[IssueFlow] Operation failed after all retries', error);
          return throwError(error);
        }
      })
    );
  }

  /**
   * Lifecycle hook
   */
  ngOnDestroy(): void {
    this.destroy();
  }

  // Private methods

  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new IssueFlowAngularError('IssueFlow service not initialized. Call initialize() first.', 'NOT_INITIALIZED');
    }
  }

  private validateConfig(config: IssueFlowConfig): void {
    if (!config.projectId) {
      throw new IssueFlowAngularError('projectId is required in configuration', 'CONFIG_ERROR');
    }
    
    if (!config.apiUrl) {
      throw new IssueFlowAngularError('apiUrl is required in configuration', 'CONFIG_ERROR');
    }
    
    // Additional Angular-specific validations
    if (config.widget?.position && !['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(config.widget.position)) {
      throw new IssueFlowAngularError('Invalid widget position', 'CONFIG_ERROR');
    }
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: Error | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }
}
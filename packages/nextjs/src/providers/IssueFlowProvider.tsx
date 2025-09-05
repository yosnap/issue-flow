/**
 * @fileoverview React Context Provider for IssueFlow
 * 
 * Provides global state management and configuration sharing
 * across Next.js applications using React Context API.
 */

import React, { createContext, useCallback, useEffect, useState, useMemo } from 'react';
import { IssueFlowClient } from '@issueflow/sdk';
import type {
  IssueFlowConfig,
  Issue,
  IssueSubmissionResult,
  User,
  IssueFlowContextValue,
  IssueFlowProviderProps,
  IssueFlowNextJSError,
} from '../types';

/**
 * React Context for IssueFlow
 */
export const IssueFlowContext = createContext<IssueFlowContextValue | null>(null);

/**
 * Global client instance
 */
let globalClient: IssueFlowClient | null = null;

/**
 * IssueFlow Provider Component
 */
export function IssueFlowProvider({
  config: initialConfig,
  children,
  autoInit = true,
  ssr = false,
}: IssueFlowProviderProps) {
  // State
  const [config, setConfig] = useState<IssueFlowConfig | null>(initialConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Computed values
  const isInitialized = useMemo(() => {
    return !ssr && globalClient !== null && config !== null;
  }, [config, ssr]);

  const hasError = useMemo(() => error !== null, [error]);
  const totalIssues = useMemo(() => issues.length, [issues.length]);

  /**
   * Initialize IssueFlow client
   */
  const initialize = useCallback(async (configOverride?: IssueFlowConfig): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const finalConfig = configOverride || config;
      
      if (!finalConfig) {
        throw new IssueFlowNextJSError(
          'Configuration is required to initialize IssueFlow',
          'CONFIG_REQUIRED'
        );
      }

      // Validate configuration
      validateConfig(finalConfig);

      // Skip client creation in SSR
      if (ssr || typeof window === 'undefined') {
        setConfig(finalConfig);
        return;
      }

      // Create or update client
      if (!globalClient) {
        globalClient = new IssueFlowClient(finalConfig);
        await globalClient.initialize();
      } else {
        globalClient.updateConfig(finalConfig);
      }

      setConfig(finalConfig);

      // Load initial data if authenticated
      if (finalConfig.apiKey || finalConfig.token) {
        await loadCurrentUser();
      }

      console.log('[IssueFlow Next.js Provider] Initialized successfully');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize IssueFlow');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [config, ssr]);

  /**
   * Submit an issue
   */
  const submitIssue = useCallback(async (issueData: Partial<Issue>): Promise<IssueSubmissionResult> => {
    if (!isInitialized) {
      throw new IssueFlowNextJSError(
        'IssueFlow not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }
    
    try {
      setIsLoading(true);
      setError(null);

      // Enhance issue data with Next.js context
      const enhancedData: Partial<Issue> = {
        ...issueData,
        metadata: {
          ...issueData.metadata,
          source: 'nextjs-provider',
          platform: 'nextjs',
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          // Next.js specific metadata
          nextjs: {
            router: typeof window !== 'undefined' ? 'client' : 'server',
            buildId: process.env.NEXT_PUBLIC_BUILD_ID,
            version: process.env.NEXT_PUBLIC_VERSION,
          },
        },
      };

      const result = await globalClient!.issues.create(enhancedData);
      
      // Update local state
      setIssues(prev => [result.issue, ...prev]);

      console.log('[IssueFlow Next.js Provider] Issue submitted:', result);
      
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit issue');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  /**
   * Load issues with optional filters
   */
  const loadIssues = useCallback(async (filters?: any): Promise<Issue[]> => {
    if (!isInitialized) {
      throw new IssueFlowNextJSError(
        'IssueFlow not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }
    
    try {
      setIsLoading(true);
      setError(null);

      const loadedIssues = await globalClient!.issues.list(filters);
      setIssues(loadedIssues);
      
      return loadedIssues;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load issues');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  /**
   * Load current user
   */
  const loadCurrentUser = useCallback(async (): Promise<User | null> => {
    if (!isInitialized || ssr) {
      return null;
    }
    
    try {
      const currentUser = await globalClient!.auth.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      console.warn('[IssueFlow Next.js Provider] Failed to load current user:', err);
      return null;
    }
  }, [isInitialized, ssr]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((configUpdate: Partial<IssueFlowConfig>): void => {
    if (!config) {
      throw new IssueFlowNextJSError('Service not initialized', 'NOT_INITIALIZED');
    }

    const newConfig = { ...config, ...configUpdate };
    validateConfig(newConfig);
    
    if (globalClient && !ssr) {
      globalClient.updateConfig(configUpdate);
    }
    
    setConfig(newConfig);
  }, [config, ssr]);

  /**
   * Widget control methods
   */
  const openWidget = useCallback((): void => {
    setIsOpen(true);
  }, []);

  const closeWidget = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const toggleWidget = useCallback((): void => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Error handling
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const handleError = useCallback((err: Error): void => {
    const error = err instanceof IssueFlowNextJSError ? err : 
                  new IssueFlowNextJSError(err.message, 'UNKNOWN_ERROR', { originalError: err });
    
    setError(error);
    console.error('[IssueFlow Next.js Provider] Error:', error);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback((): void => {
    setConfig(initialConfig);
    setIsLoading(false);
    setError(null);
    setUser(null);
    setIssues([]);
    setIsOpen(false);
  }, [initialConfig]);

  /**
   * Validate configuration
   */
  const validateConfig = useCallback((cfg: IssueFlowConfig): void => {
    if (!cfg.projectId) {
      throw new IssueFlowNextJSError('projectId is required', 'INVALID_CONFIG');
    }
    
    if (!cfg.apiUrl) {
      throw new IssueFlowNextJSError('apiUrl is required', 'INVALID_CONFIG');
    }
  }, []);

  // Auto-initialize if configured and not in SSR
  useEffect(() => {
    if (autoInit && config && !ssr && typeof window !== 'undefined') {
      initialize();
    }
  }, [autoInit, config, ssr, initialize]);

  // Context value
  const contextValue: IssueFlowContextValue = useMemo(() => ({
    // State
    config,
    isLoading,
    error,
    user,
    issues,
    isOpen,
    
    // Computed
    isInitialized,
    hasError,
    totalIssues,
    
    // Methods
    initialize,
    submitIssue,
    loadIssues,
    updateConfig,
    openWidget,
    closeWidget,
    toggleWidget,
    clearError,
    reset,
  }), [
    config,
    isLoading,
    error,
    user,
    issues,
    isOpen,
    isInitialized,
    hasError,
    totalIssues,
    initialize,
    submitIssue,
    loadIssues,
    updateConfig,
    openWidget,
    closeWidget,
    toggleWidget,
    clearError,
    reset,
  ]);

  return (
    <IssueFlowContext.Provider value={contextValue}>
      {children}
    </IssueFlowContext.Provider>
  );
}

/**
 * Higher-order component to inject IssueFlow context
 */
export function withIssueFlow<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config?: IssueFlowConfig
) {
  const WithIssueFlowComponent = (props: P) => {
    if (!config) {
      return <WrappedComponent {...props} />;
    }

    return (
      <IssueFlowProvider config={config}>
        <WrappedComponent {...props} />
      </IssueFlowProvider>
    );
  };

  WithIssueFlowComponent.displayName = `withIssueFlow(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithIssueFlowComponent;
}
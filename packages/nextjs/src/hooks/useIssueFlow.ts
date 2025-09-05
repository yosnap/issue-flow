/**
 * @fileoverview Main React Hook for IssueFlow in Next.js
 * 
 * Provides state management and integration with IssueFlow SDK
 * using React hooks patterns optimized for Next.js SSR/SSG.
 */

import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { IssueFlowClient } from '@issueflow/sdk';
import { IssueFlowContext } from '../providers/IssueFlowProvider';
import type {
  IssueFlowConfig,
  Issue,
  IssueSubmissionResult,
  User,
  UseIssueFlowReturn,
  UseIssueFlowOptions,
  IssueFlowNextJSError,
} from '../types';

/**
 * Global client instance (singleton for CSR)
 */
let globalClient: IssueFlowClient | null = null;

/**
 * Main IssueFlow hook for Next.js
 */
export function useIssueFlow(options: UseIssueFlowOptions = {}): UseIssueFlowReturn {
  const {
    autoInit = false,
    config: initialConfig,
    onError,
    onSuccess,
    ssr = false,
  } = options;

  // Try to use context first
  const contextValue = useContext(IssueFlowContext);
  
  // If context is available, use it
  if (contextValue) {
    return contextValue;
  }

  // Standalone hook implementation
  const [config, setConfig] = useState<IssueFlowConfig | null>(initialConfig || null);
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

      const finalConfig = configOverride || initialConfig;
      
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

      console.log('[IssueFlow Next.js] Initialized successfully');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize IssueFlow');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [initialConfig, ssr, onError]);

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
          source: 'nextjs-adapter',
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
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      console.log('[IssueFlow Next.js] Issue submitted:', result);
      
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit issue');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, onSuccess]);

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
      console.warn('[IssueFlow Next.js] Failed to load current user:', err);
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
    
    if (onError) {
      onError(error);
    }
    
    console.error('[IssueFlow Next.js] Error:', error);
  }, [onError]);

  /**
   * Reset state
   */
  const reset = useCallback((): void => {
    setConfig(null);
    setIsLoading(false);
    setError(null);
    setUser(null);
    setIssues([]);
    setIsOpen(false);
  }, []);

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
    if (autoInit && initialConfig && !ssr && typeof window !== 'undefined') {
      initialize();
    }
  }, [autoInit, initialConfig, ssr, initialize]);

  // Return hook interface
  return {
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
  };
}

/**
 * Helper hook for SSR data fetching
 */
export function useIssueFlowSSR() {
  const [ssrData, setSSRData] = useState<{
    config: IssueFlowConfig | null;
    issues: Issue[];
    user: User | null;
  }>({
    config: null,
    issues: [],
    user: null,
  });

  const hydrateSSRData = useCallback((data: {
    config: IssueFlowConfig;
    issues?: Issue[];
    user?: User | null;
  }) => {
    setSSRData({
      config: data.config,
      issues: data.issues || [],
      user: data.user || null,
    });
  }, []);

  return {
    ssrData,
    hydrateSSRData,
  };
}

/**
 * Helper to create a mock service for testing
 */
export function createMockIssueFlowService(): UseIssueFlowReturn {
  const mockService: UseIssueFlowReturn = {
    config: null,
    isLoading: false,
    error: null,
    user: null,
    issues: [],
    isOpen: false,
    
    isInitialized: true,
    hasError: false,
    totalIssues: 0,
    
    initialize: jest.fn().mockResolvedValue(undefined),
    submitIssue: jest.fn().mockResolvedValue({ issue: {} as Issue, success: true }),
    loadIssues: jest.fn().mockResolvedValue([]),
    updateConfig: jest.fn(),
    openWidget: jest.fn(),
    closeWidget: jest.fn(),
    toggleWidget: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  };

  return mockService;
}
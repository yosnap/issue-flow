/**
 * @fileoverview Main Svelte Stores for IssueFlow
 * 
 * Provides reactive state management using Svelte stores
 * for IssueFlow functionality across Svelte applications.
 */

import { writable, derived, get } from 'svelte/store';
import { IssueFlowClient } from '@issueflow/sdk';
import type {
  IssueFlowConfig,
  Issue,
  IssueSubmissionResult,
  User,
  IssueFlowStore,
  IssueFlowDerivedStore,
  IssueFlowService,
  IssueFlowContext,
  CreateIssueFlowStoreOptions,
  IssueFlowSvelteError,
} from '../types';

/**
 * Global client instance (singleton)
 */
let globalClient: IssueFlowClient | null = null;

/**
 * Create IssueFlow stores
 */
export function createIssueFlowStore(options: CreateIssueFlowStoreOptions = {}): IssueFlowContext {
  const { 
    config: initialConfig,
    autoInit = false,
    ssr = false
  } = options;

  // Base stores
  const config = writable<IssueFlowConfig | null>(initialConfig || null);
  const loading = writable<boolean>(false);
  const error = writable<Error | null>(null);
  const user = writable<User | null>(null);
  const issues = writable<Issue[]>([]);
  const isOpen = writable<boolean>(false);

  // Derived stores
  const isInitialized = derived(
    [config], 
    ([$config]) => !ssr && globalClient !== null && $config !== null
  );

  const hasError = derived(
    [error], 
    ([$error]) => $error !== null
  );

  const totalIssues = derived(
    [issues], 
    ([$issues]) => $issues.length
  );

  /**
   * Initialize IssueFlow client
   */
  async function initialize(configOverride?: IssueFlowConfig): Promise<void> {
    try {
      loading.set(true);
      error.set(null);

      const finalConfig = configOverride || initialConfig;
      
      if (!finalConfig) {
        throw new IssueFlowSvelteError(
          'Configuration is required to initialize IssueFlow',
          'CONFIG_REQUIRED'
        );
      }

      // Validate configuration
      validateConfig(finalConfig);

      // Skip client creation in SSR
      if (ssr || typeof window === 'undefined') {
        config.set(finalConfig);
        return;
      }

      // Create or update client
      if (!globalClient) {
        globalClient = new IssueFlowClient(finalConfig);
        await globalClient.initialize();
      } else {
        globalClient.updateConfig(finalConfig);
      }

      config.set(finalConfig);

      // Load initial data if authenticated
      if (finalConfig.apiKey || finalConfig.token) {
        await loadCurrentUser();
      }

      console.log('[IssueFlow Svelte] Initialized successfully');

    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to initialize IssueFlow');
      handleError(errorInstance);
      throw errorInstance;
    } finally {
      loading.set(false);
    }
  }

  /**
   * Submit an issue
   */
  async function submitIssue(issueData: Partial<Issue>): Promise<IssueSubmissionResult> {
    const isInit = get(isInitialized);
    if (!isInit) {
      throw new IssueFlowSvelteError(
        'IssueFlow not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }
    
    try {
      loading.set(true);
      error.set(null);

      // Enhance issue data with Svelte context
      const enhancedData: Partial<Issue> = {
        ...issueData,
        metadata: {
          ...issueData.metadata,
          source: 'svelte-adapter',
          platform: 'svelte',
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          // Svelte specific metadata
          svelte: {
            version: '4.x', // Could be detected from package
            kit: typeof globalThis.__sveltekit !== 'undefined',
          },
        },
      };

      const result = await globalClient!.issues.create(enhancedData);
      
      // Update local state
      issues.update(prev => [result.issue, ...prev]);

      console.log('[IssueFlow Svelte] Issue submitted:', result);
      
      return result;

    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to submit issue');
      handleError(errorInstance);
      throw errorInstance;
    } finally {
      loading.set(false);
    }
  }

  /**
   * Load issues with optional filters
   */
  async function loadIssues(filters?: any): Promise<Issue[]> {
    const isInit = get(isInitialized);
    if (!isInit) {
      throw new IssueFlowSvelteError(
        'IssueFlow not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }
    
    try {
      loading.set(true);
      error.set(null);

      const loadedIssues = await globalClient!.issues.list(filters);
      issues.set(loadedIssues);
      
      return loadedIssues;

    } catch (err) {
      const errorInstance = err instanceof Error ? err : new Error('Failed to load issues');
      handleError(errorInstance);
      throw errorInstance;
    } finally {
      loading.set(false);
    }
  }

  /**
   * Load current user
   */
  async function loadCurrentUser(): Promise<User | null> {
    const isInit = get(isInitialized);
    if (!isInit || ssr) {
      return null;
    }
    
    try {
      const currentUser = await globalClient!.auth.getCurrentUser();
      user.set(currentUser);
      return currentUser;
    } catch (err) {
      console.warn('[IssueFlow Svelte] Failed to load current user:', err);
      return null;
    }
  }

  /**
   * Update configuration
   */
  function updateConfig(configUpdate: Partial<IssueFlowConfig>): void {
    const currentConfig = get(config);
    if (!currentConfig) {
      throw new IssueFlowSvelteError('Service not initialized', 'NOT_INITIALIZED');
    }

    const newConfig = { ...currentConfig, ...configUpdate };
    validateConfig(newConfig);
    
    if (globalClient && !ssr) {
      globalClient.updateConfig(configUpdate);
    }
    
    config.set(newConfig);
  }

  /**
   * Widget control methods
   */
  function openWidget(): void {
    isOpen.set(true);
  }

  function closeWidget(): void {
    isOpen.set(false);
  }

  function toggleWidget(): void {
    isOpen.update(open => !open);
  }

  /**
   * Error handling
   */
  function clearError(): void {
    error.set(null);
  }

  function handleError(err: Error): void {
    const errorInstance = err instanceof IssueFlowSvelteError ? err : 
                         new IssueFlowSvelteError(err.message, 'UNKNOWN_ERROR', { originalError: err });
    
    error.set(errorInstance);
    console.error('[IssueFlow Svelte] Error:', errorInstance);
  }

  /**
   * Reset state
   */
  function reset(): void {
    config.set(initialConfig || null);
    loading.set(false);
    error.set(null);
    user.set(null);
    issues.set([]);
    isOpen.set(false);
  }

  /**
   * Cleanup
   */
  function cleanup(): void {
    if (globalClient) {
      globalClient.destroy();
      globalClient = null;
    }
    reset();
  }

  /**
   * Validate configuration
   */
  function validateConfig(cfg: IssueFlowConfig): void {
    if (!cfg.projectId) {
      throw new IssueFlowSvelteError('projectId is required', 'INVALID_CONFIG');
    }
    
    if (!cfg.apiUrl) {
      throw new IssueFlowSvelteError('apiUrl is required', 'INVALID_CONFIG');
    }
  }

  // Auto-initialize if configured and not in SSR
  if (autoInit && initialConfig && !ssr && typeof window !== 'undefined') {
    initialize().catch(console.error);
  }

  // Return combined interface
  return {
    // Base stores
    config,
    loading,
    error,
    user,
    issues,
    isOpen,

    // Derived stores
    isInitialized,
    hasError,
    totalIssues,

    // Service methods
    initialize,
    submitIssue,
    loadIssues,
    updateConfig,
    openWidget,
    closeWidget,
    toggleWidget,
    clearError,
    reset,
    cleanup,
  };
}

/**
 * Global store instance (singleton)
 */
let globalStore: IssueFlowContext | null = null;

/**
 * Get or create global store instance
 */
export function getIssueFlowStore(options?: CreateIssueFlowStoreOptions): IssueFlowContext {
  if (!globalStore) {
    globalStore = createIssueFlowStore(options);
  }
  return globalStore;
}

/**
 * Reset global store instance
 */
export function resetGlobalStore(): void {
  if (globalStore) {
    globalStore.cleanup();
    globalStore = null;
  }
}

/**
 * Create mock stores for testing
 */
export function createMockIssueFlowStore(): IssueFlowContext {
  const config = writable<IssueFlowConfig | null>(null);
  const loading = writable<boolean>(false);
  const error = writable<Error | null>(null);
  const user = writable<User | null>(null);
  const issues = writable<Issue[]>([]);
  const isOpen = writable<boolean>(false);

  const isInitialized = derived([config], () => true);
  const hasError = derived([error], ([$error]) => $error !== null);
  const totalIssues = derived([issues], ([$issues]) => $issues.length);

  return {
    config,
    loading,
    error,
    user,
    issues,
    isOpen,
    isInitialized,
    hasError,
    totalIssues,
    initialize: async () => {},
    submitIssue: async () => ({ issue: {} as Issue, success: true }),
    loadIssues: async () => [],
    updateConfig: () => {},
    openWidget: () => { isOpen.set(true); },
    closeWidget: () => { isOpen.set(false); },
    toggleWidget: () => { isOpen.update(open => !open); },
    clearError: () => { error.set(null); },
    reset: () => {},
    cleanup: () => {},
  };
}
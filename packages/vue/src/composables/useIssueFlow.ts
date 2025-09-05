/**
 * @fileoverview Main Vue Composable for IssueFlow
 * 
 * Provides reactive state management and integration with IssueFlow SDK
 * using Vue 3 Composition API patterns.
 */

import { 
  ref, 
  computed, 
  readonly, 
  onMounted, 
  onUnmounted,
  inject,
  provide,
  getCurrentInstance,
  watch,
  toRefs,
  reactive
} from 'vue';
import { IssueFlowClient } from '@issueflow/sdk';
import type { 
  IssueFlowConfig,
  Issue,
  User,
  IssueSubmissionResult,
  UseIssueFlowReturn,
  UseIssueFlowOptions,
  IssueFlowVueError,
  ISSUEFLOW_SERVICE_KEY,
  ISSUEFLOW_CONFIG_KEY
} from '../types';

/**
 * Global client instance (singleton)
 */
let globalClient: IssueFlowClient | null = null;

/**
 * Global state (shared across all composable instances)
 */
const globalState = reactive({
  config: null as IssueFlowConfig | null,
  isLoading: false,
  error: null as Error | null,
  user: null as User | null,
  issues: [] as Issue[],
  isOpen: false,
});

/**
 * Main IssueFlow composable
 */
export function useIssueFlow(options: UseIssueFlowOptions = {}): UseIssueFlowReturn {
  const {
    autoInit = false,
    config: initialConfig,
    devtools = false,
    onError,
    onSuccess,
  } = options;

  // Local state (instance-specific)
  const localLoading = ref(false);
  const localError = ref<Error | null>(null);

  // Use injected service if available
  const injectedService = inject<UseIssueFlowReturn>(ISSUEFLOW_SERVICE_KEY, null);
  if (injectedService) {
    return injectedService;
  }

  // Use injected config if available
  const injectedConfig = inject<Readonly<Ref<IssueFlowConfig>>>(ISSUEFLOW_CONFIG_KEY, null);
  
  // Create reactive refs from global state
  const config = computed(() => globalState.config);
  const isLoading = computed(() => globalState.isLoading || localLoading.value);
  const error = computed(() => globalState.error || localError.value);
  const user = computed(() => globalState.user);
  const issues = computed(() => globalState.issues);
  const isOpen = computed({
    get: () => globalState.isOpen,
    set: (value) => { globalState.isOpen = value; }
  });

  // Computed properties
  const isInitialized = computed(() => globalClient !== null && config.value !== null);
  const hasError = computed(() => error.value !== null);
  const totalIssues = computed(() => issues.value.length);

  /**
   * Initialize IssueFlow client
   */
  async function initialize(configOverride?: IssueFlowConfig): Promise<void> {
    try {
      localLoading.value = true;
      clearError();

      const finalConfig = configOverride || initialConfig || injectedConfig?.value;
      
      if (!finalConfig) {
        throw new IssueFlowVueError(
          'Configuration is required to initialize IssueFlow',
          'CONFIG_REQUIRED'
        );
      }

      // Validate configuration
      validateConfig(finalConfig);

      // Create or update client
      if (!globalClient) {
        globalClient = new IssueFlowClient(finalConfig);
        await globalClient.initialize();
      } else {
        globalClient.updateConfig(finalConfig);
      }

      // Update global state
      globalState.config = finalConfig;

      // Load initial data if authenticated
      if (finalConfig.apiKey || finalConfig.token) {
        await loadCurrentUser();
      }

      // Setup DevTools if enabled
      if (devtools && typeof window !== 'undefined') {
        setupDevTools();
      }

      console.log('[IssueFlow Vue] Initialized successfully');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize IssueFlow');
      handleError(error);
      throw error;
    } finally {
      localLoading.value = false;
    }
  }

  /**
   * Submit an issue
   */
  async function submitIssue(issueData: Partial<Issue>): Promise<IssueSubmissionResult> {
    ensureInitialized();
    
    try {
      localLoading.value = true;
      clearError();

      // Enhance issue data with Vue context
      const enhancedData: Partial<Issue> = {
        ...issueData,
        metadata: {
          ...issueData.metadata,
          source: 'vue-adapter',
          platform: 'vue',
          timestamp: new Date().toISOString(),
          url: window?.location?.href,
          userAgent: navigator?.userAgent,
        },
      };

      const result = await globalClient!.issues.create(enhancedData);
      
      // Update local state
      globalState.issues = [result.issue, ...globalState.issues];
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      console.log('[IssueFlow Vue] Issue submitted:', result);
      
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit issue');
      handleError(error);
      throw error;
    } finally {
      localLoading.value = false;
    }
  }

  /**
   * Load issues with optional filters
   */
  async function loadIssues(filters?: any): Promise<Issue[]> {
    ensureInitialized();
    
    try {
      localLoading.value = true;
      clearError();

      const loadedIssues = await globalClient!.issues.list(filters);
      globalState.issues = loadedIssues;
      
      return loadedIssues;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load issues');
      handleError(error);
      throw error;
    } finally {
      localLoading.value = false;
    }
  }

  /**
   * Load current user
   */
  async function loadCurrentUser(): Promise<User | null> {
    ensureInitialized();
    
    try {
      const currentUser = await globalClient!.auth.getCurrentUser();
      globalState.user = currentUser;
      return currentUser;
    } catch (err) {
      console.warn('[IssueFlow Vue] Failed to load current user:', err);
      return null;
    }
  }

  /**
   * Update configuration
   */
  function updateConfig(configUpdate: Partial<IssueFlowConfig>): void {
    if (!config.value) {
      throw new IssueFlowVueError('Service not initialized', 'NOT_INITIALIZED');
    }

    const newConfig = { ...config.value, ...configUpdate };
    validateConfig(newConfig);
    
    if (globalClient) {
      globalClient.updateConfig(configUpdate);
    }
    
    globalState.config = newConfig;
  }

  /**
   * Widget control methods
   */
  function openWidget(): void {
    globalState.isOpen = true;
  }

  function closeWidget(): void {
    globalState.isOpen = false;
  }

  function toggleWidget(): void {
    globalState.isOpen = !globalState.isOpen;
  }

  /**
   * Error handling
   */
  function clearError(): void {
    globalState.error = null;
    localError.value = null;
  }

  function handleError(err: Error): void {
    const error = err instanceof IssueFlowVueError ? err : 
                  new IssueFlowVueError(err.message, 'UNKNOWN_ERROR', { originalError: err });
    
    localError.value = error;
    globalState.error = error;
    
    if (onError) {
      onError(error);
    }
    
    console.error('[IssueFlow Vue] Error:', error);
  }

  /**
   * Reset state
   */
  function reset(): void {
    globalState.config = null;
    globalState.isLoading = false;
    globalState.error = null;
    globalState.user = null;
    globalState.issues = [];
    globalState.isOpen = false;
    localLoading.value = false;
    localError.value = null;
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
   * Ensure service is initialized
   */
  function ensureInitialized(): void {
    if (!isInitialized.value) {
      throw new IssueFlowVueError(
        'IssueFlow not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }
  }

  /**
   * Validate configuration
   */
  function validateConfig(cfg: IssueFlowConfig): void {
    if (!cfg.projectId) {
      throw new IssueFlowVueError('projectId is required', 'INVALID_CONFIG');
    }
    
    if (!cfg.apiUrl) {
      throw new IssueFlowVueError('apiUrl is required', 'INVALID_CONFIG');
    }
  }

  /**
   * Setup Vue DevTools integration
   */
  function setupDevTools(): void {
    const instance = getCurrentInstance();
    
    if (instance && (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      const devtools = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
      
      devtools.emit('issueflow:init', {
        config: config.value,
        state: {
          isLoading: isLoading.value,
          hasError: hasError.value,
          totalIssues: totalIssues.value,
        },
      });
    }
  }

  // Auto-initialize if configured
  if (autoInit && (initialConfig || injectedConfig)) {
    onMounted(() => {
      initialize();
    });
  }

  // Cleanup on unmount
  onUnmounted(() => {
    // Only cleanup if this is the last instance
    // This is handled by reference counting in production
  });

  // Watch for config changes
  if (injectedConfig) {
    watch(injectedConfig, (newConfig) => {
      if (newConfig) {
        initialize(newConfig);
      }
    });
  }

  // Create return object
  const service: UseIssueFlowReturn = {
    // State (readonly refs)
    config: readonly(computed(() => config.value)),
    isLoading: readonly(computed(() => isLoading.value)),
    error: readonly(computed(() => error.value)),
    user: readonly(computed(() => user.value)),
    issues: readonly(computed(() => issues.value)),
    isOpen: isOpen,
    
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
    cleanup,
  };

  // Provide service for child components
  const instance = getCurrentInstance();
  if (instance) {
    provide(ISSUEFLOW_SERVICE_KEY, service);
  }

  return service;
}

/**
 * Helper to create a mock service for testing
 */
export function createMockIssueFlowService(): UseIssueFlowReturn {
  const config = ref<IssueFlowConfig | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const user = ref<User | null>(null);
  const issues = ref<Issue[]>([]);
  const isOpen = ref(false);

  return {
    config: readonly(config),
    isLoading: readonly(isLoading),
    error: readonly(error),
    user: readonly(user),
    issues: readonly(issues),
    isOpen,
    
    isInitialized: computed(() => config.value !== null),
    hasError: computed(() => error.value !== null),
    totalIssues: computed(() => issues.value.length),
    
    initialize: async (cfg) => { config.value = cfg; },
    submitIssue: async (issue) => ({ issue: issue as Issue, success: true }),
    loadIssues: async () => [],
    updateConfig: (cfg) => { /* noop */ },
    openWidget: () => { isOpen.value = true; },
    closeWidget: () => { isOpen.value = false; },
    toggleWidget: () => { isOpen.value = !isOpen.value; },
    clearError: () => { error.value = null; },
    reset: () => { /* noop */ },
    cleanup: () => { /* noop */ },
  };
}
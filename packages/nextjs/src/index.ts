/**
 * @fileoverview Main entry point for IssueFlow Next.js adapter
 * 
 * Exports all public APIs for Next.js integration including
 * hooks, components, providers, and utilities.
 */

// Hooks
export { useIssueFlow, useIssueFlowSSR, createMockIssueFlowService } from './hooks/useIssueFlow';

// Components
export { IssueFlowWidget } from './components/IssueFlowWidget';

// Providers
export { IssueFlowProvider, IssueFlowContext, withIssueFlow } from './providers/IssueFlowProvider';

// SSR/SSG Utilities
export {
  withIssueFlowSSR,
  withIssueFlowSSG,
  extractIssueFlowProps,
  isSSR,
  safeWindow,
  safeLocalStorage,
  createHydrationSafeConfig,
  AppRouter,
  EdgeRuntime,
  Middleware,
} from './utils/withSSR';

// Types
export type {
  // Configuration
  IssueFlowConfig,
  NextJSIssueFlowConfig,
  
  // Core types
  Issue,
  IssueType,
  IssuePriority,
  IssueStatus,
  User,
  Organization,
  Project,
  
  // Component types
  IssueFlowWidgetProps,
  IssueFormProps,
  IssueListProps,
  
  // Context types
  IssueFlowContextValue,
  IssueFlowProviderProps,
  
  // Hook types
  UseIssueFlowReturn,
  UseIssueFlowOptions,
  
  // Form types
  FormField,
  ValidationRule,
  IssueFilters,
  ListColumn,
  
  // SSR types
  IssueFlowSSRProps,
  IssueFlowLayoutProps,
  IssueFlowPageProps,
  
  // API types
  IssueFlowApiRequest,
  IssueFlowApiResponse,
  ApiResponse,
  
  // Middleware types
  IssueFlowMiddlewareConfig,
  
  // Plugin types
  NextJSPluginConfig,
  IssueFlowWebpackPluginOptions,
  
  // Results
  IssueSubmissionResult,
  
  // Error types
  IssueFlowNextJSError,
  
  // Testing
  IssueFlowTestUtils,
} from './types';

// Constants
export { ISSUE_FLOW_EVENTS } from './types';

// Version
export const VERSION = '0.2.0';

/**
 * Default configuration for Next.js
 */
export const DEFAULT_NEXTJS_CONFIG = {
  nextjs: {
    ssr: true,
    ssg: false,
    api: {
      basePath: '/api/issueflow',
      cors: true,
    },
    appRouter: {
      enabled: true,
      layout: false,
    },
    pagesRouter: {
      enabled: true,
      document: false,
    },
    middleware: {
      enabled: false,
      matcher: ['/api/issueflow/:path*'],
    },
  },
} as const;
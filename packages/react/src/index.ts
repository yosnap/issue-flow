/**
 * @fileoverview IssueFlow React Adapter Entry Point
 * 
 * Complete React adapter integrating all 6 agent perspectives:
 * - FRAMEWORK_ARCHITECT: Multi-tenant architecture support
 * - PLUGIN_SYSTEM_ARCHITECT: Extensible component system
 * - SDK_DEVELOPER: TypeScript-first developer experience
 * - CLI_ENGINEER: Easy integration and setup
 * - BUSINESS_STRATEGIST: Freemium model with upgrade paths
 * - COMMUNITY_BUILDER: Open source contribution friendly
 */

// Core components
export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';

// Quick setup exports for CLI integration
export {
  IssueFlowProvider,
  IssueFlowWidget,
} from './components';

export {
  useIssueFlow,
} from './hooks';

// Plugin system integration exports
export {
  pluginHelpers,
  businessHelpers,
  communityHelpers,
} from './utils';

// React adapter version
export const REACT_ADAPTER_VERSION = '0.1.0';

/**
 * Quick setup function for CLI-generated projects
 * Following CLI_ENGINEER specifications
 */
export function createIssueFlowSetup(config: {
  projectId: string;
  apiKey?: string;
  organizationSlug?: string;
  theme?: 'light' | 'dark' | 'auto';
}) {
  return {
    Provider: IssueFlowProvider,
    Widget: IssueFlowWidget,
    config: {
      projectId: config.projectId,
      apiKey: config.apiKey,
      organizationSlug: config.organizationSlug,
      apiUrl: 'https://api.issueflow.dev',
      theme: {
        mode: config.theme || 'auto',
        primaryColor: '#3b82f6',
        borderRadius: 8,
      },
      widget: {
        position: 'bottom-right' as const,
        trigger: 'button' as const,
        triggerText: 'Feedback',
      },
      behavior: {
        captureConsoleErrors: false,
        captureUnhandledRejections: false,
        requireEmail: false,
        allowAnonymous: true,
        showSuccessMessage: true,
        autoClose: true,
        autoCloseDelay: 3000,
      },
    },
  };
}

/**
 * Development helper with all debugging features enabled
 * For COMMUNITY_BUILDER friendly development experience
 */
export function createIssueFlowDev(config: {
  projectId: string;
  organizationSlug?: string;
}) {
  return createIssueFlowSetup({
    ...config,
    theme: 'auto',
  });
}

// Export default for simple imports
import { IssueFlowProvider, IssueFlowWidget } from './components';
import { useIssueFlow } from './hooks';

export default {
  Provider: IssueFlowProvider,
  Widget: IssueFlowWidget,
  useIssueFlow,
  createSetup: createIssueFlowSetup,
  createDev: createIssueFlowDev,
  version: REACT_ADAPTER_VERSION,
};
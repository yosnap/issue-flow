/**
 * IssueFlow Plugin System
 * 
 * This module provides the core plugin system for IssueFlow, including:
 * - PluginRegistry for managing plugin lifecycle
 * - BasePlugin class for easy plugin development
 * - Example plugins for common integrations
 */

export { PluginRegistry } from './PluginRegistry';
export { BasePlugin } from './BasePlugin';
export { GitHubPlugin } from './GitHubPlugin';

// Re-export plugin types for convenience
export {
  Plugin,
  PluginManifest,
  PluginStatus,
  PluginType,
  PluginConfig,
  IssueFlowPlugin,
  PluginEvent,
  IssueCreatedEvent,
  IssueUpdatedEvent,
  IssueStatusChangedEvent,
  UserActionEvent,
  WebhookEvent
} from '../types/plugin.types';
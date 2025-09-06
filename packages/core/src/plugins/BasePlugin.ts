import {
  IssueFlowPlugin,
  PluginType,
  PluginConfig,
  IssueCreatedEvent,
  IssueUpdatedEvent,
  IssueStatusChangedEvent,
  UserActionEvent,
  WebhookEvent
} from '../types/plugin.types';

/**
 * Base class for IssueFlow plugins
 * Provides common functionality and default implementations
 */
export abstract class BasePlugin implements IssueFlowPlugin {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly type: PluginType;

  private _config: PluginConfig = {};
  private _isInstalled = false;
  private _isActive = false;

  /**
   * Get current plugin configuration
   */
  get config(): PluginConfig {
    return this._config;
  }

  /**
   * Check if plugin is installed
   */
  get isInstalled(): boolean {
    return this._isInstalled;
  }

  /**
   * Check if plugin is active
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Install the plugin with given configuration
   */
  async install(config: PluginConfig): Promise<void> {
    if (this._isInstalled) {
      throw new Error(`Plugin ${this.name} is already installed`);
    }

    if (!this.validateConfig(config)) {
      throw new Error(`Invalid configuration for plugin ${this.name}`);
    }

    this._config = { ...config };
    await this.onInstall(config);
    this._isInstalled = true;
  }

  /**
   * Activate the plugin
   */
  async activate(): Promise<void> {
    if (!this._isInstalled) {
      throw new Error(`Plugin ${this.name} must be installed before activation`);
    }

    if (this._isActive) {
      return; // Already active
    }

    await this.onActivate();
    this._isActive = true;
  }

  /**
   * Deactivate the plugin
   */
  async deactivate(): Promise<void> {
    if (!this._isActive) {
      return; // Already inactive
    }

    await this.onDeactivate();
    this._isActive = false;
  }

  /**
   * Uninstall the plugin
   */
  async uninstall(): Promise<void> {
    if (this._isActive) {
      await this.deactivate();
    }

    if (!this._isInstalled) {
      return; // Already uninstalled
    }

    await this.onUninstall();
    this._isInstalled = false;
    this._config = {};
  }

  /**
   * Get configuration schema for this plugin
   */
  getConfigSchema(): object {
    return {
      type: 'object',
      properties: {},
      additionalProperties: true
    };
  }

  /**
   * Validate plugin configuration
   */
  validateConfig(config: PluginConfig): boolean {
    // Basic validation - can be overridden by subclasses
    return typeof config === 'object' && config !== null;
  }

  // Lifecycle hooks - can be overridden by subclasses
  protected async onInstall(config: PluginConfig): Promise<void> {
    // Default implementation - no-op
  }

  protected async onActivate(): Promise<void> {
    // Default implementation - no-op
  }

  protected async onDeactivate(): Promise<void> {
    // Default implementation - no-op
  }

  protected async onUninstall(): Promise<void> {
    // Default implementation - no-op
  }

  // Event handlers - can be overridden by subclasses
  async onIssueCreated?(event: IssueCreatedEvent): Promise<void>;
  async onIssueUpdated?(event: IssueUpdatedEvent): Promise<void>;
  async onIssueStatusChanged?(event: IssueStatusChangedEvent): Promise<void>;
  async onUserAction?(event: UserActionEvent): Promise<void>;
  async onWebhookReceived?(event: WebhookEvent): Promise<void>;

  /**
   * Utility method to get configuration value with default
   */
  protected getConfigValue<T>(key: string, defaultValue: T): T {
    return this._config[key] !== undefined ? this._config[key] : defaultValue;
  }

  /**
   * Utility method to log messages with plugin context
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefix = `[Plugin:${this.name}]`;
    
    switch (level) {
      case 'info':
        console.log(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, data || '');
        break;
    }
  }
}
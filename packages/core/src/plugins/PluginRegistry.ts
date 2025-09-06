import { 
  Plugin, 
  PluginManifest, 
  PluginStatus, 
  PluginConfig,
  IssueFlowPlugin,
  PluginEvent
} from '../types/plugin.types';
import { EventEmitter } from 'events';

export class PluginRegistry extends EventEmitter {
  private plugins: Map<string, IssueFlowPlugin> = new Map();
  private pluginConfigs: Map<string, Plugin> = new Map();

  constructor() {
    super();
  }

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: IssueFlowPlugin, config: PluginConfig = {}): Promise<void> {
    try {
      const pluginId = this.generatePluginId(plugin.name, plugin.version);
      
      // Validate configuration
      if (!plugin.validateConfig(config)) {
        throw new Error(`Invalid configuration for plugin ${plugin.name}`);
      }

      // Create plugin record
      const pluginRecord: Plugin = {
        id: pluginId,
        manifest: {
          name: plugin.name,
          version: plugin.version,
          description: `Plugin ${plugin.name}`,
          author: 'Unknown',
          type: plugin.type,
          compatibility: '*',
          permissions: [],
          hooks: []
        },
        config,
        status: PluginStatus.INSTALLED,
        installedAt: new Date(),
        lastUpdatedAt: new Date()
      };

      // Install plugin
      await plugin.install(config);
      
      // Store plugin
      this.plugins.set(pluginId, plugin);
      this.pluginConfigs.set(pluginId, pluginRecord);

      console.log(`Plugin ${plugin.name} registered successfully`);
      this.emit('plugin.registered', { plugin: pluginRecord });

    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const pluginRecord = this.pluginConfigs.get(pluginId);

    if (!plugin || !pluginRecord) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (pluginRecord.status === PluginStatus.ACTIVE) {
      return; // Already active
    }

    try {
      await plugin.activate();
      
      pluginRecord.status = PluginStatus.ACTIVE;
      pluginRecord.lastUpdatedAt = new Date();
      pluginRecord.errorMessage = undefined;

      console.log(`Plugin ${plugin.name} activated`);
      this.emit('plugin.activated', { plugin: pluginRecord });

    } catch (error) {
      pluginRecord.status = PluginStatus.ERROR;
      pluginRecord.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Failed to activate plugin ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    const pluginRecord = this.pluginConfigs.get(pluginId);

    if (!plugin || !pluginRecord) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (pluginRecord.status !== PluginStatus.ACTIVE) {
      return; // Already inactive
    }

    try {
      await plugin.deactivate();
      
      pluginRecord.status = PluginStatus.INACTIVE;
      pluginRecord.lastUpdatedAt = new Date();
      pluginRecord.errorMessage = undefined;

      console.log(`Plugin ${plugin.name} deactivated`);
      this.emit('plugin.deactivated', { plugin: pluginRecord });

    } catch (error) {
      pluginRecord.status = PluginStatus.ERROR;
      pluginRecord.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Failed to deactivate plugin ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.pluginConfigs.values());
  }

  /**
   * Get active plugins
   */
  getActivePlugins(): Plugin[] {
    return this.getPlugins().filter(p => p.status === PluginStatus.ACTIVE);
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.pluginConfigs.get(pluginId);
  }

  /**
   * Emit event to all active plugins
   */
  async emitToPlugins(event: PluginEvent): Promise<void> {
    const activePlugins = this.getActivePlugins();
    const promises = [];

    for (const pluginRecord of activePlugins) {
      const plugin = this.plugins.get(pluginRecord.id);
      if (!plugin) continue;

      try {
        // Call appropriate event handler based on event name
        switch (event.name) {
          case 'issue.created':
            if (plugin.onIssueCreated) {
              promises.push(plugin.onIssueCreated(event as any));
            }
            break;
          case 'issue.updated':
            if (plugin.onIssueUpdated) {
              promises.push(plugin.onIssueUpdated(event as any));
            }
            break;
          case 'issue.status_changed':
            if (plugin.onIssueStatusChanged) {
              promises.push(plugin.onIssueStatusChanged(event as any));
            }
            break;
          case 'user.action':
            if (plugin.onUserAction) {
              promises.push(plugin.onUserAction(event as any));
            }
            break;
          case 'webhook.received':
            if (plugin.onWebhookReceived) {
              promises.push(plugin.onWebhookReceived(event as any));
            }
            break;
        }
      } catch (error) {
        console.error(`Plugin ${plugin.name} failed to handle event ${event.name}`, error);
        pluginRecord.status = PluginStatus.ERROR;
        pluginRecord.errorMessage = error instanceof Error ? error.message : 'Event handling error';
      }
    }

    // Wait for all plugins to process the event
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Generate unique plugin ID
   */
  private generatePluginId(name: string, version: string): string {
    return `${name}@${version}`;
  }

  /**
   * Health check for all plugins
   */
  async healthCheck(): Promise<{ healthy: number; unhealthy: number; total: number }> {
    const plugins = this.getPlugins();
    const healthy = plugins.filter(p => p.status === PluginStatus.ACTIVE).length;
    const unhealthy = plugins.filter(p => p.status === PluginStatus.ERROR).length;
    
    return {
      healthy,
      unhealthy,
      total: plugins.length
    };
  }
}
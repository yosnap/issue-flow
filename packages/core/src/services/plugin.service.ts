/**
 * @fileoverview Plugin Service
 * 
 * Manages the plugin system, including loading, registering, and executing
 * plugins with event-driven architecture and dependency injection.
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import EventEmitter from 'events';
import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginEvent,
  PluginHook,
  PluginAPI,
  EventPayloads
} from '@/types/plugin.types';
import type { Logger } from '@/utils/logger';
import type { AppConfig } from '@/config';
import type { TenantContext } from '@/types/tenant.types';

export class PluginService extends EventEmitter {
  private plugins = new Map<string, Plugin>();
  private hooks = new Map<string, PluginHook[]>();
  private logger: Logger;
  private config: AppConfig;
  private pluginAPI: PluginAPI;
  private isInitialized = false;

  constructor(logger: Logger, config: AppConfig) {
    super();
    this.logger = logger.child('PluginService');
    this.config = config;
    
    // Create plugin API that will be injected into plugins
    this.pluginAPI = this.createPluginAPI();
  }

  /**
   * Initialize plugin system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Plugin system already initialized');
      return;
    }

    try {
      this.logger.info('Initializing plugin system...');

      if (this.config.plugins.autoLoad) {
        await this.loadPluginsFromDirectory(this.config.plugins.directory);
      }

      this.isInitialized = true;
      this.logger.info(`✅ Plugin system initialized with ${this.plugins.size} plugins`);
      
      // Emit system event
      this.emitEvent('system:plugins:initialized', {
        pluginCount: this.plugins.size,
      });
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize plugin system:', error);
      throw error;
    }
  }

  /**
   * Load plugins from directory
   */
  private async loadPluginsFromDirectory(directory: string): Promise<void> {
    try {
      const pluginDirs = await this.getPluginDirectories(directory);
      
      for (const pluginDir of pluginDirs) {
        try {
          await this.loadPlugin(pluginDir);
        } catch (error) {
          this.logger.error(`Failed to load plugin from ${pluginDir}:`, error);
          if (!this.config.plugins.development) {
            // In production, continue loading other plugins
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to load plugins from directory ${directory}:`, error);
      throw error;
    }
  }

  /**
   * Get plugin directories
   */
  private async getPluginDirectories(directory: string): Promise<string[]> {
    try {
      const entries = await readdir(directory, { withFileTypes: true });
      const dirs: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginDir = join(directory, entry.name);
          const manifestPath = join(pluginDir, 'plugin.json');
          
          try {
            await stat(manifestPath);
            dirs.push(pluginDir);
          } catch {
            // No manifest file, skip
          }
        }
      }

      return dirs;
    } catch (error) {
      this.logger.error(`Failed to read plugin directory ${directory}:`, error);
      return [];
    }
  }

  /**
   * Load a single plugin
   */
  private async loadPlugin(pluginDir: string): Promise<void> {
    try {
      // Load manifest
      const manifestPath = join(pluginDir, 'plugin.json');
      const manifest: PluginManifest = await import(manifestPath);

      // Validate manifest
      this.validateManifest(manifest);

      // Load plugin code
      const pluginPath = join(pluginDir, manifest.main || 'index.js');
      const pluginModule = await import(pluginPath);
      const pluginClass = pluginModule.default || pluginModule;

      // Create plugin instance
      const context: PluginContext = {
        config: manifest.config || {},
        logger: this.logger.child(manifest.name),
        api: this.pluginAPI,
        manifest,
      };

      const plugin: Plugin = new pluginClass(context);
      plugin.manifest = manifest;

      // Register plugin
      this.plugins.set(manifest.name, plugin);

      // Initialize plugin
      if (typeof plugin.initialize === 'function') {
        await plugin.initialize();
      }

      // Register hooks
      if (plugin.hooks) {
        for (const [event, hook] of Object.entries(plugin.hooks)) {
          this.registerHook(event, {
            plugin: manifest.name,
            priority: hook.priority || 100,
            handler: hook.handler,
          });
        }
      }

      this.logger.info(`✅ Loaded plugin: ${manifest.name} v${manifest.version}`);
      
      // Emit plugin loaded event
      this.emitEvent('system:plugin:loaded', {
        plugin: manifest.name,
        version: manifest.version,
      });
      
    } catch (error) {
      this.logger.error(`Failed to load plugin from ${pluginDir}:`, error);
      throw error;
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.name) {
      throw new Error('Plugin manifest missing name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest missing version');
    }
    if (!manifest.description) {
      throw new Error('Plugin manifest missing description');
    }
    if (manifest.framework && !['react', 'vue', 'angular', 'vanilla'].includes(manifest.framework)) {
      throw new Error(`Unsupported framework: ${manifest.framework}`);
    }
  }

  /**
   * Register a plugin manually
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    if (!plugin.manifest) {
      throw new Error('Plugin missing manifest');
    }

    this.validateManifest(plugin.manifest);
    
    // Check for conflicts
    if (this.plugins.has(plugin.manifest.name)) {
      throw new Error(`Plugin ${plugin.manifest.name} already registered`);
    }

    // Register plugin
    this.plugins.set(plugin.manifest.name, plugin);

    // Initialize plugin
    if (typeof plugin.initialize === 'function') {
      await plugin.initialize();
    }

    this.logger.info(`✅ Registered plugin: ${plugin.manifest.name}`);
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return false;
    }

    try {
      // Call plugin cleanup
      if (typeof plugin.destroy === 'function') {
        await plugin.destroy();
      }

      // Remove hooks
      for (const [event, hooks] of this.hooks.entries()) {
        this.hooks.set(event, hooks.filter(h => h.plugin !== name));
      }

      // Remove plugin
      this.plugins.delete(name);

      this.logger.info(`Plugin unregistered: ${name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister plugin ${name}:`, error);
      return false;
    }
  }

  /**
   * Register a hook
   */
  private registerHook(event: string, hook: PluginHook): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }

    const hooks = this.hooks.get(event)!;
    hooks.push(hook);
    
    // Sort by priority (lower number = higher priority)
    hooks.sort((a, b) => (a.priority || 100) - (b.priority || 100));

    this.logger.debug(`Hook registered: ${event} by ${hook.plugin}`);
  }

  /**
   * Execute hooks for an event
   */
  async executeHooks<T extends keyof EventPayloads>(
    event: T, 
    payload: EventPayloads[T],
    context?: TenantContext
  ): Promise<EventPayloads[T]> {
    const hooks = this.hooks.get(event) || [];
    
    if (hooks.length === 0) {
      return payload;
    }

    let currentPayload = payload;
    
    for (const hook of hooks) {
      try {
        const plugin = this.plugins.get(hook.plugin);
        if (!plugin) {
          this.logger.warn(`Hook plugin not found: ${hook.plugin}`);
          continue;
        }

        const result = await hook.handler(currentPayload, {
          context,
          plugin,
          event,
        });

        // Update payload with result if provided
        if (result !== undefined) {
          currentPayload = result;
        }
        
      } catch (error) {
        this.logger.error(`Hook execution failed: ${event} by ${hook.plugin}:`, error);
        
        if (!this.config.plugins.development) {
          // In production, continue with other hooks
          continue;
        }
        throw error;
      }
    }

    return currentPayload;
  }

  /**
   * Emit event to plugins and hooks
   */
  async emitEvent<T extends keyof EventPayloads>(
    event: T, 
    payload: EventPayloads[T],
    context?: TenantContext
  ): Promise<void> {
    this.logger.debug(`Emitting event: ${event}`);

    // Execute hooks first
    await this.executeHooks(event, payload, context);

    // Then emit to EventEmitter listeners
    this.emit(event, payload, context);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get plugin manifests
   */
  getPluginManifests(): PluginManifest[] {
    return this.getPlugins().map(p => p.manifest!).filter(Boolean);
  }

  /**
   * Check if plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get hooks for event
   */
  getHooks(event: string): PluginHook[] {
    return this.hooks.get(event) || [];
  }

  /**
   * Create plugin API that gets injected into plugins
   */
  private createPluginAPI(): PluginAPI {
    return {
      // Database access will be provided by the main app
      database: null as any, // Will be set by main app
      redis: null as any, // Will be set by main app
      
      // Event system
      emit: async <T extends keyof EventPayloads>(event: T, payload: EventPayloads[T], context?: TenantContext) => {
        await this.emitEvent(event, payload, context);
      },
      
      on: <T extends keyof EventPayloads>(event: T, handler: (payload: EventPayloads[T], context?: TenantContext) => void) => {
        this.on(event, handler);
      },
      
      off: <T extends keyof EventPayloads>(event: T, handler: (payload: EventPayloads[T], context?: TenantContext) => void) => {
        this.off(event, handler);
      },
      
      // Plugin management
      getPlugin: (name: string) => this.getPlugin(name),
      
      getPlugins: () => this.getPlugins(),
      
      // Utility functions
      utils: {
        generateId: () => crypto.randomUUID(),
        slugify: (text: string) => {
          return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
        },
        hash: async (data: string) => {
          const encoder = new TextEncoder();
          const dataBuffer = encoder.encode(data);
          const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
      }
    };
  }

  /**
   * Set database and redis instances for plugin API
   */
  setServices(database: any, redis: any): void {
    this.pluginAPI.database = database;
    this.pluginAPI.redis = redis;
  }

  /**
   * Shutdown plugin system
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down plugin system...');

    for (const [name, plugin] of this.plugins) {
      try {
        if (typeof plugin.destroy === 'function') {
          await plugin.destroy();
        }
      } catch (error) {
        this.logger.error(`Failed to shutdown plugin ${name}:`, error);
      }
    }

    this.plugins.clear();
    this.hooks.clear();
    this.removeAllListeners();
    
    this.isInitialized = false;
    this.logger.info('Plugin system shutdown complete');
  }
}
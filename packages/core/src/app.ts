/**
 * @fileoverview IssueFlow Main Application
 * 
 * Main application class that bootstraps the IssueFlow framework.
 * Handles server setup, service initialization, and API route registration.
 */

import Fastify, { FastifyInstance } from 'fastify';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { AuthService } from './services/auth.service';
import { TenantService } from './services/tenant.service';
import { PluginService } from './services/plugin.service';
import { PluginRegistry } from './plugins/PluginRegistry';
import { Logger } from './utils/logger';
import type { AppConfig } from './config';

export class IssueFlowApp {
  public server: FastifyInstance;
  public logger: Logger;
  public config: AppConfig;
  
  // Core services
  public database: DatabaseService;
  public redis: RedisService;
  public auth: AuthService;
  public tenant: TenantService;
  public plugin: PluginService;
  public pluginRegistry: PluginRegistry;

  constructor(config: AppConfig) {
    this.config = config;
    this.logger = new Logger(config.logger);
    
    // Initialize Fastify server
    this.server = Fastify({
      logger: this.logger.pino,
      trustProxy: true,
      maxParamLength: 200,
      bodyLimit: 10485760, // 10MB
      caseSensitive: false
    });

    // Initialize services
    this.database = new DatabaseService(config.database, this.logger);
    this.redis = new RedisService(config.redis, this.logger);
    this.auth = new AuthService(this.database, this.redis, this.logger, config);
    this.tenant = new TenantService(this.database, this.redis, this.logger);
    this.plugin = new PluginService(this.logger, config);
    this.pluginRegistry = new PluginRegistry();
  }

  /**
   * Initialize core services
   */
  private async initializeServices(): Promise<void> {
    this.logger.info('Initializing core services...');
    
    // Connect to external services
    await this.database.connect();
    await this.redis.connect();
    
    // Run database migrations
    await this.database.runMigrations();
    
    // Initialize plugin system
    await this.plugin.initialize();
    
    // Set plugin API services
    this.plugin.setServices(this.database, this.redis);
    
    // Initialize new plugin registry
    this.logger.info('Initializing new plugin registry...');
    
    // Register built-in plugins (example)
    await this.registerBuiltInPlugins();
    
    this.logger.info('✅ Core services initialized');
  }

  /**
   * Get services for dependency injection
   */
  getServices() {
    return {
      database: this.database,
      redis: this.redis,
      auth: this.auth,
      tenant: this.tenant,
      plugin: this.plugin,
      logger: this.logger,
      config: this.config
    };
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      this.logger.info('🚀 Starting IssueFlow application...');
      
      // Initialize services
      await this.initializeServices();
      
      // Register routes
      const { registerRoutes } = await import('./routes');
      await registerRoutes(this.server, this);
      
      // Start HTTP server
      await this.server.listen({ 
        port: this.config.port, 
        host: this.config.host 
      });
      
      this.logger.info(`✅ IssueFlow started on http://${this.config.host}:${this.config.port}`);
      this.logger.info(`📖 API Health: http://${this.config.host}:${this.config.port}/health`);
      this.logger.info(`🔑 API Auth: http://${this.config.host}:${this.config.port}/api/v1/auth`);
      
      // Log service status
      this.logServiceStatus();
      
    } catch (error) {
      this.logger.fatal('💥 Failed to start application:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    this.logger.info('Shutting down IssueFlow application...');
    
    try {
      // Shutdown plugin system
      await this.plugin.shutdown();
      
      // Close database connections
      await this.database.close();
      await this.redis.close();
      
      // Close server
      await this.server.close();
      
      this.logger.info('✅ Application shut down successfully');
    } catch (error) {
      this.logger.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Log current service status
   */
  private logServiceStatus(): void {
    this.logger.info('📊 Service Status:');
    this.logger.info(`  Database: ${this.database.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    this.logger.info(`  Redis: ${this.redis.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    this.logger.info(`  Plugins: ${this.plugin.getPlugins().length} loaded`);
    
    // Log environment info
    this.logger.info('🌍 Environment:');
    this.logger.info(`  Node.js: ${process.version}`);
    this.logger.info(`  Environment: ${this.config.environment}`);
    this.logger.info(`  Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  }

  /**
   * Health check
   */
  async getHealthStatus() {
    const startTime = Date.now();
    
    const services = {
      database: await this.database.healthCheck(),
      redis: await this.redis.healthCheck(),
    };
    
    const allHealthy = Object.values(services).every(status => status === 'healthy');
    
    return {
      status: allHealthy ? 'healthy' as const : 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      services,
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Register built-in plugins
   */
  private async registerBuiltInPlugins(): Promise<void> {
    try {
      // Example: Register GitHub plugin if configured
      // const githubPlugin = new GitHubPlugin();
      // await this.pluginRegistry.registerPlugin(githubPlugin, {
      //   token: this.config.integrations?.github?.token,
      //   owner: this.config.integrations?.github?.owner,
      //   repo: this.config.integrations?.github?.repo
      // });
      // await this.pluginRegistry.activatePlugin('github-integration@1.0.0');
      
      this.logger.info('Built-in plugins registered');
    } catch (error) {
      this.logger.error('Failed to register built-in plugins:', error);
    }
  }

  /**
   * Emit event to plugins
   */
  async emitPluginEvent(event: any): Promise<void> {
    try {
      await this.pluginRegistry.emitToPlugins(event);
    } catch (error) {
      this.logger.error('Failed to emit plugin event:', error);
    }
  }

  /**
   * Get plugin registry for external access
   */
  getPluginRegistry(): PluginRegistry {
    return this.pluginRegistry;
  }
}
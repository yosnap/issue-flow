/**
 * @fileoverview IssueFlow Main Application
 * 
 * Main application class that bootstraps the IssueFlow framework.
 * Handles server setup, middleware registration, and service initialization.
 */

import Fastify, { FastifyInstance } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { DatabaseService } from './services/database.service';
import { RedisService } from './services/redis.service';
import { AuthService } from './services/auth.service';
import { TenantService } from './services/tenant.service';
import { PluginService } from './services/plugin.service';
import { setupMiddleware } from './middleware';
import { registerRoutes } from './controllers';
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
  public plugins: PluginService;

  constructor(config: AppConfig) {
    this.config = config;
    this.logger = new Logger(config.logger);
    
    // Initialize Fastify with TypeBox type provider
    this.server = Fastify({
      logger: this.logger.pino,
      trustProxy: true,
      maxParamLength: 200,
      bodyLimit: 10485760, // 10MB
      caseSensitive: false
    }).withTypeProvider<TypeBoxTypeProvider>();

    // Initialize services
    this.database = new DatabaseService(config.database, this.logger);
    this.redis = new RedisService(config.redis, this.logger);
    this.auth = new AuthService(config.auth, this.logger);
    this.tenant = new TenantService(this.database, this.logger);
    this.plugins = new PluginService(this.logger);
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing IssueFlow application...');

      // Initialize core services
      await this.initializeServices();
      
      // Setup middleware
      await this.setupMiddleware();
      
      // Register routes
      await this.registerRoutes();
      
      // Initialize plugins
      await this.initializePlugins();
      
      this.logger.info('IssueFlow application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      const address = await this.server.listen({
        port: this.config.port,
        host: this.config.host
      });
      
      this.logger.info(`🚀 IssueFlow server running at ${address}`);
      this.logger.info(`📖 API docs: ${address}/documentation`);
      this.logger.info(`🏥 Health check: ${address}/health`);
      
      // Log service status
      this.logServiceStatus();
      
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    this.logger.info('Shutting down IssueFlow application...');
    
    try {
      // Close plugins
      await this.plugins.shutdown();
      
      // Close database connections
      await this.database.close();
      await this.redis.close();
      
      // Close server
      await this.server.close();
      
      this.logger.info('Application shut down successfully');
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Initialize core services
   */
  private async initializeServices(): Promise<void> {
    this.logger.info('Initializing core services...');
    
    // Database
    await this.database.connect();
    await this.database.runMigrations();
    
    // Redis
    await this.redis.connect();
    
    // Services that depend on database/redis
    await this.auth.initialize();
    await this.tenant.initialize();
    
    this.logger.info('Core services initialized');
  }

  /**
   * Setup middleware
   */
  private async setupMiddleware(): Promise<void> {
    this.logger.info('Setting up middleware...');
    
    await setupMiddleware(this.server, {
      database: this.database,
      redis: this.redis,
      auth: this.auth,
      tenant: this.tenant,
      logger: this.logger,
      config: this.config
    });
    
    this.logger.info('Middleware configured');
  }

  /**
   * Register API routes
   */
  private async registerRoutes(): Promise<void> {
    this.logger.info('Registering API routes...');
    
    await registerRoutes(this.server, {
      database: this.database,
      redis: this.redis,
      auth: this.auth,
      tenant: this.tenant,
      plugins: this.plugins,
      logger: this.logger,
      config: this.config
    });
    
    this.logger.info('API routes registered');
  }

  /**
   * Initialize plugin system
   */
  private async initializePlugins(): Promise<void> {
    this.logger.info('Initializing plugin system...');
    
    await this.plugins.initialize({
      database: this.database,
      redis: this.redis,
      server: this.server,
      logger: this.logger
    });
    
    // Load installed plugins
    await this.plugins.loadInstalledPlugins();
    
    this.logger.info('Plugin system initialized');
  }

  /**
   * Log current service status
   */
  private logServiceStatus(): void {
    this.logger.info('Service Status:');
    this.logger.info(`  Database: ${this.database.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    this.logger.info(`  Redis: ${this.redis.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    this.logger.info(`  Plugins: ${this.plugins.getLoadedPlugins().length} loaded`);
    
    // Log environment info
    this.logger.info('Environment:');
    this.logger.info(`  Node.js: ${process.version}`);
    this.logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
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
      external_apis: 'healthy' as const // Will be implemented later
    };
    
    const allHealthy = Object.values(services).every(status => status === 'healthy');
    
    return {
      status: allHealthy ? 'healthy' as const : 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      version: process.env.VERSION || '0.2.0',
      services,
      uptime: Math.floor(process.uptime()),
      responseTime: Date.now() - startTime
    };
  }
}
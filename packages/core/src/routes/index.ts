/**
 * @fileoverview API Routes
 * 
 * Central routing configuration for the IssueFlow API.
 * Registers all route modules and applies global middleware.
 */

import type { FastifyInstance } from 'fastify';
import type { IssueFlowApp } from '@/app';
import { authRoutes } from './auth.routes';
import { organizationRoutes } from './organization.routes';
import { AuthController } from '@/controllers/auth.controller';
import { OrganizationController } from '@/controllers/organization.controller';

export async function registerRoutes(fastify: FastifyInstance, app: IssueFlowApp) {
  const { database, redis, auth, tenant, logger, config } = app.getServices();
  
  // Create controllers
  const authController = new AuthController(auth, logger);
  const organizationController = new OrganizationController(tenant, logger);
  
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    try {
      const [dbHealth, redisHealth] = await Promise.all([
        database.healthCheck(),
        redis.healthCheck()
      ]);
      
      const isHealthy = dbHealth === 'healthy' && redisHealth === 'healthy';
      
      return reply.status(isHealthy ? 200 : 503).send({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth,
          redis: redisHealth
        }
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      return reply.status(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  });
  
  // API version prefix
  fastify.register(async function(fastify) {
    // Global API middleware
    fastify.addHook('onRequest', async (request, reply) => {
      // Add request ID for tracing
      request.id = request.id || crypto.randomUUID();
      
      // Log incoming requests
      logger.info({
        requestId: request.id,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip
      }, 'Incoming request');
    });
    
    // Add CORS headers
    fastify.addHook('onSend', async (request, reply, payload) => {
      reply.header('Access-Control-Allow-Origin', config.cors.origin);
      reply.header('Access-Control-Allow-Methods', config.cors.methods.join(', '));
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Organization');
      
      if (config.cors.credentials) {
        reply.header('Access-Control-Allow-Credentials', 'true');
      }
      
      return payload;
    });
    
    // Error handler
    fastify.setErrorHandler(async (error, request, reply) => {
      logger.error({
        requestId: request.id,
        error: error.message,
        stack: error.stack,
        statusCode: error.statusCode
      }, 'Request error');
      
      // Don't expose internal errors in production
      const isDevelopment = config.environment === 'development';
      
      if (error.statusCode && error.statusCode < 500) {
        return reply.status(error.statusCode).send({
          success: false,
          error: error.name || 'Client Error',
          message: error.message,
          ...(isDevelopment && { stack: error.stack })
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'Something went wrong',
        ...(isDevelopment && { stack: error.stack })
      });
    });
    
    // Register route modules
    fastify.register(async function(fastify) {
      fastify.addHook('preHandler', async (request, reply) => {
        // Add API version to logs
        logger.debug({ requestId: request.id }, 'API v1 request');
      });
      
      // Authentication routes
      fastify.register(async function(fastify) {
        await authRoutes(fastify, authController, auth, redis, logger, config);
      }, { prefix: '/auth' });
      
      // Organization routes  
      fastify.register(async function(fastify) {
        await organizationRoutes(
          fastify, 
          organizationController, 
          auth, 
          tenant, 
          database, 
          redis, 
          logger, 
          config
        );
      });
      
    });
  }, { prefix: '/api/v1' });
  
  // 404 handler
  fastify.setNotFoundHandler(async (request, reply) => {
    logger.warn({
      requestId: request.id,
      method: request.method,
      url: request.url
    }, 'Route not found');
    
    return reply.status(404).send({
      success: false,
      error: 'Not Found',
      message: 'Route not found',
      path: request.url
    });
  });
}
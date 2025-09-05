/**
 * @fileoverview Rate Limiting Middleware
 * 
 * Provides rate limiting functionality using Redis for distributed
 * rate limiting across multiple server instances.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { RedisService, CacheKeys } from '@/services/redis.service';
import type { Logger } from '@/utils/logger';
import type { AppConfig } from '@/config';

export interface RateLimitOptions {
  windowMs?: number;        // Time window in milliseconds
  max?: number;            // Max requests per window
  keyGenerator?: (request: FastifyRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  headers?: boolean;       // Add rate limit headers to response
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

export function createRateLimitMiddleware(
  redis: RedisService,
  logger: Logger,
  config: AppConfig
) {
  return function rateLimitMiddleware(options: RateLimitOptions = {}) {
    const {
      windowMs = config.rateLimit.windowMs,
      max = config.rateLimit.max,
      keyGenerator = defaultKeyGenerator,
      skipSuccessfulRequests = config.rateLimit.skipSuccessfulRequests,
      skipFailedRequests = config.rateLimit.skipFailedRequests,
      message = 'Too many requests, please try again later.',
      headers = true
    } = options;

    return async function(request: FastifyRequest, reply: FastifyReply) {
      try {
        const key = keyGenerator(request);
        const window = Math.floor(Date.now() / windowMs);
        const identifier = `${key}:${window}`;
        
        // Use Redis cache key template
        const cacheKey = redis.getCacheKey('RATE_LIMIT' as CacheKeys, { 
          identifier,
          endpoint: request.routerPath || request.url
        });

        // Get current count
        const current = await redis.get<number>(cacheKey) || 0;
        const resetTime = new Date((window + 1) * windowMs);
        
        const rateLimitInfo: RateLimitInfo = {
          limit: max,
          current: current + 1,
          remaining: Math.max(0, max - (current + 1)),
          resetTime
        };

        // Add headers if enabled
        if (headers) {
          reply.header('X-RateLimit-Limit', max.toString());
          reply.header('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
          reply.header('X-RateLimit-Reset', resetTime.getTime().toString());
        }

        // Check if limit exceeded
        if (current >= max) {
          if (headers) {
            reply.header('Retry-After', Math.ceil(windowMs / 1000).toString());
          }
          
          logger.warn(`Rate limit exceeded for ${key}`);
          
          return reply.status(429).send({
            error: 'Too Many Requests',
            message,
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }

        // Increment counter
        await redis.increment(cacheKey, 1);
        
        // Set expiration for the key
        await redis.expire(cacheKey, Math.ceil(windowMs / 1000));

        // Add rate limit info to request for potential use by other middleware
        (request as any).rateLimit = rateLimitInfo;

        // Hook into response to conditionally count the request
        const originalSend = reply.send.bind(reply);
        reply.send = function(payload?: any) {
          const statusCode = reply.statusCode;
          
          // Decrement if we should skip this request
          if (
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            redis.increment(cacheKey, -1).catch(err => {
              logger.error('Failed to decrement rate limit counter:', err);
            });
          }
          
          return originalSend(payload);
        };
        
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // Don't block requests if rate limiting fails
      }
    };
  };
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: FastifyRequest): string {
  return request.ip || 'unknown';
}

/**
 * Key generator based on user ID (for authenticated requests)
 */
export function userKeyGenerator(request: FastifyRequest): string {
  if (request.user?.id) {
    return `user:${request.user.id}`;
  }
  return request.ip || 'unknown';
}

/**
 * Key generator based on organization (for tenant-specific limits)
 */
export function organizationKeyGenerator(request: FastifyRequest): string {
  if (request.tenant?.organization.id) {
    return `org:${request.tenant.organization.id}`;
  }
  if (request.user?.id) {
    return `user:${request.user.id}`;
  }
  return request.ip || 'unknown';
}

/**
 * Strict rate limiting for authentication endpoints
 */
export function createAuthRateLimit(
  redis: RedisService,
  logger: Logger,
  config: AppConfig
) {
  return createRateLimitMiddleware(redis, logger, config)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later.',
    keyGenerator: (request) => {
      const email = request.body && typeof request.body === 'object' 
        ? (request.body as any).email 
        : undefined;
      return email ? `auth:${email}` : `auth:${request.ip}`;
    }
  });
}

/**
 * Rate limiting for API endpoints
 */
export function createAPIRateLimit(
  redis: RedisService,
  logger: Logger,
  config: AppConfig
) {
  return createRateLimitMiddleware(redis, logger, config)({
    keyGenerator: userKeyGenerator,
    message: 'API rate limit exceeded. Please upgrade your plan for higher limits.'
  });
}

/**
 * Rate limiting for public endpoints (issue reporting)
 */
export function createPublicRateLimit(
  redis: RedisService,
  logger: Logger,
  config: AppConfig
) {
  return createRateLimitMiddleware(redis, logger, config)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many requests. Please wait before submitting again.'
  });
}

/**
 * Organization-specific rate limiting
 */
export function createOrgRateLimit(
  redis: RedisService,
  logger: Logger,
  config: AppConfig,
  customLimits?: { windowMs?: number; max?: number }
) {
  return createRateLimitMiddleware(redis, logger, config)({
    ...customLimits,
    keyGenerator: organizationKeyGenerator,
    message: 'Organization rate limit exceeded. Please upgrade your plan for higher limits.'
  });
}
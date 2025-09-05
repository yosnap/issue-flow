/**
 * @fileoverview Redis Service
 * 
 * Manages Redis connections for caching, session management,
 * and rate limiting in the IssueFlow framework.
 */

import Redis, { Redis as RedisClient } from 'ioredis';
import type { RedisConfig } from '@/types/database.types';
import type { Logger } from '@/utils/logger';

export enum CacheKeys {
  USER_SESSION = 'session:{userId}',
  PROJECT_CONFIG = 'project:{projectId}:config',
  ORGANIZATION_SETTINGS = 'org:{orgId}:settings',
  INTEGRATION_STATUS = 'integration:{integrationId}:status',
  ISSUE_COUNT = 'stats:{projectId}:issues:count',
  RATE_LIMIT = 'rate_limit:{identifier}:{endpoint}',
  REFRESH_TOKEN = 'refresh:{token}',
  EMAIL_VERIFICATION = 'verify:{token}',
  PASSWORD_RESET = 'reset:{token}'
}

export enum CacheTTL {
  SESSION = 24 * 60 * 60,        // 24 hours
  CONFIG = 60 * 60,              // 1 hour
  STATS = 5 * 60,                // 5 minutes
  RATE_LIMIT = 60,               // 1 minute
  INTEGRATION_STATUS = 30,        // 30 seconds
  REFRESH_TOKEN = 30 * 24 * 60 * 60, // 30 days
  EMAIL_VERIFICATION = 24 * 60 * 60, // 24 hours
  PASSWORD_RESET = 60 * 60       // 1 hour
}

export class RedisService {
  private client: RedisClient;
  private subscriber: RedisClient;
  private publisher: RedisClient;
  private config: RedisConfig;
  private logger: Logger;
  private _isConnected = false;

  constructor(config: RedisConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    const redisConfig = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'issueflow:',
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * (config.retryDelayOnFailover || 100), 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
    };

    // Create Redis clients
    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    // Handle Redis events
    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    // Main client events
    this.client.on('connect', () => {
      this.logger.info('Redis client connected');
      this._isConnected = true;
    });

    this.client.on('ready', () => {
      this.logger.info('Redis client ready');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis client error:', err);
      this._isConnected = false;
    });

    this.client.on('close', () => {
      this.logger.info('Redis client connection closed');
      this._isConnected = false;
    });

    // Subscriber events
    this.subscriber.on('error', (err) => {
      this.logger.error('Redis subscriber error:', err);
    });

    // Publisher events
    this.publisher.on('error', (err) => {
      this.logger.error('Redis publisher error:', err);
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to Redis...');
      
      // Test connection
      await this.client.ping();
      
      const info = await this.client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1];
      
      this._isConnected = true;
      this.logger.info(`✅ Connected to Redis v${version}`);
      
    } catch (error) {
      this._isConnected = false;
      this.logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Close Redis connections
   */
  async close(): Promise<void> {
    try {
      await Promise.all([
        this.client.quit(),
        this.subscriber.quit(),
        this.publisher.quit()
      ]);
      
      this._isConnected = false;
      this.logger.info('Redis connections closed');
    } catch (error) {
      this.logger.error('Error closing Redis connections:', error);
      throw error;
    }
  }

  /**
   * Get Redis connection status
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Health check for Redis
   */
  async healthCheck(): Promise<'healthy' | 'unhealthy'> {
    try {
      const response = await this.client.ping();
      return response === 'PONG' ? 'healthy' : 'unhealthy';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return 'unhealthy';
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        // If not JSON, return as string
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.client.incrby(key, by);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set key expiration
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Publish message to a channel
   */
  async publish(channel: string, message: any): Promise<number> {
    try {
      const serialized = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.publisher.publish(channel, serialized);
    } catch (error) {
      this.logger.error(`Error publishing to channel ${channel}:`, error);
      return 0;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsed = JSON.parse(message);
            handler(parsed);
          } catch {
            handler(message);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error subscribing to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      this.logger.error(`Error unsubscribing from channel ${channel}:`, error);
    }
  }

  /**
   * Clear all keys with a pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.client.del(...keys);
    } catch (error) {
      this.logger.error(`Error clearing pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get formatted cache key
   */
  getCacheKey(template: CacheKeys, replacements: Record<string, string>): string {
    let key = template as string;
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      key = key.replace(`{${placeholder}}`, value);
    });
    
    return key;
  }
}
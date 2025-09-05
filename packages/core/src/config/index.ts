/**
 * @fileoverview Application Configuration
 * 
 * Centralized configuration management for the IssueFlow application.
 * Loads configuration from environment variables with sensible defaults.
 */

import { z } from 'zod';
import type { DatabaseConfig, RedisConfig } from '@/types/database.types';

// Configuration schema for validation
const configSchema = z.object({
  // Server configuration
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('0.0.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Database configuration
  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(5432),
    database: z.string().default('issueflow'),
    username: z.string().default('postgres'),
    password: z.string().default(''),
    ssl: z.boolean().default(false),
    maxConnections: z.number().default(20),
    idleTimeoutMillis: z.number().default(30000),
    connectionTimeoutMillis: z.number().default(5000),
  }),
  
  // Redis configuration
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    keyPrefix: z.string().default('issueflow:'),
    maxRetriesPerRequest: z.number().default(3),
    retryDelayOnFailover: z.number().default(100),
  }),
  
  // Authentication configuration
  auth: z.object({
    jwtSecret: z.string().min(32),
    jwtExpiresIn: z.string().default('15m'),
    refreshTokenExpiresIn: z.string().default('30d'),
    bcryptSaltRounds: z.number().default(12),
    oauth: z.object({
      github: z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        callbackUrl: z.string().optional(),
      }).optional(),
      google: z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        callbackUrl: z.string().optional(),
      }).optional(),
    }),
  }),
  
  // Storage configuration
  storage: z.object({
    provider: z.enum(['local', 's3']).default('local'),
    local: z.object({
      uploadDir: z.string().default('./uploads'),
      maxFileSize: z.number().default(5 * 1024 * 1024), // 5MB
    }),
    s3: z.object({
      accessKeyId: z.string().optional(),
      secretAccessKey: z.string().optional(),
      region: z.string().optional(),
      bucket: z.string().optional(),
    }).optional(),
  }),
  
  // Rate limiting configuration
  rateLimit: z.object({
    windowMs: z.number().default(60 * 1000), // 1 minute
    max: z.number().default(100), // requests per window
    skipSuccessfulRequests: z.boolean().default(false),
    skipFailedRequests: z.boolean().default(false),
  }),
  
  // CORS configuration
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string()), z.boolean()]).default(true),
    credentials: z.boolean().default(true),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  }),
  
  // Logging configuration
  logger: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.boolean().default(process.env.NODE_ENV !== 'production'),
  }),
  
  // Plugin configuration
  plugins: z.object({
    directory: z.string().default('./plugins'),
    autoLoad: z.boolean().default(true),
    development: z.boolean().default(process.env.NODE_ENV === 'development'),
  }),
  
  // External service URLs
  services: z.object({
    github: z.object({
      apiUrl: z.string().default('https://api.github.com'),
    }),
    clickup: z.object({
      apiUrl: z.string().default('https://api.clickup.com/api/v2'),
    }),
    linear: z.object({
      apiUrl: z.string().default('https://api.linear.app/graphql'),
    }),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): AppConfig {
  const config = {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
    
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'issueflow',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      ssl: process.env.DATABASE_SSL === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '5000'),
    },
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'issueflow:',
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
    },
    
    auth: {
      jwtSecret: process.env.JWT_SECRET || generateDefaultSecret(),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
      bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
      oauth: {
        github: process.env.GITHUB_CLIENT_ID ? {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackUrl: process.env.GITHUB_CALLBACK_URL,
        } : undefined,
        google: process.env.GOOGLE_CLIENT_ID ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        } : undefined,
      },
    },
    
    storage: {
      provider: (process.env.STORAGE_PROVIDER as 'local' | 's3') || 'local',
      local: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
      },
      s3: process.env.S3_ACCESS_KEY_ID ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION,
        bucket: process.env.S3_BUCKET,
      } : undefined,
    },
    
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
      skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true',
    },
    
    cors: {
      origin: process.env.CORS_ORIGIN ? 
        (process.env.CORS_ORIGIN === 'true' ? true : 
         process.env.CORS_ORIGIN === 'false' ? false : 
         process.env.CORS_ORIGIN.split(',')) : true,
      credentials: process.env.CORS_CREDENTIALS !== 'false',
      methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    
    logger: {
      level: (process.env.LOG_LEVEL as any) || 'info',
      pretty: process.env.LOG_PRETTY !== 'false' && process.env.NODE_ENV !== 'production',
    },
    
    plugins: {
      directory: process.env.PLUGINS_DIR || './plugins',
      autoLoad: process.env.PLUGINS_AUTO_LOAD !== 'false',
      development: process.env.NODE_ENV === 'development',
    },
    
    services: {
      github: {
        apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
      },
      clickup: {
        apiUrl: process.env.CLICKUP_API_URL || 'https://api.clickup.com/api/v2',
      },
      linear: {
        apiUrl: process.env.LINEAR_API_URL || 'https://api.linear.app/graphql',
      },
    },
  };

  // Validate configuration
  const result = configSchema.safeParse(config);
  
  if (!result.success) {
    console.error('❌ Invalid configuration:');
    result.error.errors.forEach(error => {
      console.error(`  ${error.path.join('.')}: ${error.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

/**
 * Generate a default JWT secret for development
 * In production, this should always be provided via environment variable
 */
function generateDefaultSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be provided in production environment');
  }
  
  console.warn('⚠️  Using generated JWT secret for development. Set JWT_SECRET environment variable in production.');
  return 'dev-secret-' + Math.random().toString(36).substring(2, 15);
}

export { configSchema };
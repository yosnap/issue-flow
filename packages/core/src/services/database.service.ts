/**
 * @fileoverview Database Service
 * 
 * Manages PostgreSQL connections, migrations, and provides multi-tenant
 * database access with schema-per-tenant architecture.
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { DatabaseConfig, DatabaseConnection, DatabaseTransaction, Migration, MigrationState } from '@/types/database.types';
import type { Logger } from '@/utils/logger';

export class DatabaseService {
  private pool: Pool;
  private config: DatabaseConfig;
  private logger: Logger;
  private _isConnected = false;

  constructor(config: DatabaseConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
      application_name: 'issueflow-core',
    };

    this.pool = new Pool(poolConfig);
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      this.logger.error('Database pool error:', err);
    });

    this.pool.on('connect', () => {
      this.logger.debug('New database client connected');
    });

    this.pool.on('remove', () => {
      this.logger.debug('Database client removed from pool');
    });
  }

  /**
   * Connect to the database and verify connection
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to database...');
      
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as now, version() as version');
      client.release();
      
      this._isConnected = true;
      this.logger.info(`✅ Connected to database: ${result.rows[0].version.split(' ')[0]}`);
      
    } catch (error) {
      this._isConnected = false;
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
      this._isConnected = false;
      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error('Error closing database connections:', error);
      throw error;
    }
  }

  /**
   * Get database connection status
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Health check for the database
   */
  async healthCheck(): Promise<'healthy' | 'unhealthy'> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return 'healthy';
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return 'unhealthy';
    }
  }

  /**
   * Execute a query
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query and return single result
   */
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results[0] || null;
  }

  /**
   * Execute raw SQL
   */
  async raw(sql: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  /**
   * Execute queries in a transaction
   */
  async transaction<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const transaction: DatabaseTransaction = {
        query: async <U>(sql: string, params?: any[]): Promise<U[]> => {
          const result = await client.query(sql, params);
          return result.rows;
        },
        
        queryOne: async <U>(sql: string, params?: any[]): Promise<U | null> => {
          const result = await client.query(sql, params);
          return result.rows[0] || null;
        },
        
        raw: async (sql: string, params?: any[]): Promise<any> => {
          return await client.query(sql, params);
        },
        
        commit: async (): Promise<void> => {
          await client.query('COMMIT');
        },
        
        rollback: async (): Promise<void> => {
          await client.query('ROLLBACK');
        }
      };

      const result = await callback(transaction);
      await client.query('COMMIT');
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create tenant schema
   */
  async createTenantSchema(tenantSlug: string): Promise<void> {
    const schemaName = `org_${tenantSlug}`;
    
    await this.transaction(async (trx) => {
      // Create schema
      await trx.raw(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      
      // Create tenant-specific tables
      await this.createTenantTables(trx, schemaName);
      
      this.logger.info(`Created tenant schema: ${schemaName}`);
    });
  }

  /**
   * Set search path for tenant
   */
  async setTenantSchema(client: PoolClient, tenantSlug: string): Promise<void> {
    const schemaName = `org_${tenantSlug}`;
    await client.query(`SET search_path = ${schemaName}, public`);
  }

  /**
   * Get connection with tenant schema set
   */
  async getTenantConnection(tenantSlug: string): Promise<PoolClient> {
    const client = await this.pool.connect();
    await this.setTenantSchema(client, tenantSlug);
    return client;
  }

  /**
   * Create tenant-specific tables
   */
  private async createTenantTables(trx: DatabaseTransaction, schemaName: string): Promise<void> {
    // Projects table
    await trx.raw(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT,
        domain VARCHAR(255) NOT NULL,
        framework VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        config JSONB NOT NULL DEFAULT '{}',
        stats JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(slug)
      );
    `);

    // Issues table
    await trx.raw(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.issues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES ${schemaName}.projects(id) ON DELETE CASCADE,
        external_id VARCHAR(255),
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'medium',
        category VARCHAR(20) DEFAULT 'other',
        reporter_email VARCHAR(255) NOT NULL,
        reporter_metadata JSONB,
        assignee_id UUID,
        labels TEXT[] DEFAULT '{}',
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Comments table
    await trx.raw(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        issue_id UUID NOT NULL REFERENCES ${schemaName}.issues(id) ON DELETE CASCADE,
        author_id UUID,
        author_email VARCHAR(255),
        author_name VARCHAR(255),
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Attachments table
    await trx.raw(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        issue_id UUID NOT NULL REFERENCES ${schemaName}.issues(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        url TEXT NOT NULL,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Integrations table
    await trx.raw(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES ${schemaName}.projects(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        config JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        last_sync_at TIMESTAMPTZ,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await trx.raw(`CREATE INDEX IF NOT EXISTS idx_${schemaName}_issues_project_status ON ${schemaName}.issues(project_id, status);`);
    await trx.raw(`CREATE INDEX IF NOT EXISTS idx_${schemaName}_issues_created_at ON ${schemaName}.issues(created_at DESC);`);
    await trx.raw(`CREATE INDEX IF NOT EXISTS idx_${schemaName}_issues_reporter ON ${schemaName}.issues(reporter_email);`);
    await trx.raw(`CREATE INDEX IF NOT EXISTS idx_${schemaName}_comments_issue ON ${schemaName}.comments(issue_id);`);
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    this.logger.info('Running database migrations...');
    
    try {
      // Ensure migrations table exists
      await this.ensureMigrationsTable();
      
      // Load migration files
      const migrations = await this.loadMigrations();
      
      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      const executedIds = new Set(executedMigrations.map(m => m.id));
      
      // Run pending migrations
      const pendingMigrations = migrations.filter(m => !executedIds.has(m.id));
      
      if (pendingMigrations.length === 0) {
        this.logger.info('No pending migrations');
        return;
      }

      for (const migration of pendingMigrations) {
        this.logger.info(`Running migration: ${migration.name}`);
        
        await this.transaction(async (trx) => {
          await migration.up(trx as any);
          await trx.query(
            'INSERT INTO migrations (id, name, executed_at) VALUES ($1, $2, NOW())',
            [migration.id, migration.name]
          );
        });
        
        this.logger.info(`✅ Migration completed: ${migration.name}`);
      }
      
      this.logger.info(`✅ Completed ${pendingMigrations.length} migrations`);
      
    } catch (error) {
      this.logger.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Ensure migrations table exists
   */
  private async ensureMigrationsTable(): Promise<void> {
    await this.raw(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL
      );
    `);
  }

  /**
   * Load migration files from filesystem
   */
  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = join(__dirname, '../migrations');
    const migrations: Migration[] = [];

    try {
      const files = await readdir(migrationsDir);
      const migrationFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js')).sort();

      for (const file of migrationFiles) {
        const migrationPath = join(migrationsDir, file);
        const migration = await import(migrationPath);
        
        if (migration.default) {
          migrations.push(migration.default);
        }
      }
    } catch (error) {
      // Migrations directory doesn't exist or is empty
      this.logger.warn('No migrations directory found or error loading migrations:', error);
    }

    return migrations;
  }

  /**
   * Get list of executed migrations
   */
  private async getExecutedMigrations(): Promise<MigrationState[]> {
    return await this.query<MigrationState>('SELECT * FROM migrations ORDER BY executed_at');
  }
}
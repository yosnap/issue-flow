/**
 * Database and Repository Types
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  transaction<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T>;
  raw(sql: string, params?: any[]): Promise<any>;
  close(): Promise<void>;
}

export interface DatabaseTransaction {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  raw(sql: string, params?: any[]): Promise<any>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Repository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findMany(options?: QueryOptions): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
}

export interface TenantAwareRepository<T, CreateInput, UpdateInput> 
  extends Repository<T, CreateInput, UpdateInput> {
  findByIdInTenant(id: string, tenantId: string): Promise<T | null>;
  findManyInTenant(tenantId: string, options?: QueryOptions): Promise<T[]>;
  createInTenant(tenantId: string, data: CreateInput): Promise<T>;
  updateInTenant(id: string, tenantId: string, data: UpdateInput): Promise<T | null>;
  deleteInTenant(id: string, tenantId: string): Promise<boolean>;
  countInTenant(tenantId: string, filters?: any): Promise<number>;
}

// Database migration types
export interface Migration {
  id: string;
  name: string;
  up: (db: DatabaseConnection) => Promise<void>;
  down: (db: DatabaseConnection) => Promise<void>;
}

export interface MigrationState {
  id: string;
  name: string;
  executedAt: Date;
}
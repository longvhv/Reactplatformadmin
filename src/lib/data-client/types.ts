/**
 * Data Client Types
 * Type definitions for the data access abstraction layer
 */

// ==================== QUERY OPTIONS ====================

export interface QueryFilter {
  field: string;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is' | 'not';
  value: any;
}

export interface QueryOrderBy {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface QueryOptions {
  /**
   * Filters to apply to the query
   * Can be simple key-value pairs or QueryFilter objects for complex filters
   */
  filters?: Record<string, any> | QueryFilter[];
  
  /**
   * Fields to order by
   */
  orderBy?: QueryOrderBy[];
  
  /**
   * Maximum number of records to return
   */
  limit?: number;
  
  /**
   * Number of records to skip (for pagination)
   */
  offset?: number;
  
  /**
   * Fields to select (default: all fields)
   * Use '*' for all fields, or specify comma-separated field names
   */
  select?: string | string[];
  
  /**
   * Include soft-deleted records (where deleted_at IS NOT NULL)
   */
  includeDeleted?: boolean;
}

// ==================== QUERY RESULT ====================

export interface QueryResult<T> {
  /**
   * Array of records returned by the query
   */
  data: T[];
  
  /**
   * Total count of records matching the query (without limit/offset)
   */
  total?: number;
  
  /**
   * Whether there are more records available (useful for pagination)
   */
  hasMore?: boolean;
  
  /**
   * Next offset for pagination
   */
  nextOffset?: number;
}

// ==================== BASE RECORD ====================

/**
 * Base fields present in all database tables
 */
export interface BaseRecord {
  _id: string; // UUID
  created_at: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  deleted_at?: string | null; // ISO timestamp (soft delete)
  version: number; // For optimistic locking
  created_by?: string | null; // UUID of creator
  updated_by?: string | null; // UUID of updater
  deleted_by?: string | null; // UUID of deleter
}

// ==================== DATA CLIENT INTERFACE ====================

/**
 * Abstract interface for data access operations
 * Implementations can use Supabase, Golang API, or any other data source
 */
export interface IDataClient {
  /**
   * Query multiple records from a table/resource
   * 
   * @param resource - Table name or resource path
   * @param options - Query options (filters, sorting, pagination, etc.)
   * @returns Promise with query result containing data array and metadata
   * 
   * @example
   * const result = await dataClient.query<Tenant>('tenants', {
   *   filters: { status: 'ACTIVE' },
   *   orderBy: [{ field: 'created_at', direction: 'desc' }],
   *   limit: 20,
   * });
   */
  query<T extends BaseRecord>(
    resource: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>>;

  /**
   * Get a single record by ID
   * 
   * @param resource - Table name or resource path
   * @param id - Record ID (UUID)
   * @returns Promise with the record or null if not found
   * 
   * @example
   * const tenant = await dataClient.get<Tenant>('tenants', tenantId);
   */
  get<T extends BaseRecord>(
    resource: string,
    id: string
  ): Promise<T | null>;

  /**
   * Create a new record
   * 
   * @param resource - Table name or resource path
   * @param data - Record data (partial, without _id and timestamps)
   * @returns Promise with the created record
   * 
   * @example
   * const tenant = await dataClient.create<Tenant>('tenants', {
   *   name: 'New Tenant',
   *   code: 'NEW_TENANT',
   *   tier: 'FREE',
   * });
   */
  create<T extends BaseRecord>(
    resource: string,
    data: Omit<Partial<T>, '_id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<T>;

  /**
   * Update an existing record
   * 
   * @param resource - Table name or resource path
   * @param id - Record ID (UUID)
   * @param data - Fields to update (partial)
   * @returns Promise with the updated record
   * 
   * @example
   * const tenant = await dataClient.update<Tenant>('tenants', tenantId, {
   *   name: 'Updated Name',
   * });
   */
  update<T extends BaseRecord>(
    resource: string,
    id: string,
    data: Partial<Omit<T, '_id' | 'created_at' | 'created_by' | 'version'>>
  ): Promise<T>;

  /**
   * Soft delete a record (sets deleted_at to current timestamp)
   * 
   * @param resource - Table name or resource path
   * @param id - Record ID (UUID)
   * @returns Promise that resolves when deletion is complete
   * 
   * @example
   * await dataClient.delete('tenants', tenantId);
   */
  delete(
    resource: string,
    id: string
  ): Promise<void>;

  /**
   * Execute a custom operation or RPC call
   * 
   * @param endpoint - Custom endpoint or RPC function name
   * @param options - Request options (method, body, params, etc.)
   * @returns Promise with the operation result
   * 
   * @example
   * const stats = await dataClient.execute<TenantStats>(
   *   'get_tenant_stats',
   *   { body: { tenant_id: tenantId } }
   * );
   */
  execute<T = any>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string>;
    }
  ): Promise<T>;
}

// ==================== ERROR TYPES ====================

export class DataClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'DataClientError';
  }
}

export class NotFoundError extends DataClientError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DataClientError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class OptimisticLockError extends DataClientError {
  constructor(resource: string, id: string) {
    super(
      `${resource} with id ${id} was modified by another user. Please refresh and try again.`,
      'OPTIMISTIC_LOCK_ERROR',
      409
    );
    this.name = 'OptimisticLockError';
  }
}

// ==================== CONFIGURATION ====================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface GolangApiConfig {
  baseUrl: string;
  apiKey: string;
}

export type DataSourceType = 'supabase' | 'golang-api';

export interface DataClientConfig {
  type: DataSourceType;
  supabase?: SupabaseConfig;
  golangApi?: GolangApiConfig;
}

/**
 * Supabase Data Client Implementation
 * Uses Supabase client to interact with PostgreSQL database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  IDataClient,
  QueryOptions,
  QueryResult,
  BaseRecord,
  QueryFilter,
  DataClientError,
  NotFoundError,
  OptimisticLockError,
} from './types';

export class SupabaseDataClient implements IDataClient {
  private client: SupabaseClient;

  // ==================== CONFIGURATION ====================
  
  /**
   * Tables that do NOT have deleted_at column (no soft delete support)
   * Add table names here to skip soft delete filtering
   */
  private static readonly TABLES_WITHOUT_SOFT_DELETE = new Set([
    'roles',
    'permissions',
    'webhooks',
    'user_delegations',
    'user_sessions',        // ✅ No deleted_at column
    'user_devices',         // ✅ No deleted_at column
    'telemetry.auth_logs',
    'telemetry.api_usage_logs',
    'telemetry.traffic_logs',
    'telemetry.user_registration_logs',
  ]);

  /**
   * Schema mapping for tables in non-public schemas
   * Format: { 'table_name': 'schema_name' }
   */
  private static readonly SCHEMA_MAPPING: Record<string, string> = {
    'auth_logs': 'telemetry',
    'api_usage_logs': 'telemetry',
    'traffic_logs': 'telemetry',
    'user_registration_logs': 'telemetry',
  };

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: false, // Don't persist session in data client
      },
    });
  }

  /**
   * Get schema name for a resource
   */
  private getSchema(resource: string): string | undefined {
    return SupabaseDataClient.SCHEMA_MAPPING[resource];
  }

  /**
   * Check if a table supports soft delete
   */
  private supportsSoftDelete(resource: string): boolean {
    // Check both plain resource name and schema-prefixed name
    const schemaPrefix = this.getSchema(resource);
    const fullResourceName = schemaPrefix ? `${schemaPrefix}.${resource}` : resource;
    
    return !SupabaseDataClient.TABLES_WITHOUT_SOFT_DELETE.has(resource) &&
           !SupabaseDataClient.TABLES_WITHOUT_SOFT_DELETE.has(fullResourceName);
  }

  /**
   * Create a query builder with the appropriate schema
   */
  private createQueryBuilder(resource: string) {
    const schema = this.getSchema(resource);
    if (schema) {
      return this.client.schema(schema).from(resource);
    }
    return this.client.from(resource);
  }

  /**
   * Query multiple records
   */
  async query<T extends BaseRecord>(
    resource: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    try {
      console.log(`[SupabaseDataClient] Query resource: ${resource}, options:`, options);
      
      // Build base query
      let query = this.createQueryBuilder(resource)
        .select(this.buildSelect(options?.select), { count: 'exact' });

      // Apply soft delete filter (default: exclude deleted)
      // Only if table supports soft delete
      if (!options?.includeDeleted && this.supportsSoftDelete(resource)) {
        console.log(`[SupabaseDataClient] Applying soft delete filter for ${resource}`);
        query = query.is('deleted_at', null);
      }

      // Apply filters
      if (options?.filters) {
        console.log(`[SupabaseDataClient] Applying filters:`, options.filters);
        query = this.applyFilters(query, options.filters);
      }

      // Apply sorting
      if (options?.orderBy && options.orderBy.length > 0) {
        options.orderBy.forEach(({ field, direction = 'asc' }) => {
          query = query.order(field, { ascending: direction === 'asc' });
        });
      }

      // Apply pagination
      if (options?.limit !== undefined) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        console.error(`[SupabaseDataClient] Query error on ${resource}:`, error);
        throw this.handleError(error, resource);
      }

      console.log(`[SupabaseDataClient] Query result - count: ${count}, data length: ${data?.length || 0}`);

      const total = count ?? undefined;
      const hasMore = options?.limit
        ? total !== undefined && total > (options.offset || 0) + options.limit
        : false;
      const nextOffset = options?.limit && hasMore
        ? (options.offset || 0) + options.limit
        : undefined;

      return {
        data: (data || []) as T[],
        total,
        hasMore,
        nextOffset,
      };
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err; // Re-throw our custom errors
      }
      throw new Error(`Failed to query ${resource}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Get a single record by ID
   */
  async get<T extends BaseRecord>(
    resource: string,
    id: string
  ): Promise<T | null> {
    try {
      let query = this.createQueryBuilder(resource)
        .select('*')
        .eq('_id', id);

      // Only apply soft delete filter if table supports it
      if (this.supportsSoftDelete(resource)) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        // PGRST116 = No rows found (not an error in our case)
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error(`[SupabaseDataClient] Get error on ${resource}:`, error);
        throw this.handleError(error, resource);
      }

      return data as T | null;
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to get ${resource}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Create a new record
   */
  async create<T extends BaseRecord>(
    resource: string,
    data: Omit<Partial<T>, '_id' | 'created_at' | 'updated_at' | 'version'>
  ): Promise<T> {
    try {
      // Prepare insert data with defaults
      const insertData: any = {
        _id: crypto.randomUUID(), // Generate UUID
        ...data,
        created_at: new Date().toISOString(),
        version: 1,
      };

      // Remove fields that shouldn't be set on create
      delete insertData.updated_at;
      delete insertData.deleted_at;
      delete insertData.deleted_by;

      const { data: result, error } = await this.createQueryBuilder(resource)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error(`[SupabaseDataClient] Create error on ${resource}:`, error);
        throw this.handleError(error, resource);
      }

      return result as T;
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to create ${resource}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Update an existing record with optimistic locking
   */
  async update<T extends BaseRecord>(
    resource: string,
    id: string,
    data: Partial<Omit<T, '_id' | 'created_at' | 'created_by' | 'version'>>
  ): Promise<T> {
    try {
      // First, get current record to check version
      const current = await this.get<T>(resource, id);
      
      if (!current) {
        throw new NotFoundError(resource, id);
      }

      // Prepare update data
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString(),
        version: current.version + 1,
      };

      // Remove immutable fields
      delete updateData._id;
      delete updateData.created_at;
      delete updateData.created_by;

      // Build update query
      let query = this.createQueryBuilder(resource)
        .update(updateData)
        .eq('_id', id)
        .eq('version', current.version); // Optimistic lock check

      // Only filter deleted records if table supports soft delete
      if (this.supportsSoftDelete(resource)) {
        query = query.is('deleted_at', null); // Don't update deleted records
      }

      const { data: result, error } = await query
        .select()
        .single();

      if (error) {
        // Check if optimistic lock failed
        if (error.code === 'PGRST116') {
          throw new OptimisticLockError(resource, id);
        }
        console.error(`[SupabaseDataClient] Update error on ${resource}:`, error);
        throw this.handleError(error, resource);
      }

      return result as T;
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to update ${resource}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Soft delete a record
   */
  async delete(resource: string, id: string): Promise<void> {
    try {
      // Check if table supports soft delete
      if (this.supportsSoftDelete(resource)) {
        // Soft delete: update deleted_at
        const { error } = await this.createQueryBuilder(resource)
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('_id', id)
          .is('deleted_at', null); // Only delete non-deleted records

        if (error) {
          console.error(`[SupabaseDataClient] Delete error on ${resource}:`, error);
          throw this.handleError(error, resource);
        }
      } else {
        // Hard delete: permanently remove record
        const { error } = await this.createQueryBuilder(resource)
          .delete()
          .eq('_id', id);

        if (error) {
          console.error(`[SupabaseDataClient] Delete error on ${resource}:`, error);
          throw this.handleError(error, resource);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to delete ${resource}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Execute custom RPC or complex query
   */
  async execute<T = any>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      // For Supabase, we use RPC for custom operations
      const { data, error } = await this.client.rpc(endpoint, options?.body);

      if (error) {
        console.error(`[SupabaseDataClient] Execute error on ${endpoint}:`, error);
        throw this.handleError(error, endpoint);
      }

      return data as T;
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to execute ${endpoint}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Build select clause
   */
  private buildSelect(select?: string | string[]): string {
    if (!select) return '*';
    if (Array.isArray(select)) return select.join(',');
    return select;
  }

  /**
   * Apply filters to query
   */
  private applyFilters(query: any, filters: Record<string, any> | QueryFilter[]): any {
    // Handle array of QueryFilter objects
    if (Array.isArray(filters)) {
      filters.forEach((filter) => {
        const { field, operator = 'eq', value } = filter;
        
        if (value === undefined || value === 'all') return;

        switch (operator) {
          case 'eq':
            query = query.eq(field, value);
            break;
          case 'neq':
            query = query.neq(field, value);
            break;
          case 'gt':
            query = query.gt(field, value);
            break;
          case 'gte':
            query = query.gte(field, value);
            break;
          case 'lt':
            query = query.lt(field, value);
            break;
          case 'lte':
            query = query.lte(field, value);
            break;
          case 'like':
            query = query.like(field, value);
            break;
          case 'ilike':
            query = query.ilike(field, value);
            break;
          case 'in':
            query = query.in(field, value);
            break;
          case 'is':
            query = query.is(field, value);
            break;
          case 'not':
            query = query.not(field, 'eq', value);
            break;
          default:
            query = query.eq(field, value);
        }
      });
      return query;
    }

    // Handle simple key-value object
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === 'all') return;

      // Handle special operators passed as objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const { operator, value: filterValue } = value;
        if (operator && filterValue !== undefined) {
          query = this.applyFilters(query, [{ field: key, operator, value: filterValue }]);
          return;
        }
      }

      // Simple equality filter
      query = query.eq(key, value);
    });

    return query;
  }

  /**
   * Handle Supabase errors and convert to our error types
   */
  private handleError(error: any, resource: string): Error {
    const message = error.message || error.hint || 'Unknown error';
    const code = error.code;

    // Map Supabase error codes to our error types
    if (code === '23505') {
      return new Error(`Duplicate key violation in ${resource}: ${message}`);
    }
    if (code === '23503') {
      return new Error(`Foreign key violation in ${resource}: ${message}`);
    }
    if (code === '23502') {
      return new Error(`Not null violation in ${resource}: ${message}`);
    }
    if (code === 'PGRST116') {
      return new NotFoundError(resource, 'unknown');
    }

    return new Error(`Database error in ${resource}: ${message}`);
  }
}
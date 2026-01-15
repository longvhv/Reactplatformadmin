/**
 * Base API Adapter
 * Abstract interface for data sources (Supabase, Golang, etc.)
 */

/**
 * Generic filter params for list queries
 */
export interface BaseFilters {
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  [key: string]: any; // Allow additional filters
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Base API Adapter Interface
 * All data source adapters must implement this
 */
export interface IApiAdapter<T, CreateDto, UpdateDto> {
  /**
   * Get all records with optional filters
   */
  getAll(filters?: BaseFilters): Promise<T[]>;

  /**
   * Get single record by ID
   */
  getById(id: string): Promise<T>;

  /**
   * Create new record
   */
  create(data: CreateDto): Promise<T>;

  /**
   * Update existing record
   */
  update(id: string, data: UpdateDto): Promise<T>;

  /**
   * Delete record (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Get paginated list (optional - for large datasets)
   */
  getPaginated?(filters?: BaseFilters): Promise<PaginatedResponse<T>>;

  /**
   * Search records (optional)
   */
  search?(query: string, filters?: BaseFilters): Promise<T[]>;
}

/**
 * Base API Adapter Abstract Class
 * Provides common functionality for all adapters
 */
export abstract class BaseApiAdapter<T, CreateDto, UpdateDto> 
  implements IApiAdapter<T, CreateDto, UpdateDto> {
  
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Must be implemented by child classes
  abstract getAll(filters?: BaseFilters): Promise<T[]>;
  abstract getById(id: string): Promise<T>;
  abstract create(data: CreateDto): Promise<T>;
  abstract update(id: string, data: UpdateDto): Promise<T>;
  abstract delete(id: string): Promise<void>;

  /**
   * Build query params from filters
   */
  protected buildQueryParams(filters?: BaseFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.search) params.search = filters.search;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;
    if (filters.order_by) params.order_by = filters.order_by;
    if (filters.order_direction) params.order_direction = filters.order_direction;

    // Add custom filters
    Object.keys(filters).forEach(key => {
      if (!['search', 'limit', 'offset', 'order_by', 'order_direction'].includes(key)) {
        params[key] = filters[key];
      }
    });

    return params;
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any, operation: string): never {
    console.error(`[${this.tableName}] Error in ${operation}:`, error);
    throw new Error(error.message || `Failed to ${operation} ${this.tableName}`);
  }
}

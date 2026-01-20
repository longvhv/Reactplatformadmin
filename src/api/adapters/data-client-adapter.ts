/**
 * Data Client Adapter
 * Adapter that bridges the IApiAdapter interface to the unified DataClient
 * This allows existing api/*.ts files to use the new DataClient pattern
 */

import { BaseApiAdapter, BaseFilters, IApiAdapter, PaginatedResponse } from './base';
import { getDataClient } from '@/lib/data-client';
import { QueryOptions } from '@/lib/data-client/types';

export class DataClientAdapter<T, CreateDto, UpdateDto> extends BaseApiAdapter<T, CreateDto, UpdateDto> {
  private resource: string;
  private supportsSoftDelete: boolean;

  constructor(tableName: string, supportsSoftDelete: boolean = false) {
    super(tableName);
    // Resource name usually matches table name
    this.resource = tableName;
    this.supportsSoftDelete = supportsSoftDelete;
  }

  /**
   * Convert BaseFilters to DataClient QueryOptions
   */
  private mapFiltersToOptions(filters?: BaseFilters): QueryOptions {
    if (!filters) return {};

    const options: QueryOptions = {
      filters: {},
      orderBy: [],
    };

    // Map standard filters
    if (filters.limit) options.limit = filters.limit;
    if (filters.offset) options.offset = filters.offset;
    
    // Map sorting
    if (filters.order_by) {
      options.orderBy?.push({
        field: filters.order_by,
        direction: filters.order_direction || 'asc'
      });
    }

    // Map other filters
    const excludeKeys = ['limit', 'offset', 'order_by', 'order_direction', 'search', 'include_deleted'];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (!excludeKeys.includes(key) && value !== undefined) {
        // @ts-ignore
        options.filters[key] = value;
      }
    });

    // Handle soft delete inclusion
    if (filters.include_deleted) {
      options.includeDeleted = true;
    }

    // Handle search (simple implementation, ideally specific fields should be targeted)
    // Note: DataClient interface doesn't have a generic 'search' param yet, 
    // it relies on specific field filters. 
    // For now, we assume the specific API implementation handles search fields 
    // or we might need to extend DataClient.
    // However, if the underlying implementation is Supabase, we might use 'ilike'.
    // If it's Golang, we might pass a 'search' query param if supported.
    if (filters.search) {
        // @ts-ignore - Passing 'search' as a filter to let the backend handle it if it supports ?search=...
        options.filters['search'] = filters.search;
    }

    return options;
  }

  /**
   * Get all records with filters
   */
  async getAll(filters?: BaseFilters): Promise<T[]> {
    try {
      const options = this.mapFiltersToOptions(filters);
      // Remove limit/offset for "getAll" unless explicitly pagination is expected, 
      // but usually getAll fetches a list. 
      // If limit is not set in filters, we might want to set a high default or let backend handle it.
      
      const result = await getDataClient().query<any>(this.resource, options);
      return result.data as T[];
    } catch (error) {
      this.handleError(error, 'fetch all');
    }
  }

  /**
   * Get single record by ID
   */
  async getById(id: string): Promise<T> {
    try {
      const result = await getDataClient().get<any>(this.resource, id);
      if (!result) {
        throw new Error(`Record not found in ${this.resource} with id ${id}`);
      }
      return result as T;
    } catch (error) {
      this.handleError(error, 'fetch by id');
    }
  }

  /**
   * Create new record
   */
  async create(data: CreateDto): Promise<T> {
    try {
      // @ts-ignore
      const result = await getDataClient().create<any>(this.resource, data);
      return result as T;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Update existing record
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      // @ts-ignore
      const result = await getDataClient().update<any>(this.resource, id, data);
      return result as T;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    try {
      await getDataClient().delete(this.resource, id);
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  /**
   * Get paginated list
   */
  async getPaginated(filters?: BaseFilters): Promise<PaginatedResponse<T>> {
     try {
       const options = this.mapFiltersToOptions(filters);
       const result = await getDataClient().query<any>(this.resource, options);
       
       return {
         data: result.data as T[],
         total: result.total || result.data.length,
         limit: options.limit || 0,
         offset: options.offset || 0,
         has_more: result.hasMore || false
       };
     } catch (error) {
       this.handleError(error, 'fetch paginated');
     }
  }
}

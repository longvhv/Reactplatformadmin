/**
 * Supabase Adapter
 * Implements data access using Supabase client
 */

import { supabase } from '@/utils/supabase/client';
import { BaseApiAdapter, BaseFilters } from './base';

/**
 * Field mapping configuration for database table to API response
 */
interface FieldMapping {
  [apiField: string]: string; // apiField -> dbField
}

/**
 * Supabase Adapter
 * Generic adapter for Supabase queries
 */
export class SupabaseAdapter<T, CreateDto, UpdateDto> extends BaseApiAdapter<T, CreateDto, UpdateDto> {
  private supportsSoftDelete: boolean;
  protected fieldMapping?: FieldMapping;

  constructor(tableName: string, supportsSoftDelete: boolean = false, fieldMapping?: FieldMapping) {
    super(tableName);
    this.supportsSoftDelete = supportsSoftDelete;
    this.fieldMapping = fieldMapping;
  }

  /**
   * Map database row to API response format
   */
  protected mapFromDb(row: any): any {
    if (!this.fieldMapping || !row) return row;

    const mapped: any = { ...row };
    
    // Map fields from DB names to API names
    Object.entries(this.fieldMapping).forEach(([apiField, dbField]) => {
      if (row[dbField] !== undefined) {
        mapped[apiField] = row[dbField];
        // Optionally remove the original DB field if different
        if (apiField !== dbField) {
          delete mapped[dbField];
        }
      }
    });

    return mapped;
  }

  /**
   * Map API request to database format
   */
  protected mapToDb(data: any): any {
    if (!this.fieldMapping || !data) return data;

    const mapped: any = { ...data };
    
    // Map fields from API names to DB names
    Object.entries(this.fieldMapping).forEach(([apiField, dbField]) => {
      if (data[apiField] !== undefined) {
        mapped[dbField] = data[apiField];
        // Remove the API field if different from DB field
        if (apiField !== dbField) {
          delete mapped[apiField];
        }
      }
    });

    return mapped;
  }

  /**
   * Get all records with filters
   */
  async getAll(filters?: BaseFilters): Promise<T[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');
      
      // Only filter by deleted_at if table supports soft delete
      if (this.supportsSoftDelete) {
        query = query.is('deleted_at', null);
      }

      // Apply filters
      if (filters) {
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
        }

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        if (filters.offset) {
          const limit = filters.limit || 10;
          query = query.range(filters.offset, filters.offset + limit - 1);
        }

        if (filters.order_by) {
          const ascending = filters.order_direction !== 'desc';
          query = query.order(filters.order_by, { ascending });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        // Apply custom filters
        Object.keys(filters).forEach(key => {
          if (!['search', 'limit', 'offset', 'order_by', 'order_direction'].includes(key)) {
            const value = filters[key];
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          }
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'fetch all');
      }

      return ((data || []) as any[]).map(row => this.mapFromDb(row)) as T[];
    } catch (error) {
      this.handleError(error, 'fetch all');
    }
  }

  /**
   * Get single record by ID
   */
  async getById(id: string): Promise<T> {
    try {
      console.log(`[${this.tableName}] Fetching by id:`, id);
      
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('_id', id);
      
      // Only filter by deleted_at if table supports soft delete
      if (this.supportsSoftDelete) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error(`[${this.tableName}] Error in getById:`, error);
        this.handleError(error, 'fetch by id');
      }

      console.log(`[${this.tableName}] Fetched data:`, data);
      return this.mapFromDb(data) as T;
    } catch (error) {
      console.error(`[${this.tableName}] Exception in getById:`, error);
      this.handleError(error, 'fetch by id');
    }
  }

  /**
   * Create new record
   */
  async create(data: CreateDto): Promise<T> {
    try {
      // Map API data to DB format
      const mappedData = this.mapToDb(data);
      
      // Generate UUID for _id if not provided
      const dataWithId = {
        _id: crypto.randomUUID(),
        ...mappedData as any,
      };
      
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert([dataWithId])
        .select()
        .single();

      if (error) {
        this.handleError(error, 'create');
      }

      return this.mapFromDb(result) as T;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Update existing record
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      // Map API data to DB format
      const mappedData = this.mapToDb(data);
      
      const updateData = {
        ...mappedData,
        updated_at: new Date().toISOString(),
      };

      let query = supabase
        .from(this.tableName)
        .update(updateData as any)
        .eq('_id', id);
      
      // Only filter by deleted_at if table supports soft delete
      if (this.supportsSoftDelete) {
        query = query.is('deleted_at', null);
      }

      const { data: result, error } = await query.select().single();

      if (error) {
        this.handleError(error, 'update');
      }

      return this.mapFromDb(result) as T;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Soft delete record
   */
  async delete(id: string): Promise<void> {
    try {
      // If table supports soft delete, use soft delete
      if (this.supportsSoftDelete) {
        const { error } = await supabase
          .from(this.tableName)
          .update({ 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('_id', id);

        if (error) {
          this.handleError(error, 'delete');
        }
      } else {
        // Otherwise, hard delete
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('_id', id);

        if (error) {
          this.handleError(error, 'delete');
        }
      }
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  /**
   * Execute custom query
   */
  async executeQuery(queryBuilder: (query: any) => any): Promise<T[]> {
    try {
      const query = queryBuilder(supabase.from(this.tableName).select('*'));
      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'execute query');
      }

      return (data || []) as T[];
    } catch (error) {
      this.handleError(error, 'execute query');
    }
  }
}
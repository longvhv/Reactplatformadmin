/**
 * HTTP Adapter (for Golang microservices)
 * Implements data access using HTTP REST API
 */

import { httpClient } from '../config';
import { BaseApiAdapter, BaseFilters } from './base';

/**
 * HTTP Adapter
 * Generic adapter for REST API calls (Golang backend)
 */
export class HttpAdapter<T, CreateDto, UpdateDto> extends BaseApiAdapter<T, CreateDto, UpdateDto> {
  private endpoint: string;

  constructor(tableName: string, endpoint?: string) {
    super(tableName);
    // Convert snake_case table name to kebab-case endpoint
    this.endpoint = endpoint || `/${tableName.replace(/_/g, '-')}`;
  }

  /**
   * Get all records with filters
   */
  async getAll(filters?: BaseFilters): Promise<T[]> {
    try {
      const params = this.buildQueryParams(filters);
      return await httpClient.get<T[]>(this.endpoint, params);
    } catch (error) {
      this.handleError(error, 'fetch all');
    }
  }

  /**
   * Get single record by ID
   */
  async getById(id: string): Promise<T> {
    try {
      return await httpClient.get<T>(`${this.endpoint}/${id}`);
    } catch (error) {
      this.handleError(error, 'fetch by id');
    }
  }

  /**
   * Create new record
   */
  async create(data: CreateDto): Promise<T> {
    try {
      return await httpClient.post<T>(this.endpoint, data);
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Update existing record
   */
  async update(id: string, data: UpdateDto): Promise<T> {
    try {
      return await httpClient.patch<T>(`${this.endpoint}/${id}`, data);
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<void> {
    try {
      await httpClient.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}

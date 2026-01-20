/**
 * Golang API Data Client Implementation
 * Uses REST API to interact with Golang backend
 */

import type {
  IDataClient,
  QueryOptions,
  QueryResult,
  BaseRecord,
  DataClientError,
  NotFoundError,
  ValidationError,
  OptimisticLockError,
} from './types';

export class GolangApiDataClient implements IDataClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Query multiple records
   */
  async query<T extends BaseRecord>(
    resource: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const url = this.buildUrl(`/${resource}`, options);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw await this.handleHttpError(response, resource);
      }

      const result = await response.json();

      // Expected Golang API format:
      // {
      //   "data": [...],
      //   "total": 100,
      //   "has_more": true,
      //   "next_offset": 20
      // }
      return {
        data: result.data || [],
        total: result.total,
        hasMore: result.has_more,
        nextOffset: result.next_offset,
      };
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
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
      const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw await this.handleHttpError(response, resource);
      }

      const result = await response.json();
      
      // Expected format: { "data": {...} }
      return result.data || result;
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
      const response = await fetch(`${this.baseUrl}/${resource}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await this.handleHttpError(response, resource);
      }

      const result = await response.json();
      
      // Expected format: { "data": {...} }
      return result.data || result;
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to create ${resource}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Update an existing record
   */
  async update<T extends BaseRecord>(
    resource: string,
    id: string,
    data: Partial<Omit<T, '_id' | 'created_at' | 'created_by' | 'version'>>
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await this.handleHttpError(response, resource);
      }

      const result = await response.json();
      
      // Expected format: { "data": {...} }
      return result.data || result;
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
      const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw await this.handleHttpError(response, resource);
      }
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to delete ${resource}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Execute custom operation
   */
  async execute<T = any>(
    endpoint: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string>;
    }
  ): Promise<T> {
    const url = this.buildUrl(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, { filters: options?.params });

    try {
      const response = await fetch(url, {
        method: options?.method || 'GET',
        headers: this.getHeaders(),
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        throw await this.handleHttpError(response, endpoint);
      }

      return await response.json();
    } catch (err) {
      if (err instanceof Error && err.name.includes('Error')) {
        throw err;
      }
      throw new Error(`Failed to execute ${endpoint}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get HTTP headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Try to get user token from storage if available (Client-side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vhv-auth-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        return headers;
      }
    }

    // Fallback to API Key (Service-to-Service or Public access)
    headers['Authorization'] = `Bearer ${this.apiKey}`;
    return headers;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, options?: QueryOptions): string {
    const url = new URL(`${this.baseUrl}${path}`);

    // Add filters as query params
    if (options?.filters) {
      if (Array.isArray(options.filters)) {
        // Handle QueryFilter[] format
        options.filters.forEach((filter) => {
          const paramName = `${filter.field}[${filter.operator || 'eq'}]`;
          url.searchParams.append(paramName, String(filter.value));
        });
      } else {
        // Handle simple key-value format
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== 'all') {
            url.searchParams.append(key, String(value));
          }
        });
      }
    }

    // Add sorting
    if (options?.orderBy && options.orderBy.length > 0) {
      const orderBy = options.orderBy
        .map(({ field, direction = 'asc' }) => `${field}:${direction}`)
        .join(',');
      url.searchParams.append('order_by', orderBy);
    }

    // Add pagination
    if (options?.limit !== undefined) {
      url.searchParams.append('limit', String(options.limit));
    }
    if (options?.offset !== undefined) {
      url.searchParams.append('offset', String(options.offset));
    }

    // Add select fields
    if (options?.select) {
      const fields = Array.isArray(options.select)
        ? options.select.join(',')
        : options.select;
      url.searchParams.append('fields', fields);
    }

    // Add includeDeleted flag
    if (options?.includeDeleted) {
      url.searchParams.append('include_deleted', 'true');
    }

    return url.toString();
  }

  /**
   * Handle HTTP errors and convert to our error types
   */
  private async handleHttpError(response: Response, resource: string): Promise<Error> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, use status text
      errorData = { message: response.statusText };
    }

    const message = errorData.message || errorData.error || response.statusText;
    const code = errorData.code;
    const statusCode = response.status;

    // Map HTTP status codes to our error types
    if (statusCode === 404) {
      return new NotFoundError(resource, 'unknown');
    }

    if (statusCode === 400) {
      return new ValidationError(message, errorData.details);
    }

    if (statusCode === 409) {
      // Could be optimistic lock error or conflict
      if (code === 'OPTIMISTIC_LOCK_ERROR' || message.includes('version')) {
        return new OptimisticLockError(resource, 'unknown');
      }
      return new Error(`Conflict in ${resource}: ${message}`);
    }

    if (statusCode === 401) {
      // Handle Unauthorized - Clear token if client-side
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vhv-auth-token');
        // Optional: Redirect to login or dispatch event
      }
      return new Error(`Unauthorized: ${message}`);
    }

    if (statusCode === 403) {
      return new Error(`Forbidden: ${message}`);
    }

    if (statusCode >= 500) {
      return new Error(`Server error in ${resource}: ${message}`);
    }

    return new Error(`API error in ${resource}: ${message}`);
  }
}

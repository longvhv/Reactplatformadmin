/**
 * API Configuration
 * Centralized config for API clients with support for multiple backends
 * Supports: Supabase (current) and Golang microservices (future)
 */

import { projectId, publicAnonKey } from '@/utils/supabase/info';

// ==================== CONFIGURATION ====================

/**
 * API Mode
 * - 'supabase': Use Supabase direct queries (current)
 * - 'golang': Use Golang microservices REST API (future)
 * - 'hybrid': Support both (during migration)
 */
export type ApiMode = 'supabase' | 'golang' | 'hybrid';

export const API_MODE = (
  typeof import.meta !== 'undefined' && 
  import.meta.env && 
  import.meta.env.VITE_API_MODE
) ? import.meta.env.VITE_API_MODE as ApiMode : 'supabase';

/**
 * Golang API Configuration
 * Will be used when API_MODE is 'golang' or 'hybrid'
 */
export const GOLANG_API_CONFIG = {
  baseURL: (
    typeof import.meta !== 'undefined' && 
    import.meta.env && 
    import.meta.env.VITE_GOLANG_API_URL
  ) ? import.meta.env.VITE_GOLANG_API_URL : 'http://localhost:8080/api/v1',
  timeout: 30000, // 30 seconds
  retryCount: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Supabase Edge Function API (legacy - for existing endpoints)
 * Used for endpoints not yet migrated to Supabase direct queries
 */
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

// ==================== HTTP CLIENT ====================

/**
 * HTTP Client for Golang microservices
 * Simple wrapper around fetch with retry logic and error handling
 */
export class HttpClient {
  private baseURL: string;
  private timeout: number;
  private retryCount: number;
  private retryDelay: number;

  constructor(config = GOLANG_API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retryCount = config.retryCount;
    this.retryDelay = config.retryDelay;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = this.retryCount
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && retries > 0 && response.status >= 500) {
        // Retry on server errors
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }

      return response;
    } catch (error: any) {
      if (retries > 0 && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await this.fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Get default headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null;
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle response and extract data
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: response.statusText 
      }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      // Handle { data } wrapper from backend
      return result.data !== undefined ? result.data : result;
    }

    return response.text() as any;
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HttpClient();

// ==================== LEGACY HELPERS ====================

/**
 * Default headers for API requests (legacy)
 */
export const getDefaultHeaders = (): HeadersInit => ({
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
});

/**
 * Helper to make API requests with default config (legacy)
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getDefaultHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Handle { data } wrapper from backend
  return result.data !== undefined ? result.data : result;
}

// ==================== UTILITIES ====================

/**
 * Check if API is in Supabase mode
 */
export const isSupabaseMode = (): boolean => {
  return API_MODE === 'supabase' || API_MODE === 'hybrid';
};

/**
 * Check if API is in Golang mode
 */
export const isGolangMode = (): boolean => {
  return API_MODE === 'golang' || API_MODE === 'hybrid';
};

/**
 * Log API mode on startup
 */
if (typeof window !== 'undefined') {
  console.log(`🔧 API Mode: ${API_MODE}`);
  if (API_MODE === 'golang' || API_MODE === 'hybrid') {
    console.log(`🔗 Golang API URL: ${GOLANG_API_CONFIG.baseURL}`);
  }
}
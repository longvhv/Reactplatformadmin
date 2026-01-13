/**
 * Tenants Service
 * 
 * Frontend service layer for tenant management
 * Handles API communication with backend
 */

import { projectId, publicAnonKey } from '@/utils/supabase/info';
import type { 
  Tenant, 
  CreateTenantInput, 
  UpdateTenantInput,
  TenantStatus,
  TenantTier,
  DataRegion 
} from '@/data/tenants';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

interface ListTenantsParams {
  status?: TenantStatus;
  tier?: TenantTier;
  data_region?: DataRegion;
  parent_tenant_id?: string | 'null';
  search?: string;
  limit?: number;
  offset?: number;
}

interface ListTenantsResponse {
  data: Tenant[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface TenantResponse {
  data: Tenant;
  message?: string;
}

interface ErrorResponse {
  error: string;
}

class TenantsService {
  private getAuthToken(): string {
    // Try to get from localStorage first (after user login)
    const token = localStorage.getItem('supabase_auth_token');
    if (token) return token;
    
    // Fallback to anon key for read operations
    return publicAnonKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ErrorResponse).error || 'Request failed');
    }

    return data as T;
  }

  /**
   * List tenants with optional filters
   */
  async listTenants(params: ListTenantsParams = {}): Promise<ListTenantsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.tier) queryParams.append('tier', params.tier);
    if (params.data_region) queryParams.append('data_region', params.data_region);
    if (params.parent_tenant_id) queryParams.append('parent_tenant_id', params.parent_tenant_id);
    if (params.search) queryParams.append('search', params.search);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    const endpoint = `/tenants${query ? `?${query}` : ''}`;
    
    return this.request<ListTenantsResponse>(endpoint);
  }

  /**
   * Get single tenant by ID
   */
  async getTenant(id: string): Promise<Tenant> {
    const response = await this.request<TenantResponse>(`/tenants/${id}`);
    return response.data;
  }

  /**
   * Create new tenant
   */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const response = await this.request<TenantResponse>('/tenants', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  /**
   * Update existing tenant
   */
  async updateTenant(id: string, input: Partial<UpdateTenantInput>): Promise<Tenant> {
    const response = await this.request<TenantResponse>(`/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.data;
  }

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(id: string): Promise<void> {
    await this.request<TenantResponse>(`/tenants/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get direct children of a tenant
   */
  async getChildren(id: string): Promise<Tenant[]> {
    const response = await this.request<{ data: Tenant[] }>(`/tenants/${id}/children`);
    return response.data;
  }

  /**
   * Get all descendants of a tenant (using materialized path)
   */
  async getDescendants(id: string): Promise<Tenant[]> {
    const response = await this.request<{ data: Tenant[] }>(`/tenants/${id}/descendants`);
    return response.data;
  }

  /**
   * Get root tenants (no parent)
   */
  async getRootTenants(): Promise<Tenant[]> {
    const response = await this.listTenants({ parent_tenant_id: 'null' });
    return response.data;
  }

  /**
   * Search tenants by name or code
   */
  async searchTenants(query: string): Promise<Tenant[]> {
    const response = await this.listTenants({ search: query });
    return response.data;
  }

  /**
   * Get tenants by status
   */
  async getTenantsByStatus(status: TenantStatus): Promise<Tenant[]> {
    const response = await this.listTenants({ status });
    return response.data;
  }

  /**
   * Get tenants by tier
   */
  async getTenantsByTier(tier: TenantTier): Promise<Tenant[]> {
    const response = await this.listTenants({ tier });
    return response.data;
  }

  /**
   * Get partner tenants (PARTNER_* tiers)
   */
  async getPartnerTenants(): Promise<Tenant[]> {
    const allTenants = await this.listTenants({ limit: 1000 });
    return allTenants.data.filter(t => 
      t.tier.startsWith('PARTNER_')
    );
  }

  /**
   * Build hierarchical tree structure
   */
  buildTree(tenants: Tenant[]): Tenant[] {
    const map = new Map<string, Tenant & { children?: Tenant[] }>();
    const roots: Tenant[] = [];

    // First pass: create map
    tenants.forEach(tenant => {
      map.set(tenant._id, { ...tenant, children: [] });
    });

    // Second pass: build tree
    tenants.forEach(tenant => {
      const node = map.get(tenant._id)!;
      if (tenant.parent_tenant_id) {
        const parent = map.get(tenant.parent_tenant_id);
        if (parent) {
          parent.children?.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * Flatten tree to list with depth indicators
   */
  flattenTree(tenants: Tenant[]): Array<Tenant & { depth: number }> {
    const result: Array<Tenant & { depth: number }> = [];

    const traverse = (nodes: Tenant[], depth: number = 0) => {
      nodes.forEach(node => {
        result.push({ ...node, depth });
        if ('children' in node && Array.isArray((node as any).children)) {
          traverse((node as any).children, depth + 1);
        }
      });
    };

    traverse(tenants);
    return result;
  }
}

// Export singleton instance
export const tenantsService = new TenantsService();

// Export class for testing
export default TenantsService;
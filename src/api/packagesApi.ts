/**
 * Packages API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { BaseFilters } from './adapters';
import { ServicePackagesAdapter } from './adapters/servicePackagesAdapter';

// ==================== TYPES ====================

export interface Package {
  _id: string;
  tenant_id: string;
  saas_product_id: string;
  // Joined product info
  product_name?: string;
  product_code?: string;
  
  code: string;
  name: string;
  description?: string;
  
  // Pricing
  price_amount: number;
  currency_code: string;
  billing_cycle?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME' | 'ONE_TIME' | 'CUSTOM';
  
  // Configuration
  entitlements_config: Record<string, any>;
  
  // Features & Limits (maps to limits_config in DB)
  features?: {
    trial_days?: number;
    max_users?: number | null;
    max_storage?: number | null;
    [key: string]: any; // Allow additional limits
  };
  
  metadata?: Record<string, any>;
  
  // Display & Status
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  is_public: boolean;
  display_order?: number;
  
  // Audit
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_by?: string;
  version: number;
}

export interface CreatePackageRequest {
  tenant_id: string;
  saas_product_id: string;
  code: string;
  name: string;
  description?: string;
  price_amount: number;
  currency_code?: string;
  billing_cycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME' | 'CUSTOM';
  entitlements_config?: Record<string, any>;
  features?: {
    trial_days?: number;
    max_users?: number | null;
    max_storage?: number | null;
    [key: string]: any;
  };
  is_public?: boolean;
  display_order?: number;
}

export interface UpdatePackageRequest {
  code?: string;
  name?: string;
  description?: string;
  price_amount?: number;
  currency_code?: string;
  billing_cycle?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME' | 'ONE_TIME' | 'CUSTOM';
  entitlements_config?: Record<string, any>;
  features?: {
    trial_days?: number;
    max_users?: number | null;
    max_storage?: number | null;
    [key: string]: any;
  };
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  is_public?: boolean;
  display_order?: number;
  version: number;
}

export interface PackageFilters extends BaseFilters {
  tenant_id?: string;
  saas_product_id?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  is_public?: boolean;
}

export interface PackageStats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  public: number;
  private: number;
  by_status: Record<string, number>;
  total_revenue: number;
}

// ==================== ADAPTER ====================

// Create custom adapter with field mapping for service_packages table
const adapter = new ServicePackagesAdapter<Package, CreatePackageRequest, UpdatePackageRequest>(
  'service_packages',
  true, // supports soft delete
  {
    // API field -> DB field mapping
    'code': 'package_code',
    'name': 'package_name',
    'price_amount': 'price',
    'currency_code': 'currency',
    'saas_product_id': 'product_id',
    'entitlements_config': 'features_config',
    'features': 'limits_config',
    // status <-> is_active conversion handled by ServicePackagesAdapter
  }
);

// ==================== API CLIENT ====================

export const packagesApi = {
  getAll: async (filters?: PackageFilters): Promise<Package[]> => {
    return adapter.getAll(filters);
  },

  getById: async (id: string): Promise<Package> => {
    return adapter.getById(id);
  },

  create: async (data: CreatePackageRequest): Promise<Package> => {
    return adapter.create(data);
  },

  update: async (id: string, data: UpdatePackageRequest): Promise<Package> => {
    return adapter.update(id, data);
  },

  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  getStats: async (): Promise<PackageStats> => {
    // Calculate stats from all packages instead of calling non-existent endpoint
    const packages = await adapter.getAll();
    
    const total = packages.length;
    const active = packages.filter(p => p.status === 'ACTIVE').length;
    const inactive = packages.filter(p => p.status === 'INACTIVE').length;
    const archived = packages.filter(p => p.status === 'ARCHIVED').length;
    const publicPackages = packages.filter(p => p.is_public).length;
    const privatePackages = packages.filter(p => !p.is_public).length;
    
    // Calculate by_status
    const by_status: Record<string, number> = {
      ACTIVE: active,
      INACTIVE: inactive,
      ARCHIVED: archived,
    };
    
    // Calculate total revenue (sum of all active package prices)
    const total_revenue = packages
      .filter(p => p.status === 'ACTIVE')
      .reduce((sum, p) => sum + (p.price_amount || 0), 0);
    
    return {
      total,
      active,
      inactive,
      archived,
      public: publicPackages,
      private: privatePackages,
      by_status,
      total_revenue,
    };
  },

  /**
   * Clone service package
   * TODO (Golang): Implement /packages/:id/clone endpoint
   */
  clone: async (sourceId: string, newCode: string): Promise<Package> => {
    const response = await fetch(`/api/service-packages/${sourceId}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode }),
    });
    if (!response.ok) throw new Error('Failed to clone package');
    return response.json();
  },
};

export default packagesApi;
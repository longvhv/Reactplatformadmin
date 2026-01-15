/**
 * Digital Assets API Client
 * Manages digital assets like domains, SSL certificates, licenses
 * Uses Adapter pattern - Ready for Golang migration
 */

import { useState, useEffect } from 'react';
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type AssetType = 'DOMAIN' | 'SSL' | 'LICENSE_KEY';
export type AssetStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED';

export interface DigitalAsset {
  // I. ĐỊNH DANH & TENANCY
  _id: string;
  tenant_id: string;
  order_id: string;
  
  // II. THÔNG TIN TÀI SẢN
  asset_type: AssetType;
  name: string; // VD: 'example.com', 'SSL-2024-001'
  
  // III. TRẠNG THÁI VÀ LIFECYCLE
  status: AssetStatus;
  provider_metadata: Record<string, any>; // Thông tin từ nhà cung cấp (GoDaddy, Let's Encrypt)
  
  // IV. THỜI GIAN
  activated_at: string | null;
  expires_at: string | null; // Ngày hết hạn
  created_at: string;
  updated_at?: string;
}

export interface DigitalAssetWithDetails extends DigitalAsset {
  tenant_name?: string;
  order_number?: string;
}

export interface CreateDigitalAssetRequest {
  tenant_id: string;
  order_id: string;
  asset_type: AssetType;
  name: string;
  status?: AssetStatus;
  provider_metadata?: Record<string, any>;
  activated_at?: string;
  expires_at?: string;
}

export interface UpdateDigitalAssetRequest {
  name?: string;
  status?: AssetStatus;
  provider_metadata?: Record<string, any>;
  activated_at?: string;
  expires_at?: string;
}

export interface DigitalAssetFilters extends BaseFilters {
  tenant_id?: string;
  order_id?: string;
  asset_type?: AssetType;
  status?: AssetStatus;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<DigitalAsset, CreateDigitalAssetRequest, UpdateDigitalAssetRequest>(
  'tenant_digital_assets',
  '/digital-assets'
);

// ==================== API CLIENT ====================

export const digitalAssetsApi = {
  /**
   * GET /digital-assets
   */
  getAll: async (filters?: DigitalAssetFilters): Promise<DigitalAsset[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /digital-assets/:id with joined data
   */
  getById: async (id: string): Promise<DigitalAssetWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get asset
    const { data: asset, error: assetError } = await supabase
      .from('tenant_digital_assets')
      .select('*')
      .eq('_id', id)
      .single();

    if (assetError || !asset) {
      throw new Error(`Digital asset not found: ${assetError?.message || 'Unknown error'}`);
    }

    // Get tenant name
    let tenant_name: string | undefined;
    if (asset.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('_id', asset.tenant_id)
        .single();
      tenant_name = tenant?.name;
    }

    // Get order number
    let order_number: string | undefined;
    if (asset.order_id) {
      const { data: order } = await supabase
        .from('subscription_orders')
        .select('order_number')
        .eq('_id', asset.order_id)
        .single();
      order_number = order?.order_number;
    }

    return {
      ...asset,
      tenant_name,
      order_number,
    } as DigitalAssetWithDetails;
  },

  /**
   * POST /digital-assets
   */
  create: async (data: CreateDigitalAssetRequest): Promise<DigitalAsset> => {
    return adapter.create(data);
  },

  /**
   * PATCH /digital-assets/:id
   */
  update: async (id: string, data: UpdateDigitalAssetRequest): Promise<DigitalAsset> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /digital-assets/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /digital-assets/:id/activate
   * Activate a digital asset
   */
  activate: async (id: string): Promise<DigitalAsset> => {
    return adapter.update(id, {
      status: 'ACTIVE',
      activated_at: new Date().toISOString(),
    });
  },

  /**
   * POST /digital-assets/:id/expire
   * Mark asset as expired
   */
  expire: async (id: string): Promise<DigitalAsset> => {
    return adapter.update(id, {
      status: 'EXPIRED',
    });
  },

  /**
   * GET /digital-assets by order
   * Get all assets for a specific order
   */
  getByOrderId: async (orderId: string): Promise<DigitalAsset[]> => {
    return adapter.getAll({ order_id: orderId });
  },

  /**
   * GET /digital-assets by tenant
   * Get all assets for a specific tenant
   */
  getByTenantId: async (tenantId: string): Promise<DigitalAsset[]> => {
    return adapter.getAll({ tenant_id: tenantId });
  },
};

// ==================== HOOKS ====================

/**
 * Hook to fetch digital asset details
 */
export function useDigitalAssetDetails(id: string | undefined) {
  const [asset, setAsset] = useState<DigitalAssetWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await digitalAssetsApi.getById(id);
      setAsset(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch digital asset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { asset, loading, error, refresh };
}

/**
 * Hook to fetch assets by order
 */
export function useDigitalAssetsByOrder(orderId: string | undefined) {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await digitalAssetsApi.getByOrderId(orderId);
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch digital assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [orderId]);

  return { assets, loading, error, refresh };
}

/**
 * Hook to fetch assets by tenant
 */
export function useDigitalAssetsByTenant(tenantId: string | undefined) {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await digitalAssetsApi.getByTenantId(tenantId);
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch digital assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [tenantId]);

  return { assets, loading, error, refresh };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get asset type label
 */
export function getAssetTypeLabel(type: AssetType): string {
  switch (type) {
    case 'DOMAIN':
      return 'Tên miền';
    case 'SSL':
      return 'Chứng chỉ SSL';
    case 'LICENSE_KEY':
      return 'Khóa bản quyền';
    default:
      return type;
  }
}

/**
 * Get asset type color
 */
export function getAssetTypeColor(type: AssetType): string {
  switch (type) {
    case 'DOMAIN':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'SSL':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'LICENSE_KEY':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get asset status label
 */
export function getAssetStatusLabel(status: AssetStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Chờ kích hoạt';
    case 'ACTIVE':
      return 'Đang hoạt động';
    case 'EXPIRED':
      return 'Đã hết hạn';
    default:
      return status;
  }
}

/**
 * Get asset status color
 */
export function getAssetStatusColor(status: AssetStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'EXPIRED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Check if asset is expiring soon (within 30 days)
 */
export function isAssetExpiringSoon(asset: DigitalAsset): boolean {
  if (!asset.expires_at || asset.status !== 'ACTIVE') return false;
  
  const expiryDate = new Date(asset.expires_at);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(asset: DigitalAsset): number | null {
  if (!asset.expires_at) return null;
  
  const expiryDate = new Date(asset.expires_at);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry;
}

export default digitalAssetsApi;

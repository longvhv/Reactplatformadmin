/**
 * Digital Assets API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Manages digital assets: domains, SSL certificates, license keys
 * 
 * CRITICAL: Fully aligned with tenant_digital_assets database schema
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type AssetType = 'DOMAIN' | 'SSL' | 'LICENSE_KEY' | 'SOFTWARE' | 'SUBSCRIPTION' | 'OTHER';
export type AssetStatus = 'PENDING' | 'PROVISIONING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'TRANSFERRING';

export const AssetTypeHelper = {
  DOMAIN: 'DOMAIN' as AssetType,
  SSL: 'SSL' as AssetType,
  LICENSE_KEY: 'LICENSE_KEY' as AssetType,
  SOFTWARE: 'SOFTWARE' as AssetType,
  SUBSCRIPTION: 'SUBSCRIPTION' as AssetType,
  OTHER: 'OTHER' as AssetType,

  isDomain: (type: AssetType) => type === 'DOMAIN',
  isSSL: (type: AssetType) => type === 'SSL',
  isLicenseKey: (type: AssetType) => type === 'LICENSE_KEY',
  isSoftware: (type: AssetType) => type === 'SOFTWARE',
  isSubscription: (type: AssetType) => type === 'SUBSCRIPTION',
};

export const AssetStatusHelper = {
  PENDING: 'PENDING' as AssetStatus,
  PROVISIONING: 'PROVISIONING' as AssetStatus,
  ACTIVE: 'ACTIVE' as AssetStatus,
  EXPIRED: 'EXPIRED' as AssetStatus,
  SUSPENDED: 'SUSPENDED' as AssetStatus,
  TRANSFERRING: 'TRANSFERRING' as AssetStatus,

  isPending: (status: AssetStatus) => status === 'PENDING',
  isProvisioning: (status: AssetStatus) => status === 'PROVISIONING',
  isActive: (status: AssetStatus) => status === 'ACTIVE',
  isExpired: (status: AssetStatus) => status === 'EXPIRED',
  isSuspended: (status: AssetStatus) => status === 'SUSPENDED',
  isTransferring: (status: AssetStatus) => status === 'TRANSFERRING',
  isOperational: (status: AssetStatus) => status === 'ACTIVE',
  needsAction: (status: AssetStatus) => status === 'PENDING' || status === 'EXPIRED' || status === 'SUSPENDED',
};

// ==================== MAIN INTERFACE ====================

export interface TenantDigitalAsset {
  // I. IDENTITY & RELATIONSHIPS
  _id: string;
  tenant_id: string;
  order_id: string | null; // Nullable - asset can exist without order

  // II. ASSET INFORMATION
  asset_type: AssetType;
  name: string; // e.g., 'example.com', 'SSL-2024-001'

  // III. STATUS & LIFECYCLE
  status: AssetStatus;
  auto_renew: boolean; // Auto-renewal enabled
  asset_metadata: Record<string, any>; // JSONB - provider info, configs, etc.

  // IV. ACTIVATION & EXPIRY
  activated_at: string | null;
  expires_at: string | null;

  // V. AUDIT TRAIL
  created_at: string;
  updated_at: string;
  version: number; // bigint for optimistic locking
}

// Alias for backward compatibility
export type DigitalAsset = TenantDigitalAsset;

export interface DigitalAssetWithDetails extends TenantDigitalAsset {
  tenant_name?: string;
  order_number?: string;
  days_until_expiry?: number | null;
  is_expiring_soon?: boolean;
}

// ==================== REQUEST INTERFACES ====================

export interface CreateAssetRequest {
  // Required
  tenant_id: string;
  asset_type: AssetType;
  name: string;

  // Optional with defaults
  status?: AssetStatus; // default: 'PENDING'
  auto_renew?: boolean; // default: true
  asset_metadata?: Record<string, any>; // default: {}
  version?: number; // default: 1

  // Optional
  order_id?: string | null;
  activated_at?: string | null;
  expires_at?: string | null;
}

export interface UpdateAssetRequest {
  name?: string;
  asset_type?: AssetType;
  status?: AssetStatus;
  auto_renew?: boolean;
  asset_metadata?: Record<string, any>;
  activated_at?: string | null;
  expires_at?: string | null;
  order_id?: string | null;
}

export interface AssetFilters extends BaseFilters {
  tenant_id?: string;
  order_id?: string;
  asset_type?: AssetType;
  status?: AssetStatus;
  auto_renew?: boolean;
  expiring_soon?: boolean; // Client-side filter
  expired?: boolean; // Client-side filter
}

// ==================== STATISTICS ====================

export interface AssetStatistics {
  total_assets: number;
  active_assets: number;
  pending_assets: number;
  expired_assets: number;
  suspended_assets: number;
  provisioning_assets: number;
  transferring_assets: number;
  assets_with_auto_renew: number;
  assets_expiring_soon: number; // Within 30 days
  assets_without_expiry: number;
  by_asset_type: Record<AssetType, number>;
  by_status: Record<AssetStatus, number>;
  avg_days_until_expiry: number | null;
}

// ==================== VALIDATION RESULT ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantDigitalAsset, CreateAssetRequest, UpdateAssetRequest>(
  'tenant_digital_assets',
  '/digital-assets',
  false // No soft delete
);

// ==================== API CLIENT ====================

export const digitalAssetsApi = {
  /**
   * GET /digital-assets
   * Fetch assets with filters
   */
  getAll: async (filters?: AssetFilters): Promise<TenantDigitalAsset[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_digital_assets')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.order_id) {
      query = query.eq('order_id', filters.order_id);
    }
    if (filters?.asset_type) {
      query = query.eq('asset_type', filters.asset_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.auto_renew !== undefined) {
      query = query.eq('auto_renew', filters.auto_renew);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch digital assets: ${error.message}`);
    }

    let assets = data || [];

    // Client-side filters
    if (filters?.expiring_soon) {
      assets = assets.filter((asset) => isAssetExpiringSoon(asset));
    }
    if (filters?.expired) {
      assets = assets.filter((asset) => isAssetExpired(asset));
    }

    return assets;
  },

  /**
   * GET /digital-assets/:id
   */
  getById: async (id: string): Promise<TenantDigitalAsset> => {
    return adapter.getById(id);
  },

  /**
   * GET /digital-assets/:id/details
   * Get asset with joined data (tenant name, order number)
   */
  getByIdWithDetails: async (id: string): Promise<DigitalAssetWithDetails> => {
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

    const days_until_expiry = getDaysUntilExpiry(asset);
    const is_expiring_soon = isAssetExpiringSoon(asset);

    return {
      ...asset,
      tenant_name,
      order_number,
      days_until_expiry,
      is_expiring_soon,
    } as DigitalAssetWithDetails;
  },

  /**
   * POST /digital-assets
   * Create new asset with validation and defaults
   */
  create: async (data: CreateAssetRequest): Promise<TenantDigitalAsset> => {
    // Validate before creation
    const validation = digitalAssetsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Apply defaults
    const requestData = {
      status: 'PENDING' as AssetStatus, // default
      auto_renew: true, // default
      asset_metadata: {}, // default
      version: 1, // default
      ...data,
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /digital-assets/:id
   * Update asset with validation
   */
  update: async (id: string, data: UpdateAssetRequest): Promise<TenantDigitalAsset> => {
    // Validate before update
    const validation = digitalAssetsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /digital-assets/:id
   * Hard delete asset
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /digital-assets/:id/activate
   * Activate asset
   */
  activate: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        status: 'ACTIVE',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to activate asset: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/suspend
   * Suspend asset
   */
  suspend: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        status: 'SUSPENDED',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to suspend asset: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/unsuspend
   * Unsuspend asset (reactivate)
   */
  unsuspend: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to unsuspend asset: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/provision
   * Start provisioning asset
   */
  provision: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        status: 'PROVISIONING',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to provision asset: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/transfer
   * Start transferring asset
   */
  transfer: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        status: 'TRANSFERRING',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to transfer asset: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/expire
   * Mark asset as expired
   */
  expire: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to expire asset: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/enable-auto-renew
   * Enable auto-renewal
   */
  enableAutoRenew: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        auto_renew: true,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to enable auto-renew: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/disable-auto-renew
   * Disable auto-renewal
   */
  disableAutoRenew: async (id: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to disable auto-renew: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /digital-assets/:id/renew
   * Renew asset (extend expiry)
   */
  renew: async (id: string, newExpiryDate: string): Promise<TenantDigitalAsset> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Validate new expiry date
    const asset = await digitalAssetsApi.getById(id);
    if (asset.activated_at && new Date(newExpiryDate) <= new Date(asset.activated_at)) {
      throw new Error('Expiry date must be after activation date');
    }

    const { data, error } = await supabase
      .from('tenant_digital_assets')
      .update({
        expires_at: newExpiryDate,
        status: 'ACTIVE', // Reactivate if expired
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to renew asset: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * GET /digital-assets/by-tenant/:tenantId
   * Get all assets for tenant
   */
  getByTenant: async (tenantId: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /digital-assets/by-order/:orderId
   * Get all assets for order
   */
  getByOrder: async (orderId: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({ order_id: orderId });
  },

  /**
   * GET /digital-assets/active/:tenantId
   * Get active assets for tenant
   */
  getActive: async (tenantId?: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({
      tenant_id: tenantId,
      status: 'ACTIVE',
    });
  },

  /**
   * GET /digital-assets/expiring
   * Get assets expiring soon (within 30 days)
   */
  getExpiringSoon: async (tenantId?: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({
      tenant_id: tenantId,
      expiring_soon: true,
    });
  },

  /**
   * GET /digital-assets/expired
   * Get expired assets
   */
  getExpired: async (tenantId?: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({
      tenant_id: tenantId,
      status: 'EXPIRED',
    });
  },

  /**
   * GET /digital-assets/suspended
   * Get suspended assets
   */
  getSuspended: async (tenantId?: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({
      tenant_id: tenantId,
      status: 'SUSPENDED',
    });
  },

  /**
   * GET /digital-assets/by-type/:type
   * Get assets by type
   */
  getByType: async (assetType: AssetType, tenantId?: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({
      tenant_id: tenantId,
      asset_type: assetType,
    });
  },

  /**
   * GET /digital-assets/auto-renew
   * Get assets with auto-renew enabled
   */
  getWithAutoRenew: async (tenantId?: string): Promise<TenantDigitalAsset[]> => {
    return digitalAssetsApi.getAll({
      tenant_id: tenantId,
      auto_renew: true,
    });
  },

  /**
   * GET /digital-assets/statistics
   * Get asset statistics
   */
  getStatistics: async (tenantId?: string): Promise<AssetStatistics> => {
    const assets = await digitalAssetsApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(assets);
  },

  /**
   * Client-side validation
   */
  validate: (data: CreateAssetRequest | UpdateAssetRequest): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate name
    if ('name' in data && data.name !== undefined) {
      if (!data.name.trim()) {
        errors.push('Tên tài sản không được để trống');
      }
    }

    // Validate asset_type
    if ('asset_type' in data && data.asset_type !== undefined) {
      const validTypes: AssetType[] = ['DOMAIN', 'SSL', 'LICENSE_KEY', 'SOFTWARE', 'SUBSCRIPTION', 'OTHER'];
      if (!validTypes.includes(data.asset_type)) {
        errors.push(`Loại tài sản không hợp lệ: ${data.asset_type}`);
      }
    }

    // Validate status
    if ('status' in data && data.status !== undefined) {
      const validStatuses: AssetStatus[] = ['PENDING', 'PROVISIONING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'TRANSFERRING'];
      if (!validStatuses.includes(data.status)) {
        errors.push(`Trạng thái không hợp lệ: ${data.status}`);
      }
    }

    // Validate expiry date logic: expires_at > activated_at
    if ('expires_at' in data && 'activated_at' in data) {
      if (data.expires_at && data.activated_at) {
        const expiryDate = new Date(data.expires_at);
        const activationDate = new Date(data.activated_at);
        if (expiryDate <= activationDate) {
          errors.push('Ngày hết hạn phải sau ngày kích hoạt');
        }
      }
    }

    // Validate version
    if ('version' in data && (data as any).version !== undefined) {
      const version = (data as any).version;
      if (typeof version === 'number' && version < 1) {
        errors.push('Version phải >= 1');
      }
    }

    // Warnings
    if ('auto_renew' in data && data.auto_renew === false && 'expires_at' in data && data.expires_at) {
      warnings.push('Tài sản sẽ hết hạn và không được gia hạn tự động');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate statistics from assets array
 */
export function calculateStatistics(assets: TenantDigitalAsset[]): AssetStatistics {
  const byStatus: Record<AssetStatus, number> = {
    PENDING: 0,
    PROVISIONING: 0,
    ACTIVE: 0,
    EXPIRED: 0,
    SUSPENDED: 0,
    TRANSFERRING: 0,
  };

  const byAssetType: Record<AssetType, number> = {
    DOMAIN: 0,
    SSL: 0,
    LICENSE_KEY: 0,
    SOFTWARE: 0,
    SUBSCRIPTION: 0,
    OTHER: 0,
  };

  let activeCount = 0;
  let pendingCount = 0;
  let expiredCount = 0;
  let suspendedCount = 0;
  let provisioningCount = 0;
  let transferringCount = 0;
  let autoRenewCount = 0;
  let expiringSoonCount = 0;
  let withoutExpiryCount = 0;
  let totalDaysUntilExpiry = 0;
  let assetsWithExpiryCount = 0;

  assets.forEach((asset) => {
    // Count by status
    byStatus[asset.status]++;
    switch (asset.status) {
      case 'ACTIVE':
        activeCount++;
        break;
      case 'PENDING':
        pendingCount++;
        break;
      case 'EXPIRED':
        expiredCount++;
        break;
      case 'SUSPENDED':
        suspendedCount++;
        break;
      case 'PROVISIONING':
        provisioningCount++;
        break;
      case 'TRANSFERRING':
        transferringCount++;
        break;
    }

    // Count by asset type
    byAssetType[asset.asset_type]++;

    // Count auto-renew
    if (asset.auto_renew) {
      autoRenewCount++;
    }

    // Count expiring soon
    if (isAssetExpiringSoon(asset)) {
      expiringSoonCount++;
    }

    // Count without expiry
    if (!asset.expires_at) {
      withoutExpiryCount++;
    } else {
      const days = getDaysUntilExpiry(asset);
      if (days !== null) {
        totalDaysUntilExpiry += days;
        assetsWithExpiryCount++;
      }
    }
  });

  const avgDaysUntilExpiry = assetsWithExpiryCount > 0 ? Math.round(totalDaysUntilExpiry / assetsWithExpiryCount) : null;

  return {
    total_assets: assets.length,
    active_assets: activeCount,
    pending_assets: pendingCount,
    expired_assets: expiredCount,
    suspended_assets: suspendedCount,
    provisioning_assets: provisioningCount,
    transferring_assets: transferringCount,
    assets_with_auto_renew: autoRenewCount,
    assets_expiring_soon: expiringSoonCount,
    assets_without_expiry: withoutExpiryCount,
    by_asset_type: byAssetType,
    by_status: byStatus,
    avg_days_until_expiry: avgDaysUntilExpiry,
  };
}

/**
 * Get asset type label
 */
export function getAssetTypeLabel(type: AssetType): string {
  const labels: Record<AssetType, string> = {
    DOMAIN: 'Tên miền',
    SSL: 'Chứng chỉ SSL',
    LICENSE_KEY: 'Khóa bản quyền',
    SOFTWARE: 'Phần mềm',
    SUBSCRIPTION: 'Gói đăng ký',
    OTHER: 'Khác',
  };
  return labels[type];
}

/**
 * Get asset type color
 */
export function getAssetTypeColor(type: AssetType): string {
  const colors: Record<AssetType, string> = {
    DOMAIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    SSL: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    LICENSE_KEY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    SOFTWARE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    SUBSCRIPTION: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[type];
}

/**
 * Get asset status label
 */
export function getAssetStatusLabel(status: AssetStatus): string {
  const labels: Record<AssetStatus, string> = {
    PENDING: 'Chờ kích hoạt',
    PROVISIONING: 'Đang cung cấp',
    ACTIVE: 'Đang hoạt động',
    EXPIRED: 'Đã hết hạn',
    SUSPENDED: 'Bị đình chỉ',
    TRANSFERRING: 'Đang chuyển đổi',
  };
  return labels[status];
}

/**
 * Get asset status color
 */
export function getAssetStatusColor(status: AssetStatus): string {
  const colors: Record<AssetStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    PROVISIONING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    TRANSFERRING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };
  return colors[status];
}

/**
 * Check if asset is expiring soon (within 30 days)
 */
export function isAssetExpiringSoon(asset: TenantDigitalAsset): boolean {
  if (!asset.expires_at || asset.status !== 'ACTIVE') return false;

  const expiryDate = new Date(asset.expires_at);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
}

/**
 * Check if asset is expired
 */
export function isAssetExpired(asset: TenantDigitalAsset): boolean {
  if (!asset.expires_at) return false;

  const expiryDate = new Date(asset.expires_at);
  const today = new Date();

  return expiryDate < today;
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(asset: TenantDigitalAsset): number | null {
  if (!asset.expires_at) return null;

  const expiryDate = new Date(asset.expires_at);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilExpiry;
}

/**
 * Format expiry status
 */
export function formatExpiryStatus(asset: TenantDigitalAsset): string {
  const days = getDaysUntilExpiry(asset);

  if (days === null) return 'Không có hạn';
  if (days < 0) return `Đã hết hạn ${Math.abs(days)} ngày`;
  if (days === 0) return 'Hết hạn hôm nay';
  if (days === 1) return 'Hết hạn ngày mai';
  if (days <= 7) return `Còn ${days} ngày`;
  if (days <= 30) return `Còn ${days} ngày (cảnh báo)`;
  return `Còn ${days} ngày`;
}

/**
 * Check if asset needs renewal
 */
export function needsRenewal(asset: TenantDigitalAsset): boolean {
  if (!asset.expires_at) return false;
  if (asset.auto_renew) return false; // Auto-renew enabled
  if (asset.status === 'EXPIRED') return true;

  const days = getDaysUntilExpiry(asset);
  return days !== null && days <= 30;
}

/**
 * Get asset health status
 */
export function getAssetHealth(asset: TenantDigitalAsset): 'healthy' | 'warning' | 'critical' | 'error' {
  if (asset.status === 'EXPIRED') return 'error';
  if (asset.status === 'SUSPENDED') return 'error';
  if (asset.status === 'PENDING') return 'warning';
  if (asset.status === 'PROVISIONING') return 'warning';
  if (asset.status === 'TRANSFERRING') return 'warning';

  // Active status - check expiry
  if (isAssetExpiringSoon(asset)) return 'warning';
  if (asset.status === 'ACTIVE') return 'healthy';

  return 'warning';
}

/**
 * Check if asset is renewable
 */
export function isRenewable(asset: TenantDigitalAsset): boolean {
  return asset.expires_at !== null && asset.status !== 'TRANSFERRING';
}

/**
 * Calculate renewal date (typically 30 days before expiry)
 */
export function calculateRenewalDate(asset: TenantDigitalAsset): Date | null {
  if (!asset.expires_at) return null;

  const expiryDate = new Date(asset.expires_at);
  const renewalDate = new Date(expiryDate);
  renewalDate.setDate(renewalDate.getDate() - 30); // 30 days before expiry

  return renewalDate;
}

export default digitalAssetsApi;

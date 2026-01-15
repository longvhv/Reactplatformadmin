/**
 * App Capability API Client
 * Handles application features and limits management
 * 
 * Architecture:
 * - Uses Adapter pattern for data source abstraction
 * - Supports Supabase (current) and Golang API (future)
 * - Switch between backends via API_MODE config
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type CapabilityType = 'FEATURE' | 'LIMIT';
export type CapabilityStatus = 'active' | 'inactive' | 'archived';

export interface DefaultValue {
  enabled?: boolean;
  value?: number;
  unit?: string;
}

export interface AppCapability {
  _id: string;
  tenant_id: string;
  app_id: string;
  code: string;
  name: string;
  description?: string;
  type: CapabilityType;
  default_value: DefaultValue;
  display_order: number;
  is_required: boolean;
  validation_rules: Record<string, any>;
  status: CapabilityStatus;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version: number;
}

export interface CreateCapabilityRequest {
  tenant_id: string;
  app_id: string;
  code: string;
  name: string;
  description?: string;
  type: CapabilityType;
  default_value: DefaultValue;
  display_order: number;
  is_required: boolean;
  validation_rules: Record<string, any>;
  status: CapabilityStatus;
  metadata: Record<string, any>;
}

export interface UpdateCapabilityRequest {
  code?: string;
  name?: string;
  description?: string;
  type?: CapabilityType;
  default_value?: DefaultValue;
  display_order?: number;
  is_required?: boolean;
  validation_rules?: Record<string, any>;
  status?: CapabilityStatus;
  metadata?: Record<string, any>;
  version: number;
}

export interface CapabilityFilters extends BaseFilters {
  tenant_id?: string;
  app_id?: string;
  type?: CapabilityType;
  status?: CapabilityStatus;
}

export interface CapabilityStatistics {
  total: number;
  features: number;
  limits: number;
  active: number;
  inactive: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<AppCapability, CreateCapabilityRequest, UpdateCapabilityRequest>(
  'app_capabilities',
  '/app-capabilities'
);

// ==================== API CLIENT ====================

export const appCapabilityApi = {
  /**
   * GET /app-capabilities
   * List all capabilities with filters
   */
  getAll: async (filters?: CapabilityFilters): Promise<AppCapability[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /app-capabilities/:id
   * Get capability by ID
   */
  getById: async (id: string): Promise<AppCapability> => {
    return adapter.getById(id);
  },

  /**
   * POST /app-capabilities
   * Create new capability
   */
  create: async (data: CreateCapabilityRequest): Promise<AppCapability> => {
    return adapter.create(data);
  },

  /**
   * PATCH /app-capabilities/:id
   * Update capability
   */
  update: async (id: string, data: UpdateCapabilityRequest): Promise<AppCapability> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /app-capabilities/:id
   * Soft delete capability
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /app-capabilities?app_id={appId}
   * Get capabilities by application
   */
  getByAppId: async (app_id: string, tenant_id?: string): Promise<AppCapability[]> => {
    return adapter.getAll({ app_id, tenant_id, order_by: 'display_order' });
  },

  /**
   * GET /app-capabilities?type=FEATURE
   * Get features only
   */
  getFeatures: async (app_id: string, tenant_id?: string): Promise<AppCapability[]> => {
    return adapter.getAll({ app_id, tenant_id, type: 'FEATURE' });
  },

  /**
   * GET /app-capabilities?type=LIMIT
   * Get limits only
   */
  getLimits: async (app_id: string, tenant_id?: string): Promise<AppCapability[]> => {
    return adapter.getAll({ app_id, tenant_id, type: 'LIMIT' });
  },

  /**
   * Get capability by code
   * TODO (Golang): GET /app-capabilities/by-code/:code?app_id=&tenant_id=
   */
  getByCode: async (code: string, app_id: string, tenant_id: string): Promise<AppCapability | null> => {
    throw new Error('Not implemented - migrate to Golang endpoint');
  },

  /**
   * Change capability status
   * Business logic method
   */
  changeStatus: async (id: string, status: CapabilityStatus, version: number): Promise<AppCapability> => {
    return adapter.update(id, { status, version });
  },

  /**
   * Update display order
   * Business logic method
   */
  updateDisplayOrder: async (id: string, display_order: number, version: number): Promise<AppCapability> => {
    return adapter.update(id, { display_order, version });
  },

  /**
   * Bulk update display orders
   * Business logic method
   */
  bulkUpdateDisplayOrder: async (items: Array<{ id: string; order: number; version: number }>): Promise<void> => {
    const promises = items.map(item =>
      adapter.update(item.id, { display_order: item.order, version: item.version })
    );
    await Promise.all(promises);
  },

  /**
   * Check if code exists
   * TODO (Golang): GET /app-capabilities/exists/:code?app_id=&tenant_id=
   */
  codeExists: async (code: string, app_id: string, tenant_id: string, excludeId?: string): Promise<boolean> => {
    throw new Error('Not implemented - migrate to Golang endpoint');
  },

  /**
   * Get statistics
   * TODO (Golang): GET /app-capabilities/statistics?app_id=&tenant_id=
   */
  getStatistics: async (app_id: string, tenant_id?: string): Promise<CapabilityStatistics> => {
    throw new Error('Not implemented - migrate to Golang endpoint');
  },

  /**
   * Clone capabilities from one app to another
   * Business logic method
   */
  cloneFromApp: async (sourceAppId: string, targetAppId: string, tenant_id: string): Promise<AppCapability[]> => {
    const sourceCapabilities = await appCapabilityApi.getByAppId(sourceAppId, tenant_id);

    const promises = sourceCapabilities.map(cap => {
      const { _id, created_at, updated_at, version, app_id, ...capData } = cap;
      return adapter.create({
        ...capData,
        app_id: targetAppId,
        tenant_id,
      } as CreateCapabilityRequest);
    });

    return Promise.all(promises);
  },
};

export default appCapabilityApi;
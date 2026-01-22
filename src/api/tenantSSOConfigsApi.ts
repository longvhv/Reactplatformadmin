/**
 * Tenant SSO Configs API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Complete implementation
 * Database: tenant_sso_configs (27 fields, soft delete, versioning)
 */

import { createAdapter, BaseFilters } from './adapters';
import { getSupabaseClient } from '../lib/supabase';

// ==================== TYPES ====================

export type SSOProvider = 'SAML' | 'OAUTH2' | 'OIDC' | 'LDAP' | 'CAS' | 'OTHER';
export type SSOConfigStatus = 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'DEPRECATED';

export const SSOProviderHelper = {
  SAML: 'SAML' as SSOProvider,
  OAUTH2: 'OAUTH2' as SSOProvider,
  OIDC: 'OIDC' as SSOProvider,
  LDAP: 'LDAP' as SSOProvider,
  CAS: 'CAS' as SSOProvider,
  OTHER: 'OTHER' as SSOProvider,

  isSAML: (provider: SSOProvider) => provider === 'SAML',
  isOAuth2: (provider: SSOProvider) => provider === 'OAUTH2',
  isOIDC: (provider: SSOProvider) => provider === 'OIDC',
  isLDAP: (provider: SSOProvider) => provider === 'LDAP',
  isCAS: (provider: SSOProvider) => provider === 'CAS',
  isOther: (provider: SSOProvider) => provider === 'OTHER',
  isFederated: (provider: SSOProvider) => provider === 'SAML' || provider === 'OAUTH2' || provider === 'OIDC',
};

export const SSOConfigStatusHelper = {
  ACTIVE: 'ACTIVE' as SSOConfigStatus,
  INACTIVE: 'INACTIVE' as SSOConfigStatus,
  TESTING: 'TESTING' as SSOConfigStatus,
  DEPRECATED: 'DEPRECATED' as SSOConfigStatus,

  isActive: (status: SSOConfigStatus) => status === 'ACTIVE',
  isInactive: (status: SSOConfigStatus) => status === 'INACTIVE',
  isTesting: (status: SSOConfigStatus) => status === 'TESTING',
  isDeprecated: (status: SSOConfigStatus) => status === 'DEPRECATED',
  isUsable: (status: SSOConfigStatus) => status === 'ACTIVE' || status === 'TESTING',
  isDisabled: (status: SSOConfigStatus) => status === 'INACTIVE' || status === 'DEPRECATED',
};

/**
 * Attribute Mapping - Maps SSO attributes to user fields
 */
export interface AttributeMapping {
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  phone?: string;
  employee_id?: string;
  department?: string;
  role?: string;
  [key: string]: string | undefined;
}

/**
 * SSO Settings - Provider-specific configuration
 */
export interface SSOSettings {
  // SAML settings
  sign_requests?: boolean;
  encrypt_assertions?: boolean;
  want_assertions_signed?: boolean;
  want_response_signed?: boolean;
  name_id_format?: string;

  // OAuth2/OIDC settings
  response_type?: string;
  grant_type?: string;
  token_auth_method?: string;
  pkce_enabled?: boolean;
  state_parameter?: boolean;
  nonce_parameter?: boolean;

  // LDAP settings
  ldap_host?: string;
  ldap_port?: number;
  ldap_base_dn?: string;
  ldap_bind_dn?: string;
  ldap_filter?: string;
  ldap_use_ssl?: boolean;

  // General settings
  auto_provision?: boolean;
  update_on_login?: boolean;
  default_role?: string;
  allowed_domains?: string[];

  [key: string]: any;
}

// ==================== MAIN INTERFACE ====================

/**
 * TenantSSOConfig - 100% matches tenant_sso_configs table (27 fields)
 */
export interface TenantSSOConfig {
  // I. IDENTITY (2)
  _id: string;
  tenant_id: string; // FK to tenants, CASCADE

  // II. BASIC INFO (4)
  provider: SSOProvider; // varchar(50), 6 values
  name: string; // varchar(255), NOT NULL
  description: string | null; // text
  status: SSOConfigStatus; // varchar(20), 4 values, default 'ACTIVE'

  // III. SAML-SPECIFIC (5)
  entity_id: string | null; // varchar(500)
  sso_url: string | null; // text
  slo_url: string | null; // text
  certificate: string | null; // text - X.509 certificate
  metadata_url: string | null; // text

  // IV. OAUTH2/OIDC-SPECIFIC (6)
  client_id: string | null; // varchar(255)
  client_secret: string | null; // text - encrypted
  authorization_endpoint: string | null; // text
  token_endpoint: string | null; // text
  userinfo_endpoint: string | null; // text
  jwks_uri: string | null; // text

  // V. CONFIGURATION (3)
  scopes: string[]; // jsonb, default '[]'
  attribute_mapping: AttributeMapping; // jsonb, default '{}'
  settings: SSOSettings; // jsonb, default '{}'

  // VI. AUDIT TRAIL (7)
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null; // Soft delete
  deleted_by: string | null;
  version: number; // integer, default 1
}

export interface TenantSSOConfigWithDetails extends TenantSSOConfig {
  // Joined from tenant
  tenant_name?: string;

  // Computed fields
  is_configured?: boolean; // Has all required fields for provider
  is_deleted?: boolean; // deleted_at !== null
  has_scopes?: boolean; // scopes.length > 0
  has_attribute_mapping?: boolean; // Object.keys(attribute_mapping).length > 0
  has_custom_settings?: boolean; // Object.keys(settings).length > 0
  provider_label?: string;
  status_label?: string;
  days_since_created?: number;
  days_since_updated?: number;
}

// ==================== REQUEST INTERFACES ====================

export interface CreateSSOConfigRequest {
  // Required
  tenant_id: string;
  provider: SSOProvider;
  name: string;

  // Optional with defaults
  status?: SSOConfigStatus; // default: 'ACTIVE'
  scopes?: string[]; // default: []
  attribute_mapping?: AttributeMapping; // default: {}
  settings?: SSOSettings; // default: {}
  version?: number; // default: 1

  // Optional
  description?: string | null;

  // SAML fields
  entity_id?: string | null;
  sso_url?: string | null;
  slo_url?: string | null;
  certificate?: string | null;
  metadata_url?: string | null;

  // OAuth2/OIDC fields
  client_id?: string | null;
  client_secret?: string | null;
  authorization_endpoint?: string | null;
  token_endpoint?: string | null;
  userinfo_endpoint?: string | null;
  jwks_uri?: string | null;

  created_by?: string | null;
}

export interface UpdateSSOConfigRequest {
  provider?: SSOProvider;
  name?: string;
  description?: string | null;
  status?: SSOConfigStatus;

  // SAML fields
  entity_id?: string | null;
  sso_url?: string | null;
  slo_url?: string | null;
  certificate?: string | null;
  metadata_url?: string | null;

  // OAuth2/OIDC fields
  client_id?: string | null;
  client_secret?: string | null;
  authorization_endpoint?: string | null;
  token_endpoint?: string | null;
  userinfo_endpoint?: string | null;
  jwks_uri?: string | null;

  // Configuration
  scopes?: string[];
  attribute_mapping?: AttributeMapping;
  settings?: SSOSettings;

  updated_by?: string | null;
  version?: number;
}

export interface SSOConfigFilters extends BaseFilters {
  tenant_id?: string;
  provider?: SSOProvider;
  status?: SSOConfigStatus;
  has_scopes?: boolean;
  has_attribute_mapping?: boolean;
  search?: string;
}

// ==================== STATISTICS ====================

export interface SSOConfigStatistics {
  total_configs: number;
  active_configs: number;
  inactive_configs: number;
  testing_configs: number;
  deprecated_configs: number;
  deleted_configs: number;
  by_provider: Record<SSOProvider, number>;
  by_status: Record<SSOConfigStatus, number>;
  with_scopes: number;
  with_attribute_mapping: number;
  with_custom_settings: number;
  average_scopes_count: number | null;
  fully_configured: number; // Has all required fields
}

// ==================== TESTING & VALIDATION ====================

export interface SSOConfigTestResult {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

// Removed adapter in favor of direct Supabase calls for strict schema compliance and versioning

// ==================== API CLIENT ====================

export const tenantSSOConfigsApi = {
  /**
   * GET /tenant-sso-configs
   */
  getAll: async (filters?: SSOConfigFilters): Promise<TenantSSOConfig[]> => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('tenant_sso_configs')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.provider) query = query.eq('provider', filters.provider);
    if (filters?.status) query = query.eq('status', filters.status);

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch SSO configs: ${error.message}`);
    }

    let configs = data || [];

    // Client-side filters
    if (filters?.has_scopes) {
      configs = configs.filter((c) => Array.isArray(c.scopes) && c.scopes.length > 0);
    }
    if (filters?.has_attribute_mapping) {
      configs = configs.filter((c) => c.attribute_mapping && Object.keys(c.attribute_mapping).length > 0);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      configs = configs.filter(
        (c) => c.name.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search)
      );
    }

    return configs;
  },

  /**
   * GET /tenant-sso-configs/:id
   */
  getById: async (id: string): Promise<TenantSSOConfig> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tenant_sso_configs')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch SSO config: ${error.message}`);
    }
    return data;
  },

  /**
   * GET /tenant-sso-configs/:id/details
   */
  getByIdWithDetails: async (id: string): Promise<TenantSSOConfigWithDetails> => {
    const supabase = getSupabaseClient();

    // Get config
    const config = await tenantSSOConfigsApi.getById(id);

    // Get tenant name
    let tenant_name: string | undefined;
    if (config.tenant_id) {
      const { data: tenant } = await supabase.from('tenants').select('name').eq('_id', config.tenant_id).single();
      tenant_name = tenant?.name;
    }

    // Compute fields
    const is_configured = isConfigured(config);
    const is_deleted = config.deleted_at !== null;
    const has_scopes = Array.isArray(config.scopes) && config.scopes.length > 0;
    const has_attribute_mapping = Object.keys(config.attribute_mapping || {}).length > 0;
    const has_custom_settings = Object.keys(config.settings || {}).length > 0;
    const provider_label = getProviderLabel(config.provider);
    const status_label = getStatusLabel(config.status);

    const now = new Date();
    const created = new Date(config.created_at);
    const updated = new Date(config.updated_at);
    const days_since_created = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const days_since_updated = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...config,
      tenant_name,
      is_configured,
      is_deleted,
      has_scopes,
      has_attribute_mapping,
      has_custom_settings,
      provider_label,
      status_label,
      days_since_created,
      days_since_updated,
    } as TenantSSOConfigWithDetails;
  },

  /**
   * POST /tenant-sso-configs
   */
  create: async (data: CreateSSOConfigRequest): Promise<TenantSSOConfig> => {
    const supabase = getSupabaseClient();
    
    // Validate
    const validation = tenantSSOConfigsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const _id = crypto.randomUUID();
    const now = new Date().toISOString();

    const requestData = {
      _id,
      ...data,
      status: data.status || 'ACTIVE',
      scopes: data.scopes || [],
      attribute_mapping: data.attribute_mapping || {},
      settings: data.settings || {},
      version: 1,
      created_at: now,
      updated_at: now,
      created_by: data.created_by || null,
      updated_by: data.created_by || null, // Initial creator is also updater
    };

    const { data: created, error } = await supabase
      .from('tenant_sso_configs')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create SSO config: ${error.message}`);
    }

    return created;
  },

  /**
   * PUT /tenant-sso-configs/:id
   */
  update: async (id: string, data: UpdateSSOConfigRequest): Promise<TenantSSOConfig> => {
    const supabase = getSupabaseClient();

    // Validate
    const validation = tenantSSOConfigsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Determine version for optimistic locking
    let currentVersion = data.version;

    if (currentVersion === undefined) {
      // If version not provided, fetch current (fallback, effectively disables UI-side staleness check but handles concurrency during this function)
      const { data: current, error: fetchError } = await supabase
        .from('tenant_sso_configs')
        .select('version')
        .eq('_id', id)
        .single();

      if (fetchError || !current) {
        throw new Error('Config not found or access denied');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    // Remove version from data to avoid sending it as a field to update (if it was just for check)
    // The DB update needs 'version' to be set to nextVersion.
    const { version, ...restData } = data;

    const updateData = {
      ...restData,
      updated_at: now,
      version: nextVersion,
    };

    const { data: updated, error } = await supabase
      .from('tenant_sso_configs')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion) // Optimistic locking
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update SSO config: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }

    return updated;
  },

  /**
   * DELETE /tenant-sso-configs/:id (Soft delete)
   */
  delete: async (id: string, deletedBy?: string, version?: number): Promise<void> => {
    const supabase = getSupabaseClient();

    let currentVersion = version;

    if (currentVersion === undefined) {
      // Get current version if not provided (fallback)
      const { data: current, error: fetchError } = await supabase
        .from('tenant_sso_configs')
        .select('version')
        .eq('_id', id)
        .single();

      if (fetchError || !current) {
         // If not found, it might already be deleted
         throw new Error('Config not found or access denied');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;

    const { error } = await supabase
      .from('tenant_sso_configs')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
        status: 'INACTIVE',
        updated_at: new Date().toISOString(),
        version: nextVersion,
      })
      .eq('_id', id)
      .eq('version', currentVersion);

    if (error) {
      throw new Error(`Failed to delete SSO config: ${error.message}`);
    }
  },

  /**
   * GET /tenant-sso-configs/by-tenant/:tenantId
   */
  getByTenant: async (tenantId: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-sso-configs/by-provider/:provider
   */
  getByProvider: async (provider: SSOProvider, tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getAll({
      provider,
      tenant_id: tenantId,
    });
  },

  /**
   * GET /tenant-sso-configs/active
   */
  getActive: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getAll({
      tenant_id: tenantId,
      status: 'ACTIVE',
    });
  },

  /**
   * GET /tenant-sso-configs/inactive
   */
  getInactive: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getAll({
      tenant_id: tenantId,
      status: 'INACTIVE',
    });
  },

  /**
   * GET /tenant-sso-configs/testing
   */
  getTesting: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getAll({
      tenant_id: tenantId,
      status: 'TESTING',
    });
  },

  /**
   * GET /tenant-sso-configs/deprecated
   */
  getDeprecated: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getAll({
      tenant_id: tenantId,
      status: 'DEPRECATED',
    });
  },

  /**
   * GET /tenant-sso-configs/saml
   */
  getBySAML: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getByProvider('SAML', tenantId);
  },

  /**
   * GET /tenant-sso-configs/oauth2
   */
  getByOAuth2: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getByProvider('OAUTH2', tenantId);
  },

  /**
   * GET /tenant-sso-configs/oidc
   */
  getByOIDC: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getByProvider('OIDC', tenantId);
  },

  /**
   * GET /tenant-sso-configs/ldap
   */
  getByLDAP: async (tenantId?: string): Promise<TenantSSOConfig[]> => {
    return tenantSSOConfigsApi.getByProvider('LDAP', tenantId);
  },

  /**
   * PUT /tenant-sso-configs/:id/activate
   */
  activate: async (id: string, updatedBy?: string): Promise<TenantSSOConfig> => {
    return tenantSSOConfigsApi.update(id, {
      status: 'ACTIVE',
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-sso-configs/:id/deactivate
   */
  deactivate: async (id: string, updatedBy?: string): Promise<TenantSSOConfig> => {
    return tenantSSOConfigsApi.update(id, {
      status: 'INACTIVE',
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-sso-configs/:id/set-testing
   */
  setTesting: async (id: string, updatedBy?: string): Promise<TenantSSOConfig> => {
    return tenantSSOConfigsApi.update(id, {
      status: 'TESTING',
      updated_by: updatedBy || null,
    });
  },

  /**
   * PUT /tenant-sso-configs/:id/deprecate
   */
  deprecate: async (id: string, updatedBy?: string): Promise<TenantSSOConfig> => {
    return tenantSSOConfigsApi.update(id, {
      status: 'DEPRECATED',
      updated_by: updatedBy || null,
    });
  },

  /**
   * POST /tenant-sso-configs/:id/test
   */
  testConfig: async (id: string): Promise<SSOConfigTestResult> => {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/tenant-sso-configs/${id}/test`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to test SSO configuration');
    }

    return response.json();
  },

  /**
   * POST /tenant-sso-configs/:id/clone
   */
  clone: async (id: string, newName: string, createdBy?: string): Promise<TenantSSOConfig> => {
    const original = await tenantSSOConfigsApi.getById(id);

    return tenantSSOConfigsApi.create({
      tenant_id: original.tenant_id,
      provider: original.provider,
      name: newName,
      description: original.description ? `${original.description} (Cloned)` : null,
      status: 'TESTING', // Start clones in testing mode
      entity_id: original.entity_id,
      sso_url: original.sso_url,
      slo_url: original.slo_url,
      certificate: original.certificate,
      metadata_url: original.metadata_url,
      client_id: original.client_id,
      client_secret: original.client_secret,
      authorization_endpoint: original.authorization_endpoint,
      token_endpoint: original.token_endpoint,
      userinfo_endpoint: original.userinfo_endpoint,
      jwks_uri: original.jwks_uri,
      scopes: original.scopes,
      attribute_mapping: original.attribute_mapping,
      settings: original.settings,
      created_by: createdBy || null,
    });
  },

  /**
   * POST /tenant-sso-configs/:id/rotate-secret
   */
  rotateClientSecret: async (id: string, newSecret: string, updatedBy?: string): Promise<TenantSSOConfig> => {
    const config = await tenantSSOConfigsApi.getById(id);

    if (!SSOProviderHelper.isOAuth2(config.provider) && !SSOProviderHelper.isOIDC(config.provider)) {
      throw new Error('Can only rotate client secret for OAuth2/OIDC providers');
    }

    return tenantSSOConfigsApi.update(id, {
      client_secret: newSecret,
      updated_by: updatedBy || null,
    });
  },

  /**
   * POST /tenant-sso-configs/:id/rotate-certificate
   */
  rotateCertificate: async (id: string, newCertificate: string, updatedBy?: string): Promise<TenantSSOConfig> => {
    const config = await tenantSSOConfigsApi.getById(id);

    if (!SSOProviderHelper.isSAML(config.provider)) {
      throw new Error('Can only rotate certificate for SAML providers');
    }

    return tenantSSOConfigsApi.update(id, {
      certificate: newCertificate,
      updated_by: updatedBy || null,
    });
  },

  /**
   * GET /tenant-sso-configs/:id/export-metadata
   */
  exportMetadata: async (id: string): Promise<string> => {
    const config = await tenantSSOConfigsApi.getById(id);

    if (SSOProviderHelper.isSAML(config.provider)) {
      return buildSAMLMetadata(config);
    }

    // For OAuth2/OIDC, export as JSON
    return JSON.stringify(
      {
        provider: config.provider,
        client_id: config.client_id,
        authorization_endpoint: config.authorization_endpoint,
        token_endpoint: config.token_endpoint,
        userinfo_endpoint: config.userinfo_endpoint,
        jwks_uri: config.jwks_uri,
        scopes: config.scopes,
      },
      null,
      2
    );
  },

  /**
   * GET /tenant-sso-configs/statistics
   */
  getStatistics: async (tenantId?: string): Promise<SSOConfigStatistics> => {
    const configs = await tenantSSOConfigsApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(configs);
  },

  /**
   * Bulk operations
   */
  bulkActivate: async (ids: string[], updatedBy?: string): Promise<void> => {
    await Promise.all(ids.map((id) => tenantSSOConfigsApi.activate(id, updatedBy)));
  },

  bulkDeactivate: async (ids: string[], updatedBy?: string): Promise<void> => {
    await Promise.all(ids.map((id) => tenantSSOConfigsApi.deactivate(id, updatedBy)));
  },

  bulkDelete: async (ids: string[], deletedBy?: string): Promise<void> => {
    await Promise.all(ids.map((id) => tenantSSOConfigsApi.delete(id, deletedBy)));
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateSSOConfigRequest | UpdateSSOConfigRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields (create only)
    if ('tenant_id' in data && !data.tenant_id) {
      errors.push('Tenant ID không được để trống');
    }
    if ('provider' in data && !data.provider) {
      errors.push('Provider không được để trống');
    }
    if ('name' in data && !data.name) {
      errors.push('Tên cấu hình không được để trống');
    }

    // Provider-specific validation
    if ('provider' in data && data.provider) {
      const providerErrors = validateProviderFields(data.provider, data as any);
      errors.push(...providerErrors);
    }

    // Validate scopes
    if ('scopes' in data && data.scopes) {
      if (!validateScopes(data.scopes)) {
        errors.push('Scopes phải là mảng các chuỗi không rỗng');
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
    if ('status' in data && data.status === 'DEPRECATED') {
      warnings.push('Config đang được đánh dấu là deprecated');
    }
    if ('client_secret' in data && data.client_secret && data.client_secret.length < 32) {
      warnings.push('Client secret nên có ít nhất 32 ký tự để đảm bảo bảo mật');
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
 * Calculate statistics
 */
export function calculateStatistics(configs: TenantSSOConfig[]): SSOConfigStatistics {
  const byProvider: Record<SSOProvider, number> = {
    SAML: 0,
    OAUTH2: 0,
    OIDC: 0,
    LDAP: 0,
    CAS: 0,
    OTHER: 0,
  };

  const byStatus: Record<SSOConfigStatus, number> = {
    ACTIVE: 0,
    INACTIVE: 0,
    TESTING: 0,
    DEPRECATED: 0,
  };

  let activeCount = 0;
  let inactiveCount = 0;
  let testingCount = 0;
  let deprecatedCount = 0;
  let deletedCount = 0;
  let withScopes = 0;
  let withAttributeMapping = 0;
  let withCustomSettings = 0;
  let totalScopesCount = 0;
  let configsWithScopes = 0;
  let fullyConfigured = 0;

  configs.forEach((config) => {
    // Count by provider
    byProvider[config.provider]++;

    // Count by status
    byStatus[config.status]++;

    switch (config.status) {
      case 'ACTIVE':
        activeCount++;
        break;
      case 'INACTIVE':
        inactiveCount++;
        break;
      case 'TESTING':
        testingCount++;
        break;
      case 'DEPRECATED':
        deprecatedCount++;
        break;
    }

    // Count deleted
    if (config.deleted_at) {
      deletedCount++;
    }

    // Count with scopes
    if (Array.isArray(config.scopes) && config.scopes.length > 0) {
      withScopes++;
      totalScopesCount += config.scopes.length;
      configsWithScopes++;
    }

    // Count with attribute mapping
    if (config.attribute_mapping && Object.keys(config.attribute_mapping).length > 0) {
      withAttributeMapping++;
    }

    // Count with custom settings
    if (config.settings && Object.keys(config.settings).length > 0) {
      withCustomSettings++;
    }

    // Count fully configured
    if (isConfigured(config)) {
      fullyConfigured++;
    }
  });

  const avgScopesCount = configsWithScopes > 0 ? totalScopesCount / configsWithScopes : null;

  return {
    total_configs: configs.length,
    active_configs: activeCount,
    inactive_configs: inactiveCount,
    testing_configs: testingCount,
    deprecated_configs: deprecatedCount,
    deleted_configs: deletedCount,
    by_provider: byProvider,
    by_status: byStatus,
    with_scopes: withScopes,
    with_attribute_mapping: withAttributeMapping,
    with_custom_settings: withCustomSettings,
    average_scopes_count: avgScopesCount,
    fully_configured: fullyConfigured,
  };
}

/**
 * Validate provider-specific required fields
 */
function validateProviderFields(provider: SSOProvider, data: Partial<CreateSSOConfigRequest>): string[] {
  const errors: string[] = [];

  switch (provider) {
    case 'SAML':
      if (!data.entity_id) errors.push('Entity ID là bắt buộc cho SAML');
      if (!data.sso_url) errors.push('SSO URL là bắt buộc cho SAML');
      break;

    case 'OAUTH2':
    case 'OIDC':
      if (!data.client_id) errors.push('Client ID là bắt buộc cho OAuth2/OIDC');
      if (!data.authorization_endpoint) errors.push('Authorization endpoint là bắt buộc cho OAuth2/OIDC');
      if (!data.token_endpoint) errors.push('Token endpoint là bắt buộc cho OAuth2/OIDC');
      break;

    case 'LDAP':
      if (!data.settings?.ldap_host) errors.push('LDAP host là bắt buộc trong settings');
      if (!data.settings?.ldap_base_dn) errors.push('LDAP base DN là bắt buộc trong settings');
      break;

    case 'CAS':
      if (!data.sso_url) errors.push('SSO URL là bắt buộc cho CAS');
      break;

    case 'OTHER':
      // No specific validation
      break;
  }

  return errors;
}

/**
 * Check if config has all required fields for its provider
 */
export function isConfigured(config: TenantSSOConfig): boolean {
  const errors = validateProviderFields(config.provider, config);
  return errors.length === 0;
}

/**
 * Validate scopes format
 */
export function validateScopes(scopes: string[]): boolean {
  if (!Array.isArray(scopes)) return false;
  return scopes.every((scope) => typeof scope === 'string' && scope.length > 0);
}

/**
 * Get default scopes for provider
 */
export function getDefaultScopes(provider: SSOProvider): string[] {
  switch (provider) {
    case 'OIDC':
      return ['openid', 'profile', 'email'];
    case 'OAUTH2':
      return ['profile', 'email'];
    default:
      return [];
  }
}

/**
 * Get provider label
 */
export function getProviderLabel(provider: SSOProvider): string {
  const labels: Record<SSOProvider, string> = {
    SAML: 'SAML 2.0',
    OAUTH2: 'OAuth 2.0',
    OIDC: 'OpenID Connect',
    LDAP: 'LDAP / Active Directory',
    CAS: 'CAS',
    OTHER: 'Khác',
  };
  return labels[provider];
}

/**
 * Get provider color
 */
export function getProviderColor(provider: SSOProvider): string {
  const colors: Record<SSOProvider, string> = {
    SAML: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    OAUTH2: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    OIDC: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    LDAP: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    CAS: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[provider];
}

/**
 * Get status label
 */
export function getStatusLabel(status: SSOConfigStatus): string {
  const labels: Record<SSOConfigStatus, string> = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Không hoạt động',
    TESTING: 'Đang thử nghiệm',
    DEPRECATED: 'Đã lỗi thời',
  };
  return labels[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: SSOConfigStatus): string {
  const colors: Record<SSOConfigStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    TESTING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    DEPRECATED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status];
}

/**
 * Get status icon
 */
export function getStatusIcon(status: SSOConfigStatus): string {
  const icons: Record<SSOConfigStatus, string> = {
    ACTIVE: '✅',
    INACTIVE: '⏸️',
    TESTING: '🧪',
    DEPRECATED: '⚠️',
  };
  return icons[status];
}

/**
 * Mask sensitive data
 */
export function maskSensitiveData(config: TenantSSOConfig): TenantSSOConfig {
  return {
    ...config,
    client_secret: config.client_secret ? '••••••••' : null,
    certificate: config.certificate ? '[REDACTED]' : null,
  };
}

/**
 * Build SAML metadata XML
 */
export function buildSAMLMetadata(config: TenantSSOConfig): string {
  if (config.provider !== 'SAML') {
    throw new Error('Can only build metadata for SAML configs');
  }

  if (!config.entity_id || !config.sso_url) {
    throw new Error('entity_id and sso_url are required for SAML metadata');
  }

  return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.entity_id}">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.sso_url}"/>
    ${config.slo_url ? `<SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.slo_url}"/>` : ''}
  </IDPSSODescriptor>
</EntityDescriptor>`;
}

export default tenantSSOConfigsApi;

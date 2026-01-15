/**
 * Tenant SSO Configs API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-14: 100% matches tenant_sso_configs schema (27 fields)
 * ⚠️ FIX: Provider has 6 values (not 3), Status has 4 values (not 3)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * SSO Provider - 6 values from database CHECK constraint
 */
export type SSOProvider = 
  | 'SAML'      // SAML 2.0
  | 'OAUTH2'    // OAuth 2.0
  | 'OIDC'      // OpenID Connect
  | 'LDAP'      // LDAP/Active Directory
  | 'CAS'       // Central Authentication Service
  | 'OTHER';    // Other custom protocols

/**
 * SSO Config Status - 4 values from database CHECK constraint
 */
export type SSOConfigStatus = 
  | 'ACTIVE'      // Currently in use
  | 'INACTIVE'    // Disabled
  | 'TESTING'     // Testing/Development
  | 'DEPRECATED'; // Old config, kept for reference

/**
 * Attribute Mapping - Maps SSO attributes to user fields
 */
export interface AttributeMapping {
  email?: string;           // Email attribute name
  first_name?: string;      // First name attribute
  last_name?: string;       // Last name attribute
  display_name?: string;    // Display name attribute
  username?: string;        // Username attribute
  phone?: string;           // Phone attribute
  employee_id?: string;     // Employee ID attribute
  department?: string;      // Department attribute
  role?: string;            // Role attribute
  [key: string]: string | undefined;  // Additional custom mappings
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
  auto_provision?: boolean;  // Auto-create users
  update_on_login?: boolean; // Update user info on each login
  default_role?: string;     // Default role for new users
  allowed_domains?: string[]; // Allowed email domains
  
  [key: string]: any;  // Additional custom settings
}

/**
 * TenantSSOConfig - 100% matches tenant_sso_configs table (27 fields)
 */
export interface TenantSSOConfig {
  // Identity (2)
  _id: string;
  tenant_id: string;
  
  // Basic Info (4)
  provider: SSOProvider;              // ✅ 6 values! (SAML/OAUTH2/OIDC/LDAP/CAS/OTHER)
  name: string;                       // varchar(255) - Config name
  description?: string;               // text - Optional description
  status: SSOConfigStatus;            // ✅ 4 values! (ACTIVE/INACTIVE/TESTING/DEPRECATED)
  
  // SAML-specific (5)
  entity_id?: string;                 // varchar(500) - SAML Entity ID
  sso_url?: string;                   // text - SAML SSO URL
  slo_url?: string;                   // text - SAML Single Logout URL
  certificate?: string;               // text - X.509 certificate
  metadata_url?: string;              // text - SAML metadata URL
  
  // OAuth2/OIDC-specific (6)
  client_id?: string;                 // varchar(255) - OAuth Client ID
  client_secret?: string;             // text - OAuth Client Secret (encrypted)
  authorization_endpoint?: string;    // text - OAuth authorization URL
  token_endpoint?: string;            // text - OAuth token URL
  userinfo_endpoint?: string;         // text - OIDC UserInfo URL
  jwks_uri?: string;                  // text - OIDC JWKS URI
  
  // Configuration (3)
  scopes: string[];                   // jsonb default '[]' - OAuth scopes
  attribute_mapping: AttributeMapping; // jsonb default '{}' - Map SSO → User fields
  settings: SSOSettings;              // jsonb default '{}' - Provider-specific settings
  
  // Audit (7)
  created_at: string;                 // timestamptz not null
  updated_at: string;                 // timestamptz not null
  created_by?: string;                // ✅ UUID - Who created
  updated_by?: string;                // ✅ UUID - Who last updated
  deleted_at?: string;                // ✅ timestamptz - Soft delete
  deleted_by?: string;                // ✅ UUID - Who deleted
  version: number;                    // int not null default 1
}

/**
 * Create Tenant SSO Config Request
 */
export interface CreateTenantSSOConfigRequest {
  tenant_id: string;
  provider: SSOProvider;
  name: string;
  description?: string;
  status?: SSOConfigStatus;           // Default 'ACTIVE'
  
  // SAML fields
  entity_id?: string;
  sso_url?: string;
  slo_url?: string;
  certificate?: string;
  metadata_url?: string;
  
  // OAuth2/OIDC fields
  client_id?: string;
  client_secret?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  
  // Configuration
  scopes?: string[];
  attribute_mapping?: AttributeMapping;
  settings?: SSOSettings;
}

/**
 * Update Tenant SSO Config Request
 */
export interface UpdateTenantSSOConfigRequest {
  name?: string;
  description?: string;
  status?: SSOConfigStatus;
  
  // SAML fields
  entity_id?: string;
  sso_url?: string;
  slo_url?: string;
  certificate?: string;
  metadata_url?: string;
  
  // OAuth2/OIDC fields
  client_id?: string;
  client_secret?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  
  // Configuration
  scopes?: string[];
  attribute_mapping?: AttributeMapping;
  settings?: SSOSettings;
}

/**
 * SSO Config Filters
 */
export interface SSOConfigFilters extends BaseFilters {
  tenant_id?: string;
  provider?: SSOProvider;
  status?: SSOConfigStatus;
  include_deleted?: boolean;
}

/**
 * SSO Config Test Result
 */
export interface SSOConfigTestResult {
  success: boolean;
  message: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

/**
 * SSO Config Statistics
 */
export interface SSOConfigStats {
  total: number;
  by_provider: Record<SSOProvider, number>;
  by_status: Record<SSOConfigStatus, number>;
  active: number;
  testing: number;
  with_scopes: number;
  with_attribute_mapping: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantSSOConfig, CreateTenantSSOConfigRequest, UpdateTenantSSOConfigRequest>(
  'tenant_sso_configs',
  '/tenant-sso-configs'
);

// ==================== API CLIENT ====================

export const tenantSSOConfigsApi = {
  /**
   * GET /tenant-sso-configs
   */
  getAll: async (filters?: SSOConfigFilters): Promise<TenantSSOConfig[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /tenant-sso-configs/:id
   */
  getById: async (id: string): Promise<TenantSSOConfig> => {
    return adapter.getById(id);
  },

  /**
   * POST /tenant-sso-configs
   */
  create: async (data: CreateTenantSSOConfigRequest): Promise<TenantSSOConfig> => {
    // Validate required fields
    if (!data.tenant_id || !data.provider || !data.name) {
      throw new Error('tenant_id, provider, and name are required');
    }
    
    // Validate provider-specific required fields
    validateProviderFields(data.provider, data);
    
    return adapter.create(data);
  },

  /**
   * PATCH /tenant-sso-configs/:id
   */
  update: async (id: string, data: UpdateTenantSSOConfigRequest): Promise<TenantSSOConfig> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-sso-configs/:id (Soft delete)
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Get configs by tenant
   */
  getByTenant: async (tenantId: string, filters?: SSOConfigFilters): Promise<TenantSSOConfig[]> => {
    return adapter.getAll({
      ...filters,
      tenant_id: tenantId,
    });
  },

  /**
   * Get configs by provider
   */
  getByProvider: async (provider: SSOProvider, filters?: SSOConfigFilters): Promise<TenantSSOConfig[]> => {
    return adapter.getAll({
      ...filters,
      provider,
    });
  },

  /**
   * Get active configs for tenant
   */
  getActiveConfigs: async (tenantId: string): Promise<TenantSSOConfig[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      status: 'ACTIVE',
    });
  },

  /**
   * Test SSO configuration
   */
  testConfig: async (id: string): Promise<SSOConfigTestResult> => {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenant-sso-configs/${id}/test`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to test configuration');
    }
    
    return response.json();
  },

  /**
   * Activate config
   */
  activate: async (id: string): Promise<TenantSSOConfig> => {
    return adapter.update(id, { status: 'ACTIVE' });
  },

  /**
   * Deactivate config
   */
  deactivate: async (id: string): Promise<TenantSSOConfig> => {
    return adapter.update(id, { status: 'INACTIVE' });
  },

  /**
   * Set to testing mode
   */
  setTesting: async (id: string): Promise<TenantSSOConfig> => {
    return adapter.update(id, { status: 'TESTING' });
  },

  /**
   * Deprecate config
   */
  deprecate: async (id: string): Promise<TenantSSOConfig> => {
    return adapter.update(id, { status: 'DEPRECATED' });
  },

  /**
   * Get statistics
   */
  getStats: async (filters?: SSOConfigFilters): Promise<SSOConfigStats> => {
    const configs = await adapter.getAll(filters);
    
    const stats: SSOConfigStats = {
      total: configs.length,
      by_provider: {
        SAML: 0,
        OAUTH2: 0,
        OIDC: 0,
        LDAP: 0,
        CAS: 0,
        OTHER: 0,
      },
      by_status: {
        ACTIVE: 0,
        INACTIVE: 0,
        TESTING: 0,
        DEPRECATED: 0,
      },
      active: 0,
      testing: 0,
      with_scopes: 0,
      with_attribute_mapping: 0,
    };
    
    configs.forEach(config => {
      stats.by_provider[config.provider]++;
      stats.by_status[config.status]++;
      
      if (config.status === 'ACTIVE') stats.active++;
      if (config.status === 'TESTING') stats.testing++;
      if (config.scopes && config.scopes.length > 0) stats.with_scopes++;
      if (config.attribute_mapping && Object.keys(config.attribute_mapping).length > 0) {
        stats.with_attribute_mapping++;
      }
    });
    
    return stats;
  },

  /**
   * Clone config
   */
  clone: async (id: string, newName: string): Promise<TenantSSOConfig> => {
    const original = await adapter.getById(id);
    
    return adapter.create({
      tenant_id: original.tenant_id,
      provider: original.provider,
      name: newName,
      description: original.description ? `${original.description} (Cloned)` : undefined,
      status: 'TESTING', // Start cloned configs in testing mode
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
    });
  },

  /**
   * Bulk operations
   */
  bulkActivate: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => tenantSSOConfigsApi.activate(id)));
  },

  bulkDeactivate: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => tenantSSOConfigsApi.deactivate(id)));
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => adapter.delete(id)));
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate provider-specific required fields
 */
function validateProviderFields(provider: SSOProvider, data: Partial<CreateTenantSSOConfigRequest>): void {
  switch (provider) {
    case 'SAML':
      if (!data.entity_id) {
        throw new Error('entity_id is required for SAML provider');
      }
      if (!data.sso_url) {
        throw new Error('sso_url is required for SAML provider');
      }
      break;
      
    case 'OAUTH2':
    case 'OIDC':
      if (!data.client_id) {
        throw new Error('client_id is required for OAuth2/OIDC provider');
      }
      if (!data.authorization_endpoint) {
        throw new Error('authorization_endpoint is required for OAuth2/OIDC provider');
      }
      if (!data.token_endpoint) {
        throw new Error('token_endpoint is required for OAuth2/OIDC provider');
      }
      break;
      
    case 'LDAP':
      if (!data.settings?.ldap_host) {
        throw new Error('ldap_host in settings is required for LDAP provider');
      }
      if (!data.settings?.ldap_base_dn) {
        throw new Error('ldap_base_dn in settings is required for LDAP provider');
      }
      break;
      
    case 'CAS':
      if (!data.sso_url) {
        throw new Error('sso_url is required for CAS provider');
      }
      break;
      
    case 'OTHER':
      // No specific validation for OTHER
      break;
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
    CAS: 'CAS (Central Authentication Service)',
    OTHER: 'Other',
  };
  return labels[provider];
}

/**
 * Get provider color for UI
 */
export function getProviderColor(provider: SSOProvider): string {
  const colors: Record<SSOProvider, string> = {
    SAML: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    OAUTH2: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    OIDC: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    LDAP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    CAS: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[provider];
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: SSOConfigStatus): string {
  const colors: Record<SSOConfigStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    TESTING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    DEPRECATED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status];
}

/**
 * Get status icon for UI
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
 * Mask sensitive data (client_secret, certificate)
 */
export function maskSensitiveData(config: TenantSSOConfig): TenantSSOConfig {
  return {
    ...config,
    client_secret: config.client_secret ? '••••••••' : undefined,
    certificate: config.certificate ? '[REDACTED]' : undefined,
  };
}

/**
 * Validate scopes format
 */
export function validateScopes(scopes: string[]): boolean {
  if (!Array.isArray(scopes)) return false;
  return scopes.every(scope => typeof scope === 'string' && scope.length > 0);
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
 * Build SAML metadata XML
 */
export function buildSAMLMetadata(config: TenantSSOConfig): string {
  if (config.provider !== 'SAML') {
    throw new Error('Can only build metadata for SAML configs');
  }
  
  // Basic SAML metadata structure
  return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.entity_id}">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.sso_url}"/>
    ${config.slo_url ? `<SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.slo_url}"/>` : ''}
  </IDPSSODescriptor>
</EntityDescriptor>`;
}

export default tenantSSOConfigsApi;

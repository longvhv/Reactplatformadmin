/**
 * Tenant App Routes API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Manages domain-based routing configuration for tenant applications
 * 
 * IMPORTANT: Database has conflicting constraints on domain field:
 * - Column: domain varchar(255) NOT NULL
 * - Constraint: domain can be NULL for route_scope IN ('ALL_MY_DOMAINS', 'INHERITED')
 * This API assumes domain is NULLABLE based on the constraint logic.
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type RouteStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'PENDING_DNS';
export type SSLStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED';
export type RouteScope = 'SPECIFIC_DOMAIN' | 'ALL_MY_DOMAINS' | 'INHERITED';

export const RouteStatusHelper = {
  ACTIVE: 'ACTIVE' as RouteStatus,
  INACTIVE: 'INACTIVE' as RouteStatus,
  MAINTENANCE: 'MAINTENANCE' as RouteStatus,
  PENDING_DNS: 'PENDING_DNS' as RouteStatus,

  isActive: (status: RouteStatus) => status === 'ACTIVE',
  isInactive: (status: RouteStatus) => status === 'INACTIVE',
  isMaintenance: (status: RouteStatus) => status === 'MAINTENANCE',
  isPendingDNS: (status: RouteStatus) => status === 'PENDING_DNS',
};

export const SSLStatusHelper = {
  NONE: 'NONE' as SSLStatus,
  PENDING: 'PENDING' as SSLStatus,
  ACTIVE: 'ACTIVE' as SSLStatus,
  FAILED: 'FAILED' as SSLStatus,

  hasSSL: (status: SSLStatus) => status === 'ACTIVE',
  needsSSL: (status: SSLStatus) => status === 'NONE' || status === 'FAILED',
  isProcessing: (status: SSLStatus) => status === 'PENDING',
};

export const RouteScopeHelper = {
  SPECIFIC_DOMAIN: 'SPECIFIC_DOMAIN' as RouteScope,
  ALL_MY_DOMAINS: 'ALL_MY_DOMAINS' as RouteScope,
  INHERITED: 'INHERITED' as RouteScope,

  requiresDomain: (scope: RouteScope) => scope === 'SPECIFIC_DOMAIN',
  requiresNullDomain: (scope: RouteScope) => scope === 'ALL_MY_DOMAINS' || scope === 'INHERITED',
};

// ==================== MAIN INTERFACE ====================

export interface TenantAppRoute {
  // I. IDENTITY & RELATIONSHIPS
  _id: string;
  tenant_id: string;
  app_code: string;

  // II. ROUTING CONFIGURATION
  domain: string | null; // Nullable based on route_scope logic
  path_prefix: string;
  route_scope: RouteScope;

  // III. ROUTE FLAGS
  is_primary: boolean;
  is_custom_domain: boolean;

  // IV. STATUS
  status: RouteStatus;
  ssl_status: SSLStatus;

  // V. AUDIT TRAIL
  created_at: string;
  updated_at: string;
  version: number; // bigint for optimistic locking
}

// ==================== REQUEST INTERFACES ====================

export interface CreateRouteRequest {
  // Required
  tenant_id: string;
  app_code: string;

  // Optional with defaults
  path_prefix?: string; // default: '/'
  is_primary?: boolean; // default: false
  is_custom_domain?: boolean; // default: false
  ssl_status?: SSLStatus; // default: 'NONE'
  status?: RouteStatus; // default: 'ACTIVE'
  route_scope?: RouteScope; // default: 'SPECIFIC_DOMAIN'
  version?: number; // default: 1

  // Conditional (required if route_scope = 'SPECIFIC_DOMAIN')
  domain?: string | null;
}

export interface UpdateRouteRequest {
  app_code?: string;
  domain?: string | null;
  path_prefix?: string;
  route_scope?: RouteScope;
  is_primary?: boolean;
  is_custom_domain?: boolean;
  status?: RouteStatus;
  ssl_status?: SSLStatus;
}

export interface RouteFilters extends BaseFilters {
  tenant_id?: string;
  app_code?: string;
  domain?: string;
  is_primary?: boolean;
  is_custom_domain?: boolean;
  ssl_status?: SSLStatus;
  status?: RouteStatus;
  route_scope?: RouteScope;
  needs_ssl?: boolean;
}

// ==================== STATISTICS ====================

export interface RouteStatistics {
  total_routes: number;
  active_routes: number;
  inactive_routes: number;
  maintenance_routes: number;
  pending_dns_routes: number;
  primary_routes: number;
  custom_domains: number;
  ssl_active: number;
  ssl_pending: number;
  ssl_failed: number;
  ssl_none: number;
  by_app_code: Record<string, number>;
  by_status: Record<RouteStatus, number>;
  by_ssl_status: Record<SSLStatus, number>;
  by_route_scope: Record<RouteScope, number>;
}

// ==================== VALIDATION RESULT ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantAppRoute, CreateRouteRequest, UpdateRouteRequest>(
  'tenant_app_routes',
  '/tenant-app-routes',
  false // No soft delete
);

// ==================== API CLIENT ====================

export const tenantAppRoutesApi = {
  /**
   * GET /tenant-app-routes
   * Fetch routes with filters
   */
  getAll: async (filters?: RouteFilters): Promise<TenantAppRoute[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_app_routes')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.app_code) {
      query = query.eq('app_code', filters.app_code);
    }
    if (filters?.domain) {
      query = query.eq('domain', filters.domain);
    }
    if (filters?.is_primary !== undefined) {
      query = query.eq('is_primary', filters.is_primary);
    }
    if (filters?.is_custom_domain !== undefined) {
      query = query.eq('is_custom_domain', filters.is_custom_domain);
    }
    if (filters?.ssl_status) {
      query = query.eq('ssl_status', filters.ssl_status);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.route_scope) {
      query = query.eq('route_scope', filters.route_scope);
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
      throw new Error(`Failed to fetch tenant app routes: ${error.message}`);
    }

    let routes = data || [];

    // Client-side needs_ssl filter
    if (filters?.needs_ssl) {
      routes = routes.filter((route) => SSLStatusHelper.needsSSL(route.ssl_status));
    }

    return routes;
  },

  /**
   * GET /tenant-app-routes/:id
   */
  getById: async (id: string): Promise<TenantAppRoute> => {
    return adapter.getById(id);
  },

  /**
   * POST /tenant-app-routes
   * Create new route with validation and defaults
   */
  create: async (data: CreateRouteRequest): Promise<TenantAppRoute> => {
    // Validate before creation
    const validation = tenantAppRoutesApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Apply defaults
    const requestData = {
      path_prefix: '/', // default
      is_primary: false, // default
      is_custom_domain: false, // default
      ssl_status: 'NONE' as SSLStatus, // default
      status: 'ACTIVE' as RouteStatus, // default
      route_scope: 'SPECIFIC_DOMAIN' as RouteScope, // default
      version: 1, // default
      ...data,
    };

    // Check for domain conflicts before creating
    const conflict = await tenantAppRoutesApi.checkDomainConflict(
      requestData.domain || '',
      requestData.path_prefix || '/'
    );
    if (conflict) {
      throw new Error(`Domain conflict: Route already exists for ${requestData.domain}${requestData.path_prefix}`);
    }

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-app-routes/:id
   * Update route
   */
  update: async (id: string, data: UpdateRouteRequest): Promise<TenantAppRoute> => {
    // Validate before update
    const validation = tenantAppRoutesApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /tenant-app-routes/:id
   * Hard delete route
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /tenant-app-routes/by-tenant/:tenantId
   * Get all routes for a tenant
   */
  getByTenant: async (tenantId: string): Promise<TenantAppRoute[]> => {
    return tenantAppRoutesApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-app-routes/by-domain/:domain
   * Get routes by domain
   */
  getByDomain: async (domain: string): Promise<TenantAppRoute[]> => {
    return tenantAppRoutesApi.getAll({ domain });
  },

  /**
   * GET /tenant-app-routes/primary/:tenantId
   * Get primary route for tenant
   */
  getPrimaryRoute: async (tenantId: string): Promise<TenantAppRoute | null> => {
    const routes = await tenantAppRoutesApi.getAll({
      tenant_id: tenantId,
      is_primary: true,
    });
    return routes[0] || null;
  },

  /**
   * GET /tenant-app-routes/active/:tenantId
   * Get active routes for tenant
   */
  getActiveRoutes: async (tenantId: string): Promise<TenantAppRoute[]> => {
    return tenantAppRoutesApi.getAll({
      tenant_id: tenantId,
      status: 'ACTIVE',
    });
  },

  /**
   * GET /tenant-app-routes/custom-domains/:tenantId
   * Get custom domain routes
   */
  getCustomDomains: async (tenantId: string): Promise<TenantAppRoute[]> => {
    return tenantAppRoutesApi.getAll({
      tenant_id: tenantId,
      is_custom_domain: true,
    });
  },

  /**
   * GET /tenant-app-routes/needs-ssl
   * Get routes needing SSL setup
   */
  getRoutesNeedingSSL: async (tenantId?: string): Promise<TenantAppRoute[]> => {
    return tenantAppRoutesApi.getAll({
      tenant_id: tenantId,
      needs_ssl: true,
    });
  },

  /**
   * POST /tenant-app-routes/:id/set-primary
   * Set route as primary (unset others)
   */
  setPrimary: async (routeId: string, tenantId: string): Promise<TenantAppRoute> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // First, unset all primary routes for this tenant
    await supabase
      .from('tenant_app_routes')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('is_primary', true);

    // Then set this route as primary
    const route = await tenantAppRoutesApi.getById(routeId);
    return adapter.update(routeId, {
      is_primary: true,
    });
  },

  /**
   * POST /tenant-app-routes/:id/activate
   * Activate route
   */
  activate: async (id: string): Promise<TenantAppRoute> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_app_routes')
      .update({
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to activate route: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-app-routes/:id/deactivate
   * Deactivate route
   */
  deactivate: async (id: string): Promise<TenantAppRoute> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_app_routes')
      .update({
        status: 'INACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to deactivate route: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-app-routes/:id/maintenance
   * Set route to maintenance mode
   */
  setMaintenance: async (id: string, enabled: boolean): Promise<TenantAppRoute> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_app_routes')
      .update({
        status: enabled ? 'MAINTENANCE' : 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to set maintenance mode: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-app-routes/:id/ssl-status
   * Update SSL status
   */
  setSSLStatus: async (id: string, sslStatus: SSLStatus): Promise<TenantAppRoute> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_app_routes')
      .update({
        ssl_status: sslStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update SSL status: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-app-routes/:id/status
   * Update route status
   */
  setStatus: async (id: string, status: RouteStatus): Promise<TenantAppRoute> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_app_routes')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update status: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * GET /tenant-app-routes/check-conflict
   * Check if domain + path combination already exists
   */
  checkDomainConflict: async (domain: string, pathPrefix: string, excludeId?: string): Promise<boolean> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_app_routes')
      .select('_id')
      .eq('domain', domain)
      .eq('path_prefix', pathPrefix);

    if (excludeId) {
      query = query.neq('_id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check domain conflict: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  },

  /**
   * GET /tenant-app-routes/statistics
   * Get route statistics
   */
  getStatistics: async (tenantId?: string): Promise<RouteStatistics> => {
    const routes = await tenantAppRoutesApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(routes);
  },

  /**
   * Client-side validation
   */
  validate: (data: CreateRouteRequest | UpdateRouteRequest): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate app_code
    if ('app_code' in data && data.app_code !== undefined) {
      if (!data.app_code.trim()) {
        errors.push('Mã ứng dụng không được để trống');
      }
      if (data.app_code.length > 50) {
        errors.push('Mã ứng dụng không được vượt quá 50 ký tự');
      }
    }

    // Validate domain
    if ('domain' in data && data.domain !== undefined && data.domain !== null) {
      if (data.domain.length > 255) {
        errors.push('Tên miền không được vượt quá 255 ký tự');
      }
      // Domain format: ^[a-z0-9.-]+$
      if (!/^[a-z0-9.-]+$/.test(data.domain)) {
        errors.push('Tên miền chỉ được chứa chữ thường, số, dấu chấm và gạch ngang');
      }
      // Check for valid domain structure
      if (data.domain.startsWith('.') || data.domain.endsWith('.')) {
        errors.push('Tên miền không được bắt đầu hoặc kết thúc bằng dấu chấm');
      }
      if (data.domain.includes('..')) {
        errors.push('Tên miền không được chứa hai dấu chấm liên tiếp');
      }
    }

    // Validate path_prefix
    if ('path_prefix' in data && data.path_prefix !== undefined) {
      if (data.path_prefix.length > 100) {
        errors.push('Path prefix không được vượt quá 100 ký tự');
      }
      // Path format: ^/[-a-z0-9/]*$
      if (!/^\/[-a-z0-9/]*$/.test(data.path_prefix)) {
        errors.push('Path prefix phải bắt đầu bằng / và chỉ chứa chữ thường, số, gạch ngang và /')
      }
      if (data.path_prefix.endsWith('/') && data.path_prefix.length > 1) {
        warnings.push('Path prefix không nên kết thúc bằng / (trừ root path)');
      }
      if (data.path_prefix.includes('//')) {
        errors.push('Path prefix không được chứa hai dấu / liên tiếp');
      }
    }

    // Validate route_scope logic
    if ('route_scope' in data && data.route_scope !== undefined) {
      if (data.route_scope === 'SPECIFIC_DOMAIN') {
        if ('domain' in data && (data.domain === undefined || data.domain === null)) {
          errors.push('route_scope = SPECIFIC_DOMAIN yêu cầu domain không được null');
        }
      } else if (data.route_scope === 'ALL_MY_DOMAINS' || data.route_scope === 'INHERITED') {
        if ('domain' in data && data.domain !== null && data.domain !== undefined) {
          errors.push(`route_scope = ${data.route_scope} yêu cầu domain phải là null`);
        }
      }
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
 * Calculate statistics from routes array
 */
export function calculateStatistics(routes: TenantAppRoute[]): RouteStatistics {
  const byStatus: Record<RouteStatus, number> = {
    ACTIVE: 0,
    INACTIVE: 0,
    MAINTENANCE: 0,
    PENDING_DNS: 0,
  };

  const bySSLStatus: Record<SSLStatus, number> = {
    NONE: 0,
    PENDING: 0,
    ACTIVE: 0,
    FAILED: 0,
  };

  const byRouteScope: Record<RouteScope, number> = {
    SPECIFIC_DOMAIN: 0,
    ALL_MY_DOMAINS: 0,
    INHERITED: 0,
  };

  const byAppCode: Record<string, number> = {};

  let activeCount = 0;
  let inactiveCount = 0;
  let maintenanceCount = 0;
  let pendingDNSCount = 0;
  let primaryCount = 0;
  let customDomainCount = 0;
  let sslActiveCount = 0;
  let sslPendingCount = 0;
  let sslFailedCount = 0;
  let sslNoneCount = 0;

  routes.forEach((route) => {
    // Count by status
    byStatus[route.status]++;
    switch (route.status) {
      case 'ACTIVE':
        activeCount++;
        break;
      case 'INACTIVE':
        inactiveCount++;
        break;
      case 'MAINTENANCE':
        maintenanceCount++;
        break;
      case 'PENDING_DNS':
        pendingDNSCount++;
        break;
    }

    // Count by SSL status
    bySSLStatus[route.ssl_status]++;
    switch (route.ssl_status) {
      case 'ACTIVE':
        sslActiveCount++;
        break;
      case 'PENDING':
        sslPendingCount++;
        break;
      case 'FAILED':
        sslFailedCount++;
        break;
      case 'NONE':
        sslNoneCount++;
        break;
    }

    // Count by route scope
    byRouteScope[route.route_scope]++;

    // Count by app code
    byAppCode[route.app_code] = (byAppCode[route.app_code] || 0) + 1;

    // Count flags
    if (route.is_primary) primaryCount++;
    if (route.is_custom_domain) customDomainCount++;
  });

  return {
    total_routes: routes.length,
    active_routes: activeCount,
    inactive_routes: inactiveCount,
    maintenance_routes: maintenanceCount,
    pending_dns_routes: pendingDNSCount,
    primary_routes: primaryCount,
    custom_domains: customDomainCount,
    ssl_active: sslActiveCount,
    ssl_pending: sslPendingCount,
    ssl_failed: sslFailedCount,
    ssl_none: sslNoneCount,
    by_app_code: byAppCode,
    by_status: byStatus,
    by_ssl_status: bySSLStatus,
    by_route_scope: byRouteScope,
  };
}

/**
 * Get status label
 */
export function getStatusLabel(status: RouteStatus): string {
  const labels: Record<RouteStatus, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    MAINTENANCE: 'Bảo trì',
    PENDING_DNS: 'Chờ DNS',
  };
  return labels[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: RouteStatus): string {
  const colors: Record<RouteStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    PENDING_DNS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return colors[status];
}

/**
 * Get SSL status label
 */
export function getSSLStatusLabel(status: SSLStatus): string {
  const labels: Record<SSLStatus, string> = {
    NONE: 'Chưa có SSL',
    PENDING: 'Đang xử lý',
    ACTIVE: 'Đã kích hoạt',
    FAILED: 'Thất bại',
  };
  return labels[status];
}

/**
 * Get SSL status color
 */
export function getSSLStatusColor(status: SSLStatus): string {
  const colors: Record<SSLStatus, string> = {
    NONE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status];
}

/**
 * Get route scope label
 */
export function getRouteScopeLabel(scope: RouteScope): string {
  const labels: Record<RouteScope, string> = {
    SPECIFIC_DOMAIN: 'Domain cụ thể',
    ALL_MY_DOMAINS: 'Tất cả domain',
    INHERITED: 'Kế thừa',
  };
  return labels[scope];
}

/**
 * Get route scope color
 */
export function getRouteScopeColor(scope: RouteScope): string {
  const colors: Record<RouteScope, string> = {
    SPECIFIC_DOMAIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ALL_MY_DOMAINS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    INHERITED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[scope];
}

/**
 * Build full URL from route
 */
export function buildURL(route: TenantAppRoute, protocol: 'http' | 'https' = 'https'): string {
  if (!route.domain) {
    return route.path_prefix;
  }
  const pathPrefix = route.path_prefix === '/' ? '' : route.path_prefix;
  return `${protocol}://${route.domain}${pathPrefix}`;
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  // Format: ^[a-z0-9.-]+$
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.includes('..')) return false;
  if (domain.length > 255) return false;
  return true;
}

/**
 * Validate path prefix format
 */
export function isValidPathPrefix(path: string): boolean {
  // Format: ^/[-a-z0-9/]*$
  if (!/^\/[-a-z0-9/]*$/.test(path)) return false;
  if (path.includes('//')) return false;
  if (path.length > 100) return false;
  return true;
}

/**
 * Check if route is operational
 */
export function isOperational(route: TenantAppRoute): boolean {
  return route.status === 'ACTIVE' && route.ssl_status !== 'FAILED';
}

/**
 * Check if route needs attention
 */
export function needsAttention(route: TenantAppRoute): boolean {
  return (
    route.status === 'PENDING_DNS' ||
    route.ssl_status === 'FAILED' ||
    route.ssl_status === 'PENDING'
  );
}

/**
 * Get route health status
 */
export function getHealthStatus(route: TenantAppRoute): 'healthy' | 'warning' | 'error' {
  if (route.status === 'INACTIVE') return 'error';
  if (route.status === 'MAINTENANCE') return 'warning';
  if (route.ssl_status === 'FAILED') return 'error';
  if (route.status === 'PENDING_DNS' || route.ssl_status === 'PENDING') return 'warning';
  if (route.status === 'ACTIVE' && route.ssl_status === 'ACTIVE') return 'healthy';
  return 'warning';
}

export default tenantAppRoutesApi;

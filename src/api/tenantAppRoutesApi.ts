/**
 * Tenant App Routes API Client
 * Domain-based routing configuration for tenants
 * Schema: tenant_app_routes table
 * 
 * CRITICAL: Khớp 100% với database schema
 */
import { createAdapter, BaseFilters } from './adapters';

// Enums matching database constraints
export type RouteStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'PENDING_DNS';
export type SSLStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED';
export type RouteScope = 'SPECIFIC_DOMAIN' | 'ALL_MY_DOMAINS' | 'INHERITED';

// Main interface - khớp 100% với database schema
export interface TenantAppRoute {
  _id: string;
  tenant_id: string;
  app_code: string;
  domain: string | null;
  path_prefix: string;
  is_primary: boolean;
  is_custom_domain: boolean;
  ssl_status: SSLStatus;
  status: RouteStatus;
  route_scope: RouteScope;
  created_at: string;
  updated_at: string;
  version: number;
}

// Create request - các fields bắt buộc
export interface CreateRouteData {
  tenant_id: string;
  app_code: string;
  domain?: string | null;
  path_prefix?: string; // default '/'
  is_primary?: boolean; // default false
  is_custom_domain?: boolean; // default false
  ssl_status?: SSLStatus; // default 'NONE'
  status?: RouteStatus; // default 'ACTIVE'
  route_scope?: RouteScope; // default 'SPECIFIC_DOMAIN'
}

// Update request
export interface UpdateRouteData {
  app_code?: string;
  domain?: string | null;
  path_prefix?: string;
  is_primary?: boolean;
  is_custom_domain?: boolean;
  ssl_status?: SSLStatus;
  status?: RouteStatus;
  route_scope?: RouteScope;
  version: number; // Required for optimistic locking
}

// Filters
export interface RouteFilters extends BaseFilters {
  tenant_id?: string;
  app_code?: string;
  domain?: string;
  is_primary?: boolean;
  is_custom_domain?: boolean;
  ssl_status?: SSLStatus;
  status?: RouteStatus;
  route_scope?: RouteScope;
}

// Stats interface - khớp với component expectations
export interface RouteStats {
  total: number;
  primary: number;
  custom_domains: number;
  ssl_active: number;
  ssl_pending: number;
  ssl_failed: number;
  by_app_code: Record<string, number>;
  by_status: Record<RouteStatus, number>;
  by_route_scope: Record<RouteScope, number>;
}

const adapter = createAdapter<TenantAppRoute, CreateRouteData, UpdateRouteData>(
  'tenant_app_routes',
  '/tenant-app-routes'
);

export const tenantAppRoutesApi = {
  getAll: (filters?: RouteFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateRouteData) => adapter.create(data),
  update: (id: string, data: UpdateRouteData) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
  
  /**
   * Get all routes for a specific tenant
   */
  getByTenant: async (tenantId: string): Promise<TenantAppRoute[]> => {
    return adapter.getAll({ tenant_id: tenantId });
  },
  
  /**
   * Get statistics for routes
   */
  getStats: async (filters?: RouteFilters): Promise<RouteStats> => {
    const routes = await adapter.getAll(filters);
    
    const stats: RouteStats = {
      total: routes.length,
      primary: routes.filter(r => r.is_primary).length,
      custom_domains: routes.filter(r => r.is_custom_domain).length,
      ssl_active: routes.filter(r => r.ssl_status === 'ACTIVE').length,
      ssl_pending: routes.filter(r => r.ssl_status === 'PENDING').length,
      ssl_failed: routes.filter(r => r.ssl_status === 'FAILED').length,
      by_app_code: {},
      by_status: {
        ACTIVE: 0,
        INACTIVE: 0,
        MAINTENANCE: 0,
        PENDING_DNS: 0,
      },
      by_route_scope: {
        SPECIFIC_DOMAIN: 0,
        ALL_MY_DOMAINS: 0,
        INHERITED: 0,
      },
    };
    
    // Count by app_code
    routes.forEach(route => {
      stats.by_app_code[route.app_code] = (stats.by_app_code[route.app_code] || 0) + 1;
      stats.by_status[route.status] = (stats.by_status[route.status] || 0) + 1;
      stats.by_route_scope[route.route_scope] = (stats.by_route_scope[route.route_scope] || 0) + 1;
    });
    
    return stats;
  },
  
  /**
   * Set a route as primary for the tenant
   * Only one route can be primary per tenant
   */
  setPrimary: async (routeId: string, tenantId: string): Promise<TenantAppRoute> => {
    // First, get current route to get its version
    const route = await adapter.getById(routeId);
    
    // Update this route to be primary
    const updated = await adapter.update(routeId, {
      is_primary: true,
      version: route.version,
    });
    
    // Note: Backend should handle unsetting other primary routes
    return updated;
  },
  
  /**
   * Update SSL status for a route
   */
  setSSLStatus: async (routeId: string, sslStatus: SSLStatus): Promise<TenantAppRoute> => {
    const route = await adapter.getById(routeId);
    return adapter.update(routeId, {
      ssl_status: sslStatus,
      version: route.version,
    });
  },
  
  /**
   * Update route status (ACTIVE, INACTIVE, MAINTENANCE, PENDING_DNS)
   */
  setStatus: async (routeId: string, status: RouteStatus): Promise<TenantAppRoute> => {
    const route = await adapter.getById(routeId);
    return adapter.update(routeId, {
      status,
      version: route.version,
    });
  },
};

export default tenantAppRoutesApi;

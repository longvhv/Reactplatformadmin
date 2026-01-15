/**
 * Tenant App Routes Resolver API Client
 */
import { createAdapter, BaseFilters } from './adapters';
import { RouteScope } from './tenantAppRoutesApi';

export interface RouteResolver {
  _id: string;
  tenant_id: string;
  route_pattern: string;
  target_app_id: string;
  priority: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ResolvedRoute {
  _id: string;
  tenant_id: string;
  route_scope: RouteScope;
  domain: string | null;
  path_prefix: string;
  app_code: string;
  resolved_domains: string[];
  effective_urls: string[];
  priority: number;
  metadata?: Record<string, any>;
}

export interface ResolvedDomain {
  domain: string;
  path_prefix: string;
  full_url: string;
}

export interface CreateResolverRequest {
  tenant_id: string;
  route_pattern: string;
  target_app_id: string;
  priority: number;
  metadata?: Record<string, any>;
}

export interface UpdateResolverRequest {
  route_pattern?: string;
  target_app_id?: string;
  priority?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
  version: number;
}

export interface ResolverFilters extends BaseFilters {
  tenant_id?: string;
  target_app_id?: string;
  is_active?: boolean;
}

const adapter = createAdapter<RouteResolver, CreateResolverRequest, UpdateResolverRequest>(
  'tenant_app_routes_resolver',
  '/tenant-app-routes-resolver'
);

export const tenantAppRoutesResolverApi = {
  getAll: (filters?: ResolverFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateResolverRequest) => adapter.create(data),
  update: (id: string, data: UpdateResolverRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
  
  // Resolver-specific methods
  getResolvedRoutesByTenant: async (tenantId: string): Promise<ResolvedRoute[]> => {
    console.warn('getResolvedRoutesByTenant: Returning mock data - resolver not fully implemented');
    return [];
  },
  
  getResolvedRoute: async (routeId: string): Promise<ResolvedRoute | null> => {
    console.warn('getResolvedRoute: Returning null - resolver not fully implemented');
    return null;
  },
  
  resolveRouteDomains: async (routeId: string): Promise<ResolvedDomain[]> => {
    console.warn('resolveRouteDomains: Returning empty array - resolver not fully implemented');
    return [];
  },
  
  checkRoutingConflicts: async (tenantId: string): Promise<{ hasConflict: boolean; conflicts: any[] }> => {
    console.warn('checkRoutingConflicts: Returning no conflicts - resolver not fully implemented');
    return { hasConflict: false, conflicts: [] };
  },
  
  validateRoute: async (data: {
    tenant_id: string;
    route_scope: RouteScope;
    domain: string | null;
    path_prefix: string;
    app_code: string;
    route_id?: string;
  }): Promise<{ valid: boolean; errors: string[] }> => {
    console.warn('validateRoute: Performing basic validation - full resolver not implemented');
    const errors: string[] = [];
    
    if (!data.tenant_id) errors.push('Tenant ID is required');
    if (!data.route_scope) errors.push('Route scope is required');
    if (!data.path_prefix) errors.push('Path prefix is required');
    if (!data.app_code) errors.push('App code is required');
    
    if (data.route_scope === 'SPECIFIC_DOMAIN' && !data.domain) {
      errors.push('Domain is required for SPECIFIC_DOMAIN scope');
    }
    
    return { valid: errors.length === 0, errors };
  },
};

export default tenantAppRoutesResolverApi;
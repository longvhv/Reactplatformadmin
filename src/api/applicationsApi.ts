/**
 * Applications API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface Application {
  _id: string;
  code: string;
  name: string;
  description?: string;
  app_type: 'WEB' | 'MOBILE' | 'API' | 'SERVICE';
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  version: string;
  is_public: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version_number: number;
}

export interface CreateApplicationRequest {
  code: string;
  name: string;
  description?: string;
  app_type: 'WEB' | 'MOBILE' | 'API' | 'SERVICE';
  version: string;
  is_public?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateApplicationRequest {
  code?: string;
  name?: string;
  description?: string;
  app_type?: 'WEB' | 'MOBILE' | 'API' | 'SERVICE';
  status?: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  version?: string;
  is_public?: boolean;
  metadata?: Record<string, any>;
  version_number: number;
}

export interface ApplicationFilters extends BaseFilters {
  app_type?: string;
  status?: string;
  is_public?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Application, CreateApplicationRequest, UpdateApplicationRequest>(
  'applications',
  '/applications'
);

// ==================== API CLIENT ====================

export const applicationsApi = {
  /**
   * GET /applications
   */
  getAll: async (filters?: ApplicationFilters): Promise<Application[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /applications/:id
   */
  getById: async (id: string): Promise<Application> => {
    return adapter.getById(id);
  },

  /**
   * POST /applications
   */
  create: async (data: CreateApplicationRequest): Promise<Application> => {
    return adapter.create(data);
  },

  /**
   * PATCH /applications/:id
   */
  update: async (id: string, data: UpdateApplicationRequest): Promise<Application> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /applications/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /applications/:id/capabilities
   * TODO (Golang): Implement capabilities endpoint
   */
  getCapabilities: async (id: string): Promise<any[]> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /applications/:id/stats
   * TODO (Golang): Implement stats endpoint
   */
  getStats: async (id: string): Promise<any> => {
    throw new Error('Not implemented - migrate to Golang');
  },
};

export default applicationsApi;

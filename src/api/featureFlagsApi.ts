/**
 * Feature Flags API Client
 * Handles feature flag management with Supabase backend
 * 
 * ✅ REFACTORED 2026-01-20: Strict schema compliance
 * Table: feature_flags
 */
import { createAdapter, BaseFilters } from './adapters';
import { API_BASE_URL, getDefaultHeaders } from './config';

// ============================================================================
// ENUMS
// ============================================================================

export type FlagType = 'boolean' | 'feature' | 'release' | 'experiment' | 'operational';
export type Environment = 'production' | 'staging' | 'development' | 'beta';
export type TargetAudience = 'all' | 'premium' | 'enterprise' | 'beta-testers' | 'developers' | 'internal' | 'mobile' | 'business';

// ============================================================================
// MAIN INTERFACE (Matching Database Schema)
// ============================================================================

export interface FeatureFlag {
  // Primary Identity
  id: string; // uuid NOT NULL
  flag_key: string; // varchar NOT NULL UNIQUE
  flag_name: string; // varchar NOT NULL
  
  // Content
  description?: string; // text
  
  // Status & Config
  is_enabled: boolean; // boolean DEFAULT false
  environment: Environment; // varchar DEFAULT 'production'
  flag_type: FlagType; // varchar DEFAULT 'boolean'
  
  // Targeting
  target_audience?: TargetAudience | string; // varchar
  percentage_rollout: number; // integer DEFAULT 0
  conditions?: Record<string, any>; // jsonb
  
  // Additional Data
  metadata?: Record<string, any>; // jsonb
  
  // Audit Trail
  created_by?: string; // varchar
  created_at: string; // timestamp
  updated_at: string; // timestamp
  enabled_at?: string; // timestamp
  disabled_at?: string; // timestamp
  
  // Note: No version or deleted_at/deleted_by in this table schema
}

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface CreateFeatureFlagRequest {
  // Required
  flag_key: string;
  flag_name: string;
  flag_type: FlagType;
  environment: Environment;
  
  // Optional
  description?: string;
  is_enabled?: boolean;
  target_audience?: TargetAudience | string;
  percentage_rollout?: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  created_by?: string;
}

export interface UpdateFeatureFlagRequest {
  flag_name?: string;
  description?: string;
  is_enabled?: boolean;
  environment?: Environment;
  flag_type?: FlagType;
  target_audience?: TargetAudience | string;
  percentage_rollout?: number;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Timestamps for status changes
  enabled_at?: string;
  disabled_at?: string;
}

export interface FeatureFlagFilters extends BaseFilters {
  type?: FlagType;
  environment?: Environment;
  is_enabled?: boolean;
  search?: string;
}

export interface FeatureFlagStats {
  totalFlags: number;
  enabledFlags: number;
  disabledFlags: number;
  productionFlags: number;
  stagingFlags: number;
  developmentFlags: number;
  betaFlags: number;
  averageRollout: number;
}

export interface FlagCheckResponse {
  enabled: boolean;
  exists: boolean;
  percentage_rollout?: number;
  target_audience?: TargetAudience;
  conditions?: Record<string, any>;
  message?: string;
  error?: string;
}

// ============================================================================
// API ADAPTER
// ============================================================================

// Schema does not support soft delete, so we do not pass { supportsSoftDelete: true }
const adapter = createAdapter<FeatureFlag, CreateFeatureFlagRequest, UpdateFeatureFlagRequest>(
  'feature_flags',
  '/feature-flags'
);

export const featureFlagsApi = {
  getAll: (filters?: FeatureFlagFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateFeatureFlagRequest) => adapter.create(data),
  update: (id: string, data: UpdateFeatureFlagRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
  
  // Custom endpoints
  toggle: async (id: string): Promise<{ data: FeatureFlag; success: boolean; message: string }> => {
    // We can also use update here, but if there's a specific server endpoint for toggle that handles side effects, keep it.
    // Assuming standard REST pattern for now or custom if existing backend requires it.
    // For now, I'll stick to the existing custom endpoint if it exists, otherwise standard update.
    // The previous code had this, so I assume the backend supports it.
    const response = await fetch(`${API_BASE_URL}/feature-flags/${id}/toggle`, {
      method: 'PATCH',
      headers: getDefaultHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle feature flag');
    }
    
    return response.json();
  },
  
  getStats: async (): Promise<{ data: FeatureFlagStats; success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/feature-flags/stats/overview`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch statistics');
    }
    
    return response.json();
  },
  
  checkFlag: async (key: string, environment: Environment = 'production'): Promise<FlagCheckResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/feature-flags/check/${key}?environment=${environment}`,
      {
        method: 'GET',
        headers: getDefaultHeaders(),
      }
    );
    
    if (!response.ok) {
      return { enabled: false, exists: false, error: 'Failed to check flag' };
    }
    
    return response.json();
  },
};

export default featureFlagsApi;

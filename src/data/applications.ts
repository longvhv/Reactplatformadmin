/**
 * Application Types
 * 
 * ✅ FIXED 2026-01-14: Removed duplicate wrong AppCapability interface
 * - AppCapability moved to /api/appCapabilityApi.ts (correct version with 19 fields)
 * - Removed wrong version with app_code, BOOLEAN/NUMBER types, is_active
 */

export interface Application {
  _id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

// ❌ REMOVED: Wrong AppCapability interface (had app_code, wrong types)
// ✅ USE: import { AppCapability } from '@/api/appCapabilityApi'

export interface CreateApplicationRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// ❌ REMOVED: Wrong CreateCapabilityRequest (use from /api/appCapabilityApi)
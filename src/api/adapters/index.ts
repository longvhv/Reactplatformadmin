/**
 * API Adapters
 * Exports all adapters and factory function
 */

export * from './base';
export * from './supabase';
export * from './http';

import { API_MODE } from '../config';
import { IApiAdapter } from './base';
import { SupabaseAdapter } from './supabase';
import { HttpAdapter } from './http';

/**
 * Adapter Factory
 * Creates appropriate adapter based on API_MODE
 */
export function createAdapter<T, CreateDto, UpdateDto>(
  tableName: string,
  endpoint?: string,
  supportsSoftDelete: boolean = false
): IApiAdapter<T, CreateDto, UpdateDto> {
  if (API_MODE === 'golang') {
    return new HttpAdapter<T, CreateDto, UpdateDto>(tableName, endpoint);
  } else {
    // Default to Supabase for 'supabase' and 'hybrid' modes
    return new SupabaseAdapter<T, CreateDto, UpdateDto>(tableName, supportsSoftDelete);
  }
}

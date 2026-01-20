/**
 * API Adapters
 * Exports all adapters and factory function
 */

export * from './base';
export * from './supabase';
export * from './http';
export * from './mock';

import { API_MODE } from '../config';
import { IApiAdapter } from './base';
import { SupabaseAdapter } from './supabase';
import { HttpAdapter } from './http';
import { MockAdapter } from './mock';

/**
 * Adapter Factory
 * Creates appropriate adapter based on API_MODE
 */
export function createAdapter<T, CreateDto, UpdateDto>(
  tableName: string,
  endpoint?: string,
  options?: { supportsSoftDelete?: boolean; useMock?: boolean }
): IApiAdapter<T, CreateDto, UpdateDto> {
  const supportsSoftDelete = options?.supportsSoftDelete ?? false;
  const useMock = options?.useMock ?? false;
  
  if (useMock) {
    return new MockAdapter<T, CreateDto, UpdateDto>(tableName);
  }
  
  if (API_MODE === 'golang') {
    return new HttpAdapter<T, CreateDto, UpdateDto>(tableName, endpoint);
  } else {
    // Default to Supabase for 'supabase' and 'hybrid' modes
    return new SupabaseAdapter<T, CreateDto, UpdateDto>(tableName, supportsSoftDelete);
  }
}

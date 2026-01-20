/**
 * API Adapters
 * Exports all adapters and factory function
 */

export * from './base';
export * from './supabase';
export * from './http';
export * from './mock';
export * from './data-client-adapter';

import { IApiAdapter } from './base';
import { MockAdapter } from './mock';
import { DataClientAdapter } from './data-client-adapter';

/**
 * Adapter Factory
 * Creates appropriate adapter based on DataClient configuration
 * 
 * ✅ UPDATED: Now uses unified DataClientAdapter which delegates 
 * to the configured DataClient (Supabase or Golang)
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
  
  // Always return DataClientAdapter
  // The DataClient itself (getDataClient()) handles the switch 
  // between Supabase and Golang based on configuration.
  return new DataClientAdapter<T, CreateDto, UpdateDto>(tableName, supportsSoftDelete);
}

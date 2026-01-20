/**
 * Data Client - Main Export
 * 
 * @example
 * // Configure on app startup
 * import { DataClientFactory } from '@/lib/data-client';
 * 
 * DataClientFactory.configure({
 *   type: 'supabase',
 *   supabase: { url, anonKey },
 * });
 * 
 * @example
 * // Use in hooks
 * import { getDataClient } from '@/lib/data-client';
 * 
 * const dataClient = getDataClient();
 * const result = await dataClient.query<Tenant>('tenants', {
 *   filters: { status: 'ACTIVE' },
 *   limit: 20,
 * });
 */

// Main exports
export { DataClientFactory, getDataClient } from './DataClientFactory';
export { SupabaseDataClient } from './SupabaseDataClient';
export { GolangApiDataClient } from './GolangApiDataClient';

// Type exports
export type {
  IDataClient,
  QueryOptions,
  QueryResult,
  QueryFilter,
  QueryOrderBy,
  BaseRecord,
  DataClientConfig,
  DataSourceType,
  SupabaseConfig,
  GolangApiConfig,
} from './types';

// Error exports
export {
  DataClientError,
  NotFoundError,
  ValidationError,
  OptimisticLockError,
} from './types';

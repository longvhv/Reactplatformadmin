/**
 * Data Client Factory
 * Singleton factory to create and manage data client instances
 */

import type { IDataClient, DataClientConfig, DataSourceType } from './types';
import { SupabaseDataClient } from './SupabaseDataClient';
import { GolangApiDataClient } from './GolangApiDataClient';

export class DataClientFactory {
  private static instance: IDataClient | null = null;
  private static config: DataClientConfig | null = null;

  /**
   * Configure the data client factory
   * Call this once during app initialization
   * 
   * @param config - Configuration for the data client
   * 
   * @example
   * DataClientFactory.configure({
   *   type: 'supabase',
   *   supabase: {
   *     url: process.env.NEXT_PUBLIC_SUPABASE_URL,
   *     anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
   *   },
   * });
   */
  static configure(config: DataClientConfig): void {
    this.config = config;
    this.instance = null; // Reset instance when config changes
    console.log(`[DataClientFactory] Configured with type: ${config.type}`);
  }

  /**
   * Get the data client instance (singleton)
   * 
   * @returns The configured data client instance
   * @throws Error if factory is not configured
   * 
   * @example
   * const dataClient = DataClientFactory.getClient();
   * const tenants = await dataClient.query('tenants');
   */
  static getClient(): IDataClient {
    // Return existing instance if available
    if (this.instance) {
      return this.instance;
    }

    // Require manual configuration
    if (!this.config) {
      throw new Error(
        '[DataClientFactory] Not configured. Call DataClientFactory.configure() first. ' +
        'Make sure DataClientProvider is added to your app layout.'
      );
    }

    // Create instance based on configured type
    this.instance = this.createClient(this.config);
    
    console.log(`[DataClientFactory] Initialized ${this.config.type} client`);
    
    return this.instance;
  }

  /**
   * Reset the factory (useful for testing)
   */
  static reset(): void {
    this.instance = null;
    this.config = null;
    console.log('[DataClientFactory] Reset');
  }

  /**
   * Get current configuration
   */
  static getConfig(): DataClientConfig | null {
    return this.config;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Create data client instance based on config
   */
  private static createClient(config: DataClientConfig): IDataClient {
    switch (config.type) {
      case 'supabase':
        if (!config.supabase) {
          throw new Error('[DataClientFactory] Supabase config is required when type is "supabase"');
        }
        
        if (!config.supabase.url || !config.supabase.anonKey) {
          throw new Error('[DataClientFactory] Supabase URL and anonKey are required');
        }

        return new SupabaseDataClient(
          config.supabase.url,
          config.supabase.anonKey
        );

      case 'golang-api':
        if (!config.golangApi) {
          throw new Error('[DataClientFactory] Golang API config is required when type is "golang-api"');
        }
        
        if (!config.golangApi.baseUrl || !config.golangApi.apiKey) {
          throw new Error('[DataClientFactory] Golang API baseUrl and apiKey are required');
        }

        return new GolangApiDataClient(
          config.golangApi.baseUrl,
          config.golangApi.apiKey
        );

      default:
        throw new Error(`[DataClientFactory] Unknown data source type: ${config.type}`);
    }
  }

  /**
   * Get default configuration from environment variables
   */
  private static getDefaultConfig(): DataClientConfig {
    // Determine data source type from environment
    const dataSourceEnv = process.env.NEXT_PUBLIC_DATA_SOURCE;
    const type = (dataSourceEnv || 'supabase') as DataSourceType;

    console.log(`[DataClientFactory] Loading default config for type: ${type}`);

    if (type === 'supabase') {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        throw new Error(
          '[DataClientFactory] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in environment'
        );
      }

      return {
        type: 'supabase',
        supabase: { url, anonKey },
      };
    }

    if (type === 'golang-api') {
      const baseUrl = process.env.NEXT_PUBLIC_GOLANG_API_URL;
      const apiKey = process.env.NEXT_PUBLIC_GOLANG_API_KEY;

      if (!baseUrl || !apiKey) {
        throw new Error(
          '[DataClientFactory] NEXT_PUBLIC_GOLANG_API_URL and NEXT_PUBLIC_GOLANG_API_KEY must be set in environment'
        );
      }

      return {
        type: 'golang-api',
        golangApi: { baseUrl, apiKey },
      };
    }

    throw new Error(`[DataClientFactory] Invalid NEXT_PUBLIC_DATA_SOURCE: ${dataSourceEnv}`);
  }
}

/**
 * Convenience function to get data client instance
 * 
 * @example
 * import { getDataClient } from '@/lib/data-client';
 * 
 * const dataClient = getDataClient();
 * const tenants = await dataClient.query('tenants');
 */
export const getDataClient = (): IDataClient => {
  return DataClientFactory.getClient();
};
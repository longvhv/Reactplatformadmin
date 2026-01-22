/**
 * useDataClient Hook
 * Ensures DataClient is configured before use
 */

import { useEffect, useState } from 'react';
import { DataClientFactory, getDataClient, type IDataClient } from '@/lib/data-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

let configuredOnce = false;

export function useDataClient(): IDataClient | null {
  const [client, setClient] = useState<IDataClient | null>(null);

  useEffect(() => {
    // Configure once globally
    if (!configuredOnce) {
      try {
        DataClientFactory.configure({
          type: 'supabase',
          supabase: {
            url: `https://${projectId}.supabase.co`,
            anonKey: publicAnonKey,
          },
        });
        configuredOnce = true;
        console.log('[useDataClient] Configured successfully');
      } catch (error) {
        console.error('[useDataClient] Configuration failed:', error);
      }
    }

    // Get client instance
    try {
      const instance = getDataClient();
      setClient(instance);
    } catch (error) {
      console.error('[useDataClient] Failed to get client:', error);
    }
  }, []);

  return client;
}

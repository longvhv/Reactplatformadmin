'use client';

/**
 * Data Client Provider
 * Initializes the DataClientFactory on app startup
 */

import { useEffect } from 'react';
import { DataClientFactory } from '../../lib/data-client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function DataClientProvider({ children }: { children: React.ReactNode }) {
  // Initialize in useEffect to ensure it runs on client-side only
  useEffect(() => {
    // Check if already initialized
    if (DataClientFactory.getConfig()) {
      console.log('[DataClientProvider] Already initialized');
      return;
    }

    try {
      DataClientFactory.configure({
        type: 'supabase',
        supabase: {
          url: `https://${projectId}.supabase.co`,
          anonKey: publicAnonKey,
        },
      });
      console.log('[DataClientProvider] Initialized successfully');
    } catch (error) {
      console.error('[DataClientProvider] Initialization failed:', error);
    }
  }, []);

  return <>{children}</>;
}
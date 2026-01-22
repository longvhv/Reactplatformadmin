/**
 * Data Client Initialization
 * Configure DataClientFactory synchronously before app renders
 */

import { DataClientFactory } from './DataClientFactory';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/**
 * Initialize DataClient synchronously
 * This runs BEFORE React components mount
 */
export function initializeDataClient(): void {
  // Check if already configured
  if (DataClientFactory.getConfig()) {
    console.log('[DataClient Init] Already configured');
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
    console.log('[DataClient Init] ✅ Configured successfully');
  } catch (error) {
    console.error('[DataClient Init] ❌ Configuration failed:', error);
    throw error;
  }
}

// Auto-initialize when this module is imported
initializeDataClient();

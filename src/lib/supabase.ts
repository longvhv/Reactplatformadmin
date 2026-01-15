/**
 * Supabase Client Singleton
 * Ensures only one instance across the app
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Clean up instance on HMR to prevent "Multiple GoTrueClient" warnings in dev
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    supabaseInstance = null;
  });
}

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey
    );
  }
  return supabaseInstance;
}

// Export default instance
export const supabase = getSupabaseClient();
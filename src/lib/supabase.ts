/**
 * Supabase Client Singleton
 * Ensures only one instance across the app
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Use a global registry to ensure true singleton across module boundaries
// This prevents "Multiple GoTrueClient instances" warnings
const globalForSupabase = globalThis as unknown as {
  supabaseClient: ReturnType<typeof createClient> | undefined;
  supabaseCreated: boolean;
};

export function getSupabaseClient() {
  // Return existing instance if available
  if (globalForSupabase.supabaseClient) {
    return globalForSupabase.supabaseClient;
  }
  
  // ✅ FIX: Don't handle race condition with Promise - just create synchronously
  // Mark as being created
  globalForSupabase.supabaseCreated = true;
  
  // Create new instance
  const client = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-vewxdzhvrpxsmpmlwaqr-auth-token',
      },
    }
  );
  
  // Store in global registry
  globalForSupabase.supabaseClient = client;
  
  return client;
}

// Export default instance - lazily initialized
export const supabase = getSupabaseClient();
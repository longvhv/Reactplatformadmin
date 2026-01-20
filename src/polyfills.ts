/**
 * Polyfills for browser environment
 * Import this FIRST in your entry point
 */

// Polyfill for process.env in browser environment
if (typeof window !== 'undefined' && typeof (globalThis as any).process === 'undefined') {
  // Safely access import.meta.env
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  
  (globalThis as any).process = {
    env: {
      NODE_ENV: env.MODE || 'development',
      VITE_SUPABASE_PROJECT_ID: env.VITE_SUPABASE_PROJECT_ID,
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
    }
  };
}

// Export for TypeScript
export {};
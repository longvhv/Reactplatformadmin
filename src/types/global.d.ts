/**
 * Global type declarations
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_SUPABASE_PROJECT_ID?: string;
      VITE_SUPABASE_ANON_KEY?: string;
    }
  }

  var process: {
    env: NodeJS.ProcessEnv;
  };
}

export {};

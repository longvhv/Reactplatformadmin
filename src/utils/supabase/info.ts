/**
 * Supabase Project Info
 * Configure your Supabase project credentials here
 */

// Safely access import.meta.env
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

// Get from environment variables or use defaults for development
export const projectId = env.VITE_SUPABASE_PROJECT_ID || 'vewxdzhvrpxsmpmlwaqr';
export const publicAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3hkemh2cnB4c21wbWx3YXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDQ2MTYsImV4cCI6MjA4MTg4MDYxNn0.tBCteYE06c_jhsF8l-K4Kf4rrOMT0XTzf_izJeVkfWs';

// Supabase URL
export const supabaseUrl = `https://${projectId}.supabase.co`;

// Export for convenience
export const config = {
  projectId,
  publicAnonKey,
  supabaseUrl,
};
/**
 * Authentication Utilities
 * Extract and validate user from request
 */

import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { AppError, ErrorCodes } from './error-handler.ts';

/**
 * Get Supabase client
 */
export const getSupabaseClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !key) {
    throw new AppError(
      500,
      ErrorCodes.INTERNAL_ERROR,
      'Supabase configuration missing'
    );
  }
  
  return createClient(url, key);
};

/**
 * Get current user ID from auth token
 */
export const getCurrentUserId = async (c: Context): Promise<string | null> => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  
  return user.id;
};

/**
 * Require authentication (throws if not authenticated)
 */
export const requireAuth = async (c: Context): Promise<string> => {
  const userId = await getCurrentUserId(c);
  
  if (!userId) {
    throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required');
  }
  
  return userId;
};

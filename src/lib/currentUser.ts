/**
 * Current User Library
 * 
 * Thư viện để truy xuất và quản lý thông tin người dùng hiện tại
 * Features:
 * - Get current user from Supabase Auth
 * - Get user profile with metadata
 * - Get user avatar URL
 * - Cache user data for performance
 */

import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface CurrentUser extends User {
  display_name?: string;
  avatar_url?: string;
  full_name?: string;
  username?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Get current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    // BYPASS MODE: Check localStorage first
    const bypassUserId = localStorage.getItem('bypass-auth-user-id');
    const bypassEmail = localStorage.getItem('bypass-auth-email');
    
    if (bypassUserId && bypassEmail) {
      console.log('🔓 BYPASS MODE: Getting user from database');
      
      // Get user profile from database
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('_id', bypassUserId)
        .single();
      
      if (error || !userProfile) {
        console.error('Error getting user profile in bypass mode:', error);
        // Clear invalid bypass session
        localStorage.removeItem('bypass-auth-user-id');
        localStorage.removeItem('bypass-auth-email');
        return null;
      }
      
      // Create a mock CurrentUser object
      return {
        id: userProfile._id,
        email: userProfile.email,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: userProfile.created_at || new Date().toISOString(),
        updated_at: userProfile.updated_at || new Date().toISOString(),
        app_metadata: {},
        user_metadata: {
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
        },
        display_name: userProfile.full_name, // Use full_name as display_name
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
      } as CurrentUser;
    }

    // Normal Supabase auth flow
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    if (!user) {
      return null;
    }
    
    // Merge user metadata into user object
    return {
      ...user,
      display_name: user.user_metadata?.display_name || user.user_metadata?.name,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
      username: user.user_metadata?.username,
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting current session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return null;
  }
}

/**
 * Get user profile with extended information
 * Tries to get from users table
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  try {
    // Get current user if userId not provided
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await getCurrentUser();
      if (!user) return null;
      targetUserId = user.id;
    }
    
    // Get profile from users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('_id', targetUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.warn('Error getting user profile from database:', error);
    }
    
    // If profile exists in database, return it
    if (profile) {
      return {
        id: profile._id,
        email: profile.email,
        full_name: profile.full_name,
        display_name: profile.full_name, // Use full_name as display_name
        avatar_url: profile.avatar_url,
        phone: profile.phone_number,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        metadata: profile.metadata,
      } as UserProfile;
    }
    
    // Otherwise, return auth user data
    const user = await getCurrentUser();
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.full_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      username: user.username,
      created_at: user.created_at,
      updated_at: user.updated_at,
      metadata: user.user_metadata,
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Get user display name
 * Prioritizes: display_name > full_name > username > email
 */
export function getUserDisplayName(user: CurrentUser | UserProfile | null): string {
  if (!user) return 'Guest';
  
  return (
    user.display_name ||
    user.full_name ||
    user.username ||
    user.email?.split('@')[0] ||
    'User'
  );
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(user: CurrentUser | UserProfile | null): string {
  if (!user) return 'G';
  
  const name = getUserDisplayName(user);
  
  // Split by space and get first letter of each word
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get user avatar URL with fallback
 */
export function getUserAvatarUrl(user: CurrentUser | UserProfile | null): string | undefined {
  if (!user) return undefined;
  
  // Check for avatar_url in user object or metadata
  const avatarUrl = user.avatar_url || user.metadata?.avatar_url;
  
  if (avatarUrl) {
    return avatarUrl;
  }
  
  return undefined;
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    
    if (error) {
      console.error('Error updating user metadata:', error);
      throw error;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error in updateUserMetadata:', error);
    throw error;
  }
}

/**
 * Update user profile in database
 */
export async function updateUserProfile(userId: string, profile: Partial<UserProfile>) {
  try {
    // Map UserProfile fields to users table fields
    const updateData: any = {};
    
    if (profile.full_name !== undefined) updateData.full_name = profile.full_name;
    if (profile.avatar_url !== undefined) updateData.avatar_url = profile.avatar_url;
    if (profile.phone !== undefined) updateData.phone_number = profile.phone;
    if (profile.metadata !== undefined) updateData.metadata = profile.metadata;
    
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    // Map back to UserProfile format
    return {
      id: data._id,
      email: data.email,
      full_name: data.full_name,
      display_name: data.full_name,
      avatar_url: data.avatar_url,
      phone: data.phone_number,
      created_at: data.created_at,
      updated_at: data.updated_at,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
}
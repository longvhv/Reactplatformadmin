/**
 * useCurrentUser Hook
 * 
 * Hook để truy xuất thông tin người dùng hiện tại
 * Features:
 * - Auto-refresh when auth state changes
 * - Caching for performance
 * - Loading and error states
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getCurrentUser,
  getUserProfile,
  getUserDisplayName,
  getUserInitials,
  getUserAvatarUrl,
  CurrentUser,
  UserProfile,
} from '../lib/currentUser';
import { AuthChangeEvent } from '@supabase/supabase-js';

export interface UseCurrentUserReturn {
  user: CurrentUser | null;
  profile: UserProfile | null;
  displayName: string;
  initials: string;
  avatarUrl: string | undefined;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get current authenticated user
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Get user profile
      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err instanceof Error ? err : new Error('Failed to load user'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load user on mount
    loadUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        // Reload user data on auth changes
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    await loadUser();
  };

  return {
    user,
    profile,
    displayName: getUserDisplayName(profile || user),
    initials: getUserInitials(profile || user),
    avatarUrl: getUserAvatarUrl(profile || user),
    loading,
    error,
    refresh,
  };
}
/**
 * useUserConsents Hook
 * React hook for managing user consents
 */

import { useState, useEffect, useCallback } from 'react';
import {
  userConsentsApi,
  UserConsent,
  UserConsentFilters,
  CreateUserConsentData,
  WithdrawConsentData,
} from '../api/userConsentsApi';

export function useUserConsents(filters?: UserConsentFilters) {
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch consents
  const fetchConsents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userConsentsApi.getAll(filters);
      setConsents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consents');
      console.error('Error fetching user consents:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create consent
  const createConsent = async (data: CreateUserConsentData): Promise<UserConsent> => {
    try {
      const created = await userConsentsApi.create(data);
      await fetchConsents();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create consent';
      setError(message);
      throw new Error(message);
    }
  };

  // Withdraw consent
  const withdrawConsent = async (id: string, data?: WithdrawConsentData): Promise<UserConsent> => {
    try {
      const withdrawn = await userConsentsApi.withdraw(id, data);
      await fetchConsents();
      return withdrawn;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to withdraw consent';
      setError(message);
      throw new Error(message);
    }
  };

  // Renew consent
  const renewConsent = async (id: string): Promise<UserConsent> => {
    try {
      const renewed = await userConsentsApi.renew(id);
      await fetchConsents();
      return renewed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to renew consent';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete consent
  const deleteConsent = async (id: string): Promise<void> => {
    try {
      await userConsentsApi.delete(id);
      await fetchConsents();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete consent';
      setError(message);
      throw new Error(message);
    }
  };

  // Check if user has consented
  const hasConsented = async (userId: string, documentId: string): Promise<boolean> => {
    try {
      return await userConsentsApi.hasConsented(userId, documentId);
    } catch (err) {
      console.error('Error checking consent:', err);
      return false;
    }
  };

  // Get user stats
  const getUserStats = async (userId: string) => {
    try {
      return await userConsentsApi.getUserStats(userId);
    } catch (err) {
      console.error('Error getting user stats:', err);
      return {
        total: 0,
        active: 0,
        withdrawn: 0,
        requiresRenewal: 0,
        expiringSoon: 0,
      };
    }
  };

  // Initial load
  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  return {
    consents,
    loading,
    error,
    createConsent,
    withdrawConsent,
    renewConsent,
    deleteConsent,
    hasConsented,
    getUserStats,
    refresh: fetchConsents,
  };
}

export default useUserConsents;

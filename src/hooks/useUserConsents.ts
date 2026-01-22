/**
 * useUserConsents Hook
 * React hook for managing user consents
 * 
 * ✅ UPDATED: Compliant with public.user_consents schema
 * - Uses correct API types
 * - Handles all schema fields
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  userConsentsApi,
  UserConsent,
  ConsentFilters,
  CreateConsentRequest,
  ConsentStatistics
} from '../api/userConsentsApi';

export function useUserConsents(filters?: ConsentFilters) {
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
      const msg = err instanceof Error ? err.message : 'Failed to load consents';
      setError(msg);
      console.error('Error fetching user consents:', err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create consent
  const createConsent = useCallback(async (data: CreateConsentRequest): Promise<UserConsent> => {
    try {
      const created = await userConsentsApi.create(data);
      await fetchConsents();
      toast.success('Consent created successfully');
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create consent';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchConsents]);

  // Withdraw consent
  const withdrawConsent = useCallback(async (id: string, reason?: string): Promise<UserConsent> => {
    try {
      const withdrawn = await userConsentsApi.withdraw(id, reason);
      await fetchConsents();
      toast.success('Consent withdrawn successfully');
      return withdrawn;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to withdraw consent';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchConsents]);

  // Renew consent
  const renewConsent = useCallback(async (id: string, newExpiresAt?: string): Promise<UserConsent> => {
    try {
      const renewed = await userConsentsApi.renew(id, newExpiresAt);
      await fetchConsents();
      toast.success('Consent renewed successfully');
      return renewed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to renew consent';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchConsents]);

  // Delete consent
  const deleteConsent = useCallback(async (id: string): Promise<void> => {
    try {
      await userConsentsApi.delete(id);
      await fetchConsents();
      toast.success('Consent deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete consent';
      setError(message);
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchConsents]);

  // Check if user has consented
  const hasConsented = useCallback(async (userId: string, documentId: string): Promise<boolean> => {
    try {
      return await userConsentsApi.hasConsented(userId, documentId);
    } catch (err) {
      console.error('Error checking consent:', err);
      return false;
    }
  }, []);

  // Get user stats
  const getUserStats = useCallback(async (userId: string): Promise<ConsentStatistics> => {
    try {
      return await userConsentsApi.getUserStats(userId);
    } catch (err) {
      console.error('Error getting user stats:', err);
      // Return empty stats on error
      return {
        total_consents: 0,
        active_consents: 0,
        withdrawn_consents: 0,
        expired_consents: 0,
        needs_renewal_count: 0,
        by_method: {} as any,
        by_document_type: {},
        by_source_application: {},
        average_days_until_expiry: null,
        withdrawal_rate: 0
      };
    }
  }, []);

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

/**
 * useTenantSubscription Hook
 * Manages tenant subscription data from tenant_subscriptions table
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: tenant_subscriptions is a separate table with billing info!
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Tenant Subscription (from tenant_subscriptions table)
 */
export interface TenantSubscription {
  _id: string;
  tenant_id: string;
  plan_id?: string;
  order_id?: string;
  subscription_number: string;
  subscription_name: string;
  start_date: string;
  end_date: string;
  trial_end_date?: string;
  renewal_date?: string;
  status: 'active' | 'trial' | 'suspended' | 'expired' | 'cancelled' | 'pending';
  auto_renew: boolean;
  is_trial: boolean;
  plan_name?: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  base_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  max_users: number;
  current_users: number;
  max_storage_gb: number;
  current_storage_gb: number;
  features: string[];
  limits: Record<string, any>;
  payment_method?: string;
  payment_status: 'paid' | 'unpaid' | 'partially_paid' | 'failed' | 'refunded';
  last_payment_date?: string;
  next_payment_date?: string;
  billing_contact_name?: string;
  billing_contact_email?: string;
  billing_contact_phone?: string;
  notes?: string;
  metadata?: any;
  tags?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

/**
 * Hook for managing tenant subscription
 * @param tenantId - The ID of the tenant
 */
export function useTenantSubscription(tenantId?: string) {
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Fetch tenant subscription data
   */
  const fetchSubscription = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setSubscription(null);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useTenantSubscription] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useTenantSubscription] Fetching subscription for tenant:', tenantId);

      // Try cache first
      const cacheKey = `tenant_subscription_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setSubscription(cached.data);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(message);
      console.error('[useTenantSubscription] Error fetching subscription:', err);
      setLoading(false);
    }
  }, [tenantId, dataClient]);

  /**
   * Fetch from data source (query tenant_subscriptions table)
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Query tenant_subscriptions table for active subscription
      const result = await dataClient.query<TenantSubscription>('tenant_subscriptions', {
        filters: { 
          tenant_id: tenantId,
          status: 'active', // Get active subscription
        },
        orderBy: [{ field: 'created_at', direction: 'desc' }],
        limit: 1,
      });

      const subscriptionData = result.data[0] || null;

      console.log('[useTenantSubscription] Loaded subscription for tenant:', tenantId);

      // Update cache
      const cacheKey = `tenant_subscription_${tenantId}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: subscriptionData,
          timestamp: Date.now(),
        })
      );

      // Update state
      setSubscription(subscriptionData);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTenantSubscription] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Create new subscription
   */
  const createSubscription = useCallback(
    async (subscriptionData: Partial<TenantSubscription>): Promise<TenantSubscription> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenantSubscription] Creating subscription');

        const newSubscription = await dataClient.create<TenantSubscription>('tenant_subscriptions', {
          tenant_id: tenantId,
          ...subscriptionData,
        });

        console.log('[useTenantSubscription] Subscription created:', newSubscription._id);

        // Update local state
        setSubscription(newSubscription);

        // Invalidate cache
        localStorage.removeItem(`tenant_subscription_${tenantId}`);

        return newSubscription;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create subscription';
        setError(message);
        console.error('[useTenantSubscription] Error creating subscription:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update subscription
   */
  const updateSubscription = useCallback(
    async (updates: Partial<TenantSubscription>): Promise<TenantSubscription> => {
      if (!subscription) {
        throw new Error('No subscription loaded');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenantSubscription] Updating subscription:', subscription._id);

        const updatedSubscription = await dataClient.update<TenantSubscription>(
          'tenant_subscriptions',
          subscription._id,
          {
            ...updates,
            version: subscription.version,
          }
        );

        console.log('[useTenantSubscription] Subscription updated');

        // Update local state
        setSubscription(updatedSubscription);

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`tenant_subscription_${tenantId}`);
        }

        return updatedSubscription;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update subscription';
        setError(message);
        console.error('[useTenantSubscription] Error updating subscription:', err);
        throw new Error(message);
      }
    },
    [subscription, tenantId, dataClient]
  );

  /**
   * Update subscription status
   */
  const updateStatus = useCallback(
    async (status: TenantSubscription['status']): Promise<void> => {
      await updateSubscription({ status });
    },
    [updateSubscription]
  );

  /**
   * Extend subscription end date
   */
  const extendSubscription = useCallback(
    async (endDate: string): Promise<void> => {
      await updateSubscription({ 
        end_date: endDate,
        status: 'active',
      });
    },
    [updateSubscription]
  );

  /**
   * Update usage (current users/storage)
   */
  const updateUsage = useCallback(
    async (usage: {
      current_users?: number;
      current_storage_gb?: number;
    }): Promise<void> => {
      await updateSubscription(usage);
    },
    [updateSubscription]
  );

  /**
   * Enable/disable auto-renew
   */
  const setAutoRenew = useCallback(
    async (autoRenew: boolean): Promise<void> => {
      await updateSubscription({ auto_renew: autoRenew });
    },
    [updateSubscription]
  );

  /**
   * Check if subscription is expired
   */
  const isExpired = useCallback((): boolean => {
    if (!subscription?.end_date) {
      return false;
    }

    const endDate = new Date(subscription.end_date);
    return endDate < new Date();
  }, [subscription]);

  /**
   * Get days until expiration
   */
  const daysUntilExpiration = useCallback((): number | null => {
    if (!subscription?.end_date) {
      return null;
    }

    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [subscription]);

  /**
   * Check if trial is active
   */
  const isTrialActive = useCallback((): boolean => {
    if (!subscription?.is_trial || !subscription?.trial_end_date) {
      return false;
    }

    const trialEnd = new Date(subscription.trial_end_date);
    return trialEnd > new Date();
  }, [subscription]);

  /**
   * Reload subscription from server
   */
  const reload = useCallback(async () => {
    // Clear cache and refetch
    if (tenantId) {
      localStorage.removeItem(`tenant_subscription_${tenantId}`);
    }
    await fetchSubscription();
  }, [tenantId, fetchSubscription]);

  // Auto-fetch on mount and when tenantId/dataClient changes
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useTenantSubscription] Auto-fetching subscription for:', tenantId);
      fetchSubscription();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  return {
    subscription,
    loading,
    error,
    fetchSubscription,
    createSubscription,
    updateSubscription,
    updateStatus,
    extendSubscription,
    updateUsage,
    setAutoRenew,
    isExpired,
    daysUntilExpiration,
    isTrialActive,
    reload,
  };
}
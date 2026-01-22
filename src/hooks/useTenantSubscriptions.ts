/**
 * useTenantSubscriptions Hook
 * Hook for managing tenant subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  tenantSubscriptionsApi,
  TenantSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionFilters,
} from '../api/tenantSubscriptionsApi';

interface UseTenantSubscriptionsOptions extends SubscriptionFilters {
  autoLoad?: boolean;
}

export function useTenantSubscriptions(options: UseTenantSubscriptionsOptions = {}) {
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantSubscriptionsApi.getAll(options);
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  const createSubscription = async (data: CreateSubscriptionRequest) => {
    try {
      const newSub = await tenantSubscriptionsApi.create(data);
      setSubscriptions(prev => [newSub, ...prev]);
      return newSub;
    } catch (err) {
      throw err;
    }
  };

  const updateSubscription = async (id: string, data: UpdateSubscriptionRequest) => {
    try {
      const updated = await tenantSubscriptionsApi.update(id, data);
      setSubscriptions(prev => prev.map(s => s._id === id ? updated : s));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const current = subscriptions.find(s => s._id === id);
      if (!current) throw new Error('Subscription not found in local state');
      
      await tenantSubscriptionsApi.delete(id, current.version);
      setSubscriptions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadSubscriptions();
    }
  }, [loadSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    loadSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription
  };
}

export function useTenantSubscription(id: string | undefined) {
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tenantSubscriptionsApi.getByIdWithDetails(id);
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { subscription, loading, error, refresh };
}

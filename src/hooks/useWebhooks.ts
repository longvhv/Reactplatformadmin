/**
 * useWebhooks Hook
 * React hook for managing webhooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  webhooksApi,
  Webhook,
  WebhookFilters,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from '../api/webhooksApi';

export function useWebhooks(filters?: WebhookFilters) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent infinite loop
  const memoizedFilters = useMemo(() => filters, [
    filters?.tenant_id,
    filters?.is_active,
    filters?.event,
    filters?.search,
    filters?.limit,
    filters?.offset,
    filters?.order_by,
    filters?.order_direction,
  ]);

  // Fetch webhooks
  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await webhooksApi.getAll(memoizedFilters);
      setWebhooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
      console.error('Error fetching webhooks:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // Get webhook by ID
  const getWebhook = async (id: string): Promise<Webhook | null> => {
    try {
      return await webhooksApi.getById(id);
    } catch (err) {
      console.error('Error getting webhook:', err);
      return null;
    }
  };

  // Create webhook
  const createWebhook = async (data: CreateWebhookRequest): Promise<Webhook> => {
    try {
      const created = await webhooksApi.create(data);
      await fetchWebhooks();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create webhook';
      setError(message);
      throw new Error(message);
    }
  };

  // Update webhook
  const updateWebhook = async (id: string, data: UpdateWebhookRequest): Promise<Webhook> => {
    try {
      const updated = await webhooksApi.update(id, data);
      await fetchWebhooks();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update webhook';
      setError(message);
      throw new Error(message);
    }
  };

  // Enable webhook
  const enableWebhook = async (id: string): Promise<Webhook> => {
    try {
      const enabled = await webhooksApi.enable(id);
      await fetchWebhooks();
      return enabled;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable webhook';
      setError(message);
      throw new Error(message);
    }
  };

  // Disable webhook
  const disableWebhook = async (id: string): Promise<Webhook> => {
    try {
      const disabled = await webhooksApi.disable(id);
      await fetchWebhooks();
      return disabled;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable webhook';
      setError(message);
      throw new Error(message);
    }
  };

  // Verify webhook
  const verifyWebhook = async (id: string): Promise<Webhook> => {
    try {
      const verified = await webhooksApi.verify(id);
      await fetchWebhooks();
      return verified;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify webhook';
      setError(message);
      throw new Error(message);
    }
  };

  // Test webhook
  const testWebhook = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await webhooksApi.test(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test webhook';
      throw new Error(message);
    }
  };

  // Delete webhook
  const deleteWebhook = async (id: string): Promise<void> => {
    try {
      await webhooksApi.delete(id);
      await fetchWebhooks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete webhook';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats
  const getStats = async () => {
    try {
      return await webhooksApi.getStats(filters);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
        totalTriggers: 0,
        totalSuccess: 0,
        totalFailures: 0,
        avgSuccessRate: 0,
      };
    }
  };

  // Initial load
  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    error,
    getWebhook,
    createWebhook,
    updateWebhook,
    enableWebhook,
    disableWebhook,
    verifyWebhook,
    testWebhook,
    deleteWebhook,
    getStats,
    refresh: fetchWebhooks,
  };
}

export default useWebhooks;
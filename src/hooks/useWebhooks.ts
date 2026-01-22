import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';
import type { Webhook, WebhookDeliveryLog, WebhookFilters, WebhookStats } from '../types/webhook';

/**
 * Hook options
 */
interface UseWebhooksOptions {
  tenant_id?: string;
  filters?: WebhookFilters;
}

/**
 * Hook for webhook management
 * @param options - Configuration options
 */
export function useWebhooks(options: UseWebhooksOptions = {}) {
  const { tenant_id: tenantId, filters } = options;
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load webhooks
   */
  const loadWebhooks = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setWebhooks([]);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useWebhooks] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useWebhooks] Loading webhooks for tenant:', tenantId);

      // Try cache first
      const cacheKey = `webhooks_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setWebhooks(cached.data);
          setTotal(cached.total);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load webhooks';
      setError(message);
      console.error('[useWebhooks] Error loading webhooks:', err);
      setLoading(false);
    }
  }, [tenantId, filters, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Build filters
      const queryFilters: Record<string, any> = {
        tenant_id: tenantId,
      };

      if (filters?.is_active !== undefined) queryFilters.is_active = filters.is_active;
      if (filters?.is_verified !== undefined) queryFilters.is_verified = filters.is_verified;
      // Note: event_type and tags filtering needs custom logic

      // Query using DataClient
      const result = await dataClient.query<Webhook>('webhooks', {
        filters: queryFilters,
        orderBy: [
          { field: 'priority', direction: 'desc' },
          { field: 'created_at', direction: 'desc' },
        ],
      });

      console.log('[useWebhooks] Loaded webhooks:', result.data.length);

      // Apply client-side filters (for array fields)
      let filteredData = result.data;
      if (filters?.event_type) {
        filteredData = filteredData.filter((w) =>
          w.event_types.includes(filters.event_type!)
        );
      }
      if (filters?.tags && filters.tags.length > 0) {
        filteredData = filteredData.filter((w) =>
          filters.tags!.some((tag) => w.tags?.includes(tag))
        );
      }

      // Update cache
      localStorage.setItem(
        `webhooks_${tenantId}`,
        JSON.stringify({
          data: filteredData,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setWebhooks(filteredData);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useWebhooks] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Create new webhook
   */
  const createWebhook = useCallback(
    async (data: Partial<Webhook>): Promise<Webhook> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useWebhooks] Creating webhook');

        // Generate secret key
        const secretKey = generateSecretKey();
        const verificationToken = generateVerificationToken();

        const newWebhook = await dataClient.create<Webhook>('webhooks', {
          tenant_id: tenantId,
          method: 'POST',
          event_types: [],
          auth_type: 'none',
          timeout_ms: 5000,
          retry_config: {
            max_retries: 3,
            retry_delay: 1000,
            backoff_multiplier: 2,
          },
          is_active: true,
          is_verified: false,
          verification_token: verificationToken,
          secret_key: secretKey,
          success_count: 0,
          failure_count: 0,
          total_count: 0,
          priority: 0,
          ...data,
        });

        console.log('[useWebhooks] Webhook created:', newWebhook._id);

        // Optimistic update
        setWebhooks((prev) => [newWebhook, ...prev]);

        // Invalidate cache
        localStorage.removeItem(`webhooks_${tenantId}`);

        return newWebhook;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create webhook';
        setError(message);
        console.error('[useWebhooks] Error creating webhook:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update webhook
   */
  const updateWebhook = useCallback(
    async (id: string, updates: Partial<Webhook>): Promise<Webhook> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useWebhooks] Updating webhook:', id);

        const updatedWebhook = await dataClient.update<Webhook>('webhooks', id, updates);

        console.log('[useWebhooks] Webhook updated');

        // Optimistic update
        setWebhooks((prev) => prev.map((w) => (w._id === id ? updatedWebhook : w)));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`webhooks_${tenantId}`);
        }

        return updatedWebhook;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update webhook';
        setError(message);
        console.error('[useWebhooks] Error updating webhook:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Delete webhook
   */
  const deleteWebhook = useCallback(
    async (id: string): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useWebhooks] Deleting webhook:', id);

        await dataClient.delete('webhooks', id);

        console.log('[useWebhooks] Webhook deleted');

        // Optimistic update
        setWebhooks((prev) => prev.filter((w) => w._id !== id));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`webhooks_${tenantId}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete webhook';
        setError(message);
        console.error('[useWebhooks] Error deleting webhook:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Test webhook
   * Sends a test payload to verify webhook is working
   */
  const testWebhook = useCallback(
    async (id: string, testPayload?: any): Promise<WebhookDeliveryLog> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      const webhook = webhooks.find((w) => w._id === id);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      setError(null);

      try {
        console.log('[useWebhooks] Testing webhook:', id);

        // TODO: This should be a server-side API call
        // For now, we simulate by creating a delivery log
        const payload = testPayload || {
          event: 'webhook.test',
          timestamp: new Date().toISOString(),
          data: { message: 'Test webhook' },
        };

        const deliveryLog = await dataClient.create<WebhookDeliveryLog>(
          'webhook_delivery_logs',
          {
            tenant_id: tenantId,
            webhook_id: id,
            event_type: 'webhook.test',
            target_url: webhook.url,
            payload,
            status_code: 200,
            is_success: true,
            latency_ms: 0,
            attempt_number: 1,
            created_at: new Date().toISOString(),
          }
        );

        console.log('[useWebhooks] Test webhook completed');

        return deliveryLog;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to test webhook';
        setError(message);
        console.error('[useWebhooks] Error testing webhook:', err);
        throw new Error(message);
      }
    },
    [tenantId, webhooks, dataClient]
  );

  /**
   * Verify webhook
   */
  const verifyWebhook = useCallback(
    async (id: string): Promise<Webhook> => {
      return updateWebhook(id, {
        is_verified: true,
        verified_at: new Date().toISOString(),
      });
    },
    [updateWebhook]
  );

  /**
   * Toggle webhook active status
   */
  const toggleActive = useCallback(
    async (id: string, isActive: boolean): Promise<Webhook> => {
      return updateWebhook(id, { is_active: isActive });
    },
    [updateWebhook]
  );

  /**
   * Enable webhook
   */
  const enableWebhook = useCallback(
    async (id: string): Promise<Webhook> => {
      return updateWebhook(id, { is_active: true });
    },
    [updateWebhook]
  );

  /**
   * Disable webhook
   */
  const disableWebhook = useCallback(
    async (id: string): Promise<Webhook> => {
      return updateWebhook(id, { is_active: false });
    },
    [updateWebhook]
  );

  /**
   * Get webhook statistics
   */
  const getStats = useCallback(async (): Promise<WebhookStats> => {
    const active = webhooks.filter(w => w.is_active).length;
    const inactive = webhooks.filter(w => !w.is_active).length;
    const verified = webhooks.filter(w => w.is_verified).length;
    const unverified = webhooks.filter(w => !w.is_verified).length;
    
    const total_triggers = webhooks.reduce((sum, w) => sum + w.total_count, 0);
    const total_success = webhooks.reduce((sum, w) => sum + w.success_count, 0);
    const total_failures = webhooks.reduce((sum, w) => sum + w.failure_count, 0);
    
    const avg_success_rate = total_triggers > 0 
      ? (total_success / total_triggers) * 100 
      : 0;
    
    const avg_response_time_ms = webhooks.length > 0
      ? webhooks.reduce((sum, w) => sum + (w.avg_response_time_ms || 0), 0) / webhooks.length
      : 0;

    return {
      total: webhooks.length,
      active,
      inactive,
      verified,
      unverified,
      total_triggers,
      total_success,
      total_failures,
      avg_success_rate,
      avg_response_time_ms,
    };
  }, [webhooks]);

  /**
   * Get delivery logs for a webhook
   */
  const getDeliveryLogs = useCallback(
    async (webhookId: string, limit: number = 50): Promise<WebhookDeliveryLog[]> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      try {
        const result = await dataClient.query<WebhookDeliveryLog>(
          'webhook_delivery_logs',
          {
            filters: { webhook_id: webhookId },
            orderBy: [{ field: 'created_at', direction: 'desc' }],
            limit,
          }
        );

        setDeliveryLogs(result.data);
        return result.data;
      } catch (err) {
        console.error('[useWebhooks] Error fetching delivery logs:', err);
        return [];
      }
    },
    [dataClient]
  );

  /**
   * Get webhook by ID
   */
  const getWebhook = useCallback(
    (id: string): Webhook | undefined => {
      return webhooks.find((w) => w._id === id);
    },
    [webhooks]
  );

  /**
   * Get webhooks by event type
   */
  const getByEventType = useCallback(
    (eventType: string): Webhook[] => {
      return webhooks.filter((w) => w.event_types.includes(eventType));
    },
    [webhooks]
  );

  /**
   * Reload webhooks from server
   */
  const refresh = useCallback(async () => {
    if (tenantId) {
      localStorage.removeItem(`webhooks_${tenantId}`);
    }
    await loadWebhooks();
  }, [tenantId, loadWebhooks]);

  // Auto-load on mount and when tenantId/dataClient change
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useWebhooks] Auto-loading webhooks for:', tenantId);
      loadWebhooks();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  // Reload when filters change
  useEffect(() => {
    if (tenantId && dataClient) {
      loadWebhooks();
    }
  }, [
    filters?.is_active,
    filters?.is_verified,
    filters?.event_type,
    filters?.tags?.join(','),
  ]);

  return {
    webhooks,
    deliveryLogs,
    loading,
    error,
    total,
    loadWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    verifyWebhook,
    toggleActive,
    enableWebhook,
    disableWebhook,
    getStats,
    getDeliveryLogs,
    getWebhook,
    getByEventType,
    refresh,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate webhook secret key
 */
function generateSecretKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return 'whsec_' + Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate verification token
 */
function generateVerificationToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
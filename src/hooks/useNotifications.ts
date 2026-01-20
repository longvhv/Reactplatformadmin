/**
 * useNotifications Hook
 * Manages system announcements/notifications for tenants
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: Uses system_announcements table (not notification instances)
 * - Announcements are tenant-scoped messages
 * - Can target specific audiences
 * - Support pinning and scheduling
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * System Announcement type (from system_announcements table)
 */
export interface SystemAnnouncement {
  _id: string;
  tenant_id: string;
  title: string;
  content: string;
  type: string; // 'info' | 'warning' | 'error' | 'success'
  priority: string; // 'low' | 'normal' | 'high' | 'urgent'
  category?: string;
  status: string; // 'draft' | 'published' | 'archived'
  is_published: boolean;
  is_pinned: boolean;
  start_date?: string;
  end_date?: string;
  published_at?: string;
  target_audience?: any; // { all: boolean, roles?: string[], departments?: string[] }
  display_location?: string[]; // ['dashboard', 'sidebar', 'banner']
  icon?: string;
  color?: string;
  link_url?: string;
  link_text?: string;
  attachments?: any;
  metadata?: any;
  view_count: number;
  click_count: number;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version: number;
}

/**
 * Filters for querying announcements
 */
export interface AnnouncementFilters {
  type?: string;
  priority?: string;
  status?: string;
  is_pinned?: boolean;
  is_published?: boolean;
  category?: string;
}

/**
 * Hook for managing system announcements/notifications
 * @param tenantId - The ID of the tenant
 * @param filters - Optional filters
 */
export function useNotifications(
  tenantId?: string,
  filters?: AnnouncementFilters
) {
  const [notifications, setNotifications] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load notifications
   */
  const loadNotifications = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setNotifications([]);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useNotifications] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useNotifications] Loading notifications for tenant:', tenantId);

      // Try cache first
      const cacheKey = `notifications_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 1 minute old (notifications should be fresh)
        if (cacheAge < 1 * 60 * 1000) {
          setNotifications(cached.data);
          setTotal(cached.total);
          setUnreadCount(cached.unreadCount);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      console.error('[useNotifications] Error loading notifications:', err);
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

      // Only show published announcements by default
      if (filters?.is_published !== false) {
        queryFilters.is_published = true;
      }

      // Apply additional filters
      if (filters?.type) queryFilters.type = filters.type;
      if (filters?.priority) queryFilters.priority = filters.priority;
      if (filters?.status) queryFilters.status = filters.status;
      if (filters?.is_pinned !== undefined) queryFilters.is_pinned = filters.is_pinned;
      if (filters?.category) queryFilters.category = filters.category;

      // Query using DataClient
      const result = await dataClient.query<SystemAnnouncement>('system_announcements', {
        filters: queryFilters,
        orderBy: [
          { field: 'is_pinned', direction: 'desc' }, // Pinned first
          { field: 'priority', direction: 'desc' }, // High priority first
          { field: 'created_at', direction: 'desc' }, // Newest first
        ],
      });

      console.log('[useNotifications] Loaded notifications:', result.data.length);

      // Filter by date range (active announcements)
      const now = new Date();
      const activeNotifications = result.data.filter((n) => {
        if (n.start_date && new Date(n.start_date) > now) return false;
        if (n.end_date && new Date(n.end_date) < now) return false;
        return true;
      });

      // Calculate unread count (simplified - based on view_count)
      // TODO: Implement proper user-specific read tracking
      const unread = activeNotifications.filter((n) => n.view_count === 0).length;

      // Update cache
      localStorage.setItem(
        `notifications_${tenantId}`,
        JSON.stringify({
          data: activeNotifications,
          total: result.total,
          unreadCount: unread,
          timestamp: Date.now(),
        })
      );

      // Update state
      setNotifications(activeNotifications);
      setTotal(result.total);
      setUnreadCount(unread);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useNotifications] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Create new announcement
   */
  const createNotification = useCallback(
    async (data: Partial<SystemAnnouncement>): Promise<SystemAnnouncement> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useNotifications] Creating notification');

        const newNotification = await dataClient.create<SystemAnnouncement>(
          'system_announcements',
          {
            tenant_id: tenantId,
            type: 'info',
            priority: 'normal',
            status: 'draft',
            is_published: false,
            is_pinned: false,
            view_count: 0,
            click_count: 0,
            target_audience: { all: true },
            display_location: ['dashboard'],
            ...data,
          }
        );

        console.log('[useNotifications] Notification created:', newNotification._id);

        // Optimistic update
        setNotifications((prev) => [newNotification, ...prev]);

        // Invalidate cache
        localStorage.removeItem(`notifications_${tenantId}`);

        return newNotification;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create notification';
        setError(message);
        console.error('[useNotifications] Error creating notification:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update announcement
   */
  const updateNotification = useCallback(
    async (
      id: string,
      updates: Partial<SystemAnnouncement>
    ): Promise<SystemAnnouncement> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useNotifications] Updating notification:', id);

        const updatedNotification = await dataClient.update<SystemAnnouncement>(
          'system_announcements',
          id,
          updates
        );

        console.log('[useNotifications] Notification updated');

        // Optimistic update
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? updatedNotification : n))
        );

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`notifications_${tenantId}`);
        }

        return updatedNotification;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update notification';
        setError(message);
        console.error('[useNotifications] Error updating notification:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Delete announcement
   */
  const deleteNotification = useCallback(
    async (id: string): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useNotifications] Deleting notification:', id);

        await dataClient.delete('system_announcements', id);

        console.log('[useNotifications] Notification deleted');

        // Optimistic update
        setNotifications((prev) => prev.filter((n) => n._id !== id));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`notifications_${tenantId}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete notification';
        setError(message);
        console.error('[useNotifications] Error deleting notification:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Publish announcement
   */
  const publishNotification = useCallback(
    async (id: string): Promise<SystemAnnouncement> => {
      return updateNotification(id, {
        status: 'published',
        is_published: true,
        published_at: new Date().toISOString(),
      });
    },
    [updateNotification]
  );

  /**
   * Pin/unpin announcement
   */
  const togglePin = useCallback(
    async (id: string, isPinned: boolean): Promise<SystemAnnouncement> => {
      return updateNotification(id, { is_pinned: isPinned });
    },
    [updateNotification]
  );

  /**
   * Mark notification as viewed
   */
  const markAsViewed = useCallback(
    async (id: string): Promise<void> => {
      const notification = notifications.find((n) => n._id === id);
      if (!notification) return;

      try {
        await updateNotification(id, {
          view_count: notification.view_count + 1,
        });

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('[useNotifications] Error marking as viewed:', err);
      }
    },
    [notifications, updateNotification]
  );

  /**
   * Mark notification as clicked
   */
  const markAsClicked = useCallback(
    async (id: string): Promise<void> => {
      const notification = notifications.find((n) => n._id === id);
      if (!notification) return;

      try {
        await updateNotification(id, {
          click_count: notification.click_count + 1,
        });
      } catch (err) {
        console.error('[useNotifications] Error marking as clicked:', err);
      }
    },
    [notifications, updateNotification]
  );

  /**
   * Get notification by ID
   */
  const getNotification = useCallback(
    (id: string): SystemAnnouncement | undefined => {
      return notifications.find((n) => n._id === id);
    },
    [notifications]
  );

  /**
   * Get pinned notifications
   */
  const getPinned = useCallback((): SystemAnnouncement[] => {
    return notifications.filter((n) => n.is_pinned);
  }, [notifications]);

  /**
   * Get notifications by priority
   */
  const getByPriority = useCallback(
    (priority: string): SystemAnnouncement[] => {
      return notifications.filter((n) => n.priority === priority);
    },
    [notifications]
  );

  /**
   * Reload notifications from server
   */
  const refresh = useCallback(async () => {
    if (tenantId) {
      localStorage.removeItem(`notifications_${tenantId}`);
    }
    await loadNotifications();
  }, [tenantId, loadNotifications]);

  // Auto-load on mount and when tenantId/dataClient change
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useNotifications] Auto-loading notifications for:', tenantId);
      loadNotifications();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  // Reload when filters change
  useEffect(() => {
    if (tenantId && dataClient) {
      loadNotifications();
    }
  }, [
    filters?.type,
    filters?.priority,
    filters?.status,
    filters?.is_pinned,
    filters?.is_published,
    filters?.category,
  ]);

  return {
    notifications,
    loading,
    error,
    total,
    unreadCount,
    loadNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    publishNotification,
    togglePin,
    markAsViewed,
    markAsClicked,
    getNotification,
    getPinned,
    getByPriority,
    refresh,
  };
}

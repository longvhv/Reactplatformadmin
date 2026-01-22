/**
 * useSystemAnnouncements Hook
 * Hook for managing system announcements
 */

import { useState, useEffect, useCallback } from 'react';
import {
  systemAnnouncementsApi,
  SystemAnnouncement,
  CreateSystemAnnouncementRequest,
  UpdateSystemAnnouncementRequest,
  SystemAnnouncementFilters,
} from '../api/systemAnnouncementsApi';

interface UseSystemAnnouncementsOptions extends SystemAnnouncementFilters {
  autoLoad?: boolean;
}

export function useSystemAnnouncements(options: UseSystemAnnouncementsOptions = {}) {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await systemAnnouncementsApi.getAll(options);
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  const createAnnouncement = async (data: CreateSystemAnnouncementRequest) => {
    try {
      const newAnnouncement = await systemAnnouncementsApi.create(data);
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      return newAnnouncement;
    } catch (err) {
      throw err;
    }
  };

  const updateAnnouncement = async (id: string, data: UpdateSystemAnnouncementRequest) => {
    try {
      const updated = await systemAnnouncementsApi.update(id, data);
      setAnnouncements(prev => prev.map(a => a._id === id ? updated : a));
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await systemAnnouncementsApi.delete(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      throw err;
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    try {
      const updated = isPinned 
        ? await systemAnnouncementsApi.unpin(id) 
        : await systemAnnouncementsApi.pin(id);
      setAnnouncements(prev => prev.map(a => a._id === id ? updated : a));
    } catch (err) {
      throw err;
    }
  };

  const togglePublish = async (id: string, isPublished: boolean) => {
     try {
       const updated = isPublished
         ? await systemAnnouncementsApi.unpublish(id)
         : await systemAnnouncementsApi.publish(id);
       setAnnouncements(prev => prev.map(a => a._id === id ? updated : a));
     } catch (err) {
       throw err;
     }
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadAnnouncements();
    }
  }, [loadAnnouncements]);

  return {
    announcements,
    loading,
    error,
    loadAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    togglePublish
  };
}

export function useSystemAnnouncement(id: string | undefined) {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await systemAnnouncementsApi.getById(id);
      setAnnouncement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { announcement, loading, error, refresh };
}

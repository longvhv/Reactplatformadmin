/**
 * useAnnouncements Hook
 * Hook for managing system announcements using real API
 */

import { useState, useEffect } from 'react';
import { 
  systemAnnouncementApi, 
  SystemAnnouncement,
  SystemAnnouncementFilters 
} from '../api/systemAnnouncementsApi';

interface UseAnnouncementsOptions {
  autoLoad?: boolean;
  filters?: SystemAnnouncementFilters;
}

export function useAnnouncements(options: UseAnnouncementsOptions = {}) {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading system announcements...');
      
      const data = await systemAnnouncementApi.getAll(options.filters);
      
      console.log('✅ Loaded system announcements:', data.length, 'items');
      setAnnouncements(data);
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load announcements';
      console.error('❌ Error loading announcements:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      console.log('🗑️ Deleting announcement:', id);
      
      await systemAnnouncementApi.delete(id);
      
      console.log('✅ Announcement deleted');
      
      // Remove from local state
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete announcement';
      console.error('❌ Error deleting announcement:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const announcement = announcements.find(a => a._id === id);
      if (!announcement) {
        throw new Error('Announcement not found');
      }

      const newStatus = announcement.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      console.log('🔄 Toggling announcement status:', id, newStatus);
      
      await systemAnnouncementApi.update(id, {
        status: newStatus,
        version: announcement.version,
      });
      
      console.log('✅ Announcement status toggled');
      
      // Update local state
      setAnnouncements(prev =>
        prev.map(a =>
          a._id === id
            ? { ...a, status: newStatus, version: a.version + 1, updated_at: new Date().toISOString() }
            : a
        )
      );
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to toggle status';
      console.error('❌ Error toggling status:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (options.autoLoad) {
      loadAnnouncements();
    }
  }, [options.autoLoad]);

  return {
    announcements,
    loading,
    error,
    loadAnnouncements,
    deleteAnnouncement,
    toggleStatus,
  };
}
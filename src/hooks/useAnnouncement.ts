/**
 * useAnnouncement Hook
 * Hook for managing single announcement
 */

import { useState, useEffect } from 'react';
import type { SystemAnnouncement } from './useAnnouncements';

export function useAnnouncement(id?: string) {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncement = async () => {
    if (!id || id === 'new') return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock data
      const mockAnnouncement: SystemAnnouncement = {
        _id: id,
        titles: {
          en: 'System Maintenance',
          vi: 'Bảo trì hệ thống',
          ja: 'システムメンテナンス',
        },
        contents: {
          en: 'The system will be under maintenance from 2:00 AM to 4:00 AM UTC. During this time, all services will be unavailable.',
          vi: 'Hệ thống sẽ được bảo trì từ 2:00 sáng đến 4:00 sáng UTC. Trong thời gian này, tất cả các dịch vụ sẽ không khả dụng.',
          ja: 'システムは午前2時から午前4時（UTC）までメンテナンス中です。この間、すべてのサービスは利用できません。',
        },
        type: 'WARNING',
        target_regions: ['APAC', 'NA', 'EU'],
        target_plans: ['ENTERPRISE', 'BUSINESS'],
        is_active: true,
        is_local_time: false,
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        version: 1,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      setAnnouncement(mockAnnouncement);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };

  const updateAnnouncement = async (data: Partial<SystemAnnouncement>) => {
    if (!announcement) return;
    
    try {
      const updated = {
        ...announcement,
        ...data,
        updated_at: new Date().toISOString(),
        version: announcement.version + 1,
      };
      setAnnouncement(updated);
    } catch (err) {
      throw new Error('Failed to update announcement');
    }
  };

  const deleteAnnouncement = async () => {
    try {
      setAnnouncement(null);
    } catch (err) {
      throw new Error('Failed to delete announcement');
    }
  };

  const toggleActive = async () => {
    if (!announcement) return;
    
    try {
      const updated = {
        ...announcement,
        is_active: !announcement.is_active,
        updated_at: new Date().toISOString(),
        version: announcement.version + 1,
      };
      setAnnouncement(updated);
    } catch (err) {
      throw new Error('Failed to toggle active status');
    }
  };

  useEffect(() => {
    if (id && id !== 'new') {
      loadAnnouncement();
    }
  }, [id]);

  return {
    announcement,
    loading,
    error,
    updateAnnouncement,
    deleteAnnouncement,
    toggleActive,
  };
}
/**
 * useAnnouncements Hook
 * Hook for managing announcements
 */

import { useState, useEffect } from 'react';

export interface SystemAnnouncement {
  _id: string;
  titles: Record<string, string>;
  contents: Record<string, string>;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'PROMOTION';
  target_regions?: string[];
  target_plans?: string[];
  is_active: boolean;
  is_local_time: boolean;
  start_at: string;
  end_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface UseAnnouncementsOptions {
  autoLoad?: boolean;
  type?: string;
  isActive?: boolean;
}

export function useAnnouncements(options: UseAnnouncementsOptions = {}) {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data
      const mockAnnouncements: SystemAnnouncement[] = [
        {
          _id: '1',
          titles: {
            en: 'System Maintenance',
            vi: 'Bảo trì hệ thống',
          },
          contents: {
            en: 'The system will be under maintenance from 2:00 AM to 4:00 AM UTC.',
            vi: 'Hệ thống sẽ được bảo trì từ 2:00 sáng đến 4:00 sáng UTC.',
          },
          type: 'WARNING',
          target_regions: ['APAC', 'NA'],
          target_plans: ['ENTERPRISE'],
          is_active: true,
          is_local_time: false,
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          _id: '2',
          titles: {
            en: 'New Feature Release',
            vi: 'Tính năng mới',
          },
          contents: {
            en: 'We are excited to announce the release of our new dashboard feature!',
            vi: 'Chúng tôi vui mừng thông báo tính năng dashboard mới!',
          },
          type: 'INFO',
          is_active: true,
          is_local_time: false,
          start_at: new Date().toISOString(),
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          _id: '3',
          titles: {
            en: 'Security Alert',
            vi: 'Cảnh báo bảo mật',
          },
          contents: {
            en: 'Please update your password immediately.',
            vi: 'Vui lòng cập nhật mật khẩu ngay lập tức.',
          },
          type: 'CRITICAL',
          is_active: true,
          is_local_time: false,
          start_at: new Date().toISOString(),
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setAnnouncements(mockAnnouncements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      throw new Error('Failed to delete announcement');
    }
  };

  const updateAnnouncement = async (id: string, data: Partial<SystemAnnouncement>) => {
    try {
      setAnnouncements(prev => 
        prev.map(a => 
          a._id === id 
            ? { ...a, ...data, updated_at: new Date().toISOString(), version: a.version + 1 }
            : a
        )
      );
    } catch (err) {
      throw new Error('Failed to update announcement');
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
    updateAnnouncement,
  };
}

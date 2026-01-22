/**
 * useApplication Hook
 * Hook for single application management
 * ✅ UPDATED 2026-01-15: Now fetches real data from Supabase via applicationsApi
 */

import { useState, useEffect } from 'react';
import { applicationsApi, Application } from '@/api/applicationsApi';
import { toast } from 'sonner@2.0.3';

export function useApplication(id?: string) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      loadApplication(id);
    }
  }, [id]);

  const loadApplication = async (appId: string) => {
    if (appId === 'new') return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useApplication] Fetching application:', appId);
      const data = await applicationsApi.getById(appId);
      console.log('✅ [useApplication] Application loaded:', data);
      setApplication(data);
    } catch (err: any) {
      console.error('❌ [useApplication] Error fetching application:', err);
      const errorMsg = err?.message || 'Failed to load application';
      setError(errorMsg);
      toast.error('Không thể tải dữ liệu ứng dụng');
    } finally {
      setLoading(false);
    }
  };

  const updateApplication = async (data: Partial<Application>) => {
    if (!application) return;
    
    try {
      console.log('🔍 [useApplication] Updating application:', application._id, data);
      const updated = await applicationsApi.update(application._id, {
        ...data,
        version: application.version,  // ✅ Use 'version' (number)
      });
      console.log('✅ [useApplication] Application updated:', updated);
      setApplication(updated);
      toast.success('Đã cập nhật ứng dụng');
    } catch (err: any) {
      console.error('❌ [useApplication] Error updating application:', err);
      toast.error('Không thể cập nhật ứng dụng');
      throw err;
    }
  };

  const deleteApplication = async () => {
    if (!application) return;
    
    try {
      console.log('🔍 [useApplication] Deleting application:', application._id);
      await applicationsApi.delete(application._id);
      console.log('✅ [useApplication] Application deleted');
      toast.success('Đã xóa ứng dụng');
    } catch (err: any) {
      console.error('❌ [useApplication] Error deleting application:', err);
      toast.error('Không thể xóa ứng dụng');
      throw err;
    }
  };

  const toggleActive = async () => {
    if (!application) return;
    
    try {
      console.log('🔍 [useApplication] Toggling is_active:', application._id, !application.is_active);
      const updated = await applicationsApi.update(application._id, {
        is_active: !application.is_active,  // ✅ Use 'is_active' boolean
        version: application.version,       // ✅ Use 'version' (number)
      });
      console.log('✅ [useApplication] Status toggled:', updated);
      setApplication(updated);
      toast.success(`Đã ${updated.is_active ? 'kích hoạt' : 'vô hiệu hóa'} ứng dụng`);
    } catch (err: any) {
      console.error('❌ [useApplication] Error toggling status:', err);
      toast.error('Không thể thay đổi trạng thái ứng dụng');
      throw err;
    }
  };

  return {
    application,
    loading,
    error,
    updateApplication,
    deleteApplication,
    toggleActive,
    refresh: () => id && loadApplication(id),
  };
}
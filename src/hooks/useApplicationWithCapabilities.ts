/**
 * useApplicationWithCapabilities Hook
 * Fetches application with all its capabilities
 */

import { useState, useEffect } from 'react';
import { applicationsApi, Application } from '../api/applicationsApi';
import { appCapabilitiesApi, AppCapability } from '../api/appCapabilitiesApi';
import { toast } from 'sonner@2.0.3';

interface ApplicationWithCapabilities extends Application {
  capabilities: AppCapability[];
}

export function useApplicationWithCapabilities(code?: string) {
  const [data, setData] = useState<ApplicationWithCapabilities | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (appCode: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useApplicationWithCapabilities] Fetching application:', appCode);
      
      // Fetch application first
      const app = await applicationsApi.getById(appCode);
      
      // Then fetch its capabilities
      const capabilities = await appCapabilitiesApi.getAll({
        app_id: app._id,
      });
      
      console.log('✅ [useApplicationWithCapabilities] Data loaded:', { app, capabilities });
      
      setData({
        ...app,
        capabilities: capabilities || [],
      });
    } catch (err: any) {
      console.error('❌ [useApplicationWithCapabilities] Error:', err);
      const errorMsg = err?.message || 'Failed to load application data';
      setError(errorMsg);
      toast.error('Không thể tải dữ liệu ứng dụng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code && code !== 'new') {
      loadData(code);
    }
  }, [code]);

  const refresh = () => {
    if (code) {
      loadData(code);
    }
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
}
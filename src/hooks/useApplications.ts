/**
 * useApplications Hook
 * Hook for applications list management
 * 
 * ✅ UPDATED 2026-01-15: Now uses real Supabase data via applicationsApi
 */

import { useState, useEffect } from 'react';
import { applicationsApi, Application } from '../api/applicationsApi';

interface UseApplicationsOptions {
  autoLoad?: boolean;
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getAll();
      setApplications(data);
    } catch (err: any) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Failed to load applications');
      setApplications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.autoLoad) {
      loadApplications();
    }
  }, [options.autoLoad]);

  const deleteApplication = async (id: string) => {
    try {
      await applicationsApi.delete(id);
      setApplications(applications.filter(app => app._id !== id));
    } catch (err: any) {
      console.error('Error deleting application:', err);
      throw err;
    }
  };

  const updateApplication = async (id: string, data: Partial<Application>) => {
    try {
      // For simple updates like status, we need version_number
      const app = applications.find(a => a._id === id);
      if (!app) throw new Error('Application not found');
      
      const updateData: any = {
        ...data,
        version_number: app.version_number,
      };
      
      const updated = await applicationsApi.update(id, updateData);
      setApplications(applications.map(app => 
        app._id === id ? updated : app
      ));
    } catch (err: any) {
      console.error('Error updating application:', err);
      throw err;
    }
  };

  return {
    applications,
    loading,
    error,
    loadApplications,
    deleteApplication,
    updateApplication,
  };
}
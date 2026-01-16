/**
 * useApplications Hook
 * Hook for applications list management
 * 
 * ✅ UPDATED 2026-01-15: Now uses real Supabase data via applicationsApi
 * ✅ IMPROVED 2026-01-15: Added support for:
 *    - Audit fields (created_by, updated_by)
 *    - Soft delete (deleted_at, deleted_by)
 *    - Version conflict handling
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  applicationsApi, 
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from '../api/applicationsApi';

interface UseApplicationsOptions {
  autoLoad?: boolean;
  includeDeleted?: boolean;
  isActive?: boolean;
}

export interface ApplicationStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load applications with filters
  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getAll({
        include_deleted: options.includeDeleted,
        is_active: options.isActive,
      });
      setApplications(data);
    } catch (err: any) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Failed to load applications');
      setApplications([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [options.includeDeleted, options.isActive]);

  useEffect(() => {
    if (options.autoLoad) {
      loadApplications();
    }
  }, [options.autoLoad, loadApplications]);

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create new application with audit trail
   * ✅ IMPROVEMENT 1: Supports created_by field
   */
  const createApplication = async (
    data: CreateApplicationRequest,
    createdBy?: string
  ): Promise<Application> => {
    try {
      const created = await applicationsApi.create({
        ...data,
        created_by: createdBy,
      });
      
      // Add to local state
      setApplications(prev => [...prev, created]);
      
      return created;
    } catch (err: any) {
      console.error('Error creating application:', err);
      throw err;
    }
  };

  /**
   * Update application with version conflict handling
   * ✅ IMPROVEMENT 1: Supports updated_by field
   * ✅ IMPROVEMENT 3: Automatic retry on version conflict
   */
  const updateApplication = async (
    id: string, 
    data: Omit<UpdateApplicationRequest, 'version'>,
    updatedBy?: string
  ): Promise<Application> => {
    try {
      // Use updateWithRetry for automatic version conflict handling
      const updated = await applicationsApi.updateWithRetry(id, {
        ...data,
        updated_by: updatedBy,
      });
      
      // Update local state
      setApplications(prev => 
        prev.map(app => app._id === id ? updated : app)
      );
      
      return updated;
    } catch (err: any) {
      console.error('Error updating application:', err);
      
      // Check if version conflict
      if (err.message?.includes('version') || err.status === 409) {
        setError('Version conflict: Application was modified by another user. Please refresh and try again.');
      }
      
      throw err;
    }
  };

  /**
   * Update application without retry (manual version handling)
   * ✅ IMPROVEMENT 3: Requires explicit version number
   */
  const updateApplicationWithVersion = async (
    id: string,
    data: UpdateApplicationRequest,
    updatedBy?: string
  ): Promise<Application> => {
    try {
      const updated = await applicationsApi.update(id, {
        ...data,
        updated_by: updatedBy,
      });
      
      setApplications(prev => 
        prev.map(app => app._id === id ? updated : app)
      );
      
      return updated;
    } catch (err: any) {
      console.error('Error updating application:', err);
      throw err;
    }
  };

  // ==================== SOFT DELETE OPERATIONS ====================

  /**
   * Soft delete application
   * ✅ IMPROVEMENT 2: Sets deleted_at and deleted_by
   */
  const deleteApplication = async (id: string, deletedBy?: string): Promise<void> => {
    try {
      await applicationsApi.softDelete(id, deletedBy);
      
      // Remove from local state or mark as deleted
      if (options.includeDeleted) {
        // Refresh to show deleted_at timestamp
        await loadApplications();
      } else {
        setApplications(prev => prev.filter(app => app._id !== id));
      }
    } catch (err: any) {
      console.error('Error deleting application:', err);
      throw err;
    }
  };

  /**
   * Restore soft-deleted application
   * ✅ IMPROVEMENT 2: Clears deleted_at and deleted_by
   */
  const restoreApplication = async (id: string): Promise<void> => {
    try {
      await applicationsApi.restore(id);
      
      // Refresh to update state
      await loadApplications();
    } catch (err: any) {
      console.error('Error restoring application:', err);
      throw err;
    }
  };

  /**
   * Permanently delete application (hard delete)
   * ⚠️ WARNING: This cannot be undone
   */
  const hardDeleteApplication = async (id: string): Promise<void> => {
    try {
      await applicationsApi.hardDelete(id);
      
      // Remove from local state
      setApplications(prev => prev.filter(app => app._id !== id));
    } catch (err: any) {
      console.error('Error hard deleting application:', err);
      throw err;
    }
  };

  // ==================== QUERY METHODS ====================

  /**
   * Get application by ID
   */
  const getApplicationById = useCallback((id: string): Application | undefined => {
    return applications.find(app => app._id === id);
  }, [applications]);

  /**
   * Get application by code
   */
  const getApplicationByCode = useCallback((code: string): Application | undefined => {
    return applications.find(app => app.code === code);
  }, [applications]);

  /**
   * Get only active applications
   */
  const getActiveApplications = useCallback((): Application[] => {
    return applications.filter(app => app.is_active && !app.deleted_at);
  }, [applications]);

  /**
   * Get only inactive applications
   */
  const getInactiveApplications = useCallback((): Application[] => {
    return applications.filter(app => !app.is_active && !app.deleted_at);
  }, [applications]);

  /**
   * Get only deleted applications
   */
  const getDeletedApplications = useCallback((): Application[] => {
    return applications.filter(app => app.deleted_at !== null);
  }, [applications]);

  // ==================== STATISTICS ====================

  /**
   * Calculate statistics
   */
  const getStats = useCallback((): ApplicationStats => {
    const total = applications.length;
    const active = applications.filter(app => app.is_active && !app.deleted_at).length;
    const inactive = applications.filter(app => !app.is_active && !app.deleted_at).length;
    const deleted = applications.filter(app => app.deleted_at !== null).length;

    return { total, active, inactive, deleted };
  }, [applications]);

  // ==================== VERSION HANDLING ====================

  /**
   * Check if application has version conflict
   * ✅ IMPROVEMENT 3: Detect version conflicts
   */
  const checkVersionConflict = async (
    id: string, 
    expectedVersion: number
  ): Promise<boolean> => {
    try {
      return await applicationsApi.hasVersionConflict(id, expectedVersion);
    } catch (err: any) {
      console.error('Error checking version conflict:', err);
      return true; // Assume conflict on error
    }
  };

  /**
   * Get latest version number
   * ✅ IMPROVEMENT 3: Fetch current version
   */
  const getLatestVersion = async (id: string): Promise<number> => {
    try {
      return await applicationsApi.getLatestVersion(id);
    } catch (err: any) {
      console.error('Error getting latest version:', err);
      throw err;
    }
  };

  /**
   * Refresh single application (to get latest version)
   */
  const refreshApplication = async (id: string): Promise<Application> => {
    try {
      const updated = await applicationsApi.getById(id);
      
      setApplications(prev => 
        prev.map(app => app._id === id ? updated : app)
      );
      
      return updated;
    } catch (err: any) {
      console.error('Error refreshing application:', err);
      throw err;
    }
  };

  // ==================== STATUS OPERATIONS ====================

  /**
   * Toggle application active status
   */
  const toggleActive = async (
    id: string, 
    updatedBy?: string
  ): Promise<void> => {
    try {
      const app = getApplicationById(id);
      if (!app) throw new Error('Application not found');

      await updateApplication(
        id, 
        { is_active: !app.is_active },
        updatedBy
      );
    } catch (err: any) {
      console.error('Error toggling application status:', err);
      throw err;
    }
  };

  return {
    // State
    applications,
    loading,
    error,

    // CRUD Operations
    createApplication,
    updateApplication,
    updateApplicationWithVersion,
    deleteApplication,
    
    // Soft Delete Operations
    restoreApplication,
    hardDeleteApplication,
    
    // Query Methods
    getApplicationById,
    getApplicationByCode,
    getActiveApplications,
    getInactiveApplications,
    getDeletedApplications,
    
    // Statistics
    getStats,
    
    // Version Handling
    checkVersionConflict,
    getLatestVersion,
    refreshApplication,
    
    // Status Operations
    toggleActive,
    
    // Refresh
    loadApplications,
    refresh: loadApplications,
  };
}

export default useApplications;

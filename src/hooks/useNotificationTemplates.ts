/**
 * useNotificationTemplates Hook
 * Manages notification templates with CRUD operations and statistics
 * ✅ CREATED 2026-01-15: Complete hook implementation
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  notificationTemplateApi, 
  NotificationTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  TemplateFilters 
} from '../api/notificationTemplateApi';

export interface TemplateStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  archived: number;
  byType: {
    email: number;
    sms: number;
    push: number;
    inApp: number;
    webhook: number;
  };
  totalUsage: number;
  totalSuccess: number;
  totalFailure: number;
  successRate: number;
}

export function useNotificationTemplates(filters?: TemplateFilters) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationTemplateApi.getAll(filters);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch templates');
      console.error('Error fetching notification templates:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (data: CreateTemplateRequest): Promise<NotificationTemplate> => {
    try {
      const created = await notificationTemplateApi.create(data);
      await fetchTemplates();
      return created;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create template';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const updateTemplate = async (
    id: string, 
    data: UpdateTemplateRequest
  ): Promise<NotificationTemplate> => {
    try {
      const updated = await notificationTemplateApi.update(id, data);
      await fetchTemplates();
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update template';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    try {
      await notificationTemplateApi.delete(id);
      await fetchTemplates();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete template';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getTemplateById = useCallback((id: string): NotificationTemplate | undefined => {
    return templates.find(t => t._id === id);
  }, [templates]);

  const getTemplateByCode = useCallback((code: string): NotificationTemplate | undefined => {
    return templates.find(t => t.template_code === code);
  }, [templates]);

  const getActiveTemplates = useCallback((): NotificationTemplate[] => {
    return templates.filter(t => t.status === 'active');
  }, [templates]);

  const getSystemTemplates = useCallback((): NotificationTemplate[] => {
    return templates.filter(t => t.is_system_template);
  }, [templates]);

  const getEditableTemplates = useCallback((): NotificationTemplate[] => {
    return templates.filter(t => t.is_editable !== false);
  }, [templates]);

  const getByType = useCallback((type: string): NotificationTemplate[] => {
    return templates.filter(t => t.notification_type === type);
  }, [templates]);

  const getByCategory = useCallback((category: string): NotificationTemplate[] => {
    return templates.filter(t => t.category === category);
  }, [templates]);

  const getStats = useCallback((): TemplateStats => {
    const total = templates.length;
    const active = templates.filter(t => t.status === 'active').length;
    const inactive = templates.filter(t => t.status === 'inactive').length;
    const draft = templates.filter(t => t.status === 'draft').length;
    const archived = templates.filter(t => t.status === 'archived').length;

    const byType = {
      email: templates.filter(t => t.notification_type === 'email').length,
      sms: templates.filter(t => t.notification_type === 'sms').length,
      push: templates.filter(t => t.notification_type === 'push').length,
      inApp: templates.filter(t => t.notification_type === 'in-app').length,
      webhook: templates.filter(t => t.notification_type === 'webhook').length,
    };

    const totalUsage = templates.reduce((sum, t) => sum + (t.usage_count || 0), 0);
    const totalSuccess = templates.reduce((sum, t) => sum + (t.success_count || 0), 0);
    const totalFailure = templates.reduce((sum, t) => sum + (t.failure_count || 0), 0);
    const successRate = totalUsage > 0 ? (totalSuccess / totalUsage) * 100 : 0;

    return {
      total,
      active,
      inactive,
      draft,
      archived,
      byType,
      totalUsage,
      totalSuccess,
      totalFailure,
      successRate,
    };
  }, [templates]);

  const cloneTemplate = async (
    sourceId: string, 
    newCode: string, 
    newName: string
  ): Promise<NotificationTemplate> => {
    try {
      const source = getTemplateById(sourceId);
      if (!source) {
        throw new Error('Source template not found');
      }

      const cloned = await createTemplate({
        ...source,
        _id: undefined as any,
        template_code: newCode,
        template_name: newName,
        parent_template_id: sourceId,
        status: 'draft',
        usage_count: undefined,
        last_used_at: undefined,
        success_count: undefined,
        failure_count: undefined,
        created_at: undefined as any,
        updated_at: undefined as any,
        version: undefined as any,
      });

      return cloned;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to clone template';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const validateCode = useCallback((
    code: string, 
    excludeId?: string
  ): boolean => {
    const exists = templates.some(t => 
      t.template_code === code && (!excludeId || t._id !== excludeId)
    );
    return !exists;
  }, [templates]);

  const incrementUsage = async (id: string): Promise<void> => {
    try {
      const template = getTemplateById(id);
      if (!template) throw new Error('Template not found');

      await updateTemplate(id, {
        usage_count: (template.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        version: template.version,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to increment usage';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const recordSuccess = async (id: string): Promise<void> => {
    try {
      const template = getTemplateById(id);
      if (!template) throw new Error('Template not found');

      await updateTemplate(id, {
        success_count: (template.success_count || 0) + 1,
        version: template.version,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to record success';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const recordFailure = async (id: string): Promise<void> => {
    try {
      const template = getTemplateById(id);
      if (!template) throw new Error('Template not found');

      await updateTemplate(id, {
        failure_count: (template.failure_count || 0) + 1,
        version: template.version,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to record failure';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  return {
    // State
    templates,
    loading,
    error,

    // CRUD Operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    
    // Query Methods
    getTemplateById,
    getTemplateByCode,
    getActiveTemplates,
    getSystemTemplates,
    getEditableTemplates,
    getByType,
    getByCategory,
    
    // Statistics
    getStats,
    
    // Utilities
    validateCode,
    incrementUsage,
    recordSuccess,
    recordFailure,
    
    // Refresh
    refresh: fetchTemplates,
  };
}

export default useNotificationTemplates;

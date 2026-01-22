/**
 * useNotificationTemplates Hook
 * Manages notification templates with CRUD operations and statistics
 * 
 * ✅ REFACTORED 2026-01-20: Aligned with new strict schema API
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  notificationTemplateApi, 
  NotificationTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  TemplateFilters,
  TemplateStatus
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
    'in-app': number;
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
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (data: CreateTemplateRequest): Promise<NotificationTemplate> => {
    try {
      const created = await notificationTemplateApi.create(data);
      setTemplates(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create template';
      throw new Error(errorMsg);
    }
  };

  const updateTemplate = async (
    id: string, 
    data: UpdateTemplateRequest
  ): Promise<NotificationTemplate> => {
    try {
      const updated = await notificationTemplateApi.update(id, data);
      setTemplates(prev => prev.map(t => t._id === id ? updated : t));
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update template';
      throw new Error(errorMsg);
    }
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    try {
      await notificationTemplateApi.delete(id);
      setTemplates(prev => prev.filter(t => t._id !== id));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete template';
      throw new Error(errorMsg);
    }
  };

  const getTemplateById = useCallback((id: string): NotificationTemplate | undefined => {
    return templates.find(t => t._id === id);
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
      'in-app': templates.filter(t => t.notification_type === 'in-app').length,
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

  const cloneTemplate = async (sourceId: string, newCode: string, newName: string): Promise<NotificationTemplate> => {
    try {
      const source = getTemplateById(sourceId);
      if (!source) throw new Error('Source template not found');

      // Prepare clone data based on CreateTemplateRequest
      // We must omit system fields
      const { 
        _id, 
        created_at, created_by, 
        updated_at, updated_by, 
        deleted_at, deleted_by,
        version,
        ...rest 
      } = source;

      const cloneData: CreateTemplateRequest = {
        ...rest,
        template_code: newCode,
        template_name: newName,
        parent_template_id: sourceId,
        status: 'draft',
        usage_count: 0,
        success_count: 0,
        failure_count: 0,
        // Reset timestamps or let API handle default
      };

      const cloned = await createTemplate(cloneData);
      return cloned;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to clone template');
    }
  };

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
    getStats,
    cloneTemplate,
    refresh: fetchTemplates,
  };
}

export function useNotificationTemplate(id: string | undefined) {
  const [template, setTemplate] = useState<NotificationTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await notificationTemplateApi.getById(id);
      setTemplate(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch template');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { template, loading, error, refresh };
}

export default useNotificationTemplates;

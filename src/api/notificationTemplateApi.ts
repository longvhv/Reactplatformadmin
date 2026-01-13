/**
 * Notification Templates API Client
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;
const STORAGE_KEY = 'notification_templates_cache';

export type NotificationType = 'email' | 'sms' | 'push' | 'in-app' | 'webhook';
export type TemplateStatus = 'active' | 'inactive' | 'draft' | 'archived';
export type TemplatePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationTemplate {
  _id?: string;
  tenant_id: string;
  template_code: string;
  template_name: string;
  description?: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  notification_type: NotificationType;
  category?: string;
  priority?: TemplatePriority;
  language_code?: string;
  variables?: any;
  sample_data?: any;
  delivery_channels?: string[];
  send_immediately?: boolean;
  scheduled_send_time?: string;
  status: TemplateStatus;
  is_system_template?: boolean;
  is_editable?: boolean;
  usage_count?: number;
  last_used_at?: string;
  success_count?: number;
  failure_count?: number;
  version?: number;
  parent_template_id?: string;
  attachments?: any;
  headers?: any;
  metadata?: any;
  tags?: string[];
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface TemplateFilters {
  tenant_id?: string;
  status?: TemplateStatus;
  notification_type?: NotificationType;
  category?: string;
  language?: string;
  search?: string;
}

export interface TemplateStatistics {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  by_type: {
    email: number;
    sms: number;
    push: number;
    'in-app': number;
    webhook: number;
  };
  by_category: {
    system: number;
    marketing: number;
    transactional: number;
    alert: number;
    reminder: number;
  };
  total_usage: number;
  total_success: number;
  total_failure: number;
}

const getFromLocalStorage = (): NotificationTemplate[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

const saveToLocalStorage = (templates: NotificationTemplate[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const notificationTemplateApi = {
  getAll: async (filters?: TemplateFilters): Promise<NotificationTemplate[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.notification_type) params.append('notification_type', filters.notification_type);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.language) params.append('language', filters.language);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_BASE}/notification-templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const data = result.data || [];
      saveToLocalStorage(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      return getFromLocalStorage();
    }
  },

  getById: async (id: string): Promise<NotificationTemplate | null> => {
    try {
      const response = await fetch(`${API_BASE}/notification-templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      const templates = getFromLocalStorage();
      return templates.find(t => t._id === id) || null;
    }
  },

  create: async (template: Omit<NotificationTemplate, '_id'>): Promise<NotificationTemplate> => {
    const response = await fetch(`${API_BASE}/notification-templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create template: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  update: async (id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const response = await fetch(`${API_BASE}/notification-templates/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update template: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/notification-templates/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete template: ${await response.text()}`);
    }
  },

  updateStatus: async (id: string, status: TemplateStatus): Promise<NotificationTemplate> => {
    const response = await fetch(`${API_BASE}/notification-templates/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update status: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  duplicate: async (id: string): Promise<NotificationTemplate> => {
    const response = await fetch(`${API_BASE}/notification-templates/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to duplicate template: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  getStatistics: async (tenant_id?: string): Promise<TemplateStatistics> => {
    try {
      const params = new URLSearchParams();
      if (tenant_id) params.append('tenant_id', tenant_id);
      
      const response = await fetch(`${API_BASE}/notification-templates/stats/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching template statistics:', error);
      return {
        total: 0,
        active: 0,
        draft: 0,
        inactive: 0,
        by_type: { email: 0, sms: 0, push: 0, 'in-app': 0, webhook: 0 },
        by_category: { system: 0, marketing: 0, transactional: 0, alert: 0, reminder: 0 },
        total_usage: 0,
        total_success: 0,
        total_failure: 0,
      };
    }
  },
};

export default notificationTemplateApi;

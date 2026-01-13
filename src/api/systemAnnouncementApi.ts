/**
 * System Announcements API Client
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;
const STORAGE_KEY = 'system_announcements_cache';

export type AnnouncementType = 'info' | 'warning' | 'error' | 'success' | 'maintenance';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';
export type AnnouncementStatus = 'draft' | 'active' | 'expired' | 'archived';

export interface SystemAnnouncement {
  _id?: string;
  tenant_id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  category?: string;
  status: AnnouncementStatus;
  is_published: boolean;
  is_pinned: boolean;
  start_date?: string;
  end_date?: string;
  published_at?: string;
  target_audience?: any;
  display_location?: string[];
  icon?: string;
  color?: string;
  link_url?: string;
  link_text?: string;
  attachments?: any;
  metadata?: any;
  view_count?: number;
  click_count?: number;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

export interface AnnouncementFilters {
  tenant_id?: string;
  status?: AnnouncementStatus;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  is_published?: boolean;
  search?: string;
}

export interface AnnouncementStatistics {
  total: number;
  active: number;
  draft: number;
  expired: number;
  archived: number;
  published: number;
  unpublished: number;
  by_type: {
    info: number;
    warning: number;
    error: number;
    success: number;
    maintenance: number;
  };
  by_priority: {
    low: number;
    normal: number;
    high: number;
    critical: number;
  };
  total_views: number;
}

const getFromLocalStorage = (): SystemAnnouncement[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

const saveToLocalStorage = (announcements: SystemAnnouncement[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const systemAnnouncementApi = {
  getAll: async (filters?: AnnouncementFilters): Promise<SystemAnnouncement[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.is_published !== undefined) params.append('is_published', String(filters.is_published));
      if (filters?.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_BASE}/system-announcements?${params}`, {
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
      console.error('Error fetching announcements:', error);
      return getFromLocalStorage();
    }
  },

  getById: async (id: string): Promise<SystemAnnouncement | null> => {
    try {
      const response = await fetch(`${API_BASE}/system-announcements/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      const announcements = getFromLocalStorage();
      return announcements.find(a => a._id === id) || null;
    }
  },

  create: async (announcement: Omit<SystemAnnouncement, '_id'>): Promise<SystemAnnouncement> => {
    const response = await fetch(`${API_BASE}/system-announcements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcement),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create announcement: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  update: async (id: string, updates: Partial<SystemAnnouncement>): Promise<SystemAnnouncement> => {
    const response = await fetch(`${API_BASE}/system-announcements/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update announcement: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/system-announcements/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete announcement: ${await response.text()}`);
    }
  },

  updateStatus: async (id: string, status: AnnouncementStatus): Promise<SystemAnnouncement> => {
    const response = await fetch(`${API_BASE}/system-announcements/${id}/status`, {
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

  togglePublish: async (id: string, is_published: boolean): Promise<SystemAnnouncement> => {
    const response = await fetch(`${API_BASE}/system-announcements/${id}/publish`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_published }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle publish: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  togglePin: async (id: string, is_pinned: boolean): Promise<SystemAnnouncement> => {
    const response = await fetch(`${API_BASE}/system-announcements/${id}/pin`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_pinned }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle pin: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  getStatistics: async (tenant_id?: string): Promise<AnnouncementStatistics> => {
    try {
      const params = new URLSearchParams();
      if (tenant_id) params.append('tenant_id', tenant_id);
      
      const response = await fetch(`${API_BASE}/system-announcements/stats/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching announcement statistics:', error);
      return {
        total: 0,
        active: 0,
        draft: 0,
        expired: 0,
        archived: 0,
        published: 0,
        unpublished: 0,
        by_type: { info: 0, warning: 0, error: 0, success: 0, maintenance: 0 },
        by_priority: { low: 0, normal: 0, high: 0, critical: 0 },
        total_views: 0,
      };
    }
  },
};

export default systemAnnouncementApi;

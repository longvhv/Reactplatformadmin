/**
 * System Announcements API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Manages system-wide announcements with scheduling and targeting
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type AnnouncementType = 'info' | 'warning' | 'error' | 'success' | 'maintenance';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';
export type AnnouncementStatus = 'draft' | 'active' | 'expired' | 'archived';

export interface TargetAudience {
  all?: boolean;
  roles?: string[];
  users?: string[];
  tenants?: string[];
  departments?: string[];
  locations?: string[];
}

export interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

// ==================== MAIN INTERFACE ====================

export interface SystemAnnouncement {
  // I. IDENTITY & HIERARCHY
  _id: string;
  tenant_id: string;

  // II. BASIC CONTENT
  title: string;
  content: string;

  // III. CLASSIFICATION
  type: AnnouncementType;
  priority: AnnouncementPriority;
  category: string | null;

  // IV. STATUS & VISIBILITY
  status: AnnouncementStatus;
  is_published: boolean;
  is_pinned: boolean;

  // V. SCHEDULING
  start_date: string | null;
  end_date: string | null;
  published_at: string | null;

  // VI. TARGETING
  target_audience: TargetAudience;

  // VII. DISPLAY SETTINGS
  display_location: string[];
  icon: string | null;
  color: string | null;

  // VIII. ADDITIONAL DATA
  link_url: string | null;
  link_text: string | null;
  attachments: Record<string, any> | null;
  metadata: Record<string, any> | null;

  // IX. STATISTICS
  view_count: number;
  click_count: number;

  // X. AUDIT TRAIL
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number;
}

// ==================== REQUEST INTERFACES ====================

export interface CreateSystemAnnouncementRequest {
  // Required
  tenant_id: string;
  title: string;
  content: string;

  // Optional with defaults
  type?: AnnouncementType; // default: 'info'
  priority?: AnnouncementPriority; // default: 'normal'
  status?: AnnouncementStatus; // default: 'draft'
  is_published?: boolean; // default: false
  is_pinned?: boolean; // default: false
  display_location?: string[]; // default: ['dashboard']
  target_audience?: TargetAudience; // default: { all: true }
  view_count?: number; // default: 0
  click_count?: number; // default: 0
  version?: number; // default: 1

  // Optional
  category?: string;
  start_date?: string;
  end_date?: string;
  published_at?: string;
  icon?: string;
  color?: string;
  link_url?: string;
  link_text?: string;
  attachments?: Record<string, any>;
  metadata?: Record<string, any>;
  created_by?: string;
}

export interface UpdateSystemAnnouncementRequest {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  category?: string | null;
  status?: AnnouncementStatus;
  is_published?: boolean;
  is_pinned?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  published_at?: string | null;
  target_audience?: TargetAudience;
  display_location?: string[];
  icon?: string | null;
  color?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  attachments?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  updated_by?: string;
}

export interface SystemAnnouncementFilters extends BaseFilters {
  tenant_id?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  category?: string;
  is_published?: boolean;
  is_pinned?: boolean;
  include_deleted?: boolean;
  display_location?: string;
  // Date range filters
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
}

// ==================== STATISTICS ====================

export interface SystemAnnouncementStatistics {
  total_announcements: number;
  active_announcements: number;
  draft_announcements: number;
  expired_announcements: number;
  archived_announcements: number;
  pinned_announcements: number;
  by_type: Record<AnnouncementType, number>;
  by_priority: Record<AnnouncementPriority, number>;
  total_views: number;
  total_clicks: number;
  avg_views_per_announcement: number;
  avg_clicks_per_announcement: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<SystemAnnouncement, CreateSystemAnnouncementRequest, UpdateSystemAnnouncementRequest>(
  'system_announcements',
  '/system-announcements',
  true // Has soft delete
);

// ==================== API CLIENT ====================

export const systemAnnouncementsApi = {
  /**
   * GET /system-announcements
   * Fetch announcements with filters
   */
  getAll: async (filters?: SystemAnnouncementFilters): Promise<SystemAnnouncement[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('system_announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }
    if (filters?.is_pinned !== undefined) {
      query = query.eq('is_pinned', filters.is_pinned);
    }
    if (filters?.display_location) {
      query = query.contains('display_location', [filters.display_location]);
    }

    // Date range filters
    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from);
    }
    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to);
    }
    if (filters?.end_date_from) {
      query = query.gte('end_date', filters.end_date_from);
    }
    if (filters?.end_date_to) {
      query = query.lte('end_date', filters.end_date_to);
    }

    // Soft delete filter
    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch system announcements: ${error.message}`);
    }

    return data || [];
  },

  /**
   * GET /system-announcements/:id
   */
  getById: async (id: string): Promise<SystemAnnouncement> => {
    return adapter.getById(id);
  },

  /**
   * POST /system-announcements
   * Create new announcement
   */
  create: async (data: CreateSystemAnnouncementRequest): Promise<SystemAnnouncement> => {
    // Apply defaults
    const requestData = {
      type: 'info' as AnnouncementType,
      priority: 'normal' as AnnouncementPriority,
      status: 'draft' as AnnouncementStatus,
      is_published: false,
      is_pinned: false,
      display_location: ['dashboard'],
      target_audience: { all: true },
      view_count: 0,
      click_count: 0,
      version: 1,
      ...data,
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /system-announcements/:id
   * Update announcement
   */
  update: async (id: string, data: UpdateSystemAnnouncementRequest): Promise<SystemAnnouncement> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /system-announcements/:id
   * Soft delete announcement
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /system-announcements/:id/publish
   * Publish announcement
   */
  publish: async (id: string): Promise<SystemAnnouncement> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_announcements')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to publish announcement: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-announcements/:id/unpublish
   * Unpublish announcement
   */
  unpublish: async (id: string): Promise<SystemAnnouncement> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_announcements')
      .update({
        is_published: false,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to unpublish announcement: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-announcements/:id/pin
   * Pin announcement
   */
  pin: async (id: string): Promise<SystemAnnouncement> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_announcements')
      .update({
        is_pinned: true,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to pin announcement: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-announcements/:id/unpin
   * Unpin announcement
   */
  unpin: async (id: string): Promise<SystemAnnouncement> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_announcements')
      .update({
        is_pinned: false,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to unpin announcement: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-announcements/:id/increment-view
   * Increment view count
   */
  incrementViewCount: async (id: string): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { error } = await supabase.rpc('increment_announcement_view_count', {
      announcement_id: id,
    });

    // Fallback if RPC doesn't exist
    if (error) {
      const announcement = await systemAnnouncementsApi.getById(id);
      await supabase
        .from('system_announcements')
        .update({
          view_count: announcement.view_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('_id', id);
    }
  },

  /**
   * POST /system-announcements/:id/increment-click
   * Increment click count
   */
  incrementClickCount: async (id: string): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { error } = await supabase.rpc('increment_announcement_click_count', {
      announcement_id: id,
    });

    // Fallback if RPC doesn't exist
    if (error) {
      const announcement = await systemAnnouncementsApi.getById(id);
      await supabase
        .from('system_announcements')
        .update({
          click_count: announcement.click_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('_id', id);
    }
  },

  /**
   * POST /system-announcements/:id/archive
   * Archive announcement
   */
  archive: async (id: string): Promise<SystemAnnouncement> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_announcements')
      .update({
        status: 'archived',
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to archive announcement: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * GET /system-announcements/active
   * Get active announcements for display
   */
  getActive: async (tenantId: string, location?: string): Promise<SystemAnnouncement[]> => {
    const now = new Date().toISOString();
    const filters: SystemAnnouncementFilters = {
      tenant_id: tenantId,
      is_published: true,
      status: 'active',
    };

    if (location) {
      filters.display_location = location;
    }

    const announcements = await systemAnnouncementsApi.getAll(filters);

    // Filter by date range
    return announcements.filter((ann) => {
      const isStarted = !ann.start_date || ann.start_date <= now;
      const notEnded = !ann.end_date || ann.end_date >= now;
      return isStarted && notEnded;
    });
  },

  /**
   * GET /system-announcements/statistics
   * Get statistics
   */
  getStatistics: async (tenantId: string): Promise<SystemAnnouncementStatistics> => {
    const announcements = await systemAnnouncementsApi.getAll({ tenant_id: tenantId });
    return calculateStatistics(announcements);
  },

  /**
   * Client-side validation
   */
  validate: (data: CreateSystemAnnouncementRequest | UpdateSystemAnnouncementRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate title
    if ('title' in data && data.title !== undefined) {
      if (!data.title.trim()) {
        errors.push('Tiêu đề không được để trống');
      }
      if (data.title.length > 500) {
        errors.push('Tiêu đề không được vượt quá 500 ký tự');
      }
    }

    // Validate content
    if ('content' in data && data.content !== undefined) {
      if (!data.content.trim()) {
        errors.push('Nội dung không được để trống');
      }
    }

    // Validate dates
    if ('start_date' in data && 'end_date' in data && data.start_date && data.end_date) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        errors.push('Ngày bắt đầu phải trước ngày kết thúc');
      }
    }

    // Validate link
    if ('link_url' in data && data.link_url !== undefined && data.link_url !== null) {
      if (data.link_url.length > 500) {
        errors.push('Link URL không được vượt quá 500 ký tự');
      }
    }

    if ('link_text' in data && data.link_text !== undefined && data.link_text !== null) {
      if (data.link_text.length > 200) {
        errors.push('Link text không được vượt quá 200 ký tự');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate statistics from announcements array
 */
export function calculateStatistics(announcements: SystemAnnouncement[]): SystemAnnouncementStatistics {
  const byType: Record<AnnouncementType, number> = {
    info: 0,
    warning: 0,
    error: 0,
    success: 0,
    maintenance: 0,
  };

  const byPriority: Record<AnnouncementPriority, number> = {
    low: 0,
    normal: 0,
    high: 0,
    critical: 0,
  };

  let activeCount = 0;
  let draftCount = 0;
  let expiredCount = 0;
  let archivedCount = 0;
  let pinnedCount = 0;
  let totalViews = 0;
  let totalClicks = 0;

  const now = new Date();

  announcements.forEach((ann) => {
    // Count by type
    byType[ann.type]++;

    // Count by priority
    byPriority[ann.priority]++;

    // Count by status
    switch (ann.status) {
      case 'active':
        activeCount++;
        break;
      case 'draft':
        draftCount++;
        break;
      case 'expired':
        expiredCount++;
        break;
      case 'archived':
        archivedCount++;
        break;
    }

    // Count pinned
    if (ann.is_pinned) {
      pinnedCount++;
    }

    // Sum statistics
    totalViews += ann.view_count;
    totalClicks += ann.click_count;
  });

  return {
    total_announcements: announcements.length,
    active_announcements: activeCount,
    draft_announcements: draftCount,
    expired_announcements: expiredCount,
    archived_announcements: archivedCount,
    pinned_announcements: pinnedCount,
    by_type: byType,
    by_priority: byPriority,
    total_views: totalViews,
    total_clicks: totalClicks,
    avg_views_per_announcement: announcements.length > 0 ? totalViews / announcements.length : 0,
    avg_clicks_per_announcement: announcements.length > 0 ? totalClicks / announcements.length : 0,
  };
}

/**
 * Get type label
 */
export function getTypeLabel(type: AnnouncementType): string {
  const labels: Record<AnnouncementType, string> = {
    info: 'Thông tin',
    warning: 'Cảnh báo',
    error: 'Lỗi',
    success: 'Thành công',
    maintenance: 'Bảo trì',
  };
  return labels[type];
}

/**
 * Get type color
 */
export function getTypeColor(type: AnnouncementType): string {
  const colors: Record<AnnouncementType, string> = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    maintenance: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };
  return colors[type];
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: AnnouncementPriority): string {
  const labels: Record<AnnouncementPriority, string> = {
    low: 'Thấp',
    normal: 'Bình thường',
    high: 'Cao',
    critical: 'Nghiêm trọng',
  };
  return labels[priority];
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: AnnouncementPriority): string {
  const colors: Record<AnnouncementPriority, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[priority];
}

/**
 * Get status label
 */
export function getStatusLabel(status: AnnouncementStatus): string {
  const labels: Record<AnnouncementStatus, string> = {
    draft: 'Nháp',
    active: 'Đang hoạt động',
    expired: 'Hết hạn',
    archived: 'Lưu trữ',
  };
  return labels[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: AnnouncementStatus): string {
  const colors: Record<AnnouncementStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };
  return colors[status];
}

/**
 * Check if announcement is active
 */
export function isActive(announcement: SystemAnnouncement): boolean {
  if (!announcement.is_published || announcement.status !== 'active') {
    return false;
  }

  const now = new Date();

  if (announcement.start_date && new Date(announcement.start_date) > now) {
    return false;
  }

  if (announcement.end_date && new Date(announcement.end_date) < now) {
    return false;
  }

  return true;
}

/**
 * Check if announcement is expired
 */
export function isExpired(announcement: SystemAnnouncement): boolean {
  if (!announcement.end_date) return false;
  return new Date(announcement.end_date) < new Date();
}

/**
 * Check if announcement is scheduled
 */
export function isScheduled(announcement: SystemAnnouncement): boolean {
  if (!announcement.start_date) return false;
  return new Date(announcement.start_date) > new Date();
}

/**
 * Get days until start
 */
export function getDaysUntilStart(announcement: SystemAnnouncement): number | null {
  if (!announcement.start_date) return null;
  const diff = new Date(announcement.start_date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get days until end
 */
export function getDaysUntilEnd(announcement: SystemAnnouncement): number | null {
  if (!announcement.end_date) return null;
  const diff = new Date(announcement.end_date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format schedule text
 */
export function formatScheduleText(announcement: SystemAnnouncement): string {
  if (!announcement.start_date && !announcement.end_date) {
    return 'Không giới hạn';
  }

  const now = new Date();
  const start = announcement.start_date ? new Date(announcement.start_date) : null;
  const end = announcement.end_date ? new Date(announcement.end_date) : null;

  if (start && start > now) {
    const days = getDaysUntilStart(announcement);
    return days === 1 ? 'Bắt đầu ngày mai' : `Bắt đầu sau ${days} ngày`;
  }

  if (end && end < now) {
    const days = Math.abs(getDaysUntilEnd(announcement) || 0);
    return days === 0 ? 'Kết thúc hôm nay' : `Đã kết thúc ${days} ngày trước`;
  }

  if (end) {
    const days = getDaysUntilEnd(announcement);
    return days === 0 ? 'Kết thúc hôm nay' : days === 1 ? 'Kết thúc ngày mai' : `Còn ${days} ngày`;
  }

  return 'Đang hoạt động';
}

// Export alias for backward compatibility
export const systemAnnouncementApi = systemAnnouncementsApi;

export default systemAnnouncementsApi;
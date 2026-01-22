/**
 * Usage Events API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Tracks usage metrics for subscriptions
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface UsageEvent {
  // I. ĐỊNH DANH
  _id: string;
  tenant_id: string | null;
  subscription_id: string | null;
  
  // II. THÔNG TIN SỬ DỤNG
  app_code: string | null;
  event_type: string | null;
  quantity: number;
  unit: string | null;
  
  // III. METADATA & LOCATION
  metadata: Record<string, any> | null;
  data_region: string | null;
  
  // IV. TIMESTAMP
  timestamp: string;
}

export interface CreateUsageEventRequest {
  tenant_id?: string;
  subscription_id?: string;
  app_code?: string;
  event_type?: string;
  quantity: number;
  unit?: string;
  metadata?: Record<string, any>;
  data_region?: string;
  timestamp?: string;
}

export interface UpdateUsageEventRequest {
  tenant_id?: string;
  subscription_id?: string;
  app_code?: string;
  event_type?: string;
  quantity?: number;
  unit?: string;
  metadata?: Record<string, any>;
  data_region?: string;
  timestamp?: string;
}

export interface UsageEventFilters extends BaseFilters {
  tenant_id?: string;
  subscription_id?: string;
  app_code?: string;
  event_type?: string;
  data_region?: string;
  start_date?: string;
  end_date?: string;
}

// ==================== STATISTICS ====================

export interface UsageStatistics {
  total_events: number;
  total_quantity: number;
  by_event_type: Record<string, {
    count: number;
    total_quantity: number;
    unit: string;
  }>;
  by_app_code: Record<string, {
    count: number;
    total_quantity: number;
  }>;
  by_region: Record<string, number>;
  period: {
    start: string;
    end: string;
  };
}

// ==================== ADAPTER ====================

const adapter = createAdapter<UsageEvent, CreateUsageEventRequest, UpdateUsageEventRequest>(
  'usage_events',
  '/usage-events',
  false // No soft delete (usage events are immutable)
);

// ==================== API CLIENT ====================

export const usageEventsApi = {
  /**
   * GET /usage-events
   * Fetch usage events with filters
   */
  getAll: async (filters?: UsageEventFilters): Promise<UsageEvent[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('usage_events')
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.subscription_id) {
      query = query.eq('subscription_id', filters.subscription_id);
    }
    if (filters?.app_code) {
      query = query.eq('app_code', filters.app_code);
    }
    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters?.data_region) {
      query = query.eq('data_region', filters.data_region);
    }
    if (filters?.start_date) {
      query = query.gte('timestamp', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('timestamp', filters.end_date);
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
      throw new Error(`Failed to fetch usage events: ${error.message}`);
    }

    return data || [];
  },

  /**
   * GET /usage-events/:id
   */
  getById: async (id: string): Promise<UsageEvent> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('_id', id)
      .single();

    if (error || !data) {
      throw new Error(`Usage event not found: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /usage-events
   * Create new usage event
   */
  create: async (data: CreateUsageEventRequest): Promise<UsageEvent> => {
    return adapter.create(data);
  },

  /**
   * PATCH /usage-events/:id
   * Update usage event (Correction)
   */
  update: async (id: string, data: UpdateUsageEventRequest): Promise<UsageEvent> => {
    return adapter.update(id, data);
  },

  /**
   * GET /usage-events/statistics
   * Get usage statistics
   * TODO (Golang): Implement statistics endpoint
   */
  getStatistics: async (filters?: UsageEventFilters): Promise<UsageStatistics> => {
    const events = await usageEventsApi.getAll(filters);
    return calculateUsageStatistics(events);
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate usage statistics from events array
 */
export function calculateUsageStatistics(events: UsageEvent[]): UsageStatistics {
  const byEventType: Record<string, { count: number; total_quantity: number; unit: string }> = {};
  const byAppCode: Record<string, { count: number; total_quantity: number }> = {};
  const byRegion: Record<string, number> = {};

  let totalQuantity = 0;
  let minTimestamp = new Date().toISOString();
  let maxTimestamp = new Date(0).toISOString();

  events.forEach((event) => {
    // Total quantity
    totalQuantity += event.quantity;

    // By event type
    const eventType = event.event_type || 'unknown';
    if (!byEventType[eventType]) {
      byEventType[eventType] = {
        count: 0,
        total_quantity: 0,
        unit: event.unit || '',
      };
    }
    byEventType[eventType].count++;
    byEventType[eventType].total_quantity += event.quantity;

    // By app code
    const appCode = event.app_code || 'unknown';
    if (!byAppCode[appCode]) {
      byAppCode[appCode] = {
        count: 0,
        total_quantity: 0,
      };
    }
    byAppCode[appCode].count++;
    byAppCode[appCode].total_quantity += event.quantity;

    // By region
    const region = event.data_region || 'unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;

    // Time range
    if (event.timestamp < minTimestamp) minTimestamp = event.timestamp;
    if (event.timestamp > maxTimestamp) maxTimestamp = event.timestamp;
  });

  return {
    total_events: events.length,
    total_quantity: totalQuantity,
    by_event_type: byEventType,
    by_app_code: byAppCode,
    by_region: byRegion,
    period: {
      start: events.length > 0 ? minTimestamp : new Date().toISOString(),
      end: events.length > 0 ? maxTimestamp : new Date().toISOString(),
    },
  };
}

/**
 * Get event type label
 */
export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    api_call: 'API Call',
    storage: 'Lưu trữ',
    bandwidth: 'Băng thông',
    compute: 'Tính toán',
    request: 'Yêu cầu',
    user_login: 'Đăng nhập',
    data_transfer: 'Truyền dữ liệu',
    function_execution: 'Thực thi hàm',
  };
  return labels[type] || type;
}

/**
 * Get event type color
 */
export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    api_call: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    storage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    bandwidth: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    compute: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    request: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    user_login: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    data_transfer: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    function_execution: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
}

/**
 * Format quantity with unit
 */
export function formatQuantity(quantity: number, unit?: string | null): string {
  const formattedQty = quantity.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
  return unit ? `${formattedQty} ${unit}` : formattedQty;
}

export default usageEventsApi;

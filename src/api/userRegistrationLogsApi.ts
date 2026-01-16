/**
 * User Registration Logs API
 * Manages telemetry data for user registration tracking
 */

import { supabase } from '@/utils/supabase/client';

export interface UserRegistrationLog {
  _id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  registration_source?: string | null;
  data_region?: string | null;
  created_at: string;
}

export interface UserRegistrationFilters {
  search?: string;
  registration_source?: string;
  data_region?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface UserRegistrationCreateData {
  tenant_id?: string | null;
  user_id?: string | null;
  registration_source?: string | null;
  data_region?: string | null;
}

export interface UserRegistrationUpdateData extends Partial<UserRegistrationCreateData> {}

export interface UserRegistrationStats {
  total: number;
  bySource: Record<string, number>;
  byRegion: Record<string, number>;
  byDate: Record<string, number>;
  recentRegistrations: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

/**
 * Fetch all user registration logs with optional filters
 */
export const getUserRegistrationLogs = async (
  filters?: UserRegistrationFilters
): Promise<UserRegistrationLog[]> => {
  try {
    let query = supabase
      .from('user_registration_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.registration_source) {
      query = query.eq('registration_source', filters.registration_source);
    }

    if (filters?.data_region) {
      query = query.eq('data_region', filters.data_region);
    }

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user registration logs:', error);
    throw error;
  }
};

/**
 * Fetch a single registration log by ID
 */
export const getUserRegistrationLogById = async (
  id: string
): Promise<UserRegistrationLog | null> => {
  try {
    const { data, error } = await supabase
      .from('user_registration_logs')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching registration log:', error);
    throw error;
  }
};

/**
 * Create a new registration log
 */
export const createUserRegistrationLog = async (
  logData: UserRegistrationCreateData
): Promise<UserRegistrationLog> => {
  try {
    const { data, error } = await supabase
      .from('user_registration_logs')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating registration log:', error);
    throw error;
  }
};

/**
 * Update an existing registration log
 */
export const updateUserRegistrationLog = async (
  id: string,
  logData: UserRegistrationUpdateData
): Promise<UserRegistrationLog> => {
  try {
    const { data, error } = await supabase
      .from('user_registration_logs')
      .update(logData)
      .eq('_id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating registration log:', error);
    throw error;
  }
};

/**
 * Delete a registration log
 */
export const deleteUserRegistrationLog = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_registration_logs')
      .delete()
      .eq('_id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting registration log:', error);
    throw error;
  }
};

/**
 * Get registration statistics
 */
export const getUserRegistrationStats = async (
  filters?: Pick<UserRegistrationFilters, 'start_date' | 'end_date' | 'tenant_id'>
): Promise<UserRegistrationStats> => {
  try {
    let query = supabase
      .from('user_registration_logs')
      .select('_id, registration_source, data_region, created_at, tenant_id');

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: UserRegistrationStats = {
      total: data?.length || 0,
      bySource: {},
      byRegion: {},
      byDate: {},
      recentRegistrations: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
    };

    data?.forEach((log) => {
      // Count by source
      if (log.registration_source) {
        stats.bySource[log.registration_source] =
          (stats.bySource[log.registration_source] || 0) + 1;
      }

      // Count by region
      if (log.data_region) {
        stats.byRegion[log.data_region] = (stats.byRegion[log.data_region] || 0) + 1;
      }

      // Count by date
      const date = new Date(log.created_at).toISOString().split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;

      // Time-based counts
      const logDate = new Date(log.created_at);
      if (logDate >= last24Hours) {
        stats.last24Hours++;
      }
      if (logDate >= last7Days) {
        stats.last7Days++;
      }
      if (logDate >= last30Days) {
        stats.last30Days++;
      }
    });

    stats.recentRegistrations = stats.last24Hours;

    return stats;
  } catch (error) {
    console.error('Error fetching registration stats:', error);
    throw error;
  }
};

/**
 * Get registration sources (unique values)
 */
export const getRegistrationSources = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_registration_logs')
      .select('registration_source')
      .not('registration_source', 'is', null);

    if (error) throw error;

    const sources = Array.from(
      new Set(data?.map((item) => item.registration_source).filter(Boolean))
    ) as string[];

    return sources.sort();
  } catch (error) {
    console.error('Error fetching registration sources:', error);
    throw error;
  }
};

/**
 * Get data regions (unique values)
 */
export const getDataRegions = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_registration_logs')
      .select('data_region')
      .not('data_region', 'is', null);

    if (error) throw error;

    const regions = Array.from(
      new Set(data?.map((item) => item.data_region).filter(Boolean))
    ) as string[];

    return regions.sort();
  } catch (error) {
    console.error('Error fetching data regions:', error);
    throw error;
  }
};

/**
 * Get registration trend data for charts
 */
export const getRegistrationTrend = async (
  days: number = 30,
  filters?: Pick<UserRegistrationFilters, 'tenant_id' | 'registration_source' | 'data_region'>
): Promise<{ date: string; count: number }[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('user_registration_logs')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.registration_source) {
      query = query.eq('registration_source', filters.registration_source);
    }

    if (filters?.data_region) {
      query = query.eq('data_region', filters.data_region);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const dateMap: Record<string, number> = {};
    data?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    // Convert to array and sort
    const trend = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return trend;
  } catch (error) {
    console.error('Error fetching registration trend:', error);
    throw error;
  }
};
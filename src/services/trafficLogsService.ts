/**
 * Traffic Logs Service
 * Handles CRUD operations for traffic logs
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '@/utils/supabase/client';

// Types matching telemetry.traffic_logs table
export interface TrafficLog {
  _id: string; // UUID primary key
  tenant_id?: string; // UUID
  user_id?: string; // UUID (null for anonymous visitors)
  session_id?: string; // UUID for tracking sessions
  ip_address?: string;
  user_agent?: string;
  page_url?: string;
  referrer_url?: string;
  country_code?: string; // ISO 3166-1 alpha-2
  city?: string;
  device_type?: string; // 'desktop', 'mobile', 'tablet'
  browser?: string;
  os?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  page_load_time_ms?: number;
  access_time: string; // TIMESTAMP
  created_at: string;
}

export interface TrafficLogFilters {
  tenant_id?: string;
  user_id?: string;
  session_id?: string;
  page_url?: string;
  country_code?: string;
  device_type?: string;
  browser?: string;
  utm_source?: string;
  utm_campaign?: string;
  date_from?: string;
  date_to?: string;
}

export interface TrafficStats {
  total_visits: number;
  unique_visitors: number;
  unique_sessions: number;
  avg_page_load_time: number;
  by_page: Array<{ url: string; count: number }>;
  by_country: Array<{ country: string; count: number }>;
  by_device: Record<string, number>;
  by_browser: Record<string, number>;
  by_utm_source: Record<string, number>;
  by_date: Array<{ date: string; visits: number; unique_visitors: number }>;
}

class TrafficLogsService {
  private supabase = supabase;
  private table = 'traffic_logs';
  private schema = 'telemetry';

  /**
   * Get Supabase client configured for telemetry schema
   */
  private getClient() {
    return this.supabase.schema(this.schema);
  }

  /**
   * Fetch all traffic logs with optional filters
   * Ready for: GET /api/v1/telemetry/traffic-logs
   */
  async getAll(filters?: TrafficLogFilters): Promise<TrafficLog[]> {
    try {
      let query = this.getClient()
        .from(this.table)
        .select('*')
        .order('access_time', { ascending: false });

      // Apply filters
      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.session_id) {
        query = query.eq('session_id', filters.session_id);
      }
      if (filters?.page_url) {
        query = query.ilike('page_url', `%${filters.page_url}%`);
      }
      if (filters?.country_code) {
        query = query.eq('country_code', filters.country_code);
      }
      if (filters?.device_type) {
        query = query.eq('device_type', filters.device_type);
      }
      if (filters?.browser) {
        query = query.eq('browser', filters.browser);
      }
      if (filters?.utm_source) {
        query = query.eq('utm_source', filters.utm_source);
      }
      if (filters?.utm_campaign) {
        query = query.eq('utm_campaign', filters.utm_campaign);
      }
      if (filters?.date_from) {
        query = query.gte('access_time', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('access_time', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching traffic logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single traffic log by ID
   * Ready for: GET /api/v1/telemetry/traffic-logs/:id
   */
  async getById(id: string): Promise<TrafficLog | null> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching traffic log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new traffic log entry
   * Ready for: POST /api/v1/telemetry/traffic-logs
   */
  async create(log: Omit<TrafficLog, '_id' | 'created_at'>): Promise<TrafficLog> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Error creating traffic log:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Get traffic statistics
   * Ready for: GET /api/v1/telemetry/traffic-logs/stats
   */
  async getStats(filters?: TrafficLogFilters): Promise<TrafficStats> {
    try {
      const logs = await this.getAll(filters);

      if (logs.length === 0) {
        return {
          total_visits: 0,
          unique_visitors: 0,
          unique_sessions: 0,
          avg_page_load_time: 0,
          by_page: [],
          by_country: [],
          by_device: {},
          by_browser: {},
          by_utm_source: {},
          by_date: [],
        };
      }

      const total_visits = logs.length;
      const unique_visitors = new Set(logs.map(log => log.ip_address).filter(Boolean)).size;
      const unique_sessions = new Set(logs.map(log => log.session_id).filter(Boolean)).size;
      const avg_page_load_time = logs.reduce((sum, log) => sum + (log.page_load_time_ms || 0), 0) / total_visits;

      // By page
      const pageCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.page_url) {
          pageCounts[log.page_url] = (pageCounts[log.page_url] || 0) + 1;
        }
      });
      const by_page = Object.entries(pageCounts)
        .map(([url, count]) => ({ url, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // By country
      const countryCounts: Record<string, number> = {};
      logs.forEach(log => {
        if (log.country_code) {
          countryCounts[log.country_code] = (countryCounts[log.country_code] || 0) + 1;
        }
      });
      const by_country = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // By device
      const by_device: Record<string, number> = {};
      logs.forEach(log => {
        if (log.device_type) {
          by_device[log.device_type] = (by_device[log.device_type] || 0) + 1;
        }
      });

      // By browser
      const by_browser: Record<string, number> = {};
      logs.forEach(log => {
        if (log.browser) {
          by_browser[log.browser] = (by_browser[log.browser] || 0) + 1;
        }
      });

      // By UTM source
      const by_utm_source: Record<string, number> = {};
      logs.forEach(log => {
        if (log.utm_source) {
          by_utm_source[log.utm_source] = (by_utm_source[log.utm_source] || 0) + 1;
        }
      });

      // By date
      const dateStats: Record<string, { visits: Set<string>; unique_ips: Set<string> }> = {};
      logs.forEach(log => {
        const date = new Date(log.access_time).toISOString().split('T')[0];
        if (!dateStats[date]) {
          dateStats[date] = { visits: new Set(), unique_ips: new Set() };
        }
        dateStats[date].visits.add(log._id);
        if (log.ip_address) {
          dateStats[date].unique_ips.add(log.ip_address);
        }
      });
      const by_date = Object.entries(dateStats)
        .map(([date, stats]) => ({
          date,
          visits: stats.visits.size,
          unique_visitors: stats.unique_ips.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_visits,
        unique_visitors,
        unique_sessions,
        avg_page_load_time: Math.round(avg_page_load_time * 100) / 100,
        by_page,
        by_country,
        by_device,
        by_browser,
        by_utm_source,
        by_date,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get session details (all pages visited in a session)
   * Ready for: GET /api/v1/telemetry/traffic-logs/session/:id
   */
  async getSessionDetails(session_id: string): Promise<TrafficLog[]> {
    try {
      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .eq('session_id', session_id)
        .order('access_time', { ascending: true });

      if (error) {
        console.error('Error fetching session details:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSessionDetails:', error);
      throw error;
    }
  }

  /**
   * Get real-time traffic (last N minutes)
   * Ready for: GET /api/v1/telemetry/traffic-logs/realtime
   */
  async getRealtimeTraffic(minutes: number = 30): Promise<TrafficLog[]> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

      const { data, error } = await this.getClient()
        .from(this.table)
        .select('*')
        .gte('access_time', since)
        .order('access_time', { ascending: false });

      if (error) {
        console.error('Error fetching realtime traffic:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRealtimeTraffic:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const trafficLogsService = new TrafficLogsService();
/**
 * Telemetry Service
 * Handles data from the 'telemetry' schema
 * - API Usage Logs
 * - Traffic Logs
 * - Audit Logs
 * - Webhook Delivery Logs
 */

import { supabase } from '../utils/supabase/client';
import { TimeSeriesData } from './dashboardService';

export interface AuditLog {
  _id: string;
  tenant_id?: string;
  user_id?: string;
  impersonator_id?: string;
  event_time: string;
  action?: string;
  resource?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  status?: string;
}

export class TelemetryService {
  /**
   * Get API usage statistics
   */
  async getApiUsageStats(): Promise<{
    today: number;
    month: number;
    errors_today: number;
  }> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // API calls today
      const { count: todayCount, error: todayError } = await supabase
        .schema('telemetry')
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      if (todayError) {
        if (todayError.code === 'PGRST204' || todayError.code === '42P01') {
          console.warn('⚠️  Table telemetry.api_usage_logs not found');
          return { today: 0, month: 0, errors_today: 0 };
        }
        throw todayError;
      }

      // API calls this month
      const { count: monthCount, error: monthError } = await supabase
        .schema('telemetry')
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      if (monthError) throw monthError;

      // Errors today (status_code >= 400)
      const { count: errorsCount, error: errorsError } = await supabase
        .schema('telemetry')
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .gte('status_code', 400);

      if (errorsError) throw errorsError;

      return {
        today: todayCount || 0,
        month: monthCount || 0,
        errors_today: errorsCount || 0,
      };
    } catch (error) {
      console.error('Error getting API usage stats:', error);
      return { today: 0, month: 0, errors_today: 0 };
    }
  }

  /**
   * Get traffic statistics
   */
  async getTrafficStats(): Promise<{
    today: number;
    month: number;
    unique_today: number;
  }> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Traffic today
      const { count: todayCount, error: todayError } = await supabase
        .schema('telemetry')
        .from('traffic_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', todayStart.toISOString());

      if (todayError) {
        if (todayError.code === 'PGRST205' || todayError.code === '42P01') {
          console.warn('Table traffic_logs not found');
          return { today: 0, month: 0, unique_today: 0 };
        }
        throw todayError;
      }

      // Traffic this month
      const { count: monthCount, error: monthError } = await supabase
        .schema('telemetry')
        .from('traffic_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', monthStart.toISOString());

      if (monthError) throw monthError;

      // Unique visitors today
      const { data: uniqueData, error: uniqueError } = await supabase
        .schema('telemetry')
        .from('traffic_logs')
        .select('ip_address')
        .gte('timestamp', todayStart.toISOString());

      if (uniqueError) throw uniqueError;

      const unique_today = new Set(uniqueData?.map(d => d.ip_address)).size;

      return {
        today: todayCount || 0,
        month: monthCount || 0,
        unique_today,
      };
    } catch (error: any) {
      console.error('Error getting traffic stats:', error);
      return { today: 0, month: 0, unique_today: 0 };
    }
  }

  /**
   * Get Webhook Delivery Count
   */
  async getWebhookDeliveryCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .schema('telemetry')
        .from('webhook_delivery_logs')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting webhook delivery count:', error);
      return 0;
    }
  }

  /**
   * Get API calls by date for charts
   */
  async getApiCallsByDate(dates: string[]): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    
    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const { count, error } = await supabase
        .schema('telemetry')
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date)
        .lt('created_at', nextDate.toISOString().split('T')[0]);

      result.push({ date, value: count || 0 });
    }
    
    return result;
  }

  /**
   * Get traffic by date for charts
   */
  async getTrafficByDate(dates: string[]): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    
    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const { count, error } = await supabase
        .schema('telemetry')
        .from('traffic_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', date)
        .lt('timestamp', nextDate.toISOString().split('T')[0]);

      result.push({ date, value: count || 0 });
    }
    
    return result;
  }

  /**
   * Get Audit Logs
   */
  async getAuditLogs(limit: number = 10): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .schema('telemetry')
        .from('audit_logs')
        .select('*')
        .order('event_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }
}

export const telemetryService = new TelemetryService();

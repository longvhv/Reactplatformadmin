/**
 * Dashboard Service
 * Aggregates real data from multiple Supabase tables
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';
import { billingService } from './billingService';
import { telemetryService } from './telemetryService';
import { 
  DashboardOverview, 
  ChartData, 
  TimeSeriesData, 
  RecentActivity 
} from './dashboardTypes';

class DashboardService {
  /**
   * Get comprehensive dashboard overview
   * Ready for: GET /api/v1/dashboard/overview
   */
  async getOverview(): Promise<DashboardOverview> {
    console.log('📊 Loading dashboard overview...');
    
    try {
      // Run all queries in parallel for performance
      const [
        usersData,
        tenantsData,
        subscriptionsData,
        invoicesData,
        webhooksData,
        apiLogsData,
        trafficLogsData,
        jobsData,
        growthData,
      ] = await Promise.all([
        this.getUsersStats(),
        this.getTenantsStats(),
        billingService.getSubscriptionsStats(),
        billingService.getInvoicesStats(),
        this.getWebhooksStats(),
        telemetryService.getApiUsageStats(),
        telemetryService.getTrafficStats(),
        this.getJobsStats(),
        this.getGrowthStats(),
      ]);

      console.log('✅ Dashboard overview loaded successfully');

      return {
        // Users & Tenants
        total_users: usersData.total,
        total_tenants: tenantsData.total,
        users_growth_percent: growthData.users_growth,
        tenants_growth_percent: growthData.tenants_growth,
        
        // Subscriptions
        active_subscriptions: subscriptionsData.active,
        expiring_subscriptions: subscriptionsData.expiring,
        total_subscription_orders: subscriptionsData.total_orders,
        
        // Revenue
        monthly_revenue: invoicesData.monthly_revenue,
        total_revenue: invoicesData.total_revenue,
        revenue_growth_percent: growthData.revenue_growth,
        pending_invoice_count: invoicesData.pending_count,
        
        // Webhooks
        active_webhooks: webhooksData.active,
        unhealthy_webhooks: webhooksData.unhealthy,
        total_webhook_deliveries: webhooksData.total_deliveries,
        
        // API Usage
        api_calls_today: apiLogsData.today,
        api_calls_month: apiLogsData.month,
        api_errors_today: apiLogsData.errors_today,
        
        // Traffic
        traffic_today: trafficLogsData.today,
        traffic_month: trafficLogsData.month,
        unique_visitors_today: trafficLogsData.unique_today,
        
        // System Jobs
        total_jobs: jobsData.total,
        active_jobs: jobsData.active,
        failed_jobs: jobsData.failed,
      };
    } catch (error) {
      console.error('❌ Error getting dashboard overview:', error);
      console.warn('⚠️  Some dashboard data may be unavailable. See /docs/bugfix/dashboard-missing-tables-2026-01-16.md');
      throw error;
    }
  }

  /**
   * Get users statistics
   * Ready for: GET /api/v1/dashboard/stats/users
   */
  private async getUsersStats(): Promise<{ total: number }> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (error) {
        // Empty message usually means table doesn't exist
        if (!error.message || error.message === '' || 
            error.code === 'PGRST204' || error.code === '42P01' || error.code === 'PGRST116') {
          console.warn('⚠️  Table users not accessible or does not exist - returning zero stats');
          return { total: 0 };
        }
        
        // Handle network errors
        if (error.message === 'TypeError: Failed to fetch') {
          console.warn('⚠️  Network error fetching users (check connection/CORS)');
          return { total: 0 };
        }
        
        // Log detailed error if it has actual content
        console.error('Supabase error in getUsersStats:', JSON.stringify(error, null, 2));
        // Don't throw - return zeros for graceful degradation
        return { total: 0 };
      }

      return { total: count || 0 };
    } catch (error: any) {
      // This catch should rarely be hit now
      console.error('Error getting users stats:', {
        errorStringified: JSON.stringify(error),
        message: error?.message || error?.msg || (typeof error === 'string' ? error : 'Unknown error'),
        code: error?.code || error?.statusCode || error?.error_code || 'N/A',
        details: error?.details || error?.detail || error?.error || null,
      });
      return { total: 0 };
    }
  }

  /**
   * Get tenants statistics
   * Ready for: GET /api/v1/dashboard/stats/tenants
   */
  private async getTenantsStats(): Promise<{ total: number }> {
    try {
      const { count, error } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (error) {
        // Empty message usually means table doesn't exist
        if (!error.message || error.message === '' || 
            error.code === 'PGRST204' || error.code === '42P01' || error.code === 'PGRST116') {
          console.warn('⚠️  Table tenants not accessible or does not exist - returning zero stats');
          return { total: 0 };
        }
        
        // Handle network errors
        if (error.message === 'TypeError: Failed to fetch') {
          console.warn('⚠️  Network error fetching tenants (check connection/CORS)');
          return { total: 0 };
        }
        
        // Log detailed error if it has actual content
        console.error('Supabase error in getTenantsStats:', JSON.stringify(error, null, 2));
        // Don't throw - return zeros for graceful degradation
        return { total: 0 };
      }

      return { total: count || 0 };
    } catch (error: any) {
      console.error('Error getting tenants stats:', {
        errorStringified: JSON.stringify(error),
        message: error?.message || error?.msg || (typeof error === 'string' ? error : 'Unknown error'),
        code: error?.code || error?.statusCode || error?.error_code || 'N/A',
        details: error?.details || error?.detail || error?.error || null,
      });
      return { total: 0 };
    }
  }

  /**
   * Get webhooks statistics
   * Ready for: GET /api/v1/dashboard/stats/webhooks
   */
  private async getWebhooksStats(): Promise<{
    active: number;
    unhealthy: number;
    total_deliveries: number;
  }> {
    try {
      // Active webhooks (is_active = true)
      const { count: activeCount, error: activeError } = await supabase
        .from('webhooks')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) throw activeError;

      // Failed webhooks
      const { count: unhealthyCount, error: unhealthyError } = await supabase
        .from('webhooks')
        .select('failure_count, success_count', { count: 'exact', head: true })
        .eq('is_active', true)
        .gt('failure_count', 0);

      if (unhealthyError) throw unhealthyError;

      // Total deliveries (delegated to TelemetryService)
      const deliveriesCount = await telemetryService.getWebhookDeliveryCount();

      return {
        active: activeCount || 0,
        unhealthy: unhealthyCount || 0,
        total_deliveries: deliveriesCount,
      };
    } catch (error: any) {
      console.error('Error getting webhooks stats:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'N/A',
        details: error?.details || null,
        hint: error?.hint || null,
      });
      return { active: 0, unhealthy: 0, total_deliveries: 0 };
    }
  }

  /**
   * Get system jobs statistics
   * Ready for: GET /api/v1/dashboard/stats/jobs
   */
  private async getJobsStats(): Promise<{
    total: number;
    active: number;
    failed: number;
  }> {
    try {
      // Total jobs
      const { count: totalCount, error: totalError } = await supabase
        .from('system_jobs')
        .select('*', { count: 'exact', head: true });
        // Removed .eq('is_deleted', false) as schema does not support soft deletes

      if (totalError) throw totalError;

      // Active jobs (is_active = true)
      const { count: activeCount, error: activeError } = await supabase
        .from('system_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
        // Changed logic to use is_active boolean instead of status='active'

      if (activeError) throw activeError;

      // Failed jobs
      const { count: failedCount, error: failedError } = await supabase
        .from('system_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed');
        // Removed .eq('is_deleted', false)

      if (failedError) throw failedError;

      return {
        total: totalCount || 0,
        active: activeCount || 0,
        failed: failedCount || 0,
      };
    } catch (error: any) {
      console.error('Error getting jobs stats:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'N/A',
        details: error?.details || null,
        hint: error?.hint || null,
      });
      return { total: 0, active: 0, failed: 0 };
    }
  }

  /**
   * Get growth statistics (compare with last month)
   * Ready for: GET /api/v1/dashboard/stats/growth
   */
  private async getGrowthStats(): Promise<{
    users_growth: number;
    tenants_growth: number;
    revenue_growth: number;
  }> {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Users growth
      const { count: thisMonthUsers, error: thisUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString())
        .is('deleted_at', null);

      const { count: lastMonthUsers, error: lastUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .is('deleted_at', null);

      const users_growth = this.calculateGrowth(thisMonthUsers || 0, lastMonthUsers || 0);

      // Tenants growth
      const { count: thisMonthTenants, error: thisTenantsError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString())
        .is('deleted_at', null);

      const { count: lastMonthTenants, error: lastTenantsError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .is('deleted_at', null);

      const tenants_growth = this.calculateGrowth(thisMonthTenants || 0, lastMonthTenants || 0);

      // Revenue growth
      const revenue_growth = await billingService.getRevenueGrowth();

      return {
        users_growth,
        tenants_growth,
        revenue_growth,
      };
    } catch (error) {
      console.error('Error getting growth stats:', error);
      return { users_growth: 0, tenants_growth: 0, revenue_growth: 0 };
    }
  }

  /**
   * Calculate percentage growth
   */
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get chart data for last 7 days
   * Ready for: GET /api/v1/dashboard/charts
   */
  async getChartData(): Promise<ChartData> {
    try {
      const days = 7;
      const dates = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        return d.toISOString().split('T')[0];
      });

      // Get data for each day
      const [revenueData, usersData, apiData, trafficData] = await Promise.all([
        billingService.getRevenueByDate(dates),
        this.getUsersByDate(dates),
        telemetryService.getApiCallsByDate(dates),
        telemetryService.getTrafficByDate(dates),
      ]);

      return {
        revenue: revenueData,
        users: usersData,
        api_calls: apiData,
        traffic: trafficData,
      };
    } catch (error) {
      console.error('Error getting chart data:', error);
      throw error;
    }
  }

  private async getUsersByDate(dates: string[]): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    
    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date)
        .lt('created_at', nextDate.toISOString().split('T')[0])
        .is('deleted_at', null);

      result.push({ date, value: count || 0 });
    }
    
    return result;
  }

  /**
   * Get recent activities
   * Ready for: GET /api/v1/dashboard/activities
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent user registrations
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('_id, full_name, email, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!usersError && users) {
        users.forEach(user => {
          activities.push({
            id: user._id,
            type: 'user',
            description: `New user registered: ${user.full_name || user.email}`,
            timestamp: user.created_at,
            user_name: user.full_name || user.email,
          });
        });
      }

      // Get recent subscriptions
      const { data: subs, error: subsError } = await supabase
        .from('tenant_subscriptions')
        .select('_id, tenant_id, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!subsError && subs) {
        subs.forEach(sub => {
          activities.push({
            id: sub._id,
            type: 'subscription',
            description: `New subscription created`,
            timestamp: sub.created_at,
            tenant_name: sub.tenant_id,
          });
        });
      }

      // Get recent audit logs
      const auditLogs = await telemetryService.getAuditLogs(3);
      if (auditLogs) {
        auditLogs.forEach(log => {
          activities.push({
            id: log._id,
            type: 'audit' as any, // 'audit' is already in RecentActivity type, but using any to be safe with strict TS
            description: `${log.action} on ${log.resource}`,
            timestamp: log.event_time,
          });
        });
      }

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService;
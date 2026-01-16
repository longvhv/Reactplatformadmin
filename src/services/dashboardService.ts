/**
 * Dashboard Service
 * Aggregates real data from multiple Supabase tables
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';

// Dashboard Overview Interface
export interface DashboardOverview {
  // Users & Tenants
  total_users: number;
  total_tenants: number;
  users_growth_percent: number;
  tenants_growth_percent: number;
  
  // Subscriptions
  active_subscriptions: number;
  expiring_subscriptions: number;
  total_subscription_orders: number;
  
  // Revenue (from invoices)
  monthly_revenue: number;
  total_revenue: number;
  revenue_growth_percent: number;
  pending_invoice_count: number;
  
  // Webhooks
  active_webhooks: number;
  unhealthy_webhooks: number;
  total_webhook_deliveries: number;
  
  // API Usage
  api_calls_today: number;
  api_calls_month: number;
  api_errors_today: number;
  
  // Traffic
  traffic_today: number;
  traffic_month: number;
  unique_visitors_today: number;
  
  // System Jobs
  total_jobs: number;
  active_jobs: number;
  failed_jobs: number;
}

// Time Series Data for Charts
export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface ChartData {
  revenue: TimeSeriesData[];
  users: TimeSeriesData[];
  api_calls: TimeSeriesData[];
  traffic: TimeSeriesData[];
}

// Recent Activity
export interface RecentActivity {
  id: string;
  type: 'user' | 'subscription' | 'webhook' | 'api' | 'invoice';
  description: string;
  timestamp: string;
  user_name?: string;
  tenant_name?: string;
}

class DashboardService {
  /**
   * Get comprehensive dashboard overview
   * Ready for: GET /api/v1/dashboard/overview
   */
  async getOverview(): Promise<DashboardOverview> {
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
        this.getSubscriptionsStats(),
        this.getInvoicesStats(),
        this.getWebhooksStats(),
        this.getApiUsageStats(),
        this.getTrafficStats(),
        this.getJobsStats(),
        this.getGrowthStats(),
      ]);

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
      console.error('Error getting dashboard overview:', error);
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
        .eq('is_deleted', false);

      if (error) throw error;

      return { total: count || 0 };
    } catch (error) {
      console.error('Error getting users stats:', error);
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
        .eq('is_deleted', false);

      if (error) throw error;

      return { total: count || 0 };
    } catch (error) {
      console.error('Error getting tenants stats:', error);
      return { total: 0 };
    }
  }

  /**
   * Get subscriptions statistics
   * Ready for: GET /api/v1/dashboard/stats/subscriptions
   */
  private async getSubscriptionsStats(): Promise<{
    active: number;
    expiring: number;
    total_orders: number;
  }> {
    try {
      // Active subscriptions
      const { count: activeCount, error: activeError } = await supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('is_deleted', false);

      if (activeError) throw activeError;

      // Expiring soon (within 7 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      const expiryDateStr = expiryDate.toISOString();

      const { count: expiringCount, error: expiringError } = await supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('is_deleted', false)
        .lte('end_date', expiryDateStr);

      if (expiringError) throw expiringError;

      // Total orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('subscription_orders')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      if (ordersError) throw ordersError;

      return {
        active: activeCount || 0,
        expiring: expiringCount || 0,
        total_orders: ordersCount || 0,
      };
    } catch (error) {
      console.error('Error getting subscriptions stats:', error);
      return { active: 0, expiring: 0, total_orders: 0 };
    }
  }

  /**
   * Get invoices statistics
   * Ready for: GET /api/v1/dashboard/stats/invoices
   */
  private async getInvoicesStats(): Promise<{
    monthly_revenue: number;
    total_revenue: number;
    pending_count: number;
  }> {
    try {
      // Get current month date range
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Monthly revenue (paid invoices this month)
      const { data: monthlyInvoices, error: monthlyError } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', monthStart.toISOString())
        .lte('paid_at', monthEnd.toISOString());

      if (monthlyError) throw monthlyError;

      const monthly_revenue = monthlyInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Total revenue (all paid invoices)
      const { data: allInvoices, error: allError } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid');

      if (allError) throw allError;

      const total_revenue = allInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Pending invoices count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('subscription_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      return {
        monthly_revenue,
        total_revenue,
        pending_count: pendingCount || 0,
      };
    } catch (error) {
      console.error('Error getting invoices stats:', error);
      return { monthly_revenue: 0, total_revenue: 0, pending_count: 0 };
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
      // Active webhooks
      const { count: activeCount, error: activeError } = await supabase
        .from('webhooks')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true)
        .eq('is_deleted', false);

      if (activeError) throw activeError;

      // Unhealthy webhooks (health_status != 'healthy')
      const { count: unhealthyCount, error: unhealthyError } = await supabase
        .from('webhooks')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true)
        .neq('health_status', 'healthy')
        .eq('is_deleted', false);

      if (unhealthyError) throw unhealthyError;

      // Total deliveries (from webhook_delivery_logs)
      const { count: deliveriesCount, error: deliveriesError } = await supabase
        .from('webhook_delivery_logs')
        .select('*', { count: 'exact', head: true });

      if (deliveriesError) throw deliveriesError;

      return {
        active: activeCount || 0,
        unhealthy: unhealthyCount || 0,
        total_deliveries: deliveriesCount || 0,
      };
    } catch (error) {
      console.error('Error getting webhooks stats:', error);
      return { active: 0, unhealthy: 0, total_deliveries: 0 };
    }
  }

  /**
   * Get API usage statistics
   * Ready for: GET /api/v1/dashboard/stats/api-usage
   */
  private async getApiUsageStats(): Promise<{
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
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      if (todayError) throw todayError;

      // API calls this month
      const { count: monthCount, error: monthError } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      if (monthError) throw monthError;

      // Errors today (status_code >= 400)
      const { count: errorsCount, error: errorsError } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .gte('response_status', 400);

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
   * Ready for: GET /api/v1/dashboard/stats/traffic
   */
  private async getTrafficStats(): Promise<{
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
        .from('traffic_logs')
        .select('*', { count: 'exact', head: true })
        .gte('access_time', todayStart.toISOString());

      if (todayError) throw todayError;

      // Traffic this month
      const { count: monthCount, error: monthError } = await supabase
        .from('traffic_logs')
        .select('*', { count: 'exact', head: true })
        .gte('access_time', monthStart.toISOString());

      if (monthError) throw monthError;

      // Unique visitors today (distinct ip_address)
      const { data: uniqueData, error: uniqueError } = await supabase
        .from('traffic_logs')
        .select('ip_address')
        .gte('access_time', todayStart.toISOString());

      if (uniqueError) throw uniqueError;

      const unique_today = new Set(uniqueData?.map(d => d.ip_address)).size;

      return {
        today: todayCount || 0,
        month: monthCount || 0,
        unique_today,
      };
    } catch (error) {
      console.error('Error getting traffic stats:', error);
      return { today: 0, month: 0, unique_today: 0 };
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
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      if (totalError) throw totalError;

      // Active jobs
      const { count: activeCount, error: activeError } = await supabase
        .from('system_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('is_deleted', false);

      if (activeError) throw activeError;

      // Failed jobs
      const { count: failedCount, error: failedError } = await supabase
        .from('system_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .eq('is_deleted', false);

      if (failedError) throw failedError;

      return {
        total: totalCount || 0,
        active: activeCount || 0,
        failed: failedCount || 0,
      };
    } catch (error) {
      console.error('Error getting jobs stats:', error);
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
        .eq('is_deleted', false);

      const { count: lastMonthUsers, error: lastUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .eq('is_deleted', false);

      const users_growth = this.calculateGrowth(thisMonthUsers || 0, lastMonthUsers || 0);

      // Tenants growth
      const { count: thisMonthTenants, error: thisTenantsError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString())
        .eq('is_deleted', false);

      const { count: lastMonthTenants, error: lastTenantsError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString())
        .eq('is_deleted', false);

      const tenants_growth = this.calculateGrowth(thisMonthTenants || 0, lastMonthTenants || 0);

      // Revenue growth
      const { data: thisMonthRevenue, error: thisRevenueError } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', thisMonthStart.toISOString());

      const { data: lastMonthRevenue, error: lastRevenueError } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', lastMonthStart.toISOString())
        .lte('paid_at', lastMonthEnd.toISOString());

      const thisRevenue = thisMonthRevenue?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const lastRevenue = lastMonthRevenue?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const revenue_growth = this.calculateGrowth(thisRevenue, lastRevenue);

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
        this.getRevenueByDate(dates),
        this.getUsersByDate(dates),
        this.getApiCallsByDate(dates),
        this.getTrafficByDate(dates),
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

  private async getRevenueByDate(dates: string[]): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    
    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', date)
        .lt('paid_at', nextDate.toISOString().split('T')[0]);

      const value = data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      result.push({ date, value });
    }
    
    return result;
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
        .eq('is_deleted', false);

      result.push({ date, value: count || 0 });
    }
    
    return result;
  }

  private async getApiCallsByDate(dates: string[]): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    
    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const { count, error } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date)
        .lt('created_at', nextDate.toISOString().split('T')[0]);

      result.push({ date, value: count || 0 });
    }
    
    return result;
  }

  private async getTrafficByDate(dates: string[]): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    
    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const { count, error } = await supabase
        .from('traffic_logs')
        .select('*', { count: 'exact', head: true })
        .gte('access_time', date)
        .lt('access_time', nextDate.toISOString().split('T')[0]);

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
        .select('id, full_name, email, created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!usersError && users) {
        users.forEach(user => {
          activities.push({
            id: user.id,
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
        .select('id, tenant_id, created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!subsError && subs) {
        subs.forEach(sub => {
          activities.push({
            id: sub.id,
            type: 'subscription',
            description: `New subscription created`,
            timestamp: sub.created_at,
            tenant_name: sub.tenant_id,
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
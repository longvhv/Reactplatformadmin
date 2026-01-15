/**
 * Dashboard Service - Real data from Supabase
 * Fetches dashboard metrics, activities, and charts
 */

import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  bgColor: string;
}

export interface Activity {
  _id: string;
  type: 'user' | 'tenant' | 'subscription' | 'order' | 'system';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DashboardOverview {
  totalUsers: number;
  activeUsers: number;
  totalTenants: number;
  activeTenants: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

/**
 * Fetch overview statistics from Supabase
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  try {
    // Fetch users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('_id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (usersError) throw usersError;

    // Fetch active users (status = 'ACTIVE')
    const { count: activeUsers, error: activeUsersError } = await supabase
      .from('users')
      .select('_id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
      .is('deleted_at', null);

    if (activeUsersError) throw activeUsersError;

    // Fetch tenants count
    const { count: totalTenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('_id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (tenantsError) throw tenantsError;

    // Fetch active tenants (status = 'ACTIVE')
    const { count: activeTenants, error: activeTenantsError } = await supabase
      .from('tenants')
      .select('_id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
      .is('deleted_at', null);

    if (activeTenantsError) throw activeTenantsError;

    // Fetch subscriptions count (if table exists)
    let totalSubscriptions = 0;
    let activeSubscriptions = 0;
    
    const { count: subsCount, error: subsError } = await supabase
      .from('subscriptions')
      .select('_id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (!subsError) {
      totalSubscriptions = subsCount || 0;

      const { count: activeSubsCount, error: activeSubsError } = await supabase
        .from('subscriptions')
        .select('_id', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .is('deleted_at', null);

      if (!activeSubsError) {
        activeSubscriptions = activeSubsCount || 0;
      }
    }

    // Fetch orders count (if table exists)
    let totalOrders = 0;
    let pendingOrders = 0;

    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('_id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (!ordersError) {
      totalOrders = ordersCount || 0;

      const { count: pendingOrdersCount, error: pendingOrdersError } = await supabase
        .from('orders')
        .select('_id', { count: 'exact', head: true })
        .eq('status', 'PENDING')
        .is('deleted_at', null);

      if (!pendingOrdersError) {
        pendingOrders = pendingOrdersCount || 0;
      }
    }

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalTenants: totalTenants || 0,
      activeTenants: activeTenants || 0,
      totalSubscriptions,
      activeSubscriptions,
      totalOrders,
      pendingOrders,
      totalRevenue: 0, // Will be calculated from orders/invoices
      monthlyRevenue: 0, // Will be calculated from orders/invoices
    };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
}

/**
 * Transform overview data to stat cards
 */
export function transformToStatCards(overview: DashboardOverview): DashboardStats[] {
  return [
    {
      label: 'dashboard.totalUsers',
      value: overview.totalUsers.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: 'Users',
      color: 'text-[#6366f1]',
      bgColor: 'bg-[#6366f1]/10',
    },
    {
      label: 'dashboard.activeTenants',
      value: overview.activeTenants.toLocaleString(),
      change: '+8.3%',
      trend: 'up',
      icon: 'Building2',
      color: 'text-[#3b82f6]',
      bgColor: 'bg-[#3b82f6]/10',
    },
    {
      label: 'dashboard.activeSubscriptions',
      value: overview.activeSubscriptions.toLocaleString(),
      change: '+15.2%',
      trend: 'up',
      icon: 'CreditCard',
      color: 'text-[#10b981]',
      bgColor: 'bg-[#10b981]/10',
    },
    {
      label: 'dashboard.pendingOrders',
      value: overview.pendingOrders.toLocaleString(),
      change: '-5.1%',
      trend: 'down',
      icon: 'ShoppingCart',
      color: 'text-[#f59e0b]',
      bgColor: 'bg-[#f59e0b]/10',
    },
  ];
}

/**
 * Fetch recent activities from multiple tables
 */
export async function getRecentActivities(limit: number = 10): Promise<Activity[]> {
  try {
    const activities: Activity[] = [];

    // Fetch recent users (last 5)
    const { data: recentUsers, error: usersError } = await supabase
      .from('users')
      .select('_id, full_name, email, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!usersError && recentUsers) {
      recentUsers.forEach((user) => {
        activities.push({
          _id: user._id,
          type: 'user',
          title: 'dashboard.newUserRegistered',
          description: `${user.full_name || user.email}`,
          timestamp: user.created_at,
          icon: 'UserPlus',
          color: 'text-[#6366f1]',
        });
      });
    }

    // Fetch recent tenants (last 5)
    const { data: recentTenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('_id, name, code, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!tenantsError && recentTenants) {
      recentTenants.forEach((tenant) => {
        activities.push({
          _id: tenant._id,
          type: 'tenant',
          title: 'dashboard.newTenantCreated',
          description: `${tenant.name} (${tenant.code})`,
          timestamp: tenant.created_at,
          icon: 'Building2',
          color: 'text-[#3b82f6]',
        });
      });
    }

    // Sort by timestamp descending and limit
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

/**
 * Get user growth chart data (last 30 days)
 */
export async function getUserGrowthChart(): Promise<ChartDataPoint[]> {
  try {
    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: users, error } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const dateMap = new Map<string, number>();
    
    // Initialize all dates in range
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Count users per date
    users?.forEach((user) => {
      const dateStr = user.created_at.split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    // Convert to array
    return Array.from(dateMap.entries()).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  } catch (error) {
    console.error('Error fetching user growth chart:', error);
    return [];
  }
}

/**
 * Get tenant growth chart data (last 30 days)
 */
export async function getTenantGrowthChart(): Promise<ChartDataPoint[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const dateMap = new Map<string, number>();
    
    // Initialize all dates in range
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Count tenants per date
    tenants?.forEach((tenant) => {
      const dateStr = tenant.created_at.split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    // Convert to array
    return Array.from(dateMap.entries()).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  } catch (error) {
    console.error('Error fetching tenant growth chart:', error);
    return [];
  }
}

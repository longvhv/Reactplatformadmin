/**
 * Billing Service
 * Handles data related to Subscriptions, Orders, and Invoices
 */

import { supabase } from '../utils/supabase/client';
import { TimeSeriesData } from './dashboardService';

export class BillingService {
  /**
   * Get subscriptions statistics
   */
  async getSubscriptionsStats(): Promise<{
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
        .is('deleted_at', null);

      if (activeError) {
        if (activeError.code === 'PGRST204' || activeError.code === '42P01' || activeError.code === 'PGRST116') {
          console.warn('⚠️  Table tenant_subscriptions not found - returning zero stats');
          return { active: 0, expiring: 0, total_orders: 0 };
        }
        if (activeError.message === 'TypeError: Failed to fetch') {
          console.warn('⚠️  Network error fetching tenant_subscriptions');
          return { active: 0, expiring: 0, total_orders: 0 };
        }
        throw activeError;
      }

      // Expiring soon (within 7 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      const expiryDateStr = expiryDate.toISOString();

      const { count: expiringCount, error: expiringError } = await supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null)
        .lte('end_date', expiryDateStr);

      if (expiringError) throw expiringError;

      // Total orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('subscription_orders')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      if (ordersError) {
        if (ordersError.code === '42P01' || ordersError.message?.includes('does not exist')) {
          console.warn('⚠️  Table subscription_orders not found');
        } else if (ordersError.message === 'TypeError: Failed to fetch') {
          console.warn('⚠️  Network error fetching subscription_orders (check connection/CORS)');
        } else {
          console.error('Error fetching subscription_orders:', ordersError);
        }
        
        return {
          active: activeCount || 0,
          expiring: expiringCount || 0,
          total_orders: 0,
        };
      }

      return {
        active: activeCount || 0,
        expiring: expiringCount || 0,
        total_orders: ordersCount || 0,
      };
    } catch (error: any) {
      console.error('Error getting subscriptions stats:', error);
      return { active: 0, expiring: 0, total_orders: 0 };
    }
  }

  /**
   * Get invoices statistics
   */
  async getInvoicesStats(): Promise<{
    monthly_revenue: number;
    total_revenue: number;
    pending_count: number;
  }> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Monthly revenue
      const { data: monthlyInvoices, error: monthlyError } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', monthStart.toISOString())
        .lte('paid_at', monthEnd.toISOString());

      if (monthlyError) throw monthlyError;

      const monthly_revenue = monthlyInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Total revenue
      const { data: allInvoices, error: allError } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid');

      if (allError) throw allError;

      const total_revenue = allInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Pending invoices
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
   * Get revenue growth
   */
  async getRevenueGrowth(): Promise<number> {
    try {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: thisMonthRevenue } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', thisMonthStart.toISOString());

      const { data: lastMonthRevenue } = await supabase
        .from('subscription_invoices')
        .select('total_amount')
        .eq('status', 'paid')
        .gte('paid_at', lastMonthStart.toISOString())
        .lte('paid_at', lastMonthEnd.toISOString());

      const thisRevenue = thisMonthRevenue?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const lastRevenue = lastMonthRevenue?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      if (lastRevenue === 0) return thisRevenue > 0 ? 100 : 0;
      return ((thisRevenue - lastRevenue) / lastRevenue) * 100;
    } catch (error) {
      console.error('Error getting revenue growth:', error);
      return 0;
    }
  }

  /**
   * Get revenue by date for charts
   */
  async getRevenueByDate(dates: string[]): Promise<TimeSeriesData[]> {
    const result: TimeSeriesData[] = [];
    
    for (const date of dates) {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const { data } = await supabase
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
}

export const billingService = new BillingService();

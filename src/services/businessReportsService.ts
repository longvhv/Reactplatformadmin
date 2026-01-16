/**
 * SaaS Business Reports Service
 * Handles revenue statistics and business analytics
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';

// Types matching telemetry.saas_business_reports table
export interface BusinessReport {
  _id: string; // UUID primary key
  report_date?: string; // Date
  partner_id?: string; // UUID - maps to tenant_id
  revenue_category?: string;
  total_revenue?: number; // numeric(30, 4)
  currency_code?: string; // char(3), default 'VND'
  tenant_count?: number;
  details_json?: Record<string, any>; // jsonb
  created_at: string;
}

export interface BusinessReportFilters {
  partner_id?: string;
  revenue_category?: string;
  date_from?: string;
  date_to?: string;
  currency_code?: string;
}

export interface RevenueStats {
  total_revenue: number;
  avg_revenue: number;
  total_tenants: number;
  categories: Array<{
    category: string;
    revenue: number;
    tenant_count: number;
  }>;
  by_date: Array<{
    date: string;
    revenue: number;
  }>;
  by_currency: Array<{
    currency: string;
    total: number;
  }>;
}

class BusinessReportsService {
  private table = 'saas_business_reports';
  private schema = 'telemetry';

  /**
   * Fetch all business reports with optional filters
   * Ready for: GET /api/v1/telemetry/business-reports
   */
  async getAll(filters?: BusinessReportFilters): Promise<BusinessReport[]> {
    try {
      let query = supabase
        .from(this.table)
        .select('*')
        .order('report_date', { ascending: false });

      // Apply filters
      if (filters?.partner_id) {
        query = query.eq('partner_id', filters.partner_id);
      }
      if (filters?.revenue_category) {
        query = query.eq('revenue_category', filters.revenue_category);
      }
      if (filters?.currency_code) {
        query = query.eq('currency_code', filters.currency_code);
      }
      if (filters?.date_from) {
        query = query.gte('report_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('report_date', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching business reports:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  /**
   * Get single business report by ID
   * Ready for: GET /api/v1/telemetry/business-reports/:id
   */
  async getById(id: string): Promise<BusinessReport | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching business report:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Get reports by partner (tenant) ID
   * Ready for: GET /api/v1/telemetry/business-reports/partner/:partnerId
   */
  async getByPartnerId(partnerId: string, filters?: Omit<BusinessReportFilters, 'partner_id'>): Promise<BusinessReport[]> {
    return this.getAll({ ...filters, partner_id: partnerId });
  }

  /**
   * Create new business report
   * Ready for: POST /api/v1/telemetry/business-reports
   */
  async create(report: Omit<BusinessReport, '_id' | 'created_at'>): Promise<BusinessReport> {
    try {
      // Generate UUID for _id (browser-compatible)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const reportData = {
        _id: generateUUID(), // ✅ FIX: Generate UUID for _id (browser-compatible)
        ...report,
        details_json: report.details_json || {},
        currency_code: report.currency_code || 'VND',
      };

      const { data, error } = await supabase
        .from(this.table)
        .insert([reportData])
        .select()
        .single();

      if (error) {
        console.error('Error creating business report:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update business report
   * Ready for: PUT /api/v1/telemetry/business-reports/:id
   */
  async update(id: string, report: Partial<BusinessReport>): Promise<BusinessReport> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .update(report)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating business report:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete business report
   * Ready for: DELETE /api/v1/telemetry/business-reports/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting business report:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Get revenue statistics for a partner
   * Ready for: GET /api/v1/telemetry/business-reports/stats/:partnerId
   */
  async getRevenueStats(partnerId: string, filters?: Omit<BusinessReportFilters, 'partner_id'>): Promise<RevenueStats> {
    try {
      const reports = await this.getByPartnerId(partnerId, filters);

      if (reports.length === 0) {
        return {
          total_revenue: 0,
          avg_revenue: 0,
          total_tenants: 0,
          categories: [],
          by_date: [],
          by_currency: [],
        };
      }

      // Calculate total revenue
      const total_revenue = reports.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
      const avg_revenue = total_revenue / reports.length;
      const total_tenants = reports.reduce((sum, r) => sum + (r.tenant_count || 0), 0);

      // Group by category
      const categoryMap: Record<string, { revenue: number; tenant_count: number }> = {};
      reports.forEach(r => {
        const category = r.revenue_category || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = { revenue: 0, tenant_count: 0 };
        }
        categoryMap[category].revenue += r.total_revenue || 0;
        categoryMap[category].tenant_count += r.tenant_count || 0;
      });

      const categories = Object.entries(categoryMap)
        .map(([category, data]) => ({
          category,
          revenue: data.revenue,
          tenant_count: data.tenant_count,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Group by date
      const dateMap: Record<string, number> = {};
      reports.forEach(r => {
        if (r.report_date) {
          const date = r.report_date;
          dateMap[date] = (dateMap[date] || 0) + (r.total_revenue || 0);
        }
      });

      const by_date = Object.entries(dateMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Group by currency
      const currencyMap: Record<string, number> = {};
      reports.forEach(r => {
        const currency = r.currency_code || 'VND';
        currencyMap[currency] = (currencyMap[currency] || 0) + (r.total_revenue || 0);
      });

      const by_currency = Object.entries(currencyMap)
        .map(([currency, total]) => ({ currency, total }))
        .sort((a, b) => b.total - a.total);

      return {
        total_revenue: Math.round(total_revenue * 10000) / 10000,
        avg_revenue: Math.round(avg_revenue * 10000) / 10000,
        total_tenants,
        categories,
        by_date,
        by_currency,
      };
    } catch (error) {
      console.error('Error in getRevenueStats:', error);
      throw error;
    }
  }

  /**
   * Get revenue by category for a partner
   * Ready for: GET /api/v1/telemetry/business-reports/by-category/:partnerId
   */
  async getRevenueByCategory(partnerId: string): Promise<Array<{ category: string; revenue: number; percentage: number }>> {
    try {
      const reports = await this.getByPartnerId(partnerId);
      
      if (reports.length === 0) return [];

      const categoryMap: Record<string, number> = {};
      let total = 0;

      reports.forEach(r => {
        const category = r.revenue_category || 'Uncategorized';
        const revenue = r.total_revenue || 0;
        categoryMap[category] = (categoryMap[category] || 0) + revenue;
        total += revenue;
      });

      return Object.entries(categoryMap)
        .map(([category, revenue]) => ({
          category,
          revenue: Math.round(revenue * 10000) / 10000,
          percentage: total > 0 ? Math.round((revenue / total) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Error in getRevenueByCategory:', error);
      throw error;
    }
  }

  /**
   * Get revenue trend over time
   * Ready for: GET /api/v1/telemetry/business-reports/trend/:partnerId
   */
  async getRevenueTrend(
    partnerId: string,
    groupBy: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<Array<{ period: string; revenue: number; tenant_count: number }>> {
    try {
      const reports = await this.getByPartnerId(partnerId);

      if (reports.length === 0) return [];

      const periodMap: Record<string, { revenue: number; tenant_count: number }> = {};

      reports.forEach(r => {
        if (!r.report_date) return;

        const date = new Date(r.report_date);
        let period: string;

        switch (groupBy) {
          case 'day':
            period = r.report_date;
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            period = weekStart.toISOString().split('T')[0];
            break;
          case 'year':
            period = date.getFullYear().toString();
            break;
          default: // month
            period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!periodMap[period]) {
          periodMap[period] = { revenue: 0, tenant_count: 0 };
        }
        periodMap[period].revenue += r.total_revenue || 0;
        periodMap[period].tenant_count += r.tenant_count || 0;
      });

      return Object.entries(periodMap)
        .map(([period, data]) => ({
          period,
          revenue: Math.round(data.revenue * 10000) / 10000,
          tenant_count: data.tenant_count,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Error in getRevenueTrend:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const businessReportsService = new BusinessReportsService();
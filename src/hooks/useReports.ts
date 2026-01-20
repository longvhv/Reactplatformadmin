/**
 * useReports Hook
 * Manages business reports and report generation
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * Schema:
 * - telemetry.saas_business_reports: report_date, revenue_category, total_revenue
 * 
 * NOTE: Reports can be generated from multiple data sources
 * Complex reports should be generated server-side in Golang API
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Business Report type (from telemetry.saas_business_reports)
 */
export interface BusinessReport {
  _id: string;
  report_date?: string; // date
  partner_id?: string;
  revenue_category?: string;
  total_revenue?: number;
  currency_code?: string;
  tenant_count?: number;
  details_json?: any;
  created_at: string;
}

/**
 * Report parameters for generation
 */
export interface ReportParams {
  report_type: 'revenue' | 'usage' | 'tenants' | 'subscriptions' | 'custom';
  start_date: string;
  end_date: string;
  partner_id?: string;
  tenant_id?: string;
  filters?: Record<string, any>;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Generated report data structure
 */
export interface GeneratedReport {
  id: string;
  type: string;
  title: string;
  description?: string;
  generated_at: string;
  params: ReportParams;
  data: any[];
  summary: {
    total_records: number;
    total_value?: number;
    avg_value?: number;
    min_value?: number;
    max_value?: number;
    [key: string]: any;
  };
  charts?: Array<{
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: any[];
  }>;
}

/**
 * Hook for report management
 * @param partnerId - Optional partner ID for filtering
 */
export function useReports(partnerId?: string) {
  const [reports, setReports] = useState<BusinessReport[]>([]);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load existing reports
   */
  const loadReports = useCallback(
    async (startDate?: string, endDate?: string) => {
      // Guard: Wait for dataClient to be ready
      if (!dataClient) {
        console.log('[useReports] Waiting for DataClient to initialize...');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[useReports] Loading reports...');

        // Build filters
        const filters: Record<string, any> = {};
        if (partnerId) filters.partner_id = partnerId;
        if (startDate) filters.report_date_gte = startDate;
        if (endDate) filters.report_date_lte = endDate;

        // Query using DataClient
        const result = await dataClient.query<BusinessReport>('saas_business_reports', {
          filters,
          orderBy: [{ field: 'report_date', direction: 'desc' }],
        });

        console.log('[useReports] Loaded reports:', result.data.length);

        setReports(result.data);
        setTotal(result.total);
        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load reports';
        setError(message);
        console.error('[useReports] Error loading reports:', err);
        setLoading(false);
      }
    },
    [partnerId, dataClient]
  );

  /**
   * Generate new report
   * 
   * NOTE: For complex reports, this should call a dedicated Golang API endpoint
   * For now, we aggregate data client-side (slower but functional)
   */
  const generateReport = useCallback(
    async (params: ReportParams): Promise<GeneratedReport> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setGenerating(true);
      setError(null);

      try {
        console.log('[useReports] Generating report:', params.report_type);

        // TODO: When Golang API is ready, call dedicated endpoint:
        // const report = await dataClient.execute('POST', '/reports/generate', params);

        // For now, generate client-side
        let reportData: GeneratedReport;

        switch (params.report_type) {
          case 'revenue':
            reportData = await generateRevenueReport(dataClient, params);
            break;
          case 'usage':
            reportData = await generateUsageReport(dataClient, params);
            break;
          case 'tenants':
            reportData = await generateTenantsReport(dataClient, params);
            break;
          case 'subscriptions':
            reportData = await generateSubscriptionsReport(dataClient, params);
            break;
          default:
            throw new Error(`Unknown report type: ${params.report_type}`);
        }

        console.log('[useReports] Report generated:', reportData.id);

        setGeneratedReport(reportData);
        setGenerating(false);
        return reportData;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate report';
        setError(message);
        console.error('[useReports] Error generating report:', err);
        setGenerating(false);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Save generated report
   */
  const saveReport = useCallback(
    async (report: GeneratedReport): Promise<BusinessReport> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useReports] Saving report:', report.id);

        const newReport = await dataClient.create<BusinessReport>('saas_business_reports', {
          report_date: report.params.start_date,
          partner_id: report.params.partner_id,
          revenue_category: report.type,
          total_revenue: report.summary.total_value || 0,
          currency_code: 'VND',
          tenant_count: report.summary.total_records || 0,
          details_json: {
            title: report.title,
            description: report.description,
            params: report.params,
            summary: report.summary,
            generated_at: report.generated_at,
          },
        });

        console.log('[useReports] Report saved:', newReport._id);

        // Add to list
        setReports((prev) => [newReport, ...prev]);

        return newReport;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save report';
        setError(message);
        console.error('[useReports] Error saving report:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Delete report
   */
  const deleteReport = useCallback(
    async (id: string): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useReports] Deleting report:', id);

        await dataClient.delete('saas_business_reports', id);

        console.log('[useReports] Report deleted');

        // Remove from list
        setReports((prev) => prev.filter((r) => r._id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete report';
        setError(message);
        console.error('[useReports] Error deleting report:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Export report to CSV
   */
  const exportToCSV = useCallback((report: GeneratedReport): string => {
    if (!report.data.length) {
      return '';
    }

    // Get headers from first data item
    const headers = Object.keys(report.data[0]).join(',');

    // Map data to CSV rows
    const rows = report.data.map((item) =>
      Object.values(item)
        .map((value) => {
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    );

    return [headers, ...rows].join('\n');
  }, []);

  /**
   * Export report to JSON
   */
  const exportToJSON = useCallback((report: GeneratedReport): string => {
    return JSON.stringify(report, null, 2);
  }, []);

  /**
   * Clear generated report
   */
  const clearReport = useCallback(() => {
    setGeneratedReport(null);
  }, []);

  /**
   * Reload reports from server
   */
  const refresh = useCallback(async () => {
    await loadReports();
  }, [loadReports]);

  // Auto-load on mount
  useEffect(() => {
    if (dataClient) {
      console.log('[useReports] Auto-loading reports...');
      loadReports();
    }
  }, [dataClient]); // Only depend on dataClient

  return {
    reports,
    generatedReport,
    loading,
    generating,
    error,
    total,
    loadReports,
    generateReport,
    saveReport,
    deleteReport,
    exportToCSV,
    exportToJSON,
    clearReport,
    refresh,
  };
}

// ============================================================================
// Report Generation Functions
// ============================================================================

/**
 * Generate revenue report
 */
async function generateRevenueReport(
  dataClient: any,
  params: ReportParams
): Promise<GeneratedReport> {
  // Query subscriptions in date range
  const result = await dataClient.query('tenant_subscriptions', {
    filters: {
      start_date_gte: params.start_date,
      start_date_lte: params.end_date,
      ...params.filters,
    },
  });

  const data = result.data.map((sub: any) => ({
    date: sub.start_date,
    tenant_id: sub.tenant_id,
    plan_name: sub.plan_name,
    revenue: sub.total_amount,
    currency: sub.currency,
  }));

  const totalRevenue = data.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  return {
    id: generateReportId(),
    type: 'revenue',
    title: 'Revenue Report',
    description: `Revenue from ${params.start_date} to ${params.end_date}`,
    generated_at: new Date().toISOString(),
    params,
    data,
    summary: {
      total_records: data.length,
      total_value: totalRevenue,
      avg_value: avgRevenue,
    },
  };
}

/**
 * Generate usage report
 */
async function generateUsageReport(
  dataClient: any,
  params: ReportParams
): Promise<GeneratedReport> {
  // Query usage events in date range
  const result = await dataClient.query('usage_events', {
    filters: {
      timestamp_gte: params.start_date,
      timestamp_lte: params.end_date,
      tenant_id: params.tenant_id,
      ...params.filters,
    },
  });

  const data = result.data.map((event: any) => ({
    date: event.timestamp,
    tenant_id: event.tenant_id,
    event_type: event.event_type,
    quantity: event.quantity,
    unit: event.unit,
  }));

  const totalQuantity = data.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  return {
    id: generateReportId(),
    type: 'usage',
    title: 'Usage Report',
    description: `Usage from ${params.start_date} to ${params.end_date}`,
    generated_at: new Date().toISOString(),
    params,
    data,
    summary: {
      total_records: data.length,
      total_value: totalQuantity,
    },
  };
}

/**
 * Generate tenants report
 */
async function generateTenantsReport(
  dataClient: any,
  params: ReportParams
): Promise<GeneratedReport> {
  // Query tenants created in date range
  const result = await dataClient.query('tenants', {
    filters: {
      created_at_gte: params.start_date,
      created_at_lte: params.end_date,
      ...params.filters,
    },
  });

  const data = result.data.map((tenant: any) => ({
    tenant_id: tenant._id,
    tenant_code: tenant.code,
    tenant_name: tenant.name,
    tier: tenant.tier,
    status: tenant.status,
    created_at: tenant.created_at,
  }));

  return {
    id: generateReportId(),
    type: 'tenants',
    title: 'Tenants Report',
    description: `New tenants from ${params.start_date} to ${params.end_date}`,
    generated_at: new Date().toISOString(),
    params,
    data,
    summary: {
      total_records: data.length,
    },
  };
}

/**
 * Generate subscriptions report
 */
async function generateSubscriptionsReport(
  dataClient: any,
  params: ReportParams
): Promise<GeneratedReport> {
  // Query subscriptions in date range
  const result = await dataClient.query('tenant_subscriptions', {
    filters: {
      start_date_gte: params.start_date,
      start_date_lte: params.end_date,
      ...params.filters,
    },
  });

  const data = result.data.map((sub: any) => ({
    subscription_id: sub._id,
    tenant_id: sub.tenant_id,
    plan_name: sub.plan_name,
    status: sub.status,
    start_date: sub.start_date,
    end_date: sub.end_date,
    total_amount: sub.total_amount,
  }));

  const totalAmount = data.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0);

  return {
    id: generateReportId(),
    type: 'subscriptions',
    title: 'Subscriptions Report',
    description: `Subscriptions from ${params.start_date} to ${params.end_date}`,
    generated_at: new Date().toISOString(),
    params,
    data,
    summary: {
      total_records: data.length,
      total_value: totalAmount,
    },
  };
}

/**
 * Generate unique report ID
 */
function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

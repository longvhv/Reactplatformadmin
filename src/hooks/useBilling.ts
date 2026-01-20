/**
 * useBilling Hook
 * Manages subscription invoices and billing
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: No separate payments/credits tables - tracking in invoices
 * 
 * Schema:
 * - subscription_invoices: invoice_number, amounts, billing_period, status
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Subscription Invoice type (from subscription_invoices table)
 */
export interface SubscriptionInvoice {
  _id: string;
  tenant_id: string;
  subscription_id?: string;
  order_id?: string;
  invoice_number: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  currency_code: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  billing_info?: any; // Customer billing information
  items_snapshot?: any[]; // Invoice line items
  tax_breakdown?: any[]; // Tax details
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at?: string;
  metadata?: any;
  price_adjustments?: any[];
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  version: number;
}

/**
 * Invoice filters
 */
export interface InvoiceFilters {
  status?: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  subscription_id?: string;
  overdue?: boolean; // Due date passed and not paid
  date_from?: string;
  date_to?: string;
}

/**
 * Invoice summary stats
 */
export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_due: number;
  overdue_count: number;
  overdue_amount: number;
  by_status: Record<string, number>;
}

/**
 * Hook for billing/invoice management
 * @param tenantId - The ID of the tenant
 * @param filters - Optional filters
 */
export function useBilling(tenantId?: string, filters?: InvoiceFilters) {
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load invoices
   */
  const loadInvoices = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setInvoices([]);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useBilling] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useBilling] Loading invoices for tenant:', tenantId);

      // Try cache first
      const cacheKey = `invoices_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 2 minutes old (billing data should be fresh)
        if (cacheAge < 2 * 60 * 1000) {
          setInvoices(cached.data);
          setSummary(cached.summary);
          setTotal(cached.total);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load invoices';
      setError(message);
      console.error('[useBilling] Error loading invoices:', err);
      setLoading(false);
    }
  }, [tenantId, filters, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Build filters
      const queryFilters: Record<string, any> = {
        tenant_id: tenantId,
      };

      if (filters?.status) queryFilters.status = filters.status;
      if (filters?.subscription_id) queryFilters.subscription_id = filters.subscription_id;
      if (filters?.date_from) queryFilters.billing_period_start_gte = filters.date_from;
      if (filters?.date_to) queryFilters.billing_period_end_lte = filters.date_to;

      // Query using DataClient
      const result = await dataClient.query<SubscriptionInvoice>('subscription_invoices', {
        filters: queryFilters,
        orderBy: [{ field: 'created_at', direction: 'desc' }],
      });

      console.log('[useBilling] Loaded invoices:', result.data.length);

      // Apply client-side filters
      let filteredData = result.data;

      // Filter overdue
      if (filters?.overdue) {
        const now = new Date();
        filteredData = filteredData.filter((invoice) => {
          if (invoice.status === 'PAID') return false;
          return new Date(invoice.due_date) < now;
        });
      }

      // Calculate summary
      const calculatedSummary = calculateSummary(filteredData);

      // Update cache
      localStorage.setItem(
        `invoices_${tenantId}`,
        JSON.stringify({
          data: filteredData,
          summary: calculatedSummary,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setInvoices(filteredData);
      setSummary(calculatedSummary);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useBilling] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Create new invoice
   */
  const createInvoice = useCallback(
    async (data: Partial<SubscriptionInvoice>): Promise<SubscriptionInvoice> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useBilling] Creating invoice');

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(tenantId);

        // Calculate amounts
        const subtotal = data.subtotal || 0;
        const taxAmount = data.tax_amount || 0;
        const discountAmount = data.discount_amount || 0;
        const totalAmount = subtotal + taxAmount - discountAmount;
        const amountDue = totalAmount - (data.amount_paid || 0);

        const newInvoice = await dataClient.create<SubscriptionInvoice>(
          'subscription_invoices',
          {
            tenant_id: tenantId,
            status: 'DRAFT',
            currency_code: 'VND',
            subtotal,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            total_amount: totalAmount,
            amount_paid: 0,
            amount_due: amountDue,
            billing_info: {},
            items_snapshot: [],
            tax_breakdown: [],
            price_adjustments: [],
            version: 1,
            invoice_number: invoiceNumber,
            ...data,
          }
        );

        console.log('[useBilling] Invoice created:', newInvoice._id);

        // Optimistic update
        setInvoices((prev) => [newInvoice, ...prev]);

        // Invalidate cache
        localStorage.removeItem(`invoices_${tenantId}`);

        return newInvoice;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create invoice';
        setError(message);
        console.error('[useBilling] Error creating invoice:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update invoice
   */
  const updateInvoice = useCallback(
    async (
      id: string,
      updates: Partial<SubscriptionInvoice>
    ): Promise<SubscriptionInvoice> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useBilling] Updating invoice:', id);

        const updatedInvoice = await dataClient.update<SubscriptionInvoice>(
          'subscription_invoices',
          id,
          updates
        );

        console.log('[useBilling] Invoice updated');

        // Optimistic update
        setInvoices((prev) => prev.map((inv) => (inv._id === id ? updatedInvoice : inv)));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`invoices_${tenantId}`);
        }

        return updatedInvoice;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update invoice';
        setError(message);
        console.error('[useBilling] Error updating invoice:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Delete invoice
   */
  const deleteInvoice = useCallback(
    async (id: string): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useBilling] Deleting invoice:', id);

        await dataClient.delete('subscription_invoices', id);

        console.log('[useBilling] Invoice deleted');

        // Optimistic update
        setInvoices((prev) => prev.filter((inv) => inv._id !== id));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`invoices_${tenantId}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete invoice';
        setError(message);
        console.error('[useBilling] Error deleting invoice:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Mark invoice as paid
   */
  const markAsPaid = useCallback(
    async (id: string, paidAmount?: number): Promise<SubscriptionInvoice> => {
      const invoice = invoices.find((inv) => inv._id === id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const amountPaid = paidAmount || invoice.amount_due;

      return updateInvoice(id, {
        status: 'PAID',
        amount_paid: amountPaid,
        amount_due: invoice.total_amount - amountPaid,
        paid_at: new Date().toISOString(),
      });
    },
    [invoices, updateInvoice]
  );

  /**
   * Void invoice
   */
  const voidInvoice = useCallback(
    async (id: string): Promise<SubscriptionInvoice> => {
      return updateInvoice(id, { status: 'VOID' });
    },
    [updateInvoice]
  );

  /**
   * Generate PDF for invoice
   * TODO: Implement PDF generation service
   */
  const generatePDF = useCallback(
    async (id: string): Promise<string> => {
      // TODO: Call PDF generation API
      // For now, return placeholder URL
      const pdfUrl = `https://example.com/invoices/${id}.pdf`;
      
      await updateInvoice(id, { pdf_url: pdfUrl });
      
      return pdfUrl;
    },
    [updateInvoice]
  );

  /**
   * Get overdue invoices
   */
  const getOverdueInvoices = useCallback((): SubscriptionInvoice[] => {
    const now = new Date();
    return invoices.filter((invoice) => {
      if (invoice.status === 'PAID') return false;
      return new Date(invoice.due_date) < now;
    });
  }, [invoices]);

  /**
   * Get invoice by ID
   */
  const getInvoice = useCallback(
    (id: string): SubscriptionInvoice | undefined => {
      return invoices.find((inv) => inv._id === id);
    },
    [invoices]
  );

  /**
   * Reload invoices from server
   */
  const refresh = useCallback(async () => {
    if (tenantId) {
      localStorage.removeItem(`invoices_${tenantId}`);
    }
    await loadInvoices();
  }, [tenantId, loadInvoices]);

  // Auto-load on mount and when tenantId/dataClient change
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useBilling] Auto-loading invoices for:', tenantId);
      loadInvoices();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  // Reload when filters change
  useEffect(() => {
    if (tenantId && dataClient) {
      loadInvoices();
    }
  }, [
    filters?.status,
    filters?.subscription_id,
    filters?.overdue,
    filters?.date_from,
    filters?.date_to,
  ]);

  return {
    invoices,
    summary,
    loading,
    error,
    total,
    loadInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    voidInvoice,
    generatePDF,
    getOverdueInvoices,
    getInvoice,
    refresh,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate invoice summary statistics
 */
function calculateSummary(invoices: SubscriptionInvoice[]): InvoiceSummary {
  const now = new Date();
  
  const summary: InvoiceSummary = {
    total_invoices: invoices.length,
    total_amount: 0,
    total_paid: 0,
    total_due: 0,
    overdue_count: 0,
    overdue_amount: 0,
    by_status: {},
  };

  invoices.forEach((invoice) => {
    summary.total_amount += invoice.total_amount;
    summary.total_paid += invoice.amount_paid;
    summary.total_due += invoice.amount_due;

    // Count by status
    summary.by_status[invoice.status] = (summary.by_status[invoice.status] || 0) + 1;

    // Count overdue
    if (invoice.status !== 'PAID' && new Date(invoice.due_date) < now) {
      summary.overdue_count++;
      summary.overdue_amount += invoice.amount_due;
    }
  });

  return summary;
}

/**
 * Generate invoice number
 * Format: INV-YYYYMM-XXXXX
 */
async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // TODO: Get sequence from database to ensure uniqueness
  const sequence = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
  
  return `INV-${year}${month}-${sequence}`;
}

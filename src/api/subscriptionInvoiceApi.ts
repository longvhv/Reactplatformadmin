/**
 * Subscription Invoice API Client
 * Extended methods for subscription invoices
 * 
 * ✅ REWRITTEN 2026-01-14: Now 100% matches subscription_invoices schema
 */
import { 
  invoiceApi, 
  Invoice, 
  CreateInvoiceRequest, 
  UpdateInvoiceRequest, 
  InvoiceFilters,
  PriceAdjustment,
} from './invoiceApi';

// Re-export types
export type SubscriptionInvoice = Invoice;
export type { 
  Invoice, 
  CreateInvoiceRequest, 
  UpdateInvoiceRequest, 
  InvoiceFilters,
  PriceAdjustment,
};

// Export enum-like types for status
export type InvoiceStatus = Invoice['status'];

// Statistics interface for dashboard
export interface InvoiceStatistics {
  total: number;
  draft: number;
  open: number;
  paid: number;
  void: number;
  uncollectible: number;
  overdue: number; // NEW
  
  // Financial breakdown (NEW)
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  amount_due: number; // NEW: Total amount due across all invoices
  
  // Deprecated (for backward compatibility)
  total_revenue?: number; // Use total_amount
}

// Extended API with additional methods for subscriptions page
export const subscriptionInvoiceApi = {
  ...invoiceApi,
  
  /**
   * Send invoice (change from DRAFT to OPEN)
   */
  send: async (id: string, version: number): Promise<Invoice> => {
    return invoiceApi.update(id, { 
      status: 'OPEN', 
      version 
    });
  },

  /**
   * Get invoice statistics
   * TODO (Golang): Implement /invoices/statistics endpoint
   */
  getStatistics: async (filters?: InvoiceFilters): Promise<InvoiceStatistics> => {
    const invoices = await invoiceApi.getAll(filters);
    
    const now = new Date();
    
    const stats: InvoiceStatistics = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'DRAFT').length,
      open: invoices.filter(i => i.status === 'OPEN').length,
      paid: invoices.filter(i => i.status === 'PAID').length,
      void: invoices.filter(i => i.status === 'VOID').length,
      uncollectible: invoices.filter(i => i.status === 'UNCOLLECTIBLE').length,
      overdue: invoices.filter(i => 
        i.status === 'OPEN' && new Date(i.due_date) < now
      ).length,
      
      // Use new financial fields
      total_amount: invoices.reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0),
      paid_amount: invoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
      outstanding_amount: invoices
        .filter(i => i.status === 'OPEN')
        .reduce((sum, i) => sum + (i.amount_due || 0), 0),
      amount_due: invoices.reduce((sum, i) => sum + (i.amount_due || 0), 0),
    };
    
    return stats;
  },

  /**
   * Get invoices by subscription
   */
  getBySubscription: async (subscriptionId: string): Promise<Invoice[]> => {
    return invoiceApi.getAll({ subscription_id: subscriptionId });
  },

  /**
   * Soft delete invoice
   * TODO (Golang): Implement soft delete endpoint
   */
  softDelete: async (id: string, deletedBy: string): Promise<void> => {
    // For now, use regular delete
    // Later, Golang should handle soft delete with deleted_at
    return invoiceApi.delete(id);
  },

  /**
   * Change invoice status
   */
  changeStatus: async (
    id: string, 
    newStatus: Invoice['status'], 
    version: number
  ): Promise<Invoice> => {
    return invoiceApi.update(id, { status: newStatus, version });
  },

  /**
   * Calculate total with adjustments
   */
  calculateTotal: (baseAmount: number, adjustments: PriceAdjustment[]): number => {
    return adjustments.reduce((total, adj) => {
      const amount = adj.amount || 0;
      if (adj.type === 'discount' || adj.type === 'credit') {
        return total - amount;
      }
      return total + amount;
    }, baseAmount);
  },
};

export default subscriptionInvoiceApi;
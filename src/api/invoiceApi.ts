/**
 * Invoice API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ UPDATED 2026-01-15: Schema migration (line_items→items_snapshot, customer_snapshot→billing_info)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Price adjustment for invoice
 */
export interface PriceAdjustment {
  description?: string;
  amount?: number;
  type?: 'discount' | 'tax' | 'fee' | 'credit';
  reason?: string;
  [key: string]: any;
}

/**
 * Billing info - immutable customer data at time of invoice creation
 * ✅ RENAMED: customer_snapshot → billing_info (2026-01-15)
 */
export interface BillingInfo {
  name?: string;
  customer_name?: string;
  tax_id?: string;
  address?: string;
  email?: string;
  customer_email?: string;
  phone?: string;
  customer_phone?: string;
  company_name?: string;
  [key: string]: any;
}

/**
 * Backward compatibility alias
 * @deprecated Use BillingInfo instead
 */
export type CustomerSnapshot = BillingInfo;

/**
 * Item snapshot - product/service detail in invoice
 * ✅ RENAMED: LineItem → ItemSnapshot (2026-01-15)
 */
export interface ItemSnapshot {
  name: string;
  qty: number;
  price: number;
  total: number;
  description?: string;
  product_id?: string;
  [key: string]: any;
}

/**
 * Backward compatibility alias
 * @deprecated Use ItemSnapshot instead
 */
export type LineItem = ItemSnapshot;

/**
 * Tax breakdown detail
 */
export interface TaxBreakdown {
  name: string;
  rate: number;
  amount: number;
  tax_type?: string;
  [key: string]: any;
}

/**
 * Invoice - 100% matches subscription_invoices table
 * ✅ Updated: 2026-01-15 - Schema migration completed
 */
export interface Invoice {
  // I. ĐỊNH DANH
  _id: string;
  tenant_id: string;
  subscription_id?: string;
  order_id?: string;
  
  // II. THÔNG TIN NGHIỆP VỤ
  invoice_number: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  currency_code: string;
  
  // III. CHI TIẾT TÀI CHÍNH (FINANCIAL BREAKDOWN)
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number; // Generated column
  
  // Deprecated (for backward compatibility)
  amount?: number; // Use total_amount instead
  
  // IV. SNAPSHOT DỮ LIỆU (IMMUTABLE DATA)
  // ✅ UPDATED FIELD NAMES (2026-01-15):
  billing_info: BillingInfo;        // Was: customer_snapshot
  items_snapshot: ItemSnapshot[];   // Was: line_items
  tax_breakdown: TaxBreakdown[];
  
  // Deprecated (for backward compatibility)
  customer_snapshot?: BillingInfo;  // Use billing_info instead
  line_items?: ItemSnapshot[];      // Use items_snapshot instead
  
  // V. THỜI GIAN & CHU KỲ
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at?: string;
  
  // VI. HỆ THỐNG & AUDIT
  metadata: Record<string, any>;
  price_adjustments: PriceAdjustment[];
  pdf_url?: string;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateInvoiceRequest {
  // I. ĐỊNH DANH
  tenant_id: string;
  subscription_id?: string;
  order_id?: string;
  
  // II. THÔNG TIN NGHIỆP VỤ
  invoice_number: string;
  status?: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  currency_code?: string;
  
  // III. CHI TIẾT TÀI CHÍNH
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  amount_paid?: number;
  
  // IV. SNAPSHOT DỮ LIỆU
  // ✅ UPDATED FIELD NAMES (2026-01-15):
  billing_info: BillingInfo;        // Was: customer_snapshot
  items_snapshot: ItemSnapshot[];   // Was: line_items
  tax_breakdown?: TaxBreakdown[];
  
  // V. THỜI GIAN & CHU KỲ
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  
  // VI. HỆ THỐNG & AUDIT
  price_adjustments?: PriceAdjustment[];
  metadata?: Record<string, any>;
  pdf_url?: string;
}

export interface UpdateInvoiceRequest {
  // II. THÔNG TIN NGHIỆP VỤ
  status?: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  currency_code?: string;
  
  // III. CHI TIẾT TÀI CHÍNH
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  amount_paid?: number;
  
  // IV. SNAPSHOT DỮ LIỆU
  // ✅ UPDATED FIELD NAMES (2026-01-15):
  billing_info?: BillingInfo;        // Was: customer_snapshot
  items_snapshot?: ItemSnapshot[];   // Was: line_items
  tax_breakdown?: TaxBreakdown[];
  
  // V. THỜI GIAN & CHU KỲ
  billing_period_start?: string;
  billing_period_end?: string;
  due_date?: string;
  paid_at?: string;
  
  // VI. HỆ THỐNG & AUDIT
  price_adjustments?: PriceAdjustment[];
  metadata?: Record<string, any>;
  pdf_url?: string;
  version: number;
}

export interface InvoiceFilters extends BaseFilters {
  tenant_id?: string;
  subscription_id?: string;
  status?: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  currency_code?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Invoice, CreateInvoiceRequest, UpdateInvoiceRequest>(
  'subscription_invoices',
  '/invoices'
);

// ==================== API CLIENT ====================

export const invoiceApi = {
  /**
   * GET /invoices
   */
  getAll: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /invoices/:id
   */
  getById: async (id: string): Promise<Invoice> => {
    return adapter.getById(id);
  },

  /**
   * POST /invoices
   */
  create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    return adapter.create(data);
  },

  /**
   * PATCH /invoices/:id
   */
  update: async (id: string, data: UpdateInvoiceRequest): Promise<Invoice> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /invoices/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Mark invoice as paid
   */
  markAsPaid: async (id: string, version: number): Promise<Invoice> => {
    return adapter.update(id, { 
      status: 'PAID',
      paid_at: new Date().toISOString(),
      version 
    });
  },

  /**
   * Void invoice
   */
  voidInvoice: async (id: string, version: number): Promise<Invoice> => {
    return adapter.update(id, { 
      status: 'VOID',
      version 
    });
  },
};

export default invoiceApi;
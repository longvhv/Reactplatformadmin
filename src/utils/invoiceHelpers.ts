/**
 * Invoice Helper Utilities
 * Provides derived values and calculations for invoices
 * 
 * ✅ Created: 2026-01-15
 * Purpose: Handle payment status as computed field (not stored in DB)
 */

import { Invoice } from '../api/invoiceApi';

/**
 * Payment status types (derived, not stored in DB)
 * This is computed client-side from invoice data
 */
export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'overdue';

/**
 * Derive payment status from invoice data
 * This is NOT a database field - it's computed client-side
 * 
 * Logic:
 * - status === 'PAID' → 'paid'
 * - status === 'VOID' or 'UNCOLLECTIBLE' → 'unpaid'
 * - amount_paid >= total_amount → 'paid'
 * - amount_paid > 0 and < total_amount → 'partially_paid'
 * - status === 'OPEN' and past due_date → 'overdue'
 * - default → 'unpaid'
 */
export function getPaymentStatus(invoice: Invoice): PaymentStatus {
  // If invoice is marked as PAID in status
  if (invoice.status === 'PAID') {
    return 'paid';
  }
  
  // If invoice is VOID or UNCOLLECTIBLE, treat as unpaid
  if (invoice.status === 'VOID' || invoice.status === 'UNCOLLECTIBLE') {
    return 'unpaid';
  }
  
  // Check actual payment amounts
  const isPaid = invoice.amount_paid >= invoice.total_amount;
  const isPartiallyPaid = invoice.amount_paid > 0 && invoice.amount_paid < invoice.total_amount;
  
  // Check if overdue (only for OPEN invoices)
  const isOverdue = invoice.status === 'OPEN' && 
                    invoice.due_date && 
                    new Date(invoice.due_date) < new Date();
  
  if (isPaid) return 'paid';
  if (isPartiallyPaid) return 'partially_paid';
  if (isOverdue) return 'overdue';
  
  return 'unpaid';
}

/**
 * Get payment status badge configuration for UI display
 * Returns color classes and label for consistent styling
 */
export function getPaymentStatusBadge(invoice: Invoice) {
  const status = getPaymentStatus(invoice);
  
  const configs = {
    unpaid: { 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', 
      label: 'Unpaid',
      labelVi: 'Chưa thanh toán'
    },
    paid: { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
      label: 'Paid',
      labelVi: 'Đã thanh toán'
    },
    partially_paid: { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
      label: 'Partially Paid',
      labelVi: 'Thanh toán một phần'
    },
    overdue: { 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
      label: 'Overdue',
      labelVi: 'Quá hạn'
    },
  };
  
  return configs[status];
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (!invoice.due_date) return false;
  return invoice.status === 'OPEN' && new Date(invoice.due_date) < new Date();
}

/**
 * Get days until due (negative if overdue)
 */
export function getDaysUntilDue(invoice: Invoice): number {
  if (!invoice.due_date) return 0;
  
  const now = new Date();
  const dueDate = new Date(invoice.due_date);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Format currency with proper locale and currency code
 */
export function formatCurrency(amount: number, currencyCode: string = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currencyCode || 'VND',
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN');
}

/**
 * Calculate amount due (total - paid)
 */
export function calculateAmountDue(invoice: Invoice): number {
  return invoice.total_amount - invoice.amount_paid;
}

/**
 * Calculate payment percentage
 */
export function calculatePaymentPercentage(invoice: Invoice): number {
  if (invoice.total_amount === 0) return 0;
  return Math.round((invoice.amount_paid / invoice.total_amount) * 100);
}

/**
 * Get status badge configuration
 */
export function getStatusBadge(status: Invoice['status']) {
  const statusConfig = {
    DRAFT: { 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', 
      label: 'Draft',
      labelVi: 'Bản nháp'
    },
    OPEN: { 
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
      label: 'Open',
      labelVi: 'Đang mở'
    },
    PAID: { 
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
      label: 'Paid',
      labelVi: 'Đã thanh toán'
    },
    VOID: { 
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', 
      label: 'Void',
      labelVi: 'Đã hủy'
    },
    UNCOLLECTIBLE: { 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', 
      label: 'Uncollectible',
      labelVi: 'Không thu được'
    },
  };
  
  return statusConfig[status] || statusConfig.DRAFT;
}

/**
 * Get customer name from billing_info
 * Handles both customer_name and name fields for backward compatibility
 */
export function getCustomerName(invoice: Invoice): string {
  return invoice.billing_info?.customer_name || 
         invoice.billing_info?.name || 
         'N/A';
}

/**
 * Get customer email from billing_info
 * Handles both customer_email and email fields for backward compatibility
 */
export function getCustomerEmail(invoice: Invoice): string {
  return invoice.billing_info?.customer_email || 
         invoice.billing_info?.email || 
         '-';
}

/**
 * Get customer phone from billing_info
 */
export function getCustomerPhone(invoice: Invoice): string {
  return invoice.billing_info?.customer_phone || 
         invoice.billing_info?.phone || 
         '-';
}

/**
 * Validate billing_info required fields
 */
export function validateBillingInfo(billingInfo: any): string[] {
  const errors: string[] = [];
  
  if (!billingInfo) {
    errors.push('Billing info is required');
    return errors;
  }
  
  // At least customer_name or email must be provided
  if (!billingInfo.customer_name && !billingInfo.name && 
      !billingInfo.customer_email && !billingInfo.email) {
    errors.push('At least customer name or email is required');
  }
  
  // Validate email format if provided
  const email = billingInfo.customer_email || billingInfo.email;
  if (email && !/\S+@\S+\.\S+/.test(email)) {
    errors.push('Invalid email format');
  }
  
  return errors;
}

/**
 * Validate items_snapshot required fields
 */
export function validateItemsSnapshot(items: any[]): string[] {
  const errors: string[] = [];
  
  if (!items || items.length === 0) {
    errors.push('At least one line item is required');
    return errors;
  }
  
  items.forEach((item, index) => {
    if (!item.name || !item.name.trim()) {
      errors.push(`Line item ${index + 1}: Name is required`);
    }
    if (!item.qty || item.qty <= 0) {
      errors.push(`Line item ${index + 1}: Quantity must be greater than 0`);
    }
    if (item.price === undefined || item.price < 0) {
      errors.push(`Line item ${index + 1}: Price cannot be negative`);
    }
  });
  
  return errors;
}

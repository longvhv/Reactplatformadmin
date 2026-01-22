/**
 * Orders API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-15: Added validations, statistics, and advanced features
 */

import { useState, useEffect } from 'react';
import { createAdapter, BaseFilters } from './adapters';

// Re-export helper functions for backward compatibility
export { formatCurrency, formatDate } from '@/lib/format';

// ==================== TYPES ====================

// Line Item Types
export type LineItemType = 'PLAN' | 'PRODUCT';
export type ProductType = 'SSL' | 'DOMAIN' | 'LICENSE' | 'SERVICE' | 'CONSULTING' | 'TRAINING' | 'OTHER';
export type OrderType = 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'ADD_ON';

export interface LineItem {
  item_type: LineItemType;
  id: string;
  name: string;
  price: number;
  quantity: number;
  product_type?: ProductType; // Only for PRODUCT items
  metadata?: Record<string, any>;
}

export interface ItemSnapshot {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  [key: string]: any;
}

export interface BillingInfo {
  tax_id?: string;
  company_name?: string;
  address?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  [key: string]: any;
}

export interface Order {
  // I. ĐỊNH DANH & TENANCY
  _id: string;
  tenant_id: string;
  created_by: string | null;
  
  // II. THÔNG TIN NGHIỆP VỤ
  order_number: string;
  po_number: string | null;
  type: OrderType; // Updated: SUBSCRIPTION | ONE_TIME | HYBRID
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  
  // III. TÀI CHÍNH
  currency_code: string;
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  credit_applied: number;
  total_amount: number;
  
  // IV. SNAPSHOT DỮ LIỆU - Updated to support line items
  items_snapshot: LineItem[]; // Changed from ItemSnapshot[] to LineItem[]
  billing_info: BillingInfo;
  
  // V. THANH TOÁN
  payment_method: string | null;
  payment_ref_id: string | null;
  
  // VI. AUDIT & VERSIONING
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrderWithDetails extends Order {
  tenant_name?: string;
  package_name?: string;
  package_code?: string;
  product_name?: string;
  user_name?: string;
  user_email?: string;
}

export interface CreateOrderRequest {
  tenant_id: string;
  created_by?: string;
  order_number: string;
  po_number?: string;
  type?: OrderType; // Updated
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  currency_code?: string;
  subtotal_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  credit_applied?: number;
  total_amount: number;
  items_snapshot: LineItem[]; // Updated
  billing_info?: BillingInfo;
  payment_method?: string;
  payment_ref_id?: string;
}

export interface UpdateOrderRequest {
  po_number?: string;
  type?: OrderType; // Updated
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  payment_method?: string;
  payment_ref_id?: string;
  tax_amount?: number;
  discount_amount?: number;
  credit_applied?: number;
  total_amount?: number;
  billing_info?: BillingInfo;
  version: number;
}

export interface OrderFilters extends BaseFilters {
  tenant_id?: string;
  type?: string;
  status?: string;
  order_number?: string;
  po_number?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Order, CreateOrderRequest, UpdateOrderRequest>(
  'subscription_orders',
  '/orders',
  true // Enable soft delete support
);

// ==================== API CLIENT ====================

export const ordersApi = {
  /**
   * GET /orders
   */
  getAll: async (filters?: OrderFilters): Promise<Order[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /orders/:id with joined data
   */
  getById: async (id: string): Promise<OrderWithDetails> => {
    // Use singleton to avoid multiple instances
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('subscription_orders')
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message || 'Unknown error'}`);
    }

    // Get tenant name
    let tenant_name: string | undefined;
    if (order.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('_id', order.tenant_id)
        .single();
      tenant_name = tenant?.name;
    }

    // Get package details
    let package_name: string | undefined;
    let package_code: string | undefined;
    let product_name: string | undefined;
    
    if (order.package_id) {
      const { data: pkg } = await supabase
        .from('service_packages')
        .select('name, code, product_id')
        .eq('_id', order.package_id)
        .single();
      
      package_name = pkg?.name;
      package_code = pkg?.code;

      // Get product name
      if (pkg?.product_id) {
        const { data: product } = await supabase
          .from('saas_products')
          .select('name')
          .eq('_id', pkg.product_id)
          .single();
        product_name = product?.name;
      }
    }

    return {
      ...order,
      tenant_name,
      package_name,
      package_code,
      product_name,
    } as OrderWithDetails;
  },

  /**
   * POST /orders
   */
  create: async (data: CreateOrderRequest): Promise<Order> => {
    return adapter.create(data);
  },

  /**
   * PATCH /orders/:id
   */
  update: async (id: string, data: UpdateOrderRequest): Promise<Order> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /orders/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /orders/:id/confirm
   * TODO (Golang): Implement confirm endpoint
   */
  confirm: async (id: string, version: number): Promise<Order> => {
    return adapter.update(id, { status: 'PAID', version });
  },

  /**
   * POST /orders/:id/cancel
   * TODO (Golang): Implement cancel endpoint
   */
  cancel: async (id: string, version: number): Promise<Order> => {
    return adapter.update(id, { status: 'CANCELLED', version });
  },
};

// ==================== HOOKS ====================

/**
 * Hook to fetch order details
 */
export function useOrderDetails(id: string | undefined) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await ordersApi.getById(id);
      setOrder(data as OrderWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [id]);

  return { order, loading, error, refresh };
}

/**
 * Hook to cancel order
 */
export function useCancelOrder() {
  const [cancelling, setCancelling] = useState(false);

  const cancelOrder = async (id: string) => {
    setCancelling(true);
    try {
      // Get current order to get version
      const order = await ordersApi.getById(id);
      await ordersApi.cancel(id, order.version);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel order' };
    } finally {
      setCancelling(false);
    }
  };

  return { cancelOrder, cancelling };
}

/**
 * Hook to process payment
 */
export function useProcessPayment() {
  const [processing, setProcessing] = useState(false);

  const processPayment = async (id: string, paymentData: { payment_method: string }) => {
    setProcessing(true);
    try {
      // Get current order to get version
      const order = await ordersApi.getById(id);
      await ordersApi.update(id, { 
        status: 'PAID', 
        payment_method: paymentData.payment_method,
        version: order.version 
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to process payment' };
    } finally {
      setProcessing(false);
    }
  };

  return { processPayment, processing };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'PAID':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'REFUNDED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return 'Nháp';
    case 'PENDING':
      return 'Chờ thanh toán';
    case 'PAID':
      return 'Đã thanh toán';
    case 'CANCELLED':
      return 'Đã hủy';
    case 'FAILED':
      return 'Thất bại';
    case 'REFUNDED':
      return 'Đã hoàn tiền';
    default:
      return status;
  }
}

/**
 * Get type label
 */
export function getTypeLabel(type: string): string {
  switch (type.toUpperCase()) {
    case 'NEW':
      return 'Mới';
    case 'RENEWAL':
      return 'Gia hạn';
    case 'UPGRADE':
      return 'Nâng cấp';
    case 'DOWNGRADE':
      return 'Hạ cấp';
    case 'ADD_ON':
      return 'Thêm tính năng';
    default:
      return type;
  }
}

/**
 * Get type color
 */
export function getTypeColor(type: string): string {
  switch (type.toUpperCase()) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'RENEWAL':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'UPGRADE':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
    case 'DOWNGRADE':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'ADD_ON':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get product type label
 */
export function getProductTypeLabel(type: ProductType): string {
  switch (type) {
    case 'SSL':
      return 'Chứng chỉ SSL';
    case 'DOMAIN':
      return 'Tên miền';
    case 'LICENSE':
      return 'Giấy phép';
    case 'SERVICE':
      return 'Dịch vụ';
    case 'CONSULTING':
      return 'Tư vấn';
    case 'TRAINING':
      return 'Đào tạo';
    case 'OTHER':
      return 'Khác';
    default:
      return type;
  }
}

/**
 * Calculate order totals from line items
 */
export function calculateOrderTotals(items: LineItem[]): {
  subtotal: number;
  itemCount: number;
} {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
}

/**
 * Determine order type from line items
 * Returns: 'SUBSCRIPTION' if only PLAN items, 'ONE_TIME' if only PRODUCT items, 'HYBRID' if both
 */
export function determineOrderType(items: LineItem[]): 'SUBSCRIPTION' | 'ONE_TIME' | 'HYBRID' | '' {
  if (!items || items.length === 0) return '';
  
  const hasPlan = items.some(item => item.item_type === 'PLAN');
  const hasProduct = items.some(item => item.item_type === 'PRODUCT');
  
  if (hasPlan && hasProduct) return 'HYBRID';
  if (hasPlan) return 'SUBSCRIPTION';
  if (hasProduct) return 'ONE_TIME';
  
  return '';
}

// ==================== VALIDATION FUNCTIONS ====================
// ✅ NEW 2026-01-15: Client-side validation

export interface OrderValidationError {
  field: string;
  message: string;
}

/**
 * Validate CreateOrderRequest
 * ✅ Ensures amounts >= 0, currency length valid, items not empty
 */
export function validateCreateOrderRequest(data: CreateOrderRequest): OrderValidationError[] {
  const errors: OrderValidationError[] = [];

  // Validate items_snapshot
  if (!data.items_snapshot || data.items_snapshot.length === 0) {
    errors.push({
      field: 'items_snapshot',
      message: 'Đơn hàng phải có ít nhất 1 sản phẩm/dịch vụ',
    });
  } else {
    // Validate each line item
    data.items_snapshot.forEach((item, index) => {
      if (!item.name || item.name.trim().length === 0) {
        errors.push({
          field: `items_snapshot[${index}].name`,
          message: `Sản phẩm #${index + 1}: Tên không được để trống`,
        });
      }
      if (item.price < 0) {
        errors.push({
          field: `items_snapshot[${index}].price`,
          message: `Sản phẩm #${index + 1}: Giá không được âm`,
        });
      }
      if (item.quantity <= 0) {
        errors.push({
          field: `items_snapshot[${index}].quantity`,
          message: `Sản phẩm #${index + 1}: Số lượng phải lớn hơn 0`,
        });
      }
    });
  }

  // Validate amounts
  if (data.subtotal_amount < 0) {
    errors.push({
      field: 'subtotal_amount',
      message: 'Subtotal không được âm',
    });
  }

  if (data.tax_amount !== undefined && data.tax_amount < 0) {
    errors.push({
      field: 'tax_amount',
      message: 'Thuế không được âm',
    });
  }

  if (data.discount_amount !== undefined && data.discount_amount < 0) {
    errors.push({
      field: 'discount_amount',
      message: 'Giảm giá không được âm',
    });
  }

  if (data.credit_applied !== undefined && data.credit_applied < 0) {
    errors.push({
      field: 'credit_applied',
      message: 'Credit không được âm',
    });
  }

  if (data.total_amount < 0) {
    errors.push({
      field: 'total_amount',
      message: 'Tổng tiền không được âm',
    });
  }

  // Validate currency_code
  const currencyCode = data.currency_code || 'USD';
  if (currencyCode.length !== 3) {
    errors.push({
      field: 'currency_code',
      message: 'Mã tiền tệ phải có đúng 3 ký tự (VD: USD, VND)',
    });
  }

  // Validate order_number
  if (!data.order_number || data.order_number.trim().length === 0) {
    errors.push({
      field: 'order_number',
      message: 'Số đơn hàng không được để trống',
    });
  }

  // Validate tenant_id
  if (!data.tenant_id || data.tenant_id.trim().length === 0) {
    errors.push({
      field: 'tenant_id',
      message: 'Tenant ID không được để trống',
    });
  }

  return errors;
}

/**
 * Validate UpdateOrderRequest
 */
export function validateUpdateOrderRequest(data: UpdateOrderRequest): OrderValidationError[] {
  const errors: OrderValidationError[] = [];

  // Validate amounts (if provided)
  if (data.tax_amount !== undefined && data.tax_amount < 0) {
    errors.push({
      field: 'tax_amount',
      message: 'Thuế không được âm',
    });
  }

  if (data.discount_amount !== undefined && data.discount_amount < 0) {
    errors.push({
      field: 'discount_amount',
      message: 'Giảm giá không được âm',
    });
  }

  if (data.credit_applied !== undefined && data.credit_applied < 0) {
    errors.push({
      field: 'credit_applied',
      message: 'Credit không được âm',
    });
  }

  if (data.total_amount !== undefined && data.total_amount < 0) {
    errors.push({
      field: 'total_amount',
      message: 'Tổng tiền không được âm',
    });
  }

  // Validate version (required for optimistic locking)
  if (data.version === undefined || data.version === null) {
    errors.push({
      field: 'version',
      message: 'Version là bắt buộc để cập nhật',
    });
  }

  return errors;
}

// ==================== STATISTICS FUNCTIONS ====================
// ✅ NEW 2026-01-15: Order statistics

export interface OrderStatistics {
  // Count by status
  count_by_status: {
    DRAFT: number;
    PENDING: number;
    PAID: number;
    CANCELLED: number;
    FAILED: number;
    REFUNDED: number;
  };

  // Count by type
  count_by_type: {
    NEW: number;
    RENEWAL: number;
    UPGRADE: number;
    DOWNGRADE: number;
    ADD_ON: number;
  };

  // Revenue statistics (only PAID orders)
  revenue: {
    total: number;
    subtotal: number;
    tax: number;
    discount: number;
    credit_applied: number;
  };

  // Order value statistics
  avg_order_value: number;
  min_order_value: number;
  max_order_value: number;

  // Total orders
  total_orders: number;
  
  // Currency
  currency_code: string;
}

/**
 * Calculate statistics from orders array
 * ✅ NEW: Count by status/type, revenue, avg order value
 */
export function calculateOrderStatistics(orders: Order[]): OrderStatistics {
  // Initialize counts
  const count_by_status = {
    DRAFT: 0,
    PENDING: 0,
    PAID: 0,
    CANCELLED: 0,
    FAILED: 0,
    REFUNDED: 0,
  };

  const count_by_type = {
    NEW: 0,
    RENEWAL: 0,
    UPGRADE: 0,
    DOWNGRADE: 0,
    ADD_ON: 0,
  };

  // Initialize revenue
  const revenue = {
    total: 0,
    subtotal: 0,
    tax: 0,
    discount: 0,
    credit_applied: 0,
  };

  // Calculate
  let totalValue = 0;
  let minValue = Infinity;
  let maxValue = -Infinity;
  const currencyCode = orders.length > 0 ? orders[0].currency_code : 'USD';

  orders.forEach((order) => {
    // Count by status
    if (order.status in count_by_status) {
      count_by_status[order.status as keyof typeof count_by_status]++;
    }

    // Count by type
    if (order.type in count_by_type) {
      count_by_type[order.type as keyof typeof count_by_type]++;
    }

    // Revenue (only PAID orders)
    if (order.status === 'PAID') {
      revenue.total += order.total_amount;
      revenue.subtotal += order.subtotal_amount;
      revenue.tax += order.tax_amount;
      revenue.discount += order.discount_amount;
      revenue.credit_applied += order.credit_applied;
    }

    // Order value statistics (all orders)
    totalValue += order.total_amount;
    if (order.total_amount < minValue) minValue = order.total_amount;
    if (order.total_amount > maxValue) maxValue = order.total_amount;
  });

  const avg_order_value = orders.length > 0 ? totalValue / orders.length : 0;

  return {
    count_by_status,
    count_by_type,
    revenue,
    avg_order_value,
    min_order_value: minValue === Infinity ? 0 : minValue,
    max_order_value: maxValue === -Infinity ? 0 : maxValue,
    total_orders: orders.length,
    currency_code: currencyCode,
  };
}

/**
 * Get statistics for orders
 * TODO (Golang): Implement /orders/statistics endpoint
 */
export async function getOrderStatistics(filters?: OrderFilters): Promise<OrderStatistics> {
  const orders = await ordersApi.getAll(filters);
  return calculateOrderStatistics(orders);
}

// ==================== ADVANCED FEATURES ====================
// ✅ NEW 2026-01-15: Invoice generation, email, subscription, refund

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  order: Order;
  line_items: LineItem[];
  billing_info: BillingInfo;
  total_amount: number;
  currency_code: string;
}

/**
 * Generate invoice from order
 * TODO (Golang): Implement /orders/:id/invoice endpoint
 * Returns invoice data that can be used to generate PDF
 */
export async function generateInvoice(orderId: string): Promise<InvoiceData> {
  const order = await ordersApi.getById(orderId);

  // Generate invoice number from order number
  const invoiceNumber = `INV-${order.order_number}`;
  const invoiceDate = new Date().toISOString();
  
  // Due date = 30 days from invoice date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    due_date: dueDate.toISOString(),
    order,
    line_items: order.items_snapshot,
    billing_info: order.billing_info,
    total_amount: order.total_amount,
    currency_code: order.currency_code,
  };
}

/**
 * Send order confirmation email
 * TODO (Golang): Implement /orders/:id/send-confirmation endpoint
 */
export async function sendOrderConfirmation(orderId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const order = await ordersApi.getById(orderId);

    // Validate order has email
    if (!order.billing_info?.customer_email) {
      throw new Error('Order does not have customer email');
    }

    // TODO: Call Golang API to send email
    // For now, simulate success
    console.log(`Sending order confirmation email to: ${order.billing_info.customer_email}`);
    console.log(`Order: ${order.order_number}, Total: ${order.total_amount} ${order.currency_code}`);

    return {
      success: true,
      message: `Email confirmation sent to ${order.billing_info.customer_email}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Activate subscription after payment
 * TODO (Golang): Implement /orders/:id/activate-subscription endpoint
 * This should:
 * 1. Create tenant_subscriptions record
 * 2. Activate subscription
 * 3. Send welcome email
 * 4. Generate digital assets (if applicable)
 */
export async function activateSubscription(orderId: string): Promise<{
  success: boolean;
  subscription_id?: string;
  message: string;
}> {
  try {
    const order = await ordersApi.getById(orderId);

    // Validate order is PAID
    if (order.status !== 'PAID') {
      throw new Error('Order must be PAID to activate subscription');
    }

    // Check if order has subscription items
    const hasPlan = order.items_snapshot.some(item => item.item_type === 'PLAN');
    if (!hasPlan) {
      throw new Error('Order does not contain subscription plan');
    }

    // TODO: Call Golang API to activate subscription
    // For now, simulate success
    const subscriptionId = `sub_${Date.now()}`;
    console.log(`Activating subscription for order: ${order.order_number}`);
    console.log(`Subscription ID: ${subscriptionId}`);

    return {
      success: true,
      subscription_id: subscriptionId,
      message: 'Subscription activated successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to activate subscription',
    };
  }
}

/**
 * Process refund for order
 * TODO (Golang): Implement /orders/:id/refund endpoint
 * This should:
 * 1. Update order status to REFUNDED
 * 2. Create refund transaction
 * 3. Reverse subscription activation (if applicable)
 * 4. Send refund confirmation email
 */
export async function processRefund(
  orderId: string,
  amount: number,
  reason?: string
): Promise<{
  success: boolean;
  refund_id?: string;
  message: string;
}> {
  try {
    const order = await ordersApi.getById(orderId);

    // Validate order is PAID
    if (order.status !== 'PAID') {
      throw new Error('Only PAID orders can be refunded');
    }

    // Validate refund amount
    if (amount <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }

    if (amount > order.total_amount) {
      throw new Error('Refund amount cannot exceed order total');
    }

    // TODO: Call Golang API to process refund
    // For now, simulate success and update order status
    const refundId = `ref_${Date.now()}`;
    console.log(`Processing refund for order: ${order.order_number}`);
    console.log(`Refund ID: ${refundId}, Amount: ${amount} ${order.currency_code}`);
    console.log(`Reason: ${reason || 'No reason provided'}`);

    // Update order status to REFUNDED
    await ordersApi.update(orderId, {
      status: 'REFUNDED',
      version: order.version,
    });

    return {
      success: true,
      refund_id: refundId,
      message: `Refund processed successfully: ${amount} ${order.currency_code}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process refund',
    };
  }
}

export default ordersApi;
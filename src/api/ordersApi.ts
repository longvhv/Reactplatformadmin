/**
 * Orders API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { useState, useEffect } from 'react';
import { createAdapter, BaseFilters } from './adapters';

// Re-export helper functions for backward compatibility
export { formatCurrency, formatDate } from '@/lib/format';

// ==================== TYPES ====================

// Line Item Types
export type LineItemType = 'PLAN' | 'PRODUCT';
export type ProductType = 'SSL' | 'DOMAIN' | 'LICENSE' | 'SERVICE' | 'CONSULTING' | 'TRAINING' | 'OTHER';
export type OrderType = 'SUBSCRIPTION' | 'ONE_TIME' | 'HYBRID';

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
  '/orders'
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
    case 'SUBSCRIPTION':
      return 'Gói cước';
    case 'ONE_TIME':
      return 'Mua lẻ';
    case 'HYBRID':
      return 'Kết hợp';
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
    case 'SUBSCRIPTION':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'ONE_TIME':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'HYBRID':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
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
 * Determine order type based on line items
 */
export function determineOrderType(items: LineItem[]): OrderType {
  const hasPlans = items.some(item => item.item_type === 'PLAN');
  const hasProducts = items.some(item => item.item_type === 'PRODUCT');
  
  if (hasPlans && hasProducts) return 'HYBRID';
  if (hasPlans) return 'SUBSCRIPTION';
  return 'ONE_TIME';
}

export default ordersApi;
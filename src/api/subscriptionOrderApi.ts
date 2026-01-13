/**
 * Subscription Order API - Simplified REST API client
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;
const STORAGE_KEY = 'subscription_orders_cache';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'active' | 'cancelled' | 'expired' | 'suspended' | 'pending';
export type BillingCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'LIFETIME';

export interface SubscriptionOrder {
  _id?: string;
  tenant_id: string;
  product_id: string;
  customer_id?: string;
  order_code: string;
  order_date: string;
  start_date: string;
  end_date?: string | null;
  billing_cycle: BillingCycle;
  base_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_date?: string;
  payment_reference?: string;
  status: OrderStatus;
  auto_renewal: boolean;
  renewal_count: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: Record<string, any>;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

export interface OrderFilters {
  tenant_id?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  billing_cycle?: BillingCycle;
  customer_email?: string;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
}

export interface OrderStatistics {
  total: number;
  active: number;
  pending: number;
  cancelled: number;
  expired: number;
  suspended: number;
  total_revenue: number;
  pending_revenue?: number;
  paid_count: number;
  pending_payment_count: number;
}

const getFromLocalStorage = (): SubscriptionOrder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

const saveToLocalStorage = (orders: SubscriptionOrder[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const subscriptionOrderApi = {
  getAll: async (filters?: OrderFilters): Promise<SubscriptionOrder[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.payment_status) params.append('payment_status', filters.payment_status);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_BASE}/subscription-orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      const data = result.data || [];
      saveToLocalStorage(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return getFromLocalStorage();
    }
  },

  getById: async (id: string): Promise<SubscriptionOrder | null> => {
    try {
      const response = await fetch(`${API_BASE}/subscription-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      const orders = getFromLocalStorage();
      return orders.find(o => o._id === id) || null;
    }
  },

  create: async (order: Omit<SubscriptionOrder, '_id'>): Promise<SubscriptionOrder> => {
    const response = await fetch(`${API_BASE}/subscription-orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create order: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  update: async (id: string, updates: Partial<SubscriptionOrder>): Promise<SubscriptionOrder> => {
    const response = await fetch(`${API_BASE}/subscription-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update order: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  softDelete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/subscription-orders/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete order: ${await response.text()}`);
    }
  },

  getStatistics: async (tenant_id?: string): Promise<OrderStatistics> => {
    try {
      const params = new URLSearchParams();
      if (tenant_id) params.append('tenant_id', tenant_id);
      
      const response = await fetch(`${API_BASE}/subscription-orders/stats/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching order statistics:', error);
      return {
        total: 0,
        active: 0,
        pending: 0,
        cancelled: 0,
        expired: 0,
        suspended: 0,
        total_revenue: 0,
        paid_count: 0,
        pending_payment_count: 0,
      };
    }
  },

  getActive: async (tenant_id?: string): Promise<SubscriptionOrder[]> => {
    return subscriptionOrderApi.getAll({ status: 'active', tenant_id });
  },

  getPendingPayment: async (tenant_id?: string): Promise<SubscriptionOrder[]> => {
    return subscriptionOrderApi.getAll({ payment_status: 'pending', tenant_id });
  },

  search: async (searchTerm: string, tenant_id?: string): Promise<SubscriptionOrder[]> => {
    return subscriptionOrderApi.getAll({ search: searchTerm, tenant_id });
  },
};

export default subscriptionOrderApi;

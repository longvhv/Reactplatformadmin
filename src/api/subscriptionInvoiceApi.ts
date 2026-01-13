/**
 * Subscription Invoice API - Simplified REST API client
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;
const STORAGE_KEY = 'subscription_invoices_cache';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_paid';

export interface SubscriptionInvoice {
  _id?: string;
  tenant_id: string;
  order_id: string;
  subscription_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  payment_date?: string;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: Record<string, any>;
  line_items?: any[];
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  terms?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

export interface InvoiceFilters {
  tenant_id?: string;
  status?: InvoiceStatus;
  payment_status?: PaymentStatus;
  search?: string;
  invoice_date_from?: string;
  invoice_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
}

export interface InvoiceStatistics {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

const getFromLocalStorage = (): SubscriptionInvoice[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

const saveToLocalStorage = (invoices: SubscriptionInvoice[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const subscriptionInvoiceApi = {
  getAll: async (filters?: InvoiceFilters): Promise<SubscriptionInvoice[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.tenant_id) params.append('tenant_id', filters.tenant_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.payment_status) params.append('payment_status', filters.payment_status);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_BASE}/subscription-invoices?${params}`, {
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
      console.error('Error fetching invoices:', error);
      return getFromLocalStorage();
    }
  },

  getById: async (id: string): Promise<SubscriptionInvoice | null> => {
    try {
      const response = await fetch(`${API_BASE}/subscription-invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      const invoices = getFromLocalStorage();
      return invoices.find(i => i._id === id) || null;
    }
  },

  create: async (invoice: Omit<SubscriptionInvoice, '_id'>): Promise<SubscriptionInvoice> => {
    const response = await fetch(`${API_BASE}/subscription-invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create invoice: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  update: async (id: string, updates: Partial<SubscriptionInvoice>): Promise<SubscriptionInvoice> => {
    const response = await fetch(`${API_BASE}/subscription-invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update invoice: ${await response.text()}`);
    }
    
    const result = await response.json();
    return result.data;
  },

  softDelete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/subscription-invoices/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete invoice: ${await response.text()}`);
    }
  },

  getStatistics: async (tenant_id?: string): Promise<InvoiceStatistics> => {
    try {
      const params = new URLSearchParams();
      if (tenant_id) params.append('tenant_id', tenant_id);
      
      const response = await fetch(`${API_BASE}/subscription-invoices/stats/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching invoice statistics:', error);
      return {
        total: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
      };
    }
  },

  getPaid: async (tenant_id?: string): Promise<SubscriptionInvoice[]> => {
    return subscriptionInvoiceApi.getAll({ status: 'paid', tenant_id });
  },

  getOverdue: async (tenant_id?: string): Promise<SubscriptionInvoice[]> => {
    return subscriptionInvoiceApi.getAll({ status: 'overdue', tenant_id });
  },

  search: async (searchTerm: string, tenant_id?: string): Promise<SubscriptionInvoice[]> => {
    return subscriptionInvoiceApi.getAll({ search: searchTerm, tenant_id });
  },
};

export default subscriptionInvoiceApi;

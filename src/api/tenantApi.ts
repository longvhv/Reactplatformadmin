/**
 * Tenant API Layer
 * 
 * LocalStorage-based API for tenant management
 * Production: Replace with real backend API calls
 */

import { Tenant, UsageMetric, Invoice, TenantStatus, SubscriptionTier } from '../data/tenants';
import { mockTenants } from '../data/tenants';

const STORAGE_KEY = 'saas_tenants';
const USAGE_STORAGE_KEY = 'saas_usage_metrics';
const INVOICE_STORAGE_KEY = 'saas_invoices';

// Initialize localStorage with mock data
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTenants));
  }
}

// === TENANT CRUD ===

export async function getAllTenants(): Promise<Tenant[]> {
  initStorage();
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const tenants = await getAllTenants();
  return tenants.find(t => t.id === id) || null;
}

export async function createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
  const tenants = await getAllTenants();
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name: tenant.name || '',
    slug: tenant.slug || '',
    domain: tenant.domain || '',
    subscriptionTier: tenant.subscriptionTier || 'starter',
    subscriptionEndDate: tenant.subscriptionEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: tenant.status || 'trial',
    maxUsers: tenant.maxUsers || 10,
    currentUsers: tenant.currentUsers || 0,
    maxStorage: tenant.maxStorage || 10,
    currentStorage: tenant.currentStorage || 0,
    billingEmail: tenant.billingEmail || '',
    phone: tenant.phone || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tenants.push(newTenant);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  return newTenant;
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const tenants = await getAllTenants();
  const index = tenants.findIndex(t => t.id === id);
  if (index === -1) return null;

  tenants[index] = {
    ...tenants[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  return tenants[index];
}

export async function deleteTenant(id: string): Promise<boolean> {
  const tenants = await getAllTenants();
  const filtered = tenants.filter(t => t.id !== id);
  if (filtered.length === tenants.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export async function updateTenantStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
  return updateTenant(id, { status });
}

export async function upgradeTenantSubscription(
  id: string,
  tier: SubscriptionTier,
  endDate: string
): Promise<Tenant | null> {
  return updateTenant(id, {
    subscriptionTier: tier,
    subscriptionEndDate: endDate,
  });
}

// === USAGE METRICS ===

export async function getUsageMetrics(tenantId: string, days: number = 30): Promise<UsageMetric[]> {
  const data = localStorage.getItem(USAGE_STORAGE_KEY);
  const allMetrics: UsageMetric[] = data ? JSON.parse(data) : [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return allMetrics.filter(
    m => m.tenantId === tenantId && new Date(m.date) >= cutoffDate
  );
}

export async function recordUsageMetric(metric: UsageMetric): Promise<void> {
  const data = localStorage.getItem(USAGE_STORAGE_KEY);
  const metrics: UsageMetric[] = data ? JSON.parse(data) : [];
  metrics.push(metric);
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(metrics));
}

// === INVOICES ===

export async function getInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
  const data = localStorage.getItem(INVOICE_STORAGE_KEY);
  const allInvoices: Invoice[] = data ? JSON.parse(data) : [];
  return allInvoices.filter(inv => inv.tenantId === tenantId);
}

export async function createInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
  const data = localStorage.getItem(INVOICE_STORAGE_KEY);
  const invoices: Invoice[] = data ? JSON.parse(data) : [];
  
  const newInvoice: Invoice = {
    ...invoice,
    id: `inv-${Date.now()}`,
  };
  
  invoices.push(newInvoice);
  localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
  return newInvoice;
}

export async function updateInvoiceStatus(
  id: string,
  status: Invoice['status'],
  paidDate?: string
): Promise<Invoice | null> {
  const data = localStorage.getItem(INVOICE_STORAGE_KEY);
  const invoices: Invoice[] = data ? JSON.parse(data) : [];
  
  const index = invoices.findIndex(inv => inv.id === id);
  if (index === -1) return null;

  invoices[index] = {
    ...invoices[index],
    status,
    ...(paidDate && { paidDate }),
  };
  
  localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
  return invoices[index];
}

// === ANALYTICS ===

export interface TenantAnalytics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalRevenue: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  averageUsersPerTenant: number;
  totalStorageUsed: number;
  subscriptionBreakdown: Record<SubscriptionTier, number>;
}

export async function getTenantAnalytics(): Promise<TenantAnalytics> {
  const tenants = await getAllTenants();
  const invoiceData = localStorage.getItem(INVOICE_STORAGE_KEY);
  const invoices: Invoice[] = invoiceData ? JSON.parse(invoiceData) : [];
  
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  return {
    totalTenants: tenants.length,
    activeTenants: tenants.filter(t => t.status === 'active').length,
    trialTenants: tenants.filter(t => t.status === 'trial').length,
    suspendedTenants: tenants.filter(t => t.status === 'suspended').length,
    totalRevenue,
    mrr: totalRevenue / 12, // Simplified calculation
    arr: totalRevenue,
    averageUsersPerTenant: tenants.reduce((sum, t) => sum + t.currentUsers, 0) / tenants.length || 0,
    totalStorageUsed: tenants.reduce((sum, t) => sum + t.currentStorage, 0),
    subscriptionBreakdown: {
      free: tenants.filter(t => t.subscriptionTier === 'free').length,
      starter: tenants.filter(t => t.subscriptionTier === 'starter').length,
      professional: tenants.filter(t => t.subscriptionTier === 'professional').length,
      enterprise: tenants.filter(t => t.subscriptionTier === 'enterprise').length,
    },
  };
}
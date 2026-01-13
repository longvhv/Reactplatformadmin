/**
 * Tenant API Layer
 * 
 * LocalStorage-based API for tenant management
 * Updated to use new Tenant schema
 * Production: Use /services/tenants-service.ts instead
 */

import type { Tenant, TenantStatus, TenantTier } from '../data/tenants';
import { mockTenants } from '../data/tenants';

const STORAGE_KEY = 'saas_tenants';

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
  return tenants.find(t => t._id === id) || null;
}

export async function createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
  const tenants = await getAllTenants();
  const newTenant: Tenant = {
    _id: `tenant-${Date.now()}`,
    code: tenant.code || '',
    name: tenant.name || '',
    tier: tenant.tier || 'FREE',
    status: tenant.status || 'TRIAL',
    data_region: tenant.data_region || 'ap-southeast-1',
    compliance_level: tenant.compliance_level || 'STANDARD',
    parent_tenant_id: tenant.parent_tenant_id || null,
    path: tenant.path || `/${Date.now()}/`,
    billing_type: tenant.billing_type || 'POSTPAID',
    timezone: tenant.timezone || 'UTC',
    profile: tenant.profile || {},
    settings: tenant.settings || {
      max_users: 10,
      max_storage: 10,
      current_users: 0,
      current_storage: 0,
      mfa_enforced: false,
      sso_enabled: false,
      custom_branding: false,
      api_access: false,
      features: [],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  };
  tenants.push(newTenant);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  return newTenant;
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const tenants = await getAllTenants();
  const index = tenants.findIndex(t => t._id === id);
  if (index === -1) return null;

  tenants[index] = {
    ...tenants[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  return tenants[index];
}

export async function deleteTenant(id: string): Promise<boolean> {
  const tenants = await getAllTenants();
  const filtered = tenants.filter(t => t._id !== id);
  if (filtered.length === tenants.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export async function updateTenantStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
  return updateTenant(id, { status });
}

export async function upgradeTenantSubscription(
  id: string,
  tier: TenantTier,
  endDate: string
): Promise<Tenant | null> {
  return updateTenant(id, {
    tier,
    subscription_end_date: endDate,
  });
}

// === USAGE METRICS ===

// Legacy type for backward compatibility
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';
export interface UsageMetric {
  tenantId: string;
  date: string;
  activeUsers: number;
  storageUsed: number;
  apiCalls: number;
  bandwidth: number;
}
export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  billingPeriod: { start: string; end: string };
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

const USAGE_STORAGE_KEY = 'saas_usage_metrics';
const INVOICE_STORAGE_KEY = 'saas_invoices';

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
  mrr: number;
  arr: number;
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
    activeTenants: tenants.filter(t => t.status === 'ACTIVE').length,
    trialTenants: tenants.filter(t => t.status === 'TRIAL').length,
    suspendedTenants: tenants.filter(t => t.status === 'SUSPENDED').length,
    totalRevenue,
    mrr: totalRevenue / 12,
    arr: totalRevenue,
    averageUsersPerTenant: tenants.reduce((sum, t) => sum + (t.settings?.current_users || 0), 0) / tenants.length || 0,
    totalStorageUsed: tenants.reduce((sum, t) => sum + (t.settings?.current_storage || 0), 0),
    subscriptionBreakdown: {
      free: tenants.filter(t => t.tier === 'FREE').length,
      starter: tenants.filter(t => t.tier === 'PRO').length,
      professional: tenants.filter(t => t.tier === 'ENTERPRISE').length,
      enterprise: tenants.filter(t => t.tier.startsWith('PARTNER_')).length,
    },
  };
}
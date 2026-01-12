/**
 * Tenants Data Layer
 * 
 * Multi-tenancy data structures for SaaS platform
 */

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  subscriptionTier: SubscriptionTier;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  maxUsers: number;
  currentUsers: number;
  maxStorage: number; // in GB
  currentStorage: number; // in GB
  features: string[];
  billingEmail: string;
  contactPerson: string;
  phone: string;
  address?: string;
  logo?: string;
  metadata: {
    industry?: string;
    companySize?: string;
    country?: string;
    timezone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UsageMetric {
  tenantId: string;
  date: string;
  activeUsers: number;
  storageUsed: number; // in GB
  apiCalls: number;
  bandwidth: number; // in GB
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  billingPeriod: {
    start: string;
    end: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

// Mock data
export const mockTenants: Tenant[] = [
  {
    id: 'tenant-001',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    domain: 'acme.example.com',
    status: 'active',
    subscriptionTier: 'enterprise',
    subscriptionStartDate: '2024-01-01',
    subscriptionEndDate: '2024-12-31',
    maxUsers: 100,
    currentUsers: 78,
    maxStorage: 500,
    currentStorage: 342,
    features: ['sso', 'api_access', 'custom_domain', 'priority_support', 'advanced_analytics'],
    billingEmail: 'billing@acme.com',
    contactPerson: 'John Doe',
    phone: '+1-555-0100',
    address: '123 Tech Street, San Francisco, CA 94105',
    metadata: {
      industry: 'Technology',
      companySize: '100-500',
      country: 'USA',
      timezone: 'America/Los_Angeles',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-08T10:30:00Z',
  },
  {
    id: 'tenant-002',
    name: 'TechStart Inc',
    slug: 'techstart',
    domain: 'techstart.example.com',
    status: 'active',
    subscriptionTier: 'professional',
    subscriptionStartDate: '2024-02-15',
    subscriptionEndDate: '2025-02-14',
    maxUsers: 50,
    currentUsers: 32,
    maxStorage: 200,
    currentStorage: 145,
    features: ['api_access', 'custom_branding', 'analytics'],
    billingEmail: 'finance@techstart.io',
    contactPerson: 'Jane Smith',
    phone: '+1-555-0200',
    metadata: {
      industry: 'Software',
      companySize: '50-100',
      country: 'USA',
      timezone: 'America/New_York',
    },
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-01-08T09:15:00Z',
  },
  {
    id: 'tenant-003',
    name: 'Digital Solutions',
    slug: 'digital-solutions',
    status: 'trial',
    subscriptionTier: 'starter',
    subscriptionStartDate: '2024-12-01',
    subscriptionEndDate: '2024-12-31',
    maxUsers: 10,
    currentUsers: 5,
    maxStorage: 50,
    currentStorage: 12,
    features: ['basic_support'],
    billingEmail: 'admin@digitalsol.com',
    contactPerson: 'Mike Johnson',
    phone: '+44-20-1234-5678',
    metadata: {
      industry: 'Consulting',
      companySize: '10-50',
      country: 'UK',
      timezone: 'Europe/London',
    },
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'tenant-004',
    name: 'Global Retail Co',
    slug: 'global-retail',
    domain: 'retail.example.com',
    status: 'active',
    subscriptionTier: 'enterprise',
    subscriptionStartDate: '2023-06-01',
    subscriptionEndDate: '2025-05-31',
    maxUsers: 200,
    currentUsers: 156,
    maxStorage: 1000,
    currentStorage: 687,
    features: ['sso', 'api_access', 'custom_domain', 'priority_support', 'advanced_analytics', 'white_label'],
    billingEmail: 'billing@globalretail.com',
    contactPerson: 'Sarah Williams',
    phone: '+1-555-0300',
    metadata: {
      industry: 'Retail',
      companySize: '500+',
      country: 'USA',
      timezone: 'America/Chicago',
    },
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-07T14:20:00Z',
  },
  {
    id: 'tenant-005',
    name: 'StartupHub',
    slug: 'startuphub',
    status: 'suspended',
    subscriptionTier: 'starter',
    subscriptionStartDate: '2024-09-01',
    subscriptionEndDate: '2024-12-01',
    maxUsers: 10,
    currentUsers: 8,
    maxStorage: 50,
    currentStorage: 38,
    features: ['basic_support'],
    billingEmail: 'info@startuphub.io',
    contactPerson: 'Tom Brown',
    phone: '+1-555-0400',
    metadata: {
      industry: 'Startup',
      companySize: '1-10',
      country: 'Canada',
      timezone: 'America/Toronto',
    },
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-12-05T16:00:00Z',
  },
];

export const tenantStatusColors: Record<TenantStatus, string> = {
  active: 'bg-emerald-500',
  trial: 'bg-blue-500',
  suspended: 'bg-orange-500',
  cancelled: 'bg-red-500',
};

export const subscriptionTierColors: Record<SubscriptionTier, string> = {
  free: 'bg-gray-500',
  starter: 'bg-blue-500',
  professional: 'bg-indigo-600',
  enterprise: 'bg-purple-600',
};

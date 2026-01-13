/**
 * Service Packages API Module
 * 
 * Full CRUD operations and filtering for service package management
 * Supports features & limits configuration stored in localStorage
 * 
 * @module api/servicePackages
 */

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'vhv_service_packages';
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME' | 'CUSTOM';

export interface FeatureConfig {
  code: string;
  name: string;
  enabled: boolean;
}

export interface LimitsConfig {
  [key: string]: number | boolean | string;
}

export interface ServicePackage {
  _id: string;
  package_code: string;
  package_name: string;
  product_id: string;
  description?: string;
  billing_cycle: BillingCycle;
  price: number;
  currency: string;
  features_config: FeatureConfig[];
  limits_config: LimitsConfig;
  display_order: number;
  is_public: boolean;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version: number;
}

export interface ServicePackageFilters {
  search?: string;
  product_id?: string;
  billing_cycle?: BillingCycle;
  is_public?: boolean;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
}

export interface ServicePackageStats {
  total: number;
  active: number;
  inactive: number;
  public: number;
  private: number;
  by_billing_cycle: Record<BillingCycle, number>;
  by_product: Record<string, number>;
  avg_price: number;
  total_revenue_potential: number;
}

// =====================================================
// STORAGE HELPERS
// =====================================================

function getPackages(): ServicePackage[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function savePackages(packages: ServicePackage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all service packages with optional filtering
 */
export async function getAllServicePackages(
  filters?: ServicePackageFilters
): Promise<ServicePackage[]> {
  let packages = getPackages().filter(pkg => !pkg.deleted_at);

  if (filters) {
    // Search filter (name, code, description)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      packages = packages.filter(pkg =>
        pkg.package_name.toLowerCase().includes(search) ||
        pkg.package_code.toLowerCase().includes(search) ||
        (pkg.description?.toLowerCase().includes(search) ?? false)
      );
    }

    // Product filter
    if (filters.product_id) {
      packages = packages.filter(pkg => pkg.product_id === filters.product_id);
    }

    // Billing cycle filter
    if (filters.billing_cycle) {
      packages = packages.filter(pkg => pkg.billing_cycle === filters.billing_cycle);
    }

    // Public/Private filter
    if (filters.is_public !== undefined) {
      packages = packages.filter(pkg => pkg.is_public === filters.is_public);
    }

    // Active/Inactive filter
    if (filters.is_active !== undefined) {
      packages = packages.filter(pkg => pkg.is_active === filters.is_active);
    }

    // Price range filter
    if (filters.min_price !== undefined) {
      packages = packages.filter(pkg => pkg.price >= filters.min_price!);
    }
    if (filters.max_price !== undefined) {
      packages = packages.filter(pkg => pkg.price <= filters.max_price!);
    }
  }

  return packages.sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.package_name.localeCompare(b.package_name);
  });
}

/**
 * Get a single service package by ID
 */
export async function getServicePackageById(id: string): Promise<ServicePackage | null> {
  const packages = getPackages();
  return packages.find(pkg => pkg._id === id && !pkg.deleted_at) || null;
}

/**
 * Get service packages by product ID
 */
export async function getServicePackagesByProduct(
  productId: string
): Promise<ServicePackage[]> {
  return getAllServicePackages({ product_id: productId });
}

/**
 * Get public service packages (for customer-facing views)
 */
export async function getPublicServicePackages(
  productId?: string
): Promise<ServicePackage[]> {
  const filters: ServicePackageFilters = { is_public: true, is_active: true };
  if (productId) {
    filters.product_id = productId;
  }
  return getAllServicePackages(filters);
}

/**
 * Create a new service package
 */
export async function createServicePackage(
  data: Omit<ServicePackage, '_id' | 'created_at' | 'updated_at' | 'version' | 'tenant_id'>
): Promise<ServicePackage> {
  const packages = getPackages();

  // Check for duplicate package code
  const existingCode = packages.find(
    pkg => pkg.package_code === data.package_code && 
           pkg.tenant_id === DEFAULT_TENANT_ID && 
           !pkg.deleted_at
  );
  if (existingCode) {
    throw new Error('Package code already exists');
  }

  const now = new Date().toISOString();
  const newPackage: ServicePackage = {
    ...data,
    _id: uuidv4(),
    tenant_id: DEFAULT_TENANT_ID,
    created_at: now,
    updated_at: now,
    version: 1,
  };

  packages.push(newPackage);
  savePackages(packages);

  return newPackage;
}

/**
 * Update an existing service package
 */
export async function updateServicePackage(
  id: string,
  data: Partial<Omit<ServicePackage, '_id' | 'created_at' | 'tenant_id' | 'version'>>
): Promise<ServicePackage> {
  const packages = getPackages();
  const index = packages.findIndex(pkg => pkg._id === id && !pkg.deleted_at);

  if (index === -1) {
    throw new Error('Service package not found');
  }

  // Check for duplicate package code if code is being changed
  if (data.package_code && data.package_code !== packages[index].package_code) {
    const existingCode = packages.find(
      pkg => pkg.package_code === data.package_code && 
             pkg.tenant_id === DEFAULT_TENANT_ID && 
             pkg._id !== id &&
             !pkg.deleted_at
    );
    if (existingCode) {
      throw new Error('Package code already exists');
    }
  }

  const updatedPackage: ServicePackage = {
    ...packages[index],
    ...data,
    updated_at: new Date().toISOString(),
    version: packages[index].version + 1,
  };

  packages[index] = updatedPackage;
  savePackages(packages);

  return updatedPackage;
}

/**
 * Delete a service package (soft delete)
 */
export async function deleteServicePackage(id: string, userId?: string): Promise<void> {
  const packages = getPackages();
  const index = packages.findIndex(pkg => pkg._id === id && !pkg.deleted_at);

  if (index === -1) {
    throw new Error('Service package not found');
  }

  packages[index] = {
    ...packages[index],
    deleted_at: new Date().toISOString(),
    deleted_by: userId,
    version: packages[index].version + 1,
  };

  savePackages(packages);
}

/**
 * Permanently delete a service package
 */
export async function permanentlyDeleteServicePackage(id: string): Promise<void> {
  const packages = getPackages();
  const filtered = packages.filter(pkg => pkg._id !== id);
  savePackages(filtered);
}

/**
 * Restore a soft-deleted service package
 */
export async function restoreServicePackage(id: string): Promise<ServicePackage> {
  const packages = getPackages();
  const index = packages.findIndex(pkg => pkg._id === id && pkg.deleted_at);

  if (index === -1) {
    throw new Error('Deleted service package not found');
  }

  const restoredPackage: ServicePackage = {
    ...packages[index],
    deleted_at: undefined,
    deleted_by: undefined,
    updated_at: new Date().toISOString(),
    version: packages[index].version + 1,
  };

  packages[index] = restoredPackage;
  savePackages(packages);

  return restoredPackage;
}

// =====================================================
// STATISTICS & ANALYTICS
// =====================================================

/**
 * Get service package statistics
 */
export async function getServicePackageStats(): Promise<ServicePackageStats> {
  const packages = getPackages().filter(pkg => !pkg.deleted_at);

  const stats: ServicePackageStats = {
    total: packages.length,
    active: packages.filter(pkg => pkg.is_active).length,
    inactive: packages.filter(pkg => !pkg.is_active).length,
    public: packages.filter(pkg => pkg.is_public).length,
    private: packages.filter(pkg => !pkg.is_public).length,
    by_billing_cycle: {
      MONTHLY: 0,
      QUARTERLY: 0,
      YEARLY: 0,
      ONE_TIME: 0,
      CUSTOM: 0,
    },
    by_product: {},
    avg_price: 0,
    total_revenue_potential: 0,
  };

  let totalPrice = 0;

  packages.forEach(pkg => {
    // Billing cycle distribution
    stats.by_billing_cycle[pkg.billing_cycle]++;

    // Product distribution
    stats.by_product[pkg.product_id] = (stats.by_product[pkg.product_id] || 0) + 1;

    // Price calculations
    totalPrice += pkg.price;
  });

  stats.avg_price = packages.length > 0 ? totalPrice / packages.length : 0;
  stats.total_revenue_potential = totalPrice;

  return stats;
}

/**
 * Get statistics by product
 */
export async function getServicePackageStatsByProduct(
  productId: string
): Promise<Partial<ServicePackageStats>> {
  const packages = await getServicePackagesByProduct(productId);

  const stats = {
    total: packages.length,
    active: packages.filter(pkg => pkg.is_active).length,
    inactive: packages.filter(pkg => !pkg.is_active).length,
    avg_price: 0,
  };

  if (packages.length > 0) {
    const totalPrice = packages.reduce((sum, pkg) => sum + pkg.price, 0);
    stats.avg_price = totalPrice / packages.length;
  }

  return stats;
}

// =====================================================
// BULK OPERATIONS
// =====================================================

/**
 * Bulk update service packages
 */
export async function bulkUpdateServicePackages(
  ids: string[],
  data: Partial<Omit<ServicePackage, '_id' | 'created_at' | 'tenant_id' | 'version'>>
): Promise<ServicePackage[]> {
  const updated: ServicePackage[] = [];

  for (const id of ids) {
    try {
      const pkg = await updateServicePackage(id, data);
      updated.push(pkg);
    } catch (error) {
      console.error(`Failed to update package ${id}:`, error);
    }
  }

  return updated;
}

/**
 * Bulk delete service packages
 */
export async function bulkDeleteServicePackages(
  ids: string[],
  userId?: string
): Promise<void> {
  for (const id of ids) {
    try {
      await deleteServicePackage(id, userId);
    } catch (error) {
      console.error(`Failed to delete package ${id}:`, error);
    }
  }
}

// =====================================================
// VALIDATION & UTILITIES
// =====================================================

/**
 * Validate package code uniqueness
 */
export async function isPackageCodeUnique(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const packages = getPackages();
  return !packages.some(
    pkg => pkg.package_code === code && 
           pkg.tenant_id === DEFAULT_TENANT_ID && 
           pkg._id !== excludeId &&
           !pkg.deleted_at
  );
}

/**
 * Get next available display order
 */
export async function getNextDisplayOrder(productId?: string): Promise<number> {
  const packages = getPackages().filter(pkg => !pkg.deleted_at);
  
  let relevantPackages = packages;
  if (productId) {
    relevantPackages = packages.filter(pkg => pkg.product_id === productId);
  }

  if (relevantPackages.length === 0) {
    return 1;
  }

  const maxOrder = Math.max(...relevantPackages.map(pkg => pkg.display_order));
  return maxOrder + 1;
}

/**
 * Reorder packages by display_order
 */
export async function reorderServicePackages(
  orderMap: Record<string, number>
): Promise<void> {
  const packages = getPackages();
  
  Object.entries(orderMap).forEach(([id, order]) => {
    const index = packages.findIndex(pkg => pkg._id === id);
    if (index !== -1 && !packages[index].deleted_at) {
      packages[index].display_order = order;
      packages[index].updated_at = new Date().toISOString();
      packages[index].version++;
    }
  });

  savePackages(packages);
}

/**
 * Clone a service package with new code
 */
export async function cloneServicePackage(
  id: string,
  newCode: string,
  newName?: string
): Promise<ServicePackage> {
  const original = await getServicePackageById(id);
  if (!original) {
    throw new Error('Service package not found');
  }

  const cloned = await createServicePackage({
    ...original,
    package_code: newCode,
    package_name: newName || `${original.package_name} (Copy)`,
    display_order: await getNextDisplayOrder(original.product_id),
  });

  return cloned;
}

// =====================================================
// EXPORT SUMMARY
// =====================================================

export const servicePackagesAPI = {
  // CRUD
  getAll: getAllServicePackages,
  getById: getServicePackageById,
  getByProduct: getServicePackagesByProduct,
  getPublic: getPublicServicePackages,
  create: createServicePackage,
  update: updateServicePackage,
  delete: deleteServicePackage,
  permanentlyDelete: permanentlyDeleteServicePackage,
  restore: restoreServicePackage,

  // Statistics
  getStats: getServicePackageStats,
  getStatsByProduct: getServicePackageStatsByProduct,

  // Bulk Operations
  bulkUpdate: bulkUpdateServicePackages,
  bulkDelete: bulkDeleteServicePackages,

  // Utilities
  isCodeUnique: isPackageCodeUnique,
  getNextDisplayOrder,
  reorder: reorderServicePackages,
  clone: cloneServicePackage,
};

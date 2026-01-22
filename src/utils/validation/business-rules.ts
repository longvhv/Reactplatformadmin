/**
 * Business Rules Validators
 * High-level business logic validation
 */

import type { Tenant, TenantTier } from '@/data/tenants';
import type { FieldValidationResult } from './field-validators';

/**
 * Check if tenant can be deleted
 */
export const canDeleteTenant = (
  tenant: Tenant, 
  hasChildren: boolean
): FieldValidationResult => {
  if (hasChildren) {
    return { 
      valid: false, 
      error: 'Cannot delete tenant with child tenants. Delete children first.' 
    };
  }

  if (tenant.status === 'ACTIVE') {
    return { 
      valid: false, 
      error: 'Cannot delete active tenant. Suspend or cancel first.' 
    };
  }

  return { valid: true };
};

/**
 * Check if tier can be downgraded
 */
export const canDowngradeTier = (
  currentTier: TenantTier,
  newTier: TenantTier,
  currentUsers: number,
  newMaxUsers: number
): FieldValidationResult => {
  const tierHierarchy: Record<TenantTier, number> = {
    FREE: 1,
    PRO: 2,
    ENTERPRISE: 3,
    PARTNER_BASIC: 2,
    PARTNER_PREMIUM: 3,
    PARTNER_ELITE: 4,
    PROVIDER: 5,
  };

  if (tierHierarchy[newTier] < tierHierarchy[currentTier]) {
    if (currentUsers > newMaxUsers) {
      return {
        valid: false,
        error: `Cannot downgrade: current users (${currentUsers}) exceeds new max users (${newMaxUsers})`,
      };
    }
  }

  return { valid: true };
};

/**
 * Check if parent tenant is valid
 */
export const validateParentTenant = (
  parentId: string | null,
  currentTenantId: string | undefined
): FieldValidationResult => {
  if (!parentId) {
    return { valid: true }; // Root tenant is valid
  }

  if (currentTenantId && parentId === currentTenantId) {
    return {
      valid: false,
      error: 'Tenant cannot be its own parent',
    };
  }

  return { valid: true };
};

/**
 * Validate circular hierarchy
 */
export const checkCircularHierarchy = (
  tenant: Tenant,
  allTenants: Tenant[],
  newParentId: string | null
): FieldValidationResult => {
  if (!newParentId) {
    return { valid: true }; // No parent means no circular reference
  }

  // Check if new parent is descendant of current tenant
  const isDescendant = (tenantId: string, possibleDescendantId: string): boolean => {
    const descendant = allTenants.find(t => t._id === possibleDescendantId);
    if (!descendant) return false;
    if (!descendant.parent_tenant_id) return false;
    if (descendant.parent_tenant_id === tenantId) return true;
    return isDescendant(tenantId, descendant.parent_tenant_id);
  };

  if (isDescendant(tenant._id, newParentId)) {
    return {
      valid: false,
      error: 'Cannot create circular hierarchy: new parent is a descendant of this tenant',
    };
  }

  return { valid: true };
};

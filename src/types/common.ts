/**
 * Common Shared Types
 * Reusable type definitions across the application
 */

// =====================================================
// BILLING & PAYMENT
// =====================================================

/**
 * Billing cycle types
 */
export type BillingCycle = 
  | 'DAILY' 
  | 'WEEKLY' 
  | 'MONTHLY' 
  | 'QUARTERLY' 
  | 'YEARLY' 
  | 'ONE_TIME' 
  | 'LIFETIME'
  | 'CUSTOM';

/**
 * Payment status types
 */
export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded'
  | 'partially_paid';

/**
 * Currency codes
 */
export type CurrencyCode = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'VND' 
  | 'JPY' 
  | 'CNY';

// =====================================================
// STATUS TYPES
// =====================================================

/**
 * Generic status
 */
export type Status = 'active' | 'inactive' | 'archived';

/**
 * Subscription status
 */
export type SubscriptionStatus = 
  | 'active' 
  | 'trial' 
  | 'suspended' 
  | 'expired' 
  | 'cancelled' 
  | 'pending';

/**
 * Order status
 */
export type OrderStatus = 
  | 'active' 
  | 'cancelled' 
  | 'expired' 
  | 'suspended' 
  | 'pending';

/**
 * Invoice status
 */
export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled' 
  | 'refunded';

// =====================================================
// COMMON INTERFACES
// =====================================================

/**
 * Standard audit fields
 */
export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

/**
 * Versioned entity
 */
export interface Versioned {
  version: number;
}

/**
 * Identifiable entity
 */
export interface Identifiable {
  _id: string;
}

/**
 * Standard entity with ID, audit fields and version
 */
export interface BaseEntity extends Identifiable, AuditFields, Versioned {}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Filter parameters
 */
export interface FilterParams {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Statistics response
 */
export interface Statistics {
  total: number;
  [key: string]: number | string;
}

// =====================================================
// METADATA TYPES
// =====================================================

/**
 * Generic metadata
 */
export type Metadata = Record<string, any>;

/**
 * Configuration object
 */
export type Config = Record<string, any>;

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make all properties required except specified keys
 */
export type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>;

/**
 * Omit multiple keys from type
 */
export type OmitMultiple<T, K extends keyof T> = Omit<T, K>;

/**
 * Pick multiple keys from type
 */
export type PickMultiple<T, K extends keyof T> = Pick<T, K>;

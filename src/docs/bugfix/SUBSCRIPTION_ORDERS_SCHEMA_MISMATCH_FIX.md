# 🔧 SUBSCRIPTION_ORDERS SCHEMA MISMATCH FIX

**Created:** 2026-01-15  
**Priority:** 🔴 HIGH  
**Status:** ⚠️ NEEDS FIX  
**Module:** Subscription Orders

---

## 📋 SUMMARY

Phát hiện **SCHEMA MISMATCH** giữa database schema mới (`subscription_orders`) và API TypeScript interface hiện tại. Database đã được điều chỉnh nhưng code frontend chưa được cập nhật.

---

## 🔍 PROBLEM ANALYSIS

### **Database Schema (NEW - 2026-01-15)**
```sql
CREATE TABLE subscription_orders (
    -- I. ĐỊNH DANH & TENANCY
    _id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_by UUID,
    
    -- II. THÔNG TIN NGHIỆP VỤ
    order_number VARCHAR(50) NOT NULL,      -- ✅ Unique
    po_number VARCHAR(50),                  -- ❌ MISSING in API
    type VARCHAR(20) NOT NULL DEFAULT 'NEW', -- ❌ MISSING in API
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- ⚠️ Values mismatch
    
    -- III. TÀI CHÍNH
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND', -- ⚠️ API uses 'currency'
    subtotal_amount NUMERIC(19,4) NOT NULL DEFAULT 0, -- ⚠️ API uses 'base_price'
    tax_amount NUMERIC(19,4) NOT NULL DEFAULT 0,      -- ✅ Match
    discount_amount NUMERIC(19,4) NOT NULL DEFAULT 0, -- ✅ Match
    credit_applied NUMERIC(19,4) NOT NULL DEFAULT 0,  -- ❌ MISSING in API
    total_amount NUMERIC(19,4) NOT NULL DEFAULT 0,    -- ✅ Match
    
    -- IV. SNAPSHOT DỮ LIỆU (JSONB)
    items_snapshot JSONB NOT NULL DEFAULT '[]',  -- ⚠️ API uses 'package_snapshot'
    billing_info JSONB NOT NULL DEFAULT '{}',    -- ⚠️ API uses 'billing_address'
    
    -- V. THANH TOÁN
    payment_method VARCHAR(30),             -- ✅ Match
    payment_ref_id VARCHAR(100),            -- ⚠️ API uses 'payment_reference'
    
    -- VI. AUDIT & VERSIONING
    version BIGINT NOT NULL DEFAULT 1,      -- ✅ Match
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- ✅ Match
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- ✅ Match
    deleted_at TIMESTAMPTZ,                 -- ✅ Match
);

-- Constraints:
-- status: 'DRAFT', 'PENDING', 'PAID', 'CANCELLED', 'FAILED', 'REFUNDED'
-- type: 'NEW', 'RENEWAL', 'UPGRADE', 'DOWNGRADE', 'ADD_ON'
```

### **Current API Interface (OUTDATED)**
```typescript
export interface Order {
  _id: string;
  tenant_id: string;
  product_id: string;           // ❌ NOT in DB
  customer_id?: string;         // ❌ NOT in DB
  order_code: string;           // ⚠️ Should be 'order_number'
  order_date: string;           // ❌ NOT in DB
  start_date: string;           // ❌ NOT in DB
  end_date?: string;            // ❌ NOT in DB
  billing_cycle: string;        // ❌ NOT in DB
  base_price: number;           // ⚠️ Should be 'subtotal_amount'
  discount_amount: number;      // ✅ Match
  tax_amount: number;           // ✅ Match
  total_amount: number;         // ✅ Match
  currency: string;             // ⚠️ Should be 'currency_code'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'; // ❌ NOT in DB
  payment_method?: string;      // ✅ Match
  payment_date?: string;        // ❌ NOT in DB
  payment_reference?: string;   // ⚠️ Should be 'payment_ref_id'
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'suspended'; // ⚠️ Wrong values
  auto_renewal: boolean;        // ❌ NOT in DB
  renewal_count: number;        // ❌ NOT in DB
  customer_name?: string;       // ❌ NOT in DB (should be in billing_info)
  customer_email?: string;      // ❌ NOT in DB (should be in billing_info)
  customer_phone?: string;      // ❌ NOT in DB (should be in billing_info)
  billing_address?: Record<string, any>; // ⚠️ Should be 'billing_info'
  features?: Record<string, any>;        // ❌ NOT in DB
  limits?: Record<string, any>;          // ❌ NOT in DB
  notes?: string;                        // ❌ NOT in DB
  package_snapshot?: PackageSnapshot;    // ⚠️ Should be 'items_snapshot'
  subscription_id?: string;              // ❌ NOT in DB
  subscription_created?: boolean;        // ❌ NOT in DB
  metadata?: Record<string, any>;        // ❌ NOT in DB
  created_at: string;           // ✅ Match
  created_by?: string;          // ✅ Match
  updated_at: string;           // ✅ Match
  updated_by?: string;          // ❌ NOT in DB
  deleted_at?: string;          // ✅ Match
  deleted_by?: string;          // ❌ NOT in DB
  version: number;              // ✅ Match
}
```

---

## 🚨 CRITICAL ISSUES

### **1. Missing Fields in API** ❌
```typescript
po_number: string | null;           // Purchase Order number
type: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'ADD_ON';
credit_applied: number;             // Amount from tenant_wallets
```

### **2. Wrong Field Names** ⚠️
```typescript
// API → DB
order_code          → order_number
currency            → currency_code
base_price          → subtotal_amount
payment_reference   → payment_ref_id
package_snapshot    → items_snapshot
billing_address     → billing_info
```

### **3. Wrong Status Values** ⚠️
```typescript
// Current API (WRONG)
status: 'pending' | 'active' | 'cancelled' | 'expired' | 'suspended'

// Database Constraint (CORRECT)
status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED'
```

### **4. Extra Fields NOT in Database** ❌
```typescript
// These should be REMOVED or moved to metadata/billing_info
product_id, customer_id, order_date, start_date, end_date, 
billing_cycle, payment_status, payment_date, auto_renewal, 
renewal_count, customer_name, customer_email, customer_phone,
features, limits, notes, subscription_id, subscription_created,
metadata, updated_by, deleted_by
```

---

## ✅ REQUIRED FIXES

### **File 1: `/api/ordersApi.ts`**

#### **Fix 1: Update Order Interface**
```typescript
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
  order_number: string;                    // Changed from order_code
  po_number: string | null;                // NEW
  type: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'ADD_ON'; // NEW
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED'; // UPDATED
  
  // III. TÀI CHÍNH
  currency_code: string;                   // Changed from currency
  subtotal_amount: number;                 // Changed from base_price
  tax_amount: number;
  discount_amount: number;
  credit_applied: number;                  // NEW
  total_amount: number;
  
  // IV. SNAPSHOT DỮ LIỆU
  items_snapshot: ItemSnapshot[];          // Changed from package_snapshot
  billing_info: BillingInfo;               // Changed from billing_address
  
  // V. THANH TOÁN
  payment_method: string | null;
  payment_ref_id: string | null;           // Changed from payment_reference
  
  // VI. AUDIT & VERSIONING
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

#### **Fix 2: Update CreateOrderRequest**
```typescript
export interface CreateOrderRequest {
  tenant_id: string;
  created_by?: string;
  order_number: string;                    // Changed from order_code
  po_number?: string;                      // NEW
  type?: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'ADD_ON'; // NEW
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  currency_code?: string;                  // Changed from currency
  subtotal_amount: number;                 // Changed from base_price
  tax_amount?: number;
  discount_amount?: number;
  credit_applied?: number;                 // NEW
  total_amount: number;
  items_snapshot: ItemSnapshot[];          // Changed from package_snapshot
  billing_info?: BillingInfo;              // Changed from billing_address
  payment_method?: string;
  payment_ref_id?: string;                 // Changed from payment_reference
}
```

#### **Fix 3: Update UpdateOrderRequest**
```typescript
export interface UpdateOrderRequest {
  po_number?: string;                      // NEW
  type?: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'ADD_ON'; // NEW
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  payment_method?: string;
  payment_ref_id?: string;                 // Changed from payment_reference
  credit_applied?: number;                 // NEW
  billing_info?: BillingInfo;              // NEW
  version: number;
}
```

#### **Fix 4: Update OrderFilters**
```typescript
export interface OrderFilters extends BaseFilters {
  tenant_id?: string;
  type?: string;                           // NEW
  status?: string;
  order_number?: string;                   // NEW
  po_number?: string;                      // NEW
}
```

#### **Fix 5: Update Status Helper Functions**
```typescript
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
```

### **File 2: `/api/subscriptionOrderApi.ts`**

```typescript
/**
 * Subscription Order API Client (Alias)
 * @deprecated Use ordersApi instead
 */
import { ordersApi, Order, OrderWithDetails, CreateOrderRequest, UpdateOrderRequest, OrderFilters } from './ordersApi';

// Export Order as SubscriptionOrder for backward compatibility
export type SubscriptionOrder = Order;

// Export status and type enums
export type OrderStatus = Order['status'];
export type OrderType = Order['type'];

// Re-export other types
export type { Order, OrderWithDetails, CreateOrderRequest, UpdateOrderRequest, OrderFilters };

export const subscriptionOrderApi = ordersApi;
export default subscriptionOrderApi;
```

### **File 3: `/components/orders/SubscriptionOrderDetailModal.tsx`**

Update interface to match new schema:
```typescript
interface SubscriptionOrder {
  _id: string;
  tenant_id: string;
  created_by: string | null;
  order_number: string;
  po_number: string | null;
  type: 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE' | 'ADD_ON';
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
  currency_code: string;
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  credit_applied: number;
  total_amount: number;
  items_snapshot: any[];
  billing_info: Record<string, any>;
  payment_method: string | null;
  payment_ref_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Extended fields from JOINs
  tenant_name?: string;
}
```

### **File 4: Update All Components Using Order Data**

Files to update:
- `/components/orders/OrderTable.tsx`
- `/components/orders/OrderCard.tsx`
- `/components/orders/OrderForm.tsx`
- `/components/orders/OrderDetailModal.tsx`
- `/pages/SubscriptionOrderDetailPage.tsx`

Changes needed:
1. Replace `order.order_code` → `order.order_number`
2. Replace `order.currency` → `order.currency_code`
3. Replace `order.base_price` → `order.subtotal_amount`
4. Replace `order.payment_reference` → `order.payment_ref_id`
5. Replace `order.package_snapshot` → `order.items_snapshot`
6. Replace `order.billing_address` → `order.billing_info`
7. Add support for `order.po_number`, `order.type`, `order.credit_applied`
8. Update status values to uppercase: DRAFT, PENDING, PAID, CANCELLED, FAILED, REFUNDED
9. Remove references to: `payment_status`, `order_date`, `start_date`, `end_date`, etc.

---

## 🎯 TESTING CHECKLIST

After fixes, verify:

- [ ] Order list page displays correctly
- [ ] Order detail page shows all fields
- [ ] Create order form works with new schema
- [ ] Update order works with new schema
- [ ] Status badges show correct colors and labels
- [ ] Type field displays correctly (NEW, RENEWAL, etc.)
- [ ] PO Number field is editable
- [ ] Credit Applied amount shows correctly
- [ ] Items snapshot (JSONB array) displays properly
- [ ] Billing info (JSONB object) displays properly
- [ ] No console errors about missing fields
- [ ] Supabase queries work correctly

---

## 📊 IMPACT ASSESSMENT

### **High Priority** 🔴
- Order creation/update will FAIL due to field name mismatch
- Status values mismatch will cause constraint violations
- Missing fields (po_number, type, credit_applied) prevent full functionality

### **Medium Priority** 🟡
- Display issues in UI components
- Search/filter not working for new fields
- Status colors/labels incorrect

### **Low Priority** 🟢
- Backward compatibility concerns
- Documentation updates
- Test data migration

---

## 🔄 MIGRATION NOTES

### **For Existing Data**
If there's existing data in the database:
1. Ensure all existing records have valid `type` (default: 'NEW')
2. Ensure all existing records have valid `status` in uppercase
3. Convert `package_snapshot` → `items_snapshot` format if needed
4. Convert `billing_address` → `billing_info` structure
5. Set default `credit_applied = 0` for old records

### **For Backward Compatibility**
Consider keeping alias in `/api/subscriptionOrderApi.ts` to avoid breaking existing code:
```typescript
// Helper to convert old format to new format
export function migrateOrder(oldOrder: any): Order {
  return {
    ...oldOrder,
    order_number: oldOrder.order_code || oldOrder.order_number,
    currency_code: oldOrder.currency || oldOrder.currency_code,
    subtotal_amount: oldOrder.base_price || oldOrder.subtotal_amount,
    items_snapshot: oldOrder.package_snapshot || oldOrder.items_snapshot || [],
    billing_info: oldOrder.billing_address || oldOrder.billing_info || {},
    payment_ref_id: oldOrder.payment_reference || oldOrder.payment_ref_id,
    po_number: oldOrder.po_number || null,
    type: oldOrder.type || 'NEW',
    credit_applied: oldOrder.credit_applied || 0,
  };
}
```

---

## ✅ COMPLETION CRITERIA

Fix is complete when:
1. ✅ All TypeScript interfaces match database schema exactly
2. ✅ All UI components use correct field names
3. ✅ Create/Update operations work without errors
4. ✅ Status values match database constraints
5. ✅ All new fields (po_number, type, credit_applied) are functional
6. ✅ JSONB fields (items_snapshot, billing_info) work correctly
7. ✅ No TypeScript compilation errors
8. ✅ No runtime errors in console
9. ✅ All tests pass (if applicable)

---

## 📚 RELATED DOCUMENTATION

- Database Schema: `/docs/database/subscription_orders_schema.sql`
- API Documentation: `/docs/API_REFERENCE_COMPLETE.md`
- Orders Module: `/docs/ORDERS_MODULE_FINAL_DELIVERY.md`
- Golang Migration: `/docs/GOLANG_MIGRATION_READY.md`

---

**Priority:** 🔴 **CRITICAL - MUST FIX BEFORE PRODUCTION**

This schema mismatch will cause:
- ❌ Order creation failures
- ❌ Database constraint violations
- ❌ Incorrect data display
- ❌ Search/filter issues
- ❌ Breaking changes when migrating to Golang API

**Estimated Effort:** 2-3 hours  
**Files to Update:** ~10 files  
**Risk Level:** Medium (schema changes, but well-documented)

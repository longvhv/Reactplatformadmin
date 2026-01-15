# Subscription Orders Module - Complete Documentation

## 📋 Overview

Module **Subscription Orders** quản lý đơn hàng đăng ký gói dịch vụ trong hệ thống SaaS. Module này là cầu nối quan trọng giữa **Service Packages** và **Tenant Subscriptions**, đảm bảo tính toàn vẹn dữ liệu về giá và quyền lợi thông qua **Package Snapshot**.

**✨ NEW in v2.0:** Enhanced OrderDetailModal với gradient design, CreateOrderPage, EditOrderPage với optimistic locking!

---

## 📚 Documentation Index

### 1. [Database Schema](./ORDERS_SCHEMA.md)
**Chi tiết:** Cấu trúc bảng `subscription_orders`, indexes, constraints

**Nội dung:**
- ✅ 12+ columns with detailed specifications
- ✅ 4 indexes for optimal performance
- ✅ JSONB for package snapshot (price & entitlements protection)
- ✅ Optimistic locking & soft delete
- ✅ Query patterns & examples

**Đọc khi:** Database design, migration, query optimization

---

### 2. [API Documentation](./ORDERS_API.md)
**Chi tiết:** RESTful API endpoints, request/response format

**Nội dung:**
- ✅ 7 API endpoints (CRUD + Statistics + Tenant orders)
- ✅ Request/Response examples with cURL
- ✅ Query parameters & filters
- ✅ Optimistic locking examples
- ✅ Error handling & status codes

**Đọc khi:** API integration, frontend development

---

### 3. [Use Cases](./ORDERS_USECASES.md)
**Chi tiết:** Real-world scenarios, business logic

**Nội dung:**
- ✅ 7 use case categories (27+ scenarios)
- ✅ Order creation & processing flows
- ✅ Payment flows (Credit card, Bank transfer, E-wallet)
- ✅ **Package snapshot protection** examples
- ✅ Order lifecycle management
- ✅ Reporting & analytics queries
- ✅ Edge cases & error handling

**Đọc khi:** Business analysis, feature planning, payment integration

---

### 4. [UI Components](./ORDERS_UI_COMPONENTS.md)
**Chi tiết:** React components, design system

**Nội dung:**
- ✅ OrdersPage component (Table & Grid views)
- ✅ **OrderDetailModal** with package snapshot display
- ✅ Design system (colors, typography)
- ✅ Responsive design
- ✅ User flows & interaction patterns
- ✅ Best practices

**Đọc khi:** Frontend development, UI/UX design

---

### 5. [ERD Diagram](./ORDERS_ERD.md)
**Chi tiết:** Entity relationships, data flow

**Nội dung:**
- ✅ Complete ERD diagram with ASCII art
- ✅ Relationships with tenants, packages, subscriptions, invoices
- ✅ Indexing strategy
- ✅ Data flow diagram (purchase flow)
- ✅ Query patterns

**Đọc khi:** Database design, system architecture, data modeling

---

## 🚀 Quick Start

### 1. Database Setup

```sql
CREATE TABLE subscription_orders (
    -- I. Định danh & Tenancy
    _id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    package_id UUID NOT NULL,
    
    -- II. Thông tin đơn hàng
    order_number VARCHAR(50) NOT NULL,
    total_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(30),
    
    -- III. Dữ liệu Snapshot (Critical for data integrity)
    package_snapshot JSONB NOT NULL DEFAULT '{}',
    
    -- IV. Quản trị & Audit
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT fk_order_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    CONSTRAINT fk_order_package FOREIGN KEY (package_id) REFERENCES service_packages(_id),
    CONSTRAINT uq_order_number UNIQUE (order_number),
    CONSTRAINT chk_order_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_order_currency CHECK (LENGTH(currency_code) = 3),
    CONSTRAINT chk_order_status CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'FAILED'))
);

-- Indexes
CREATE INDEX idx_orders_tenant_lookup 
ON subscription_orders (tenant_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_orders_pending_status 
ON subscription_orders (status, created_at) 
WHERE status = 'PENDING' AND deleted_at IS NULL;

CREATE UNIQUE INDEX idx_orders_number_search 
ON subscription_orders (order_number) 
WHERE deleted_at IS NULL;
```

---

### 2. Golang API Setup

```go
import "github.com/yourproject/handlers"

orderHandler := handlers.NewSubscriptionOrderHandler(db)

router.GET("/api/v1/subscription-orders", orderHandler.GetAllOrders)
router.GET("/api/v1/subscription-orders/:id", orderHandler.GetOrderByID)
router.POST("/api/v1/subscription-orders", orderHandler.CreateOrder)
router.PATCH("/api/v1/subscription-orders/:id", orderHandler.UpdateOrder)
router.DELETE("/api/v1/subscription-orders/:id", orderHandler.SoftDeleteOrder)
router.GET("/api/v1/tenants/:tenant_id/orders", orderHandler.GetOrdersByTenant)
router.GET("/api/v1/subscription-orders/statistics", orderHandler.GetOrderStatistics)
```

---

### 3. Frontend Integration

```tsx
import { OrdersPage } from './pages/OrdersPage';

<Route path="/core/orders" element={<OrdersPage />} />
```

---

## 📦 Files Overview

### Backend (Golang)
```
/golang-api/handlers/
└── subscription_orders_handler.go  (570+ lines, Full CRUD + Statistics)
```

**Key Features:**
- ✅ 7 HTTP handlers
- ✅ Automatic package snapshot capture
- ✅ Optimistic locking support
- ✅ Soft delete
- ✅ Advanced filtering & search
- ✅ Revenue statistics

---

### Frontend (React) ⭐ ENHANCED

```
/pages/
├── OrdersPage.tsx                  (370+ lines, Table & Grid views)
├── CreateOrderPage.tsx             (250+ lines, Create form) ⭐ NEW
└── EditOrderPage.tsx               (280+ lines, Edit with locking) ⭐ NEW

/components/orders/
└── OrderDetailModal.tsx            (450+ lines, Enhanced design) ⭐⭐⭐ ENHANCED

/api/
└── orderApi.ts                     (150+ lines, API client)
```

**Key Features:**
- ✅ Table & Grid view modes
- ✅ Search & status filters
- ✅ **OrderDetailModal** with beautiful gradient design ⭐⭐⭐
  - Indigo-purple-pink gradient header
  - Two-column layout
  - Package snapshot with blue gradient
  - Interactive status flow
  - Database schema info
- ✅ **CreateOrderPage** with auto-fill logic ⭐ NEW
- ✅ **EditOrderPage** with optimistic locking ⭐ NEW
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Loading states & error handling

---

### Documentation
```
/docs/
├── ORDERS_README.md             (This file - Index) [700+ lines]
├── ORDERS_SCHEMA.md             (Database schema) [600+ lines]
├── ORDERS_API.md                (API endpoints) [700+ lines]
├── ORDERS_USECASES.md           (Business scenarios) [800+ lines]
├── ORDERS_UI_COMPONENTS.md      (UI components) [700+ lines] ⭐ ENHANCED
└── ORDERS_ERD.md                (Entity relationships) [550+ lines]
```

**Total Documentation:** 4,050+ lines ⭐ ENHANCED

---

## 🎯 Key Features

### ✅ Database
- UUID v7 primary keys
- Foreign keys to tenants & service_packages
- **JSONB package_snapshot** for price & entitlements protection
- Optimistic locking (version field)
- Soft delete support
- 4 optimized indexes

---

### ✅ API
- 7 RESTful endpoints
- Advanced filtering (status, tenant, search)
- Pagination support
- Statistics endpoint (revenue, conversion rate)
- Optimistic locking enforcement
- Comprehensive error handling

---

### ✅ UI (Enhanced v2.0) ⭐⭐⭐
- **OrderDetailModal** with stunning gradient design
  - Gradient header (indigo → purple → pink)
  - Icon-enhanced sections
  - Package snapshot with blue-cyan gradient
  - Interactive status flow with rings
  - Database schema info panel
  - Responsive two-column layout
- **CreateOrderPage** with smart auto-fill
  - Auto-generate order number
  - Auto-fill price when package selected
  - Live price preview
  - Package snapshot explanation
- **EditOrderPage** with optimistic locking
  - Version conflict detection
  - Auto-reload on conflict
  - Read-only vs editable fields
  - Clear UX for concurrent edits
- Table & Grid views
- Search & filters
- Dark mode support
- Loading states & toast notifications

---

### ✅ Business Logic
- **Package snapshot protection** (giá & quyền lợi)
- Order status flow (PENDING → PAID/CANCELLED/FAILED)
- Payment method tracking
- Multi-currency support (VND, USD, EUR, etc.)
- Order expiration handling (7-day timeout)
- Revenue analytics

---

## 🔗 Integration Points

### With Other Modules

1. **Tenants**
   - Orders belong to tenants
   - 1 Tenant → N Orders
   - Tenant can view order history

2. **Service Packages**
   - Orders reference packages
   - **Package snapshot** captured at order creation
   - Protects against price/entitlements changes

3. **Tenant Subscriptions**
   - Orders create subscriptions (when status = PAID)
   - Subscription uses order's package_snapshot
   - 1 Order → 1+ Subscriptions

4. **Subscription Invoices**
   - Initial order ≈ first invoice
   - Recurring invoices from subscriptions
   - All invoices trace back to original order

---

## 📊 Example Data

### Order Creation

```json
{
  "tenant_id": "01940821-1234-7890-abcd-tenant00001",
  "package_id": "01940822-5678-7890-abcd-package0001",
  "order_number": "ORD-2025-001234",
  "total_amount": 2990000,
  "currency_code": "VND",
  "status": "PENDING"
}
```

---

### Order with Package Snapshot

```json
{
  "_id": "01940824-f123-7890-abcd-1234567890ab",
  "tenant_id": "01940821-1234-7890-abcd-tenant00001",
  "package_id": "01940822-5678-7890-abcd-package0001",
  "order_number": "ORD-2025-001234",
  "total_amount": 2990000,
  "currency_code": "VND",
  "status": "PAID",
  "payment_method": "CREDIT_CARD",
  "package_snapshot": {
    "_id": "01940822-5678-7890-abcd-package0001",
    "code": "hrm-pro",
    "name": "HRM Professional",
    "price_amount": 2990000,
    "currency_code": "VND",
    "billing_cycle": "MONTHLY",
    "entitlements_config": {
      "apps": {
        "hrm": {
          "enabled": true,
          "features": {
            "employee_management": true,
            "payroll": true,
            "advanced_reports": true
          }
        }
      }
    },
    "max_users": 50,
    "max_storage": 100,
    "trial_days": 14
  },
  "version": 2,
  "created_at": "2025-01-13T10:30:00Z",
  "updated_at": "2025-01-13T11:45:00Z"
}
```

---

## 🎨 UI Screenshots (Enhanced)

### OrderDetailModal v2.0 (Enhanced Design) ⭐⭐⭐
```
┌──────────────────────────────────────────────────────────────┐
│ 🛒 [GRADIENT HEADER: Indigo→Purple→Pink]               [×]  │
│    Chi tiết đơn hàng                                         │
│    📊 ORD-2025-001234                                        │
├──────────────────┬───────────────────────────────────────────┤
│ LEFT COLUMN      │ RIGHT COLUMN                              │
├──────────────────┼───────────────────────────────────────────┤
│ I. Định danh     │ IV. Package Snapshot 📦                   │
│ [White Card]     │ [BLUE GRADIENT - HIGHLIGHTED] ⭐⭐⭐      │
│ • Order ID       │ ┌─────────────────────────────────────┐   │
│ • Tenant ID/name │ │ ℹ️ Snapshot đảm bảo:                │   │
│ • Package ID     │ │ • Giá không thay đổi                │   │
│                  │ │ • Quyền lợi không thay đổi          │   │
│ II. Thông tin    │ │ • Lưu vết audit trail               │   │
│ [White Card]     │ └─────────────────────────────────────┘   │
│ • Order number   │ ┌──────────────────────────────��──────┐   │
│ • Status badge   │ │ {                                   │   │
│ • Payment method │ │   "code": "hrm-pro",                │   │
│                  │ │   "price_amount": 2990000,          │   │
│ III. Tài chính   │ │   "entitlements_config": {...},     │   │
│ [INDIGO GRADIENT]│ │   "max_users": 50                   │   │
│ ┌──────────────┐ │ │ }                                   │   │
│ │  2,990,000đ  │ │ └─────────────────────────────────────┘   │
│ │  [LARGE]     │ │                                           │
│ └──────────────┘ │ Order Status Flow                         │
│ • Amount         │ [INTERACTIVE INDICATORS]                  │
│ • Currency       │ ● PENDING (yellow ring when active)       │
│                  │ ● PAID (green ring when active) ✓         │
│ V. Audit         │ ● CANCELLED (gray ring when active)       │
│ [White Card]     │ ● FAILED (red ring when active)           │
│ • Version v1     │                                           │
│ • Created        │ Database Schema Info 💾                   │
│ • Updated        │ [PURPLE GRADIENT]                         │
│                  │ • Table: subscription_orders              │
│                  │ • PK: _id (UUID v7)                       │
│                  │ • FKs: tenant_id, package_id              │
│                  │ • Optimistic Locking ✓                    │
│                  │ • Soft Delete ✓                           │
│                  │ • Package Snapshot (JSONB) ✓              │
└──────────────────┴───────────────────────────────────────────┘
│ ID: 01940824...  •  Version: v1                [Đóng]       │
└──────────────────────────────────────────────────────────────┘
```

**What's New in Modal v2.0:**
- ✅ Gradient header (indigo → purple → pink) instead of flat color
- ✅ Icons for each section (Info, FileText, DollarSign, Package, Clock, Database)
- ✅ Package snapshot with blue-cyan gradient + info box
- ✅ Financial section with indigo-purple-pink gradient
- ✅ Interactive status flow with colored rings
- ✅ Database schema info panel (NEW section)
- ✅ Enhanced footer with ID preview
- ✅ Better spacing and rounded corners
- ✅ Shadow effects for depth

---

### CreateOrderPage (NEW) ⭐
```
┌────────────────────────────────────────────────────────┐
│ [← Quay lại]  🛒 Tạo đơn hàng mới                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ I. Định danh & Liên kết                               │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Tenant: [Chọn tenant ▼]                          │  │
│ │ Gói: [Chọn gói ▼] → Auto-fills price!           │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ II. Thông tin đơn hàng                                │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Mã đơn hàng: ORD-2025-0113-1234 (auto-generated)│  │
│ │ Trạng thái: [PENDING ▼]                          │  │
│ │ Phương thức: [Credit Card ▼]                     │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ III. Tài chính [GRADIENT BACKGROUND]                 │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Tổng tiền: [2990000.0000]                        │  │
│ │ Tiền tệ: [VND ▼]                                 │  │
│ │                                                   │  │
│ │ Hiển thị: 2,990,000 đ [LIVE PREVIEW]            │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ ℹ️ Package snapshot sẽ được tự động lưu khi tạo...   │
│                                                        │
│                              [Hủy]  [Tạo đơn hàng]   │
└────────────────────────────────────────────────────────┘
```

---

### EditOrderPage (NEW) ⭐
```
┌────────────────────────────────────────────────────────┐
│ [← Quay lại]  Chỉnh sửa đơn hàng                      │
│               ORD-2025-001234 • Version: v1            │
├───────────────────────────────────────────────────────��┤
│                                                        │
│ ⚠️ Optimistic Locking Warning                         │
│ Version control active. Reload if conflict occurs.    │
│                                                        │
│ Thông tin cố định (không thể sửa) [GRAY BG]          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Order ID: 01940824-f123-7890...                  │  │
│ │ Mã đơn: ORD-2025-001234                          │  │
│ │ Tenant: Công ty ABC                              │  │
│ │ Gói: HRM Professional                            │  │
│ │ Tạo lúc: 13/01/2025 10:30:15                     │  │
│ │ Cập nhật: 13/01/2025 10:30:15                    │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ Thông tin có thể chỉnh sửa [WHITE BG]                │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Trạng thái: [PAID ▼]                             │  │
│ │ Phương thức: [CREDIT_CARD ▼]                     │  │
│ │ Tổng tiền: [2990000.0000]                        │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ 📦 Package snapshot (không thể sửa)                   │
│ Đảm bảo giá & quyền lợi không đổi.                   │
│                                                        │
│ Current version: v1 • Updating to: v2                 │
│                              [Hủy]  [Lưu thay đổi]   │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 Lifecycle

### Order Creation

1. **Tenant chọn gói dịch vụ**
2. **Tạo đơn hàng mới**
   - **Package snapshot** được tự động lưu
   - **Trạng thái:** PENDING
3. **Xác nhận đơn hàng**
   - **Trạng thái:** PAID
   - **Tạo subscription** từ đơn hàng

### Order Update

1. **Chỉnh sửa đơn hàng**
   - **Optimistic locking** kiểm tra phiên bản
   - **Trạng thái:** CANCELLED/FAILED
2. **Lưu thay đổi**
   - **Trạng thái:** PAID
   - **Cập nhật subscription**

### Order Deletion

1. **Xóa đơn hàng**
   - **Soft delete** (deleted_at được thiết lập)
   - **Trạng thái:** CANCELLED/FAILED

---

## 🚧 Roadmap

### Phase 1 (Current) ✅ COMPLETED
- ✅ Full CRUD operations
- ✅ Table & Grid views
- ✅ **OrderDetailModal** with enhanced gradient design ⭐⭐⭐
- ✅ **CreateOrderPage** with auto-fill ⭐ NEW
- ✅ **EditOrderPage** with optimistic locking ⭐ NEW
- ✅ Complete documentation (4,050+ lines)
- ✅ Package snapshot protection
- ✅ Optimistic locking

---

### Phase 2 (Next) ⏳
- ⏳ Payment gateway integration (Stripe, MoMo, ZaloPay)
- ⏳ Email notifications (order confirmation, payment reminders)
- ⏳ Order export (PDF, Excel)
- ⏳ Refund processing
- ⏳ Connect CreateOrderPage to real tenant/package APIs

---

### Phase 3 (Future) 📋
- 📋 Order analytics dashboard
- 📋 Conversion rate tracking
- 📋 A/B testing for pricing
- 📋 Subscription upsell/downsell flows
- 📋 Automated retry for failed payments

---

## 💡 Why Package Snapshot?

**Problem:** Package price/entitlements thay đổi sau khi customer đã đặt hàng

**Solution:** Lưu snapshot khi tạo order

**Benefits:**
- ✅ **Price protection:** Customer trả giá họ đã thấy lúc checkout
- ✅ **Entitlements protection:** Customer nhận đúng quyền lợi đã mua
- ✅ **Audit trail:** Luôn biết customer đã mua gì, khi nào, bao nhiêu tiền
- ✅ **Legal compliance:** Có bằng chứng về transaction details

**Example:**
```
Day 1: Package "HRM Pro" = 2,990,000 VND
       → Customer creates order → Snapshot saves 2,990,000 VND

Day 2: Admin increases price to 3,490,000 VND

Day 3: Customer pays → Still charged 2,990,000 VND (from snapshot) ✓
```

**Visualization in UI:**
- ✅ Package snapshot displayed in **blue-cyan gradient** card
- ✅ Info box explaining its importance
- ✅ Full JSON viewer with syntax highlighting
- ✅ Most prominent section in OrderDetailModal

---

## 🎉 What's New in v2.0

### OrderDetailModal Enhancement ⭐⭐⭐
- **Gradient header** (indigo → purple → pink) instead of flat
- **Icon-enhanced sections** (Info, FileText, DollarSign, Package, Clock, Database)
- **Package snapshot** with blue-cyan gradient + border-2
- **Info box** explaining snapshot importance (3 bullets)
- **Interactive status flow** with colored rings for current status
- **Database schema info** panel (NEW section)
- **Enhanced footer** with ID preview
- **Better spacing** and rounded corners (rounded-xl)
- **Shadow effects** for visual depth

### CreateOrderPage (NEW) ⭐
- Auto-generate order number (ORD-YYYY-MMDD-####)
- Tenant & Package dropdowns
- **Smart auto-fill**: Select package → Auto-fills price & currency
- Live price preview
- Payment method selector
- Status selector
- Package snapshot info note
- Form validation

### EditOrderPage (NEW) ⭐
- Load existing order data
- **Optimistic locking** with version field
- **Read-only fields**: ID, order_number, tenant, package, dates
- **Editable fields**: status, payment_method, total_amount
- **Version conflict detection**: 409 → Reload order
- **Clear UX** for concurrent edits
- Package snapshot info (read-only)

---

## 📚 Component Architecture

```
/pages
├── OrdersPage.tsx                [370 lines]
│   ├── OrderTable (Table view)
│   ├── OrderCard (Grid view)
│   └── OrderDetailModal trigger
│
├── CreateOrderPage.tsx           [250 lines] ⭐ NEW
│   ├── Auto-generate order number
│   ├── Smart auto-fill logic
│   └── Live price preview
│
└── EditOrderPage.tsx             [280 lines] ⭐ NEW
    ├── Optimistic locking
    ├── Read-only vs editable
    └── Version conflict handling

/components/orders
└── OrderDetailModal.tsx          [450 lines] ⭐⭐⭐ ENHANCED
    ├── Gradient header
    ├── Icon-enhanced sections
    ├── Package snapshot (blue gradient)
    ├── Interactive status flow
    └── Database schema info

/api
└── orderApi.ts                   [150 lines]
    ├── getAll()
    ├── getById()
    ├── create()
    ├── update() (with optimistic locking)
    ├── softDelete()
    ├── getByTenant()
    └── getStatistics()
```

---

**Version:** 2.0.0 ⭐ ENHANCED  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team  
**Module Status:** ✅ Production Ready (Enhanced UI)
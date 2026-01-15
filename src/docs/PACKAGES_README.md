# Service Packages Module - Complete Documentation

## 📋 Overview

Module **Service Packages** quản lý các gói dịch vụ (subscription plans/tiers) trong hệ thống SaaS. Đây là các tier khác nhau của một sản phẩm với pricing và entitlements riêng biệt.

---

## 📚 Documentation Index

### 1. [Database Schema](./PACKAGES_SCHEMA.md)
**Chi tiết:** Cấu trúc bảng `service_packages`, indexes, constraints

**Nội dung:**
- ✅ 20+ columns with detailed specifications
- ✅ 7 indexes for optimal performance
- ✅ JSONB for flexible entitlements
- ✅ Optimistic locking & soft delete
- ✅ Query patterns & examples

**Đọc khi:** Database design, migration, query optimization

---

### 2. [API Documentation](./PACKAGES_API.md)
**Chi tiết:** RESTful API endpoints, request/response format

**Nội dung:**
- ✅ 7 API endpoints
- ✅ Request/Response examples
- ✅ Query parameters & filters
- ✅ Error handling
- ✅ cURL examples

**Đọc khi:** API integration, frontend development

---

### 3. [Use Cases](./PACKAGES_USECASES.md)
**Chi tiết:** Real-world scenarios, business logic

**Nội dung:**
- ✅ 7 use case categories
- ✅ Tiered pricing strategies
- ✅ Entitlements configuration
- ✅ Package lifecycle management
- ✅ Pricing models (freemium, annual, usage-based)

**Đọc khi:** Business analysis, feature planning

---

### 4. [UI Components](./PACKAGES_UI_COMPONENTS.md)
**Chi tiết:** React components, design system

**Nội dung:**
- ✅ PackagesPage component
- ✅ Table & Grid views
- ✅ Design system (colors, typography)
- ✅ Responsive design
- ✅ Best practices

**Đọc khi:** Frontend development, UI/UX design

---

### 5. [ERD Diagram](./PACKAGES_ERD.md)
**Chi tiết:** Entity relationships, data flow

**Nội dung:**
- ✅ Complete ERD diagram
- ✅ Relationship with products
- ✅ Relationship with subscriptions
- ✅ Indexing strategy

**Đọc khi:** Database design, system architecture

---

## 🚀 Quick Start

### 1. Database Setup

```sql
CREATE TABLE service_packages (
  _id UUID PRIMARY KEY,
  saas_product_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_amount NUMERIC(19,4) NOT NULL DEFAULT 0,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'VND',
  entitlements_config JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
  max_users INTEGER,
  max_storage INTEGER,
  features JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 1,
  
  CONSTRAINT fk_package_product FOREIGN KEY (saas_product_id) 
    REFERENCES saas_products(_id),
  CONSTRAINT uq_package_code UNIQUE (code),
  CONSTRAINT chk_package_price CHECK (price_amount >= 0),
  CONSTRAINT chk_package_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
);
```

### 2. Golang API Setup

```go
import "github.com/yourproject/handlers"

packageHandler := handlers.NewServicePackageHandler(db)

router.GET("/api/v1/service-packages", packageHandler.GetAllPackages)
router.GET("/api/v1/service-packages/:id", packageHandler.GetPackageByID)
router.POST("/api/v1/service-packages", packageHandler.CreatePackage)
router.PATCH("/api/v1/service-packages/:id", packageHandler.UpdatePackage)
router.DELETE("/api/v1/service-packages/:id", packageHandler.SoftDeletePackage)
router.GET("/api/v1/saas-products/:id/packages", packageHandler.GetPackagesByProduct)
router.GET("/api/v1/service-packages/statistics", packageHandler.GetPackageStatistics)
```

### 3. Frontend Integration

```tsx
import { PackagesPage } from './pages/PackagesPage';

<Route path="/core/packages" element={<PackagesPage />} />
```

---

## 📦 Files Overview

### Backend (Golang)
```
/golang-api/handlers/
└── service_packages_handler.go  (700+ lines, Full CRUD + Statistics)
```

### Frontend (React)
```
/pages/
└── PackagesPage.tsx              (300+ lines, Table & Grid views, Modal integration)

/components/packages/
└── PackageDetailModal.tsx        (400+ lines, 27+ fields, 9 sections) ⭐ NEW

/api/
└── servicePackageApi.ts          (150+ lines, API client)
```

### Documentation
```
/docs/
├── PACKAGES_README.md            (This file - Index)
├── PACKAGES_SCHEMA.md            (Database schema)
├── PACKAGES_API.md               (API endpoints)
├── PACKAGES_USECASES.md          (Business scenarios)
├── PACKAGES_UI_COMPONENTS.md     (UI components)
└── PACKAGES_ERD.md               (Entity relationships)
```

---

## 🎯 Key Features

### ✅ Database
- UUID v7 primary keys
- Foreign key to saas_products
- JSONB for entitlements
- Optimistic locking
- Soft delete
- 7 optimized indexes

### ✅ API
- 7 RESTful endpoints
- Advanced filtering
- Pagination support
- Statistics endpoint
- Optimistic locking
- Error handling

### ✅ UI
- Table & Grid views
- Search & filters
- Responsive design
- Dark mode support
- Loading states
- **PackageDetailModal with 27+ fields** ⭐ NEW
- **Click package name to view details** ⭐ NEW

### ✅ Business
- Tiered pricing
- Entitlements config
- Feature gating
- Trial periods
- Public/private packages
- Display order control

---

## 🔗 Integration Points

### With Other Modules

1. **SaaS Products**
   - Packages belong to products
   - 1 Product → N Packages

2. **Tenant Subscriptions**
   - Subscriptions reference packages
   - Package snapshot for price protection

3. **System Categories**
   - Optional categorization

---

## 📊 Example Data

### Starter Package
```json
{
  "code": "hrm-starter",
  "name": "HRM Starter",
  "price_amount": 990000,
  "currency_code": "VND",
  "billing_cycle": "MONTHLY",
  "max_users": 10,
  "max_storage": 10,
  "trial_days": 7,
  "entitlements_config": {
    "apps": {
      "hrm": {
        "enabled": true,
        "features": {
          "employee_management": true,
          "payroll": false
        }
      }
    }
  }
}
```

### Professional Package
```json
{
  "code": "hrm-professional",
  "name": "HRM Professional",
  "price_amount": 2990000,
  "currency_code": "VND",
  "billing_cycle": "MONTHLY",
  "max_users": 50,
  "max_storage": 100,
  "trial_days": 14,
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
  }
}
```

---

## 🎨 UI Screenshots

### Packages List (Table View)
```
┌───────────────────────────────────────────────────────────────┐
│ Gói dịch vụ                                    [+ Thêm gói mới] │
│ 15 gói                                                         │
├───────────────────────────────────────────────────────────────┤
│ [Search...] [Status▼] [Public/Private▼] [Table][Grid]        │
├───────────────────────────────────────────────────────────────┤
│ Package          │ Product  │ Price       │ Status  │ Actions│
├───────────────────────────────────────────────────────────────┤
│ HRM Starter      │ HRM      │ 990,000đ    │ Active  │ [Edit] │
│ hrm-starter      │ Suite    │ /month      │         │ [Del]  │
├───────────────────────────────────────────────────────────────┤
│ HRM Professional │ HRM      │ 2,990,000đ  │ Active  │ [Edit] │
│ hrm-pro          │ Suite    │ /month      │         │ [Del]  │
└───────────────────────────────────────────────────────────────┘
```

---

## 📈 Statistics

| Metric | Value |
|--------|-------|
| **Backend Code** | 700+ lines |
| **Frontend Code** | 400+ lines |
| **Documentation** | 2,000+ lines |
| **API Endpoints** | 7 |
| **Database Indexes** | 7 |
| **Use Cases** | 15+ |

---

## 🔒 Security

- **Authentication:** Bearer token required
- **Authorization:** Role-based access
- **Row-level security:** Optional RLS policies
- **Audit trail:** created_by, updated_by, deleted_by
- **Version control:** Optimistic locking

---

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Full CRUD operations
- ✅ Table & Grid views
- ✅ Complete documentation

### Phase 2 (Next)
- ✅ **Package detail modal** ⭐ COMPLETED!
- ⏳ Entitlements visual editor
- ⏳ Package comparison tool
- ⏳ A/B testing support

### Phase 3 (Future)
- 📋 Package analytics
- 📋 Recommendation engine
- 📋 Dynamic pricing
- 📋 AI-powered optimization

---

## 📞 Support

**Issues:**
- Documentation: Tag `documentation`
- API: Tag `api`
- UI: Tag `frontend`
- Database: Tag `database`

---

## 📚 Related Modules

- [SaaS Products](./PRODUCTS_README.md)
- [Tenant Subscriptions]
- [System Categories](./SYSTEM_CATEGORIES_SCHEMA.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-13  
**Maintainer:** VHV Platform Team  
**Module Status:** ✅ Production Ready
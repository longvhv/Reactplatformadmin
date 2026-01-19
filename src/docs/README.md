# 📚 DOCUMENTATION INDEX

**Thư mục tài liệu tập trung cho VHV Platform React Application**

---

## 🆕 LATEST UPDATES (2026-01-16)

### 🌍 i18n Migration Planning
- **2026-01-16-react-i18next-migration-plan.md** - Full migration plan (30 pages)
- **I18N_COMPARISON_TABLE.md** - Feature comparison & decision matrix  
- **REACT_I18NEXT_QUICK_START.md** - Developer quick start guide (10 min read)
- **EXECUTIVE_SUMMARY_I18N_MIGRATION.md** - Executive summary for stakeholders

**Context:** Lập kế hoạch chuyển từ custom LanguageProvider → react-i18next  
**Status:** ⏳ Planning Phase - Awaiting Approval  
**Impact:** 476% ROI over 3 years, -48h/year maintenance cost

---

## 🗂️ CẤU TRÚC THU MỤC

```
docs/
├── README.md (file này)
├── CLEANUP_COMPLETE_REPORT.md
├── CLEANUP_DOCUMENTATION_RECOMMENDATION.md
│
├── Core Documentation
├── API & Architecture
├── Database
├── Developer Guides
├── Golang Models
├── Testing
├── Use Cases
└── Bugfix Logs
```

---

## 📖 CORE DOCUMENTATION

### Application Design
- **DESIGN_SYSTEM.md** - Design system (Stripe/GitHub/Vercel inspired)
- **SIDEBAR_MENU_GROUPED_STRUCTURE.md** - Menu structure

### API & Integration
- **API_REFERENCE_COMPLETE.md** - Complete API reference
- **GOLANG_ENDPOINTS.md** - Golang backend endpoints
- **GOLANG_MIGRATION_READY.md** - Migration readiness checklist
- **MIGRATION_TO_GO_FRAMEWORK_STANDARD.md** - Migration guide

### Database
- **DATABASE_README.md** - Database overview
- **DATABASE_SCHEMA_COMPLETE.md** - Complete schema
- **DATABASE_ERD_COMPLETE.md** - ERD diagrams
- **DATABASE_DOCS_API.md** - Database API docs

### Tenant & System
- **DEVELOPER_GUIDE_TENANTS.md** - Tenant development guide
- **TENANT_RATE_LIMITS_COMPLETE.md** - Rate limiting
- **TENANT_MEMBERS_API.md** - Tenant members API
- **RESERVED_SLUGS_COMPLETE.md** - Reserved slugs
- **SYSTEM_CATEGORIES_SCHEMA.md** - System categories
- **SYSTEM_ANNOUNCEMENTS_CRUD_IMPLEMENTATION.md** - Announcements CRUD

### Special Fixes
- **FIX-2026-01-15-users-module-sidebar-order.md** - Users module sidebar fix

---

## 📁 SUBDIRECTORIES

### 1. `/api/` - API Documentation
- **ANNOUNCEMENTS_API.md** - Announcements API
- **APPLICATIONS_API.md** - Applications API
- **TENANT_RATE_LIMITS_API.md** - Rate limits API
- **tenant-details-api.md** - Tenant details
- **tenants-api.md** - Tenants API
- **users-api-complete.md** - Users API complete

**📄 6 files**

---

### 2. `/architecture/` - Architecture Documentation
- **API_CLIENT_ARCHITECTURE.md** - API client architecture
- **API_REFACTORING_GUIDE.md** - Refactoring guide
- **README.md** - Architecture overview

**📄 3 files**

---

### 3. `/database/` - Database Schemas
- **ANNOUNCEMENTS_SCHEMA.md** - Announcements schema
- **APPLICATIONS_SCHEMA.md** - Applications schema
- **TENANT_RATE_LIMITS_SCHEMA.md** - Rate limits schema
- **packages-complete-schema.md** - Packages schema
- **products-complete-schema.md** - Products schema
- **tenants-complete-schema.md** - Tenants schema
- **tenants-erd.md** - Tenants ERD
- **tenants-migrations.sql** - Migrations
- **tenants-schema.md** - Tenants schema detail
- **users-complete-schema.md** - Users schema

**📄 10 files**

---

### 4. `/developer/` - Developer Guides (Module-specific)

#### Products
- **products-api-reference.md**
- **products-database-schema.md**
- **products-detail-complete.md**
- **products-erd-diagram.md**
- **products-use-cases.md**

#### Service Packages
- **service-packages-api-reference.md**
- **service-packages-database-schema.md**
- **service-packages-erd-diagram.md**
- **service-packages-use-cases.md**
- **SERVICE_PACKAGES_POPUP_COMPLETE.md**

#### Subscriptions
- **subscriptions-api-reference.md**
- **subscriptions-database-schema.md**
- **subscriptions-erd-diagram.md**
- **subscriptions-use-cases.md**
- **SUBSCRIPTIONS_DEVELOPER_DOCUMENTATION.md**

#### Subscription Invoices
- **subscription-invoices-api-reference.md**
- **subscription-invoices-database-schema.md**
- **subscription-invoices-erd-diagram.md**
- **subscription-invoices-use-cases.md**
- **SUBSCRIPTION_INVOICES_COMPLETE_PACKAGE.md**
- **README_SUBSCRIPTION_INVOICES.md**

#### Subscription Orders
- **subscription-orders-api-reference.md**
- **subscription-orders-database-schema.md**
- **subscription-orders-erd-diagram.md**
- **subscription-orders-use-cases.md**
- **SUBSCRIPTION_ORDERS_COMPLETE_PACKAGE.md**
- **README_SUBSCRIPTION_ORDERS.md**

#### Webhooks
- **webhooks-api-reference.md**
- **webhooks-database-schema.md**
- **webhooks-erd-diagram.md**
- **webhooks-use-cases.md**

**📄 31 files**

---

### 5. `/golang-models/` - Golang Model Definitions

**Overview:**
- **INDEX.md** - Index of all models
- **README.md** - Golang models readme
- **SUMMARY.md** - Summary
- **CHECKLIST.md** - Migration checklist
- **COMPLETE_DOCUMENTATION.md** - Complete docs
- **ALL_MENUS_CODE_OVERVIEW.md** - Menus overview

**Model Files (.md):**
- ACCESS_HISTORY_MODELS.md
- APPLICATION_MODELS.md
- INVOICE_MODELS.md
- NOTIFICATION_MODELS.md
- ORDER_MODELS.md
- PACKAGE_MODELS.md
- PRODUCT_MODELS.md
- RATE_LIMIT_MODELS.md
- ROLE_MODELS.md
- SERVICE_MODELS.md
- TEMPLATE_MODELS.md
- TENANT_MENUS_COMPLETE.md
- TERMS_MODELS.md
- WEBHOOK_MODELS.md

**Golang Code Files (.go):**
- access-analytics.go
- access-history.go
- access-security.go
- application-capabilities.go
- application-related.go
- application.go
- invoice-automation.go
- invoice-payment.go
- invoice.go
- notification-analytics.go
- notification-delivery.go
- notification.go
- order-fulfillment.go
- order-returns.go
- order.go
- package-usage.go
- product-inventory.go
- product-reviews.go
- product.go
- rate-limit-analytics.go
- rate-limit-tracking.go
- rate-limit.go
- role-assignment.go
- role-audit.go
- role.go
- service-contract.go
- service-package.go
- service-subscription.go
- service.go
- subscription.go
- template-localization.go
- template-testing.go
- template.go
- tenant-menu-part1.go
- tenant-menu-part2.go
- tenant-menu-part3.go
- tenant-menu-part4.go
- tenant-related.go
- tenant.go
- terms-acceptance.go
- terms-management.go
- terms.go
- webhook-delivery.go
- webhook-security.go
- webhook.go

**📄 60+ files**

---

### 6. `/testing/` - Testing Documentation
- **users-testing-guide.md** - Users module testing guide

**📄 1 file**

---

### 7. `/usecases/` - Use Cases Documentation
- **ANNOUNCEMENTS_USECASES.md** - Announcements use cases
- **APPLICATIONS_USECASES.md** - Applications use cases
- **packages-complete-usecases.md** - Packages use cases
- **products-complete-usecases.md** - Products use cases
- **tenant-detail-page-usecases.md** - Tenant detail use cases
- **tenants-usecases.md** - Tenants use cases
- **users-complete-usecases.md** - Users use cases

**📄 7 files**

---

### 8. `/bugfix/` - Bugfix Logs

**Index:**
- **README.md** - Bugfix index
- **BUGFIX_HISTORY.md** - Consolidated history

**CRUD Checks:**
- **CHECK-2026-01-15-invoices-crud-complete.md** - Invoices CRUD check
- **CHECK-2026-01-15-orders-crud-complete.md** - Orders CRUD check

**Completed Fixes (2026-01-15):**
- APPLICATION_DETAIL_PAGE_SUPABASE_INTEGRATION.md
- DATABASE_LIMITATIONS_AND_FIXES.md
- FEATURE-2026-01-15-webhooks-add-edit-forms.md
- FIX-2026-01-15-applications-edit-route.md
- FIX-2026-01-15-invoice-module-routing-navigation.md
- FIX-2026-01-15-missing-menu-items-module-id-mismatch.md
- FIX-2026-01-15-orders-module-hardcoded-route-conflict.md
- FIX-2026-01-15-react-router-translations-webhook.md
- FIX-2026-01-15-service-package-detail-data-loading.md
- FIXED-2026-01-15-products-routing.md
- FIXED-2026-01-15-products-table-name.md
- FIXED-2026-01-15-service-packages-edit-button.md
- FIXED-2026-01-15-service-packages-form.md
- FIXED-2026-01-15-tenants-menu-missing.md
- FIXED-2026-01-15-translation-keys-missing.md
- FIXING-2026-01-15-product-detail-not-found.md
- FIX_SUBSCRIPTION_FETCH_ERROR.md
- REFACTOR-2026-01-15-application-detail-sidebar-layout.md
- ROLES_RLS_POLICY_FIX.md
- SUBSCRIPTION_INVOICES_SCHEMA_MIGRATION_COMPLETE.md
- SUBSCRIPTION_ORDERS_COMPLETE_FIX.md
- SUBSCRIPTION_ORDERS_SCHEMA_MIGRATION_COMPLETE.md
- UUID_ROUTE_CONFLICT_FIX_FINAL.md

**📄 25+ files**

---

## 🔍 QUICK REFERENCE

### Tìm API của một module?
→ Xem `/docs/developer/{module}-api-reference.md`

### Tìm database schema?
→ Xem `/docs/database/` hoặc `/docs/developer/{module}-database-schema.md`

### Tìm use cases?
→ Xem `/docs/usecases/{module}-usecases.md`

### Tìm ERD diagram?
→ Xem `/docs/developer/{module}-erd-diagram.md`

### Tìm Golang models?
→ Xem `/docs/golang-models/`

### Tìm bugfix history?
→ Xem `/docs/bugfix/BUGFIX_HISTORY.md`

### Tìm hướng dẫn development?
→ Xem `/docs/developer/` hoặc root `/DEVELOPMENT-GUIDE.md`

---

## 📊 STATISTICS

**Total files:** ~120 files  
**Subdirectories:** 8  
**Module coverage:** 15+ modules  
**Languages:** Markdown, SQL, Golang

**Last cleanup:** 2026-01-15  
**Files removed:** 137 files  
**Reduction:** 70%

---

## 🎯 CONTRIBUTING

Khi thêm documentation mới:
1. Đặt vào thư mục phù hợp
2. Follow naming convention
3. Update index này
4. Cross-reference các docs liên quan

**Naming Convention:**
- API: `{module}-api-reference.md`
- Schema: `{module}-database-schema.md`
- ERD: `{module}-erd-diagram.md`
- Use Cases: `{module}-use-cases.md`
- Bugfix: `FIX-YYYY-MM-DD-{description}.md`

---

## 📞 RELATED DOCS

**Root Documentation:**
- `/README.md` - Main project readme
- `/ARCHITECTURE.md` - System architecture
- `/DEVELOPMENT-GUIDE.md` - Development guide
- `/QUICKSTART.md` - Quick start guide

**See Also:**
- `/guidelines/Guidelines.md` - Development guidelines
- `/CONTRIBUTING.md` - Contribution guide

---

**Last updated:** 2026-01-15  
**Maintained by:** Development Team
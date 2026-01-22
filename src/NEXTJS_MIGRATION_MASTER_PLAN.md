# 📋 NEXT.JS MIGRATION MASTER PLAN

## 🎯 MỤC TIÊU

**Migrate toàn bộ ứng dụng từ React SPA sang Next.js App Router architecture với shim layer**

### Nguyên tắc vàng:
1. ✅ **Code chính ở `/app/(admin)/`** - Single source of truth
2. ✅ **Pages chỉ import** - Thin wrappers, no logic
3. ✅ **Shim cho Next.js** - Easy migration về sau
4. ✅ **No circular dependencies** - One-way: pages → app
5. ✅ **Incremental migration** - Migrate từng batch, test kỹ

---

## 📊 HIỆN TRẠNG

### Current Structure:
```
/pages/           ← 109 page files (implementation)
/modules/         ← 38 modules (registry system)
/components/      ← Shared components
/api/             ← API clients
/hooks/           ← Custom hooks
/App.tsx          ← Entry point
```

### Target Structure:
```
/app/(admin)/     ← NEW: Implementations (Next.js style)
/pages/           ← THIN WRAPPERS: Import from app
/components/shim/ ← Navigation shim
/modules/         ← Keep: Module registry
```

---

## 📈 THỐNG KÊ PAGES (109 FILES)

### By Category:

#### 1. ADMIN (Quản trị & Truy cập) - 22 pages
- **Tenants:** TenantsPage, TenantDetailPage, AddTenantPage, EditTenantPage, TenantMembersPage, TenantSubscriptionsPage (6)
- **Users:** UsersPage, UserDetailPage, AddUserPage, EditUserPage, UserRolesPage, UserDelegationsPage, AddUserDelegationPage (7)
- **Roles:** RolesPage, RoleDetailPage, AddRolePage, EditRolePage (4)
- **Audit & Auth:** AuditLogsPage, AuditLogDetailPage, AuthLogsPage (3)
- **User Registration:** UserRegistrationTelemetryPage, AddUserRegistrationPage, EditUserRegistrationPage, UserRegistrationDetailPage (4)

#### 2. PLATFORM (Nền tảng) - 27 pages
- **Applications:** ApplicationsPage, ApplicationDetailPage, ApplicationFormPage (3)
- **Feature Flags:** FeatureFlagsPage, FeatureFlagDetailPage, AddFeatureFlagPage, EditFeatureFlagPage (4)
- **Reserved Slugs:** ReservedSlugsPage, ReservedSlugDetailPage, AddReservedSlugPage, EditReservedSlugPage (4)
- **System Categories:** SystemCategoriesPage, AddSystemCategoryPage, EditSystemCategoryPage (3)
- **System Jobs:** SystemJobsPage, SystemJobDetailPage, AddSystemJobPage, EditSystemJobPage (4)
- **Regions:** RegionsPage, AddRegionPage, EditRegionPage (3)
- **Traffic Logs:** TrafficLogsPage, TrafficLogDetailPage, TrafficLogsAnalyticsPage, AddTrafficLogPage (4)
- **Tenant App Routes:** AddTenantAppRoutePage, EditTenantAppRoutePage (2)

#### 3. COMMERCE (Thương mại) - 45 pages
- **Products:** ProductsPage, ProductDetailPage, AddProductPage, EditProductPage (4)
- **Product Types:** ProductTypesPage, ProductTypeDetailPage, AddProductTypePage, EditProductTypePage (4)
- **SaaS Product Types:** SaasProductTypesPage, SaasProductTypeDetailPage, AddSaasProductTypePage, EditSaasProductTypePage (4)
- **Orders:** NotificationsPage, OrderDetailPage, AddOrderPage, EditOrderPage (4)
- **Invoices:** AddInvoicePage, InvoiceDetailPage, EditInvoicePage (3)
- **Subscriptions:** SubscriptionDetailPage, AddSubscriptionPage, EditSubscriptionPage (3)
- **Subscription Invoices:** SubscriptionInvoicesPage (1)
- **Subscription Orders:** SubscriptionOrdersPage, SubscriptionOrderDetailPage (2)
- **Digital Assets:** DigitalAssetsPage, DigitalAssetDetailPage, AddTenantDigitalAssetPage, EditDigitalAssetPage, EditTenantDigitalAssetPage (5)
- **Service Deliveries:** ServiceDeliveriesPage, ServiceDeliveryDetailPage, AddServiceDeliveryPage, EditServiceDeliveryPage (4)
- **Service Packages:** ServicePackagesPage, ServicePackageDetailPage, AddServicePackagePage, EditServicePackagePage (4)
- **Notifications:** NotificationDetailPage, AddNotificationPage, EditNotificationPage (3)
- **Notification Templates:** NotificationTemplatesPage (1)

#### 4. INTEGRATIONS (Tích hợp) - 5 pages
- **Webhooks:** WebhooksPage, WebhookDetailPage, AddWebhookPage, EditWebhookPage (4)
- **API Usage Logs:** /pages/core/api-usage-logs/ (có subfolder) (1+)

#### 5. SETTINGS & DOCS (Cài đặt & Tài liệu) - 10 pages
- **Settings:** SettingsPage (1)
- **Documentation:** ApiDocsPage, DatabaseDocsPage, DevDocsPage (3)
- **Help:** HelpPage (1)
- **Legal:** LegalDocumentsPage (1)
- **Rate Limits:** RateLimitsPage (1)
- **Permissions:** PermissionsPage (1)
- **Locations:** LocationsPage, LocationTypesPage (2)

---

## 🏗️ MIGRATION PHASES

### PHASE 0: INFRASTRUCTURE SETUP ⚙️
**Timeline:** Day 1  
**Files to create:** ~10 files

#### Tasks:
1. ✅ Create shim layer
   - `/components/shim/next-navigation.tsx` - useRouter, useParams, usePathname hooks
   - `/components/shim/AppRoutes.tsx` - Client-side routing

2. ✅ Create base app structure
   ```
   /app/
     ├── (admin)/          # Admin layout group
     │   ├── layout.tsx    # Shared layout
     │   └── page.tsx      # Redirect to dashboard
     └── globals.css       # Styles
   ```

3. ✅ Update tsconfig paths
   ```json
   {
     "paths": {
       "@/app/*": ["./app/*"],
       "@/components/shim/*": ["./components/shim/*"]
     }
   }
   ```

4. ✅ Test shim với 1 page đơn giản

**Success Criteria:**
- ✅ Shim hooks work
- ✅ Routing functional
- ✅ No build errors

---

### PHASE 1: HIGH PRIORITY PAGES 🔥
**Timeline:** Day 2-3  
**Pages:** 15 most-used pages

#### Batch 1.1: Core Admin (5 pages)
- [ ] TenantsPage → `/app/(admin)/admin/tenants/page.tsx`
- [ ] TenantDetailPage → `/app/(admin)/admin/tenants/[id]/page.tsx`
- [ ] UsersPage → `/app/(admin)/admin/users/page.tsx`
- [ ] UserDetailPage → `/app/(admin)/admin/users/[id]/page.tsx`
- [ ] RolesPage → `/app/(admin)/admin/roles/page.tsx`

#### Batch 1.2: Dashboard & Monitoring (5 pages)
- [ ] DashboardPage (in modules) → `/app/(admin)/admin/dashboard/page.tsx`
- [ ] AuditLogsPage → `/app/(admin)/admin/audit-logs/page.tsx`
- [ ] AuthLogsPage → `/app/(admin)/admin/auth-logs/page.tsx`
- [ ] TrafficLogsPage → `/app/(admin)/platform/traffic-logs/page.tsx`
- [ ] ApplicationsPage → `/app/(admin)/platform/applications/page.tsx`

#### Batch 1.3: Commerce Essentials (5 pages)
- [ ] ProductsPage → `/app/(admin)/commerce/products/page.tsx`
- [ ] OrdersPage (NotificationsPage?) → `/app/(admin)/commerce/orders/page.tsx`
- [ ] SubscriptionOrdersPage → `/app/(admin)/commerce/subscription-orders/page.tsx`
- [ ] DigitalAssetsPage → `/app/(admin)/commerce/digital-assets/page.tsx`
- [ ] WebhooksPage → `/app/(admin)/integrations/webhooks/page.tsx`

**Migration Pattern:**
```typescript
// STEP 1: Create implementation in /app/
// /app/(admin)/admin/tenants/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
// ... full implementation here

function TenantsPage() {
  // Full implementation
  return <div>...</div>;
}

export { TenantsPage }; // Named export for reuse
export default TenantsPage;

// STEP 2: Update /pages/ to thin wrapper
// /pages/TenantsPage.tsx
'use client';

import { TenantsPage as TenantsPageComponent } from '@/app/(admin)/admin/tenants/page';

export default function TenantsPage() {
  return <TenantsPageComponent />;
}
```

---

### PHASE 2: DETAIL & EDIT PAGES 📝
**Timeline:** Day 4-5  
**Pages:** ~40 detail/edit/add pages

#### Batch 2.1: Tenant Management (5 pages)
- [ ] AddTenantPage → `/app/(admin)/admin/tenants/create/page.tsx`
- [ ] EditTenantPage → `/app/(admin)/admin/tenants/[id]/edit/page.tsx`
- [ ] TenantMembersPage → `/app/(admin)/admin/tenants/[id]/members/page.tsx`
- [ ] TenantSubscriptionsPage → `/app/(admin)/admin/tenants/[id]/subscriptions/page.tsx`
- [ ] AddTenantAppRoutePage → `/app/(admin)/admin/tenants/[id]/app-routes/create/page.tsx`

#### Batch 2.2: User Management (6 pages)
- [ ] AddUserPage → `/app/(admin)/admin/users/create/page.tsx`
- [ ] EditUserPage → `/app/(admin)/admin/users/[id]/edit/page.tsx`
- [ ] UserRolesPage → `/app/(admin)/admin/users/[id]/roles/page.tsx`
- [ ] UserDelegationsPage → `/app/(admin)/admin/user-delegations/page.tsx`
- [ ] AddUserDelegationPage → `/app/(admin)/admin/user-delegations/create/page.tsx`
- [ ] UserRegistrationTelemetryPage → `/app/(admin)/admin/registration-analytics/page.tsx`

#### Batch 2.3: Applications & Platform (8 pages)
- [ ] ApplicationDetailPage → `/app/(admin)/platform/applications/[id]/page.tsx`
- [ ] ApplicationFormPage → `/app/(admin)/platform/applications/create/page.tsx`
- [ ] FeatureFlagsPage → `/app/(admin)/platform/feature-flags/page.tsx`
- [ ] FeatureFlagDetailPage → `/app/(admin)/platform/feature-flags/[id]/page.tsx`
- [ ] AddFeatureFlagPage → `/app/(admin)/platform/feature-flags/create/page.tsx`
- [ ] EditFeatureFlagPage → `/app/(admin)/platform/feature-flags/[id]/edit/page.tsx`
- [ ] ReservedSlugsPage → `/app/(admin)/platform/reserved-slugs/page.tsx`
- [ ] SystemJobsPage → `/app/(admin)/platform/system-jobs/page.tsx`

#### Batch 2.4: Products & Commerce (12 pages)
- [ ] ProductDetailPage → `/app/(admin)/commerce/products/[id]/page.tsx`
- [ ] AddProductPage → `/app/(admin)/commerce/products/create/page.tsx`
- [ ] EditProductPage → `/app/(admin)/commerce/products/edit/[id]/page.tsx`
- [ ] ProductTypesPage → `/app/(admin)/commerce/product-types/page.tsx`
- [ ] ProductTypeDetailPage → `/app/(admin)/commerce/product-types/[id]/page.tsx`
- [ ] SaasProductTypesPage → `/app/(admin)/commerce/saas-product-types/page.tsx`
- [ ] ServicePackagesPage → `/app/(admin)/commerce/service-packages/page.tsx`
- [ ] ServiceDeliveriesPage → `/app/(admin)/commerce/service-deliveries/page.tsx`
- [ ] DigitalAssetDetailPage → `/app/(admin)/commerce/digital-assets/[id]/page.tsx`
- [ ] SubscriptionInvoicesPage → `/app/(admin)/commerce/subscription-invoices/page.tsx`
- [ ] NotificationTemplatesPage → `/app/(admin)/platform/notification-templates/page.tsx`
- [ ] PermissionsPage → `/app/(admin)/admin/permissions/page.tsx`

#### Batch 2.5: Remaining Detail Pages (9 pages)
- [ ] RoleDetailPage → `/app/(admin)/admin/roles/[id]/page.tsx`
- [ ] AuditLogDetailPage → `/app/(admin)/admin/audit-logs/[id]/page.tsx`
- [ ] TrafficLogDetailPage → `/app/(admin)/platform/traffic-logs/[id]/page.tsx`
- [ ] WebhookDetailPage → `/app/(admin)/integrations/webhooks/[id]/page.tsx`
- [ ] ReservedSlugDetailPage → `/app/(admin)/platform/reserved-slugs/[id]/page.tsx`
- [ ] SystemJobDetailPage → `/app/(admin)/platform/system-jobs/[id]/page.tsx`
- [ ] SaasProductTypeDetailPage → `/app/(admin)/commerce/saas-product-types/[id]/page.tsx`
- [ ] ServicePackageDetailPage → `/app/(admin)/commerce/service-packages/[id]/page.tsx`
- [ ] ServiceDeliveryDetailPage → `/app/(admin)/commerce/service-deliveries/[id]/page.tsx`

---

### PHASE 3: FORMS & CRUD OPERATIONS 📋
**Timeline:** Day 6-7  
**Pages:** ~35 add/edit forms

#### Batch 3.1: Add Pages (18 pages)
- [ ] AddRolePage → `/app/(admin)/admin/roles/create/page.tsx`
- [ ] AddProductTypePage → `/app/(admin)/commerce/product-types/create/page.tsx`
- [ ] AddSaasProductTypePage → `/app/(admin)/commerce/saas-product-types/create/page.tsx`
- [ ] AddOrderPage → `/app/(admin)/commerce/orders/create/page.tsx`
- [ ] AddInvoicePage → `/app/(admin)/commerce/subscription-invoices/create/page.tsx`
- [ ] AddSubscriptionPage → `/app/(admin)/commerce/subscriptions/create/page.tsx`
- [ ] AddServiceDeliveryPage → `/app/(admin)/commerce/service-deliveries/create/page.tsx`
- [ ] AddServicePackagePage → `/app/(admin)/commerce/service-packages/create/page.tsx`
- [ ] AddNotificationPage → `/app/(admin)/platform/notifications/create/page.tsx`
- [ ] AddWebhookPage → `/app/(admin)/integrations/webhooks/create/page.tsx`
- [ ] AddTenantDigitalAssetPage → `/app/(admin)/commerce/digital-assets/create/page.tsx`
- [ ] AddReservedSlugPage → `/app/(admin)/platform/reserved-slugs/create/page.tsx`
- [ ] AddSystemCategoryPage → `/app/(admin)/platform/system-categories/create/page.tsx`
- [ ] AddSystemJobPage → `/app/(admin)/platform/system-jobs/create/page.tsx`
- [ ] AddRegionPage → `/app/(admin)/platform/regions/create/page.tsx`
- [ ] AddTrafficLogPage → `/app/(admin)/platform/traffic-logs/create/page.tsx`
- [ ] AddUserRegistrationPage → `/app/(admin)/admin/registration-analytics/create/page.tsx`
- [ ] EditTenantAppRoutePage → `/app/(admin)/admin/tenants/[tenantId]/app-routes/[id]/edit/page.tsx`

#### Batch 3.2: Edit Pages (17 pages)
- [ ] EditRolePage → `/app/(admin)/admin/roles/[id]/edit/page.tsx`
- [ ] EditProductTypePage → `/app/(admin)/commerce/product-types/edit/[id]/page.tsx`
- [ ] EditSaasProductTypePage → `/app/(admin)/commerce/saas-product-types/edit/[id]/page.tsx`
- [ ] EditOrderPage → `/app/(admin)/commerce/orders/edit/[id]/page.tsx`
- [ ] EditInvoicePage → `/app/(admin)/commerce/subscription-invoices/edit/[id]/page.tsx`
- [ ] EditSubscriptionPage → `/app/(admin)/commerce/subscriptions/edit/[id]/page.tsx`
- [ ] EditServiceDeliveryPage → `/app/(admin)/commerce/service-deliveries/edit/[id]/page.tsx`
- [ ] EditServicePackagePage → `/app/(admin)/commerce/service-packages/edit/[id]/page.tsx`
- [ ] EditNotificationPage → `/app/(admin)/platform/notifications/edit/[id]/page.tsx`
- [ ] EditWebhookPage → `/app/(admin)/integrations/webhooks/edit/[id]/page.tsx`
- [ ] EditDigitalAssetPage → `/app/(admin)/commerce/digital-assets/edit/[id]/page.tsx`
- [ ] EditTenantDigitalAssetPage → `/app/(admin)/commerce/digital-assets/edit/[id]/page.tsx`
- [ ] EditReservedSlugPage → `/app/(admin)/platform/reserved-slugs/[id]/edit/page.tsx`
- [ ] EditSystemCategoryPage → `/app/(admin)/platform/system-categories/edit/[id]/page.tsx`
- [ ] EditSystemJobPage → `/app/(admin)/platform/system-jobs/[id]/edit/page.tsx`
- [ ] EditRegionPage → `/app/(admin)/platform/regions/edit/[id]/page.tsx`
- [ ] EditUserRegistrationPage → `/app/(admin)/admin/registration-analytics/edit/[id]/page.tsx`

---

### PHASE 4: SETTINGS & DOCUMENTATION 📚
**Timeline:** Day 8  
**Pages:** ~12 pages

#### Batch 4.1: Settings & Config (6 pages)
- [ ] SettingsPage → `/app/(admin)/settings/page.tsx`
- [ ] RateLimitsPage → `/app/(admin)/platform/rate-limits/page.tsx`
- [ ] SystemCategoriesPage → `/app/(admin)/platform/system-categories/page.tsx`
- [ ] RegionsPage → `/app/(admin)/platform/regions/page.tsx`
- [ ] LocationsPage → `/app/(admin)/platform/locations/page.tsx`
- [ ] LocationTypesPage → `/app/(admin)/platform/location-types/page.tsx`

#### Batch 4.2: Documentation & Help (6 pages)
- [ ] ApiDocsPage → `/app/(admin)/docs/api/page.tsx`
- [ ] DatabaseDocsPage → `/app/(admin)/docs/database/page.tsx`
- [ ] DevDocsPage → `/app/(admin)/docs/developer/page.tsx`
- [ ] HelpPage → `/app/(admin)/help/page.tsx`
- [ ] LegalDocumentsPage → `/app/(admin)/legal/page.tsx`
- [ ] TrafficLogsAnalyticsPage → `/app/(admin)/platform/traffic-logs/analytics/page.tsx`

---

### PHASE 5: SPECIAL CASES & NESTED ROUTES 🔧
**Timeline:** Day 9  
**Pages:** API Usage Logs subfolder + others

#### Batch 5.1: API Usage Logs Module
- [ ] /pages/core/api-usage-logs/index.tsx → `/app/(admin)/integrations/api-usage-logs/page.tsx`
- [ ] /pages/core/api-usage-logs/[id].tsx → `/app/(admin)/integrations/api-usage-logs/[id]/page.tsx`
- [ ] /pages/core/api-usage-logs/analytics.tsx → `/app/(admin)/integrations/api-usage-logs/analytics/page.tsx`
- [ ] /pages/core/api-usage-logs/settings.tsx → `/app/(admin)/integrations/api-usage-logs/settings/page.tsx`

#### Batch 5.2: Remaining Special Cases
- [ ] NotificationsPage (OrdersPage?) - Clarify this
- [ ] NotificationDetailPage → `/app/(admin)/platform/notifications/[id]/page.tsx`
- [ ] OrderDetailPage → `/app/(admin)/commerce/orders/[id]/page.tsx`
- [ ] InvoiceDetailPage → `/app/(admin)/commerce/subscription-invoices/[id]/page.tsx`
- [ ] SubscriptionDetailPage → `/app/(admin)/commerce/subscriptions/[id]/page.tsx`
- [ ] SubscriptionOrderDetailPage → `/app/(admin)/commerce/subscription-orders/[id]/page.tsx`
- [ ] UserRegistrationDetailPage → `/app/(admin)/admin/registration-analytics/[id]/page.tsx`

---

## 🗺️ URL STRUCTURE MAPPING

### Route Patterns:

```
ADMIN GROUP: /admin/*
├── /admin/dashboard              → DashboardPage
├── /admin/tenants                → TenantsPage
│   ├── /create                   → AddTenantPage
│   ├── /[id]                     → TenantDetailPage
│   ├── /[id]/edit                → EditTenantPage
│   ├── /[id]/members             → TenantMembersPage
│   └── /[id]/subscriptions       → TenantSubscriptionsPage
├── /admin/users                  → UsersPage
│   ├── /create                   → AddUserPage
│   ├── /[id]                     → UserDetailPage
│   ├── /[id]/edit                → EditUserPage
│   └── /[id]/roles               → UserRolesPage
├── /admin/roles                  → RolesPage
│   ├── /create                   → AddRolePage
│   ├── /[id]                     → RoleDetailPage
│   └── /[id]/edit                → EditRolePage
├── /admin/audit-logs             → AuditLogsPage
├── /admin/auth-logs              → AuthLogsPage
├── /admin/permissions            → PermissionsPage
├── /admin/user-delegations       → UserDelegationsPage
└── /admin/registration-analytics → UserRegistrationTelemetryPage

PLATFORM GROUP: /platform/*
├── /platform/applications        → ApplicationsPage
├── /platform/feature-flags       → FeatureFlagsPage
├── /platform/reserved-slugs      → ReservedSlugsPage
├── /platform/system-categories   → SystemCategoriesPage
├── /platform/system-jobs         → SystemJobsPage
├── /platform/regions             → RegionsPage
├── /platform/locations           → LocationsPage
├── /platform/location-types      → LocationTypesPage
├── /platform/rate-limits         → RateLimitsPage
├── /platform/traffic-logs        → TrafficLogsPage
└── /platform/notification-templates → NotificationTemplatesPage

COMMERCE GROUP: /commerce/*
├── /commerce/products            → ProductsPage
├── /commerce/product-types       → ProductTypesPage
├── /commerce/saas-product-types  → SaasProductTypesPage
├── /commerce/orders              → OrdersPage (NotificationsPage?)

├── /commerce/subscriptions       → SubscriptionsPage
├── /commerce/subscription-invoices → SubscriptionInvoicesPage
├── /commerce/subscription-orders → SubscriptionOrdersPage
├── /commerce/digital-assets      → DigitalAssetsPage
├── /commerce/service-deliveries  → ServiceDeliveriesPage
└── /commerce/service-packages    → ServicePackagesPage

INTEGRATIONS GROUP: /integrations/*
├── /integrations/webhooks        → WebhooksPage
└── /integrations/api-usage-logs  → ApiUsageLogsPage

OTHER:
├── /settings                     → SettingsPage
├── /help                         → HelpPage
├── /legal                        → LegalDocumentsPage
└── /docs/*                       → Documentation pages
```

---

## ✅ TESTING STRATEGY

### Per Phase Testing:

#### Unit Tests:
- [ ] Shim hooks work correctly
- [ ] Routes match properly
- [ ] Params extracted correctly

#### Integration Tests:
- [ ] Navigation between pages
- [ ] Deep links work
- [ ] Browser back/forward

#### Manual Testing Checklist:
```
For each migrated page:
- [ ] Page loads without errors
- [ ] Data fetches correctly
- [ ] Forms submit properly
- [ ] Navigation works (back button, links)
- [ ] Dynamic routes work ([id] params)
- [ ] Edit/delete actions functional
- [ ] No console errors
- [ ] No circular dependency warnings
```

---

## 📦 DELIVERABLES PER PHASE

### Phase 0 Deliverables:
- [ ] `/components/shim/next-navigation.tsx`
- [ ] `/components/shim/AppRoutes.tsx`
- [ ] `/app/(admin)/layout.tsx`
- [ ] Documentation: SHIM_USAGE.md

### Phase 1-5 Deliverables (per batch):
- [ ] Implementation files in `/app/(admin)/`
- [ ] Wrapper files in `/pages/`
- [ ] Updated module routes
- [ ] Test report
- [ ] Migration progress tracker

### Final Deliverables:
- [ ] All 109 pages migrated
- [ ] Zero circular dependencies
- [ ] All tests passing
- [ ] Performance baseline established
- [ ] Complete migration documentation

---

## 🚀 MIGRATION COMMANDS

### Check Progress:
```bash
# Count migrated pages
find app -name "page.tsx" | wc -l

# Count remaining pages with implementations
grep -r "export default function" pages/*.tsx | wc -l

# Check for circular imports
# (manual inspection needed)
```

### Validation:
```bash
# Build check
npm run build

# Type check
npm run type-check

# Lint check
npm run lint
```

---

## 📊 SUCCESS METRICS

### Completion Criteria:
- ✅ 109/109 pages migrated
- ✅ Zero build errors
- ✅ Zero circular dependencies
- ✅ All routes working
- ✅ Tests passing
- ✅ Performance maintained or improved

### Performance Targets:
- Initial load: < 3s
- Route transition: < 200ms
- Time to Interactive: < 5s

---

## 🔄 ROLLBACK STRATEGY

### If Issues Occur:
1. Keep `/pages/` functional during migration
2. Can rollback individual batches
3. Shim layer allows gradual transition
4. Git branches per phase

### Rollback Commands:
```bash
# Rollback to previous phase
git checkout phase-N-complete

# Remove app directory
rm -rf app/

# Rebuild
npm run build
```

---

## 📝 NEXT STEPS

### Immediate Actions:
1. ✅ Review and approve this plan
2. ✅ Start Phase 0: Create shim layer
3. ✅ Test shim with 1 simple page
4. ✅ Begin Phase 1: Migrate high-priority pages

### Daily Progress Tracking:
- Create `/MIGRATION_PROGRESS.md` - Update daily
- Git commits per batch
- Test reports per phase

---

## 🎯 TIMELINE SUMMARY

| Phase | Duration | Pages | Status |
|-------|----------|-------|--------|
| Phase 0: Infrastructure | 1 day | Setup | ⏳ Pending |
| Phase 1: High Priority | 2 days | 15 pages | ⏳ Pending |
| Phase 2: Detail Pages | 2 days | 40 pages | ⏳ Pending |
| Phase 3: Forms & CRUD | 2 days | 35 pages | ⏳ Pending |
| Phase 4: Settings & Docs | 1 day | 12 pages | ⏳ Pending |
| Phase 5: Special Cases | 1 day | 7 pages | ⏳ Pending |
| **TOTAL** | **9 days** | **109 pages** | **0% Complete** |

---

## 💡 TIPS & BEST PRACTICES

### DO ✅
- Start with high-traffic pages
- Test each batch before moving on
- Keep consistent file structure
- Document edge cases
- Use named exports from app files
- Keep wrappers thin (max 10 lines)

### DON'T ❌
- Don't put logic in /pages/ wrappers
- Don't create circular imports
- Don't skip testing
- Don't migrate everything at once
- Don't duplicate code
- Don't forget to update module routes

---

**READY TO START PHASE 0!** 🚀

Let me know when to begin creating the shim layer and infrastructure!

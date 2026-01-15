# Unused Pages Analysis

## 🎯 Objective
Identify and remove unused page files to reduce codebase bloat.

---

## 📊 Analysis Method

Searched for all page imports across:
1. All modules (`/modules/**/index.tsx`)
2. App.tsx (full-screen pages)
3. Any other component imports

---

## ✅ Pages CONFIRMED Used (48+ files)

### **Used by Modules:**

#### Tenant Module:
- ✅ TenantsPage
- ✅ AddTenantPage
- ✅ EditTenantPage

#### User Module:
- ✅ UsersPage
- ✅ AddUserPage

#### System Category Module:
- ✅ SystemCategoriesPage
- ✅ AddSystemCategoryPage
- ✅ EditSystemCategoryPage
- ✅ RegionsPage
- ✅ AddRegionPage
- ✅ EditRegionPage

#### Products Module:
- ✅ ProductsPage
- ✅ AddProductPage
- ✅ EditProductPage

#### Service Packages Module:
- ✅ ServicePackagesPage
- ✅ AddServicePackagePage
- ✅ EditServicePackagePage

#### Subscription Orders Module:
- ✅ SubscriptionOrdersPage
- ✅ OrderDetailPage
- ✅ AddOrderPage
- ✅ EditOrderPage

#### Subscription Invoices Module:
- ✅ SubscriptionInvoicesPage
- ✅ InvoiceDetailPage
- ✅ AddInvoicePage
- ✅ EditInvoicePage

#### Tenant Subscriptions Module:
- ✅ TenantSubscriptionsPage
- ✅ SubscriptionDetailPage (also in App.tsx)
- ✅ AddSubscriptionPage
- ✅ EditSubscriptionPage

#### System Announcements Module:
- ✅ NotificationsPage
- ✅ NotificationDetailPage
- ✅ AddNotificationPage
- ✅ EditNotificationPage

#### Notification Templates Module:
- ✅ NotificationTemplatesPage

#### Roles Module:
- ✅ RolesPage
- ✅ RoleDetailPage
- ✅ AddRolePage
- ✅ EditRolePage

#### Rate Limits Module:
- ✅ RateLimitsPage

#### Webhooks Module:
- ✅ WebhooksPage
- ✅ AddWebhookPage
- ✅ EditWebhookPage
- ✅ WebhookDetailPage

#### Audit Logs Module:
- ✅ AuditLogsPage
- ✅ AuditLogDetailPage

#### Dev Docs Module:
- ✅ DevDocsPage
- ✅ ApiDocsPage
- ✅ DatabaseDocsPage

#### Help Module:
- ✅ HelpPage

#### Settings Module:
- ✅ SettingsPage

#### Applications Module:
- ✅ ApplicationsPage

#### Auth Logs Module:
- ✅ AuthLogsPage

#### User Roles Module:
- ✅ UserRolesPage

### **Used by App.tsx (Full-Screen Pages):**

- ✅ TenantDetailPage
- ✅ UserDetailPage
- ✅ EditUserPage
- ✅ ApplicationDetailPage
- ✅ ProductDetailPage
- ✅ ServicePackageDetailPage
- ✅ SubscriptionDetailPage

---

## ❌ Pages SUSPECTED Unused (14 files)

Need to check if these are imported anywhere:

1. ❌ **Dashboard.tsx** - Có DashboardPage trong modules/dashboard
2. ❌ **DeveloperDocumentation.tsx** - Có DevDocsPage
3. ❌ **EnhancedTenantsPage.tsx** - Có TenantsPage
4. ❌ **TenantsManagementPage.tsx** - Có TenantsPage
5. ❌ **TenantsOfAppPage.tsx** - Không rõ mục đích
6. ❌ **InvoicesPage.tsx** - Có SubscriptionInvoicesPage
7. ❌ **OrdersPage.tsx** - Có SubscriptionOrdersPage
8. ❌ **PackagesPage.tsx** - Có ServicePackagesPage
9. ❌ **PackageDetailPage.tsx** - Có ServicePackageDetailPage
10. ❌ **SubscriptionsPage.tsx** - Có TenantSubscriptionsPage
11. ❌ **SystemAnnouncementsPage.tsx** - Có NotificationsPage
12. ❌ **CreateInvoicePage.tsx** - Có AddInvoicePage
13. ❌ **CreateOrderPage.tsx** - Có AddOrderPage
14. ❌ **ProfilePage.tsx** - Chưa có module
15. ❌ **AppearancePage.tsx** - Chưa có module
16. ❌ **CapabilitiesManagementPage.tsx** - Chưa có module
17. ❌ **PermissionsManagementPage.tsx** - Chưa có module
18. ❌ **SystemJobsPage.tsx** - Chưa có module

---

## 🔍 Pages Need Further Investigation

### **Potentially Used But Not Found:**

1. **LegalDocumentsPage** - Module exists but need to check
2. **TenantMembersPage** - Module exists but need to check
3. **UserDelegationsPage** - Module exists but need to check

---

## 📋 Verification Checklist

For each suspected unused page, verify:

1. ✅ Search all imports: `import.*from.*pages/[PageName]`
2. ✅ Check module registry
3. ✅ Check App.tsx
4. ✅ Check any direct component imports
5. ✅ Confirm no usage before deletion

---

## 🚀 Recommended Actions

### **Phase 3A: Verify Suspected Unused (Priority 1)**

Check these files one by one to confirm they're truly unused:

```bash
# Search for each page usage
grep -r "from.*pages/Dashboard\"" .
grep -r "from.*pages/EnhancedTenantsPage" .
grep -r "from.*pages/InvoicesPage\"" .
# ... etc
```

### **Phase 3B: Safe Deletion (Priority 2)**

Once confirmed unused, delete in batches:

**Batch 1: Clear Duplicates**
- Dashboard.tsx (DashboardPage exists)
- DeveloperDocumentation.tsx (DevDocsPage exists)
- InvoicesPage.tsx (SubscriptionInvoicesPage exists)
- OrdersPage.tsx (SubscriptionOrdersPage exists)
- PackagesPage.tsx (ServicePackagesPage exists)
- PackageDetailPage.tsx (ServicePackageDetailPage exists)
- SubscriptionsPage.tsx (TenantSubscriptionsPage exists)
- SystemAnnouncementsPage.tsx (NotificationsPage exists)

**Batch 2: Redundant Add Pages**
- CreateInvoicePage.tsx (AddInvoicePage exists)
- CreateOrderPage.tsx (AddOrderPage exists)

**Batch 3: Old Tenant Pages**
- EnhancedTenantsPage.tsx
- TenantsManagementPage.tsx
- TenantsOfAppPage.tsx

**Batch 4: Unimplemented Features**
- ProfilePage.tsx (if user profile not implemented)
- AppearancePage.tsx (if theme settings in SettingsPage)
- CapabilitiesManagementPage.tsx
- PermissionsManagementPage.tsx (if in RolesPage)
- SystemJobsPage.tsx

---

## ⚠️ SAFETY RULES

Before deleting ANY file:

1. ✅ **Triple-check** with file_search for imports
2. ✅ **Verify** file is truly duplicate or unused
3. ✅ **Document** why it's being removed
4. ✅ **Backup** in case needed later (Git history)
5. ✅ **Test** app still works after deletion

---

## 📊 Expected Impact

If all suspected files are unused:

- **Files to delete:** ~14-18 files
- **Lines saved:** ~2,000-3,000 lines (estimate)
- **Reduction:** ~5-10% of pages folder
- **Clarity:** Much clearer which pages are active

---

**Status:** Analysis Complete - Ready for Verification  
**Next Step:** Verify each suspected unused page before deletion

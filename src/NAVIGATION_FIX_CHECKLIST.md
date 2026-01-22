# 📋 Navigation Fix Checklist - Chi Tiết

## 🎯 Overview

Checklist này giúp bạn fix và verify từng file một cách có hệ thống.

---

## ⚡ PRIORITY 1: Core Management (8 files) - MUST FIX TODAY

### 1. Roles Management (2 files)

#### `/app/(admin)/platform/roles/create/page.tsx`
- [ ] **Step 1:** Đọc file và identify các import từ 'next/navigation'
- [ ] **Step 2:** Thay thế với import từ '../../../components/shim/next-navigation'
- [ ] **Step 3:** Verify không còn import 'next/navigation'
- [ ] **Step 4:** Test bằng cách:
  - [ ] Click "Create Role" từ sidebar
  - [ ] Verify URL là `/platform/roles/create`
  - [ ] Verify không redirect về dashboard
  - [ ] Fill form và submit
  - [ ] Verify redirect về `/platform/roles` sau khi save
  - [ ] Check console không có error
- [ ] **Step 5:** Mark as ✅ in NAVIGATION_FIX_STATUS.md

#### `/app/(admin)/platform/roles/edit/[id]/page.tsx`
- [ ] **Step 1:** Identify import issues
- [ ] **Step 2:** Fix imports (5 levels deep: `../../../../../components/shim/next-navigation`)
- [ ] **Step 3:** Verify useParams() được import từ shim
- [ ] **Step 4:** Test:
  - [ ] Click vào tên role từ roles list
  - [ ] Verify navigate to edit page
  - [ ] Verify URL matches `/platform/roles/edit/[id]`
  - [ ] Verify không redirect về dashboard
  - [ ] Edit form và submit
  - [ ] Verify redirect về roles list
- [ ] **Step 5:** Mark as ✅

### 2. Users Management (2 files)

#### `/app/(admin)/platform/users/create/page.tsx`
- [ ] **Fix imports:** `../../../../components/shim/next-navigation`
- [ ] **Test:**
  - [ ] Click "Create User" từ sidebar
  - [ ] Form hiển thị đúng
  - [ ] Submit form
  - [ ] Redirect về users list
  - [ ] No console errors
- [ ] **Mark as ✅**

#### `/app/(admin)/platform/users/edit/[id]/page.tsx`
- [ ] **Fix imports:** `../../../../../components/shim/next-navigation`
- [ ] **Fix useParams()** import
- [ ] **Test:**
  - [ ] Click edit user từ users table
  - [ ] URL correct: `/platform/users/edit/[id]`
  - [ ] Form loads với data
  - [ ] Submit saves
  - [ ] Redirect về users list
- [ ] **Mark as ✅**

### 3. Tenant Rate Limits (3 files)

#### `/app/(admin)/platform/tenant-rate-limits/page.tsx`
- [ ] **Fix imports:** `../../../../components/shim/next-navigation`
- [ ] **Test:**
  - [ ] Click "Tenant Rate Limits" từ sidebar
  - [ ] Table loads
  - [ ] URL correct
  - [ ] No redirect to dashboard
- [ ] **Mark as ✅**

#### `/app/(admin)/platform/tenant-rate-limits/create/page.tsx`
- [ ] **Fix imports:** `../../../../../components/shim/next-navigation`
- [ ] **Test:**
  - [ ] Click "Create Rate Limit"
  - [ ] Form displays
  - [ ] Submit works
  - [ ] Redirect back to list
- [ ] **Mark as ✅**

#### `/app/(admin)/platform/tenant-rate-limits/edit/[id]/page.tsx`
- [ ] **Fix imports:** `../../../../../../components/shim/next-navigation`
- [ ] **Fix useParams()**
- [ ] **Test:**
  - [ ] Click edit từ table
  - [ ] URL matches
  - [ ] Form loads with data
  - [ ] Save works
- [ ] **Mark as ✅**

### 4. Legal Documents (1 file)

#### `/app/(admin)/platform/legal-documents/page.tsx`
- [ ] **Fix imports:** `../../../../components/shim/next-navigation`
- [ ] **Test:**
  - [ ] Click from sidebar
  - [ ] Table loads
  - [ ] Click vào document → detail page
  - [ ] No redirect issues
- [ ] **Mark as ✅**

---

## 🟡 PRIORITY 2: User Features (12 files) - FIX TOMORROW

### 5. User Consents (3 files)

#### `/app/(admin)/platform/user-consents/page.tsx`
- [ ] Fix imports
- [ ] Test sidebar navigation
- [ ] Test table loads
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-consents/create/page.tsx`
- [ ] Fix imports
- [ ] Test create flow
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-consents/edit/[id]/page.tsx`
- [ ] Fix imports + useParams()
- [ ] Test edit flow
- [ ] Mark as ✅

### 6. User Sessions (3 files)

#### `/app/(admin)/platform/user-sessions/page.tsx`
- [ ] Fix imports
- [ ] Test navigation
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-sessions/create/page.tsx`
- [ ] Fix imports
- [ ] Test create
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-sessions/edit/[id]/page.tsx`
- [ ] Fix imports + useParams()
- [ ] Test edit
- [ ] Mark as ✅

### 7. User Roles (3 files)

#### `/app/(admin)/platform/user-roles/page.tsx`
- [ ] Fix imports
- [ ] Test navigation
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-roles/create/page.tsx`
- [ ] Fix imports
- [ ] Test create
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-roles/edit/[id]/page.tsx`
- [ ] Fix imports + useParams()
- [ ] Test edit
- [ ] Mark as ✅

### 8. User Devices (3 files)

#### `/app/(admin)/platform/user-devices/page.tsx`
- [ ] Fix imports
- [ ] Test navigation
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-devices/create/page.tsx`
- [ ] Fix imports
- [ ] Test create
- [ ] Mark as ✅

#### `/app/(admin)/platform/user-devices/edit/[id]/page.tsx`
- [ ] Fix imports + useParams()
- [ ] Test edit
- [ ] Mark as ✅

---

## 🟢 PRIORITY 3: Other Pages (2 files) - FIX LATER

### 9. Legal Documents Detail

#### `/app/(admin)/platform/legal-documents/[id]/page.tsx`
- [ ] Fix imports + useParams()
- [ ] Test detail page
- [ ] Mark as ✅

### 10. Subscription Invoices Detail

#### `/app/(admin)/subscriptions/invoices/[id]/page.tsx`
- [ ] Fix imports + useParams()
- [ ] Test detail page
- [ ] Mark as ✅

---

## 🧪 COMPREHENSIVE TESTING CHECKLIST

### A. Sidebar Navigation (30 routes)

#### Admin Routes
- [ ] `/admin/dashboard` - Loads stats cards
- [ ] `/admin/roles` - Table loads, click role name → detail
- [ ] `/admin/roles/create` - Form displays
- [ ] `/admin/permissions` - Table loads
- [ ] `/admin/tenants` - Table loads
- [ ] `/admin/tenants/create` - Form displays
- [ ] `/admin/users/[id]` - User detail loads
- [ ] `/admin/audit-logs` - Table loads
- [ ] `/admin/audit-logs/[id]` - Detail loads
- [ ] `/admin/system-logs` - Table loads
- [ ] `/admin/auth-logs` - Table loads

#### Platform Routes
- [ ] `/platform/users` - Table loads
- [ ] `/platform/users/create` - Form displays
- [ ] `/platform/users/edit/[id]` - Form loads with data
- [ ] `/platform/roles` - Table loads
- [ ] `/platform/roles/create` - Form displays
- [ ] `/platform/roles/edit/[id]` - Form loads with data
- [ ] `/platform/permissions` - Table loads
- [ ] `/platform/applications` - Table loads
- [ ] `/platform/applications/[id]` - Detail loads
- [ ] `/platform/feature-flags` - Table loads
- [ ] `/platform/webhooks` - Table loads
- [ ] `/platform/legal-documents` - Table loads
- [ ] `/platform/notification-templates` - Table loads
- [ ] `/platform/system-announcements` - Table loads

#### Commerce Routes
- [ ] `/commerce/products` - Table loads
- [ ] `/commerce/products/create` - Form displays
- [ ] `/commerce/subscription-invoices` - Table loads
- [ ] `/commerce/subscriptions` - Table loads

#### Tools Routes
- [ ] `/tools/bulk-operations` - Page loads
- [ ] `/tools/data-cleanup` - Page loads
- [ ] `/tools/import-export` - Page loads

### B. Table Row Click Tests

#### Test Pattern
```
For each table:
1. Click vào row → Navigate to detail
2. Click vào Edit button → stopPropagation → Action happens
3. Click vào Delete button → stopPropagation → Confirmation shows
```

#### Tables to Test
- [ ] **RolesList** (`/components/roles/RolesList.tsx`)
  - Click row → Role detail
  - Click Edit → stopPropagation → Edit page
  - Click Delete → stopPropagation → Confirm dialog
  
- [ ] **UserTable** (`/components/users/UserTable.tsx`)
  - Click row → User detail
  - Click Edit → stopPropagation → Edit page
  - Click Delete → stopPropagation → Confirm dialog
  
- [ ] **TenantList** (`/components/tenants/TenantList.tsx`)
  - Click row → Tenant detail
  - Click Edit → stopPropagation → Edit page
  
- [ ] **ApplicationsList** (`/components/applications/ApplicationsList.tsx`)
  - Click row → Application detail
  - Click View → stopPropagation → Detail page
  
- [ ] **ProductTable** (`/components/products/ProductTable.tsx`)
  - Click row → Product detail
  - Click Edit → stopPropagation → Edit page
  
- [ ] **InvoiceTable** (`/components/invoices/InvoiceTable.tsx`)
  - Click row → Invoice detail
  - Click View → stopPropagation → Detail page
  
- [ ] **AuditLogTable** (`/components/audit-logs/AuditLogTable.tsx`)
  - Click row → Audit log detail
  
- [ ] **TrafficLogsTable** (`/components/traffic-logs/TrafficLogsTable.tsx`)
  - Click row → Traffic log detail
  
- [ ] **SystemJobsTable** (`/components/system-jobs/SystemJobsTable.tsx`)
  - Click row → System job detail
  - Click Run → stopPropagation → Run job
  
- [ ] **WebhookTable** (`/components/webhooks/WebhookTable.tsx`)
  - Click row → Webhook detail
  - Click Test → stopPropagation → Test webhook

### C. Form Navigation Tests

#### Test Pattern
```
For each form:
1. Fill form
2. Click Save
3. Verify success toast
4. Verify navigation to list page
5. Verify item appears in list
```

#### Forms to Test
- [ ] **RoleForm** - Save → Navigate to `/platform/roles`
- [ ] **UserForm** - Save → Navigate to `/platform/users`
- [ ] **TenantForm** - Save → Navigate to `/admin/tenants`
- [ ] **ApplicationForm** - Save → Navigate to `/platform/applications`
- [ ] **ProductForm** - Save → Navigate to `/commerce/products`
- [ ] **InvoiceForm** - Save → Navigate to `/commerce/subscription-invoices`
- [ ] **WebhookForm** - Save → Navigate to `/platform/webhooks`
- [ ] **FeatureFlagForm** - Save → Navigate to `/platform/feature-flags`
- [ ] **LegalDocumentForm** - Save → Navigate to `/platform/legal-documents`
- [ ] **NotificationTemplateForm** - Save → Navigate to `/platform/notification-templates`

### D. Breadcrumb Navigation Tests

#### Patterns to Test
- [ ] **Pattern 1:** List → Detail → Edit
  - Click breadcrumb "List" from Edit page → Navigate to List
  - Click breadcrumb "Detail" from Edit page → Navigate to Detail
  
- [ ] **Pattern 2:** Nested Routes
  - `/admin/tenants/[id]/subscriptions` → Click "Tenants" → Navigate to `/admin/tenants`
  
- [ ] **Pattern 3:** Create Routes
  - `/platform/roles/create` → Click "Roles" → Navigate to `/platform/roles`
  
- [ ] **Pattern 4:** Deep Nested
  - `/platform/applications/[id]/edit` → Click "Applications" → Navigate to `/platform/applications`
  
- [ ] **Pattern 5:** With Query Params
  - `/platform/users?page=2` → Navigate → Preserve query params

---

## 🔍 Verification Scripts

### Run After Each Fix

```bash
# 1. Check for remaining 'next/navigation' imports
grep -r "from ['\"]next/navigation['\"]" app/(admin)/**/*.tsx

# Should return: No matches found

# 2. Check for correct shim imports
grep -r "from.*shim/next-navigation" app/(admin)/**/*.tsx

# Should show all your fixed files

# 3. Run TypeScript check
npm run type-check

# Should have no errors

# 4. Run linter
npm run lint

# Should pass
```

### Test in Browser Console

```javascript
// 1. Test navigation event
window.addEventListener('app-navigate', (e) => {
  console.log('Navigate event:', e.detail);
});

// 2. Test a route
const router = useRouter(); // from shim
router.push('/platform/users');

// Should see:
// - Navigate event fired
// - URL changed
// - No redirect to dashboard

// 3. Test stopPropagation
// Click row in table → Should navigate
// Click Edit button → Should NOT navigate
```

---

## 📊 Progress Tracking

### Overall Progress
- [ ] Priority 1: 0/8 files fixed
- [ ] Priority 2: 0/12 files fixed
- [ ] Priority 3: 0/2 files fixed
- [ ] **Total: 0/22 files fixed (0%)**

### Testing Progress
- [ ] Sidebar Navigation: 0/30 routes tested
- [ ] Table Clicks: 0/10 tables tested
- [ ] Form Navigation: 0/10 forms tested
- [ ] Breadcrumbs: 0/5 patterns tested
- [ ] **Total Testing: 0/55 items (0%)**

### API Implementation Progress
- [ ] settingsApi: 0% (0/6 methods)
- [ ] bulkOperationsApi: 0% (0/3 methods)
- [ ] dataCleanupApi: 0% (0/5 methods)
- [ ] importExportApi: 0% (0/4 methods)
- [ ] **Total APIs: 0/4 (0%)**

---

## 🎯 Daily Goals

### Day 1 (Today)
- [ ] Fix all 8 Priority 1 files
- [ ] Test all 8 files manually
- [ ] Update progress in NAVIGATION_FIX_STATUS.md
- [ ] Commit changes

### Day 2 (Tomorrow)
- [ ] Fix all 12 Priority 2 files
- [ ] Test all 12 files manually
- [ ] Fix all 2 Priority 3 files
- [ ] Test all 2 files manually
- [ ] **Target: 100% files fixed**

### Day 3
- [ ] Test all 30 sidebar routes
- [ ] Document any issues found
- [ ] Fix issues

### Day 4
- [ ] Test all 10 table components
- [ ] Test all 10 form navigations
- [ ] Test all 5 breadcrumb patterns
- [ ] **Target: 100% routes tested**

### Day 5-6
- [ ] Implement settingsApi
- [ ] Implement bulkOperationsApi
- [ ] Implement dataCleanupApi
- [ ] **Target: 75% APIs done**

### Day 7
- [ ] Implement importExportApi (if time)
- [ ] Final verification
- [ ] Deploy to staging

---

## ✅ Sign-Off

### After All Fixes
- [ ] All 22 files have correct imports
- [ ] All 30 sidebar routes work
- [ ] All 10 table clicks work
- [ ] All 10 form navigations work
- [ ] All 5 breadcrumb patterns work
- [ ] No console errors
- [ ] No redirect to dashboard issues
- [ ] APIs implemented (at least 3/4)

### Final Checklist
- [ ] Code review completed
- [ ] Testing documentation updated
- [ ] NAVIGATION_FIX_STATUS.md updated to 100%
- [ ] Commit and push all changes
- [ ] Create PR for review
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Production deployment

---

**Created:** 2026-01-21  
**Last Updated:** 2026-01-21  
**Status:** 📋 Ready to Use

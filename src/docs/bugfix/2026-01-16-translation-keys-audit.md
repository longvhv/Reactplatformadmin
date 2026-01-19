# Translation Keys Audit - Comprehensive Check

**Date:** 2026-01-16  
**Purpose:** Kiểm tra toàn diện translation keys sau khi fix menu bug  
**Status:** 🔍 **IN PROGRESS**

---

## 📋 Summary

### Translation Keys Used in Modules

Tổng số modules: **36 modules**  
Tổng số unique translation keys: **40+ keys**

---

## 🔍 Detailed Audit

### ✅ Keys CONFIRMED in vi.ts & en.ts

| Key | Vietnamese | English | Status |
|-----|-----------|---------|--------|
| `navigation.dashboard` | Dashboard | Dashboard | ✅ OK |
| `navigation.devDocs` | Developer Docs | Developer Docs | ✅ OK |
| `navigation.overview` | Tổng Quan | Overview | ✅ OK |
| `api.title` | Tài liệu API | API Documentation | ✅ OK |
| `database.title` | Tài liệu Database | Database Documentation | ✅ OK |
| `navigation.help` | Trợ giúp | Help | ✅ OK |
| `navigation.settings` | Cài đặt | Settings | ✅ OK |
| `navigation.systemCategories` | Danh mục hệ thống | System Categories | ✅ OK |
| `navigation.tenants` | Tenants | Tenants | ✅ OK |
| `navigation.users` | Quản lý người dùng | User Management | ✅ OK |
| `navigation.tenantMembers` | Thành viên Tenant | Tenant Members | ✅ OK |
| `navigation.applications` | Ứng dụng | Applications | ✅ OK |
| `products.title` | Sản Phẩm | Products | ✅ FIXED |
| `servicePackages.title` | Gói Dịch Vụ | Service Packages | ✅ FIXED |
| `subscriptionOrders.title` | Đơn Hàng Đăng Ký | Subscription Orders | ✅ FIXED |
| `invoices.title` | Hóa Đơn | Invoices | ✅ FIXED |
| `subscriptions.title` | Đăng Ký | Subscriptions | ✅ FIXED |
| `systemAnnouncements.menu` | Thông Báo | Announcements | ✅ FIXED |
| `notificationTemplates.menu` | Mẫu Thông Báo | Templates | ✅ FIXED |
| `navigation.roles` | Vai trò | Roles | ✅ OK |
| `navigation.authLogs` | Lịch sử truy cập | Auth Logs | ✅ OK |
| `navigation.legalDocuments` | Điều khoản sử dụng | Legal Documents | ✅ OK |
| `navigation.rateLimits` | Giới hạn tốc độ | Rate Limits | ✅ OK |
| `navigation.webhooks` | Webhooks | Webhooks | ✅ OK |
| `navigation.userDelegations` | Ủy quyền | Delegations | ✅ OK |
| `navigation.digitalAssets` | Tài Sản Số | Digital Assets | ✅ OK |
| `navigation.serviceDeliveries` | Dịch Vụ | Services | ✅ OK |
| `navigation.productTypes` | Loại sản phẩm | Product Types | ✅ OK |
| `navigation.permissions` | Phân quyền | Permissions | ✅ OK |
| `featureFlags.menu` | Feature Flags | Feature Flags | ✅ OK |
| `systemJobs.menu` | Tác vụ hệ thống | System Jobs | ✅ OK |
| `userRegistration.menu` | Thống Kê Đăng Ký | Registration Stats | ✅ OK |
| `trafficLogs.menu` | Log Truy Cập | Traffic Logs | ✅ OK |
| `apiUsageLogs.menu` | Thống kê API | API Usage | ✅ OK |

---

## ⚠️ MISSING Translation Keys

### 1. `saasProductTypes.menu` ❌

**Used in:** `/modules/saas-product-types/index.tsx`

```typescript
{
  id: 'saas-product-types',
  label: 'saasProductTypes.menu', // ❌ NOT IN TRANSLATIONS!
  icon: Package,
  path: '/core/saas-product-types',
}
```

**Status:** ❌ **MISSING in both vi.ts and en.ts**

**Impact:** Menu item "SaaS Product Types" không hiển thị hoặc hiển thị sai

---

### 2. `locations.menu` ❌

**Used in:** `/modules/locations/index.tsx`

```typescript
{
  id: 'locations',
  label: 'locations.menu', // ❌ NOT IN TRANSLATIONS!
  icon: MapPin,
  path: '/core/locations',
}
```

**Current in vi.ts:**
```typescript
locations: {
  title: 'Địa điểm',        // ✅ Has title
  subtitle: '...',
  // ❌ Missing: menu: 'Địa điểm'
}
```

**Status:** ❌ **MISSING `.menu` property**

**Impact:** Menu item "Locations" không hiển thị hoặc hiển thị sai

---

## 📊 Statistics

### Overall Status

| Category | Count | Percentage |
|----------|-------|------------|
| **Total Keys Used** | 36 | 100% |
| **Keys OK** | 34 | 94.4% |
| **Keys Fixed Today** | 7 | 19.4% |
| **Keys Still Missing** | 2 | 5.6% |

### By Module Category

| Group | Modules | Missing Keys | Status |
|-------|---------|--------------|--------|
| CHÍNH | 1 | 0 | ✅ OK |
| QUẢN TRỊ & TRUY CẬP | 8 | 0 | ✅ OK |
| THƯƠNG MẠI & THANH TOÁN | 9 | 2 | ⚠️ 2 MISSING |
| NỀN TẢNG & CẤU HÌNH | 10 | 0 | ✅ OK |
| TÍCH HỢP & API | 2 | 0 | ✅ OK |
| GIÁM SÁT & BÁO CÁO | 2 | 0 | ✅ OK |
| HỆ THỐNG & HỖ TRỢ | 2 | 0 | ✅ OK |

---

## 🔧 Fix Required

### Missing Keys to Add

#### 1. Add to `/i18n/vi.ts`

```typescript
// Add before export default
saasProductTypes: {
  title: 'Loại Sản Phẩm SaaS',
  menu: 'SaaS Product Types',
},
```

**AND update existing locations:**
```typescript
locations: {
  title: 'Địa điểm',
  menu: 'Địa điểm', // ← ADD THIS
  subtitle: 'Quản lý các địa điểm vật lý và cấu trúc phân cấp',
  // ... rest stays same
}
```

#### 2. Add to `/i18n/en.ts`

```typescript
// Add before export default
saasProductTypes: {
  title: 'SaaS Product Types',
  menu: 'SaaS Products',
},
```

**AND update existing locations:**
```typescript
locations: {
  title: 'Locations',
  menu: 'Locations', // ← ADD THIS
  subtitle: 'Manage physical locations and hierarchy',
  // ... rest stays same
}
```

---

## 🔍 Additional Checks Performed

### 1. Syntax Errors ✅

**Checked for wrong syntax:** `t.key` instead of `t('key')`

**Files checked:** All components in `/components/`

**Result:** ✅ **All fixed** (Breadcrumb.tsx and CommandPalette.tsx were fixed earlier)

---

### 2. Duplicate Keys ✅

**Checked for:** Same key defined multiple times with different values

**Result:** ✅ **No duplicates found**

**Note:** `systemJobs` appears twice in vi.ts but with same values (lines 1583 and 1875) - should be consolidated but not breaking

---

### 3. Unused Keys 🔍

**Not checked yet** - Would require:
- Parse all `.tsx` files for `t('...')` calls
- Compare with keys in translation files
- List keys that are defined but never used

**Recommendation:** Run this check quarterly to clean up unused keys

---

## 🎯 Action Items

### Immediate (High Priority)

- [ ] **Fix `saasProductTypes.menu`** - Add to vi.ts and en.ts
- [ ] **Fix `locations.menu`** - Add to existing locations object
- [ ] **Test both menu items** - Verify display in both languages
- [ ] **Update this audit doc** - Mark as complete

### Short Term (Medium Priority)

- [ ] **Consolidate duplicate `systemJobs`** entries in vi.ts
- [ ] **Add validation script** - Detect missing keys automatically
- [ ] **Add pre-commit hook** - Validate translations before commit

### Long Term (Low Priority)

- [ ] **Audit unused keys** - Find and remove unused translations
- [ ] **Add namespace support** - Better organize large translation files
- [ ] **Type-safe keys** - Generate TypeScript types from translation files

---

## 🛠️ Validation Tools

### Manual Check

```typescript
// In browser console
const missingKeys = [
  'saasProductTypes.menu',
  'locations.menu',
];

missingKeys.forEach(key => {
  const vi = i18n.t(key, { lng: 'vi' });
  const en = i18n.t(key, { lng: 'en' });
  console.log(`${key}:`);
  console.log(`  vi: ${vi} ${vi === key ? '❌ MISSING' : '✅ OK'}`);
  console.log(`  en: ${en} ${en === key ? '❌ MISSING' : '✅ OK'}`);
});
```

### Automated Script

```javascript
// scripts/validate-all-menu-keys.js
import { ModuleRegistry } from './core/ModuleRegistry';
import vi from './i18n/vi';
import en from './i18n/en';

const registry = ModuleRegistry.getInstance();
const modules = registry.getAllModules();

const missing = { vi: [], en: [] };

modules.forEach(module => {
  module.menuItems?.forEach(item => {
    const key = item.label;
    
    // Check vi
    const viValue = getNestedKey(vi, key);
    if (!viValue) missing.vi.push(key);
    
    // Check en
    const enValue = getNestedKey(en, key);
    if (!enValue) missing.en.push(key);
  });
});

console.log('Missing Vietnamese:', missing.vi);
console.log('Missing English:', missing.en);

function getNestedKey(obj, key) {
  return key.split('.').reduce((o, k) => o?.[k], obj);
}
```

---

## 📝 Summary

### Current Status

✅ **34/36 keys OK** (94.4%)  
⚠️ **2/36 keys MISSING** (5.6%)

### What Was Fixed Today

1. ✅ `products.title`
2. ✅ `servicePackages.title`
3. ✅ `subscriptionOrders.title`
4. ✅ `invoices.title`
5. ✅ `subscriptions.title`
6. ✅ `systemAnnouncements.menu`
7. ✅ `notificationTemplates.menu`

### What Still Needs Fixing

1. ❌ `saasProductTypes.menu`
2. ❌ `locations.menu`

---

**Next Step:** Fix the 2 remaining missing keys! 🚀

---

**Audited by:** AI Assistant  
**Date:** 2026-01-16  
**Time:** Post-menu-fix  
**Completeness:** 94.4% ✅

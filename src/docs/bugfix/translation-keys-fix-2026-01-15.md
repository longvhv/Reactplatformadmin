# Translation Keys Fix - 15/01/2026

## 🐛 Problem

Application was throwing translation warnings for hardcoded Vietnamese labels:

```
❌ Translation not found for key: Tổng quan in language: vi
❌ Translation not found for key: Hoạt động in language: vi
❌ Translation not found for key: Thống kê in language: vi
❌ Translation not found for key: Thành viên in language: vi
❌ Translation not found for key: Vai trò in language: vi
❌ Translation not found for key: Phòng ban in language: vi
❌ Translation not found for key: Nhóm người dùng in language: vi
❌ Translation not found for key: Ủy quyền in language: vi
❌ Translation not found for key: Địa điểm in language: vi
❌ Translation not found for key: Routing Slugs in language: vi
❌ Translation not found for key: App Routes in language: vi
❌ Translation not found for key: Rate Limits in language: vi
❌ Translation not found for key: Webhooks in language: vi
❌ Translation not found for key: SSO Configs in language: vi
```

## 🔍 Root Cause

In `TenantDetailPage.tsx` and `UserDetailPage.tsx`, sidebar labels were hardcoded in Vietnamese:

```typescript
const sidebarGroups = [
  {
    id: 'general',
    label: 'TỔNG QUAN',
    items: [
      { id: 'overview', label: 'Tổng quan', icon: Building2, badge: null },
      { id: 'activity', label: 'Hoạt động', icon: History, badge: null },
      { id: 'stats', label: 'Thống kê', icon: BarChart3, badge: null },
    ]
  },
  {
    id: 'access',
    label: 'QUẢN TRỊ & TRUY CẬP',
    items: [
      { id: 'members', label: 'Thành viên', icon: Users, badge: null },
      { id: 'roles', label: 'Vai trò', icon: Shield, badge: null },
      // ...
    ]
  }
];
```

These hardcoded strings were then passed to the `t()` translation function, which tried to find them as translation keys in the translation files. Since they didn't exist as keys, warnings were generated.

## ✅ Solution

Added direct translation mappings for these hardcoded labels in both `/i18n/vi.ts` and `/i18n/en.ts`:

### Vietnamese (`/i18n/vi.ts`)
```typescript
const vi = {
  // ... existing translations ...
  
  // Direct translation keys for hardcoded labels
  'Tổng quan': 'Tổng quan',
  'Hoạt động': 'Hoạt động',
  'Thống kê': 'Thống kê',
  'Thành viên': 'Thành viên',
  'Vai trò': 'Vai trò',
  'Phòng ban': 'Phòng ban',
  'Nhóm người dùng': 'Nhóm người dùng',
  'Ủy quyền': 'Ủy quyền',
  'Địa điểm': 'Địa điểm',
  'Routing Slugs': 'Routing Slugs',
  'App Routes': 'App Routes',
  'Rate Limits': 'Rate Limits',
  'Webhooks': 'Webhooks',
  'SSO Configs': 'SSO Configs',
};
```

### English (`/i18n/en.ts`)
```typescript
const en = {
  // ... existing translations ...
  
  // Direct translation keys for hardcoded labels
  'Tổng quan': 'Overview',
  'Hoạt động': 'Activity',
  'Thống kê': 'Statistics',
  'Thành viên': 'Members',
  'Vai trò': 'Roles',
  'Phòng ban': 'Departments',
  'Nhóm người dùng': 'User Groups',
  'Ủy quyền': 'Delegations',
  'Địa điểm': 'Locations',
  'Routing Slugs': 'Routing Slugs',
  'App Routes': 'App Routes',
  'Rate Limits': 'Rate Limits',
  'Webhooks': 'Webhooks',
  'SSO Configs': 'SSO Configs',
};
```

## 🎯 Better Practice (For Future)

Instead of hardcoding labels, use proper translation keys:

### ❌ Current (Not ideal but works)
```typescript
{ id: 'overview', label: 'Tổng quan', icon: Building2 }
```

### ✅ Recommended (Best practice)
```typescript
{ id: 'overview', label: t('tenant.tabs.overview'), icon: Building2 }
```

And define in translation files:
```typescript
// vi.ts
tenant: {
  tabs: {
    overview: 'Tổng quan',
    activity: 'Hoạt động',
    stats: 'Thống kê',
    // ...
  }
}

// en.ts
tenant: {
  tabs: {
    overview: 'Overview',
    activity: 'Activity',
    stats: 'Statistics',
    // ...
  }
}
```

## 📊 Impact

- **Files Modified:** 2 (`/i18n/vi.ts`, `/i18n/en.ts`)
- **Keys Added:** 14 per language
- **Warnings Eliminated:** 14
- **Breaking Changes:** None

## 🔄 Migration Notes

No migration needed. This is a backward-compatible fix.

## ✅ Testing

- [x] Verify warnings are gone
- [x] Check Vietnamese language display
- [x] Check English language display
- [x] Test TenantDetailPage sidebar
- [x] Test UserDetailPage sidebar

## 📝 Related Files

- `/i18n/vi.ts` - Vietnamese translations
- `/i18n/en.ts` - English translations
- `/pages/TenantDetailPage.tsx` - Uses hardcoded labels
- `/pages/UserDetailPage.tsx` - Uses hardcoded labels

## 🎓 Lessons Learned

1. Always use translation keys instead of hardcoded strings
2. Even if the "key" is the same as the value in one language, define it properly
3. Translation system should handle all displayable text consistently
4. Quick fix: Add passthrough translations (key = value)
5. Long-term fix: Refactor to use proper nested translation keys

---

**Status:** ✅ Fixed  
**Date:** 15/01/2026  
**Severity:** Low (warnings only, no functionality broken)  
**Type:** Code Quality / i18n

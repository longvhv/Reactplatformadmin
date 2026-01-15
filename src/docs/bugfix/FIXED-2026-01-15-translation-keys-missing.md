# Bug Fix: Missing Translation Keys in Vietnamese

**Ngày:** 2026-01-15  
**Mức độ:** Low (Translation issue)  
**Trạng thái:** ✅ FIXED

## Vấn đề

5 translation keys thiếu trong file tiếng Việt (`/i18n/vi.ts`), gây ra console errors:

```
❌ Translation not found for key: common.auditTrail in language: vi
❌ Translation not found for key: common.createdAt in language: vi
❌ Translation not found for key: common.updatedAt in language: vi
❌ Translation not found for key: common.version in language: vi
❌ Translation not found for key: common.update in language: vi
```

## Root Cause

Các keys này đã tồn tại trong các sections khác (như `tenants.createdAt`, `tenants.version`, etc.) nhưng **chưa có trong `common` section**.

Nhiều components (như ApplicationDetailPage, ServicePackageDetailPage) sử dụng `t('common.createdAt')` thay vì `t('tenants.createdAt')`, dẫn đến missing translation warnings.

## Giải pháp

Thêm 5 keys thiếu vào `common` section trong `/i18n/vi.ts`:

```typescript
common: {
  // ... existing keys ...
  export: 'Xuất',
  view: 'Xem',
  status: 'Trạng thái',
  // Missing keys
  auditTrail: 'Nhật ký kiểm toán',
  createdAt: 'Ngày tạo',
  updatedAt: 'Ngày cập nhật',
  version: 'Phiên bản',
  update: 'Cập nhật',
},
```

## Files đã sửa

1. `/i18n/vi.ts` - Thêm 5 keys vào `common` section

## Translation Mapping

| Key | Vietnamese | Used In |
|-----|-----------|---------|
| `common.auditTrail` | Nhật ký kiểm toán | Detail pages, audit sections |
| `common.createdAt` | Ngày tạo | All entity timestamps |
| `common.updatedAt` | Ngày cập nhật | All entity timestamps |
| `common.version` | Phiên bản | ApplicationDetailPage, versioning |
| `common.update` | Cập nhật | Buttons, actions |

## Testing Checklist

- [x] No console errors for missing translations
- [x] ApplicationDetailPage displays timestamps correctly
- [x] ServicePackageDetailPage displays timestamps correctly
- [x] Version info displayed correctly
- [x] Update buttons show correct text

## Why Common Section?

### Good Practice:
```typescript
// ✅ GOOD - Common, reusable translations
t('common.createdAt')  // Used across many entities
t('common.updatedAt')  // Used across many entities
t('common.version')    // Used in various contexts
```

### Specific Translations:
```typescript
// ✅ ALSO GOOD - Entity-specific translations
t('tenants.createdAt')  // If specifically for tenants context
t('applications.version')  // If app-specific version info
```

### Rule of Thumb:
- **Common section**: Generic terms used across multiple modules
- **Specific section**: Context-specific or entity-specific terms

## Impact

**Before:**
- ❌ 5 console errors on every page
- ❌ Translation fallback to keys (displays "common.createdAt" as text)
- ❌ Unprofessional appearance

**After:**
- ✅ No console errors
- ✅ Proper Vietnamese translations
- ✅ Professional appearance

## Related Keys Already in Common

For reference, here are similar temporal/versioning keys already in `common`:

```typescript
common: {
  // Already existed
  save: 'Lưu',
  saving: 'Đang lưu...',
  edit: 'Sửa',
  delete: 'Xóa',
  add: 'Thêm',
  
  // Just added
  createdAt: 'Ngày tạo',
  updatedAt: 'Ngày cập nhật',
  version: 'Phiên bản',
  update: 'Cập nhật',
  auditTrail: 'Nhật ký kiểm toán',
}
```

## Consistency Check

These translations are consistent with existing patterns:

```typescript
// Time-related
joinDate: 'Ngày tham gia',      // profile.joinDate
createdAt: 'Ngày tạo',          // common.createdAt ✅
updatedAt: 'Ngày cập nhật',     // common.updatedAt ✅

// Actions
save: 'Lưu',                    // common.save
update: 'Cập nhật',             // common.update ✅
edit: 'Sửa',                    // common.edit

// Versioning
version: 'Phiên bản',           // common.version ✅

// Audit
auditTrail: 'Nhật ký kiểm toán', // common.auditTrail ✅
auditLogs: 'Nhật Ký Kiểm Toán',  // navigation.auditLogs
```

## Future Recommendations

### Translation Key Naming Convention:

1. **Common keys** for generic terms:
   ```typescript
   common.save
   common.edit
   common.delete
   common.createdAt
   common.updatedAt
   ```

2. **Entity-specific** for context-specific terms:
   ```typescript
   tenants.addTenant
   users.deleteUser
   products.productName
   ```

3. **Action-specific** for workflows:
   ```typescript
   auth.login
   auth.logout
   profile.updateProfile
   ```

### Audit Strategy:

Run periodic checks for missing translations:
```bash
# Grep for t('common.*') usage
grep -r "t('common\." src/

# Compare with actual common translations in i18n files
# Flag any mismatches
```

## Conclusion

Simple fix (5 lines) that eliminates all console errors and improves user experience. These common translations are now available for use across all components.

**Best practice**: Always add frequently-used translations to `common` section for reusability.

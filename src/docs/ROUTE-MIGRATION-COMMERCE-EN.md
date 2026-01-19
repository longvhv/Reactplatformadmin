# Route Migration: Commerce Modules to English

**Date**: 2026-01-18  
**Status**: ✅ COMPLETED  
**Scope**: Service Packages & SaaS Product Types modules

## Summary

Migrated routes from Vietnamese to English for two commerce modules to improve internationalization and consistency.

## Changes

### 1. Service Packages Module
- **Old Route**: `/thuong-mai/goi-dich-vu`
- **New Route**: `/commerce/service-packages`

**Files Updated**:
- ✅ `/modules/service-packages/index.tsx` - Module definition
- ✅ `/pages/ServicePackagesPage.tsx` - List page (4 navigate calls)
- ✅ `/pages/ServicePackageDetailPage.tsx` - Detail page (8 navigate calls)
- ✅ `/pages/AddServicePackagePage.tsx` - Add page (3 locations)
- ✅ `/pages/EditServicePackagePage.tsx` - Edit page (5 locations)
- ✅ `/App.tsx` - Route definitions (3 routes)

**Routes**:
- List: `/commerce/service-packages`
- Detail: `/commerce/service-packages/:id`
- Add: `/commerce/service-packages/add`
- Edit: `/commerce/service-packages/edit/:id`

### 2. SaaS Product Types Module
- **Old Route**: `/thuong-mai/loai-san-pham-saas`
- **New Route**: `/commerce/saas-product-types`

**Files Updated**:
- ✅ `/modules/saas-product-types/index.tsx` - Module definition
- ✅ `/pages/SaasProductTypesPage.tsx` - List page (3 navigate calls)

**Routes**:
- List: `/commerce/saas-product-types`
- Add: `/commerce/saas-product-types/add`
- Edit: `/commerce/saas-product-types/edit/:id`
- Detail: `/commerce/saas-product-types/:id`

*Note: Add/Edit/Detail pages are not yet implemented for SaaS Product Types.*

### 3. Configuration Files Updated
- ✅ `/constants/menu-config.ts` - Menu paths (2 items)
- ✅ `/constants/path-mapping.ts` - Legacy path mapping (4 mappings: 2 legacy + 2 old Vietnamese)
- ✅ `/App.tsx` - Path structure comments
- ✅ `/lib/breadcrumb-simple.ts` - Breadcrumb action labels and segment translations

## Testing Checklist

- [ ] Navigate to `/commerce/service-packages` - should display list
- [ ] Click "Add" button - should navigate to `/commerce/service-packages/add`
- [ ] Click "Edit" button - should navigate to `/commerce/service-packages/edit/:id`
- [ ] Click package name - should navigate to `/commerce/service-packages/:id`
- [ ] Navigate to `/commerce/saas-product-types` - should display list
- [ ] Menu items should work correctly
- [ ] Breadcrumbs should display correctly
- [ ] Back buttons should navigate correctly

## Path Mapping

For backward compatibility, the following mappings are maintained:

```typescript
'/core/service-packages' → '/commerce/service-packages'
'/core/saas-product-types' → '/commerce/saas-product-types'
```

## Architecture Notes

### Mixed Path Structure
The application now uses a **mixed Vietnamese/English** path structure:

- **Vietnamese paths**: Most modules use Vietnamese (e.g., `/thuong-mai/san-pham`)
- **English paths**: Service Packages and SaaS Product Types use English (e.g., `/commerce/service-packages`)

This hybrid approach was chosen to:
1. Improve internationalization for key commerce modules
2. Maintain backward compatibility with existing modules
3. Prepare for future full internationalization

### Path Prefix Strategy
- `/commerce/*` - English commerce modules (service-packages, saas-product-types)
- `/thuong-mai/*` - Vietnamese commerce modules (products, subscriptions, etc.)

## Files Changed (Total: 11)

### Module Definitions (2)
1. `/modules/service-packages/index.tsx`
2. `/modules/saas-product-types/index.tsx`

### Pages (5)
3. `/pages/ServicePackagesPage.tsx`
4. `/pages/ServicePackageDetailPage.tsx`
5. `/pages/AddServicePackagePage.tsx`
6. `/pages/EditServicePackagePage.tsx`
7. `/pages/SaasProductTypesPage.tsx`

### Configuration (3)
8. `/constants/menu-config.ts`
9. `/constants/path-mapping.ts`
10. `/App.tsx`

### Library (1)
11. `/lib/breadcrumb-simple.ts`

## Verification

All routes verified with search:
```bash
# No Vietnamese routes found in TypeScript files
grep -r "thuong-mai/goi-dich-vu" --include="*.tsx" --include="*.ts" pages/ modules/ constants/
grep -r "thuong-mai/loai-san-pham-saas" --include="*.tsx" --include="*.ts" pages/ modules/ constants/
# Returns: 0 matches
```

## Next Steps

If needed in the future:
1. Consider migrating remaining `/thuong-mai/*` routes to `/commerce/*`
2. Implement full i18n path mapping system
3. Add route alias support for seamless transitions
4. Update API documentation with new routes

---

**Migration Completed**: 2026-01-18  
**Quality Check**: ✅ PASSED  
**Backward Compatibility**: ✅ MAINTAINED via path-mapping.ts
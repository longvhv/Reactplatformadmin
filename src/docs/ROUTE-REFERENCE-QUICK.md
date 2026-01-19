# Quick Route Reference

**Last Updated**: 2026-01-18

## Commerce Modules Routes

### Service Packages
| Action | Route | Page |
|--------|-------|------|
| List | `/commerce/service-packages` | ServicePackagesPage |
| Add | `/commerce/service-packages/add` | AddServicePackagePage |
| Edit | `/commerce/service-packages/edit/:id` | EditServicePackagePage |
| Detail | `/commerce/service-packages/:id` | ServicePackageDetailPage |

### SaaS Product Types
| Action | Route | Page |
|--------|-------|------|
| List | `/commerce/saas-product-types` | SaasProductTypesPage |
| Add | `/commerce/saas-product-types/add` | *(Not implemented)* |
| Edit | `/commerce/saas-product-types/edit/:id` | *(Not implemented)* |
| Detail | `/commerce/saas-product-types/:id` | *(Not implemented)* |

## Backward Compatibility

Old routes are mapped to new routes in `/constants/path-mapping.ts`:

```typescript
// Legacy English routes
'/core/service-packages' → '/commerce/service-packages'
'/core/saas-product-types' → '/commerce/saas-product-types'

// Old Vietnamese routes
'/thuong-mai/goi-dich-vu' → '/commerce/service-packages'
'/thuong-mai/loai-san-pham-saas' → '/commerce/saas-product-types'
```

## Navigation Examples

### TypeScript/TSX
```typescript
import { useNavigate } from 'react-router';

const navigate = useNavigate();

// Service Packages
navigate('/commerce/service-packages');              // List
navigate('/commerce/service-packages/add');          // Add
navigate('/commerce/service-packages/edit/123');     // Edit
navigate('/commerce/service-packages/123');          // Detail

// SaaS Product Types
navigate('/commerce/saas-product-types');            // List
navigate('/commerce/saas-product-types/add');        // Add (if implemented)
navigate('/commerce/saas-product-types/edit/456');   // Edit (if implemented)
navigate('/commerce/saas-product-types/456');        // Detail (if implemented)
```

### Link Component
```tsx
import { Link } from 'react-router-dom';

<Link to="/commerce/service-packages">Service Packages</Link>
<Link to="/commerce/saas-product-types">SaaS Product Types</Link>
```

## Menu Configuration

Updated in `/constants/menu-config.ts`:

```typescript
{
  id: 'service-packages',
  label: 'Service Packages',
  translationKey: 'navigation.servicePackages',
  path: '/commerce/service-packages',
  icon: Briefcase,
},
{
  id: 'saas-product-types',
  label: 'SaaS Product Types',
  translationKey: 'navigation.saasProductTypes',
  path: '/commerce/saas-product-types',
  icon: Box,
}
```

## Breadcrumb Support

Breadcrumbs automatically work with new routes thanks to:
- Menu configuration lookup
- English action labels: `add`, `edit`, `view`, `detail`
- Segment translations in `/lib/breadcrumb-simple.ts`

## Testing URLs

### Local Development
```bash
http://localhost:5173/commerce/service-packages
http://localhost:5173/commerce/service-packages/add
http://localhost:5173/commerce/service-packages/edit/[id]
http://localhost:5173/commerce/service-packages/[id]

http://localhost:5173/commerce/saas-product-types
http://localhost:5173/commerce/saas-product-types/add
http://localhost:5173/commerce/saas-product-types/edit/[id]
http://localhost:5173/commerce/saas-product-types/[id]
```

## Related Files

### Core Files
- `/App.tsx` - Route definitions
- `/constants/menu-config.ts` - Menu items
- `/constants/path-mapping.ts` - Path mappings

### Module Definitions
- `/modules/service-packages/index.tsx`
- `/modules/saas-product-types/index.tsx`

### Pages
- `/pages/ServicePackagesPage.tsx`
- `/pages/ServicePackageDetailPage.tsx`
- `/pages/AddServicePackagePage.tsx`
- `/pages/EditServicePackagePage.tsx`
- `/pages/SaasProductTypesPage.tsx`

### Utilities
- `/lib/breadcrumb-simple.ts` - Breadcrumb generation
- `/lib/route-guards.ts` - Reserved keyword handling

---

**Migration Date**: 2026-01-18  
**Status**: ✅ Production Ready  
**Documentation**: See `/docs/ROUTE-MIGRATION-COMMERCE-EN.md` for detailed migration notes

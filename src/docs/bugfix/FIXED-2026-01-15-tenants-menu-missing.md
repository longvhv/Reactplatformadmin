# Bug Fix: Tenants Menu - Không hiển thị trong Sidebar

**Ngày:** 2026-01-15  
**Mức độ:** High (Critical navigation issue)  
**Trạng thái:** ✅ FIXED

## Vấn đề

Menu "Tenants" không hiển thị trong sidebar mặc dù:
- ✅ Module đã được đăng ký: `/modules/tenant/index.tsx`
- ✅ Routes đã được config: `/core/tenants`
- ✅ Pages đã tồn tại: TenantsPage, AddTenantPage, EditTenantPage
- ✅ Module config có `showInSidebar: true`

→ User không thể truy cập Tenants từ navigation menu

## Root Cause Analysis

### Module ID Mismatch

**Module Config** (`/modules/tenant/index.tsx`):
```typescript
export const TenantsModule: ModuleDefinition = {
  id: "tenants",  // ← Module ID is "tenants" (PLURAL)
  name: "Tenants",
  showInSidebar: true,
  menuItems: [
    {
      id: "tenants",
      label: "navigation.tenants",
      icon: <Building2 className="w-5 h-5" />,
      path: "/core/tenants",
    },
  ],
};
```

**AppLayout Menu Groups** (`/components/layout/AppLayout.tsx`):
```typescript
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    moduleIds: ['tenant', 'user', 'roles', ...], // ← Looking for "tenant" (SINGULAR)
  },
];
```

**Result:** Menu grouping không tìm thấy module "tenants" → Không hiển thị trong sidebar

## How Menu Grouping Works

### Flow:
1. **ModuleRegistry** → Collect all modules with `showInSidebar: true`
2. **AppLayout** → Group menu items by `moduleId`
3. **MENU_GROUPS** → Define which modules belong to which group
4. **Render** → Display grouped menu items

### Code:
```typescript
// Step 1: Get all menu items from modules
const registryRoutes = useMemo(() => {
  const modules = registry.getEnabledModules();
  modules.forEach((module) => {
    if (module.showInSidebar && module.menuItems) {
      menuItems.push({
        ...menuItem,
        moduleId: module.id, // ← "tenants"
      });
    }
  });
}, []);

// Step 2: Group by moduleId
const groupedMenuItems = useMemo(() => {
  registryRoutes.forEach(item => {
    const group = MENU_GROUPS.find(g => 
      g.moduleIds.includes(item.moduleId) // ← Looking for "tenant", got "tenants"
    );
  });
}, [registryRoutes]);
```

**Problem:** `item.moduleId = "tenants"` but `g.moduleIds = ['tenant', ...]`

## Giải pháp

### Option 1: Fix AppLayout (CHOSEN) ✅

Sửa module ID trong MENU_GROUPS từ `'tenant'` → `'tenants'`:

```typescript
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    moduleIds: ['tenants', 'user', 'roles', 'audit-logs', 'auth-logs', 'tenant-members', 'user-roles'],
    //           ^^^^^^^^ Changed from 'tenant' to 'tenants'
  },
];
```

**Pros:**
- Simple one-word change
- Module ID "tenants" is more semantic (matches route `/core/tenants`)
- Consistent with "users", "products", "applications" (all plural)

**Cons:**
- None

### Option 2: Rename Module (NOT CHOSEN) ❌

Sửa module ID từ `"tenants"` → `"tenant"`:

```typescript
export const TenantsModule: ModuleDefinition = {
  id: "tenant", // ← Change to singular
  name: "Tenants",
  // ...
};
```

**Pros:**
- Matches existing MENU_GROUPS config

**Cons:**
- Less semantic (singular ID for plural concept)
- Inconsistent with other modules (users, products, etc.)
- More risky change (might affect other code)

## Files đã sửa

1. `/components/layout/AppLayout.tsx` - Sửa `'tenant'` → `'tenants'` trong MENU_GROUPS

## Testing Checklist

- [x] Menu "Tenants" hiển thị trong sidebar
- [x] Menu nằm trong group "QUẢN TRỊ & TRUY CẬP"
- [x] Click menu → Navigate to `/core/tenants`
- [x] Active state hoạt động
- [x] Pin/unpin hoạt động
- [x] Dark mode hiển thị đúng
- [x] Icon Building2 hiển thị
- [x] Tooltip/label hiển thị "Tenants"

## Module Naming Consistency

### Current State (After Fix)

| Module | Module ID | Route | Menu Group | Naming |
|--------|-----------|-------|------------|--------|
| Dashboard | dashboard | /core/dashboard | main | Singular ✅ |
| **Tenants** | **tenants** | **/core/tenants** | **identity** | **Plural ✅** |
| Users | user | /core/users | identity | **INCONSISTENT ⚠️** |
| Roles | roles | /core/roles | identity | Plural ✅ |
| Products | products | /core/products | commerce | Plural ✅ |
| Service Packages | service-packages | /core/service-packages | commerce | Plural ✅ |
| Applications | applications | /core/applications | platform | Plural ✅ |

### Inconsistency Found: Users Module ⚠️

**Users Module** hiện tại:
- Module ID: `"user"` (singular)
- Route: `/core/users` (plural)
- Should be: `"users"` for consistency

**Recommendation:** Rename Users module ID từ `"user"` → `"users"` trong future refactor

## Best Practice: Module Naming Convention

### Rule:
```
Module ID = Lowercase plural noun matching route
Route = /core/{module-id}
```

### Examples:
```typescript
// ✅ GOOD
id: "products" → /core/products
id: "tenants" → /core/tenants
id: "applications" → /core/applications

// ❌ BAD
id: "product" → /core/products (mismatch)
id: "tenant" → /core/tenants (mismatch)
id: "user" → /core/users (mismatch)
```

## Related Issues

### Fixed Today:
1. ✅ Products routing (add/edit order)
2. ✅ Service Packages forms (create AddPage, EditPage, Form component)
3. ✅ Service Packages edit button
4. ✅ Tenants menu missing (this fix)

### Potential Future Issues:
- ⚠️ Users module ID inconsistency (`user` vs `/core/users`)
- Need to audit all module IDs for consistency
- Need to document naming convention

## Impact Analysis

### Before Fix:
```
Tenants module: REGISTERED ✓
Routes: WORKING ✓
Menu: NOT VISIBLE ✗
Access: Direct URL only (bad UX)
```

### After Fix:
```
Tenants module: REGISTERED ✓
Routes: WORKING ✓
Menu: VISIBLE ✓
Access: Both menu + URL ✓
```

## Prevention: How to Avoid This Bug

### Checklist when adding new module:

1. **Choose Module ID**
   - Use plural form if route is plural
   - Match route name: `/core/items` → `id: "items"`

2. **Add to MENU_GROUPS**
   ```typescript
   moduleIds: ['new-module', ...] // Must match module.id exactly
   ```

3. **Test**
   - Check sidebar renders menu item
   - Check menu is in correct group
   - Check active state works

### Template:
```typescript
// Step 1: Create module
export const NewModule: ModuleDefinition = {
  id: "new-items", // ← Plural, matches route
  showInSidebar: true,
  menuItems: [{ path: "/core/new-items" }],
};

// Step 2: Add to MENU_GROUPS in AppLayout.tsx
{
  id: 'appropriate-group',
  moduleIds: ['new-items', ...], // ← Must match module.id
}

// Step 3: Test in UI
// - Menu visible? ✓
// - In correct group? ✓
// - Navigation works? ✓
```

## Debug Strategy for Menu Issues

### Symptoms:
- Menu item không hiển thị trong sidebar

### Debug Steps:

1. **Check Module Registration**
   ```typescript
   // In browser console:
   const registry = ModuleRegistry.getInstance();
   const modules = registry.getEnabledModules();
   console.log(modules.map(m => m.id));
   // Should include your module ID
   ```

2. **Check Module Config**
   ```typescript
   const myModule = registry.getModule('my-module-id');
   console.log('showInSidebar:', myModule.showInSidebar); // Should be true
   console.log('menuItems:', myModule.menuItems); // Should have items
   ```

3. **Check MENU_GROUPS**
   ```typescript
   // In AppLayout.tsx
   console.log('MENU_GROUPS:', MENU_GROUPS);
   // Find your module ID in moduleIds array
   ```

4. **Check groupedMenuItems**
   ```typescript
   // In AppLayout component
   console.log('groupedMenuItems:', groupedMenuItems);
   // Your module should appear in appropriate group
   ```

### Common Issues:
- ❌ Module not registered → Check `/modules/{module}/index.tsx` export
- ❌ `showInSidebar: false` → Set to `true`
- ❌ No `menuItems` → Add menu items array
- ❌ Module ID mismatch → Match module.id with MENU_GROUPS.moduleIds
- ❌ Wrong group → Check moduleIds array

## Conclusion

Fix đơn giản (1 từ) nhưng impact lớn:
- ✅ Tenants menu giờ hiển thị trong sidebar
- ✅ UX tốt hơn (không cần nhớ URL)
- ✅ Consistent với convention (plural module IDs)

Bài học:
- Module ID phải match exactly với MENU_GROUPS.moduleIds
- Prefer plural form cho consistency
- Always test menu visibility sau khi add module mới

# FIX: Menu "Tài Sản Số" và "Dịch Vụ" không hiển thị

**Ngày**: 15/01/2026  
**Trạng thái**: ✅ Hoàn thành  
**Loại**: Menu Integration & Module Registry Enhancement

## Vấn đề

Người dùng không thấy menu "Tài Sản Số" (Digital Assets) và "Dịch Vụ" (Service Deliveries) trong sidebar mặc dù các module đã được implement và đăng ký trong `moduleRegistration.tsx`.

## Nguyên nhân

1. **Sidebar sử dụng hard-coded menu**: Component `Sidebar.tsx` đang sử dụng menu items được hard-coded thay vì lấy động từ ModuleRegistry
2. **ModuleRegistry thiếu method**: Không có method `getAllMenuItems()` để lấy tất cả menu items từ các modules đã đăng ký
3. **Modules thiếu order**: Nhiều modules không có thuộc tính `order`, dẫn đến không biết cách sắp xếp và group menu items

## Giải pháp

### 1. Thêm method `getAllMenuItems()` vào ModuleRegistry

```typescript
// /core/ModuleRegistry.tsx

/**
 * Get all menu items from registered modules
 * Returns flattened list of menu items sorted by order
 */
public getAllMenuItems(): MenuItem[] {
  const menuItems: (MenuItem & { order?: number })[] = [];
  
  this.getEnabledModules().forEach((module) => {
    // Only include modules that should show in sidebar
    if (module.showInSidebar !== false && Array.isArray(module.menuItems)) {
      module.menuItems.forEach((item) => {
        menuItems.push({
          ...item,
          order: (item as any).order ?? (module as any).order ?? 999,
        });
      });
    }
  });
  
  // Sort by order
  return menuItems.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
```

### 2. Cập nhật Sidebar để sử dụng ModuleRegistry

Thay thế hard-coded menu bằng dynamic menu từ ModuleRegistry với auto-grouping logic:

**Order Ranges:**
- `0-9`: CHÍNH (Dashboard)
- `10-29`: QUẢN TRỊ & TRUY CẬP (Tenants, Users, Roles, Audit Logs)
- `30-49`: THƯƠNG MẠI & THANH TOÁN (Products, Packages, Orders, Digital Assets, Service Deliveries)
- `50-79`: NỀN TẢNG & CẤU HÌNH (Applications, System Categories, Reserved Slugs, Rate Limits)
- `80-99`: TÍCH HỢP & API (Webhooks, Notifications, Announcements)
- `100+`: PHÂN TÍCH & BÁO CÁO (Audit Logs, Help)

```typescript
// /components/layout/Sidebar.tsx

function getMenuGroup(order: number): string {
  if (order < 10) return 'main';
  if (order < 30) return 'identity';
  if (order < 50) return 'commerce';
  if (order < 80) return 'platform';
  if (order < 100) return 'integrations';
  return 'analytics';
}

const MENU_GROUPS = useMemo(() => {
  const registry = ModuleRegistry.getInstance();
  const menuItems = registry.getAllMenuItems();

  // Group menu items by their order
  const groupedItems: Record<string, MenuItem[]> = {};

  menuItems.forEach((item) => {
    const order = (item as any).order ?? 999;
    const groupId = getMenuGroup(order);

    if (!groupedItems[groupId]) {
      groupedItems[groupId] = [];
    }

    groupedItems[groupId].push({
      label: item.label,
      path: item.path || '#',
      icon: item.icon || null,
      badge: item.badge,
      description: (item as any).description,
      order,
    });
  });

  // Convert to MenuGroup array in order
  const groups: MenuGroup[] = [];
  const groupOrder = ['main', 'identity', 'commerce', 'platform', 'integrations', 'analytics'];

  groupOrder.forEach((groupId) => {
    if (groupedItems[groupId] && groupedItems[groupId].length > 0) {
      groups.push({
        id: groupId,
        label: GROUP_LABELS[groupId] || groupId.toUpperCase(),
        items: groupedItems[groupId].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
      });
    }
  });

  return groups;
}, []);
```

### 3. Thêm order cho các modules

Cập nhật các modules chưa có `order`:

| Module | Order | Group |
|--------|-------|-------|
| Dashboard | 1 | CHÍNH |
| Tenants | 10 | QUẢN TRỊ & TRUY CẬP |
| Users | 12 | QUẢN TRỊ & TRUY CẬP |
| Roles | 14 | QUẢN TRỊ & TRUY CẬP |
| Products | 40 | THƯƠNG MẠI & THANH TOÁN |
| Digital Assets | 45 | THƯƠNG MẠI & THANH TOÁN |
| Service Deliveries | 46 | THƯƠNG MẠI & THANH TOÁN |
| Applications | 50 | NỀN TẢNG & CẤU HÌNH |
| System Categories | 52 | NỀN TẢNG & CẤU HÌNH |
| Reserved Slugs | 54 | NỀN TẢNG & CẤU HÌNH |
| Rate Limits | 47 | NỀN TẢNG & CẤU HÌNH |
| Webhooks | 48 | TÍCH HỢP & API |
| Help | 120 | PHÂN TÍCH & BÁO CÁO |

### 4. Ẩn các modules không cần thiết

Set `showInSidebar: false` cho:
- **Settings**: Đã hiển thị riêng trong footer
- **Auth**: Auth pages không cần menu
- **DevDocs**: Hidden from sidebar
- **TenantMembers**: Hidden - shown in tenant/user details

## Files Changed

### Modified Files
1. `/core/ModuleRegistry.tsx` - Thêm method `getAllMenuItems()`
2. `/components/layout/Sidebar.tsx` - Sử dụng ModuleRegistry thay vì hard-coded menu
3. `/modules/dashboard/index.tsx` - Thêm `order: 1`
4. `/modules/tenant/index.tsx` - Thêm `order: 10`
5. `/modules/user/index.tsx` - Thêm `order: 12`
6. `/modules/roles/index.tsx` - Thêm `order: 14`
7. `/modules/applications/index.tsx` - Thêm `order: 50`
8. `/modules/system-category/index.tsx` - Thêm `order: 52`
9. `/modules/reserved-slugs/module.tsx` - Thêm `order: 54`
10. `/modules/settings/index.tsx` - Set `showInSidebar: false`
11. `/modules/auth/index.tsx` - Set `showInSidebar: false`
12. `/modules/help/index.tsx` - Thêm `order: 120`

### New Files
- `/docs/bugfix/FIX-2026-01-15-digital-assets-service-deliveries-menu.md` (this file)

## Kết quả

✅ Menu "Tài Sản Số" và "Dịch Vụ" hiện đã xuất hiện trong nhóm **THƯƠNG MẠI & THANH TOÁN**  
✅ Sidebar tự động lấy menu từ ModuleRegistry  
✅ Menu được sắp xếp và group tự động dựa trên order  
✅ Dễ dàng thêm module mới chỉ bằng cách đăng ký trong `moduleRegistration.tsx`  
✅ Không còn hard-coded menu items trong Sidebar  

## Testing

1. **Kiểm tra menu hiển thị**:
   - Mở sidebar
   - Xác nhận "Tài Sản Số" và "Dịch Vụ" xuất hiện trong nhóm "THƯƠNG MẠI & THANH TOÁN"
   - Xác nhận thứ tự menu đúng theo order đã định nghĩa

2. **Kiểm tra navigation**:
   - Click vào "Tài Sản Số" → Chuyển đến `/core/digital-assets`
   - Click vào "Dịch Vụ" → Chuyển đến `/core/service-deliveries`

3. **Kiểm tra responsive**:
   - Kiểm tra menu trên mobile
   - Xác nhận menu groups hiển thị đúng

## Architecture Benefits

### Trước
- Hard-coded menu trong Sidebar
- Phải cập nhật 2 nơi khi thêm module mới (moduleRegistration + Sidebar)
- Không có logic tự động group
- Khó maintain khi số lượng module tăng

### Sau
- Dynamic menu từ ModuleRegistry
- Chỉ cần đăng ký module trong moduleRegistration
- Tự động group dựa trên order
- Dễ dàng thêm/xóa modules
- Scalable và maintainable

## Migration Guide

Khi thêm module mới, chỉ cần:

1. Tạo module definition với `order` và `menuItems`
2. Đăng ký module trong `/core/moduleRegistration.tsx`
3. Menu sẽ tự động xuất hiện trong sidebar ở đúng group

```typescript
export const NewModule: ModuleDefinition = {
  id: "new-module",
  name: "New Module",
  enabled: true,
  showInSidebar: true,
  order: 35, // THƯƠNG MẠI & THANH TOÁN group
  
  menuItems: [
    {
      id: "new-module",
      label: "New Module",
      path: "/core/new-module",
      icon: <Icon className="w-5 h-5" />,
    },
  ],
  
  routes: [
    // ... routes
  ],
};
```

## Notes

- Order có thể là bất kỳ số nào trong range của group
- Nếu không set order, mặc định sẽ là 999 (xuất hiện cuối cùng)
- `showInSidebar: false` để ẩn module khỏi sidebar
- Menu items vẫn cần icon để hiển thị đẹp
- Labels có thể dùng translation keys hoặc hard-coded text

## Related Issues

- Digital Assets module đã được implement trong task trước
- Service Deliveries module đã được implement trong task trước
- Cả 2 modules đều có routes, pages, và components hoàn chỉnh
- Chỉ thiếu menu integration

## Conclusion

Vấn đề đã được giải quyết hoàn toàn bằng cách chuyển từ hard-coded menu sang dynamic menu system dựa trên ModuleRegistry. Giải pháp này không chỉ fix được issue hiện tại mà còn cải thiện architecture tổng thể của ứng dụng, giúp dễ dàng maintain và mở rộng trong tương lai.

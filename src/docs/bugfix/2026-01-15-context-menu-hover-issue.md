# Bug Fix: Context Menu Hover Issue

**Date:** 2026-01-15  
**Severity:** Medium  
**Status:** ✅ Fixed

## Vấn đề

Khi người dùng click vào icon 3 chấm (MoreVertical) để mở menu context trong các trang như RolesPage và ApplicationsPage, menu xuất hiện nhưng khoảng cách giữa con chuột và menu quá xa. Khi di chuyển chuột để chọn một option trong menu, menu bị ẩn đi ngay lập tức vì chuột không còn hover trên button trigger nữa.

### Trang bị ảnh hưởng:
- `/pages/RolesPage.tsx` 
- `/pages/ApplicationsPage.tsx`

## Nguyên nhân

Code sử dụng pattern `hidden group-hover:block` để hiển thị menu context:

```tsx
<div className="relative group">
  <button className="p-1 hover:bg-gray-100 rounded">
    <MoreVertical className="w-4 h-4 text-gray-400" />
  </button>
  
  <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
    <div className="py-1">
      {/* Menu items */}
    </div>
  </div>
</div>
```

Vấn đề với approach này:
1. Menu chỉ hiển thị khi hover trên nhóm (group) chứa button
2. Khi di chuyển chuột từ button sang menu, có khoảng cách giữa chúng (do `mt-1`)
3. Khi chuột di chuyển qua khoảng trống đó, nó không còn hover trên group nữa
4. CSS class `group-hover:block` không còn áp dụng → menu bị ẩn

## Giải pháp

Thay thế pattern `hidden group-hover:block` bằng component `DropdownMenu` từ `/components/ui/dropdown-menu.tsx`. Component này đã được implement với state management và click-outside detection đúng cách.

### Changes Made:

#### 1. RolesPage.tsx
**Before:**
```tsx
<div className="relative group">
  <button className="p-1 hover:bg-gray-100 rounded">
    <MoreVertical className="w-4 h-4 text-gray-400" />
  </button>
  
  <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
    <div className="py-1">
      <button onClick={...} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Xem chi tiết
      </button>
      {/* More items */}
    </div>
  </div>
</div>
```

**After:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ...

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="p-1 hover:bg-gray-100 rounded ml-2">
      <MoreVertical className="w-4 h-4 text-gray-400" />
    </button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuItem onClick={() => navigate(`/core/roles/${role._id}`)}>
      <Eye className="w-4 h-4 mr-2" />
      Xem chi tiết
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleEdit(role)}>
      <Edit className="w-4 h-4 mr-2" />
      Chỉnh sửa
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### 2. ApplicationsPage.tsx
Áp dụng cùng pattern với thêm các menu items:
- Chỉnh sửa
- Cài đặt  
- Activate/Deactivate
- Xóa

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

// Added missing icons to lucide-react import
import { 
  Plus, Search, Grid as GridIcon, List, Server, CheckCircle, XCircle, 
  Download, Upload, Filter, Code, Activity, MoreVertical, Edit, 
  Settings, PowerOff, Power, Trash2 
} from 'lucide-react';
```

## Lợi ích của giải pháp

1. ✅ **UX tốt hơn**: Menu không bị đóng khi di chuyển chuột từ button sang menu
2. ✅ **Click-outside detection**: Menu tự động đóng khi click ra ngoài
3. ✅ **State management**: Sử dụng React state để quản lý open/close state
4. ✅ **Keyboard accessible**: DropdownMenu component hỗ trợ keyboard navigation
5. ✅ **Consistent behavior**: Tất cả dropdown menus trong app hoạt động giống nhau
6. ✅ **Maintainable**: Code dễ đọc và bảo trì hơn

## Testing

Đã test các scenarios sau:
1. ✅ Click vào icon 3 chấm → menu hiển thị
2. ✅ Di chuyển chuột từ icon sang menu → menu không bị ẩn
3. ✅ Click vào một menu item → action được thực hiện, menu đóng
4. ✅ Click ra ngoài menu → menu đóng
5. ✅ Click vào icon 3 chấm lần thứ hai → menu toggle (đóng nếu đang mở)

## Files Changed

- `/pages/RolesPage.tsx` - Replaced hover-based menu with DropdownMenu component
- `/pages/ApplicationsPage.tsx` - Replaced hover-based menu with DropdownMenu component

## Related Components

- `/components/ui/dropdown-menu.tsx` - Component được sử dụng để fix bug

## Design Pattern

Pattern `DropdownMenu` component áp dụng:
- **Compound components pattern**: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
- **State management**: Sử dụng React.useState để quản lý open/close state
- **Event delegation**: Click outside detection với useEffect và event listeners
- **Props passing**: Context được share giữa các compound components thông qua React.cloneElement

## Notes

Pattern này nên được áp dụng cho tất cả các dropdown/context menus trong toàn bộ ứng dụng để đảm bảo consistency. Tránh sử dụng `group-hover` pattern cho interactive menus.

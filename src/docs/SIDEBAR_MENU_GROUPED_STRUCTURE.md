# Sidebar Menu Grouped Structure

## Tổng Quan

Document này mô tả cấu trúc menu sidebar mới với thiết kế phân nhóm theo phong cách **Stripe/Linear/GitHub**, được triển khai ngày 15/01/2026.

## Thiết Kế

### Đặc Điểm Chính

1. **Phân nhóm rõ ràng**: Menu được tổ chức thành các nhóm logic với header riêng biệt
2. **Typography nhất quán**: Header nhóm dùng chữ hoa (uppercase), font size nhỏ, màu xám nhạt
3. **Visual hierarchy**: Sử dụng spacing và màu sắc để tạo sự phân tách giữa các nhóm
4. **Badge support**: Hỗ trợ hiển thị số đếm hoặc label (number hoặc string)
5. **Responsive**: Hoạt động tốt trên cả desktop và mobile

### Design Tokens

```css
/* Group Header */
- Font size: 12px (text-xs)
- Font weight: 600 (font-semibold)
- Color: #9CA3AF (text-gray-400)
- Text transform: uppercase
- Letter spacing: 0.05em (tracking-wider)

/* Menu Item */
- Font size: 14px (text-sm)
- Padding: 8px 12px (py-2 px-3)
- Border radius: 8px (rounded-lg)
- Icon size: 16px (w-4 h-4)

/* Active State */
- Background: #EEF2FF (bg-indigo-50)
- Text color: #6366F1 (text-indigo-600)
- Font weight: 500 (font-medium)

/* Hover State */
- Background: #F9FAFB (bg-gray-50)
- Text color: #111827 (text-gray-900)
```

## Cấu Trúc Menu

### 1. CHÍNH (MAIN)
- **Mục đích**: Dashboard và tổng quan chung
- **Items**:
  - Tổng Quan (Dashboard)

### 2. QUẢN TRỊ & TRUY CẬP (IDENTITY & ACCESS)
- **Mục đích**: Quản lý người dùng, tenant và phân quyền
- **Items**:
  - Tenants
  - Người Dùng (Users)
  - Vai Trò (Roles)
  - Lịch Sử Truy Cập (Audit Logs)

### 3. THƯƠNG MẠI & THANH TOÁN (COMMERCE & BILLING)
- **Mục đích**: Quản lý sản phẩm, gói dịch vụ, đơn hàng
- **Items**:
  - Sản Phẩm (Products)
  - Gói Dịch Vụ (Service Packages)
  - Đăng Ký (Subscriptions)
  - Đơn Hàng (Orders)

### 4. NỀN TẢNG & CẤU HÌNH (PLATFORM & CONFIG)
- **Mục đích**: Cấu hình hệ thống và các module platform
- **Items**:
  - Ứng Dụng (Applications)
  - Danh Mục Hệ Thống (System Categories)
  - App Routes
  - Giới Hạn Tốc Độ (Rate Limits)
  - Reserved Slugs
  - Thông Báo (Announcements)

### 5. TÍCH HỢP & API (INTEGRATIONS & API)
- **Mục đích**: Quản lý webhook và API keys
- **Items**:
  - Webhooks
  - API Keys

### 6. PHÂN TÍCH & BÁO CÁO (ANALYTICS & REPORTS)
- **Mục đích**: Báo cáo và phân tích dữ liệu
- **Items**:
  - Báo Cáo (Reports)
  - Nhật Ký Kiểm Toán (Audit Logs)

## Code Structure

### Type Definitions

```typescript
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | string;  // Hỗ trợ cả number và string
  description?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}
```

### Menu Configuration

Menu được định nghĩa trong constant `MENU_GROUPS` tại `/components/layout/Sidebar.tsx`:

```typescript
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'main',
    label: 'CHÍNH',
    items: [...]
  },
  // ... các nhóm khác
];
```

## i18n Support

### Vietnamese (vi.ts)
```typescript
navigation: {
  groupMain: 'CHÍNH',
  groupIdentity: 'QUẢN TRỊ & TRUY CẬP',
  groupCommerce: 'THƯƠNG MẠI & THANH TOÁN',
  groupPlatform: 'NỀN TẢNG & CẤU HÌNH',
  groupIntegrations: 'TÍCH HỢP & API',
  groupAnalytics: 'PHÂN TÍCH & BÁO CÁO',
  // ...
}
```

### English (en.ts)
```typescript
navigation: {
  groupMain: 'MAIN',
  groupIdentity: 'IDENTITY & ACCESS',
  groupCommerce: 'COMMERCE & BILLING',
  groupPlatform: 'PLATFORM & CONFIG',
  groupIntegrations: 'INTEGRATIONS & API',
  groupAnalytics: 'ANALYTICS & REPORTS',
  // ...
}
```

## Features

### 1. Badge System
Hỗ trợ hiển thị badge cho menu items:

```typescript
// Number badge
{
  label: 'Thông Báo',
  path: '/core/announcements',
  icon: <Megaphone className="w-4 h-4" />,
  badge: 5,  // Hiển thị số 5
}

// String badge (e.g., "AI", "NEW")
{
  label: 'AI Assistant',
  path: '/core/ai',
  icon: <Bot className="w-4 h-4" />,
  badge: 'AI',  // Hiển thị label "AI"
}
```

### 2. Active State Detection
Tự động highlight menu item khi route match:

```typescript
const isActiveRoute = (path: string) => {
  return location.pathname === path || 
         location.pathname.startsWith(`${path}/`);
};
```

### 3. Mobile Responsive
- Sidebar ẩn mặc định trên mobile
- Có nút hamburger menu để mở sidebar
- Overlay backdrop khi sidebar mở
- Tự động đóng sidebar khi navigate

## Cách Thêm Menu Item Mới

### Bước 1: Thêm vào MENU_GROUPS

```typescript
// Trong /components/layout/Sidebar.tsx
{
  id: 'platform',
  label: 'NỀN TẢNG & CẤU HÌNH',
  items: [
    // ... existing items
    {
      label: 'Feature Mới',
      path: '/core/new-feature',
      icon: <Star className="w-4 h-4" />,
      badge: 'NEW',  // Optional
      description: 'Mô tả feature mới',  // Optional
    },
  ],
}
```

### Bước 2: Thêm translation (optional)

```typescript
// Trong /i18n/vi.ts
navigation: {
  newFeature: 'Feature Mới',
  // ...
}
```

### Bước 3: Đảm bảo route tồn tại

Kiểm tra route đã được đăng ký trong routing system (`/App.tsx` hoặc module registration).

## Best Practices

### 1. Nhóm Menu
- Mỗi nhóm nên có 3-6 items
- Nếu quá nhiều items, cân nhắc tách thành nhóm con
- Nhóm nên có mục đích rõ ràng và tương quan logic

### 2. Icon Usage
- Sử dụng icon từ `lucide-react`
- Kích thước chuẩn: `w-4 h-4` (16px)
- Icon phải có ý nghĩa rõ ràng với menu item

### 3. Badge
- Chỉ dùng badge khi cần thiết (thông báo, đếm, trạng thái)
- Number badge: cho số lượng items, notifications
- String badge: cho labels như "NEW", "BETA", "AI"

### 4. Naming Convention
- Label tiếng Việt: Viết hoa chữ cái đầu mỗi từ
- Group label: VIẾT HOA toàn bộ
- Path: lowercase với dấu gạch ngang `/core/feature-name`

## Performance Considerations

1. **Icons**: Import chỉ các icon cần dùng từ `lucide-react`
2. **State Management**: Sử dụng React state cho mobile menu toggle
3. **Route Matching**: Efficient string comparison cho active state
4. **Rendering**: Không cần memo vì component đơn giản

## Migration từ Cấu Trúc Cũ

### Cấu Trúc Cũ (có collapse/expand)
```typescript
interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  defaultExpanded?: boolean;
}
```

### Cấu Trúc Mới (flat groups)
```typescript
interface MenuGroup {
  id: string;
  label: string;  // Header text (uppercase)
  items: MenuItem[];
}
```

### Thay Đổi Chính
1. ✅ Bỏ collapse/expand functionality
2. ✅ Bỏ group icon (chỉ giữ item icon)
3. ✅ Header nhóm dùng typography thay vì button
4. ✅ Spacing tăng lên giữa các nhóm
5. ✅ Sidebar width giảm từ 288px xuống 256px

## Troubleshooting

### Issue: Menu item không highlight khi active
**Solution**: Kiểm tra path trong `MENU_GROUPS` phải match với route definition

### Issue: Badge không hiển thị
**Solution**: Đảm bảo `badge` property có giá trị và !== undefined

### Issue: Mobile menu không đóng khi navigate
**Solution**: Kiểm tra `useEffect` dependency `[location.pathname]`

## Related Files

```
/components/layout/Sidebar.tsx        # Main sidebar component
/i18n/vi.ts                           # Vietnamese translations
/i18n/en.ts                           # English translations
/constants/navigation.ts              # Navigation constants (deprecated)
/docs/SIDEBAR_MENU_GROUPED_STRUCTURE.md  # This documentation
```

## Version History

- **v1.0** (2026-01-15): Initial grouped structure implementation
  - Phân nhóm 6 categories chính
  - Support badge (number và string)
  - Responsive mobile design
  - i18n support (vi, en)

## Next Steps & Future Improvements

1. [ ] Thêm search/filter trong sidebar
2. [ ] Thêm favorite/pin menu items
3. [ ] Thêm keyboard shortcuts cho navigation
4. [ ] Dynamic menu từ user permissions
5. [ ] Thêm collapsible groups (optional, khi cần)

## Support & Contact

Nếu có vấn đề hoặc câu hỏi về cấu trúc menu mới, vui lòng tham khảo:
- Code: `/components/layout/Sidebar.tsx`
- Design guideline: Stripe/Linear/GitHub sidebar patterns
- Framework: vhvplatform/react-framework

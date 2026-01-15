# FIX: Missing Menu Items - Legal Documents & Settings

**Date**: 2026-01-15  
**Type**: Bug Fix  
**Module**: Navigation, Menu System  
**Status**: ✅ Fixed

## Problem

Menu items "Điều khoản sử dụng" (Legal Documents) và "Cài đặt" (Settings) không hiển thị trong sidebar navigation mặc dù:
- Modules đã được đăng ký trong `moduleRegistration.tsx`
- Translation keys đã tồn tại
- Routes đã được định nghĩa đúng

## Root Cause

Trong file `/components/layout/AppLayout.tsx`, constant `MENU_GROUPS` định nghĩa cấu trúc menu theo nhóm, nhưng không bao gồm module IDs cho:
- `legal-documents`
- `settings`
- `help`

Do đó, các menu items này không được hiển thị trong sidebar.

## Solution

### 1. Cập nhật MENU_GROUPS trong AppLayout.tsx

**File**: `/components/layout/AppLayout.tsx`

Thêm:
- Module `legal-documents` vào nhóm `platform` (NỀN TẢNG & CẤU HÌNH)
- Tạo nhóm mới `system` (HỆ THỐNG & HỖ TRỢ) cho `settings` và `help`

```typescript
const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'main',
    label: 'CHÍNH',
    moduleIds: ['dashboard'],
  },
  {
    id: 'identity',
    label: 'QUẢN TRỊ & TRUY CẬP',
    moduleIds: ['tenants', 'users', 'roles', 'audit-logs', 'auth-logs', 'tenant-members', 'user-roles', 'user-delegations'],
  },
  {
    id: 'commerce',
    label: 'THƯƠNG MẠI & THANH TOÁN',
    moduleIds: ['products', 'service-packages', 'subscriptions', 'subscription-invoices', 'subscription-orders', 'tenant-subscriptions'],
  },
  {
    id: 'platform',
    label: 'NỀN TẢNG & CẤU HÌNH',
    moduleIds: ['applications', 'system-categories', 'rate-limits', 'reserved-slugs', 'system-announcements', 'notification-templates', 'legal-documents'], // ✅ Added legal-documents
  },
  {
    id: 'integrations',
    label: 'TÍCH HỢP & API',
    moduleIds: ['webhooks', 'dev-docs'],
  },
  {
    id: 'system', // ✅ NEW GROUP
    label: 'HỆ THỐNG & HỖ TRỢ',
    moduleIds: ['settings', 'help'],
  },
];
```

### 2. Cập nhật i18n Translations

Thêm translation key `groupSystem` cho nhóm menu mới trong tất cả 6 ngôn ngữ:

#### Vietnamese (`/i18n/vi.ts`)
```typescript
groupSystem: 'HỆ THỐNG & HỖ TRỢ',
```

#### English (`/i18n/en.ts`)
```typescript
groupSystem: 'SYSTEM & SUPPORT',
```

#### Spanish (`/i18n/es.ts`)
```typescript
groupSystem: 'SISTEMA & SOPORTE',
```

#### Japanese (`/i18n/ja.ts`)
```typescript
groupSystem: 'システム＆サポート',
```

#### Korean (`/i18n/ko.ts`)
```typescript
groupSystem: '시스템 & 지원',
```

#### Chinese (`/i18n/zh.ts`)
```typescript
groupSystem: '系统与支持',
```

## Testing

### Manual Testing Checklist
- [x] Menu "Điều khoản sử dụng" hiển thị trong nhóm "NỀN TẢNG & CẤU HÌNH"
- [x] Menu "Cài đặt" hiển thị trong nhóm "HỆ THỐNG & HỖ TRỢ"
- [x] Menu "Trợ giúp" hiển thị trong nhóm "HỆ THỐNG & HỖ TRỢ"
- [x] Nhóm "HỆ THỐNG & HỖ TRỢ" hiển thị ở cuối sidebar
- [x] Translation đúng cho tất cả 6 ngôn ngữ
- [x] Click vào menu items navigate đúng route

## Files Changed

1. `/components/layout/AppLayout.tsx` - Added menu groups configuration
2. `/i18n/vi.ts` - Added Vietnamese translation
3. `/i18n/en.ts` - Added English translation
4. `/i18n/es.ts` - Added Spanish translation
5. `/i18n/ja.ts` - Added Japanese translation
6. `/i18n/ko.ts` - Added Korean translation
7. `/i18n/zh.ts` - Added Chinese translation

## Design Rationale

### Menu Grouping Strategy

**Legal Documents** → `platform` group
- Lý do: Legal documents là một phần của platform configuration
- Tương tự các module khác như system-categories, announcements, notification-templates

**Settings & Help** → `system` group (NEW)
- Lý do: Theo best practices của Stripe/GitHub/Vercel/Linear
- Settings và Help thường được đặt ở cuối sidebar, tách biệt khỏi business logic
- Tạo sự phân tách rõ ràng giữa platform features và system utilities

## Related Documentation

- [Sidebar Menu Grouped Structure](/docs/SIDEBAR_MENU_GROUPED_STRUCTURE.md)
- [Module Registration](/core/moduleRegistration.tsx)
- [i18n Guide](/I18N-GUIDE.md)

## Migration Notes

Nếu cần thêm module mới vào menu sidebar:
1. Đăng ký module trong `/core/moduleRegistration.tsx`
2. Thêm module ID vào một trong các groups trong `MENU_GROUPS`
3. Đảm bảo translation keys tồn tại cho tất cả 6 ngôn ngữ

## Best Practices

1. **Menu Grouping**: Mỗi nhóm nên có 3-6 items để maintain readability
2. **Group Order**: Đặt các nhóm theo mức độ sử dụng (main → platform → system)
3. **Naming**: Group labels nên VIẾT HOA để distinguish với menu items
4. **i18n**: Luôn cập nhật tất cả 6 ngôn ngữ để tránh missing translation errors

## Notes

- Module definitions trong `/modules/legal-documents/index.tsx` và `/modules/settings/index.tsx` đã đúng
- Translation keys `navigation.legalDocuments` và `navigation.settings` đã tồn tại từ trước
- Chỉ cần thêm module IDs vào MENU_GROUPS là đủ để hiển thị menu

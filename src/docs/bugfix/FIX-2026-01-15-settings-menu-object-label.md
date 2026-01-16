# Fix: Settings Menu Label Shows [object Object]

**Date**: 2026-01-15  
**Module**: Settings, Dev Docs  
**Severity**: Medium  
**Status**: ✅ FIXED

## Problem

Menu Cài đặt (Settings) hiển thị label là `[object Object]` thay vì text "Cài đặt" đúng. Đây là lỗi phổ biến khi cố gắng render một object thay vì string trong React.

Ngoài ra, module Dev Docs cũng có children menu items với hardcoded labels thay vì sử dụng translation keys.

## Root Cause

Trong file `/modules/settings/index.tsx`, `menuItems[0].label` được set sai:

```typescript
// ❌ BEFORE (SAI)
menuItems: [
  {
    id: "settings",
    label: "settings", // String literal thay vì translation key
    icon: <Settings className="w-5 h-5" />,
    path: "/core/settings",
    order: 100,
  } as any,
],
```

Do translation system xử lý `"settings"` như một key không tồn tại và trả về một object, dẫn đến React render object thành string `[object Object]`.

Tương tự, trong file `/modules/dev-docs/index.tsx`, children menu items có hardcoded labels:

```typescript
// ❌ BEFORE (SAI)
children: [
  {
    id: "dev-overview",
    label: "Overview", // Hardcoded label
    icon: <FileText className="w-4 h-4" />,
    path: "/core/dev-docs",
  },
  {
    id: "api-docs",
    label: "API Docs", // Hardcoded label
    icon: <Code2 className="w-4 h-4" />,
    path: "/core/api-docs",
  },
  {
    id: "database-docs",
    label: "Database", // Hardcoded label
    icon: <Database className="w-4 h-4" />,
    path: "/core/database-docs",
  },
],
```

## Solution

Sửa label từ `"settings"` thành translation key đúng format `"navigation.settings"`:

```typescript
// ✅ AFTER (ĐÚNG)
menuItems: [
  {
    id: "settings",
    label: "navigation.settings", // Translation key đúng
    icon: <Settings className="w-5 h-5" />,
    path: "/core/settings",
    order: 100,
  } as any,
],
```

Sửa children menu items trong `/modules/dev-docs/index.tsx` để sử dụng translation keys:

```typescript
// ✅ AFTER (ĐÚNG)
children: [
  {
    id: "dev-overview",
    label: "navigation.overview", // Translation key đúng
    icon: <FileText className="w-4 h-4" />,
    path: "/core/dev-docs",
  },
  {
    id: "api-docs",
    label: "api.title", // Translation key đúng (api.title = "Tài liệu API")
    icon: <Code2 className="w-4 h-4" />,
    path: "/core/api-docs",
  },
  {
    id: "database-docs",
    label: "database.title", // Translation key đúng (database.title = "Tài liệu Database")
    icon: <Database className="w-4 h-4" />,
    path: "/core/database-docs",
  },
],
```

Translation key được định nghĩa trong `/i18n/vi.ts`:

```typescript
navigation: {
  settings: 'Cài đặt',
  overview: 'Tổng Quan',
  // ...
}

api: {
  title: 'Tài liệu API',
  // ...
}

database: {
  title: 'Tài liệu Database',
  // ...
}
```

## Files Changed

- `/modules/settings/index.tsx` - Fixed label from `"settings"` to `"navigation.settings"`
- `/modules/dev-docs/index.tsx` - Fixed children menu items labels to use translation keys

## Testing

1. ✅ Menu Settings hiển thị đúng label "Cài đặt" thay vì "[object Object]"
2. ✅ Navigation hoạt động bình thường khi click vào menu
3. ✅ Translation hoạt động đúng với tất cả 6 ngôn ngữ (vi, en, es, ja, ko, zh)

## Related Issues

None

## Notes

- Đây là pattern chuẩn cho tất cả menu items trong hệ thống
- Tất cả menu labels phải sử dụng translation keys với format `navigation.<key>`
- Không nên hardcode strings cho labels để đảm bảo i18n hoạt động đúng

## Migration Impact

- ✅ No migration needed
- ✅ No database changes
- ✅ No API changes
- ✅ Frontend-only fix
- ✅ Golang migration ready (không ảnh hưởng)

## Reference

Kiểm tra module khác như Help để thấy cách sử dụng đúng:

```typescript
// File: /modules/help/index.tsx
menuItems: [
  {
    id: "help",
    label: "navigation.help", // ✅ Đúng format
    icon: <HelpCircle className="w-5 h-5" />,
    path: "/core/help",
  },
],
```
# FIX: Pinned Menu Missing Labels - 2026-01-15

## 📋 Thông tin Bug

**Bug ID**: FIX-2026-01-15-pinned-menu-missing-labels  
**Ngày phát hiện**: 15/01/2026  
**Severity**: Medium  
**Module ảnh hưởng**: Layout - AppLayout Component  
**Người fix**: AI Assistant  

## 🐛 Mô tả Bug

Các menu được pin lên trên sidebar không hiển thị tên menu, chỉ hiển thị icon và khoảng trống.

### Triệu chứng:
- Menu items trong phần "Pinned" section không có text label
- Icon vẫn hiển thị bình thường
- Pin button vẫn hoạt động
- Các menu không được pin hiển thị tên bình thường

### Ảnh hưởng:
- User experience bị ảnh hưởng khi không thể nhận biết menu được pin
- Tính năng pin menu mất ý nghĩa khi không có label

## 🔍 Nguyên nhân gốc rẽ

### Root Cause Analysis:

1. **Type Mismatch**: Trong file `/components/layout/AppLayout.tsx` tại line 291, code đang sử dụng:
   ```tsx
   name={route.name}
   ```

2. **Interface Issue**: Theo `MenuItem` interface trong `/core/ModuleRegistry.tsx`:
   ```typescript
   export interface MenuItem {
     id: string;
     label: string;  // ← Field đúng
     icon?: ReactNode;
     path?: string;
     children?: MenuItem[];
     badge?: string | number;
     disabled?: boolean;
   }
   ```
   
3. **Missing Translation**: MenuItem chỉ có `label` field (chứa translation key), không có `name` field. Vì vậy `route.name` luôn là `undefined`.

4. **Inconsistency**: Các menu không được pin (lines 320-324) sử dụng đúng `t(item.label)`, nhưng pinned menu lại dùng sai `route.name`.

## ✅ Giải pháp

### Thay đổi code:

**File**: `/components/layout/AppLayout.tsx`  
**Line**: 291  

**Before**:
```tsx
{pinnedRouteObjects.map((route: any) => (
  <NavigationItem
    key={route.path}
    route={route}
    icon={route.icon}
    name={route.name}  // ❌ Wrong - route.name is undefined
    isPinned={true}
    onTogglePin={() => togglePinRoute(route.path)}
  />
))}
```

**After**:
```tsx
{pinnedRouteObjects.map((route: any) => (
  <NavigationItem
    key={route.path}
    route={route}
    icon={route.icon}
    name={t(route.label)}  // ✅ Correct - translate label
    isPinned={true}
    onTogglePin={() => togglePinRoute(route.path)}
  />
))}
```

### Lý do sửa:
1. **Type Consistency**: Sử dụng đúng `label` field từ MenuItem interface
2. **I18n Support**: Áp dụng `t()` function để translate label theo ngôn ngữ hiện tại
3. **Code Consistency**: Giống với cách render menu items khác (line 321)

## 🧪 Testing

### Test Cases:

1. **Pin một menu**
   - ✅ Menu hiển thị đầy đủ label
   - ✅ Label được translate đúng ngôn ngữ
   - ✅ Icon hiển thị bình thường

2. **Unpin menu**
   - ✅ Menu biến mất khỏi Pinned section
   - ✅ Menu vẫn hiển thị ở vị trí gốc với label đầy đủ

3. **Change language**
   - ✅ Pinned menu labels tự động update theo ngôn ngữ mới
   - ✅ Không cần reload trang

4. **Reload page**
   - ✅ Pinned state được persist qua localStorage
   - ✅ Labels hiển thị đúng sau khi reload

## 📊 Impact Analysis

### Các module/component liên quan:
- ✅ `/components/layout/AppLayout.tsx` - Fixed
- ✅ `/core/ModuleRegistry.tsx` - No change needed (interface đúng)
- ✅ All modules - Không ảnh hưởng (chỉ fix rendering logic)

### Breaking Changes:
- **NONE** - Đây là bugfix, không có breaking changes

### Performance Impact:
- **Minimal** - Chỉ thêm function call `t()` cho mỗi pinned item
- Translation lookup được cache bởi i18n system

## 🔄 Migration Notes

### Không cần migration
- Fix này chỉ ảnh hưởng frontend rendering
- Không có API changes
- Không có database changes
- Backward compatible 100%

## 📝 Related Issues

### Similar patterns cần check:
- ✅ Menu items trong grouped navigation - Đã đúng (dùng `t(item.label)`)
- ✅ Collapsed sidebar menu - Đã đúng (dùng `t(item.label)`)
- ✅ NavigationItem component - Không cần sửa (nhận `name` prop đã được process)

### Previous related fixes:
- FIX-2026-01-15-settings-menu-object-label.md - Tương tự, fix translation key

## 🎯 Lessons Learned

1. **Always use type-safe interfaces**: Nếu dùng TypeScript strict mode, lỗi này sẽ bị catch compile-time
2. **Consistency is key**: Khi copy-paste code, phải đảm bảo pattern nhất quán
3. **Test all code paths**: Pinned menu là code path riêng, cần test riêng
4. **I18n from the start**: Luôn dùng `t()` cho mọi label, không hardcode

## 🚀 Deployment Notes

### Deployment checklist:
- ✅ Code changes: 1 file
- ✅ No database migration needed
- ✅ No API changes
- ✅ No config changes
- ✅ Safe to deploy immediately

### Rollback plan:
```bash
# Simply revert the single line change if issues occur
git revert <commit-hash>
```

## 📌 Summary

**Tóm tắt**: Bug xảy ra do sử dụng sai field name (`route.name` thay vì `route.label`) khi render pinned menu items. Fix bằng cách sử dụng đúng `t(route.label)` để translate label, nhất quán với các menu items khác.

**Status**: ✅ **RESOLVED**  
**Fix version**: Current  
**Tested**: ✅ Passed all test cases  
**Production ready**: ✅ Yes  

---

**Góc nhìn Golang Migration**:
- Bug này không ảnh hưởng đến Golang backend
- Tuy nhiên, pattern này nhắc nhở về type safety khi migrate sang Go
- Go's strict typing sẽ prevent loại bugs này compile-time

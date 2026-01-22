# Hướng dẫn thay thế alias `@/` bằng relative paths

## 📋 Tổng quan

Migration từ React SPA sang Next.js 14 App Router yêu cầu thay thế toàn bộ import alias `@/` trong thư mục `/components` bằng relative paths. Tài liệu này mô tả pattern đã áp dụng và hướng dẫn hoàn thành các file còn lại.

## ✅ Đã hoàn thành

### Components/users/
- [x] UserDevicesTab.tsx
- [x] UserDialog.tsx
- [x] UserFilters.tsx
- [x] UserOverviewTab.tsx
- [x] UserPagination.tsx
- [x] UserSecurityTab.tsx
- [x] UserStatsTab.tsx
- [x] UserTenantsTab.tsx

### Components/users/detail/
- [x] UserActivity.tsx
- [x] UserOverview.tsx
- [ ] UserSecurity.tsx
- [ ] UserSessions.tsx

## ⚠️ Còn lại cần xử lý

### /components/users/
- [ ] LinkedIdentityDialog.tsx
- [ ] MFAMethodDialog.tsx

### /components/webhooks/
- [ ] WebhookDetailModal.tsx
- [ ] WebhookForm.tsx
- [ ] WebhookModal.tsx
- [ ] WebhookStatsTab.tsx

### /components/user-groups/
- [ ] UserGroupForm.tsx
- [ ] GroupMembersTab.tsx

## 📐 Pattern thay thế

### Từ `/components/users/`:
```typescript
// CŨ:
import { Button } from '@/components/ui/button';
import { usersApi } from '@/api/usersApi';
import { useLanguage } from '@/providers/LanguageProvider';
import { useUsers } from '@/hooks/useUsers';
import type { User } from '@/data/users';

// MỚI:
import { Button } from '../ui/button';
import { usersApi } from '../../api/usersApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { useUsers } from '../../hooks/useUsers';
import type { User } from '../../data/users';
```

### Từ `/components/users/detail/`:
```typescript
// CŨ:
import { Button } from '@/components/ui/button';
import { usersApi } from '@/api/usersApi';
import { useUsers } from '@/hooks/useUsers';
import type { User } from '@/data/users';

// MỚI:
import { Button } from '../../ui/button';
import { usersApi } from '../../../api/usersApi';
import { useUsers } from '../../../hooks/useUsers';
import type { User } from '../../../data/users';
```

### Từ `/components/webhooks/`:
```typescript
// CŨ:
import { Button } from '@/components/ui/button';
import { webhooksApi } from '@/api/webhooksApi';
import { useWebhooks } from '@/hooks/useWebhooks';

// MỚI:
import { Button } from '../ui/button';
import { webhooksApi } from '../../api/webhooksApi';
import { useWebhooks } from '../../hooks/useWebhooks';
```

### Từ `/components/user-groups/`:
```typescript
// CŨ:
import { Button } from '@/components/ui/button';
import { userGroupsApi } from '@/api/userGroupsApi';
import { useUserGroups } from '@/hooks/useUserGroups';

// MỚI:
import { Button } from '../ui/button';
import { userGroupsApi } from '../../api/userGroupsApi';
import { useUserGroups } from '../../hooks/useUserGroups';
```

## 🔧 Quy tắc chung

### Bảng tra cứu nhanh:

| Vị trí file | Đích | Relative path |
|------------|------|---------------|
| `/components/[folder]/` | `/components/ui/` | `../ui/` |
| `/components/[folder]/` | `/api/` | `../../api/` |
| `/components/[folder]/` | `/hooks/` | `../../hooks/` |
| `/components/[folder]/` | `/providers/` | `../../providers/` |
| `/components/[folder]/` | `/data/` | `../../data/` |
| `/components/[folder]/` | `/constants/` | `../../constants/` |
| `/components/[folder]/detail/` | `/components/ui/` | `../../ui/` |
| `/components/[folder]/detail/` | `/api/` | `../../../api/` |
| `/components/[folder]/detail/` | `/hooks/` | `../../../hooks/` |
| `/components/[folder]/detail/` | `/data/` | `../../../data/` |

### Công thức tính path:
```
Số lượng "../" = Độ sâu thư mục hiện tại + (Độ sâu thư mục đích - 1)
```

Ví dụ:
- `/components/users/UserForm.tsx` → `/api/usersApi.ts`
  - Hiện tại: 2 cấp (`components/users/`)
  - Đích: 1 cấp (`api/`)
  - Path: `../../api/usersApi`

## 🚀 Hướng dẫn thực hiện

### Bước 1: Mở file cần sửa
```bash
code components/users/detail/UserSecurity.tsx
```

### Bước 2: Tìm tất cả import có `@/`
```typescript
// Tìm pattern:
from '@/
```

### Bước 3: Thay thế theo bảng tra cứu
Sử dụng Find & Replace (Ctrl+H hoặc Cmd+H):

**Từ `/components/users/detail/`:**
- `@/components/ui` → `../../ui`
- `@/api` → `../../../api`
- `@/hooks` → `../../../hooks`
- `@/data` → `../../../data`
- `@/providers` → `../../../providers`

**Từ `/components/webhooks/`:**
- `@/components/ui` → `../ui`
- `@/api` → `../../api`
- `@/hooks` → `../../hooks`
- `@/constants` → `../../constants`

**Từ `/components/user-groups/`:**
- `@/components/ui` → `../ui`
- `@/api` → `../../api`
- `@/hooks` → `../../hooks`

### Bước 4: Kiểm tra lỗi
```bash
npm run build
# hoặc
npm run type-check
```

### Bước 5: Test chức năng
```bash
npm run dev
```

## 📝 Ví dụ cụ thể

### UserSecurity.tsx
**Trước:**
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User } from '@/data/users';
```

**Sau:**
```typescript
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import type { User } from '../../../data/users';
```

### WebhookForm.tsx
**Trước:**
```typescript
import { Webhook, CreateWebhookRequest, UpdateWebhookRequest } from '@/api/webhooksApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEFAULT_TENANT_ID } from '@/constants/tenant-constants';
import { useTenants } from '@/hooks/useTenants';
```

**Sau:**
```typescript
import { Webhook, CreateWebhookRequest, UpdateWebhookRequest } from '../../api/webhooksApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DEFAULT_TENANT_ID } from '../../constants/tenant-constants';
import { useTenants } from '../../hooks/useTenants';
```

## ⚡ Script tự động (khuyến nghị)

Tạo file `fix-remaining-aliases.sh`:

```bash
#!/bin/bash

# Fix /components/users/detail/
sed -i "s|@/components/ui|../../ui|g" components/users/detail/UserSecurity.tsx
sed -i "s|@/api|../../../api|g" components/users/detail/UserSecurity.tsx
sed -i "s|@/data|../../../data|g" components/users/detail/UserSecurity.tsx

sed -i "s|@/components/ui|../../ui|g" components/users/detail/UserSessions.tsx
sed -i "s|@/hooks|../../../hooks|g" components/users/detail/UserSessions.tsx

# Fix /components/users/
sed -i "s|@/components/ui|../ui|g" components/users/LinkedIdentityDialog.tsx
sed -i "s|@/api|../../api|g" components/users/LinkedIdentityDialog.tsx

sed -i "s|@/components/ui|../ui|g" components/users/MFAMethodDialog.tsx
sed -i "s|@/api|../../api|g" components/users/MFAMethodDialog.tsx

# Fix /components/webhooks/
sed -i "s|@/api|../../api|g" components/webhooks/*.tsx
sed -i "s|@/components/ui|../ui|g" components/webhooks/*.tsx
sed -i "s|@/constants|../../constants|g" components/webhooks/*.tsx
sed -i "s|@/hooks|../../hooks|g" components/webhooks/*.tsx

# Fix /components/user-groups/
sed -i "s|@/components/ui|../ui|g" components/user-groups/*.tsx
sed -i "s|@/api|../../api|g" components/user-groups/*.tsx

echo "✅ Done! Please verify changes and test."
```

Chạy:
```bash
chmod +x fix-remaining-aliases.sh
./fix-remaining-aliases.sh
```

## ✅ Checklist hoàn thành

- [ ] Chạy script tự động hoặc sửa thủ công
- [ ] Kiểm tra không còn `@/` trong `/components`
```bash
grep -r "from '@/" components/
```
- [ ] Build thành công
```bash
npm run build
```
- [ ] Không có TypeScript errors
```bash
npm run type-check
```
- [ ] Test các trang có sử dụng components đã fix
- [ ] Commit changes
```bash
git add components/
git commit -m "fix: replace @/ alias with relative paths in components"
```

## 🎯 Mục tiêu

Sau khi hoàn thành:
- ✅ Không còn file nào trong `/components` sử dụng alias `@/`
- ✅ Tất cả imports sử dụng relative paths
- ✅ Build thành công không lỗi
- ✅ File shim `components/shim/next-navigation.tsx` hoạt động ổn định
- ✅ Ứng dụng sẵn sàng cho Next.js 14 App Router

## 📚 Tài liệu tham khảo

- [SHIM_USAGE_GUIDE.md](/SHIM_USAGE_GUIDE.md) - Hướng dẫn sử dụng navigation shim
- [NEXTJS_MIGRATION_MASTER_PLAN.md](/NEXTJS_MIGRATION_MASTER_PLAN.md) - Kế hoạch migration tổng thể
- [CODING_STANDARDS_NEXTJS_READY.md](/CODING_STANDARDS_NEXTJS_READY.md) - Chuẩn code cho Next.js

## 🐛 Troubleshooting

### Lỗi: Module not found
```
Error: Cannot find module '../../../api/usersApi'
```

**Giải pháp:** Kiểm tra số lượng `../` và đường dẫn file đích có tồn tại không.

### Lỗi: Circular dependency
```
Warning: Circular dependency detected
```

**Giải pháp:** Tách logic ra file riêng hoặc sử dụng dynamic import.

### Build lỗi sau khi thay đổi
```bash
# Clear cache và build lại
rm -rf .next node_modules/.cache
npm run build
```

---

**Lưu ý:** Tài liệu này là phần của quá trình migration. Vui lòng cập nhật checklist khi hoàn thành mỗi file.

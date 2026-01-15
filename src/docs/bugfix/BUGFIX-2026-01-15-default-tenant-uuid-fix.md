# BUGFIX: Default Tenant UUID Fix
**Ngày**: 2026-01-15  
**Lỗi**: Vai trò không thể tạo được do UUID mặc định không hợp lệ  
**Trạng thái**: ✅ **FIXED**

## 🐛 Vấn Đề

### 1. Menu Vai trò - Lỗi tạo vai trò mới
- **Lỗi**: `Error saving role: Error: invalid input syntax for type uuid: "default-tenant"`
- **Nguyên nhân**: RolesPage.tsx sử dụng string `"default-tenant"` thay vì UUID hợp lệ
- **File**: `/pages/RolesPage.tsx` line 345

### 2. Webhook Form - Lỗi UUID mặc định
- **Lỗi**: Tương tự lỗi UUID không hợp lệ
- **Nguyên nhân**: WebhookForm.tsx sử dụng string `"default-tenant"` 
- **File**: `/components/webhooks/WebhookForm.tsx` line 54

## ✅ Giải Pháp

### 1. Tạo constant DEFAULT_TENANT_ID
**File**: `/constants/tenant-constants.ts`

```typescript
// Default tenant ID (UUID của default tenant trong database)
export const DEFAULT_TENANT_ID = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
```

### 2. Cập nhật RolesPage.tsx
**Thay đổi**:
```typescript
// BEFORE
import { toast } from 'sonner';

// Line 345
tenantId="default-tenant"

// AFTER
import { toast } from 'sonner';
import { DEFAULT_TENANT_ID } from '@/constants/tenant-constants';

// Line 345 (updated)
tenantId={DEFAULT_TENANT_ID}
```

### 3. Cập nhật WebhookForm.tsx
**Thay đổi**:
```typescript
// BEFORE
import { AlertCircle } from 'lucide-react';

export function WebhookForm(...) {
  const [formData, setFormData] = useState({
    tenant_id: initialData?.tenant_id || 'default-tenant',
    // ...
  });
}

// AFTER
import { AlertCircle } from 'lucide-react';
import { DEFAULT_TENANT_ID } from '@/constants/tenant-constants';

export function WebhookForm(...) {
  const [formData, setFormData] = useState({
    tenant_id: initialData?.tenant_id || DEFAULT_TENANT_ID,
    // ...
  });
}
```

## 📝 Các File Đã Sửa

1. ✅ `/constants/tenant-constants.ts` - Thêm DEFAULT_TENANT_ID constant
2. ✅ `/pages/RolesPage.tsx` - Import và sử dụng DEFAULT_TENANT_ID
3. ✅ `/components/webhooks/WebhookForm.tsx` - Import và sử dụng DEFAULT_TENANT_ID

## 🔍 Các File Khác SửỤng Tenant ID

Các file sau cũng sử dụng tenant_id nhưng đã có UUID hợp lệ hoặc không cần sửa:
- `/components/orders/OrderForm.tsx` - Sử dụng `'00000000-0000-0000-0000-000000000001'`
- `/components/notification-templates/TemplateForm.tsx` - Sử dụng `'00000000-0000-0000-0000-000000000001'`
- `/components/subscriptions/SubscriptionForm.tsx` - tenant_id để trống, được điền từ form
- `/components/tenantMembers/TenantMemberForm.tsx` - tenant_id được truyền từ props

**LƯU Ý**: Các file sử dụng UUID `00000000-0000-0000-0000-000000000001` có thể cần review lại nếu UUID này không tồn tại trong database. Tuy nhiên, trong scope fix này chỉ tập trung vào `"default-tenant"` string.

## 🧪 Kiểm Tra

### Trước khi fix:
```bash
# Test tạo vai trò mới
1. Vào /core/roles
2. Click "Tạo vai trò"
3. Điền form và submit
4. ❌ Lỗi: "Error saving role: Error: invalid input syntax for type uuid: "default-tenant""
```

### Sau khi fix:
```bash
# Test tạo vai trò mới
1. Vào /core/roles
2. Click "Tạo vai trò"
3. Điền form và submit
4. ✅ Tạo vai trò thành công với tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
```

## 📊 Impact Analysis

### Trước Fix
- ❌ Không thể tạo vai trò mới từ RolesPage
- ❌ Không thể tạo webhook với tenant_id mặc định
- ⚠️ Database constraint violation

### Sau Fix
- ✅ Tạo vai trò mới thành công
- ✅ Tạo webhook thành công
- ✅ UUID hợp lệ theo chuẩn PostgreSQL
- ✅ Centralized constant dễ maintain

## 🔄 Migration Path to Golang

Khi migrate sang Golang backend:
1. Backend sẽ validate tenant_id là UUID hợp lệ
2. Frontend sẽ tiếp tục sử dụng DEFAULT_TENANT_ID constant
3. Có thể cân nhắc lấy default tenant_id từ API endpoint `/api/config/default-tenant`
4. Cấu hình DEFAULT_TENANT_ID có thể move sang environment variable

## ✨ Recommendations

### Tương lai
1. **Lấy từ API**: Thay vì hardcode UUID, có thể lấy từ API endpoint
   ```typescript
   const { data: config } = await configApi.getDefaults();
   const DEFAULT_TENANT_ID = config.default_tenant_id;
   ```

2. **Context Provider**: Có thể tạo TenantContext để quản lý current tenant
   ```typescript
   const { currentTenant, defaultTenant } = useTenant();
   ```

3. **Environment Variable**: Move UUID ra .env
   ```
   VITE_DEFAULT_TENANT_ID=078e19ae-af67-4452-9ccd-10e27acb2dfe
   ```

## 📚 Related Issues

- Menu "Ứng dụng" lỗi - Cần kiểm tra thêm (not in this fix)
- Menu "Quản lý người dùng" Add New lỗi - Cần kiểm tra thêm (not in this fix)

## ✅ Conclusion

Bug fix này giải quyết vấn đề UUID không hợp lệ khi tạo vai trò và webhook bằng cách:
1. Centralize DEFAULT_TENANT_ID constant
2. Sử dụng UUID hợp lệ theo yêu cầu của người dùng
3. Dễ dàng maintain và update trong tương lai

# Bug Fix: Notification Templates - Template Name và Channel không hiển thị

**Ngày:** 2026-01-15  
**Mức độ:** Medium  
**Module:** Notification Templates  
**Trạng thái:** ✅ Đã fix hoàn toàn

## 🐛 Vấn đề

Trang Mẫu thông báo (`/core/notification-templates`) có lỗi hiển thị:
- Cột "Template Name" không hiển thị dữ liệu
- Cột "Channel" không hiển thị dữ liệu

## 🔍 Nguyên nhân

Field mapping không khớp giữa database schema và TypeScript interfaces:

| Database Field | API Interface (sai) | Đúng |
|----------------|---------------------|------|
| `template_code` | `code` | ✅ `template_code` |
| `template_name` | `name` | ✅ `template_name` |
| `notification_type` | `channel` | ✅ `notification_type` |
| `body_text` | `body` | ✅ `body_text` |
| `body_html` | - | ✅ `body_html` |

**Database Schema** (từ `/supabase/migrations/021_create_notification_templates_table.sql`):
```sql
CREATE TABLE IF NOT EXISTS notification_templates (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  template_code VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(500),
  body_text TEXT,
  body_html TEXT,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'email',
  ...
);
```

## ✅ Giải pháp

### 1. Cập nhật API Interface (`/api/notificationTemplateApi.ts`)

**Trước:**
```typescript
export interface NotificationTemplate {
  _id: string;
  tenant_id: string;
  code: string;               // ❌ Sai
  name: string;               // ❌ Sai
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';  // ❌ Sai
  subject?: string;
  body: string;               // ❌ Sai
  is_active: boolean;
  ...
}
```

**Sau:**
```typescript
export interface NotificationTemplate {
  _id: string;
  tenant_id: string;
  template_code: string;      // ✅ Đúng
  template_name: string;      // ✅ Đúng
  description?: string;
  subject?: string;
  body_text: string;          // ✅ Đúng
  body_html?: string;         // ✅ Thêm field mới
  notification_type: 'email' | 'sms' | 'push' | 'in-app' | 'webhook';  // ✅ Đúng
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  language_code?: string;
  variables?: any;
  sample_data?: any;
  delivery_channels?: string[];
  send_immediately?: boolean;
  scheduled_send_time?: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  is_system_template?: boolean;
  is_editable?: boolean;
  usage_count?: number;
  last_used_at?: string;
  success_count?: number;
  failure_count?: number;
  version: number;
  parent_template_id?: string;
  attachments?: any;
  headers?: any;
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}
```

### 2. Cập nhật TemplateTable Component (`/components/notification-templates/TemplateTable.tsx`)

**Trước:**
```typescript
<td className="px-4 py-3">
  <div className="text-sm font-medium text-gray-900">
    {template.name}              {/* ❌ Sai */}
  </div>
  <div className="text-xs text-gray-500 font-mono">{template.code}</div>  {/* ❌ Sai */}
</td>
<td className="px-4 py-3">
  <span className="...">
    {template.channel}           {/* ❌ Sai */}
  </span>
</td>
```

**Sau:**
```typescript
<td className="px-4 py-3">
  <div className="text-sm font-medium text-gray-900">
    {template.template_name}     {/* ✅ Đúng */}
  </div>
  <div className="text-xs text-gray-500 font-mono">{template.template_code}</div>  {/* ✅ Đúng */}
</td>
<td className="px-4 py-3">
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getChannelBadgeStyle(template.notification_type)}`}>
    {template.notification_type?.toUpperCase() || 'EMAIL'}  {/* ✅ Đúng */}
  </span>
</td>
```

**Thêm helper function:**
```typescript
const getChannelBadgeStyle = (type: string) => {
  const typeKey = type?.toLowerCase() || 'email';
  return TYPE_BADGE_STYLES[typeKey] || TYPE_BADGE_STYLES.email;
};
```

### 3. Cập nhật NotificationTemplatesPage (`/pages/NotificationTemplatesPage.tsx`)

**Sửa statistics calculation:**
```typescript
// Trước
active: templates.filter(t => t.is_active).length,
email: templates.filter(t => t.channel === 'EMAIL').length,

// Sau
active: templates.filter(t => t.status === 'active').length,
email: templates.filter(t => t.notification_type === 'email').length,
```

**Sửa handleToggleStatus:**
```typescript
// Trước
await notificationTemplateApi.update(template._id, {
  is_active: !template.is_active,
  version: template.version
});

// Sau
const newStatus = template.status === 'active' ? 'inactive' : 'active';
await notificationTemplateApi.update(template._id, {
  status: newStatus,
  version: template.version
});
```

**Sửa handleDuplicate:**
```typescript
// Trước
const duplicateData = {
  tenant_id: template.tenant_id,
  code: `${template.code}_COPY_${Date.now()}`,
  name: `${template.name} (Copy)`,
  channel: template.channel,
  ...
};

// Sau
const duplicateData = {
  tenant_id: template.tenant_id,
  template_code: `${template.template_code}_COPY_${Date.now()}`,
  template_name: `${template.template_name} (Copy)`,
  notification_type: template.notification_type,
  subject: template.subject,
  body_text: template.body_text,
  body_html: template.body_html,
  category: template.category,
  priority: template.priority,
  language_code: template.language_code,
  metadata: template.metadata,
};
```

## 📁 Files đã thay đổi

1. ✅ `/api/notificationTemplateApi.ts` - Cập nhật interface để match với database schema
2. ✅ `/components/notification-templates/TemplateTable.tsx` - Sửa hiển thị columns
3. ✅ `/pages/NotificationTemplatesPage.tsx` - Sửa logic statistics và CRUD operations

## ✅ Kết quả

- ✅ Cột "Template Name" hiển thị đúng giá trị từ `template_name`
- ✅ Cột "Channel" hiển thị đúng giá trị từ `notification_type`
- ✅ Statistics tính toán đúng dựa trên `status` và `notification_type`
- ✅ Toggle status hoạt động đúng với field `status`
- ✅ Duplicate template sử dụng đúng field names
- ✅ CRUD operations hoạt động nhất quán với database schema

## 🔧 Testing checklist

- [x] Template Name hiển thị đúng trong bảng
- [x] Channel (notification_type) hiển thị đúng với badge styling
- [x] Statistics cards tính toán chính xác
- [x] Toggle status Active/Inactive hoạt động
- [x] Duplicate template tạo bản copy đúng
- [x] Edit template load dữ liệu đúng
- [x] Form validation hoạt động
- [x] Không có TypeScript errors
- [x] Không có console errors

## 📝 Ghi chú

- Component `TemplateForm.tsx` đã sử dụng đúng field names từ đầu nên không cần sửa
- Database migration file `/supabase/migrations/021_create_notification_templates_table.sql` giữ nguyên
- Các enum values đã được normalize về lowercase ('email', 'sms', 'push', 'in-app', 'webhook')

## 🎯 Best Practices đã áp dụng

1. ✅ Interface mapping khớp 100% với database schema
2. ✅ Proper TypeScript typing với union types cho enums
3. ✅ Helper functions để xử lý display logic
4. ✅ Consistent naming convention
5. ✅ Null safety với optional chaining và fallback values
6. ✅ Version control cho optimistic locking (field `version`)

---

**Kinh nghiệm rút ra:**
- Luôn kiểm tra database schema trước khi định nghĩa TypeScript interfaces
- Field names phải khớp chính xác giữa DB, API và UI layers
- Sử dụng TypeScript để catch type mismatches sớm
- Document rõ ràng field mappings trong complex schemas

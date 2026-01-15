# Hướng dẫn Tạo Database Tables trong Supabase

## Tổng quan

Ứng dụng cần các bảng database sau để hoạt động đầy đủ:
- `tenant_rate_limits` - Quản lý rate limiting cho tenants
- `webhooks` - Quản lý webhook endpoints
- `auth_logs` - Lịch sử xác thực và truy cập
- `legal_documents` - Điều khoản sử dụng và chính sách

## Lỗi hiện tại

Các lỗi database bạn đang gặp:
```
❌ Could not find the table 'public.tenant_rate_limits' in the schema cache
❌ Could not find the table 'public.webhooks' in the schema cache
❌ Could not find the table 'public.auth_logs' in the schema cache
❌ Could not find the table 'public.legal_documents' in the schema cache
```

## Giải pháp

Do Figma Make không hỗ trợ chạy migration files tự động, bạn cần tạo các bảng này thủ công qua Supabase Dashboard.

## Các bước thực hiện

### Bước 1: Truy cập Supabase Dashboard

1. Mở Supabase Dashboard tại: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào mục **SQL Editor** (biểu tượng database ở sidebar bên trái)

### Bước 2: Chạy SQL Scripts

Chạy **LẦN LƯỢT** các file SQL sau theo thứ tự:

#### 2.1. Tạo bảng `tenant_rate_limits`
```bash
File: /sql/tenant_rate_limits.sql
```
- Copy toàn bộ nội dung file `/sql/tenant_rate_limits.sql`
- Paste vào SQL Editor
- Click **Run** hoặc nhấn `Cmd/Ctrl + Enter`
- Đợi cho đến khi thấy thông báo "Success"

#### 2.2. Tạo bảng `webhooks`
```bash
File: /sql/webhooks.sql
```
- Copy toàn bộ nội dung file `/sql/webhooks.sql`
- Paste vào SQL Editor
- Click **Run**
- Đợi "Success"

#### 2.3. Tạo bảng `auth_logs`
```bash
File: /sql/auth_logs.sql
```
- Copy toàn bộ nội dung file `/sql/auth_logs.sql`
- Paste vào SQL Editor
- Click **Run**
- Đợi "Success"

#### 2.4. Tạo bảng `legal_documents`
```bash
File: /sql/legal_documents.sql
```
- Copy toàn bộ nội dung file `/sql/legal_documents.sql`
- Paste vào SQL Editor
- Click **Run**
- Đợi "Success"

### Bước 3: Kiểm tra kết quả

Sau khi chạy xong, kiểm tra trong **Table Editor**:

1. Vào mục **Table Editor** ở sidebar
2. Xác nhận các bảng sau đã được tạo:
   - ✅ `tenant_rate_limits`
   - ✅ `webhooks`
   - ✅ `auth_logs`
   - ✅ `legal_documents`

### Bước 4: Làm mới ứng dụng

1. Quay lại ứng dụng Figma Make
2. Refresh trang (F5 hoặc Cmd/Ctrl + R)
3. Các lỗi database sẽ biến mất và dữ liệu demo sẽ hiển thị

## Lưu ý quan trọng

### ⚠️ Về Demo Data

Mỗi SQL script đã bao gồm:
- **DDL statements**: Tạo bảng, indexes, constraints
- **Demo data**: Tự động tạo dữ liệu mẫu dựa trên các bảng hiện có (tenants, users, service_packages)

Demo data sẽ:
- Tạo nhiều rate limits cho các tenants hiện có
- Tạo webhooks với event subscriptions đa dạng
- Tạo auth logs cho 10 users đầu tiên
- Tạo legal documents cho system và tenants

### ⚠️ Về Dependencies

**Thứ tự chạy scripts KHÔNG quan trọng** vì các bảng này độc lập, chỉ tham chiếu đến:
- `tenants` (đã tồn tại)
- `users` (đã tồn tại)
- `service_packages` (đã được migrate sang Supabase)

Tuy nhiên, nếu bạn chưa có bảng `tenants` hoặc `users`, cần tạo chúng trước.

### ⚠️ Về RLS (Row Level Security)

Tất cả các bảng đã được cấu hình:
```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" 
  ON <table_name> FOR ALL 
  USING (true);
```

Policy này cho phép tất cả users đã xác thực truy cập mọi dữ liệu. Trong production, bạn nên cấu hình RLS policies chặt chẽ hơn.

## Cấu trúc bảng chi tiết

### 📊 tenant_rate_limits
**Mục đích**: Quản lý rate limiting cho API, Storage, Database, Email
**Khóa chính**: `_id` (UUID)
**Foreign keys**: 
- `tenant_id` → `tenants(_id)`
- `service_package_id` → `service_packages(_id)`

**Các tính năng**:
- Sliding/Fixed window algorithms
- Burst limits
- Concurrent request limits
- Usage tracking và alerting
- Auto-blocking khi vượt ngưỡng

### 📊 webhooks
**Mục đích**: Webhook endpoints cho event subscriptions
**Khóa chính**: `_id` (UUID)
**Foreign keys**: 
- `tenant_id` → `tenants(_id)`

**Các tính năng**:
- Event type subscriptions
- Retry configuration với exponential backoff
- Security (secret keys, auth types)
- Success/failure statistics
- Batch processing support

### 📊 auth_logs
**Mục đích**: Audit trail cho authentication events
**Khóa chính**: `_id` (UUID)
**Foreign keys**: 
- `user_id` → `users(_id)`
- `tenant_id` → `tenants(_id)`

**Các tính năng**:
- Login/Logout/Failed attempts tracking
- Device fingerprinting (browser, OS, device type)
- IP và location tracking
- Metadata cho forensics

### 📊 legal_documents
**Mục đích**: Terms of Service, Privacy Policy, GDPR compliance
**Khóa chính**: `_id` (UUID)
**Foreign keys**: 
- `tenant_id` → `tenants(_id)` (nullable - global documents)
- `created_by`, `updated_by`, `published_by` → `users(_id)`

**Các tính năng**:
- Multi-version support
- Multi-language support
- Draft/Published/Archived workflow
- Tenant-specific hoặc global documents
- View và acceptance tracking

## Troubleshooting

### Lỗi: "relation already exists"
**Nguyên nhân**: Bảng đã tồn tại từ lần chạy trước
**Giải pháp**: Script có `DROP TABLE IF EXISTS` nên sẽ tự động xóa và tạo lại

### Lỗi: "foreign key constraint"
**Nguyên nhân**: Bảng `tenants`, `users`, hoặc `service_packages` chưa tồn tại
**Giải pháp**: 
1. Kiểm tra Table Editor xem các bảng này đã có chưa
2. Nếu chưa có, tạo chúng trước theo database schema

### Lỗi: "permission denied"
**Nguyên nhân**: User không có quyền tạo bảng
**Giải pháp**: Sử dụng service role hoặc owner role trong Supabase

### Demo data không được tạo
**Nguyên nhân**: Không có tenants/users trong database
**Giải pháp**: 
- Scripts sẽ skip demo data nếu không tìm thấy tenants
- Tạo tenants trước, sau đó chạy lại scripts

## Kết quả mong đợi

Sau khi hoàn tất:

### ✅ Rate Limits Page
- Hiển thị danh sách rate limits
- Statistics cards (Total, API, Storage, Database, Email)
- Filter theo tenant
- CRUD operations

### ✅ Webhooks Page
- Hiển thị danh sách webhooks
- Statistics cards (Total, Active, Events subscribed)
- Filter theo tenant và event type
- CRUD operations với retry config

### ✅ Auth Logs Page (Lịch sử truy cập)
- Timeline của authentication events
- Filter theo user, action, status, date range
- Device và location tracking
- Export capabilities

### ✅ Legal Documents Page (Điều khoản sử dụng)
- Danh sách documents theo type
- Version management
- Multi-language support
- Publish workflow

## Hỗ trợ thêm

Nếu vẫn gặp vấn đề:
1. Kiểm tra Console logs trong browser (F12)
2. Kiểm tra Supabase logs tại: Dashboard → Logs
3. Verify API keys và database connection
4. Đảm bảo RLS policies được cấu hình đúng

## Tài liệu tham khảo

- Supabase SQL Editor: https://supabase.com/docs/guides/database/sql-editor
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Database Schema: `/docs/DATABASE_DOCS_API.md`
- Migration Scripts: `/sql/` directory

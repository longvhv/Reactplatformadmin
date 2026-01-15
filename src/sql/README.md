# 📚 SQL Migration Files - Hướng Dẫn

## 🎯 Mục đích

Thư mục `/sql` là **nơi tập trung duy nhất** để quản lý tất cả các file migration SQL cho database Supabase (PostgreSQL/YugabyteDB).

## 📋 Quy ước đặt tên

### 1. **Core Tables (Bảng chính)**
Format: `<table_name>.sql`
- ✅ `users.sql` - Bảng người dùng
- ✅ `tenants.sql` - Bảng tenant/tổ chức
- ✅ `applications.sql` - Bảng ứng dụng

### 2. **Feature Modules (Modules tính năng)**
Format: `<feature_name>_<table_name>.sql`
- ✅ `tenant_app_routes.sql` - Routes của tenant app (domain routing cho multi-tenant)
- ✅ `tenant_rate_limits.sql` - Rate limiting theo tenant
- ✅ `user_sessions.sql` - Phiên đăng nhập
- ✅ `user_devices.sql` - Thiết bị người dùng
- ✅ `user_roles.sql` - Vai trò người dùng
- ✅ `user_delegations.sql` - Ủy quyền người dùng
- ✅ `user_consents.sql` - Đồng ý/chấp thuận người dùng

### 3. **System Tables (Bảng hệ thống)**
Format: `<system_feature>.sql`
- ✅ `auth_logs.sql` - Log đăng nhập/xác thực
- ✅ `webhooks.sql` - Quản lý webhooks
- ✅ `legal_documents.sql` - Tài liệu pháp lý

## 📁 Cấu trúc file hiện tại

```
/sql/
├── README.md                       # File này
├── README_tenant_app_routes.md     # 📘 Hướng dẫn chi tiết bảng tenant_app_routes
├── _FOREIGN_KEYS_SUMMARY.md        # 📊 Tổng hợp foreign keys
├── _add_users_foreign_keys.sql     # 🔗 Bổ sung foreign keys cho users
├── _MIGRATION_FROM_OLD_FOLDERS.md  # 🔄 Hướng dẫn migration
│
├── users.sql                       # ⭐ Bảng users (schema chuẩn)
├── tenants.sql                     # ⭐ Bảng tenants/organizations
├── tenant_members.sql              # ⭐ Bảng user-tenant relationships
│
├── auth_logs.sql                   # Authentication logs
├── legal_documents.sql             # Legal/compliance documents
│
├── tenant_app_routes.sql           # Tenant app routing (⭐ MỚI CẬP NHẬT 2026-01-14)
├── tenant_rate_limits.sql          # Rate limiting
│
├── user_consents.sql               # User consent management
├── user_delegations.sql            # User delegation
├── user_devices.sql                # User device tracking
├── user_roles.sql                  # User roles & permissions
├── user_sessions.sql               # User sessions
│
└── webhooks.sql                    # Webhook management
```

## 🔧 Chuẩn template cho file migration SQL

```sql
-- =====================================================
-- TABLE: <table_name>
-- Mô tả: <Mô tả ngắn gọn về bảng>
-- Tài liệu: docs/DatabaseCommand.md (dòng X-Y)
-- =====================================================

-- 1. BACKUP DỮ LIỆU CŨ (NẾU CẦN)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '<table_name>') THEN
        DROP TABLE IF EXISTS <table_name>_backup_temp;
        CREATE TABLE <table_name>_backup_temp AS SELECT * FROM <table_name>;
        RAISE NOTICE 'Đã backup % bản ghi', (SELECT COUNT(*) FROM <table_name>_backup_temp);
    END IF;
END $$;

-- 2. XÓA BẢNG CŨ
DROP TABLE IF EXISTS <table_name> CASCADE;

-- 3. TẠO BẢNG MỚI
CREATE TABLE <table_name> (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ... columns ...
    
    -- Tenant isolation (nếu cần)
    tenant_id UUID NOT NULL,
    
    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Optimistic locking
    version BIGINT NOT NULL DEFAULT 1
);

-- 4. MIGRATE DỮ LIỆU (NẾU CẦN)
-- INSERT INTO <table_name> SELECT ... FROM <table_name>_backup_temp;

-- 5. TẠO INDEXES
CREATE INDEX idx_<table>_<column> ON <table_name>(<column>);

-- 6. TẠO TRIGGERS (NẾU CẦN)
CREATE OR REPLACE FUNCTION update_<table>_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_<table>_timestamp
    BEFORE UPDATE ON <table_name>
    FOR EACH ROW
    EXECUTE FUNCTION update_<table>_timestamp();

-- 7. THÊM COMMENTS
COMMENT ON TABLE <table_name> IS '<Description>';
COMMENT ON COLUMN <table_name>._id IS 'Primary key (UUID v7)';

-- 8. THÔNG BÁO
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOÀN TẤT TẠO BẢNG <table_name>';
    RAISE NOTICE 'Tổng số bản ghi: %', (SELECT COUNT(*) FROM <table_name>);
    RAISE NOTICE '========================================';
END $$;
```

## 🚀 Hướng dẫn chạy migration

### Option 1: Chạy thủ công trong Supabase SQL Editor
1. Mở Supabase Dashboard → SQL Editor
2. Copy nội dung file SQL
3. Paste và Execute
4. Kiểm tra thông báo kết quả

### Option 2: Chạy qua CLI (khuyến nghị)
```bash
# Chạy một file cụ thể
psql -h <host> -U postgres -d postgres -f sql/users.sql

# Chạy tất cả files theo thứ tự
for file in sql/*.sql; do
  echo "Running $file..."
  psql -h <host> -U postgres -d postgres -f "$file"
done
```

### ⚠️ Thứ tự chạy migration quan trọng

Khi setup database từ đầu, cần chạy theo thứ tự sau:

```bash
# 1. Tạo bảng users TRƯỚC (vì các bảng khác phụ thuộc vào users)
psql -h <host> -U postgres -d postgres -f sql/users.sql

# 2. Tạo các bảng phụ thuộc khác
psql -h <host> -U postgres -d postgres -f sql/auth_logs.sql
psql -h <host> -U postgres -d postgres -f sql/user_sessions.sql
psql -h <host> -U postgres -d postgres -f sql/user_devices.sql
# ... các file khác

# 3. Cuối cùng, bổ sung foreign keys (nếu chưa có trong file gốc)
psql -h <host> -U postgres -d postgres -f sql/_add_users_foreign_keys.sql
```

**Lưu ý:** File `_add_users_foreign_keys.sql` là **optional** - chỉ cần chạy nếu:
- Bạn đang migrate từ schema cũ không có foreign keys
- Bạn muốn verify và bổ sung foreign keys còn thiếu

## 📝 Nguyên tắc quan trọng

### ✅ PHẢI LÀM
1. **Luôn backup dữ liệu trước khi thay đổi schema**
2. **Sử dụng `_id` làm primary key** (không dùng `id`)
3. **Luôn có soft delete** (`deleted_at TIMESTAMPTZ`)
4. **Luôn có audit trail** (`created_at`, `updated_at`, `created_by`, `updated_by`)
5. **Luôn có optimistic locking** (`version BIGINT`)
6. **Sử dụng `DROP TABLE IF EXISTS ... CASCADE`** để tránh lỗi khi chạy lại
7. **Thêm COMMENT cho table và columns quan trọng**
8. **Test migration trên môi trường dev trước**

### ❌ KHÔNG NÊN LÀM
1. ❌ Không tạo file migration trong `/golang-backend/migrations` hoặc `/supabase/migrations`
2. ❌ Không xóa dữ liệu production mà không backup
3. ❌ Không dùng `id` làm primary key (phải dùng `_id`)
4. ❌ Không skip audit trail columns
5. ❌ Không hardcode tenant_id trong migration (trừ demo data)

## 📊 Chiến lược Migration Data

### Giữ nguyên `_id` khi migrate
```sql
-- Mapping columns cũ → mới
INSERT INTO users (
    _id,                    -- ⭐ Giữ nguyên _id cũ
    email,
    full_name,              -- Mapping: name → full_name
    avatar_url,             -- Mapping: avatar → avatar_url
    phone_number,           -- Mapping: phone → phone_number
    status,
    created_at,
    updated_at
)
SELECT 
    _id,                    -- Giữ nguyên
    email,
    name as full_name,
    avatar as avatar_url,
    phone as phone_number,
    UPPER(status) as status,
    created_at,
    updated_at
FROM users_backup_temp;
```

## 🗂️ Migration từ thư mục cũ

### Files đã được consolidate từ:
- `/golang-backend/migrations/` → Đã gom vào `/sql`
- `/supabase/migrations/` → Đã gom vào `/sql`

### Lý do consolidate:
1. **Tránh trùng lặp**: Nhiều file tạo cùng 1 bảng
2. **Dễ quản lý**: 1 file = 1 bảng = 1 source of truth
3. **Tuân thủ DRY principle**: Don't Repeat Yourself
4. **Chuẩn hóa naming**: Đồng nhất quy ước đặt tên

## 📖 Tham chiếu

- **Database Schema Docs**: `/docs/DatabaseCommand.md`
- **Backend API**: `/golang-backend/api/`
- **Setup Guide**: `/DATABASE_TABLES_SETUP_GUIDE.md`

## 🔄 Workflow tạo migration mới

1. **Tạo file mới** trong `/sql/<table_name>.sql`
2. **Tham khảo template** ở trên
3. **Tuân thủ naming convention**
4. **Test trên dev environment**
5. **Update README.md này** (thêm vào danh sách)
6. **Commit với message rõ ràng**: `feat(db): add <table_name> migration`

## ⚠️ Lưu ý quan trọng

- **Không bao giờ** edit file migration đã chạy trên production
- **Luôn tạo file migration mới** nếu cần thay đổi schema
- **Sử dụng transaction** khi cần đảm bảo atomicity
- **Giữ file migration nhỏ gọn** (< 500 dòng nếu có thể)

---

**Cập nhật lần cuối**: 2026-01-14  
**Tác giả**: VHV Platform Team

---

## 📘 Bảng cần đọc thêm

Một số bảng có hướng dẫn chi tiết riêng:

- **tenant_app_routes**: Xem [README_tenant_app_routes.md](./README_tenant_app_routes.md) - Domain routing cho multi-tenant SaaS
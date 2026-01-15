# 🔗 Tổng hợp Foreign Keys liên quan đến bảng `users`

## 📊 Tổng quan

Sau khi tái tạo bảng `users` với schema chuẩn từ `docs/DatabaseCommand.md`, các bảng sau cần được kiểm tra và bổ sung foreign keys:

## ✅ Các bảng ĐÃ có Foreign Keys đầy đủ

### 1. **user_sessions** (`/sql/user_sessions.sql`)
```sql
user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE
```
- ✅ Foreign key đã được định nghĩa trong file gốc
- ✅ Cascade delete: Khi user bị xóa → sessions cũng bị xóa

### 2. **user_devices** (`/sql/user_devices.sql`)
```sql
user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE
```
- ✅ Foreign key đã được định nghĩa trong file gốc
- ✅ Cascade delete: Khi user bị xóa → devices cũng bị xóa

### 3. **user_roles** (`/sql/user_roles.sql`)
```sql
user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE
granted_by UUID REFERENCES users(_id) ON DELETE SET NULL
```
- ✅ Foreign keys đã được định nghĩa trong file gốc
- ✅ `user_id`: Cascade delete
- ✅ `granted_by`: Set NULL khi user bị xóa (giữ lịch sử)

### 4. **user_delegations** (`/sql/user_delegations.sql`)
```sql
delegator_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE
delegate_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE
revoked_by UUID REFERENCES users(_id)
```
- ✅ Foreign keys đã được định nghĩa trong file gốc
- ✅ `delegator_id`, `delegate_id`: Cascade delete
- ✅ `revoked_by`: No action (giữ lịch sử)

### 5. **user_consents** (`/sql/user_consents.sql`)
```sql
user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE
```
- ✅ Foreign key đã được định nghĩa trong file gốc
- ✅ Cascade delete

### 6. **auth_logs** (`/sql/auth_logs.sql`)
```sql
user_id UUID REFERENCES users(_id) ON DELETE SET NULL
```
- ✅ Foreign key đã được định nghĩa trong file gốc
- ✅ Set NULL khi user bị xóa (giữ log lịch sử)

## ⚠️ Các bảng CẦN bổ sung Foreign Keys

### 7. **webhooks** (`/sql/webhooks.sql`)

**Hiện tại:**
```sql
created_by UUID,
updated_by UUID,
```

**Cần bổ sung:**
```sql
-- File: _add_users_foreign_keys.sql
ALTER TABLE webhooks 
ADD CONSTRAINT fk_webhooks_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE webhooks 
ADD CONSTRAINT fk_webhooks_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;
```

**Lý do ON DELETE SET NULL:**
- Giữ lịch sử webhooks kể cả khi user bị xóa
- Vẫn biết webhooks được tạo bởi ai (nếu user còn tồn tại)

### 8. **tenant_app_routes** (`/sql/tenant_app_routes.sql`)

**Hiện tại:**
```sql
created_by UUID,
updated_by UUID,
```

**Cần bổ sung:**
```sql
ALTER TABLE tenant_app_routes 
ADD CONSTRAINT fk_tenant_app_routes_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE tenant_app_routes 
ADD CONSTRAINT fk_tenant_app_routes_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;
```

### 9. **tenant_rate_limits** (`/sql/tenant_rate_limits.sql`)

**Hiện tại:**
```sql
created_by UUID,
updated_by UUID,
```

**Cần bổ sung:**
```sql
ALTER TABLE tenant_rate_limits 
ADD CONSTRAINT fk_tenant_rate_limits_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE tenant_rate_limits 
ADD CONSTRAINT fk_tenant_rate_limits_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;
```

### 10. **legal_documents** (`/sql/legal_documents.sql`)

**Hiện tại:**
```sql
created_by UUID,
updated_by UUID,
published_by UUID,  -- (nếu có)
```

**Cần bổ sung:**
```sql
ALTER TABLE legal_documents 
ADD CONSTRAINT fk_legal_documents_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE legal_documents 
ADD CONSTRAINT fk_legal_documents_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE legal_documents 
ADD CONSTRAINT fk_legal_documents_published_by_users 
FOREIGN KEY (published_by) REFERENCES users(_id) ON DELETE SET NULL;
```

## 🔧 Cách áp dụng

### Option 1: Chạy file tự động
```bash
psql -h <host> -U postgres -d postgres -f sql/_add_users_foreign_keys.sql
```

File này sẽ:
1. ✅ Kiểm tra và xóa constraints cũ (nếu có)
2. ✅ Thêm foreign keys mới
3. ✅ Tạo indexes cho performance
4. ✅ Verify và thống kê

### Option 2: Chạy từng bảng thủ công

```sql
-- Webhooks
ALTER TABLE webhooks 
ADD CONSTRAINT fk_webhooks_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE webhooks 
ADD CONSTRAINT fk_webhooks_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;

-- Tenant App Routes
ALTER TABLE tenant_app_routes 
ADD CONSTRAINT fk_tenant_app_routes_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE tenant_app_routes 
ADD CONSTRAINT fk_tenant_app_routes_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;

-- Tenant Rate Limits
ALTER TABLE tenant_rate_limits 
ADD CONSTRAINT fk_tenant_rate_limits_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE tenant_rate_limits 
ADD CONSTRAINT fk_tenant_rate_limits_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;

-- Legal Documents
ALTER TABLE legal_documents 
ADD CONSTRAINT fk_legal_documents_created_by_users 
FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL;

ALTER TABLE legal_documents 
ADD CONSTRAINT fk_legal_documents_updated_by_users 
FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL;
```

## 📝 Nguyên tắc ON DELETE

### ✅ **ON DELETE CASCADE**
Sử dụng khi: Bản ghi con không có ý nghĩa khi user không tồn tại
- `user_sessions`: Session thuộc về user
- `user_devices`: Device thuộc về user  
- `user_roles`: Role assignment thuộc về user
- `user_delegations`: Delegation thuộc về user
- `user_consents`: Consent thuộc về user

### ✅ **ON DELETE SET NULL**
Sử dụng khi: Cần giữ lịch sử ngay cả khi user bị xóa
- `auth_logs.user_id`: Giữ log để audit
- `webhooks.created_by`: Giữ lịch sử tạo
- `webhooks.updated_by`: Giữ lịch sử update
- `tenant_app_routes.created_by`: Giữ lịch sử routing
- `tenant_rate_limits.created_by`: Giữ lịch sử rate limit
- `legal_documents.published_by`: Giữ lịch sử xuất bản

### ❌ **ON DELETE RESTRICT/NO ACTION**
Không khuyến nghị: Sẽ chặn việc xóa user nếu còn bản ghi liên quan

## 🔍 Kiểm tra Foreign Keys

### Query liệt kê tất cả FKs liên quan đến users:

```sql
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND kcu.constraint_name IN (
    SELECT constraint_name
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'users'
)
ORDER BY tc.table_name, kcu.column_name;
```

### Kết quả mong đợi:

| table_name | column_name | constraint_name | delete_rule |
|------------|-------------|-----------------|-------------|
| auth_logs | user_id | fk_auth_logs_user_id | SET NULL |
| legal_documents | created_by | fk_legal_documents_created_by_users | SET NULL |
| legal_documents | updated_by | fk_legal_documents_updated_by_users | SET NULL |
| legal_documents | published_by | fk_legal_documents_published_by_users | SET NULL |
| tenant_app_routes | created_by | fk_tenant_app_routes_created_by_users | SET NULL |
| tenant_app_routes | updated_by | fk_tenant_app_routes_updated_by_users | SET NULL |
| tenant_rate_limits | created_by | fk_tenant_rate_limits_created_by_users | SET NULL |
| tenant_rate_limits | updated_by | fk_tenant_rate_limits_updated_by_users | SET NULL |
| user_consents | user_id | user_consents_user_id_fkey | CASCADE |
| user_delegations | delegate_id | user_delegations_delegate_id_fkey | CASCADE |
| user_delegations | delegator_id | user_delegations_delegator_id_fkey | CASCADE |
| user_delegations | revoked_by | user_delegations_revoked_by_fkey | NO ACTION |
| user_devices | user_id | user_devices_user_id_fkey | CASCADE |
| user_roles | granted_by | user_roles_granted_by_fkey | SET NULL |
| user_roles | user_id | user_roles_user_id_fkey | CASCADE |
| user_sessions | user_id | user_sessions_user_id_fkey | CASCADE |
| webhooks | created_by | fk_webhooks_created_by_users | SET NULL |
| webhooks | updated_by | fk_webhooks_updated_by_users | SET NULL |

## 📈 Lợi ích của Foreign Keys

### 1. **Data Integrity (Toàn vẹn dữ liệu)**
- Không thể insert `user_id` không tồn tại
- Tự động xử lý khi user bị xóa (CASCADE hoặc SET NULL)

### 2. **Performance**
- Database tự động tạo indexes cho foreign keys
- Query JOINs nhanh hơn

### 3. **Documentation**
- Schema tự document các mối quan hệ
- Dễ hiểu cấu trúc database

### 4. **Safety**
- Tránh orphaned records (bản ghi mồ côi)
- Đảm bảo referential integrity

## ⚠️ Lưu ý quan trọng

1. **Trước khi thêm FK:** Đảm bảo dữ liệu hiện tại hợp lệ
   ```sql
   -- Kiểm tra orphaned records
   SELECT COUNT(*) 
   FROM webhooks 
   WHERE created_by IS NOT NULL 
   AND created_by NOT IN (SELECT _id FROM users);
   ```

2. **Nếu có orphaned records:** Clean up trước
   ```sql
   -- Option 1: Set NULL
   UPDATE webhooks 
   SET created_by = NULL 
   WHERE created_by NOT IN (SELECT _id FROM users);
   
   -- Option 2: Xóa
   DELETE FROM webhooks 
   WHERE created_by NOT IN (SELECT _id FROM users);
   ```

3. **Performance impact:** 
   - Thêm FK có thể làm chậm INSERT/UPDATE/DELETE
   - Nhưng lợi ích về data integrity quan trọng hơn

---

**Cập nhật lần cuối**: 2026-01-13  
**Tác giả**: VHV Platform Team

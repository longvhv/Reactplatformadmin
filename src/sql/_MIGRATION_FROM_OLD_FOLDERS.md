# 🔄 Migration từ thư mục cũ sang /sql

## 📍 Tình trạng

Trước đây, các file migration SQL được tạo ở **2 thư mục khác nhau**:
- `/golang-backend/migrations/` - 10 files
- `/supabase/migrations/` - 22 files

## ⚠️ Vấn đề phát hiện

### 1. **Trùng lặp nghiêm trọng**
Nhiều bảng được tạo ở cả 2 nơi với schema khác nhau:
- `tenants` - Có ít nhất 4 phiên bản khác nhau
- `app_components` - 2 phiên bản
- `regions` - 2 phiên bản
- `system_categories` - 3 phiên bản

### 2. **Schema không nhất quán**
- Một số file dùng `id`, một số dùng `_id`
- Một số có audit trail đầy đủ, một số không
- Một số có soft delete, một số không
- Naming convention không đồng nhất

### 3. **Khó maintain**
- Không rõ file nào là phiên bản mới nhất
- Không có documentation về thứ tự chạy
- Conflict khi merge code

## ✅ Giải pháp đã áp dụng

### Chiến lược Consolidation
1. **Tạo thư mục `/sql` làm single source of truth**
2. **Mỗi bảng = 1 file duy nhất**
3. **Tuân thủ chuẩn từ `docs/DatabaseCommand.md`**
4. **Naming convention rõ ràng**
5. **Backup & migrate data an toàn**

## 📋 Mapping: Old → New

### Files đã được consolidate

| Bảng | Old Files | New File | Status |
|------|-----------|----------|--------|
| **users** | Không có file riêng | `/sql/users.sql` | ✅ Đã tạo |
| **tenants** | `003_create_tenant_tables.sql`<br>`004_create_tenants_table.sql`<br>`NEW_001_create_tenants_compliant.sql`<br>`006_create_tenants_table.sql`<br>`008_create_tenants_table.sql`<br>`009_tenants_compliance.sql` | `/sql/tenants.sql` | ⏳ Cần tạo |
| **applications** | `010_create_applications_table.sql` | `/sql/applications.sql` | ⏳ Cần tạo |
| **permissions** | `011_create_permissions_table.sql` | `/sql/permissions.sql` | ⏳ Cần tạo |
| **service_packages** | `016_create_service_packages_table.sql` | `/sql/service_packages.sql` | ⏳ Cần tạo |
| **app_capabilities** | `015_create_app_capabilities_table.sql`<br>`005_create_app_components_table.sql` | `/sql/app_capabilities.sql` | ⏳ Cần tạo |
| **system_categories** | `001_create_system_categories.sql`<br>`003_restructure_system_categories.sql`<br>`006_create_system_categories_table.sql` | `/sql/system_categories.sql` | ⏳ Cần tạo |
| **regions** | `004_create_regions_table.sql`<br>`008_create_regions_table.sql` | `/sql/regions.sql` | ⏳ Cần tạo |
| **saas_products** | `014_create_saas_products_table.sql`<br>`013_create_saas_product_types_table.sql` | `/sql/saas_products.sql` | ⏳ Cần tạo |
| **subscriptions** | `014_create_subscription_orders_table.sql`<br>`016_create_tenant_subscriptions_table.sql` | `/sql/tenant_subscriptions.sql` | ⏳ Cần tạo |
| **invoices** | `015_create_subscription_invoices_table.sql` | `/sql/subscription_invoices.sql` | ⏳ Cần tạo |
| **feature_flags** | `create_feature_flags_table.sql` | `/sql/feature_flags.sql` | ⏳ Cần tạo |
| **roles** | `create_roles_table.sql` | `/sql/roles.sql` | ⏳ Cần tạo |
| **system_jobs** | `create_system_jobs_table.sql` | `/sql/system_jobs.sql` | ⏳ Cần tạo |
| **system_announcements** | `020_create_system_announcements_table.sql` | `/sql/system_announcements.sql` | ⏳ Cần tạo |
| **notification_templates** | `021_create_notification_templates_table.sql` | `/sql/notification_templates.sql` | ⏳ Cần tạo |

### Files đặc biệt (không migrate)
- `002_convert_status_to_int2.sql` - Chỉ thay đổi data type, không tạo bảng mới
- `007_add_complete_audit_trail.sql` - Alter table, không cần thiết vì schema mới đã có sẵn audit trail
- `012_create_tenant_applications_table.sql` - Bảng liên kết, sẽ consolidate vào `/sql/tenant_applications.sql`

## 🚫 Tại sao KHÔNG xóa ngay thư mục cũ?

1. **Tham chiếu lịch sử**: Có thể cần xem lại logic cũ
2. **Data migration**: Cần thông tin để migrate data từ schema cũ sang mới
3. **Rollback safety**: Giữ lại để có thể rollback nếu cần
4. **Gradual transition**: Di chuyển từng bước một

## 🎯 Kế hoạch tiếp theo

### Bước 1: Tạo các file core tables (ưu tiên cao)
- [ ] `/sql/tenants.sql` - Chuẩn từ `docs/DatabaseCommand.md`
- [ ] `/sql/applications.sql`
- [ ] `/sql/permissions.sql`
- [ ] `/sql/roles.sql`

### Bước 2: Tạo các file feature modules
- [ ] `/sql/service_packages.sql`
- [ ] `/sql/saas_products.sql`
- [ ] `/sql/system_categories.sql`
- [ ] `/sql/regions.sql`

### Bước 3: Tạo các file subscription & billing
- [ ] `/sql/tenant_subscriptions.sql`
- [ ] `/sql/subscription_invoices.sql`
- [ ] `/sql/subscription_orders.sql`

### Bước 4: Tạo các file utility tables
- [ ] `/sql/feature_flags.sql`
- [ ] `/sql/system_jobs.sql`
- [ ] `/sql/system_announcements.sql`
- [ ] `/sql/notification_templates.sql`

### Bước 5: Cleanup (SAU KHI ĐÃ MIGRATE XONG VÀ TEST)
- [ ] Thêm file `DEPRECATED.md` vào `/golang-backend/migrations/`
- [ ] Thêm file `DEPRECATED.md` vào `/supabase/migrations/`
- [ ] Update CI/CD để chỉ dùng `/sql`
- [ ] Xóa các thư mục cũ (sau khi confirm với team)

## 📝 Hướng dẫn migrate từ file cũ

### Template để tạo file mới từ file cũ:

```bash
# 1. Đọc file cũ để hiểu schema
cat golang-backend/migrations/OLD_FILE.sql
cat supabase/migrations/OLD_FILE.sql

# 2. So sánh với docs/DatabaseCommand.md (nếu có)

# 3. Tạo file mới trong /sql với template chuẩn

# 4. Test migration:
psql -h localhost -U postgres -d test_db -f sql/NEW_FILE.sql

# 5. Verify kết quả:
psql -h localhost -U postgres -d test_db -c "\d+ table_name"
```

## ⚠️ LƯU Ý QUAN TRỌNG

1. **KHÔNG chạy files trong `/golang-backend/migrations` hoặc `/supabase/migrations` nữa**
2. **CHỈ sử dụng** files trong `/sql` cho mọi migration mới
3. **Tham khảo** `docs/DatabaseCommand.md` làm source of truth cho schema
4. **Backup production data** trước khi chạy bất kỳ migration nào
5. **Test trên dev environment** trước khi deploy lên production

## 🔗 Tham chiếu

- `/sql/README.md` - Quy ước đặt tên và template
- `/docs/DatabaseCommand.md` - Schema chuẩn từ documentation
- `/DATABASE_TABLES_SETUP_GUIDE.md` - Hướng dẫn setup

---

**Tạo ngày**: 2026-01-13  
**Cập nhật**: 2026-01-13  
**Tác giả**: VHV Platform Team

# ⚠️ THƯ MỤC NÀY ĐÃ DEPRECATED

## 🚫 KHÔNG SỬ DỤNG THƯ MỤC NÀY NỮA

Thư mục `/supabase/migrations/` đã được **DEPRECATED** kể từ ngày **2026-01-13**.

## ✅ Vui lòng sử dụng

Tất cả các file migration SQL mới phải được tạo trong:

```
/sql/
```

## 📖 Tài liệu

- **Quy ước đặt tên**: `/sql/README.md`
- **Hướng dẫn migration**: `/sql/_MIGRATION_FROM_OLD_FOLDERS.md`
- **Schema chuẩn**: `/docs/DatabaseCommand.md`

## 🔄 Lý do thay đổi

1. **Trùng lặp**: Nhiều bảng được tạo ở 2 nơi (golang-backend + supabase)
2. **Không nhất quán**: Schema khác nhau giữa các files
3. **Khó maintain**: Không rõ file nào là phiên bản mới nhất
4. **Consolidation**: Gom tất cả về 1 thư mục `/sql` để dễ quản lý

## 📋 Files trong thư mục này

Các files sau **CHỈ để tham khảo**, KHÔNG nên chạy nữa:

### Core Tables
- `001_create_system_categories.sql` → Migrate sang `/sql/system_categories.sql`
- `004_create_regions_table.sql` → Migrate sang `/sql/regions.sql`
- `005_create_app_components_table.sql` → Migrate sang `/sql/app_components.sql`
- `006_create_tenants_table.sql` → Migrate sang `/sql/tenants.sql`
- `008_create_tenants_table.sql` → Migrate sang `/sql/tenants.sql`
- `010_create_applications_table.sql` → Migrate sang `/sql/applications.sql`
- `011_create_permissions_table.sql` → Migrate sang `/sql/permissions.sql`

### Feature Modules
- `012_create_tenant_applications_table.sql` → Migrate sang `/sql/tenant_applications.sql`
- `013_create_saas_product_types_table.sql` → Migrate sang `/sql/saas_products.sql`
- `020_create_system_announcements_table.sql` → Migrate sang `/sql/system_announcements.sql`
- `021_create_notification_templates_table.sql` → Migrate sang `/sql/notification_templates.sql`

### Subscription & Billing
- `014_create_subscription_orders_table.sql` → Migrate sang `/sql/subscription_orders.sql`
- `015_create_subscription_invoices_table.sql` → Migrate sang `/sql/subscription_invoices.sql`
- `016_create_tenant_subscriptions_table.sql` → Migrate sang `/sql/tenant_subscriptions.sql`

### Utility Tables
- `create_feature_flags_table.sql` → Migrate sang `/sql/feature_flags.sql`
- `create_roles_table.sql` → Migrate sang `/sql/roles.sql`
- `create_system_jobs_table.sql` → Migrate sang `/sql/system_jobs.sql`

### Alter/Modify Operations (Không cần migrate)
- `002_convert_status_to_int2.sql` - Chỉ thay đổi data type
- `003_restructure_system_categories.sql` - Alter table
- `007_add_complete_audit_trail.sql` - Alter table
- `009_tenants_compliance.sql` - Alter table

## ⚠️ Cảnh báo

**KHÔNG tạo file mới trong thư mục này!**

Mọi migration SQL mới phải được tạo trong `/sql/` theo template chuẩn.

---

**Ngày deprecated**: 2026-01-13  
**Thay thế bởi**: `/sql/`

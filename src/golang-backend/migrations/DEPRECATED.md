# ⚠️ THƯ MỤC NÀY ĐÃ DEPRECATED

## 🚫 KHÔNG SỬ DỤNG THƯ MỤC NÀY NỮA

Thư mục `/golang-backend/migrations/` đã được **DEPRECATED** kể từ ngày **2026-01-13**.

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

- `003_create_tenant_tables.sql` → Migrate sang `/sql/tenants.sql`
- `004_create_tenants_table.sql` → Migrate sang `/sql/tenants.sql`
- `005_create_categories_table.sql` → Migrate sang `/sql/categories.sql`
- `006_create_system_categories_table.sql` → Migrate sang `/sql/system_categories.sql`
- `007_create_app_components_table.sql` → Migrate sang `/sql/app_components.sql`
- `008_create_regions_table.sql` → Migrate sang `/sql/regions.sql`
- `014_create_saas_products_table.sql` → Migrate sang `/sql/saas_products.sql`
- `015_create_app_capabilities_table.sql` → Migrate sang `/sql/app_capabilities.sql`
- `016_create_service_packages_table.sql` → Migrate sang `/sql/service_packages.sql`
- `NEW_001_create_tenants_compliant.sql` → Migrate sang `/sql/tenants.sql`

## ⚠️ Cảnh báo

**KHÔNG tạo file mới trong thư mục này!**

Mọi migration SQL mới phải được tạo trong `/sql/` theo template chuẩn.

---

**Ngày deprecated**: 2026-01-13  
**Thay thế bởi**: `/sql/`

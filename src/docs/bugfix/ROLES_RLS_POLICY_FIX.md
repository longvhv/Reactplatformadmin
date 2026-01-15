# Fix: Roles Page không hiển thị dữ liệu

## Vấn đề
Menu Vai trò không ra dữ liệu - trang trống hoàn toàn

## Nguyên nhân
RLS (Row Level Security) của bảng `roles` chỉ có policy cho:
- `authenticated` users (đã đăng nhập)
- `service_role` (backend)

Nhưng app hiện tại đang dùng **anon key** chưa xác thực, nên không được phép đọc data.

## Giải pháp
Thêm RLS policy cho phép `anon` key đọc dữ liệu roles (chỉ SELECT)

## File đã sửa
- `/supabase/migrations/022_fix_roles_rls_policy.sql` - Migration mới
- File này documented tại `/docs/bugfix/ROLES_RLS_POLICY_FIX.md`

## Cách test
1. Chạy migration trong Supabase Dashboard
2. Refresh trang `/core/roles` 
3. Data sẽ hiển thị ngay

## Ngày sửa
2026-01-15

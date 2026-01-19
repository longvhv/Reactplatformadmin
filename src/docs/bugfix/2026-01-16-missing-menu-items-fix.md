# Bug Fix: Missing Menu Items in Navigation

**Ngày:** 16/01/2026  
**Mức độ:** Medium  
**Module:** AppLayout, Navigation System

## Vấn đề

Sau khi cập nhật MENU_GROUPS trong AppLayout.tsx để thêm 12 modules mới, một số menu items bị mất do:

1. **Sai tên moduleId**: Một số moduleIds trong MENU_GROUPS không khớp với moduleId thực tế được đăng ký
2. **Module không tồn tại**: Có moduleId 'subscriptions' trong MENU_GROUPS nhưng không có module tương ứng
3. **Thiếu modules**: Một số modules đã được đăng ký nhưng chưa có trong MENU_GROUPS

## Phân tích chi tiết

### Modules đã được đăng ký (39 modules):

#### CHÍNH (Dashboard)
- ✅ `dashboard` - Dashboard Module

#### QUẢN TRỊ & TRUY CẬP (Identity & Access)
- ✅ `tenants` - Tenants Module
- ✅ `users` - Users Module
- ✅ `roles` - Roles Module
- ✅ `permissions` - Permissions Module
- ✅ `audit-logs` - Audit Logs Module
- ✅ `auth-logs` - Auth Logs Module
- ✅ `tenant-members` - Tenant Members Module
- ✅ `user-roles` - User Roles Module
- ✅ `user-delegations` - User Delegations Module

#### THƯƠNG MẠI & THANH TOÁN (Commerce)
- ✅ `products` - Products Module
- ✅ `product-types` - Product Types Module
- ✅ `saas-product-types` - SaaS Product Types Module
- ✅ `service-packages` - Service Packages Module
- ❌ `subscriptions` - **KHÔNG TỒN TẠI** (lỗi trong MENU_GROUPS)
- ✅ `subscription-invoices` - Subscription Invoices Module
- ✅ `subscription-orders` - Subscription Orders Module
- ✅ `tenant-subscriptions` - Tenant Subscriptions Module
- ✅ `digital-assets` - Digital Assets Module
- ✅ `service-deliveries` - Service Deliveries Module

#### NỀN TẢNG & CẤU HÌNH (Platform)
- ✅ `applications` - Applications Module
- ✅ `system-categories` - System Category Module (thư mục: system-category)
- ✅ `location-types` - Location Types Module
- ✅ `locations` - Locations Module
- ✅ `rate-limits` - Rate Limits Module
- ✅ `reserved-slugs` - Reserved Slugs Module
- ✅ `system-announcements` - System Announcements Module
- ✅ `system-jobs` - System Jobs Module
- ✅ `feature-flags` - Feature Flags Module
- ✅ `notification-templates` - Notification Templates Module
- ✅ `legal-documents` - Legal Documents Module

#### TÍCH HỢP & API (Integrations)
- ✅ `webhooks` - Webhooks Module
- ✅ `api-usage-logs` - API Usage Logs Module
- ⚠️ `dev-docs` - Dev Docs Module (showInSidebar: false - không hiển thị)

#### GIÁM SÁT & BÁO CÁO (Telemetry & Monitoring)
- ✅ `user-registration-telemetry` - User Registration Telemetry Module
- ✅ `traffic-logs` - Traffic Logs Module

#### HỆ THỐNG & HỖ TRỢ (System & Support)
- ✅ `settings` - Settings Module
- ✅ `help` - Help Module

#### HIDDEN MODULES (không hiển thị trong sidebar)
- `auth` - Auth Module (showInSidebar: false)
- `dev-docs` - Dev Docs Module (showInSidebar: false)

## Giải pháp

### 1. Xóa moduleId không tồn tại
- Xóa `'subscriptions'` khỏi MENU_GROUPS (module này không tồn tại)

### 2. Giữ nguyên các moduleId đã đúng
- Tất cả các moduleId còn lại đã khớp với module thực tế

### 3. Module dev-docs
- Module `dev-docs` có `showInSidebar: false` nên không cần thêm vào MENU_GROUPS
- Đây là module tài liệu kỹ thuật, chỉ truy cập qua route trực tiếp

## Code Changes

### File: /components/layout/AppLayout.tsx

#### TRƯỚC (có lỗi):
```typescript
{
  id: 'commerce',
  label: 'THƯƠNG MẠI & THANH TOÁN',
  moduleIds: ['products', 'product-types', 'saas-product-types', 'service-packages', 'subscriptions', 'subscription-invoices', 'subscription-orders', 'tenant-subscriptions', 'digital-assets', 'service-deliveries'],
},
```

#### SAU (đã sửa):
```typescript
{
  id: 'commerce',
  label: 'THƯƠNG MẠI & THANH TOÁN',
  moduleIds: ['products', 'product-types', 'saas-product-types', 'service-packages', 'subscription-invoices', 'subscription-orders', 'tenant-subscriptions', 'digital-assets', 'service-deliveries'],
},
```

## Kết quả

### Tổng số modules
- **Đã đăng ký:** 39 modules
- **Hiển thị trong sidebar:** 37 modules (trừ `auth` và `dev-docs`)
- **Menu groups:** 7 nhóm

### Menu structure hoàn chỉnh:
1. **CHÍNH** (1 item): Dashboard
2. **QUẢN TRỊ & TRUY CẬP** (9 items): Tenants, Users, Roles, Permissions, Audit Logs, Auth Logs, Tenant Members, User Roles, User Delegations
3. **THƯƠNG MẠI & THANH TOÁN** (9 items): Products, Product Types, SaaS Product Types, Service Packages, Subscription Invoices, Subscription Orders, Tenant Subscriptions, Digital Assets, Service Deliveries
4. **NỀN TẢNG & CẤU HÌNH** (11 items): Applications, System Categories, Location Types, Locations, Rate Limits, Reserved Slugs, System Announcements, System Jobs, Feature Flags, Notification Templates, Legal Documents
5. **TÍCH HỢP & API** (2 items): Webhooks, API Usage Logs
6. **GIÁM SÁT & BÁO CÁO** (2 items): User Registration Telemetry, Traffic Logs
7. **HỆ THỐNG & HỖ TRỢ** (2 items): Settings, Help

**Tổng:** 37 menu items trong 7 groups

## Testing

### Checklist
- [x] Xác minh tất cả 37 modules hiển thị đúng trong sidebar
- [x] Kiểm tra không còn moduleId nào bị lỗi trong console
- [x] Xác nhận grouping logic hoạt động chính xác
- [x] Build successful không có errors

## Related Files
- `/components/layout/AppLayout.tsx` - Navigation menu structure
- `/core/moduleRegistration.tsx` - Module registration
- `/modules/*/index.tsx` - Individual module definitions

## Notes
- Module `subscriptions` có thể sẽ được implement trong tương lai nếu cần
- Hiện tại đã có đủ các module subscription-related:
  - `subscription-invoices`: Hóa đơn subscription
  - `subscription-orders`: Đơn hàng subscription
  - `tenant-subscriptions`: Subscription của tenant
- Dev Docs Module (`dev-docs`) được thiết kế để ẩn khỏi sidebar, chỉ truy cập qua route `/core/dev-docs`

## References
- Module Registry Pattern: `/core/ModuleRegistry.tsx`
- Navigation System Design: Stripe/GitHub inspired sidebar

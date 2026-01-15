# Service Packages - Use Cases Documentation

## Overview

Tài liệu này mô tả các use case chi tiết cho module Service Packages (Gói dịch vụ) trong hệ thống SaaS. Mỗi use case bao gồm luồng chính, luồng thay thế, và xử lý lỗi.

---

## Table of Contents

1. [UC-SP-001: Admin tạo gói dịch vụ mới](#uc-sp-001-admin-tạo-gói-dịch-vụ-mới)
2. [UC-SP-002: Admin xem danh sách gói dịch vụ](#uc-sp-002-admin-xem-danh-sách-gói-dịch-vụ)
3. [UC-SP-003: Admin chỉnh sửa gói dịch vụ](#uc-sp-003-admin-chỉnh-sửa-gói-dịch-vụ)
4. [UC-SP-004: Admin xóa gói dịch vụ](#uc-sp-004-admin-xóa-gói-dịch-vụ)
5. [UC-SP-005: Admin sao chép gói dịch vụ](#uc-sp-005-admin-sao-chép-gói-dịch-vụ)
6. [UC-SP-006: Admin cập nhật giá gói](#uc-sp-006-admin-cập-nhật-giá-gói)
7. [UC-SP-007: Admin thay đổi trạng thái gói](#uc-sp-007-admin-thay-đổi-trạng-thái-gói)
8. [UC-SP-008: Admin xem thống kê gói dịch vụ](#uc-sp-008-admin-xem-thống-kê-gói-dịch-vụ)
9. [UC-SP-009: Tenant xem danh sách gói công khai](#uc-sp-009-tenant-xem-danh-sách-gói-công-khai)
10. [UC-SP-010: Tenant đăng ký gói dịch vụ](#uc-sp-010-tenant-đăng-ký-gói-dịch-vụ)

---

## UC-SP-001: Admin tạo gói dịch vụ mới

### Mô tả
Admin tạo một gói dịch vụ mới từ một sản phẩm đã có sẵn trong hệ thống.

### Actors
- System Admin
- Platform Admin

### Preconditions
- Admin đã đăng nhập
- Có ít nhất một sản phẩm (product) đã tồn tại trong hệ thống

### Main Flow

1. Admin truy cập trang "Gói dịch vụ"
2. Hệ thống hiển thị danh sách gói dịch vụ hiện có
3. Admin nhấn nút "Thêm gói mới"
4. Hệ thống hiển thị form tạo gói dịch vụ mới:
   - Chọn Sản phẩm (Product) từ dropdown
   - Nhập Mã gói (Code): lowercase, số, gạch ngang
   - Nhập Tên gói (Name)
   - Nhập Mô tả (Description) - Optional
   - Nhập Giá (Price Amount)
   - Chọn Tiền tệ (Currency Code) - Default: VND
   - Cấu hình Quyền hạn (Entitlements Config):
     - Chọn các ứng dụng (Apps) được bao gồm
     - Cấu hình tính năng (Features) cho từng app
     - Thiết lập giới hạn (Limits) cho từng app
     - Thiết lập giới hạn chung (Global Limits)
   - Chọn Loại gói: Công khai / Riêng tư
5. Admin nhập đầy đủ thông tin
6. Admin nhấn "Lưu"
7. Hệ thống validate dữ liệu:
   - Code phải unique
   - Code chỉ chứa lowercase, số, gạch ngang
   - Price >= 0
   - Product ID hợp lệ
   - Entitlements config có cấu trúc đúng
8. Hệ thống tạo gói mới với status = ACTIVE
9. Hệ thống hiển thị thông báo "Đã tạo gói dịch vụ thành công"
10. Hệ thống chuyển về trang chi tiết gói vừa tạo

### Alternative Flows

**AF-1: Mã gói đã tồn tại**
- Tại bước 7, nếu code đã tồn tại:
  - Hệ thống hiển thị lỗi "Mã gói đã tồn tại, vui lòng chọn mã khác"
  - Admin sửa lại mã gói
  - Quay về bước 6

**AF-2: Admin hủy thao tác**
- Tại bước 5, Admin nhấn "Hủy"
- Hệ thống hiển thị confirm dialog
- Nếu Admin xác nhận hủy:
  - Hệ thống quay về trang danh sách gói
  - Không lưu thay đổi

**AF-3: Sản phẩm không tồn tại**
- Tại bước 7, nếu product_id không hợp lệ:
  - Hệ thống hiển thị lỗi "Sản phẩm không tồn tại"
  - Admin chọn lại sản phẩm
  - Quay về bước 5

### Postconditions
- Gói dịch vụ mới được tạo với status = ACTIVE
- Gói mới xuất hiện trong danh sách gói dịch vụ
- Nếu là gói công khai, tenant có thể thấy và đăng ký

### Business Rules
- BR-SP-001: Mã gói phải unique trong toàn hệ thống
- BR-SP-002: Giá gói phải >= 0
- BR-SP-003: Entitlements config phải có cấu trúc hợp lệ
- BR-SP-004: Gói mới mặc định có status = ACTIVE

### Technical Notes
```typescript
// API Call
POST /api/v1/packages
{
  "product_id": "uuid-here",
  "code": "hrm-starter-monthly",
  "name": "HRM Starter - Monthly",
  "description": "Gói cơ bản cho doanh nghiệp nhỏ",
  "price_amount": 299000,
  "currency_code": "VND",
  "entitlements_config": {
    "apps": [{
      "app_code": "HRM_APP",
      "features": {"attendance": true},
      "limits": {"max_employees": 20}
    }]
  },
  "is_public": true
}
```

---

## UC-SP-002: Admin xem danh sách gói dịch vụ

### Mô tả
Admin xem danh sách tất cả gói dịch vụ với khả năng lọc và tìm kiếm.

### Actors
- System Admin
- Platform Admin

### Preconditions
- Admin đã đăng nhập

### Main Flow

1. Admin truy cập trang "Gói dịch vụ"
2. Hệ thống hiển thị:
   - Thống kê tổng quan:
     - Tổng số gói
     - Số gói hoạt động
     - Số gói không hoạt động
     - Số gói lưu trữ
     - Số gói công khai
     - Số gói riêng tư
   - Bộ lọc:
     - Tìm kiếm theo tên, mã
     - Lọc theo trạng thái (ACTIVE, INACTIVE, ARCHIVED)
     - Lọc theo loại (Công khai, Riêng tư)
   - Danh sách gói dịch vụ (Table hoặc Grid view):
     - Tên gói
     - Mã gói
     - Giá
     - Trạng thái
     - Loại (Công khai/Riêng tư)
     - Thao tác (Xem, Sửa, Xóa, Sao chép)
3. Admin có thể:
   - Chuyển đổi giữa Table view và Grid view
   - Tìm kiếm gói
   - Lọc theo các tiêu chí
   - Nhấn vào tên gói để xem chi tiết
   - Thực hiện thao tác Sửa/Xóa/Sao chép

### Alternative Flows

**AF-1: Không có gói nào**
- Tại bước 2, nếu chưa có gói nào:
  - Hệ thống hiển thị empty state
  - Hiển thị nút "Tạo gói đầu tiên"
  - Admin nhấn nút → Chuyển sang UC-SP-001

**AF-2: Tìm kiếm không có kết quả**
- Tại bước 3, nếu search không tìm thấy:
  - Hiển thị "Không tìm thấy gói dịch vụ phù hợp"
  - Gợi ý xóa bộ lọc hoặc thử từ khóa khác

### Postconditions
- None (Read-only operation)

### Technical Notes
```typescript
// API Call
GET /api/v1/packages?status=ACTIVE&search=hrm&limit=50&offset=0

// Response
[
  {
    "_id": "uuid",
    "code": "hrm-pro-monthly",
    "name": "HRM Pro - Monthly",
    "price_amount": 999000,
    "currency_code": "VND",
    "status": "ACTIVE",
    "is_public": true
  }
]
```

---

## UC-SP-003: Admin chỉnh sửa gói dịch vụ

### Mô tả
Admin cập nhật thông tin của gói dịch vụ đã tồn tại.

### Actors
- System Admin
- Platform Admin

### Preconditions
- Admin đã đăng nhập
- Gói dịch vụ tồn tại và chưa bị xóa

### Main Flow

1. Admin xem danh sách gói dịch vụ (UC-SP-002)
2. Admin chọn một gói và nhấn "Sửa"
3. Hệ thống hiển thị form chỉnh sửa với dữ liệu hiện tại
4. Admin chỉnh sửa các trường:
   - Tên gói
   - Mô tả
   - Giá
   - Entitlements config
   - Trạng thái
   - Loại (Công khai/Riêng tư)
5. Admin nhấn "Lưu"
6. Hệ thống validate dữ liệu
7. Hệ thống kiểm tra version (Optimistic Locking):
   - Nếu version khớp: Cho phép cập nhật
   - Nếu version không khớp: Báo lỗi conflict
8. Hệ thống cập nhật:
   - Các trường thay đổi
   - updated_at = NOW()
   - version = version + 1
9. Hệ thống hiển thị "Đã cập nhật gói dịch vụ"
10. Hệ thống quay về trang chi tiết gói

### Alternative Flows

**AF-1: Version conflict (Optimistic Locking)**
- Tại bước 7, nếu version không khớp:
  - Hệ thống hiển thị: "Gói dịch vụ đã được người khác cập nhật. Vui lòng tải lại trang"
  - Admin reload trang
  - Xem thay đổi mới nhất
  - Quyết định có muốn ghi đè hay không

**AF-2: Admin hủy thao tác**
- Tại bước 4, Admin nhấn "Hủy"
- Hệ thống confirm
- Nếu xác nhận: Quay về trang chi tiết, không lưu thay đổi

**AF-3: Gói đã có subscription đang hoạt động**
- Khi cập nhật giá hoặc entitlements:
  - Hệ thống hiển thị warning: "Thay đổi sẽ không ảnh hưởng đến các subscription hiện có"
  - Admin xác nhận hiểu
  - Tiếp tục cập nhật

### Postconditions
- Gói dịch vụ được cập nhật
- Version tăng lên 1
- Các subscription cũ KHÔNG bị ảnh hưởng (Snapshot mechanism)
- Chỉ subscription mới sau thời điểm này sử dụng config mới

### Business Rules
- BR-SP-005: Không thể sửa product_id sau khi tạo
- BR-SP-006: Không thể sửa code sau khi có subscription
- BR-SP-007: Thay đổi giá không ảnh hưởng subscription hiện có
- BR-SP-008: Sử dụng Optimistic Locking để tránh ghi đè đồng thời

### Technical Notes
```typescript
// API Call
PUT /api/v1/packages/{id}
{
  "name": "HRM Pro - Monthly (Updated)",
  "price_amount": 1099000,
  "entitlements_config": {...},
  "version": 3  // Current version
}

// Response 409 if version conflict
{
  "error": "Version conflict - package was modified by another user"
}
```

---

## UC-SP-004: Admin xóa gói dịch vụ

### Mô tả
Admin xóa (soft delete) gói dịch vụ khỏi hệ thống.

### Actors
- System Admin

### Preconditions
- Admin đã đăng nhập với role System Admin
- Gói dịch vụ tồn tại và chưa bị xóa

### Main Flow

1. Admin xem danh sách gói dịch vụ (UC-SP-002)
2. Admin chọn gói cần xóa và nhấn "Xóa"
3. Hệ thống kiểm tra:
   - Có subscription ACTIVE nào đang sử dụng gói này không?
   - Có order PENDING nào tham chiếu gói này không?
4. Nếu KHÔNG có tham chiếu:
   - Hiển thị confirm dialog: "Bạn có chắc muốn xóa gói [Tên gói]?"
5. Admin xác nhận "Xóa"
6. Hệ thống thực hiện soft delete:
   - SET deleted_at = NOW()
   - SET status = 'ARCHIVED' (nếu đang ACTIVE/INACTIVE)
7. Hệ thống hiển thị "Đã xóa gói dịch vụ"
8. Gói biến mất khỏi danh sách

### Alternative Flows

**AF-1: Gói có subscription đang ACTIVE**
- Tại bước 3, nếu có subscription ACTIVE:
  - Hệ thống hiển thị lỗi: "Không thể xóa gói vì còn [X] subscription đang hoạt động"
  - Gợi ý: "Bạn có thể chuyển gói sang trạng thái ARCHIVED thay vì xóa"
  - Admin chọn:
    - Option 1: Hủy thao tác xóa
    - Option 2: Chuyển sang ARCHIVED (UC-SP-007)

**AF-2: Gói có order đang PENDING**
- Tại bước 3, nếu có order PENDING:
  - Hệ thống hiển thị warning: "Gói có [X] đơn hàng đang chờ xử lý"
  - Admin quyết định:
    - Cancel các order đó trước
    - Hoặc đợi order hoàn tất

**AF-3: Admin hủy xóa**
- Tại bước 5, Admin nhấn "Hủy"
- Không xóa gói
- Quay về danh sách

### Postconditions
- Gói bị soft delete (deleted_at != NULL)
- Gói không hiển thị trong danh sách thông thường
- Các subscription/order hiện có vẫn tham chiếu đến gói (package_id)
- Có thể restore gói nếu cần (admin tool)

### Business Rules
- BR-SP-009: Chỉ System Admin mới có quyền xóa gói
- BR-SP-010: Không thể xóa gói có subscription ACTIVE
- BR-SP-011: Sử dụng soft delete để bảo toàn referential integrity
- BR-SP-012: Gói đã xóa vẫn xuất hiện trong audit logs

### Technical Notes
```typescript
// API Call
DELETE /api/v1/packages/{id}

// SQL executed
UPDATE service_packages
SET deleted_at = NOW(), status = 'ARCHIVED'
WHERE _id = 'package-id';

// Check constraints before delete
SELECT COUNT(*) FROM tenant_subscriptions
WHERE package_id = 'package-id' 
  AND status = 'ACTIVE';
```

---

## UC-SP-005: Admin sao chép gói dịch vụ

### Mô tả
Admin tạo bản sao của gói dịch vụ hiện có để làm template cho gói mới.

### Actors
- System Admin
- Platform Admin

### Preconditions
- Admin đã đăng nhập
- Gói nguồn tồn tại

### Main Flow

1. Admin xem danh sách gói dịch vụ (UC-SP-002)
2. Admin chọn gói cần sao chép và nhấn "Sao chép"
3. Hệ thống hiển thị dialog:
   - Nhập mã gói mới (Code) - Required
   - Tên mới sẽ là "[Tên cũ] (Copy)"
   - Thông báo: "Gói sao chép sẽ có status = INACTIVE"
4. Admin nhập mã gói mới
5. Admin nhấn "Sao chép"
6. Hệ thống validate:
   - Mã gói mới phải unique
   - Format đúng quy tắc
7. Hệ thống tạo gói mới:
   - _id: UUID mới
   - code: Mã mới do admin nhập
   - name: "[Tên cũ] (Copy)"
   - product_id: Copy từ gói cũ
   - price_amount: Copy từ gói cũ
   - currency_code: Copy từ gói cũ
   - entitlements_config: Copy từ gói cũ
   - status: INACTIVE
   - is_public: Copy từ gói cũ
   - created_at: NOW()
   - version: 1
8. Hệ thống hiển thị "Đã sao chép gói dịch vụ"
9. Hệ thống chuyển đến trang edit gói mới
10. Admin có thể chỉnh sửa gói mới

### Alternative Flows

**AF-1: Mã gói mới đã tồn tại**
- Tại bước 6, nếu code đã tồn tại:
  - Hiển thị lỗi "Mã gói đã tồn tại"
  - Admin nhập mã khác
  - Quay về bước 4

**AF-2: Admin hủy sao chép**
- Tại bước 4, Admin nhấn "Hủy"
- Không tạo gói mới
- Quay về danh sách

**AF-3: Auto-generate code**
- Tại bước 3, Admin có thể nhấn "Tự động tạo mã"
- Hệ thống generate: `{old_code}_COPY_{timestamp}`
- Ví dụ: `hrm-pro-monthly_COPY_1706270400`

### Postconditions
- Gói mới được tạo với status = INACTIVE
- Admin cần kích hoạt và điều chỉnh trước khi publish

### Business Rules
- BR-SP-013: Gói sao chép mặc định INACTIVE để admin review
- BR-SP-014: Mã gói mới phải unique
- BR-SP-015: Tên gói thêm suffix "(Copy)" để phân biệt

### Use Cases
- Tạo gói mới tương tự gói cũ
- Tạo gói cho năm mới (2024 → 2025)
- A/B testing giá hoặc features
- Backup trước khi chỉnh sửa gói quan trọng

### Technical Notes
```typescript
// API Call
POST /api/v1/packages/{source_id}/clone
{
  "code": "hrm-pro-monthly-2024"
}

// Response
{
  "_id": "new-uuid",
  "code": "hrm-pro-monthly-2024",
  "name": "HRM Pro - Monthly (Copy)",
  "status": "INACTIVE",
  ...
}
```

---

## UC-SP-006: Admin cập nhật giá gói

### Mô tả
Admin thay đổi giá của gói dịch vụ mà không ảnh hưởng đến subscription hiện có.

### Actors
- System Admin
- Platform Admin

### Preconditions
- Admin đã đăng nhập
- Gói dịch vụ tồn tại

### Main Flow

1. Admin truy cập trang chi tiết gói dịch vụ
2. Hệ thống hiển thị thông tin gói, bao gồm:
   - Giá hiện tại
   - Số subscription đang ACTIVE
   - Lịch sử thay đổi giá (nếu có)
3. Admin nhấn "Cập nhật giá"
4. Hệ thống hiển thị form:
   - Giá hiện tại (read-only)
   - Giá mới (input)
   - Lý do thay đổi (textarea)
   - Warning: "Giá mới chỉ áp dụng cho subscription mới. [X] subscription hiện có sẽ giữ nguyên giá cũ"
5. Admin nhập giá mới và lý do
6. Admin nhấn "Cập nhật"
7. Hệ thống validate:
   - Giá mới >= 0
   - Giá mới khác giá cũ
8. Hệ thống cập nhật:
   - price_amount = giá mới
   - updated_at = NOW()
   - version = version + 1
9. Hệ thống log thay đổi vào audit_logs:
   - Action: "PRICE_UPDATE"
   - Old value: Giá cũ
   - New value: Giá mới
   - Reason: Lý do admin nhập
10. Hệ thống hiển thị "Đã cập nhật giá thành công"
11. Hệ thống reload trang chi tiết

### Alternative Flows

**AF-1: Giá mới bằng giá cũ**
- Tại bước 7, nếu giá không thay đổi:
  - Hiển thị warning "Giá mới giống giá cũ"
  - Hỏi admin có chắc muốn tiếp tục không
  - Nếu không: Quay về form

**AF-2: Giá mới quá thấp**
- Tại bước 7, nếu giá mới < 10% giá cũ:
  - Hiển thị warning "Giá giảm quá nhiều (>90%). Bạn có chắc chắn?"
  - Admin confirm
  - Tiếp tục cập nhật

**AF-3: Scheduled price change**
- Tại bước 4, Admin có thể chọn:
  - "Áp dụng ngay"
  - "Áp dụng từ ngày" (date picker)
- Nếu chọn scheduled:
  - Hệ thống lưu vào bảng scheduled_changes
  - Cronjob sẽ apply thay đổi vào đúng thời điểm

### Postconditions
- Giá gói được cập nhật
- Subscription hiện có KHÔNG bị ảnh hưởng
- Subscription mới sẽ dùng giá mới
- Thay đổi được ghi vào audit log

### Business Rules
- BR-SP-016: Snapshot mechanism bảo vệ giá cho subscription cũ
- BR-SP-017: Mọi thay đổi giá phải được audit
- BR-SP-018: Giá mới phải >= 0
- BR-SP-019: Nên yêu cầu lý do khi giá thay đổi > 20%

### Impact Analysis
```sql
-- Xem ảnh hưởng trước khi thay đổi
SELECT 
    ts.status,
    COUNT(*) as subscription_count,
    SUM(ts.granted_price) as total_current_revenue,
    SUM(999000) as total_if_new_price  -- Giả sử giá mới = 999,000
FROM tenant_subscriptions ts
WHERE ts.package_id = 'package-id-here'
GROUP BY ts.status;
```

### Technical Notes
```typescript
// API Call
PUT /api/v1/packages/{id}
{
  "price_amount": 1299000,  // Old: 999000
  "version": 5
}

// Verify no impact on old subscriptions
SELECT granted_price 
FROM tenant_subscriptions 
WHERE package_id = 'package-id'
  AND status = 'ACTIVE';
-- All should still show 999000, not 1299000
```

---

## UC-SP-007: Admin thay đổi trạng thái gói

### Mô tả
Admin chuyển trạng thái gói giữa ACTIVE, INACTIVE, và ARCHIVED.

### Actors
- System Admin

### Preconditions
- Admin đã đăng nhập
- Gói dịch vụ tồn tại

### Main Flow

1. Admin xem chi tiết gói dịch vụ
2. Hệ thống hiển thị trạng thái hiện tại
3. Admin nhấn dropdown "Đổi trạng thái"
4. Hệ thống hiển thị các trạng thái có thể chuyển:
   - ACTIVE: Đang bán
   - INACTIVE: Tạm ngừng bán
   - ARCHIVED: Ngừng kinh doanh
5. Admin chọn trạng thái mới
6. Hệ thống hiển thị confirm với ảnh hưởng:
   - ACTIVE → INACTIVE: "Gói sẽ không hiển thị cho tenant mới. [X] subscription hiện có không ảnh hưởng"
   - INACTIVE → ACTIVE: "Gói sẽ hiển thị lại cho tenant"
   - * → ARCHIVED: "Gói sẽ bị lưu trữ. Không thể kích hoạt lại"
7. Admin xác nhận
8. Hệ thống cập nhật status
9. Hệ thống log thay đổi
10. Hiển thị "Đã cập nhật trạng thái"

### State Transition Rules

```
ACTIVE ←→ INACTIVE ←→ ARCHIVED
  ↓                      ↑
  └──────────────────────┘
       (one-way only)
```

**Allowed Transitions:**
- ACTIVE ↔ INACTIVE (two-way)
- INACTIVE ↔ ARCHIVED (two-way with warning)
- ACTIVE → ARCHIVED (one-way)
- ❌ ARCHIVED → ACTIVE (not allowed)

### Alternative Flows

**AF-1: Gói có subscription mới trong 24h**
- Khi chuyển ACTIVE → INACTIVE/ARCHIVED:
  - Hiển thị warning: "Có [X] subscription mới được tạo trong 24h qua"
  - Admin confirm hiểu
  - Tiếp tục

**AF-2: Archive gói có nhiều subscription**
- Khi chuyển sang ARCHIVED:
  - Hiển thị: "Đây là gói phổ biến với [X] subscriptions. Bạn chắc chắn muốn archive?"
  - Yêu cầu nhập lý do (required)
  - Admin confirm
  - Thực hiện archive

### Business Rules
- BR-SP-020: Chỉ ACTIVE packages hiển thị cho tenant
- BR-SP-021: INACTIVE packages vẫn hỗ trợ subscription cũ
- BR-SP-022: ARCHIVED packages không thể restore về ACTIVE
- BR-SP-023: Subscription cũ không bị ảnh hưởng bởi status change

### Technical Notes
```typescript
// API Call
PUT /api/v1/packages/{id}
{
  "status": "INACTIVE",
  "version": 3
}

// Impact check
SELECT status, COUNT(*) 
FROM tenant_subscriptions 
WHERE package_id = 'package-id'
GROUP BY status;
```

---

## UC-SP-008: Admin xem thống kê gói dịch vụ

### Mô tả
Admin xem các metrics và báo cáo về gói dịch vụ.

### Actors
- System Admin
- Platform Admin

### Preconditions
- Admin đã đăng nhập

### Main Flow

1. Admin truy cập trang "Thống kê gói dịch vụ"
2. Hệ thống hiển thị dashboard:
   
   **Overview Cards:**
   - Tổng số gói
   - Gói ACTIVE
   - Gói INACTIVE
   - Gói ARCHIVED
   - Gói công khai
   - Gói riêng tư
   
   **Revenue Metrics:**
   - Tổng doanh thu tiềm năng (sum of all ACTIVE packages)
   - Doanh thu thực tế (từ subscriptions)
   - Average price per package
   
   **Top Performers:**
   - 10 gói bán chạy nhất (most subscriptions)
   - 10 gói doanh thu cao nhất
   - 10 gói mới nhất
   
   **Charts:**
   - Biểu đồ phân bố gói theo trạng thái (Pie chart)
   - Xu hướng tạo gói theo thời gian (Line chart)
   - So sánh doanh thu giữa các gói (Bar chart)

3. Admin có thể:
   - Chọn khoảng thời gian (7 days, 30 days, 90 days, All time)
   - Lọc theo product
   - Export báo cáo (CSV, PDF)

### Alternative Flows

**AF-1: Drill down vào gói cụ thể**
- Admin nhấn vào tên gói trong bảng
- Hệ thống hiển thị chi tiết:
  - Subscription breakdown
  - Revenue over time
  - Churn rate
  - Conversion rate

**AF-2: Compare packages**
- Admin chọn 2-3 gói để so sánh
- Hệ thống hiển thị side-by-side comparison
- Metrics: price, subscriptions, revenue, features

### Technical Notes
```typescript
// API Call
GET /api/v1/packages/stats

// Response
{
  "total": 45,
  "active": 32,
  "inactive": 8,
  "archived": 5,
  "public": 38,
  "private": 7,
  "by_status": {
    "ACTIVE": 32,
    "INACTIVE": 8,
    "ARCHIVED": 5
  },
  "total_revenue": 125500000
}

// Top packages query
SELECT 
    sp.code,
    sp.name,
    COUNT(ts._id) as subscription_count,
    SUM(ts.granted_price) as total_revenue
FROM service_packages sp
LEFT JOIN tenant_subscriptions ts ON sp._id = ts.package_id
WHERE sp.deleted_at IS NULL
GROUP BY sp._id
ORDER BY subscription_count DESC
LIMIT 10;
```

---

## UC-SP-009: Tenant xem danh sách gói công khai

### Mô tả
Tenant (khách hàng) xem các gói dịch vụ công khai để chọn mua.

### Actors
- Tenant Admin
- Tenant Member (với quyền billing)

### Preconditions
- Tenant đã đăng nhập (hoặc chưa đăng nhập cho pricing page)

### Main Flow

1. Tenant truy cập trang "Pricing" hoặc "Gói dịch vụ"
2. Hệ thống load danh sách gói:
   ```sql
   WHERE status = 'ACTIVE' 
     AND is_public = TRUE 
     AND deleted_at IS NULL
   ```
3. Hệ thống hiển thị gói theo layout:
   - Card view (responsive)
   - Mỗi card hiển thị:
     - Tên gói
     - Giá/tháng (hoặc /năm)
     - Danh sách features nổi bật
     - Limits (max users, storage, etc.)
     - Badge (Popular, Best Value, etc.)
     - Nút "Chọn gói" hoặc "Dùng thử"
4. Tenant có thể:
   - So sánh gói (Comparison table)
   - Toggle billing cycle (Monthly/Yearly)
   - Xem chi tiết từng gói
5. Tenant nhấn "Chọn gói"
6. → Chuyển sang UC-SP-010

### Alternative Flows

**AF-1: Tenant chưa đăng nhập**
- Tại bước 5, nếu chưa login:
  - Redirect đến trang login
  - Sau khi login, quay lại pricing page
  - Gói được chọn vẫn được highlight

**AF-2: Comparison mode**
- Tenant chọn 2-3 gói để so sánh
- Hệ thống hiển thị comparison table:
  ```
  Feature        | Starter | Pro    | Enterprise
  -------------------------------------------
  Max Users      | 5       | 20     | Unlimited
  Storage        | 10GB    | 100GB  | 1TB
  Support        | Email   | Priority| Dedicated
  Price          | 299K    | 999K   | Custom
  ```

**AF-3: Yearly discount**
- Tenant toggle "Bill Yearly"
- Hệ thống hiển thị:
  - Giá/năm với discount (thường -15% ~ -20%)
  - Số tiền tiết kiệm
  - Badge "Save X%"

### Business Rules
- BR-SP-024: Chỉ hiển thị gói ACTIVE và is_public = true
- BR-SP-025: Giá hiển thị theo currency của tenant (nếu có)
- BR-SP-026: Features list lấy từ entitlements_config
- BR-SP-027: Badge "Popular" cho gói có nhiều subscription nhất

### Technical Notes
```typescript
// API Call (Public endpoint)
GET /api/v1/public/packages?billing_cycle=MONTHLY

// Response
[
  {
    "_id": "uuid",
    "code": "hrm-starter",
    "name": "HRM Starter",
    "price_amount": 299000,
    "currency_code": "VND",
    "entitlements_config": {
      "apps": [...],
      "global_limits": {
        "max_users": 5,
        "storage_gb": 10
      }
    },
    "is_popular": true,
    "discount_yearly": 0.2
  }
]
```

---

## UC-SP-010: Tenant đăng ký gói dịch vụ

### Mô tả
Tenant đăng ký (subscribe) một gói dịch vụ.

### Actors
- Tenant Admin
- Tenant Member (với permission billing.manage)

### Preconditions
- Tenant đã đăng nhập
- Gói dịch vụ ACTIVE và công khai
- Tenant chưa có subscription cho gói này

### Main Flow

1. Tenant xem danh sách gói (UC-SP-009)
2. Tenant chọn gói và nhấn "Chọn gói"
3. Hệ thống hiển thị checkout page:
   - Thông tin gói đã chọn
   - Giá (monthly hoặc yearly)
   - Billing cycle selector
   - Thông tin billing hiện tại
   - Payment method
   - Terms & Conditions checkbox
4. Tenant chọn billing cycle (Monthly/Yearly)
5. Hệ thống tính toán:
   - Giá gói theo cycle
   - Proration (nếu có subscription cũ)
   - Tax (nếu có)
   - Total amount
6. Tenant nhập payment info (hoặc dùng saved payment method)
7. Tenant check "Đồng ý Terms & Conditions"
8. Tenant nhấn "Xác nhận đăng ký"
9. Hệ thống thực hiện transaction:
   
   **Step 1: Create Subscription Order**
   ```sql
   INSERT INTO subscription_orders (
     _id, tenant_id, package_id,
     order_type, total_amount, payment_status
   ) VALUES (
     uuid_generate_v7(),
     'tenant-id',
     'package-id',
     'NEW',
     999000,
     'PENDING'
   );
   ```
   
   **Step 2: Process Payment**
   - Call payment gateway
   - If success: Update order status to 'PAID'
   - If fail: Update order status to 'FAILED', show error
   
   **Step 3: Create Subscription (Snapshot mechanism)**
   ```sql
   INSERT INTO tenant_subscriptions (
     _id, tenant_id, package_id,
     granted_entitlements,  -- SNAPSHOT from package
     granted_price,          -- SNAPSHOT from package
     billing_cycle, start_date, end_date, status
   ) VALUES (
     uuid_generate_v7(),
     'tenant-id',
     'package-id',
     (SELECT entitlements_config FROM service_packages WHERE _id = 'package-id'),
     (SELECT price_amount FROM service_packages WHERE _id = 'package-id'),
     'MONTHLY',
     NOW(),
     NOW() + INTERVAL '1 month',
     'ACTIVE'
   );
   ```
   
   **Step 4: Create Invoice**
   ```sql
   INSERT INTO subscription_invoices (...);
   ```

10. Hệ thống gửi email xác nhận
11. Hệ thống hiển thị "Đăng ký thành công!"
12. Redirect đến dashboard với features mới

### Alternative Flows

**AF-1: Payment failed**
- Tại Step 2 của bước 9:
  - Update order status = 'FAILED'
  - Hiển thị lỗi payment
  - Cho phép retry hoặc đổi payment method
  - Không tạo subscription

**AF-2: Tenant đã có subscription ACTIVE**
- Tại bước 3:
  - Hệ thống phát hiện subscription cũ
  - Hiển thị options:
    - "Upgrade" (if new package > old package)
    - "Downgrade" (if new package < old package)
    - "Switch" (ngang bằng)
  - Tính proration
  - Xử lý theo UC-SP-011 (Upgrade/Downgrade)

**AF-3: Free trial**
- Nếu gói có trial period:
  - Bước 5: Total = 0 (no payment needed)
  - Bước 9: Skip payment processing
  - Create subscription with status = 'TRIAL'
  - Set trial_end_date = NOW() + trial_period

### Postconditions
- Subscription được tạo với status = ACTIVE (hoặc TRIAL)
- Order được tạo với status = PAID
- Invoice được tạo
- Tenant được cấp quyền theo entitlements_config
- Email confirmation được gửi

### Business Rules
- BR-SP-028: Snapshot entitlements và price vào subscription
- BR-SP-029: Không cho đăng ký duplicate package
- BR-SP-030: Proration theo ngày nếu upgrade mid-cycle
- BR-SP-031: Trial không yêu cầu payment

### Snapshot Mechanism Example

**Before subscription:**
```json
// service_packages
{
  "_id": "pkg-123",
  "code": "hrm-pro",
  "price_amount": 999000,
  "entitlements_config": {
    "apps": [{
      "app_code": "HRM_APP",
      "limits": {"max_employees": 100}
    }]
  }
}
```

**After subscription (Snapshot created):**
```json
// tenant_subscriptions
{
  "_id": "sub-456",
  "tenant_id": "tenant-789",
  "package_id": "pkg-123",  // Reference only
  "granted_price": 999000,  // SNAPSHOT (won't change if package price updates)
  "granted_entitlements": { // SNAPSHOT (won't change if package config updates)
    "apps": [{
      "app_code": "HRM_APP",
      "limits": {"max_employees": 100}
    }]
  },
  "status": "ACTIVE"
}
```

**Later, admin updates package to 1,200,000 VND:**
- `service_packages.price_amount` = 1,200,000 ✅ (new subscriptions)
- `tenant_subscriptions.granted_price` = 999,000 ✅ (old subscription protected)

---

## Summary Table

| Use Case ID | Use Case Name | Primary Actor | Complexity | Priority |
|-------------|---------------|---------------|------------|----------|
| UC-SP-001 | Tạo gói dịch vụ mới | Admin | Medium | High |
| UC-SP-002 | Xem danh sách gói | Admin | Low | High |
| UC-SP-003 | Chỉnh sửa gói | Admin | Medium | High |
| UC-SP-004 | Xóa gói | Admin | Medium | Medium |
| UC-SP-005 | Sao chép gói | Admin | Low | Medium |
| UC-SP-006 | Cập nhật giá gói | Admin | Medium | High |
| UC-SP-007 | Thay đổi trạng thái gói | Admin | Low | High |
| UC-SP-008 | Xem thống kê | Admin | Medium | Low |
| UC-SP-009 | Tenant xem gói công khai | Tenant | Low | High |
| UC-SP-010 | Tenant đăng ký gói | Tenant | High | Critical |

---

## Related Documents

- [Database Schema](/docs/developer/service-packages-database-schema.md)
- [API Reference](/docs/developer/service-packages-api-reference.md)
- [ERD Diagram](/docs/developer/service-packages-erd-diagram.md)
- [Subscriptions Use Cases](/docs/developer/subscriptions-use-cases.md)
- [Orders Use Cases](/docs/ORDERS_USECASES.md)

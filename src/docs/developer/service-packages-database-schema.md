# Service Packages - Database Schema Documentation

## Overview

Bảng `service_packages` lưu trữ thông tin về các gói dịch vụ (Service Packages) - đây là các gói cước thương mại được đóng gói từ các sản phẩm (products). Mỗi gói dịch vụ có thể chứa nhiều ứng dụng và tính năng, với các hạn mức (limits) và quyền hạn (entitlements) riêng biệt.

## Table: `service_packages`

### Schema Definition

```sql
CREATE TABLE service_packages (
    -- I. Định danh & Liên kết
    _id UUID PRIMARY KEY,                    -- Sinh UUID v7 từ tầng Application
    saas_product_id UUID NOT NULL,           -- Thuộc dòng sản phẩm nào (REFERENCES products(_id))
    
    -- II. Thông tin thương mại
    code VARCHAR(50) NOT NULL,               -- Mã gói cước (Slug)
    name VARCHAR(255) NOT NULL,              -- Tên gói cước
    description TEXT,                        -- Mô tả chi tiết
    
    -- III. Tài chính
    price_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,  -- Giá niêm yết
    currency_code VARCHAR(3) NOT NULL DEFAULT 'VND', -- Mã tiền tệ (ISO 4217)
    
    -- IV. Cấu hình quyền hạn
    entitlements_config JSONB NOT NULL DEFAULT '{}', -- Cấu hình Apps, Features và Limits
    
    -- V. Trạng thái vận hành
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE, INACTIVE, ARCHIVED
    is_public BOOLEAN NOT NULL DEFAULT TRUE,         -- Gói công khai hay riêng tư (Custom)
    
    -- VI. Audit & Versioning
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                          -- Soft Delete
    version BIGINT NOT NULL DEFAULT 1,               -- Optimistic Locking
    
    -- VII. Ràng buộc (Constraints)
    CONSTRAINT fk_package_product FOREIGN KEY (saas_product_id) REFERENCES products(_id),
    CONSTRAINT uq_package_code UNIQUE (code),
    CONSTRAINT chk_package_code_format CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_package_price CHECK (price_amount >= 0),
    CONSTRAINT chk_package_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))
);
```

### Indexes

```sql
-- Index hỗ trợ tìm kiếm tất cả các gói thuộc một dòng sản phẩm
CREATE INDEX idx_packages_product ON service_packages (saas_product_id) 
WHERE deleted_at IS NULL;

-- Index hỗ trợ tra cứu nhanh gói cước qua mã (Dùng khi checkout/mua hàng)
CREATE UNIQUE INDEX idx_packages_code_lookup ON service_packages (code) 
WHERE deleted_at IS NULL;

-- Index GIN hỗ trợ tìm kiếm bên trong JSONB (VD: Tìm tất cả gói có chứa App 'CRM')
CREATE INDEX idx_packages_entitlements ON service_packages USING GIN (entitlements_config);

-- Index hỗ trợ lọc các gói đang hoạt động và công khai cho trang chủ/giá cả
CREATE INDEX idx_packages_active_public ON service_packages (status, is_public) 
WHERE status = 'ACTIVE' AND is_public = TRUE AND deleted_at IS NULL;
```

## Field Definitions

| Field Name | Type | Null? | Default | Constraints | Description |
|------------|------|-------|---------|-------------|-------------|
| **_id** | UUID | NO | | PRIMARY KEY | Định danh duy nhất chuẩn UUID v7, hỗ trợ sắp xếp theo thời gian |
| **saas_product_id** | UUID | NO | | REFERENCES products(_id) | Thuộc dòng sản phẩm chính nào (VD: Bộ giải pháp Nhân sự) |
| **code** | VARCHAR(50) | NO | | UNIQUE, CHECK (code ~ '^[a-z0-9-]+$') | Mã gói cước (Slug). Chỉ chứa chữ thường, số, gạch ngang (VD: `hrm-pro-monthly`) |
| **name** | VARCHAR(255) | NO | | CHECK (length(name) > 0) | Tên gói cước hiển thị trên báo giá/hóa đơn |
| **description** | TEXT | YES | NULL | | Mô tả chi tiết các quyền lợi của gói cước |
| **price_amount** | NUMERIC(19,4) | NO | 0 | CHECK (price_amount >= 0) | Giá niêm yết của gói. Dùng NUMERIC để đảm bảo chính xác tuyệt đối |
| **currency_code** | VARCHAR(3) | NO | 'VND' | CHECK (length(currency_code) = 3) | Mã tiền tệ theo chuẩn ISO 4217 |
| **entitlements_config** | JSONB | NO | '{}' | | Chứa cấu hình lồng nhau về Apps, Features và Limits |
| **status** | VARCHAR(20) | NO | 'ACTIVE' | CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')) | Trạng thái gói: Đang bán, Ngừng bán, hoặc Lưu trữ |
| **is_public** | BOOLEAN | NO | TRUE | | Gói cước công khai hay gói thiết kế riêng (Custom) cho khách VIP |
| **created_at** | TIMESTAMPTZ | NO | now() | | Thời điểm tạo gói (UTC) |
| **updated_at** | TIMESTAMPTZ | NO | now() | | Thời điểm cập nhật cuối cùng |
| **deleted_at** | TIMESTAMPTZ | YES | NULL | | Hỗ trợ Soft Delete để bảo toàn dữ liệu lịch sử |
| **version** | BIGINT | NO | 1 | CHECK (version >= 1) | Dùng cho Optimistic Locking, ngăn chặn ghi đè khi nhiều Admin cùng sửa |

## Entitlements Config Structure

Cấu trúc JSONB `entitlements_config` định nghĩa các ứng dụng, tính năng và hạn mức trong gói:

```json
{
  "apps": [
    {
      "app_code": "HRM_APP",
      "app_name": "Quản lý Nhân sự",
      "features": {
        "attendance_tracking": true,
        "payroll_management": true,
        "performance_review": false
      },
      "limits": {
        "max_employees": 50,
        "max_departments": 10,
        "storage_gb": 20
      }
    },
    {
      "app_code": "CRM_APP",
      "app_name": "Quản lý Khách hàng",
      "features": {
        "lead_management": true,
        "email_marketing": true,
        "advanced_reporting": false
      },
      "limits": {
        "max_contacts": 1000,
        "max_deals": 100,
        "email_quota_monthly": 5000
      }
    }
  ],
  "global_limits": {
    "max_users": 10,
    "api_calls_per_month": 100000,
    "support_level": "STANDARD"
  }
}
```

## Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| **ACTIVE** | Đang hoạt động | Gói đang được bán cho khách hàng |
| **INACTIVE** | Không hoạt động | Gói tạm ngừng bán (có thể kích hoạt lại) |
| **ARCHIVED** | Lưu trữ | Gói đã ngừng kinh doanh hoàn toàn |

## Data Validation Rules

### Code Format
- Chỉ cho phép: chữ thường (a-z), số (0-9), gạch ngang (-)
- Ví dụ hợp lệ: `hrm-pro-monthly`, `enterprise-2024`, `startup-package`
- Ví dụ không hợp lệ: `HRM_PRO`, `Package #1`, `gói-cước`

### Price Amount
- Phải >= 0
- Sử dụng NUMERIC(19,4) để đảm bảo độ chính xác tuyệt đối
- Hỗ trợ lên đến 15 chữ số trước dấu phẩy và 4 chữ số thập phân

### Currency Code
- Phải có đúng 3 ký tự
- Tuân theo chuẩn ISO 4217
- Ví dụ: VND, USD, EUR, GBP, JPY

## Relationships

```
products (1) ----< (N) service_packages
    |
    |_ _id = saas_product_id

service_packages (1) ----< (N) tenant_subscriptions
    |
    |_ Snapshot entitlements_config vào tenant_subscriptions khi khách hàng mua
```

## Business Rules

1. **Snapshot Mechanism**: Khi khách hàng mua gói, toàn bộ `entitlements_config` và `price_amount` được copy sang bảng `tenant_subscriptions` để bảo vệ quyền lợi khách hàng khi giá gốc thay đổi.

2. **Optimistic Locking**: Trường `version` tăng lên mỗi khi update. Nếu hai admin cùng sửa, hệ thống sẽ reject thao tác của người sau.

3. **Soft Delete**: Không xóa cứng record để bảo toàn lịch sử và tham chiếu từ `tenant_subscriptions`.

4. **Code Uniqueness**: Mã gói phải unique trong toàn hệ thống để tránh nhầm lẫn khi checkout.

## Example Data

```sql
-- Gói Starter cho HRM
INSERT INTO service_packages (_id, saas_product_id, code, name, description, price_amount, currency_code, entitlements_config, status, is_public)
VALUES (
    gen_random_uuid(),
    'product-uuid-here',
    'hrm-starter-monthly',
    'HRM Starter - Monthly',
    'Gói cơ bản cho doanh nghiệp nhỏ dưới 20 nhân viên',
    299000,
    'VND',
    '{
        "apps": [{
            "app_code": "HRM_APP",
            "features": {
                "attendance_tracking": true,
                "leave_management": true,
                "payroll_management": false
            },
            "limits": {
                "max_employees": 20,
                "max_departments": 3,
                "storage_gb": 5
            }
        }],
        "global_limits": {
            "max_users": 5,
            "support_level": "EMAIL"
        }
    }'::jsonb,
    'ACTIVE',
    true
);

-- Gói Enterprise cho HRM + CRM
INSERT INTO service_packages (_id, saas_product_id, code, name, description, price_amount, currency_code, entitlements_config, status, is_public)
VALUES (
    gen_random_uuid(),
    'product-uuid-here',
    'business-suite-yearly',
    'Business Suite - Yearly',
    'Gói toàn diện cho doanh nghiệp vừa và lớn',
    24990000,
    'VND',
    '{
        "apps": [
            {
                "app_code": "HRM_APP",
                "features": {
                    "attendance_tracking": true,
                    "leave_management": true,
                    "payroll_management": true,
                    "performance_review": true
                },
                "limits": {
                    "max_employees": 200,
                    "max_departments": 20,
                    "storage_gb": 100
                }
            },
            {
                "app_code": "CRM_APP",
                "features": {
                    "lead_management": true,
                    "email_marketing": true,
                    "advanced_reporting": true,
                    "sales_automation": true
                },
                "limits": {
                    "max_contacts": 10000,
                    "max_deals": 1000,
                    "email_quota_monthly": 50000
                }
            }
        ],
        "global_limits": {
            "max_users": 50,
            "api_calls_per_month": 1000000,
            "support_level": "PRIORITY"
        }
    }'::jsonb,
    'ACTIVE',
    true
);
```

## Migration Considerations

### From Legacy Schema
Nếu hệ thống cũ sử dụng:
- `package_name` → Rename to `name`
- `package_code` → Rename to `code`
- `price` → Rename to `price_amount`
- `currency` → Rename to `currency_code`
- `billing_cycle` → Remove (move to tenant_subscriptions)
- `features` + `limits` → Merge into `entitlements_config`
- `is_active` → Map to `status` (is_active=true → ACTIVE, is_active=false → INACTIVE)

### Data Migration Script
```sql
-- Migration example
INSERT INTO service_packages (
    _id, saas_product_id, code, name, description,
    price_amount, currency_code, entitlements_config,
    status, is_public, created_at, updated_at, version
)
SELECT 
    _id,
    product_id,
    package_code as code,
    package_name as name,
    description,
    price as price_amount,
    currency as currency_code,
    jsonb_build_object(
        'apps', COALESCE(features, '{}'::jsonb),
        'global_limits', COALESCE(limits, '{}'::jsonb)
    ) as entitlements_config,
    CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END as status,
    COALESCE(is_public, true) as is_public,
    created_at,
    updated_at,
    COALESCE(version, 1)
FROM legacy_packages
WHERE deleted_at IS NULL;
```

## Performance Considerations

1. **UUID v7**: Sử dụng UUID v7 thay vì v4 để tối ưu B-tree index performance.
2. **GIN Index**: Index JSONB với GIN để search nhanh trong entitlements_config.
3. **Partial Index**: Chỉ index records chưa bị xóa (deleted_at IS NULL).
4. **NUMERIC vs FLOAT**: Dùng NUMERIC cho tiền tệ để tránh lỗi làm tròn.

## Security Notes

1. **Price Tampering**: Validate giá ở backend, không tin tưởng client.
2. **Code Injection**: Validate format của `code` field với regex.
3. **JSONB Validation**: Validate structure của `entitlements_config` trước khi lưu.
4. **Soft Delete**: Luôn check `deleted_at IS NULL` trong queries.

## Monitoring Queries

```sql
-- Thống kê gói theo trạng thái
SELECT status, COUNT(*) as count, SUM(price_amount) as total_value
FROM service_packages
WHERE deleted_at IS NULL
GROUP BY status;

-- Tìm gói có giá cao nhất
SELECT code, name, price_amount, currency_code
FROM service_packages
WHERE deleted_at IS NULL AND status = 'ACTIVE'
ORDER BY price_amount DESC
LIMIT 10;

-- Gói chưa có subscription nào
SELECT sp.code, sp.name
FROM service_packages sp
LEFT JOIN tenant_subscriptions ts ON sp._id = ts.package_id
WHERE sp.deleted_at IS NULL
  AND sp.status = 'ACTIVE'
  AND ts._id IS NULL;
```

## References

- [DatabaseCommand.md](/docs/Database.md) - Chi tiết thiết kế database
- [Products Schema](/docs/developer/products-database-schema.md) - Bảng products liên quan
- [Tenant Subscriptions](/docs/SUBSCRIPTIONS_DEVELOPER_DOCUMENTATION.md) - Bảng tenant_subscriptions
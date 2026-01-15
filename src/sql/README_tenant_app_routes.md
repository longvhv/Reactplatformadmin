# Bảng tenant_app_routes - Hướng dẫn chi tiết

## Tổng quan

Bảng `tenant_app_routes` quản lý định tuyến (routing) domain và path cho các ứng dụng của từng tenant trong hệ thống SaaS multi-tenant. Đây là bảng cốt lõi giúp **API Gateway** xác định:

- Request từ domain/path nào thuộc tenant nào?
- Tenant đó đang truy cập app nào (HRM, CRM, PM...)?
- Domain đó là subdomain mặc định hay custom domain?

## Cấu trúc bảng

### Các nhóm trường chính

#### I. ĐỊNH DANH & LIÊN KẾT
- `_id` (UUID, PK): Định danh duy nhất của route (UUID v7)
- `tenant_id` (UUID, FK): Link đến bảng `tenants`
- `app_code` (VARCHAR): Mã ứng dụng (VD: `HRM_APP`, `CRM_APP`, `PM_APP`)

#### II. CẤU HÌNH ĐỊNH TUYẾN
- `domain` (VARCHAR): Domain hoặc subdomain (VD: `fpt.saas.com`, `hr.fpt.com`)
- `path_prefix` (VARCHAR): Tiền tố đường dẫn (VD: `/`, `/crm`, `/admin`)

#### III. THÔNG TIN PHỤ TRỢ
- `is_primary` (BOOLEAN): Route chính của tenant (mặc định khi truy cập)
- `is_custom_domain` (BOOLEAN): Custom domain hay subdomain platform
- `ssl_status` (VARCHAR): Trạng thái SSL certificate (`NONE`, `PENDING`, `ACTIVE`, `FAILED`)

#### IV. AUDIT & VERSIONING
- `created_at` (TIMESTAMPTZ): Thời điểm tạo route
- `updated_at` (TIMESTAMPTZ): Thời điểm cập nhật cuối
- `version` (BIGINT): Optimistic locking

## Ràng buộc (Constraints)

1. **Foreign Key**: `tenant_id` → `tenants(_id)` với `ON DELETE CASCADE`
2. **Unique Constraint**: Cặp `(domain, path_prefix)` phải duy nhất toàn hệ thống
3. **Check Constraints**:
   - `domain`: Chỉ chứa `[a-z0-9.-]`
   - `path_prefix`: Phải bắt đầu bằng `/` và chỉ chứa `[a-z0-9-/]`
   - `ssl_status`: Chỉ nhận các giá trị: `NONE`, `PENDING`, `ACTIVE`, `FAILED`

## Index Strategy

### 1. idx_routes_fast_lookup (UNIQUE, Covering Index)
```sql
CREATE UNIQUE INDEX idx_routes_fast_lookup 
ON tenant_app_routes (domain, path_prefix) 
INCLUDE (tenant_id, app_code, is_custom_domain);
```

**Mục đích**: Index "thần thánh" cho API Gateway routing
- **Query pattern**: `WHERE domain = ? AND path_prefix = ?`
- **Covering Index**: Chứa tất cả thông tin cần thiết (tenant_id, app_code) → không cần access table
- **Performance**: O(log n) lookup, tốc độ ms dù có hàng triệu routes

### 2. idx_routes_tenant_list
```sql
CREATE INDEX idx_routes_tenant_list 
ON tenant_app_routes (tenant_id, created_at DESC);
```

**Mục đích**: Hỗ trợ Admin Panel
- **Query pattern**: Liệt kê routes của một tenant
- Sắp xếp theo thời gian tạo (mới nhất trước)

## Kịch bản sử dụng thực tế

### Kịch bản 1: Subdomain mặc định
**Tenant**: FPT Software (code: `fpt-software`)  
**Domain cấp**: `fpt.saas.com`  
**App**: HRM

```sql
INSERT INTO tenant_app_routes 
VALUES (
    uuid_v7(),
    '<fpt_tenant_id>',
    'HRM_APP',
    'fpt.saas.com',
    '/',
    TRUE,  -- is_primary
    FALSE, -- is_custom_domain
    'ACTIVE'
);
```

**Request**: `https://fpt.saas.com/employees`  
**Router logic**:
```sql
SELECT tenant_id, app_code 
FROM tenant_app_routes 
WHERE domain = 'fpt.saas.com' 
  AND path_prefix = '/';
-- Kết quả: tenant_id = fpt_tenant_id, app_code = HRM_APP
```

### Kịch bản 2: Custom Domain
**Tenant**: FPT Software  
**Custom domain**: `hr.fpt.com` (domain riêng của khách hàng)  
**App**: HRM

```sql
INSERT INTO tenant_app_routes 
VALUES (
    uuid_v7(),
    '<fpt_tenant_id>',
    'HRM_APP',
    'hr.fpt.com',
    '/',
    FALSE, -- Không phải primary
    TRUE,  -- is_custom_domain
    'ACTIVE'
);
```

**Quy trình triển khai custom domain**:
1. Admin tenant thêm custom domain → `ssl_status = 'NONE'`
2. Hệ thống yêu cầu khách hàng thêm DNS record → `ssl_status = 'PENDING'`
3. Let's Encrypt cấp SSL thành công → `ssl_status = 'ACTIVE'`
4. Nếu thất bại → `ssl_status = 'FAILED'`

### Kịch bản 3: Multi-app trên cùng domain
**Tenant**: VNG Corporation  
**Subdomain**: `vng.saas.com`  
**Apps**: HRM, CRM, PM

```sql
-- HRM tại root path
INSERT INTO tenant_app_routes VALUES (..., 'HRM_APP', 'vng.saas.com', '/', ...);

-- CRM tại /crm
INSERT INTO tenant_app_routes VALUES (..., 'CRM_APP', 'vng.saas.com', '/crm', ...);

-- PM tại /pm
INSERT INTO tenant_app_routes VALUES (..., 'PM_APP', 'vng.saas.com', '/pm', ...);
```

**Routing logic**:
- `https://vng.saas.com/` → HRM_APP
- `https://vng.saas.com/employees` → HRM_APP
- `https://vng.saas.com/crm/leads` → CRM_APP
- `https://vng.saas.com/pm/tasks` → PM_APP

## API Gateway Implementation (Pseudo-code)

```javascript
async function routeRequest(req) {
  const { hostname, pathname } = new URL(req.url);
  
  // Tìm route match dài nhất (longest prefix matching)
  const route = await db.query(`
    SELECT tenant_id, app_code, is_custom_domain
    FROM tenant_app_routes
    WHERE domain = $1 
      AND $2 LIKE path_prefix || '%'
    ORDER BY LENGTH(path_prefix) DESC
    LIMIT 1
  `, [hostname, pathname]);
  
  if (!route) {
    return { error: '404 - Domain not found' };
  }
  
  // Set context cho downstream services
  req.context = {
    tenantId: route.tenant_id,
    appCode: route.app_code,
    isCustomDomain: route.is_custom_domain
  };
  
  return routeToApp(req);
}
```

## Dữ liệu demo

Migration script đã bao gồm dữ liệu demo cho 3 tenant:

### 1. Tech Innovators Vietnam (`tech-innovators-vietnam`)
- ✅ Subdomain primary: `tech-innovators-vietnam.saas.com` → HRM_APP
- ✅ Custom domain: `hr.techinnovators.com` → HRM_APP
- ✅ Multi-app: `tech-innovators-vietnam.saas.com/crm` → CRM_APP

### 2. Saigon Digital Solutions (`saigon-digital-solutions`)
- ✅ Subdomain primary: `saigon-digital-solutions.saas.com` → HRM_APP
- ⏳ Custom domain pending: `portal.saigondigital.vn` (ssl_status = PENDING)

### 3. Hanoi Software House (`hanoi-software-house`)
- ✅ Subdomain: `hanoi-software-house.saas.com` → HRM_APP
- ✅ Multi-app paths:
  - `/crm` → CRM_APP
  - `/pm` → PM_APP
- ❌ Failed domain: `old-domain.hanoisoft.vn` (ssl_status = FAILED)

## Cách chạy migration

### Bước 1: Đảm bảo bảng tenants đã có dữ liệu
```sql
-- Kiểm tra
SELECT _id, code, name FROM tenants 
WHERE code IN ('fpt-software', 'viettel-digital', 'vng-corporation');
```

Nếu chưa có, cần tạo tenant trước:
```sql
INSERT INTO tenants (_id, code, name, status, tier)
VALUES 
  (gen_random_uuid(), 'fpt-software', 'FPT Software', 'ACTIVE', 'ENTERPRISE'),
  (gen_random_uuid(), 'viettel-digital', 'Viettel Digital', 'ACTIVE', 'PRO'),
  (gen_random_uuid(), 'vng-corporation', 'VNG Corporation', 'ACTIVE', 'ENTERPRISE');
```

### Bước 2: Chạy migration script
```bash
psql -h your-yugabyte-host -U your-user -d your-database -f /sql/tenant_app_routes.sql
```

hoặc trong Supabase SQL Editor:
1. Copy toàn bộ nội dung file `/sql/tenant_app_routes.sql`
2. Paste vào SQL Editor
3. Click "Run"

### Bước 3: Verify kết quả
```sql
-- Kiểm tra số lượng routes
SELECT COUNT(*) FROM tenant_app_routes;
-- Expected: 8-11 routes (tùy tenant có sẵn)

-- Xem chi tiết
SELECT 
    t.name as tenant,
    tar.domain,
    tar.path_prefix,
    tar.app_code,
    tar.ssl_status
FROM tenant_app_routes tar
JOIN tenants t ON tar.tenant_id = t._id
ORDER BY t.name, tar.domain;
```

## Query examples cho API

### 1. Resolve domain → tenant + app
```sql
-- Request: https://fpt.saas.com/employees
SELECT tenant_id, app_code
FROM tenant_app_routes
WHERE domain = 'fpt.saas.com' 
  AND '/employees' LIKE path_prefix || '%'
ORDER BY LENGTH(path_prefix) DESC
LIMIT 1;
```

### 2. Lấy danh sách routes của tenant (Admin panel)
```sql
SELECT 
    domain,
    path_prefix,
    app_code,
    is_primary,
    is_custom_domain,
    ssl_status
FROM tenant_app_routes
WHERE tenant_id = '<tenant_uuid>'
ORDER BY is_primary DESC, created_at DESC;
```

### 3. Tìm custom domains cần renew SSL
```sql
SELECT 
    t.name,
    tar.domain,
    tar.updated_at
FROM tenant_app_routes tar
JOIN tenants t ON tar.tenant_id = t._id
WHERE tar.is_custom_domain = TRUE
  AND tar.ssl_status = 'ACTIVE'
  AND tar.updated_at < NOW() - INTERVAL '60 days'; -- SSL cert gần hết hạn
```

### 4. Analytics: Đếm custom domains theo tenant
```sql
SELECT 
    t.name,
    COUNT(CASE WHEN tar.is_custom_domain THEN 1 END) as custom_domains_count,
    COUNT(CASE WHEN tar.is_custom_domain = FALSE THEN 1 END) as subdomains_count
FROM tenants t
LEFT JOIN tenant_app_routes tar ON t._id = tar.tenant_id
GROUP BY t.name
ORDER BY custom_domains_count DESC;
```

## Troubleshooting

### Lỗi: duplicate key value violates unique constraint "uq_domain_path"
**Nguyên nhân**: Đã tồn tại route với cùng `(domain, path_prefix)`  
**Giải pháp**: Kiểm tra và xóa route cũ hoặc dùng `ON CONFLICT DO NOTHING`

### Lỗi: insert or update on table "tenant_app_routes" violates foreign key constraint
**Nguyên nhân**: `tenant_id` không tồn tại trong bảng `tenants`  
**Giải pháp**: Tạo tenant trước khi thêm routes

### Performance chậm khi query routing
**Kiểm tra**: Index có được sử dụng không?
```sql
EXPLAIN ANALYZE
SELECT tenant_id, app_code 
FROM tenant_app_routes 
WHERE domain = 'fpt.saas.com' 
  AND path_prefix = '/';
```

**Kết quả mong đợi**: `Index Scan using idx_routes_fast_lookup`  
**Nếu là Seq Scan**: Cần rebuild index hoặc VACUUM ANALYZE

## Best Practices

1. **Luôn set is_primary = TRUE** cho ít nhất 1 route của tenant
2. **Path prefix phải có thứ tự**: Route dài hơn (VD: `/crm/settings`) nên tạo trước route ngắn (VD: `/crm`)
3. **Custom domain**: Luôn bắt đầu với `ssl_status = 'NONE'`, sau đó update qua workflow
4. **Monitoring**: Set up alert cho routes có `ssl_status = 'FAILED'` hoặc `PENDING` quá 24h
5. **Audit trail**: Có thể thêm trigger để log vào bảng `audit_logs` mỗi khi thay đổi routes

## Migration Rollback

Nếu cần rollback:
```sql
DROP TABLE IF EXISTS tenant_app_routes CASCADE;
-- Sau đó restore từ backup
```

**Lưu ý**: Do có `ON DELETE CASCADE`, nếu xóa tenant thì tất cả routes cũng bị xóa theo.

## Tích hợp với Golang Backend

```go
type TenantAppRoute struct {
    ID             uuid.UUID `db:"_id" json:"id"`
    TenantID       uuid.UUID `db:"tenant_id" json:"tenantId"`
    AppCode        string    `db:"app_code" json:"appCode"`
    Domain         string    `db:"domain" json:"domain"`
    PathPrefix     string    `db:"path_prefix" json:"pathPrefix"`
    IsPrimary      bool      `db:"is_primary" json:"isPrimary"`
    IsCustomDomain bool      `db:"is_custom_domain" json:"isCustomDomain"`
    SSLStatus      string    `db:"ssl_status" json:"sslStatus"`
    CreatedAt      time.Time `db:"created_at" json:"createdAt"`
    UpdatedAt      time.Time `db:"updated_at" json:"updatedAt"`
    Version        int64     `db:"version" json:"version"`
}

// Resolver function cho API Gateway
func (r *RouteRepository) ResolveRoute(ctx context.Context, domain, path string) (*TenantAppRoute, error) {
    query := `
        SELECT * FROM tenant_app_routes
        WHERE domain = $1 
          AND $2 LIKE path_prefix || '%'
        ORDER BY LENGTH(path_prefix) DESC
        LIMIT 1
    `
    
    var route TenantAppRoute
    err := r.db.GetContext(ctx, &route, query, domain, path)
    return &route, err
}
```

## Tích hợp với TypeScript Frontend

```typescript
export interface TenantAppRoute {
  id: string;
  tenantId: string;
  appCode: string;
  domain: string;
  pathPrefix: string;
  isPrimary: boolean;
  isCustomDomain: boolean;
  sslStatus: 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  version: number;
}

// API call
export async function getTenantRoutes(tenantId: string): Promise<TenantAppRoute[]> {
  const response = await fetch(`/api/tenants/${tenantId}/routes`);
  return response.json();
}
```

---

**Tài liệu tham khảo**:
- Database Design Guidelines: `/docs/Database.md`
- Collections Schema: `/docs/Collections.md`
- Full DDL Commands: `/docs/DatabaseCommand.md` (lines 1743-1783)
- All SQL migrations: `/sql/README.md`
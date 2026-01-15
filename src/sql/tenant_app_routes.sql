-- =====================================================
-- MIGRATION: tenant_app_routes
-- Mục đích: Tạo lại bảng tenant_app_routes với cấu trúc chuẩn
--          theo phân tích trong docs/DatabaseCommand.md
-- Ngày tạo: 2026-01-14
-- Tuân thủ: docs/Database.md - Primary key = _id (UUID)
-- =====================================================

-- 1. XÓA BẢNG CŨ (NẾU TỒN TẠI)
DROP TABLE IF EXISTS tenant_app_routes CASCADE;

-- 2. TẠO BẢNG MỚI
CREATE TABLE tenant_app_routes (
    -- I. ĐỊNH DANH & LIÊN KẾT
    _id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    app_code VARCHAR(50) NOT NULL,

    -- II. CẤU HÌNH ĐỊNH TUYẾN
    domain VARCHAR(255) NOT NULL,
    path_prefix VARCHAR(100) NOT NULL DEFAULT '/',
    
    -- III. THÔNG TIN PHỤ TRỢ
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_custom_domain BOOLEAN NOT NULL DEFAULT FALSE,
    ssl_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
    
    -- IV. AUDIT & VERSIONING
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 1,

    -- V. RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT fk_routes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT uq_domain_path UNIQUE (domain, path_prefix),
    CONSTRAINT chk_route_domain_fmt CHECK (domain ~ '^[a-z0-9.-]+$'),
    CONSTRAINT chk_route_path_fmt CHECK (path_prefix ~ '^/[a-z0-9-/]*$'),
    CONSTRAINT chk_ssl_status CHECK (ssl_status IN ('NONE', 'PENDING', 'ACTIVE', 'FAILED'))
);

-- 3. CHIẾN LƯỢC ĐÁNH INDEX (INDEXING STRATEGY)

-- Index "Thần thánh" cho Router (Covering Index)
-- Giúp API Gateway tìm nhanh tenant_id và app_code từ domain + path
-- Query: SELECT tenant_id, app_code FROM tenant_app_routes WHERE domain = ? AND path_prefix = ?;
CREATE UNIQUE INDEX idx_routes_fast_lookup 
ON tenant_app_routes (domain, path_prefix) 
INCLUDE (tenant_id, app_code, is_custom_domain);

-- Index hỗ trợ quản lý danh sách Route của một Tenant
CREATE INDEX idx_routes_tenant_list 
ON tenant_app_routes (tenant_id, created_at DESC);

-- 4. COMMENT CHO BẢNG VÀ CÁC CỘT (DOCUMENTATION)
COMMENT ON TABLE tenant_app_routes IS 'Quản lý định tuyến domain và path cho các ứng dụng của tenant trong hệ thống SaaS multi-tenant';

COMMENT ON COLUMN tenant_app_routes._id IS 'Định danh duy nhất (UUID v7)';
COMMENT ON COLUMN tenant_app_routes.tenant_id IS 'ID của tenant sở hữu route này';
COMMENT ON COLUMN tenant_app_routes.app_code IS 'Mã ứng dụng (VD: HRM_APP, CRM_APP)';
COMMENT ON COLUMN tenant_app_routes.domain IS 'Domain hoặc subdomain (VD: fpt.saas.com, custom-domain.com)';
COMMENT ON COLUMN tenant_app_routes.path_prefix IS 'Tiền tố đường dẫn (VD: /, /app, /admin)';
COMMENT ON COLUMN tenant_app_routes.is_primary IS 'Đánh dấu route chính của tenant';
COMMENT ON COLUMN tenant_app_routes.is_custom_domain IS 'TRUE nếu là custom domain, FALSE nếu là subdomain của platform';
COMMENT ON COLUMN tenant_app_routes.ssl_status IS 'Trạng thái SSL: NONE, PENDING, ACTIVE, FAILED';

-- =====================================================
-- DỮ LIỆU DEMO (SEED DATA)
-- =====================================================

-- 5. Tạo UUID v7 generator function (nếu chưa có)
CREATE OR REPLACE FUNCTION generate_uuid_v7() RETURNS UUID AS $$
DECLARE
    unix_ts_ms BIGINT;
    uuid_bytes BYTEA;
BEGIN
    unix_ts_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    uuid_bytes := decode(
        lpad(to_hex(unix_ts_ms), 12, '0') || 
        encode(gen_random_bytes(10), 'hex'),
        'hex'
    );
    RETURN encode(uuid_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql;

-- 6. Insert dữ liệu demo

-- === DEMO TENANT 1: Tech Innovators Vietnam ===
-- Subdomain mặc định: tech-innovators-vietnam.saas.com
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'HRM_APP',
    'tech-innovators-vietnam.saas.com',
    '/',
    TRUE,
    FALSE,
    'ACTIVE',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'tech-innovators-vietnam'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- Custom domain: hr.techinnovators.com
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'HRM_APP',
    'hr.techinnovators.com',
    '/',
    FALSE,
    TRUE,
    'ACTIVE',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'tech-innovators-vietnam'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- CRM App trên subdomain
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'CRM_APP',
    'tech-innovators-vietnam.saas.com',
    '/crm',
    FALSE,
    FALSE,
    'ACTIVE',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'tech-innovators-vietnam'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- === DEMO TENANT 2: Saigon Digital Solutions ===
-- Subdomain mặc định: saigon-digital-solutions.saas.com
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'HRM_APP',
    'saigon-digital-solutions.saas.com',
    '/',
    TRUE,
    FALSE,
    'ACTIVE',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'saigon-digital-solutions'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- Custom domain đang pending SSL
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'HRM_APP',
    'portal.saigondigital.vn',
    '/',
    FALSE,
    TRUE,
    'PENDING',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'saigon-digital-solutions'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- === DEMO TENANT 3: Hanoi Software House ===
-- Subdomain mặc định: hanoi-software-house.saas.com
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'HRM_APP',
    'hanoi-software-house.saas.com',
    '/',
    TRUE,
    FALSE,
    'ACTIVE',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'hanoi-software-house'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- Multi-app setup: HRM và CRM trên các path khác nhau
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'CRM_APP',
    'hanoi-software-house.saas.com',
    '/crm',
    FALSE,
    FALSE,
    'ACTIVE',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'hanoi-software-house'
ON CONFLICT (domain, path_prefix) DO NOTHING;

INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'PM_APP',
    'hanoi-software-house.saas.com',
    '/pm',
    FALSE,
    FALSE,
    'ACTIVE',
    NOW(),
    NOW(),
    1
FROM tenants t WHERE t.code = 'hanoi-software-house'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- Custom domain failed SSL
INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, created_at, updated_at, version)
SELECT 
    generate_uuid_v7(),
    t._id,
    'HRM_APP',
    'old-domain.hanoisoft.vn',
    '/',
    FALSE,
    TRUE,
    'FAILED',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    1
FROM tenants t WHERE t.code = 'hanoi-software-house'
ON CONFLICT (domain, path_prefix) DO NOTHING;

-- =====================================================
-- 7. VERIFICATION QUERIES (Kiểm tra dữ liệu)
-- =====================================================

-- Kiểm tra số lượng routes đã tạo
SELECT 'Total routes created:' as metric, COUNT(*)::text as value FROM tenant_app_routes
UNION ALL
SELECT 'Unique tenants:', COUNT(DISTINCT tenant_id)::text FROM tenant_app_routes
UNION ALL
SELECT 'Active routes:', COUNT(*)::text FROM tenant_app_routes WHERE ssl_status = 'ACTIVE'
UNION ALL
SELECT 'Custom domains:', COUNT(*)::text FROM tenant_app_routes WHERE is_custom_domain = TRUE
UNION ALL
SELECT 'Primary routes:', COUNT(*)::text FROM tenant_app_routes WHERE is_primary = TRUE;

-- Xem tất cả routes theo tenant
SELECT 
    t.name as tenant_name,
    tar.app_code,
    tar.domain,
    tar.path_prefix,
    tar.is_primary,
    tar.is_custom_domain,
    tar.ssl_status
FROM tenant_app_routes tar
JOIN tenants t ON tar.tenant_id = t._id
ORDER BY t.name, tar.is_primary DESC, tar.domain, tar.path_prefix;

-- =====================================================
-- 8. SAMPLE QUERIES (Các truy vấn mẫu API)
-- =====================================================

-- Query 1: API Gateway lookup (Router logic)
-- Tìm tenant_id và app_code từ request domain và path
-- EXPLAIN ANALYZE
-- SELECT tenant_id, app_code, is_custom_domain 
-- FROM tenant_app_routes 
-- WHERE domain = 'fpt.saas.com' 
--   AND path_prefix = '/';

-- Query 2: Lấy tất cả routes của một tenant
-- SELECT * 
-- FROM tenant_app_routes 
-- WHERE tenant_id = (SELECT _id FROM tenants WHERE code = 'fpt-software')
-- ORDER BY created_at DESC;

-- Query 3: Tìm tất cả custom domains đang active
-- SELECT 
--     t.name as tenant_name,
--     tar.domain,
--     tar.app_code,
--     tar.ssl_status
-- FROM tenant_app_routes tar
-- JOIN tenants t ON tar.tenant_id = t._id
-- WHERE tar.is_custom_domain = TRUE
--   AND tar.ssl_status = 'ACTIVE';

-- Query 4: Tìm routes có vấn đề về SSL
-- SELECT 
--     t.name as tenant_name,
--     tar.domain,
--     tar.ssl_status,
--     tar.updated_at
-- FROM tenant_app_routes tar
-- JOIN tenants t ON tar.tenant_id = t._id
-- WHERE tar.ssl_status IN ('PENDING', 'FAILED')
-- ORDER BY tar.updated_at DESC;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
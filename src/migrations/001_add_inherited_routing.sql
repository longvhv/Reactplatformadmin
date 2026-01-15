-- =====================================================
-- Migration: Add Inherited Routing Support
-- Version: 001
-- Date: 2026-01-14
-- Author: System
-- Description: Thêm hỗ trợ cho Inherited Routing trong tenant_app_routes
--              để xử lý mô hình Tập đoàn/Đại lý (Tenant Cha - Con)
-- =====================================================

-- BƯỚC 1: Thêm cột route_scope
-- =====================================================
-- Cột này xác định phạm vi routing của một app route:
-- - SPECIFIC_DOMAIN: Route chạy trên 1 domain cụ thể (mặc định, hành vi hiện tại)
-- - ALL_MY_DOMAINS: Route chạy trên tất cả domains của tenant sở hữu
-- - INHERITED: Route chạy trên tất cả domains của tenant cha (cho tenant con)

ALTER TABLE tenant_app_routes
ADD COLUMN route_scope VARCHAR(20) NOT NULL DEFAULT 'SPECIFIC_DOMAIN';

COMMENT ON COLUMN tenant_app_routes.route_scope IS 
'Phạm vi routing: SPECIFIC_DOMAIN (domain cụ thể), ALL_MY_DOMAINS (tất cả domain của tenant), INHERITED (domain của tenant cha)';


-- BƯỚC 2: Thêm constraint kiểm tra logic route_scope
-- =====================================================
-- Quy tắc:
-- - Nếu route_scope = 'SPECIFIC_DOMAIN' → domain PHẢI có giá trị
-- - Nếu route_scope = 'ALL_MY_DOMAINS' hoặc 'INHERITED' → domain PHẢI là NULL

ALTER TABLE tenant_app_routes
ADD CONSTRAINT chk_route_scope_logic CHECK (
    (route_scope = 'SPECIFIC_DOMAIN' AND domain IS NOT NULL) OR
    (route_scope IN ('ALL_MY_DOMAINS', 'INHERITED') AND domain IS NULL)
);


-- BƯỚC 3: Thêm constraint kiểm tra giá trị hợp lệ
-- =====================================================
ALTER TABLE tenant_app_routes
ADD CONSTRAINT chk_route_scope_values CHECK (
    route_scope IN ('SPECIFIC_DOMAIN', 'ALL_MY_DOMAINS', 'INHERITED')
);


-- BƯỚC 4: Thêm unique index cho INHERITED routes
-- =====================================================
-- Đảm bảo không có 2 tenant con nào tranh giành cùng 1 path_prefix
-- Ví dụ: Tenant Con A và B không thể cùng dùng /con1

CREATE UNIQUE INDEX idx_routes_inherited_unique 
ON tenant_app_routes (path_prefix, app_code) 
WHERE route_scope = 'INHERITED';

COMMENT ON INDEX idx_routes_inherited_unique IS 
'Đảm bảo mỗi path_prefix + app_code chỉ được sử dụng 1 lần cho INHERITED routes';


-- BƯỚC 5: Thêm index cho query performance
-- =====================================================
-- Index cho việc lookup routes theo scope
CREATE INDEX idx_routes_scope ON tenant_app_routes (route_scope);

-- Index cho việc lookup routes theo tenant_id + scope (query phổ biến)
CREATE INDEX idx_routes_tenant_scope ON tenant_app_routes (tenant_id, route_scope);


-- BƯỚC 6: Thêm function helper để resolve domain routing
-- =====================================================
-- Function này giúp resolve domain nào sẽ được sử dụng cho một route
-- dựa trên route_scope và quan hệ parent-child

CREATE OR REPLACE FUNCTION resolve_route_domains(
    p_route_id UUID
)
RETURNS TABLE (
    resolved_domain VARCHAR(255),
    source_tenant_id UUID,
    source_type VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    WITH route_info AS (
        SELECT 
            r._id,
            r.tenant_id,
            r.domain,
            r.route_scope,
            r.app_code,
            r.path_prefix,
            t.parent_tenant_id
        FROM tenant_app_routes r
        JOIN tenants t ON r.tenant_id = t._id
        WHERE r._id = p_route_id
    )
    SELECT 
        CASE 
            -- SPECIFIC_DOMAIN: Trả về domain đã khai báo
            WHEN ri.route_scope = 'SPECIFIC_DOMAIN' THEN ri.domain
            
            -- ALL_MY_DOMAINS: Trả về tất cả domains của tenant hiện tại
            WHEN ri.route_scope = 'ALL_MY_DOMAINS' THEN td.domain
            
            -- INHERITED: Trả về tất cả domains của tenant cha
            WHEN ri.route_scope = 'INHERITED' THEN ptd.domain
        END AS resolved_domain,
        
        CASE 
            WHEN ri.route_scope = 'SPECIFIC_DOMAIN' THEN ri.tenant_id
            WHEN ri.route_scope = 'ALL_MY_DOMAINS' THEN ri.tenant_id
            WHEN ri.route_scope = 'INHERITED' THEN ri.parent_tenant_id
        END AS source_tenant_id,
        
        ri.route_scope AS source_type
    FROM route_info ri
    LEFT JOIN tenant_domains td ON td.tenant_id = ri.tenant_id 
        AND ri.route_scope = 'ALL_MY_DOMAINS'
    LEFT JOIN tenant_domains ptd ON ptd.tenant_id = ri.parent_tenant_id 
        AND ri.route_scope = 'INHERITED';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION resolve_route_domains IS 
'Resolve danh sách domains thực tế mà một route sẽ chạy, dựa trên route_scope';


-- BƯỚC 7: Thêm view để xem routes đã resolve
-- =====================================================
CREATE OR REPLACE VIEW v_tenant_app_routes_resolved AS
SELECT 
    r._id AS route_id,
    r.tenant_id,
    t.name AS tenant_name,
    t.parent_tenant_id,
    pt.name AS parent_tenant_name,
    r.app_code,
    r.path_prefix,
    r.route_scope,
    r.domain AS declared_domain,
    rrd.resolved_domain,
    rrd.source_tenant_id,
    rrd.source_type,
    r.is_primary,
    r.is_custom_domain,
    r.ssl_status,
    r.status,
    r.created_at,
    r.updated_at
FROM tenant_app_routes r
JOIN tenants t ON r.tenant_id = t._id
LEFT JOIN tenants pt ON t.parent_tenant_id = pt._id
CROSS JOIN LATERAL resolve_route_domains(r._id) rrd;

COMMENT ON VIEW v_tenant_app_routes_resolved IS 
'View hiển thị tất cả routes với domains đã resolve theo logic Inherited Routing';


-- BƯỚC 8: Migration dữ liệu hiện có (nếu cần)
-- =====================================================
-- Tất cả routes hiện tại sẽ giữ route_scope = 'SPECIFIC_DOMAIN' (đã set làm default)
-- Không cần UPDATE vì DEFAULT đã handle

-- Kiểm tra dữ liệu sau migration
DO $$
DECLARE
    total_routes INTEGER;
    specific_routes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_routes FROM tenant_app_routes;
    SELECT COUNT(*) INTO specific_routes FROM tenant_app_routes WHERE route_scope = 'SPECIFIC_DOMAIN';
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Total routes: %', total_routes;
    RAISE NOTICE 'SPECIFIC_DOMAIN routes: %', specific_routes;
    RAISE NOTICE 'All existing routes have been set to SPECIFIC_DOMAIN scope';
END $$;


-- =====================================================
-- ROLLBACK SCRIPT (Chỉ sử dụng khi cần revert migration)
-- =====================================================
-- CẢNH BÁO: Rollback sẽ xóa tất cả dữ liệu route_scope!
-- Uncomment các dòng sau nếu cần rollback:

/*
DROP VIEW IF EXISTS v_tenant_app_routes_resolved;
DROP FUNCTION IF EXISTS resolve_route_domains(UUID);
DROP INDEX IF EXISTS idx_routes_tenant_scope;
DROP INDEX IF EXISTS idx_routes_scope;
DROP INDEX IF EXISTS idx_routes_inherited_unique;
ALTER TABLE tenant_app_routes DROP CONSTRAINT IF EXISTS chk_route_scope_values;
ALTER TABLE tenant_app_routes DROP CONSTRAINT IF EXISTS chk_route_scope_logic;
ALTER TABLE tenant_app_routes DROP COLUMN IF EXISTS route_scope;
*/

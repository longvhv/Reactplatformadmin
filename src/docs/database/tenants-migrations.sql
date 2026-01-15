-- ============================================================================
-- TENANTS MODULE - DATABASE MIGRATIONS
-- ============================================================================
-- Version: 1.0.0
-- Description: Complete migration scripts for tenants and related tables
-- Database: PostgreSQL / YugabyteDB
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 1. TENANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    -- I. ĐỊNH DANH & HẠ TẦNG
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL,
    data_region VARCHAR(50) NOT NULL DEFAULT 'ap-southeast-1',
    compliance_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    parent_tenant_id UUID,
    path TEXT,
    
    -- II. THÔNG TIN NGHIỆP VỤ & ĐỊA PHƯƠNG HÓA
    name TEXT NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
    billing_type VARCHAR(20) NOT NULL DEFAULT 'POSTPAID',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

    -- III. DỮ LIỆU ĐỘNG (JSONB)
    profile JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',

    -- IV. TRẠNG THÁI & TRUY VẾT
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,

    -- V. CÁC RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT uq_tenants_code UNIQUE (code),
    CONSTRAINT chk_tenants_code_fmt CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_tenants_tier CHECK (tier IN (
        'FREE', 'PRO', 'ENTERPRISE',
        'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE',
        'PROVIDER'
    )),
    CONSTRAINT fk_tenants_parent FOREIGN KEY (parent_tenant_id) 
        REFERENCES tenants(_id) ON DELETE SET NULL,
    CONSTRAINT chk_tenants_status CHECK (status IN (
        'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'
    )),
    CONSTRAINT chk_tenants_region CHECK (data_region IN (
        'ap-southeast-1', 'us-east-1', 'eu-central-1'
    )),
    CONSTRAINT chk_tenants_compliance CHECK (compliance_level IN (
        'STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS'
    )),
    CONSTRAINT chk_tenants_billing CHECK (billing_type IN (
        'PREPAID', 'POSTPAID'
    )),
    CONSTRAINT chk_tenants_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_tenants_version CHECK (version >= 1)
);

-- Index hỗ trợ xác thực và điều hướng (Login/Routing) theo subdomain/slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_code_active 
ON tenants (code) 
WHERE deleted_at IS NULL;

-- Index GIN hỗ trợ tìm kiếm linh hoạt bên trong cấu hình Settings
CREATE INDEX IF NOT EXISTS idx_tenants_settings_gin 
ON tenants USING GIN (settings);

-- Index GIN hỗ trợ tìm kiếm trong Profile
CREATE INDEX IF NOT EXISTS idx_tenants_profile_gin 
ON tenants USING GIN (profile);

-- Index hỗ trợ báo cáo quản trị hệ thống theo khu vực và gói cước
CREATE INDEX IF NOT EXISTS idx_tenants_infra_stats 
ON tenants (data_region, tier, status);

-- Index hỗ trợ truy vấn cấu trúc cây đối tác phân phối (Materialized Path)
CREATE INDEX IF NOT EXISTS idx_tenants_path 
ON tenants (path ASC) 
WHERE deleted_at IS NULL;

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_tenants_updated_at();

-- ============================================================================
-- 2. TENANT_MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_members (
    -- I. ĐỊNH DANH & LIÊN KẾT (IDENTITY & LINK)
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- II. THÔNG TIN VẬN HÀNH (OPERATIONAL)
    display_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    custom_data JSONB NOT NULL DEFAULT '{}',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- III. TRUY VẾT & PHIÊN BẢN (AUDIT & VERSIONING)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    version BIGINT NOT NULL DEFAULT 1,

    -- IV. RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT fk_mem_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    -- Note: user_id FK will be added after users table is created
    CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT chk_mem_status CHECK (status IN (
        'INVITED', 'ACTIVE', 'SUSPENDED', 'RESIGNED'
    )),
    CONSTRAINT chk_mem_updated CHECK (updated_at >= created_at)
);

-- Index quan trọng để truy vấn danh sách thành viên của một Tenant
CREATE INDEX IF NOT EXISTS idx_mem_tenant 
ON tenant_members (tenant_id) 
WHERE deleted_at IS NULL;

-- Index để tìm tất cả tenant mà user tham gia
CREATE INDEX IF NOT EXISTS idx_mem_user 
ON tenant_members (user_id) 
WHERE deleted_at IS NULL;

-- GIN Index để tìm kiếm trong custom_data
CREATE INDEX IF NOT EXISTS idx_mem_custom_data 
ON tenant_members USING GIN (custom_data);

-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_tenant_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_members_updated_at
BEFORE UPDATE ON tenant_members
FOR EACH ROW
EXECUTE FUNCTION update_tenant_members_updated_at();

-- ============================================================================
-- 3. DEPARTMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
    -- I. ĐỊNH DANH & PHÂN CẤP (IDENTITY & HIERARCHY)
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    parent_id UUID,
    
    -- II. THÔNG TIN NGHIỆP VỤ (BUSINESS DATA)
    name TEXT NOT NULL,
    code VARCHAR(50),
    type VARCHAR(20) NOT NULL DEFAULT 'TEAM',
    head_member_id UUID,
    path TEXT,
    
    -- III. TRUY VẾT & PHIÊN BẢN (AUDIT & VERSIONING)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,

    -- RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT fk_dept_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_parent FOREIGN KEY (parent_id) 
        REFERENCES departments(_id) ON DELETE SET NULL,
    CONSTRAINT chk_dept_type CHECK (type IN (
        'DIVISION', 'DEPARTMENT', 'TEAM'
    )),
    CONSTRAINT chk_dept_updated CHECK (updated_at >= created_at)
);

-- Index để tìm tất cả phòng ban con bằng Materialized Path
CREATE INDEX IF NOT EXISTS idx_dept_path 
ON departments (tenant_id, path text_pattern_ops) 
WHERE deleted_at IS NULL;

-- Index hỗ trợ tìm kiếm phòng ban theo Tenant
CREATE INDEX IF NOT EXISTS idx_dept_tenant 
ON departments (tenant_id) 
WHERE deleted_at IS NULL;

-- Trigger tự động cập nhật path khi insert/update
CREATE OR REPLACE FUNCTION update_department_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = '/' || NEW._id::TEXT || '/';
    ELSE
        SELECT path || NEW._id::TEXT || '/'
        INTO NEW.path
        FROM departments
        WHERE _id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_department_path
BEFORE INSERT OR UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_department_path();

-- ============================================================================
-- 4. DEPARTMENT_MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS department_members (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    department_id UUID NOT NULL,
    member_id UUID NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    role_in_dept VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ràng buộc tham chiếu
    CONSTRAINT fk_dept_mem_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_mem_dept FOREIGN KEY (department_id) 
        REFERENCES departments(_id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_mem_member FOREIGN KEY (member_id) 
        REFERENCES tenant_members(_id) ON DELETE CASCADE,

    -- Đảm bảo một nhân sự không bị gán trùng lặp vào cùng một phòng ban
    CONSTRAINT uq_dept_member_unique UNIQUE (tenant_id, department_id, member_id),
    CONSTRAINT chk_dept_mem_updated CHECK (updated_at >= created_at)
);

-- Index hỗ trợ truy vấn danh sách nhân viên của một phòng ban
CREATE INDEX IF NOT EXISTS idx_dept_mem_lookup 
ON department_members (tenant_id, department_id);

-- Index hỗ trợ tìm tất cả các phòng ban mà một nhân viên đang tham gia
CREATE INDEX IF NOT EXISTS idx_dept_mem_member 
ON department_members (tenant_id, member_id);

-- Index lọc nhanh phòng ban chính
CREATE INDEX IF NOT EXISTS idx_dept_mem_primary 
ON department_members (tenant_id, is_primary) 
WHERE is_primary = TRUE;

-- ============================================================================
-- 5. SEED DATA (OPTIONAL)
-- ============================================================================

-- Insert platform provider tenant (super admin)
INSERT INTO tenants (
    _id, code, name, tier, status, data_region, 
    compliance_level, billing_type, timezone
) VALUES (
    uuid_generate_v4(),
    'platform-provider',
    'Platform Provider',
    'PROVIDER',
    'ACTIVE',
    'ap-southeast-1',
    'STANDARD',
    'POSTPAID',
    'UTC'
) ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 6. UTILITY FUNCTIONS
-- ============================================================================

-- Function to get all child departments
CREATE OR REPLACE FUNCTION get_child_departments(p_department_id UUID)
RETURNS TABLE (
    _id UUID,
    name TEXT,
    code VARCHAR(50),
    type VARCHAR(20),
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dept_tree AS (
        -- Root
        SELECT 
            d._id, d.name, d.code, d.type, d.path,
            0 as level
        FROM departments d
        WHERE d._id = p_department_id AND d.deleted_at IS NULL
        
        UNION ALL
        
        -- Children
        SELECT 
            d._id, d.name, d.code, d.type, d.path,
            dt.level + 1
        FROM departments d
        INNER JOIN dept_tree dt ON d.parent_id = dt._id
        WHERE d.deleted_at IS NULL
    )
    SELECT dt._id, dt.name, dt.code, dt.type, dt.level
    FROM dept_tree dt
    ORDER BY dt.path;
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant member count
CREATE OR REPLACE FUNCTION get_tenant_member_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    member_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO member_count
    FROM tenant_members
    WHERE tenant_id = p_tenant_id
    AND deleted_at IS NULL
    AND status = 'ACTIVE';
    
    RETURN member_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. VIEWS (FOR REPORTING)
-- ============================================================================

-- View: Active tenants with stats
CREATE OR REPLACE VIEW v_active_tenants AS
SELECT 
    t._id,
    t.code,
    t.name,
    t.tier,
    t.status,
    t.data_region,
    COUNT(DISTINCT tm._id) as member_count,
    COUNT(DISTINCT d._id) as department_count,
    t.created_at,
    t.updated_at
FROM tenants t
LEFT JOIN tenant_members tm ON t._id = tm.tenant_id AND tm.deleted_at IS NULL
LEFT JOIN departments d ON t._id = d.tenant_id AND d.deleted_at IS NULL
WHERE t.deleted_at IS NULL
GROUP BY t._id, t.code, t.name, t.tier, t.status, t.data_region, t.created_at, t.updated_at;

-- View: Tenant hierarchy
CREATE OR REPLACE VIEW v_tenant_hierarchy AS
WITH RECURSIVE tenant_tree AS (
    -- Roots
    SELECT 
        _id, code, name, tier, status, parent_tenant_id, path,
        0 as level,
        ARRAY[code] as hierarchy_path
    FROM tenants
    WHERE parent_tenant_id IS NULL AND deleted_at IS NULL
    
    UNION ALL
    
    -- Children
    SELECT 
        t._id, t.code, t.name, t.tier, t.status, t.parent_tenant_id, t.path,
        tt.level + 1,
        tt.hierarchy_path || t.code
    FROM tenants t
    INNER JOIN tenant_tree tt ON t.parent_tenant_id = tt._id
    WHERE t.deleted_at IS NULL
)
SELECT * FROM tenant_tree ORDER BY hierarchy_path;

-- ============================================================================
-- 8. PERFORMANCE MONITORING
-- ============================================================================

-- Analyze tables for query optimization
ANALYZE tenants;
ANALYZE tenant_members;
ANALYZE departments;
ANALYZE department_members;

-- ============================================================================
-- 9. ROLLBACK SCRIPT (USE WITH CAUTION)
-- ============================================================================

/*
-- DROP TABLES IN REVERSE ORDER
DROP VIEW IF EXISTS v_tenant_hierarchy CASCADE;
DROP VIEW IF EXISTS v_active_tenants CASCADE;
DROP FUNCTION IF EXISTS get_tenant_member_count(UUID);
DROP FUNCTION IF EXISTS get_child_departments(UUID);
DROP TABLE IF EXISTS department_members CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS tenant_members CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP EXTENSION IF EXISTS pg_trgm;
*/

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================

-- =====================================================
-- Migration: Create tenant_applications table
-- Description: TENANT-SPECIFIC table ánh xạ Tenant ↔ Application (Many-to-Many)
-- Date: 2026-01-12
-- Standard: go-framework compliant với UUID v7, snake_case, audit trail
-- =====================================================

-- 1. Tạo bảng tenant_applications
CREATE TABLE IF NOT EXISTS tenant_applications (
    -- I. Định danh & Liên kết kỹ thuật
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    app_code VARCHAR(50) NOT NULL,
    
    -- II. Trạng thái & Cấu hình
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    
    -- License & Subscription
    license_type VARCHAR(50) DEFAULT 'TRIAL', -- TRIAL, BASIC, PREMIUM, ENTERPRISE
    max_users INTEGER DEFAULT 10,
    expires_at TIMESTAMPTZ,
    
    -- Custom settings per tenant
    settings JSONB DEFAULT '{}',
    
    -- III. Audit Mixins
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- IV. Ràng buộc toàn vẹn
    CONSTRAINT fk_tenant_app_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_app_application FOREIGN KEY (app_code) REFERENCES applications(code) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_application UNIQUE (tenant_id, app_code),
    CONSTRAINT chk_tenant_app_license CHECK (license_type IN ('TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE')),
    CONSTRAINT chk_tenant_app_max_users CHECK (max_users > 0),
    CONSTRAINT chk_tenant_app_version CHECK (version >= 1),
    CONSTRAINT chk_tenant_app_updated CHECK (updated_at >= created_at)
);

-- 2. Chiến lược đánh Index

-- Index hỗ trợ query "tenants nào đang dùng app X?"
CREATE INDEX IF NOT EXISTS idx_tenant_applications_app 
ON tenant_applications (app_code) 
WHERE deleted_at IS NULL;

-- Index hỗ trợ query "tenant X đang dùng apps nào?"
CREATE INDEX IF NOT EXISTS idx_tenant_applications_tenant 
ON tenant_applications (tenant_id) 
WHERE deleted_at IS NULL;

-- Index hỗ trợ filter theo trạng thái active
CREATE INDEX IF NOT EXISTS idx_tenant_applications_active 
ON tenant_applications (app_code, is_active) 
WHERE deleted_at IS NULL;

-- Index cho audit trail
CREATE INDEX IF NOT EXISTS idx_tenant_applications_created_at ON tenant_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_applications_updated_at ON tenant_applications (updated_at DESC);

-- 3. Comment mô tả bảng
COMMENT ON TABLE tenant_applications IS 'Ánh xạ Many-to-Many giữa Tenants và Applications với license info';
COMMENT ON COLUMN tenant_applications.tenant_id IS 'ID của tenant sử dụng app';
COMMENT ON COLUMN tenant_applications.app_code IS 'Mã ứng dụng được sử dụng';
COMMENT ON COLUMN tenant_applications.license_type IS 'Loại license: TRIAL, BASIC, PREMIUM, ENTERPRISE';
COMMENT ON COLUMN tenant_applications.max_users IS 'Số users tối đa cho app này';
COMMENT ON COLUMN tenant_applications.expires_at IS 'Thời điểm hết hạn license';

-- 4. Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_tenant_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenant_applications_updated_at ON tenant_applications;
CREATE TRIGGER trigger_tenant_applications_updated_at
    BEFORE UPDATE ON tenant_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_applications_updated_at();

-- 5. Seed demo data
-- Giả sử các tenants đã tạo từ migration trước
-- Gán applications cho các tenants

-- Get first tenant for HRM_RECRUIT
DO $$
DECLARE
    tenant1_id UUID;
    tenant2_id UUID;
    tenant3_id UUID;
BEGIN
    -- Get 3 random tenants
    SELECT _id INTO tenant1_id FROM tenants WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 0;
    SELECT _id INTO tenant2_id FROM tenants WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1;
    SELECT _id INTO tenant3_id FROM tenants WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 2;
    
    -- Tenant 1 sử dụng cả HRM_RECRUIT và CRM_SALES
    IF tenant1_id IS NOT NULL THEN
        INSERT INTO tenant_applications (tenant_id, app_code, is_active, license_type, max_users, activated_at)
        VALUES 
            (tenant1_id, 'HRM_RECRUIT', TRUE, 'ENTERPRISE', 100, NOW()),
            (tenant1_id, 'CRM_SALES', TRUE, 'PREMIUM', 50, NOW())
        ON CONFLICT (tenant_id, app_code) DO NOTHING;
    END IF;
    
    -- Tenant 2 chỉ dùng HRM_RECRUIT
    IF tenant2_id IS NOT NULL THEN
        INSERT INTO tenant_applications (tenant_id, app_code, is_active, license_type, max_users, activated_at)
        VALUES 
            (tenant2_id, 'HRM_RECRUIT', TRUE, 'BASIC', 20, NOW())
        ON CONFLICT (tenant_id, app_code) DO NOTHING;
    END IF;
    
    -- Tenant 3 chỉ dùng CRM_SALES
    IF tenant3_id IS NOT NULL THEN
        INSERT INTO tenant_applications (tenant_id, app_code, is_active, license_type, max_users, activated_at)
        VALUES 
            (tenant3_id, 'CRM_SALES', TRUE, 'TRIAL', 10, NOW() + INTERVAL '30 days')
        ON CONFLICT (tenant_id, app_code) DO NOTHING;
    END IF;
END $$;

-- 6. Verify data
SELECT COUNT(*) as total_tenant_applications FROM tenant_applications WHERE deleted_at IS NULL;
SELECT 
    ta.app_code,
    t.name as tenant_name,
    ta.license_type,
    ta.is_active,
    ta.max_users
FROM tenant_applications ta
INNER JOIN tenants t ON ta.tenant_id = t._id
WHERE ta.deleted_at IS NULL
ORDER BY ta.app_code, t.name;

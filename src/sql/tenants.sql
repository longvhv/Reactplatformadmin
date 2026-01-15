-- =====================================================
-- TABLE: tenants
-- Mô tả: Quản lý các tổ chức/công ty (Multi-tenant)
-- Tài liệu: docs/DatabaseCommand.md (dòng 302-365)
-- =====================================================

-- 1. TẠO EXTENSION CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. BACKUP DỮ LIỆU CŨ (NẾU CẦN)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        DROP TABLE IF EXISTS tenants_backup_temp;
        CREATE TABLE tenants_backup_temp AS SELECT * FROM tenants;
        RAISE NOTICE 'Đã backup % bản ghi từ tenants', (SELECT COUNT(*) FROM tenants_backup_temp);
    END IF;
END $$;

-- 3. XÓA BẢNG CŨ
DROP TABLE IF EXISTS tenants CASCADE;

-- 4. TẠO BẢNG MỚI
CREATE TABLE tenants (
    -- I. ĐỊNH DANH & HẠ TẦNG (IDENTITY & INFRASTRUCTURE)
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL,
    data_region VARCHAR(50) NOT NULL DEFAULT 'ap-southeast-1',
    compliance_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    parent_tenant_id UUID,
    path TEXT, -- Materialized Path for hierarchy

    -- II. THÔNG TIN NGHIỆP VỤ & ĐỊA PHƯƠNG HÓA (BUSINESS & LOCALIZATION)
    name TEXT NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
    billing_type VARCHAR(20) NOT NULL DEFAULT 'POSTPAID',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

    -- III. DỮ LIỆU ĐỘNG (DYNAMIC DATA - JSONB)
    profile JSONB NOT NULL DEFAULT '{}', -- {tax_code, address, logo_url, website, etc.}
    settings JSONB NOT NULL DEFAULT '{}', -- {mfa_required, custom_branding, features, etc.}

    -- IV. TRẠNG THÁI & TRUY VẾT (STATUS & AUDIT)
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 1,

    -- V. CÁC RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT uq_tenants_code UNIQUE (code),
    CONSTRAINT chk_tenants_code_fmt CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_tenants_tier CHECK (tier IN (
        'FREE', 'PRO', 'ENTERPRISE', -- Khách hàng cuối
        'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE', -- Đối tác
        'PROVIDER' -- Chủ nền tảng
    )),
    CONSTRAINT fk_tenants_parent FOREIGN KEY (parent_tenant_id) REFERENCES tenants(_id) ON DELETE SET NULL,
    CONSTRAINT chk_tenants_status CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED')),
    CONSTRAINT chk_tenants_region CHECK (data_region IN ('ap-southeast-1', 'us-east-1', 'eu-central-1')),
    CONSTRAINT chk_tenants_compliance CHECK (compliance_level IN ('STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS')),
    CONSTRAINT chk_tenants_billing CHECK (billing_type IN ('PREPAID', 'POSTPAID')),
    CONSTRAINT chk_tenants_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_tenants_version CHECK (version >= 1)
);

-- 5. MIGRATE DỮ LIỆU (NẾU CẦN)
DO $$
DECLARE
    migrated_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants_backup_temp') THEN
        INSERT INTO tenants (
            _id,
            code,
            data_region,
            compliance_level,
            parent_tenant_id,
            path,
            name,
            tier,
            billing_type,
            timezone,
            profile,
            settings,
            status,
            created_at,
            updated_at,
            deleted_at,
            version
        )
        SELECT 
            _id,
            code,
            COALESCE(data_region, 'ap-southeast-1'),
            COALESCE(compliance_level, 'STANDARD'),
            parent_tenant_id,
            path,
            name,
            COALESCE(tier, 'FREE'),
            COALESCE(billing_type, 'POSTPAID'),
            COALESCE(timezone, 'UTC'),
            COALESCE(profile, '{}'::jsonb),
            COALESCE(settings, '{}'::jsonb),
            UPPER(COALESCE(status, 'TRIAL')),
            created_at,
            updated_at,
            deleted_at,
            COALESCE(version, 1)
        FROM tenants_backup_temp
        ON CONFLICT (_id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Đã migrate % bản ghi từ tenants_backup_temp', migrated_count;
    ELSE
        RAISE NOTICE 'Không có dữ liệu cũ để migrate';
    END IF;
END $$;

-- 6. TẠO INDEXES

-- Index hỗ trợ xác thực và điều hướng (Login/Routing) theo subdomain/slug
CREATE UNIQUE INDEX idx_tenants_code_active 
ON tenants (code) 
WHERE deleted_at IS NULL;

-- Index GIN hỗ trợ tìm kiếm linh hoạt bên trong cấu hình Settings (Ví dụ: tìm tenant bắt buộc MFA)
CREATE INDEX idx_tenants_settings_gin 
ON tenants USING GIN (settings);

-- Index GIN hỗ trợ tìm kiếm trong Profile (Ví dụ: tìm theo Mã số thuế trong JSON)
CREATE INDEX idx_tenants_profile_gin 
ON tenants USING GIN (profile);

-- Index hỗ trợ báo cáo quản trị hệ thống theo khu vực và gói cước
CREATE INDEX idx_tenants_infra_stats 
ON tenants (data_region, tier, status);

-- Index hỗ trợ truy vấn cấu trúc cây đối tác phân phối (Materialized Path)
CREATE INDEX idx_tenants_path 
ON tenants (path ASC) 
WHERE deleted_at IS NULL;

-- Index cho parent_tenant_id
CREATE INDEX idx_tenants_parent 
ON tenants (parent_tenant_id) 
WHERE parent_tenant_id IS NOT NULL AND deleted_at IS NULL;

-- Index cho status
CREATE INDEX idx_tenants_status 
ON tenants (status) 
WHERE deleted_at IS NULL;

-- Index cho tier
CREATE INDEX idx_tenants_tier 
ON tenants (tier) 
WHERE deleted_at IS NULL;

-- Full-text search index cho name
CREATE INDEX idx_tenants_name_trgm 
ON tenants USING GIN (name gin_trgm_ops);

-- 7. TẠO TRIGGERS

-- Auto-update updated_at và version
CREATE OR REPLACE FUNCTION update_tenants_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    
    -- Auto-update path nếu parent_tenant_id thay đổi
    IF NEW.parent_tenant_id IS DISTINCT FROM OLD.parent_tenant_id THEN
        IF NEW.parent_tenant_id IS NULL THEN
            NEW.path = NEW._id::TEXT;
        ELSE
            SELECT path || '/' || NEW._id::TEXT INTO NEW.path
            FROM tenants 
            WHERE _id = NEW.parent_tenant_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenants_timestamp
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenants_timestamp();

-- Auto-set path khi INSERT
CREATE OR REPLACE FUNCTION set_tenants_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_tenant_id IS NULL THEN
        NEW.path = NEW._id::TEXT;
    ELSE
        SELECT path || '/' || NEW._id::TEXT INTO NEW.path
        FROM tenants 
        WHERE _id = NEW.parent_tenant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_tenants_path
    BEFORE INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION set_tenants_path();

-- 8. THÊM COMMENTS
COMMENT ON TABLE tenants IS 'Multi-tenant organizations/companies';
COMMENT ON COLUMN tenants._id IS 'Primary key (UUID v7)';
COMMENT ON COLUMN tenants.code IS 'Unique tenant code/slug (lowercase, alphanumeric, dash)';
COMMENT ON COLUMN tenants.data_region IS 'Data residency region (ap-southeast-1, us-east-1, eu-central-1)';
COMMENT ON COLUMN tenants.compliance_level IS 'Compliance level (STANDARD, GDPR, HIPAA, PCI-DSS)';
COMMENT ON COLUMN tenants.parent_tenant_id IS 'Parent tenant for hierarchy (partners/resellers)';
COMMENT ON COLUMN tenants.path IS 'Materialized path for hierarchy queries';
COMMENT ON COLUMN tenants.name IS 'Tenant display name';
COMMENT ON COLUMN tenants.tier IS 'Subscription tier (FREE, PRO, ENTERPRISE, PARTNER_*, PROVIDER)';
COMMENT ON COLUMN tenants.billing_type IS 'Billing type (PREPAID, POSTPAID)';
COMMENT ON COLUMN tenants.timezone IS 'Default timezone for this tenant';
COMMENT ON COLUMN tenants.profile IS 'JSONB profile data (tax_code, address, logo_url, website, etc.)';
COMMENT ON COLUMN tenants.settings IS 'JSONB settings (mfa_required, custom_branding, features, etc.)';
COMMENT ON COLUMN tenants.status IS 'Tenant status (TRIAL, ACTIVE, SUSPENDED, CANCELLED)';
COMMENT ON COLUMN tenants.version IS 'Optimistic locking version';

-- 9. THÊM DEMO DATA (NẾU KHÔNG CÓ DỮ LIỆU CŨ)
DO $$
DECLARE
    demo_count INTEGER := 0;
    tenant_id UUID;
    i INTEGER;
    
    company_names VARCHAR[] := ARRAY[
        'Tech Innovators Vietnam',
        'Saigon Digital Solutions',
        'Hanoi Software House',
        'Vietnam Cloud Services',
        'Smart Business Co.',
        'Global Trading Corp',
        'E-Commerce Ventures',
        'Finance Tech Ltd',
        'Healthcare Systems',
        'Education Platform Inc',
        'Retail Management Co.',
        'Logistics Hub Vietnam',
        'Marketing Agency Pro',
        'Consulting Group Asia',
        'Manufacturing Solutions',
        'Real Estate Tech',
        'Food & Beverage Chain',
        'Travel & Tourism Co.',
        'Media & Entertainment',
        'Sports & Fitness Group'
    ];
    
    tiers VARCHAR[] := ARRAY['FREE', 'PRO', 'ENTERPRISE', 'PARTNER_BASIC', 'PARTNER_PREMIUM'];
    statuses VARCHAR[] := ARRAY['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'];
    regions VARCHAR[] := ARRAY['ap-southeast-1', 'us-east-1', 'eu-central-1'];
    
BEGIN
    -- Chỉ tạo demo data nếu bảng rỗng
    IF (SELECT COUNT(*) FROM tenants) = 0 THEN
        RAISE NOTICE 'Tạo demo data cho tenants...';
        
        -- Tạo 20 tenants
        FOR i IN 1..array_length(company_names, 1) LOOP
            tenant_id := gen_random_uuid();
            
            INSERT INTO tenants (
                _id,
                code,
                name,
                tier,
                billing_type,
                status,
                data_region,
                compliance_level,
                timezone,
                profile,
                settings
            ) VALUES (
                tenant_id,
                -- Code: lowercase, slug format
                lower(regexp_replace(company_names[i], '[^a-zA-Z0-9]+', '-', 'g')),
                company_names[i],
                -- Tier distribution: 40% FREE, 30% PRO, 20% ENTERPRISE, 10% PARTNER
                CASE 
                    WHEN random() < 0.4 THEN 'FREE'
                    WHEN random() < 0.7 THEN 'PRO'
                    WHEN random() < 0.9 THEN 'ENTERPRISE'
                    ELSE tiers[4 + floor(random() * 2)::INTEGER]
                END,
                -- Billing type: 70% POSTPAID, 30% PREPAID
                CASE WHEN random() < 0.7 THEN 'POSTPAID' ELSE 'PREPAID' END,
                -- Status distribution: 70% ACTIVE, 20% TRIAL, 8% SUSPENDED, 2% CANCELLED
                CASE 
                    WHEN random() < 0.7 THEN 'ACTIVE'
                    WHEN random() < 0.9 THEN 'TRIAL'
                    WHEN random() < 0.98 THEN 'SUSPENDED'
                    ELSE 'CANCELLED'
                END,
                -- Region: 70% ap-southeast-1, 20% us-east-1, 10% eu-central-1
                CASE 
                    WHEN random() < 0.7 THEN 'ap-southeast-1'
                    WHEN random() < 0.9 THEN 'us-east-1'
                    ELSE 'eu-central-1'
                END,
                -- Compliance: 80% STANDARD, others random
                CASE 
                    WHEN random() < 0.8 THEN 'STANDARD'
                    WHEN random() < 0.9 THEN 'GDPR'
                    WHEN random() < 0.95 THEN 'HIPAA'
                    ELSE 'PCI-DSS'
                END,
                'Asia/Ho_Chi_Minh',
                -- Profile JSONB
                jsonb_build_object(
                    'tax_code', LPAD(floor(random() * 9999999999)::TEXT, 10, '0'),
                    'address', (ARRAY[
                        'Hà Nội, Vietnam',
                        'TP.HCM, Vietnam',
                        'Đà Nẵng, Vietnam',
                        'Hải Phòng, Vietnam',
                        'Cần Thơ, Vietnam'
                    ])[1 + floor(random() * 5)],
                    'website', 'https://' || lower(regexp_replace(company_names[i], '[^a-zA-Z0-9]+', '', 'g')) || '.com',
                    'logo_url', 'https://ui-avatars.com/api/?name=' || encode(company_names[i]::bytea, 'base64'),
                    'phone', '+84' || LPAD(floor(random() * 999999999)::TEXT, 9, '0'),
                    'industry', (ARRAY[
                        'Technology',
                        'Finance',
                        'Healthcare',
                        'Education',
                        'Retail',
                        'Manufacturing',
                        'Services'
                    ])[1 + floor(random() * 7)],
                    'company_size', (ARRAY['1-10', '11-50', '51-200', '201-500', '500+'])[1 + floor(random() * 5)]
                ),
                -- Settings JSONB
                jsonb_build_object(
                    'mfa_required', random() < 0.3,
                    'custom_branding', random() < 0.5,
                    'features', jsonb_build_object(
                        'api_access', random() < 0.6,
                        'webhooks', random() < 0.4,
                        'advanced_reports', random() < 0.5,
                        'sso', random() < 0.3
                    ),
                    'limits', jsonb_build_object(
                        'max_users', CASE 
                            WHEN random() < 0.4 THEN 10
                            WHEN random() < 0.7 THEN 50
                            ELSE 200
                        END,
                        'storage_gb', CASE 
                            WHEN random() < 0.4 THEN 5
                            WHEN random() < 0.7 THEN 50
                            ELSE 200
                        END
                    )
                )
            );
            
            demo_count := demo_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Đã tạo % tenants demo', demo_count;
    ELSE
        RAISE NOTICE 'Bảng tenants đã có dữ liệu, bỏ qua tạo demo data';
    END IF;
END $$;

-- 10. ENABLE RLS (Row Level Security)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see tenants they are members of
CREATE POLICY tenants_isolation_policy ON tenants
    USING (
        _id IN (
            SELECT tenant_id 
            FROM tenant_members 
            WHERE user_id = auth.uid() 
            AND deleted_at IS NULL
        )
        OR
        -- Support staff can see all tenants
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE _id = auth.uid() 
            AND is_support_staff = TRUE
        )
    );

-- 11. THỐNG KÊ VÀ VERIFY
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOÀN TẤT TẠO BẢNG tenants';
    RAISE NOTICE '========================================';
END $$;

-- Summary by status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenants
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

-- Summary by tier
SELECT 
    tier,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenants
WHERE deleted_at IS NULL
GROUP BY tier
ORDER BY count DESC;

-- Summary by region
SELECT 
    data_region,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_count,
    COUNT(*) FILTER (WHERE status = 'TRIAL') as trial_count
FROM tenants
WHERE deleted_at IS NULL
GROUP BY data_region
ORDER BY count DESC;

-- Summary by billing type
SELECT 
    billing_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenants
WHERE deleted_at IS NULL
GROUP BY billing_type;

-- Top tenants with members
SELECT 
    t.code,
    t.name,
    t.tier,
    t.status,
    COUNT(tm._id) as member_count,
    t.created_at
FROM tenants t
LEFT JOIN tenant_members tm ON tm.tenant_id = t._id AND tm.deleted_at IS NULL
WHERE t.deleted_at IS NULL
GROUP BY t._id, t.code, t.name, t.tier, t.status, t.created_at
ORDER BY member_count DESC, t.created_at DESC
LIMIT 10;

-- Verify
SELECT 
    COUNT(*) as total_tenants,
    COUNT(*) FILTER (WHERE status = 'TRIAL') as trial,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
    COUNT(*) FILTER (WHERE status = 'SUSPENDED') as suspended,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as not_deleted,
    COUNT(*) FILTER (WHERE parent_tenant_id IS NOT NULL) as with_parent,
    COUNT(DISTINCT tier) as unique_tiers,
    COUNT(DISTINCT data_region) as unique_regions
FROM tenants;

-- Profile and settings examples
SELECT 
    code,
    name,
    tier,
    status,
    profile->>'tax_code' as tax_code,
    profile->>'industry' as industry,
    profile->>'company_size' as company_size,
    settings->'features'->>'api_access' as api_access,
    settings->'limits'->>'max_users' as max_users,
    created_at
FROM tenants
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- KẾT THÚC
-- =====================================================

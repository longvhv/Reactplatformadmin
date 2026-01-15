-- =====================================================
-- TABLE: tenant_members
-- Mô tả: User-tenant relationships (Nhiều-nhiều)
-- Tài liệu: docs/DatabaseCommand.md (dòng 418-450)
-- =====================================================

-- 1. BACKUP DỮ LIỆU CŨ (NẾU CẦN)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_members') THEN
        DROP TABLE IF EXISTS tenant_members_backup_temp;
        CREATE TABLE tenant_members_backup_temp AS SELECT * FROM tenant_members;
        RAISE NOTICE 'Đã backup % bản ghi từ tenant_members', (SELECT COUNT(*) FROM tenant_members_backup_temp);
    END IF;
END $$;

-- 2. XÓA BẢNG CŨ
DROP TABLE IF EXISTS tenant_members CASCADE;

-- 3. TẠO BẢNG MỚI
CREATE TABLE tenant_members (
    -- I. ĐỊNH DANH & LIÊN KẾT (IDENTITY & LINK)
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    CONSTRAINT fk_mem_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id) ON DELETE CASCADE,
    CONSTRAINT fk_mem_user FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE,
    CONSTRAINT fk_mem_created_by FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL,
    
    -- Đảm bảo một User chỉ có duy nhất 1 hồ sơ tại 1 Tenant (không trùng lặp)
    CONSTRAINT uq_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT chk_mem_status CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'RESIGNED')),
    CONSTRAINT chk_mem_updated CHECK (updated_at >= created_at)
);

-- 4. MIGRATE DỮ LIỆU (NẾU CẦN)
DO $$
DECLARE
    migrated_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_members_backup_temp') THEN
        -- Migrate dữ liệu cũ, mapping các columns
        INSERT INTO tenant_members (
            _id,
            tenant_id,
            user_id,
            display_name,
            status,
            custom_data,
            joined_at,
            created_at,
            updated_at,
            deleted_at,
            created_by,
            version
        )
        SELECT 
            _id,
            tenant_id,
            user_id,
            display_name,
            CASE 
                WHEN UPPER(status) IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'RESIGNED') THEN UPPER(status)
                ELSE 'ACTIVE'
            END as status,
            COALESCE(custom_data, '{}'::jsonb),
            COALESCE(joined_at, created_at),
            created_at,
            updated_at,
            deleted_at,
            created_by,
            COALESCE(version, 1)
        FROM tenant_members_backup_temp
        ON CONFLICT (_id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Đã migrate % bản ghi từ tenant_members_backup_temp', migrated_count;
    ELSE
        RAISE NOTICE 'Không có dữ liệu cũ để migrate';
    END IF;
END $$;

-- 5. TẠO INDEXES

-- Index quan trọng để truy vấn danh sách thành viên của một Tenant nhanh hơn
CREATE INDEX idx_mem_tenant ON tenant_members (tenant_id) WHERE deleted_at IS NULL;

-- Index để tìm user trong các tenant
CREATE INDEX idx_mem_user ON tenant_members (user_id) WHERE deleted_at IS NULL;

-- GIN Index để tìm kiếm trong custom_data (Ví dụ: tìm theo mã nhân viên lưu trong JSON)
CREATE INDEX idx_mem_custom_data ON tenant_members USING GIN (custom_data);

-- Index cho status
CREATE INDEX idx_mem_status ON tenant_members (status) WHERE deleted_at IS NULL;

-- Composite index cho tenant + status (query phổ biến)
CREATE INDEX idx_mem_tenant_status ON tenant_members (tenant_id, status) WHERE deleted_at IS NULL;

-- Index cho joined_at
CREATE INDEX idx_mem_joined_at ON tenant_members (joined_at DESC);

-- Index cho created_by
CREATE INDEX idx_mem_created_by ON tenant_members (created_by) WHERE created_by IS NOT NULL;

-- 6. TẠO TRIGGERS

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenant_members_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_members_timestamp
    BEFORE UPDATE ON tenant_members
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_members_timestamp();

-- 7. THÊM COMMENTS
COMMENT ON TABLE tenant_members IS 'User-tenant membership relationships (many-to-many)';
COMMENT ON COLUMN tenant_members._id IS 'Primary key (UUID v7)';
COMMENT ON COLUMN tenant_members.tenant_id IS 'Foreign key to tenants table';
COMMENT ON COLUMN tenant_members.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN tenant_members.display_name IS 'Display name in this tenant (can differ from user.full_name)';
COMMENT ON COLUMN tenant_members.status IS 'Membership status: INVITED, ACTIVE, SUSPENDED, RESIGNED';
COMMENT ON COLUMN tenant_members.custom_data IS 'Flexible JSONB for tenant-specific user data (employee_code, department, etc.)';
COMMENT ON COLUMN tenant_members.joined_at IS 'When user joined this tenant';
COMMENT ON COLUMN tenant_members.version IS 'Optimistic locking version';

-- 8. THÊM DEMO DATA (NẾU KHÔNG CÓ DỮ LIỆU CŨ)
DO $$
DECLARE
    demo_count INTEGER := 0;
    user_ids UUID[];
    tenant_ids UUID[];
    user_id UUID;
    tenant_id UUID;
    i INTEGER;
    j INTEGER;
    status_values VARCHAR[] := ARRAY['INVITED', 'ACTIVE', 'SUSPENDED', 'RESIGNED'];
    first_names VARCHAR[] := ARRAY['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi'];
    last_names VARCHAR[] := ARRAY['Văn An', 'Thị Bình', 'Văn Công', 'Thị Dung', 'Văn Em', 'Thị Phượng'];
BEGIN
    -- Chỉ tạo demo data nếu bảng rỗng
    IF (SELECT COUNT(*) FROM tenant_members) = 0 THEN
        -- Get user and tenant IDs
        SELECT ARRAY(SELECT _id FROM users LIMIT 30) INTO user_ids;
        SELECT ARRAY(SELECT _id FROM tenants LIMIT 10) INTO tenant_ids;
        
        IF array_length(user_ids, 1) IS NULL OR array_length(tenant_ids, 1) IS NULL THEN
            RAISE NOTICE 'Không đủ users hoặc tenants để tạo demo data';
            RETURN;
        END IF;
        
        RAISE NOTICE 'Tạo tenant members cho % users và % tenants', array_length(user_ids, 1), array_length(tenant_ids, 1);
        
        -- Mỗi user join 1-3 tenants
        FOREACH user_id IN ARRAY user_ids LOOP
            FOR i IN 1..(1 + floor(random() * 3))::INTEGER LOOP
                tenant_id := tenant_ids[1 + floor(random() * array_length(tenant_ids, 1))];
                
                BEGIN
                    INSERT INTO tenant_members (
                        tenant_id,
                        user_id,
                        display_name,
                        status,
                        custom_data,
                        joined_at
                    ) VALUES (
                        tenant_id,
                        user_id,
                        -- Random display name
                        first_names[1 + floor(random() * array_length(first_names, 1))] || ' ' ||
                        last_names[1 + floor(random() * array_length(last_names, 1))],
                        -- Status distribution: 70% ACTIVE, 15% INVITED, 10% SUSPENDED, 5% RESIGNED
                        CASE 
                            WHEN random() < 0.7 THEN 'ACTIVE'
                            WHEN random() < 0.85 THEN 'INVITED'
                            WHEN random() < 0.95 THEN 'SUSPENDED'
                            ELSE 'RESIGNED'
                        END,
                        -- Custom data with employee info
                        jsonb_build_object(
                            'employee_code', 'EMP' || LPAD(floor(random() * 99999)::TEXT, 5, '0'),
                            'department', (ARRAY['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'])[1 + floor(random() * 6)],
                            'position', (ARRAY['Developer', 'Manager', 'Director', 'Staff', 'Lead', 'Specialist'])[1 + floor(random() * 6)],
                            'level', (ARRAY['Junior', 'Mid', 'Senior', 'Lead', 'Principal'])[1 + floor(random() * 5)],
                            'office_location', (ARRAY['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Remote'])[1 + floor(random() * 4)]
                        ),
                        -- Joined date: 1-365 days ago
                        NOW() - (random() * INTERVAL '365 days')
                    );
                    
                    demo_count := demo_count + 1;
                    
                EXCEPTION 
                    WHEN unique_violation THEN
                        -- Skip duplicates
                        NULL;
                END;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Đã tạo % tenant member relationships', demo_count;
    ELSE
        RAISE NOTICE 'Bảng tenant_members đã có dữ liệu, bỏ qua tạo demo data';
    END IF;
END $$;

-- 9. ENABLE RLS (Row Level Security)
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see members of tenants they belong to
CREATE POLICY tenant_members_isolation_policy ON tenant_members
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM tenant_members 
            WHERE user_id = auth.uid() 
            AND deleted_at IS NULL
        )
    );

-- 10. THỐNG KÊ VÀ VERIFY
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOÀN TẤT TẠO BẢNG tenant_members';
    RAISE NOTICE '========================================';
END $$;

-- Summary by status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenant_members
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

-- Summary by tenant
SELECT 
    t.name as tenant_name,
    COUNT(tm._id) as member_count,
    COUNT(*) FILTER (WHERE tm.status = 'ACTIVE') as active_members,
    COUNT(*) FILTER (WHERE tm.status = 'INVITED') as invited_members,
    COUNT(*) FILTER (WHERE tm.status = 'SUSPENDED') as suspended_members,
    MIN(tm.joined_at) as first_joined,
    MAX(tm.joined_at) as last_joined
FROM tenants t
LEFT JOIN tenant_members tm ON tm.tenant_id = t._id AND tm.deleted_at IS NULL
GROUP BY t._id, t.name
ORDER BY member_count DESC
LIMIT 20;

-- Users in multiple tenants
SELECT 
    u.email,
    u.full_name,
    COUNT(tm._id) as tenant_count,
    COUNT(*) FILTER (WHERE tm.status = 'ACTIVE') as active_memberships,
    array_agg(t.name ORDER BY tm.joined_at DESC) as tenant_names
FROM users u
JOIN tenant_members tm ON tm.user_id = u._id AND tm.deleted_at IS NULL
JOIN tenants t ON t._id = tm.tenant_id
GROUP BY u._id, u.email, u.full_name
HAVING COUNT(tm._id) > 1
ORDER BY tenant_count DESC
LIMIT 10;

-- Verify
SELECT 
    COUNT(*) as total_memberships,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
    COUNT(*) FILTER (WHERE status = 'INVITED') as invited,
    COUNT(*) FILTER (WHERE status = 'SUSPENDED') as suspended,
    COUNT(*) FILTER (WHERE status = 'RESIGNED') as resigned,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as not_deleted,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - joined_at)) / 86400), 2) as avg_days_since_joined
FROM tenant_members;

-- Custom data examples
SELECT 
    u.email,
    t.name as tenant_name,
    tm.display_name,
    tm.status,
    tm.custom_data->>'employee_code' as employee_code,
    tm.custom_data->>'department' as department,
    tm.custom_data->>'position' as position,
    tm.joined_at
FROM tenant_members tm
JOIN users u ON u._id = tm.user_id
JOIN tenants t ON t._id = tm.tenant_id
WHERE tm.deleted_at IS NULL
ORDER BY tm.joined_at DESC
LIMIT 20;

-- =====================================================
-- KẾT THÚC
-- =====================================================

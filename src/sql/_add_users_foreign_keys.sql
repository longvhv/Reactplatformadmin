-- =====================================================
-- BỔ SUNG FOREIGN KEYS LIÊN QUAN ĐẾN BẢNG users
-- Mô tả: Thêm foreign key constraints cho các columns liên quan đến users
-- Ngày tạo: 2026-01-13
-- =====================================================

-- =====================================================
-- SECTION 1: KIỂM TRA VÀ XÓA CONSTRAINTS CŨ (NẾU CÓ)
-- =====================================================

DO $$
BEGIN
    -- Webhooks
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_webhooks_created_by_users' 
               AND table_name = 'webhooks') THEN
        ALTER TABLE webhooks DROP CONSTRAINT fk_webhooks_created_by_users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_webhooks_updated_by_users' 
               AND table_name = 'webhooks') THEN
        ALTER TABLE webhooks DROP CONSTRAINT fk_webhooks_updated_by_users;
    END IF;
    
    -- Tenant App Routes
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_tenant_app_routes_created_by_users' 
               AND table_name = 'tenant_app_routes') THEN
        ALTER TABLE tenant_app_routes DROP CONSTRAINT fk_tenant_app_routes_created_by_users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_tenant_app_routes_updated_by_users' 
               AND table_name = 'tenant_app_routes') THEN
        ALTER TABLE tenant_app_routes DROP CONSTRAINT fk_tenant_app_routes_updated_by_users;
    END IF;
    
    -- Tenant Rate Limits
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_tenant_rate_limits_created_by_users' 
               AND table_name = 'tenant_rate_limits') THEN
        ALTER TABLE tenant_rate_limits DROP CONSTRAINT fk_tenant_rate_limits_created_by_users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_tenant_rate_limits_updated_by_users' 
               AND table_name = 'tenant_rate_limits') THEN
        ALTER TABLE tenant_rate_limits DROP CONSTRAINT fk_tenant_rate_limits_updated_by_users;
    END IF;
    
    -- Legal Documents
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_legal_documents_created_by_users' 
               AND table_name = 'legal_documents') THEN
        ALTER TABLE legal_documents DROP CONSTRAINT fk_legal_documents_created_by_users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_legal_documents_updated_by_users' 
               AND table_name = 'legal_documents') THEN
        ALTER TABLE legal_documents DROP CONSTRAINT fk_legal_documents_updated_by_users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_legal_documents_published_by_users' 
               AND table_name = 'legal_documents') THEN
        ALTER TABLE legal_documents DROP CONSTRAINT fk_legal_documents_published_by_users;
    END IF;

    RAISE NOTICE 'Đã xóa các foreign key constraints cũ (nếu có)';
END $$;

-- =====================================================
-- SECTION 2: THÊM FOREIGN KEYS CHO WEBHOOKS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
        -- created_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'webhooks' AND column_name = 'created_by') THEN
            ALTER TABLE webhooks 
            ADD CONSTRAINT fk_webhooks_created_by_users 
            FOREIGN KEY (created_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'webhooks: Đã thêm FK cho created_by';
        END IF;
        
        -- updated_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'webhooks' AND column_name = 'updated_by') THEN
            ALTER TABLE webhooks 
            ADD CONSTRAINT fk_webhooks_updated_by_users 
            FOREIGN KEY (updated_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'webhooks: Đã thêm FK cho updated_by';
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 3: THÊM FOREIGN KEYS CHO TENANT_APP_ROUTES
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_app_routes') THEN
        -- created_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_app_routes' AND column_name = 'created_by') THEN
            ALTER TABLE tenant_app_routes 
            ADD CONSTRAINT fk_tenant_app_routes_created_by_users 
            FOREIGN KEY (created_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'tenant_app_routes: Đã thêm FK cho created_by';
        END IF;
        
        -- updated_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_app_routes' AND column_name = 'updated_by') THEN
            ALTER TABLE tenant_app_routes 
            ADD CONSTRAINT fk_tenant_app_routes_updated_by_users 
            FOREIGN KEY (updated_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'tenant_app_routes: Đã thêm FK cho updated_by';
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 4: THÊM FOREIGN KEYS CHO TENANT_RATE_LIMITS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_rate_limits') THEN
        -- created_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_rate_limits' AND column_name = 'created_by') THEN
            ALTER TABLE tenant_rate_limits 
            ADD CONSTRAINT fk_tenant_rate_limits_created_by_users 
            FOREIGN KEY (created_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'tenant_rate_limits: Đã thêm FK cho created_by';
        END IF;
        
        -- updated_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_rate_limits' AND column_name = 'updated_by') THEN
            ALTER TABLE tenant_rate_limits 
            ADD CONSTRAINT fk_tenant_rate_limits_updated_by_users 
            FOREIGN KEY (updated_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'tenant_rate_limits: Đã thêm FK cho updated_by';
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 5: THÊM FOREIGN KEYS CHO LEGAL_DOCUMENTS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legal_documents') THEN
        -- created_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'legal_documents' AND column_name = 'created_by') THEN
            ALTER TABLE legal_documents 
            ADD CONSTRAINT fk_legal_documents_created_by_users 
            FOREIGN KEY (created_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'legal_documents: Đã thêm FK cho created_by';
        END IF;
        
        -- updated_by
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'legal_documents' AND column_name = 'updated_by') THEN
            ALTER TABLE legal_documents 
            ADD CONSTRAINT fk_legal_documents_updated_by_users 
            FOREIGN KEY (updated_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'legal_documents: Đã thêm FK cho updated_by';
        END IF;
        
        -- published_by (nếu có)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'legal_documents' AND column_name = 'published_by') THEN
            ALTER TABLE legal_documents 
            ADD CONSTRAINT fk_legal_documents_published_by_users 
            FOREIGN KEY (published_by) 
            REFERENCES users(_id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'legal_documents: Đã thêm FK cho published_by';
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 6: KIỂM TRA CÁC FOREIGN KEYS ĐÃ TỒN TẠI
-- =====================================================

-- Kiểm tra user_sessions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_sessions.*user_id.*users' 
                   AND table_name = 'user_sessions') THEN
            RAISE NOTICE 'user_sessions: FK cho user_id ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_sessions: THIẾU FK cho user_id ⚠️';
        END IF;
    END IF;
END $$;

-- Kiểm tra user_devices
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_devices') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_devices.*user_id.*users' 
                   AND table_name = 'user_devices') THEN
            RAISE NOTICE 'user_devices: FK cho user_id ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_devices: THIẾU FK cho user_id ⚠️';
        END IF;
    END IF;
END $$;

-- Kiểm tra user_roles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_roles.*user_id.*users' 
                   AND table_name = 'user_roles') THEN
            RAISE NOTICE 'user_roles: FK cho user_id ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_roles: THIẾU FK cho user_id ⚠️';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_roles.*granted_by.*users' 
                   AND table_name = 'user_roles') THEN
            RAISE NOTICE 'user_roles: FK cho granted_by ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_roles: THIẾU FK cho granted_by ⚠️';
        END IF;
    END IF;
END $$;

-- Kiểm tra user_delegations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_delegations') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_delegations.*delegator_id.*users' 
                   AND table_name = 'user_delegations') THEN
            RAISE NOTICE 'user_delegations: FK cho delegator_id ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_delegations: THIẾU FK cho delegator_id ⚠️';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_delegations.*delegate_id.*users' 
                   AND table_name = 'user_delegations') THEN
            RAISE NOTICE 'user_delegations: FK cho delegate_id ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_delegations: THIẾU FK cho delegate_id ⚠️';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_delegations.*revoked_by.*users' 
                   AND table_name = 'user_delegations') THEN
            RAISE NOTICE 'user_delegations: FK cho revoked_by ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_delegations: THIẾU FK cho revoked_by ⚠️';
        END IF;
    END IF;
END $$;

-- Kiểm tra user_consents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_consents') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'user_consents.*user_id.*users' 
                   AND table_name = 'user_consents') THEN
            RAISE NOTICE 'user_consents: FK cho user_id ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'user_consents: THIẾU FK cho user_id ⚠️';
        END IF;
    END IF;
END $$;

-- Kiểm tra auth_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auth_logs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name ~ 'auth_logs.*user_id.*users' 
                   AND table_name = 'auth_logs') THEN
            RAISE NOTICE 'auth_logs: FK cho user_id ĐÃ TỒN TẠI ✅';
        ELSE
            RAISE WARNING 'auth_logs: THIẾU FK cho user_id ⚠️';
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 7: TẠO INDEXES CHO FOREIGN KEYS (NẾU CHƯA CÓ)
-- =====================================================

-- Webhooks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_created_by') THEN
        CREATE INDEX idx_webhooks_created_by ON webhooks(created_by) WHERE created_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_webhooks_created_by';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'webhooks' AND indexname = 'idx_webhooks_updated_by') THEN
        CREATE INDEX idx_webhooks_updated_by ON webhooks(updated_by) WHERE updated_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_webhooks_updated_by';
    END IF;
END $$;

-- Tenant App Routes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'tenant_app_routes' AND indexname = 'idx_tenant_app_routes_created_by') THEN
        CREATE INDEX idx_tenant_app_routes_created_by ON tenant_app_routes(created_by) WHERE created_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_tenant_app_routes_created_by';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'tenant_app_routes' AND indexname = 'idx_tenant_app_routes_updated_by') THEN
        CREATE INDEX idx_tenant_app_routes_updated_by ON tenant_app_routes(updated_by) WHERE updated_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_tenant_app_routes_updated_by';
    END IF;
END $$;

-- Tenant Rate Limits
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'tenant_rate_limits' AND indexname = 'idx_tenant_rate_limits_created_by') THEN
        CREATE INDEX idx_tenant_rate_limits_created_by ON tenant_rate_limits(created_by) WHERE created_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_tenant_rate_limits_created_by';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'tenant_rate_limits' AND indexname = 'idx_tenant_rate_limits_updated_by') THEN
        CREATE INDEX idx_tenant_rate_limits_updated_by ON tenant_rate_limits(updated_by) WHERE updated_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_tenant_rate_limits_updated_by';
    END IF;
END $$;

-- Legal Documents
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'legal_documents' AND indexname = 'idx_legal_documents_created_by') THEN
        CREATE INDEX idx_legal_documents_created_by ON legal_documents(created_by) WHERE created_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_legal_documents_created_by';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'legal_documents' AND indexname = 'idx_legal_documents_updated_by') THEN
        CREATE INDEX idx_legal_documents_updated_by ON legal_documents(updated_by) WHERE updated_by IS NOT NULL;
        RAISE NOTICE 'Đã tạo index idx_legal_documents_updated_by';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'legal_documents' AND column_name = 'published_by') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                       WHERE tablename = 'legal_documents' AND indexname = 'idx_legal_documents_published_by') THEN
            CREATE INDEX idx_legal_documents_published_by ON legal_documents(published_by) WHERE published_by IS NOT NULL;
            RAISE NOTICE 'Đã tạo index idx_legal_documents_published_by';
        END IF;
    END IF;
END $$;

-- =====================================================
-- SECTION 8: THỐNG KÊ VÀ XÁC NHẬN
-- =====================================================

DO $$
DECLARE
    total_fks INTEGER;
    users_fks INTEGER;
BEGIN
    -- Đếm tổng số foreign keys
    SELECT COUNT(*) INTO total_fks
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';
    
    -- Đếm số foreign keys liên quan đến users
    SELECT COUNT(*) INTO users_fks
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOÀN TẤT BỔ SUNG FOREIGN KEYS';
    RAISE NOTICE 'Tổng số Foreign Keys trong database: %', total_fks;
    RAISE NOTICE 'Số Foreign Keys liên quan đến bảng users: %', users_fks;
    RAISE NOTICE '========================================';
END $$;

-- Liệt kê tất cả foreign keys liên quan đến users
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND ccu.table_name = 'users'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- KẾT THÚC
-- =====================================================

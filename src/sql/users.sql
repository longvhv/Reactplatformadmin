-- =====================================================
-- TABLE: users
-- Mô tả: Quản lý thông tin người dùng toàn hệ thống
-- Tài liệu: docs/DatabaseCommand.md (dòng 366-415)
-- =====================================================

-- 1. TẠO BẢNG TẠM ĐỂ BACKUP DỮ LIỆU CŨ (NẾU TỒN TẠI)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Backup dữ liệu cũ vào bảng tạm
        DROP TABLE IF EXISTS users_backup_temp;
        CREATE TABLE users_backup_temp AS 
        SELECT 
            _id,
            email,
            password_hash,
            COALESCE(name, full_name) as name,
            COALESCE(avatar, avatar_url) as avatar,
            COALESCE(phone, phone_number) as phone,
            status,
            COALESCE(email_verified::text, is_verified::text, 'false')::boolean as email_verified,
            created_at,
            updated_at,
            deleted_at
        FROM users;
        
        RAISE NOTICE 'Đã backup % bản ghi vào bảng users_backup_temp', (SELECT COUNT(*) FROM users_backup_temp);
    END IF;
END $$;

-- 2. XÓA BẢNG CŨ (NẾU TỒN TẠI)
DROP TABLE IF EXISTS users CASCADE;

-- 3. TẠO BẢNG MỚI VỚI SCHEMA CHUẨN
CREATE TABLE users (
    -- I. ĐỊNH DANH (IDENTITY)
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Khuyến nghị sinh UUID v7 từ tầng Application
    email VARCHAR(255) NOT NULL,
    password_hash TEXT, -- Lưu chuỗi hash Argon2id
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20),

    -- II. TRẠNG THÁI & BẢO MẬT (SECURITY)
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_support_staff BOOLEAN NOT NULL DEFAULT FALSE, -- Phục vụ Impersonation
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret TEXT, -- Cần mã hóa ở tầng ứng dụng trước khi lưu
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- III. CẤU HÌNH & THÔNG TIN THÊM
    locale VARCHAR(10) NOT NULL DEFAULT 'vi-VN',
    metadata JSONB NOT NULL DEFAULT '{}',

    -- IV. TRUY VẾT (AUDIT)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- CÁC RÀNG BUỘC (CONSTRAINTS)
    CONSTRAINT uq_users_phone UNIQUE (phone_number),
    CONSTRAINT chk_users_email_fmt CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_users_url_fmt CHECK (avatar_url IS NULL OR avatar_url ~* '^https?://'),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'BANNED', 'DISABLED', 'PENDING')),
    CONSTRAINT chk_users_updated CHECK (updated_at >= created_at)
);

-- 4. MIGRATE DỮ LIỆU TỪ BACKUP (GIỮ NGUYÊN _ID CŨ)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_backup_temp') THEN
        INSERT INTO users (
            _id,
            email,
            password_hash,
            full_name,
            avatar_url,
            phone_number,
            status,
            is_support_staff,
            mfa_enabled,
            mfa_secret,
            is_verified,
            locale,
            metadata,
            created_at,
            updated_at,
            deleted_at
        )
        SELECT 
            _id,                                           -- Giữ nguyên _id cũ
            email,
            password_hash,
            name as full_name,                            -- Mapping: name → full_name
            avatar as avatar_url,                         -- Mapping: avatar → avatar_url
            phone as phone_number,                        -- Mapping: phone → phone_number
            UPPER(status) as status,                      -- Chuẩn hóa chữ hoa
            FALSE as is_support_staff,                    -- Default cho field mới
            FALSE as mfa_enabled,                         -- Default cho field mới
            NULL as mfa_secret,                           -- Default cho field mới
            email_verified as is_verified,                -- Mapping: email_verified → is_verified
            'vi-VN' as locale,                           -- Default cho field mới
            '{}'::jsonb as metadata,                      -- Default cho field mới
            created_at,
            updated_at,
            deleted_at
        FROM users_backup_temp;
        
        RAISE NOTICE 'Đã migrate % bản ghi từ users_backup_temp', (SELECT COUNT(*) FROM users);
        
        -- Xóa bảng backup tạm
        DROP TABLE users_backup_temp;
    END IF;
END $$;

-- 5. TẠO CÁC INDEX CHIẾN LƯỢC

-- Index duy nhất cho Email (Hỗ trợ Soft Delete)
-- Chỉ check trùng với các user chưa bị xóa (deleted_at IS NULL)
CREATE UNIQUE INDEX idx_users_email_active 
ON users (email) 
WHERE deleted_at IS NULL;

-- Index tìm kiếm mờ (Fuzzy Search) bằng Trigram
-- Hỗ trợ tìm user theo tên hoặc email kể cả khi gõ sai chính tả
-- Cần bật extension trước: CREATE EXTENSION IF NOT EXISTS pg_trgm;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        CREATE EXTENSION pg_trgm;
        RAISE NOTICE 'Đã kích hoạt extension pg_trgm';
    END IF;
END $$;

CREATE INDEX idx_users_search_trgm 
ON users USING GIN (full_name gin_trgm_ops, email gin_trgm_ops);

-- Index hỗ trợ quản trị viên lọc user theo trạng thái và thời gian tạo
CREATE INDEX idx_users_status_created 
ON users (status, created_at DESC);

-- 6. THÊM COMMENT CHO BẢNG VÀ CÁC COLUMNS QUAN TRỌNG
COMMENT ON TABLE users IS 'Bảng quản lý thông tin người dùng toàn hệ thống (không phụ thuộc Tenant)';
COMMENT ON COLUMN users._id IS 'UUID v7 làm khóa chính, được sinh từ tầng Application';
COMMENT ON COLUMN users.password_hash IS 'Chuỗi hash Argon2id của mật khẩu (cho LOGIN_METHOD = PASSWORD)';
COMMENT ON COLUMN users.is_support_staff IS 'TRUE nếu là nhân viên hỗ trợ (dùng cho tính năng Impersonation)';
COMMENT ON COLUMN users.mfa_secret IS 'Secret key cho MFA/2FA (cần mã hóa ở tầng Application trước khi lưu)';
COMMENT ON COLUMN users.metadata IS 'Dữ liệu bổ sung dạng JSON (preferences, settings, etc.)';

-- 7. THÔNG BÁO HOÀN TẤT
DO $$
DECLARE
    total_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HOÀN TẤT TẠO BẢNG users';
    RAISE NOTICE 'Tổng số bản ghi: %', total_users;
    RAISE NOTICE 'Indexes: idx_users_email_active, idx_users_search_trgm, idx_users_status_created';
    RAISE NOTICE '========================================';
END $$;

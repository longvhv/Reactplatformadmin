-- =====================================================
-- Migration: Update applications table schema
-- Description: Thêm các trường app_type, status, version string, version_number
-- Date: 2026-01-15
-- Standard: Đồng bộ với TypeScript interface trong applicationsApi.ts
-- =====================================================

-- 1. Thêm các trường mới
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS app_type VARCHAR(20) DEFAULT 'WEB',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS version_string VARCHAR(50) DEFAULT '1.0.0',
ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate dữ liệu cũ (nếu có)
-- Map is_active -> status
UPDATE applications 
SET status = CASE 
    WHEN is_active = TRUE THEN 'ACTIVE'
    ELSE 'INACTIVE'
END
WHERE status IS NULL OR status = 'ACTIVE'; -- Chỉ update nếu chưa có giá trị custom

-- Rename version (BIGINT) thành version_number và tạo version_string mới
UPDATE applications 
SET version_number = COALESCE(version, 1),
    version_string = COALESCE(version_string, '1.0.0')
WHERE version_number IS NULL;

-- 3. Thêm constraints
ALTER TABLE applications
ADD CONSTRAINT chk_app_type_valid 
    CHECK (app_type IN ('WEB', 'MOBILE', 'API', 'SERVICE'));

ALTER TABLE applications
ADD CONSTRAINT chk_status_valid 
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED'));

ALTER TABLE applications
ADD CONSTRAINT chk_version_number_positive 
    CHECK (version_number > 0);

-- 4. Tạo indexes mới
CREATE INDEX IF NOT EXISTS idx_applications_app_type 
ON applications (app_type) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_status 
ON applications (status) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_is_public 
ON applications (is_public) 
WHERE deleted_at IS NULL;

-- 5. Comments cho các cột mới
COMMENT ON COLUMN applications.app_type IS 'Loại ứng dụng: WEB, MOBILE, API, SERVICE';
COMMENT ON COLUMN applications.status IS 'Trạng thái: ACTIVE, INACTIVE, DEPRECATED';
COMMENT ON COLUMN applications.version_string IS 'Phiên bản semantic (VD: 1.0.0, 2.1.3)';
COMMENT ON COLUMN applications.version_number IS 'Số version cho optimistic locking';
COMMENT ON COLUMN applications.is_public IS 'Cho phép truy cập công khai không cần xác thực';
COMMENT ON COLUMN applications.metadata IS 'Dữ liệu bổ sung dạng JSON';

-- 6. Có thể drop cột is_active cũ sau khi migrate xong (tùy chọn)
-- ALTER TABLE applications DROP COLUMN IF EXISTS is_active;
-- Tạm giữ lại để backward compatibility, sẽ xóa ở migration sau

-- 7. Verify
-- SELECT _id, code, name, app_type, status, version_string, version_number, is_public 
-- FROM applications 
-- WHERE deleted_at IS NULL 
-- LIMIT 5;

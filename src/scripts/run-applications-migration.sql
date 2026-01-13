-- =====================================================
-- Migration: Create applications table
-- Description: GLOBAL table lưu trữ danh mục các ứng dụng kỹ thuật độc lập
-- Date: 2026-01-12
-- Standard: go-framework compliant với UUID v7, snake_case, audit trail, soft delete
-- =====================================================

-- 1. Tạo bảng applications
CREATE TABLE IF NOT EXISTS applications (
    -- I. Định danh & Mã kỹ thuật
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- II. Trạng thái vận hành
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- III. Nhóm Audit & Versioning (Tiêu chuẩn hệ thống)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,

    -- IV. Các ràng buộc dữ liệu
    CONSTRAINT uq_applications_code UNIQUE (code),
    CONSTRAINT chk_app_code_format CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT chk_app_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT chk_app_version_valid CHECK (version >= 1),
    CONSTRAINT chk_app_updated CHECK (updated_at >= created_at)
);

-- 2. Tạo các chỉ mục (Index) để tối ưu hóa hiệu năng truy vấn
-- Index hỗ trợ tìm kiếm nhanh theo mã ứng dụng (dùng khi Routing hoặc Check quyền)
-- Sử dụng Partial Index để chỉ quét các ứng dụng chưa bị xóa mềm
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_code 
ON applications (code) 
WHERE deleted_at IS NULL;

-- Index hỗ trợ liệt kê các ứng dụng đang hoạt động để gán vào Gói dịch vụ
CREATE INDEX IF NOT EXISTS idx_applications_active 
ON applications (is_active) 
WHERE deleted_at IS NULL;

-- Index cho audit trail queries
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON applications (updated_at DESC);

-- 3. Comment mô tả bảng (hỗ trợ tài liệu hóa Documentation tự động)
COMMENT ON TABLE applications IS 'Lưu trữ danh mục các ứng dụng kỹ thuật độc lập trong hệ thống SaaS';
COMMENT ON COLUMN applications._id IS 'UUID v7 định danh duy nhất, hỗ trợ sắp xếp theo thời gian';
COMMENT ON COLUMN applications.code IS 'Mã định danh kỹ thuật (VD: HRM_RECRUIT). Chỉ chứa chữ hoa, số và gạch dưới';
COMMENT ON COLUMN applications.name IS 'Tên hiển thị của ứng dụng trên giao diện';
COMMENT ON COLUMN applications.description IS 'Mô tả chi tiết về chức năng kỹ thuật của ứng dụng';
COMMENT ON COLUMN applications.is_active IS 'Trạng thái bật/tắt ứng dụng trên toàn hệ thống';
COMMENT ON COLUMN applications.version IS 'Cơ chế Optimistic Locking, ngăn chặn ghi đè dữ liệu đồng thời';

-- 4. Tạo trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_applications_updated_at ON applications;
CREATE TRIGGER trigger_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_applications_updated_at();

-- 5. Seed 10 demo records cho môi trường development
INSERT INTO applications (_id, code, name, description, is_active, created_at, updated_at, version)
VALUES
    (gen_random_uuid(), 'HRM_RECRUIT', 'Tuyển dụng', 'Quản lý quy trình tuyển dụng nhân sự: đăng tin, sàng lọc hồ sơ, phỏng vấn', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'HRM_TIMESHEET', 'Chấm công', 'Quản lý giờ làm việc, check-in/out, ca làm việc, tính lương', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'HRM_PAYROLL', 'Tính lương', 'Tính toán lương, thưởng, phụ cấp, bảo hiểm, thuế TNCN', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'HRM_PERFORMANCE', 'Đánh giá KPI', 'Quản lý hiệu suất làm việc, đánh giá định kỳ, OKR, KPI', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'HRM_TRAINING', 'Đào tạo', 'Quản lý chương trình đào tạo, khóa học nội bộ, chứng chỉ', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'CRM_SALES', 'Quản lý bán hàng', 'Quản lý khách hàng tiềm năng, cơ hội bán hàng, pipeline', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'CRM_MARKETING', 'Marketing', 'Quản lý chiến dịch marketing, email marketing, lead generation', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'FIN_ACCOUNTING', 'Kế toán', 'Quản lý sổ sách kế toán, báo cáo tài chính, công nợ', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'FIN_INVOICE', 'Hóa đơn', 'Quản lý hóa đơn điện tử, báo cáo thuế, tích hợp cơ quan thuế', TRUE, NOW(), NOW(), 1),
    (gen_random_uuid(), 'WMS_INVENTORY', 'Quản lý kho', 'Quản lý tồn kho, nhập xuất hàng, kiểm kê định kỳ', TRUE, NOW(), NOW(), 1)
ON CONFLICT (code) DO NOTHING;

-- 6. Verify data
SELECT COUNT(*) as total_apps FROM applications WHERE deleted_at IS NULL;
SELECT code, name, is_active FROM applications ORDER BY created_at DESC;

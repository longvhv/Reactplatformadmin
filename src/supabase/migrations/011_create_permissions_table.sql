-- =====================================================
-- Migration: Create permissions table
-- Description: GLOBAL table lưu trữ danh mục permissions với cấu trúc cây phân cấp
-- Date: 2026-01-12
-- Standard: go-framework compliant với UUID v7, snake_case, audit trail
-- =====================================================

-- 1. Tạo bảng permissions
CREATE TABLE IF NOT EXISTS permissions (
    -- I. Định danh & Liên kết kỹ thuật
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_code VARCHAR(50) NOT NULL,
    code VARCHAR(100) NOT NULL,
    parent_code VARCHAR(100),
    
    -- II. Cấu trúc cây & Phân nhóm
    path TEXT, -- Cấu trúc: /root_code/parent_code/this_code/
    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- III. Thông tin hiển thị
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- IV. Audit Mixins
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- V. Ràng buộc toàn vẹn
    CONSTRAINT fk_perm_app FOREIGN KEY (app_code) REFERENCES applications(code),
    CONSTRAINT fk_perm_parent FOREIGN KEY (parent_code) REFERENCES permissions(code),
    CONSTRAINT uq_permissions_code UNIQUE (code),
    CONSTRAINT chk_perm_code_not_empty CHECK (LENGTH(code) > 0),
    CONSTRAINT chk_perm_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT chk_perm_version_valid CHECK (version >= 1),
    CONSTRAINT chk_perm_updated CHECK (updated_at >= created_at)
);

-- 2. Chiến lược đánh Index

-- Index hỗ trợ tìm nhanh mã quyền khi kiểm tra AuthZ
CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code_lookup 
ON permissions (code) 
WHERE deleted_at IS NULL;

-- Index hỗ trợ lọc danh sách quyền theo từng ứng dụng
CREATE INDEX IF NOT EXISTS idx_permissions_app_filter 
ON permissions (app_code) 
WHERE deleted_at IS NULL;

-- Index "thần thánh" hỗ trợ truy vấn cấu trúc cây (Materialized Path)
CREATE INDEX IF NOT EXISTS idx_permissions_path_tree 
ON permissions (path text_pattern_ops)
WHERE deleted_at IS NULL;

-- Index cho audit trail
CREATE INDEX IF NOT EXISTS idx_permissions_created_at ON permissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permissions_updated_at ON permissions (updated_at DESC);

-- 3. Comment mô tả bảng
COMMENT ON TABLE permissions IS 'Danh mục quyền hạn hệ thống hỗ trợ phân cấp nhiều tầng';
COMMENT ON COLUMN permissions._id IS 'UUID định danh duy nhất';
COMMENT ON COLUMN permissions.app_code IS 'Mã ứng dụng sở hữu quyền này (VD: HRM_RECRUIT)';
COMMENT ON COLUMN permissions.code IS 'Mã quyền duy nhất dùng trong code (VD: user:edit_salary)';
COMMENT ON COLUMN permissions.parent_code IS 'Mã quyền cha để tạo cấu trúc cây';
COMMENT ON COLUMN permissions.path IS 'Materialized Path giúp query cả nhánh cực nhanh';
COMMENT ON COLUMN permissions.is_group IS 'TRUE nếu chỉ là thư mục phân nhóm';
COMMENT ON COLUMN permissions.version IS 'Optimistic Locking';

-- 4. Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_permissions_updated_at ON permissions;
CREATE TRIGGER trigger_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_permissions_updated_at();

-- 5. Function tự động tính path khi insert/update
CREATE OR REPLACE FUNCTION update_permission_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_code IS NULL THEN
        -- Root level permission
        NEW.path := '/' || NEW.code || '/';
    ELSE
        -- Get parent path
        SELECT path INTO parent_path 
        FROM permissions 
        WHERE code = NEW.parent_code;
        
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent permission with code % not found', NEW.parent_code;
        END IF;
        
        NEW.path := parent_path || NEW.code || '/';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_permission_path ON permissions;
CREATE TRIGGER trigger_permission_path
    BEFORE INSERT OR UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_permission_path();

-- 6. Seed demo data cho HRM_RECRUIT application
-- Cấu trúc: HRM_RECRUIT > Employees > [View, Create, Edit, Delete]
INSERT INTO permissions (_id, app_code, code, parent_code, is_group, name, description, version)
VALUES
    -- Root groups for HRM_RECRUIT
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:employees', NULL, TRUE, 'Quản lý nhân viên', 'Nhóm quyền quản lý hồ sơ nhân viên', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:candidates', NULL, TRUE, 'Quản lý ứng viên', 'Nhóm quyền quản lý ứng viên tuyển dụng', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:jobs', NULL, TRUE, 'Quản lý tin tuyển dụng', 'Nhóm quyền quản lý tin đăng tuyển', 1),
    
    -- Employees permissions
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:employees:view', 'hrm_recruit:employees', FALSE, 'Xem danh sách nhân viên', 'Quyền xem danh sách và thông tin nhân viên', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:employees:create', 'hrm_recruit:employees', FALSE, 'Tạo hồ sơ nhân viên', 'Quyền tạo mới hồ sơ nhân viên', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:employees:edit', 'hrm_recruit:employees', FALSE, 'Chỉnh sửa nhân viên', 'Quyền cập nhật thông tin nhân viên', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:employees:delete', 'hrm_recruit:employees', FALSE, 'Xóa nhân viên', 'Quyền xóa hồ sơ nhân viên', 1),
    
    -- Candidates permissions
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:candidates:view', 'hrm_recruit:candidates', FALSE, 'Xem danh sách ứng viên', 'Quyền xem danh sách ứng viên', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:candidates:create', 'hrm_recruit:candidates', FALSE, 'Thêm ứng viên', 'Quyền thêm ứng viên mới', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:candidates:edit', 'hrm_recruit:candidates', FALSE, 'Cập nhật ứng viên', 'Quyền cập nhật thông tin ứng viên', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:candidates:approve', 'hrm_recruit:candidates', FALSE, 'Duyệt ứng viên', 'Quyền phê duyệt ứng viên', 1),
    
    -- Jobs permissions
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:jobs:view', 'hrm_recruit:jobs', FALSE, 'Xem tin tuyển dụng', 'Quyền xem danh sách tin tuyển dụng', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:jobs:create', 'hrm_recruit:jobs', FALSE, 'Đăng tin tuyển dụng', 'Quyền tạo tin đăng tuyển', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:jobs:edit', 'hrm_recruit:jobs', FALSE, 'Sửa tin tuyển dụng', 'Quyền chỉnh sửa tin tuyển dụng', 1),
    (gen_random_uuid(), 'HRM_RECRUIT', 'hrm_recruit:jobs:publish', 'hrm_recruit:jobs', FALSE, 'Xuất bản tin tuyển dụng', 'Quyền xuất bản tin tuyển dụng', 1)
ON CONFLICT (code) DO NOTHING;

-- Seed demo data cho CRM_SALES application
INSERT INTO permissions (_id, app_code, code, parent_code, is_group, name, description, version)
VALUES
    -- Root groups for CRM_SALES
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:customers', NULL, TRUE, 'Quản lý khách hàng', 'Nhóm quyền quản lý khách hàng', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:leads', NULL, TRUE, 'Quản lý Lead', 'Nhóm quyền quản lý khách hàng tiềm năng', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:deals', NULL, TRUE, 'Quản lý Deal', 'Nhóm quyền quản lý cơ hội bán hàng', 1),
    
    -- Customers permissions
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:customers:view', 'crm_sales:customers', FALSE, 'Xem khách hàng', 'Quyền xem danh sách khách hàng', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:customers:create', 'crm_sales:customers', FALSE, 'Tạo khách hàng', 'Quyền tạo khách hàng mới', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:customers:edit', 'crm_sales:customers', FALSE, 'Sửa khách hàng', 'Quyền cập nhật thông tin khách hàng', 1),
    
    -- Leads permissions
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:leads:view', 'crm_sales:leads', FALSE, 'Xem Lead', 'Quyền xem danh sách lead', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:leads:create', 'crm_sales:leads', FALSE, 'Tạo Lead', 'Quyền tạo lead mới', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:leads:convert', 'crm_sales:leads', FALSE, 'Chuyển đổi Lead', 'Quyền chuyển lead thành khách hàng', 1),
    
    -- Deals permissions
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:deals:view', 'crm_sales:deals', FALSE, 'Xem Deal', 'Quyền xem danh sách deal', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:deals:create', 'crm_sales:deals', FALSE, 'Tạo Deal', 'Quyền tạo deal mới', 1),
    (gen_random_uuid(), 'CRM_SALES', 'crm_sales:deals:close', 'crm_sales:deals', FALSE, 'Đóng Deal', 'Quyền đóng/hoàn tất deal', 1)
ON CONFLICT (code) DO NOTHING;

-- 7. Verify data
SELECT COUNT(*) as total_permissions FROM permissions WHERE deleted_at IS NULL;
SELECT app_code, code, name, path, is_group FROM permissions ORDER BY path;

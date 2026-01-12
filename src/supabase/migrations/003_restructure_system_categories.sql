-- ============================================
-- Migration: Restructure System Categories
-- Description: 3-level hierarchy (Group -> Type -> Category)
-- Author: VHV Platform
-- Date: 2026-01-09
-- ============================================

-- Drop existing table and recreate with new structure
DROP TABLE IF EXISTS system_categories CASCADE;

-- ============================================
-- CREATE TABLE
-- ============================================
CREATE TABLE system_categories (
  -- Identity & Tenancy
  _id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  
  -- Business fields
  type              VARCHAR(100) NOT NULL,
  code              VARCHAR(100) NOT NULL,
  name              VARCHAR(255) NOT NULL,
  status            INT2 NOT NULL DEFAULT 1 CHECK (status IN (0, 1)),
  "order"           INTEGER DEFAULT 0,
  description       TEXT,
  
  -- Hierarchical structure
  parent_id         VARCHAR(100),
  group_category_id VARCHAR(100),
  
  -- Flexible schema
  collection_name   VARCHAR(100) DEFAULT 'system_categories',
  extra_fields      JSONB DEFAULT '[]'::jsonb,
  metadata          JSONB DEFAULT '{}'::jsonb,
  
  -- System flags
  is_system         BOOLEAN DEFAULT false,
  is_editable       BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  created_by        UUID NULL,
  updated_by        UUID NULL,
  
  -- Soft delete
  deleted_at        TIMESTAMPTZ NULL,
  deleted_by        UUID NULL,
  
  -- Optimistic locking
  version           INT DEFAULT 1,
  
  -- Constraints
  UNIQUE(tenant_id, code)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
-- Mandatory indexes
CREATE INDEX idx_system_categories_tenant_id ON system_categories(tenant_id);
CREATE INDEX idx_system_categories_deleted_at ON system_categories(deleted_at);
CREATE INDEX idx_system_categories_tenant_deleted ON system_categories(tenant_id, deleted_at);

-- Business indexes
CREATE INDEX idx_system_categories_type ON system_categories(type);
CREATE INDEX idx_system_categories_status ON system_categories(status);
CREATE INDEX idx_system_categories_code ON system_categories(code);
CREATE INDEX idx_system_categories_parent_id ON system_categories(parent_id);
CREATE INDEX idx_system_categories_group_category_id ON system_categories(group_category_id);

-- JSONB indexes
CREATE INDEX idx_system_categories_metadata ON system_categories USING gin(metadata);
CREATE INDEX idx_system_categories_extra_fields ON system_categories USING gin(extra_fields);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_system_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_categories_updated_at
BEFORE UPDATE ON system_categories
FOR EACH ROW
EXECUTE FUNCTION update_system_categories_updated_at();

-- ============================================
-- ADD COMMENTS
-- ============================================
COMMENT ON TABLE system_categories IS '3-level category hierarchy: Group -> Type -> Category';
COMMENT ON COLUMN system_categories._id IS 'Primary key (UUID)';
COMMENT ON COLUMN system_categories.tenant_id IS 'Multi-tenant isolation (use system tenant for shared data)';
COMMENT ON COLUMN system_categories.type IS 'Category level: SYSTEM_CATEGORY_GROUP, SYSTEM_CATEGORY_TYPE, or specific type';
COMMENT ON COLUMN system_categories.code IS 'Unique business code within tenant';
COMMENT ON COLUMN system_categories.version IS 'Optimistic locking version';

-- ============================================
-- INSERT SAMPLE DATA (For system tenant)
-- ============================================
-- Use a fixed UUID for system tenant
DO $$
DECLARE
  system_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  
  -- ============================================
  -- LEVEL 1: Insert SystemCategoryGroup records
  -- ============================================
  INSERT INTO system_categories (tenant_id, code, name, type, status, is_system, is_editable, "order", description) VALUES
    (system_tenant_id, 'GRP_META', 'Meta System', 'SYSTEM_CATEGORY_GROUP', 1, true, false, 0, 'Nhóm danh mục meta - mô tả cấu trúc hệ thống'),
    (system_tenant_id, 'GRP_SYSTEM', 'Hệ thống', 'SYSTEM_CATEGORY_GROUP', 1, true, true, 1, 'Nhóm danh mục hệ thống'),
    (system_tenant_id, 'GRP_BUSINESS', 'Nghiệp vụ', 'SYSTEM_CATEGORY_GROUP', 1, true, true, 2, 'Nhóm danh mục nghiệp vụ'),
    (system_tenant_id, 'GRP_ORGANIZATION', 'Tổ chức', 'SYSTEM_CATEGORY_GROUP', 1, true, true, 3, 'Nhóm danh mục tổ chức'),
    (system_tenant_id, 'GRP_LOCATION', 'Địa lý', 'SYSTEM_CATEGORY_GROUP', 1, true, true, 4, 'Nhóm danh mục địa lý'),
    (system_tenant_id, 'GRP_APPLICATION', 'Ứng dụng', 'SYSTEM_CATEGORY_GROUP', 1, true, true, 5, 'Nhóm danh mục ứng dụng');

  -- ============================================
  -- LEVEL 2: Insert SystemCategoryType records
  -- ============================================
  
  -- Meta Group Types
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, collection_name, extra_fields, status, is_system, is_editable, "order", description) VALUES
    (system_tenant_id, 'SYSTEM_CATEGORY_GROUP', 'Nhóm danh mục', 'SYSTEM_CATEGORY_TYPE', 'GRP_META', 'system_categories',
     '[]'::jsonb,
     1, true, false, 1, 'Loại danh mục dùng để định nghĩa các nhóm danh mục (Level 1)'),
    
    (system_tenant_id, 'SYSTEM_CATEGORY_TYPE', 'Loại danh mục', 'SYSTEM_CATEGORY_TYPE', 'GRP_META', 'system_categories',
     '[]'::jsonb,
     1, true, false, 2, 'Loại danh mục dùng để định nghĩa các loại danh mục khác (Level 2)');

  -- System Group Types
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, collection_name, extra_fields, status, is_system, is_editable, "order", description) VALUES
    (system_tenant_id, 'TYPE_TENANT_CLASSIFICATION', 'Phân loại Tenant', 'SYSTEM_CATEGORY_TYPE', 'GRP_SYSTEM', 'system_categories', 
     '[
       {"code": "max_users", "name": "Số user tối đa", "dataType": "number", "defaultValue": -1},
       {"code": "features", "name": "Tính năng", "dataType": "array", "defaultValue": []}
     ]'::jsonb,
     1, true, true, 1, 'Phân loại các cấp độ tenant'),
    
    (system_tenant_id, 'TYPE_USER_ROLE', 'Vai trò người dùng', 'SYSTEM_CATEGORY_TYPE', 'GRP_SYSTEM', 'system_categories',
     '[
       {"code": "permissions", "name": "Quyền hạn", "dataType": "array", "defaultValue": []},
       {"code": "level", "name": "Cấp độ", "dataType": "number", "defaultValue": 0}
     ]'::jsonb,
     1, true, true, 2, 'Vai trò và quyền hạn người dùng'),
    
    (system_tenant_id, 'TYPE_MODULE', 'Module hệ thống', 'SYSTEM_CATEGORY_TYPE', 'GRP_SYSTEM', 'system_categories',
     '[
       {"code": "icon", "name": "Icon", "dataType": "string", "defaultValue": ""},
       {"code": "route", "name": "Đường dẫn", "dataType": "string", "defaultValue": ""}
     ]'::jsonb,
     1, true, true, 3, 'Các module trong hệ thống');

  -- Business Group Types
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, collection_name, extra_fields, status, is_system, is_editable, "order", description) VALUES
    (system_tenant_id, 'TYPE_PRODUCT_CATEGORY', 'Danh mục sản phẩm', 'SYSTEM_CATEGORY_TYPE', 'GRP_BUSINESS', 'system_categories',
     '[
       {"code": "image_url", "name": "Hình ảnh", "dataType": "string", "defaultValue": ""},
       {"code": "commission", "name": "Hoa hồng (%)", "dataType": "number", "defaultValue": 0}
     ]'::jsonb,
     1, true, true, 1, 'Phân loại sản phẩm'),
    
    (system_tenant_id, 'TYPE_PAYMENT_METHOD', 'Phương thức thanh toán', 'SYSTEM_CATEGORY_TYPE', 'GRP_BUSINESS', 'system_categories',
     '[
       {"code": "fee_percent", "name": "Phí (%)", "dataType": "number", "defaultValue": 0},
       {"code": "provider", "name": "Nhà cung cấp", "dataType": "string", "defaultValue": ""}
     ]'::jsonb,
     1, true, true, 2, 'Các phương thức thanh toán');

  -- Organization Group Types
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, collection_name, extra_fields, status, is_system, is_editable, "order", description) VALUES
    (system_tenant_id, 'TYPE_DEPARTMENT', 'Phòng ban', 'SYSTEM_CATEGORY_TYPE', 'GRP_ORGANIZATION', 'system_categories',
     '[
       {"code": "manager_id", "name": "Trưởng phòng", "dataType": "uuid", "defaultValue": null},
       {"code": "budget", "name": "Ngân sách", "dataType": "number", "defaultValue": 0}
     ]'::jsonb,
     1, true, true, 1, 'Cơ cấu phòng ban');

  -- Application Group Types
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, collection_name, extra_fields, status, is_system, is_editable, "order", description) VALUES
    (system_tenant_id, 'TYPE_COMPONENT', 'Thành phần của ứng dụng', 'SYSTEM_CATEGORY_TYPE', 'GRP_APPLICATION', 'app_components',
     '[
       {"code": "component_id", "name": "Component ID", "dataType": "string", "defaultValue": "", "config": {"required": true}},
       {"code": "component_type", "name": "Loại component", "dataType": "string", "defaultValue": "layout", "config": {"options": ["layout", "module", "page", "widget", "form"]}},
       {"code": "route", "name": "Đường dẫn", "dataType": "string", "defaultValue": ""},
       {"code": "icon", "name": "Icon", "dataType": "string", "defaultValue": ""},
       {"code": "permissions", "name": "Quyền truy cập", "dataType": "array", "defaultValue": []},
       {"code": "is_visible", "name": "Hiển thị", "dataType": "boolean", "defaultValue": true},
       {"code": "parent_id", "name": "Component cha", "dataType": "uuid", "defaultValue": null}
     ]'::jsonb,
     1, true, true, 1, 'Các thành phần cấu thành ứng dụng');

  -- ============================================
  -- LEVEL 3: Insert sample category data
  -- ============================================

  -- Tenant Classifications
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, status, is_system, is_editable, "order", description, metadata) VALUES
    (system_tenant_id, 'CAT_TENANT_ENTERPRISE', 'Enterprise', 'TYPE_TENANT_CLASSIFICATION', 'GRP_SYSTEM', 1, true, false, 1, 'Doanh nghiệp lớn với đầy đủ tính năng', '{"max_users": -1, "features": ["all"]}'::jsonb),
    (system_tenant_id, 'CAT_TENANT_BUSINESS', 'Business', 'TYPE_TENANT_CLASSIFICATION', 'GRP_SYSTEM', 1, true, false, 2, 'Doanh nghiệp vừa với tính năng nâng cao', '{"max_users": 100, "features": ["advanced"]}'::jsonb),
    (system_tenant_id, 'CAT_TENANT_STARTER', 'Starter', 'TYPE_TENANT_CLASSIFICATION', 'GRP_SYSTEM', 1, true, false, 3, 'Doanh nghiệp nhỏ với tính năng cơ bản', '{"max_users": 10, "features": ["basic"]}'::jsonb);

  -- User Roles
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, status, is_system, is_editable, "order", description, metadata) VALUES
    (system_tenant_id, 'CAT_ROLE_ADMIN', 'Administrator', 'TYPE_USER_ROLE', 'GRP_SYSTEM', 1, true, false, 1, 'Quản trị viên hệ thống', '{"permissions": ["*"], "level": 100}'::jsonb),
    (system_tenant_id, 'CAT_ROLE_MANAGER', 'Manager', 'TYPE_USER_ROLE', 'GRP_SYSTEM', 1, true, true, 2, 'Quản lý', '{"permissions": ["read", "write", "manage"], "level": 50}'::jsonb),
    (system_tenant_id, 'CAT_ROLE_USER', 'User', 'TYPE_USER_ROLE', 'GRP_SYSTEM', 1, true, true, 3, 'Người dùng thông thường', '{"permissions": ["read"], "level": 10}'::jsonb);

  -- Modules
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, status, is_system, is_editable, "order", description, metadata) VALUES
    (system_tenant_id, 'CAT_MODULE_DASHBOARD', 'Dashboard', 'TYPE_MODULE', 'GRP_SYSTEM', 1, true, false, 1, 'Trang tổng quan', '{"icon": "LayoutDashboard", "route": "/dashboard"}'::jsonb),
    (system_tenant_id, 'CAT_MODULE_USERS', 'Users', 'TYPE_MODULE', 'GRP_SYSTEM', 1, true, false, 2, 'Quản lý người dùng', '{"icon": "Users", "route": "/users"}'::jsonb),
    (system_tenant_id, 'CAT_MODULE_SETTINGS', 'Settings', 'TYPE_MODULE', 'GRP_SYSTEM', 1, true, false, 3, 'Cài đặt hệ thống', '{"icon": "Settings", "route": "/settings"}'::jsonb);

END $$;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
  type,
  COUNT(*) as count,
  CASE 
    WHEN type = 'SYSTEM_CATEGORY_GROUP' THEN 'Level 1: Groups'
    WHEN type = 'SYSTEM_CATEGORY_TYPE' THEN 'Level 2: Types'
    ELSE 'Level 3: Categories'
  END as level
FROM system_categories
WHERE deleted_at IS NULL
GROUP BY type
ORDER BY 
  CASE 
    WHEN type = 'SYSTEM_CATEGORY_GROUP' THEN 1
    WHEN type = 'SYSTEM_CATEGORY_TYPE' THEN 2
    ELSE 3
  END;

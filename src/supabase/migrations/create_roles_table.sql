-- ============================================
-- Create Roles Table
-- Theo chuẩn docs/Collections.md line 212-221
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL CHECK (LENGTH(name) > 0),
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'CUSTOM' CHECK (type IN ('SYSTEM', 'CUSTOM')),
  permission_codes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() CHECK (updated_at >= created_at),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_type ON roles(type);
CREATE INDEX IF NOT EXISTS idx_roles_permission_codes ON roles USING GIN (permission_codes);

-- RLS Policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users
CREATE POLICY "Allow read roles for authenticated users"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert/update/delete for service role
CREATE POLICY "Allow all for service role"
  ON roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Insert Sample Data
-- ============================================

-- Get tenant ID first
DO $$
DECLARE
  demo_tenant_id UUID;
BEGIN
  -- Try to get first active tenant
  SELECT _id INTO demo_tenant_id FROM tenants WHERE status = 'ACTIVE' LIMIT 1;
  
  -- If no tenant exists, create a demo tenant
  IF demo_tenant_id IS NULL THEN
    INSERT INTO tenants (
      _id, code, name, data_region, tier, status
    ) VALUES (
      gen_random_uuid(), 
      'demo-tenant', 
      'Demo Organization', 
      'ap-southeast-1', 
      'FREE', 
      'ACTIVE'
    ) RETURNING _id INTO demo_tenant_id;
  END IF;

  -- Insert system roles for this tenant
  INSERT INTO roles (_id, tenant_id, name, description, type, permission_codes) VALUES
    (
      gen_random_uuid(),
      demo_tenant_id,
      'Super Admin',
      'Quản trị viên tối cao - toàn quyền trên hệ thống',
      'SYSTEM',
      ARRAY['*']
    ),
    (
      gen_random_uuid(),
      demo_tenant_id,
      'Admin',
      'Quản trị viên - quản lý người dùng và cấu hình',
      'SYSTEM',
      ARRAY['user:view', 'user:create', 'user:update', 'user:delete', 'role:view', 'role:create', 'role:update']
    ),
    (
      gen_random_uuid(),
      demo_tenant_id,
      'Editor',
      'Người biên tập - tạo và chỉnh sửa nội dung',
      'SYSTEM',
      ARRAY['content:view', 'content:create', 'content:update']
    ),
    (
      gen_random_uuid(),
      demo_tenant_id,
      'Viewer',
      'Người xem - chỉ đọc thông tin',
      'SYSTEM',
      ARRAY['content:view', 'user:view']
    )
  ON CONFLICT DO NOTHING;
END $$;

COMMENT ON TABLE roles IS 'Định nghĩa các vai trò (Admin, Editor) và danh sách mã quyền - Chuẩn docs/Collections.md';
COMMENT ON COLUMN roles._id IS 'Primary Key (UUID v7) - Định danh duy nhất';
COMMENT ON COLUMN roles.tenant_id IS 'Xác định vai trò thuộc tổ chức nào (Sharding Key)';
COMMENT ON COLUMN roles.name IS 'Tên vai trò (VD: Admin, Editor, HR Manager)';
COMMENT ON COLUMN roles.description IS 'Mô tả chi tiết trách nhiệm của vai trò';
COMMENT ON COLUMN roles.type IS 'SYSTEM: Vai trò mặc định không thể xóa, CUSTOM: Do khách hàng tự định nghĩa';
COMMENT ON COLUMN roles.permission_codes IS 'Mảng chứa các mã quyền (VD: user:view, invoice:create)';
COMMENT ON COLUMN roles.version IS 'Optimistic Locking - Ngăn xung đột khi nhiều Admin cùng sửa';
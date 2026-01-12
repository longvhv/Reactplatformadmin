-- Create system_categories table
CREATE TABLE IF NOT EXISTS system_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'SystemCategoryGroup' or 'SystemCategory'
  "categoryGroup" VARCHAR(100) NOT NULL,
  description TEXT,
  "isSystem" BOOLEAN DEFAULT false,
  "isEditable" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  status INT2 DEFAULT 1 CHECK (status IN (0, 1)), -- 0=inactive, 1=active
  metadata JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_system_categories_type ON system_categories(type);
CREATE INDEX idx_system_categories_category_group ON system_categories("categoryGroup");
CREATE INDEX idx_system_categories_status ON system_categories(status);
CREATE INDEX idx_system_categories_order ON system_categories("order");

-- Enable Row Level Security
ALTER TABLE system_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (read-only for now)
CREATE POLICY "Allow read access to all users"
  ON system_categories
  FOR SELECT
  USING (true);

-- Create policy for authenticated users (full access)
CREATE POLICY "Allow full access to authenticated users"
  ON system_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_categories_updated_at
  BEFORE UPDATE ON system_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial SystemCategoryGroup data
INSERT INTO system_categories (code, name, type, "categoryGroup", description, "isSystem", "isEditable", "order", status, metadata) VALUES
  ('GRP_SYSTEM', 'System', 'SystemCategoryGroup', 'system', 'Nhóm danh mục hệ thống', true, true, 1, 1, '{}'),
  ('GRP_BUSINESS', 'Business', 'SystemCategoryGroup', 'business', 'Nhóm danh mục nghiệp vụ', true, true, 2, 1, '{}'),
  ('GRP_USER', 'User', 'SystemCategoryGroup', 'user', 'Nhóm danh mục người dùng', true, true, 3, 1, '{}'),
  ('GRP_TECHNICAL', 'Technical', 'SystemCategoryGroup', 'technical', 'Nhóm danh mục kỹ thuật', true, true, 4, 1, '{}'),
  ('GRP_APP_COMPONENTS', 'App Components', 'SystemCategoryGroup', 'app_components', 'Nhóm danh mục cấu trúc ứng dụng', true, true, 5, 1, '{}'),
  ('GRP_REGIONS', 'Địa giới hành chính', 'SystemCategoryGroup', 'regions', 'Nhóm danh mục vùng/địa phương', true, true, 6, 1, '{}');

-- Insert initial SystemCategory data
INSERT INTO system_categories (code, name, type, "categoryGroup", description, "isSystem", "isEditable", "order", status, metadata) VALUES
  -- Tenant Classification
  ('SYS_TENANT_ENTERPRISE', 'Enterprise', 'SystemCategory', 'tenant_classification', 'Enterprise organization with full features', true, false, 1, 1, '{"maxUsers": -1, "features": ["all"]}'),
  ('SYS_TENANT_BUSINESS', 'Business', 'SystemCategory', 'tenant_classification', 'Medium-sized organization with advanced features', true, false, 2, 1, '{"maxUsers": 100, "features": ["advanced"]}'),
  ('SYS_TENANT_STARTER', 'Starter', 'SystemCategory', 'tenant_classification', 'Small organization with basic features', true, false, 3, 1, '{"maxUsers": 10, "features": ["basic"]}'),
  
  -- User Classification
  ('SYS_ROLE_SUPER_ADMIN', 'Super Administrator', 'SystemCategory', 'user_classification', 'Full system access across all tenants', true, false, 1, 1, '{"permissions": ["*"], "level": 0}'),
  ('SYS_ROLE_TENANT_ADMIN', 'Tenant Administrator', 'SystemCategory', 'user_classification', 'Full access within tenant', true, false, 2, 1, '{"permissions": ["tenant.*"], "level": 1}'),
  
  -- Workflow States
  ('SYS_STATUS_PENDING', 'Pending', 'SystemCategory', 'workflow_states', 'Awaiting approval or processing', true, true, 1, 1, '{"color": "#f59e0b", "icon": "clock"}'),
  ('SYS_STATUS_APPROVED', 'Approved', 'SystemCategory', 'workflow_states', 'Approved and active', true, true, 2, 1, '{"color": "#10b981", "icon": "check-circle"}'),
  ('SYS_STATUS_REJECTED', 'Rejected', 'SystemCategory', 'workflow_states', 'Rejected or declined', true, true, 3, 1, '{"color": "#ef4444", "icon": "x-circle"}'),
  
  -- Technical
  ('SYS_API_REST', 'REST API', 'SystemCategory', 'technical', 'RESTful API integration', true, true, 1, 1, '{"protocol": "HTTP"}'),
  ('SYS_API_GRAPHQL', 'GraphQL API', 'SystemCategory', 'technical', 'GraphQL API integration', true, true, 2, 1, '{"protocol": "GraphQL"}'),
  
  -- App Components
  ('COMP_HEADER', 'Header Component', 'SystemCategory', 'app_components', 'Application header and navigation', false, true, 1, 1, '{"componentId": "header", "parentId": null}'),
  ('COMP_SIDEBAR', 'Sidebar Component', 'SystemCategory', 'app_components', 'Application sidebar navigation', false, true, 2, 1, '{"componentId": "sidebar", "parentId": null}'),
  ('COMP_FOOTER', 'Footer Component', 'SystemCategory', 'app_components', 'Application footer', false, true, 3, 1, '{"componentId": "footer", "parentId": null}'),
  ('COMP_DASHBOARD', 'Dashboard Module', 'SystemCategory', 'app_components', 'Main dashboard module', false, true, 4, 1, '{"componentId": "dashboard", "parentId": null}'),
  
  -- Regions
  ('RGN_VN', 'Việt Nam', 'SystemCategory', 'regions', 'Vietnam - Country level', false, true, 1, 1, '{"level": 1, "code": "VN", "parentCode": null}'),
  ('RGN_VN_HN', 'Hà Nội', 'SystemCategory', 'regions', 'Hanoi - Province level', false, true, 2, 1, '{"level": 2, "code": "HN", "parentCode": "VN"}'),
  ('RGN_VN_HCM', 'Hồ Chí Minh', 'SystemCategory', 'regions', 'Ho Chi Minh City - Province level', false, true, 3, 1, '{"level": 2, "code": "HCM", "parentCode": "VN"}'),
  ('RGN_VN_HN_HK', 'Hoàn Kiếm', 'SystemCategory', 'regions', 'Hoan Kiem District - District level', false, true, 4, 1, '{"level": 3, "code": "HK", "parentCode": "HN"}'),
  ('RGN_VN_HCM_Q1', 'Quận 1', 'SystemCategory', 'regions', 'District 1 - District level', false, true, 5, 1, '{"level": 3, "code": "Q1", "parentCode": "HCM"}');
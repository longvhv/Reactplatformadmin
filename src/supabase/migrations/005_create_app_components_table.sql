-- ============================================
-- Migration: Create App Components Table
-- Description: Application component hierarchy management
-- Author: VHV Platform
-- Date: 2026-01-09
-- ============================================

-- ============================================
-- CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_components (
  -- Identity & Tenancy
  _id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  
  -- Core fields
  code            VARCHAR(100) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(50) NOT NULL DEFAULT 'TYPE_COMPONENT',
  
  -- Component-specific fields
  component_id    VARCHAR(100) NOT NULL,
  component_type  VARCHAR(50) NOT NULL DEFAULT 'layout' CHECK (component_type IN ('layout', 'module', 'page', 'widget', 'form')),
  route           VARCHAR(255),
  icon            VARCHAR(100),
  description     TEXT,
  
  -- Hierarchical structure
  parent_id       UUID REFERENCES app_components(_id) ON DELETE SET NULL,
  
  -- Permissions & visibility
  permissions     JSONB DEFAULT '[]'::jsonb,
  is_visible      BOOLEAN DEFAULT true,
  
  -- Ordering & status
  "order"         INTEGER DEFAULT 0,
  status          SMALLINT DEFAULT 1 CHECK (status IN (0, 1)),
  
  -- Additional metadata
  metadata        JSONB DEFAULT '{}'::jsonb,
  
  -- System flags
  is_system       BOOLEAN DEFAULT false,
  is_editable     BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID NULL,
  updated_by      UUID NULL,
  
  -- Soft delete
  deleted_at      TIMESTAMPTZ NULL,
  deleted_by      UUID NULL,
  
  -- Optimistic locking
  version         INT DEFAULT 1,
  
  -- Constraints
  UNIQUE(tenant_id, code),
  UNIQUE(tenant_id, component_id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
-- Mandatory indexes
CREATE INDEX idx_app_components_tenant_id ON app_components(tenant_id);
CREATE INDEX idx_app_components_deleted_at ON app_components(deleted_at);
CREATE INDEX idx_app_components_tenant_deleted ON app_components(tenant_id, deleted_at);

-- Business indexes
CREATE INDEX idx_app_components_code ON app_components(code);
CREATE INDEX idx_app_components_component_id ON app_components(component_id);
CREATE INDEX idx_app_components_component_type ON app_components(component_type);
CREATE INDEX idx_app_components_parent_id ON app_components(parent_id);
CREATE INDEX idx_app_components_status ON app_components(status);
CREATE INDEX idx_app_components_is_visible ON app_components(is_visible);
CREATE INDEX idx_app_components_route ON app_components(route);

-- Composite indexes for hierarchical queries
CREATE INDEX idx_app_components_parent_order ON app_components(parent_id, "order");
CREATE INDEX idx_app_components_type_status ON app_components(component_type, status);

-- JSONB indexes
CREATE INDEX idx_app_components_permissions ON app_components USING gin(permissions);
CREATE INDEX idx_app_components_metadata ON app_components USING gin(metadata);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_app_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_components_updated_at
BEFORE UPDATE ON app_components
FOR EACH ROW
EXECUTE FUNCTION update_app_components_updated_at();

-- ============================================
-- ADD COMMENTS
-- ============================================
COMMENT ON TABLE app_components IS 'Application component hierarchy (layouts, modules, pages, widgets, forms)';
COMMENT ON COLUMN app_components._id IS 'Primary key (UUID)';
COMMENT ON COLUMN app_components.tenant_id IS 'Multi-tenant isolation';
COMMENT ON COLUMN app_components.code IS 'Unique identifier code (e.g., COMP_HEADER, COMP_DASHBOARD)';
COMMENT ON COLUMN app_components.component_id IS 'Technical component identifier (e.g., header, dashboard)';
COMMENT ON COLUMN app_components.component_type IS 'Component type: layout, module, page, widget, form';
COMMENT ON COLUMN app_components.route IS 'URL route (e.g., /dashboard, /users)';
COMMENT ON COLUMN app_components.icon IS 'Lucide icon name (e.g., LayoutDashboard, Users)';
COMMENT ON COLUMN app_components.parent_id IS 'Reference to parent component (NULL for top-level)';
COMMENT ON COLUMN app_components.permissions IS 'Array of required permissions ["read", "write", "admin"]';
COMMENT ON COLUMN app_components.is_visible IS 'Whether component is visible in navigation';
COMMENT ON COLUMN app_components.version IS 'Optimistic locking version';

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
DO $$
DECLARE
  system_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
  dashboard_id UUID;
  categories_id UUID;
  users_id UUID;
BEGIN

  -- Level 1: Layout Components
  INSERT INTO app_components (tenant_id, code, name, type, component_id, component_type, icon, "order", status, is_system, is_editable, description, is_visible) VALUES
    (system_tenant_id, 'COMP_HEADER', 'Header', 'TYPE_COMPONENT', 'header', 'layout', 'LayoutPanelTop', 1, 1, true, true, 'Application header and top navigation', true),
    (system_tenant_id, 'COMP_SIDEBAR', 'Sidebar', 'TYPE_COMPONENT', 'sidebar', 'layout', 'LayoutPanelLeft', 2, 1, true, true, 'Application sidebar navigation', true),
    (system_tenant_id, 'COMP_FOOTER', 'Footer', 'TYPE_COMPONENT', 'footer', 'layout', 'LayoutPanelBottom', 3, 1, true, true, 'Application footer', true);

  -- Level 2: Main Modules (top-level navigation)
  INSERT INTO app_components (tenant_id, code, name, type, component_id, component_type, route, icon, "order", status, is_system, is_editable, description, is_visible, permissions) VALUES
    (system_tenant_id, 'COMP_DASHBOARD', 'Dashboard', 'TYPE_COMPONENT', 'dashboard', 'module', '/dashboard', 'LayoutDashboard', 10, 1, true, false, 'Main dashboard module', true, '["read"]'::jsonb),
    (system_tenant_id, 'COMP_CATEGORIES', 'System Categories', 'TYPE_COMPONENT', 'system-categories', 'module', '/system-categories', 'FolderTree', 20, 1, true, false, 'System category management', true, '["admin"]'::jsonb),
    (system_tenant_id, 'COMP_REGIONS', 'Geographic Regions', 'TYPE_COMPONENT', 'regions', 'module', '/regions', 'MapPin', 30, 1, true, false, 'Geographic region management', true, '["admin"]'::jsonb),
    (system_tenant_id, 'COMP_USERS', 'Users', 'TYPE_COMPONENT', 'users', 'module', '/users', 'Users', 40, 1, true, false, 'User management', true, '["admin"]'::jsonb),
    (system_tenant_id, 'COMP_SETTINGS', 'Settings', 'TYPE_COMPONENT', 'settings', 'module', '/settings', 'Settings', 50, 1, true, false, 'System settings', true, '["admin"]'::jsonb);

  -- Get parent IDs
  SELECT _id INTO dashboard_id FROM app_components WHERE tenant_id = system_tenant_id AND code = 'COMP_DASHBOARD';
  SELECT _id INTO categories_id FROM app_components WHERE tenant_id = system_tenant_id AND code = 'COMP_CATEGORIES';
  SELECT _id INTO users_id FROM app_components WHERE tenant_id = system_tenant_id AND code = 'COMP_USERS';

  -- Level 3: Dashboard Pages (children of COMP_DASHBOARD)
  INSERT INTO app_components (tenant_id, code, name, type, component_id, component_type, route, icon, parent_id, "order", status, is_system, is_editable, description, is_visible) VALUES
    (system_tenant_id, 'COMP_DASH_OVERVIEW', 'Overview', 'TYPE_COMPONENT', 'dashboard-overview', 'page', '/dashboard/overview', 'Home', dashboard_id, 1, 1, true, true, 'Dashboard overview page', true),
    (system_tenant_id, 'COMP_DASH_ANALYTICS', 'Analytics', 'TYPE_COMPONENT', 'dashboard-analytics', 'page', '/dashboard/analytics', 'BarChart3', dashboard_id, 2, 1, true, true, 'Analytics dashboard', true),
    (system_tenant_id, 'COMP_DASH_REPORTS', 'Reports', 'TYPE_COMPONENT', 'dashboard-reports', 'page', '/dashboard/reports', 'FileText', dashboard_id, 3, 1, true, true, 'Reports page', true);

  -- Level 3: System Categories Pages (children of COMP_CATEGORIES)
  INSERT INTO app_components (tenant_id, code, name, type, component_id, component_type, route, icon, parent_id, "order", status, is_system, is_editable, description, is_visible) VALUES
    (system_tenant_id, 'COMP_CAT_GROUPS', 'Category Groups', 'TYPE_COMPONENT', 'category-groups', 'page', '/system-categories/groups', 'Layers', categories_id, 1, 1, true, true, 'Category group management', true),
    (system_tenant_id, 'COMP_CAT_TYPES', 'Category Types', 'TYPE_COMPONENT', 'category-types', 'page', '/system-categories/types', 'Tags', categories_id, 2, 1, true, true, 'Category type management', true);

  -- Level 3: User Management Pages (children of COMP_USERS)
  INSERT INTO app_components (tenant_id, code, name, type, component_id, component_type, route, icon, parent_id, "order", status, is_system, is_editable, description, is_visible, permissions) VALUES
    (system_tenant_id, 'COMP_USERS_LIST', 'User List', 'TYPE_COMPONENT', 'users-list', 'page', '/users/list', 'Users', users_id, 1, 1, true, true, 'User list and management', true, '["admin", "user.read"]'::jsonb),
    (system_tenant_id, 'COMP_USERS_ROLES', 'User Roles', 'TYPE_COMPONENT', 'users-roles', 'page', '/users/roles', 'Shield', users_id, 2, 1, true, true, 'User role management', true, '["admin", "role.read"]'::jsonb),
    (system_tenant_id, 'COMP_USERS_PERMS', 'Permissions', 'TYPE_COMPONENT', 'users-permissions', 'page', '/users/permissions', 'Key', users_id, 3, 1, true, true, 'Permission management', true, '["admin", "permission.read"]'::jsonb);

  -- Level 4: Widgets (reusable UI components)
  INSERT INTO app_components (tenant_id, code, name, type, component_id, component_type, icon, "order", status, is_system, is_editable, description, is_visible) VALUES
    (system_tenant_id, 'COMP_WIDGET_STATS', 'Stats Widget', 'TYPE_COMPONENT', 'widget-stats', 'widget', 'Activity', 100, 1, true, true, 'Statistics widget card', false),
    (system_tenant_id, 'COMP_WIDGET_CHART', 'Chart Widget', 'TYPE_COMPONENT', 'widget-chart', 'widget', 'LineChart', 101, 1, true, true, 'Chart visualization widget', false),
    (system_tenant_id, 'COMP_WIDGET_TABLE', 'Table Widget', 'TYPE_COMPONENT', 'widget-table', 'widget', 'Table', 102, 1, true, true, 'Data table widget', false),
    (system_tenant_id, 'COMP_WIDGET_CALENDAR', 'Calendar Widget', 'TYPE_COMPONENT', 'widget-calendar', 'widget', 'Calendar', 103, 1, true, true, 'Calendar widget', false);

  -- Level 4: Forms (reusable form components)
  INSERT INTO app_components (tenant_id, code, name, type, component_id, component_type, icon, "order", status, is_system, is_editable, description, is_visible) VALUES
    (system_tenant_id, 'COMP_FORM_USER', 'User Form', 'TYPE_COMPONENT', 'form-user', 'form', 'UserPlus', 200, 1, true, true, 'User creation/edit form', false),
    (system_tenant_id, 'COMP_FORM_CATEGORY', 'Category Form', 'TYPE_COMPONENT', 'form-category', 'form', 'FolderPlus', 201, 1, true, true, 'Category creation/edit form', false),
    (system_tenant_id, 'COMP_FORM_REGION', 'Region Form', 'TYPE_COMPONENT', 'form-region', 'form', 'MapPinPlus', 202, 1, true, true, 'Region creation/edit form', false);

END $$;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
  component_type,
  COUNT(*) as count
FROM app_components
WHERE deleted_at IS NULL
GROUP BY component_type
ORDER BY 
  CASE component_type
    WHEN 'layout' THEN 1
    WHEN 'module' THEN 2
    WHEN 'page' THEN 3
    WHEN 'widget' THEN 4
    WHEN 'form' THEN 5
    ELSE 6
  END;

COMMENT ON TABLE app_components IS 'Application components table with hierarchical structure (layout > module > page; widget; form)';

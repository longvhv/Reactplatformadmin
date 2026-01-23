-- Performance indexes for better query performance

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active) WHERE deleted_at IS NULL;

-- Tenant members indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_status ON tenant_members(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_is_active ON tenant_members(is_active) WHERE deleted_at IS NULL;

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(tenant_id, code) WHERE deleted_at IS NULL;

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active) WHERE deleted_at IS NULL;

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code) WHERE deleted_at IS NULL;

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active) WHERE deleted_at IS NULL;

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_code ON applications(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_is_active ON applications(is_active) WHERE deleted_at IS NULL;

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type_id) WHERE deleted_at IS NULL;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tenant_members_lookup ON tenant_members(tenant_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_hierarchy ON departments(tenant_id, parent_department_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, role_id) WHERE deleted_at IS NULL;

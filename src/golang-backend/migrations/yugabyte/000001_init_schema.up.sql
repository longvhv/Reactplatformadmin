-- YugabyteDB Schema Migration
-- Tier 1: Foundation Entities

-- Users table
CREATE TABLE IF NOT EXISTS users (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'vi',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    metadata JSONB,
    supabase_uid UUID,
    external_provider VARCHAR(50),
    external_provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1
);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    tax_id VARCHAR(50),
    billing_email VARCHAR(255),
    support_email VARCHAR(255),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMP,
    subscription_plan VARCHAR(50),
    max_users INTEGER DEFAULT 5,
    max_storage BIGINT DEFAULT 1073741824,
    current_storage BIGINT DEFAULT 0,
    settings JSONB,
    metadata JSONB,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (owner_id) REFERENCES users(_id)
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    tenant_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1,
    UNIQUE (code, tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1
);

-- Role Permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(_id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(_id) ON DELETE CASCADE
);

-- User Roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    tenant_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    PRIMARY KEY (user_id, role_id, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID)),
    FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(_id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource, action);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);

-- Insert default permissions
INSERT INTO permissions (name, code, resource, action, category) VALUES
    ('Create Users', 'users.create', 'users', 'create', 'user_management'),
    ('Read Users', 'users.read', 'users', 'read', 'user_management'),
    ('Update Users', 'users.update', 'users', 'update', 'user_management'),
    ('Delete Users', 'users.delete', 'users', 'delete', 'user_management'),
    
    ('Create Tenants', 'tenants.create', 'tenants', 'create', 'tenant_management'),
    ('Read Tenants', 'tenants.read', 'tenants', 'read', 'tenant_management'),
    ('Update Tenants', 'tenants.update', 'tenants', 'update', 'tenant_management'),
    ('Delete Tenants', 'tenants.delete', 'tenants', 'delete', 'tenant_management'),
    
    ('Create Roles', 'roles.create', 'roles', 'create', 'access_control'),
    ('Read Roles', 'roles.read', 'roles', 'read', 'access_control'),
    ('Update Roles', 'roles.update', 'roles', 'update', 'access_control'),
    ('Delete Roles', 'roles.delete', 'roles', 'delete', 'access_control'),
    
    ('Manage Permissions', 'permissions.manage', 'permissions', 'manage', 'access_control')
ON CONFLICT (code) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, code, description, is_system_role, is_active) VALUES
    ('Super Admin', 'super_admin', 'Full system access', TRUE, TRUE),
    ('Admin', 'admin', 'Administrative access', TRUE, TRUE),
    ('User', 'user', 'Basic user access', TRUE, TRUE)
ON CONFLICT (code, tenant_id) DO NOTHING;

-- Assign all permissions to Super Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r._id, p._id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

-- Tenant Members table
CREATE TABLE IF NOT EXISTS tenant_members (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    employee_code VARCHAR(50),
    job_title VARCHAR(100),
    department VARCHAR(100),
    manager_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LEFT')),
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    work_email VARCHAR(255),
    work_phone VARCHAR(20),
    work_location VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    FOREIGN KEY (user_id) REFERENCES users(_id),
    FOREIGN KEY (manager_id) REFERENCES tenant_members(_id),
    UNIQUE (tenant_id, user_id)
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    parent_department_id UUID,
    manager_id UUID,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    "order" INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    FOREIGN KEY (parent_department_id) REFERENCES departments(_id),
    FOREIGN KEY (manager_id) REFERENCES tenant_members(_id),
    UNIQUE (tenant_id, code)
);

-- User Groups table
CREATE TABLE IF NOT EXISTS user_groups (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_type VARCHAR(50) DEFAULT 'STANDARD',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    UNIQUE (tenant_id, code)
);

-- Department Members junction table
CREATE TABLE IF NOT EXISTS department_members (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    department_id UUID NOT NULL,
    tenant_member_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    role_in_department VARCHAR(100),
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    FOREIGN KEY (department_id) REFERENCES departments(_id),
    FOREIGN KEY (tenant_member_id) REFERENCES tenant_members(_id),
    UNIQUE (department_id, tenant_member_id)
);

-- Group Members junction table
CREATE TABLE IF NOT EXISTS group_members (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_group_id UUID NOT NULL,
    tenant_member_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    role_in_group VARCHAR(100),
    joined_at TIMESTAMP,
    left_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    FOREIGN KEY (user_group_id) REFERENCES user_groups(_id),
    FOREIGN KEY (tenant_member_id) REFERENCES tenant_members(_id),
    UNIQUE (user_group_id, tenant_member_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9_]+$'),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    version INTEGER DEFAULT 1
);

-- Location Types table
CREATE TABLE IF NOT EXISTS location_types (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code VARCHAR(50) NOT NULL CHECK (code ~ '^[A-Z0-9_]+$'),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    extra_fields JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id)
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id UUID,
    type_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    path TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'CLOSED')),
    address JSONB DEFAULT '{}'::jsonb,
    coordinates POINT,
    radius_meters INTEGER DEFAULT 100 CHECK (radius_meters > 0),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_headquarter BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    FOREIGN KEY (parent_id) REFERENCES locations(_id),
    FOREIGN KEY (type_id) REFERENCES location_types(_id)
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    headers JSONB,
    retry_policy JSONB,
    timeout INTEGER DEFAULT 30,
    last_triggered TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id)
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    allowed_ips TEXT[],
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    version INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(_id),
    FOREIGN KEY (created_by) REFERENCES users(_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_groups_tenant ON user_groups(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id) WHERE deleted_at IS NULL;
-- Migration: Create system_categories table
-- Description: Stores system-level declaration categories
-- Created: 2024-01-15

-- Create system_categories table
CREATE TABLE IF NOT EXISTS system_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category_group VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    is_editable BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT system_categories_status_check CHECK (status IN ('active', 'inactive')),
    CONSTRAINT system_categories_code_format CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT system_categories_order_check CHECK ("order" >= 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_system_categories_type ON system_categories(type);
CREATE INDEX idx_system_categories_category_group ON system_categories(category_group);
CREATE INDEX idx_system_categories_status ON system_categories(status);
CREATE INDEX idx_system_categories_is_system ON system_categories(is_system);
CREATE INDEX idx_system_categories_is_editable ON system_categories(is_editable);
CREATE INDEX idx_system_categories_code ON system_categories(code);
CREATE INDEX idx_system_categories_order ON system_categories("order");

-- Create GIN index for metadata JSONB column
CREATE INDEX idx_system_categories_metadata ON system_categories USING GIN (metadata);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_system_categories_updated_at
    BEFORE UPDATE ON system_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_system_categories_updated_at();

-- Insert initial system categories
INSERT INTO system_categories (code, name, type, category_group, description, is_system, is_editable, "order", status, metadata) VALUES
-- Tenant Types
('SYS_TENANT_ENTERPRISE', 'Enterprise', 'tenant_type', 'tenant_classification', 'Enterprise organization with full features', true, false, 1, 'active', '{"max_users": -1, "features": ["all"]}'),
('SYS_TENANT_BUSINESS', 'Business', 'tenant_type', 'tenant_classification', 'Business organization with standard features', true, false, 2, 'active', '{"max_users": 100, "features": ["standard"]}'),
('SYS_TENANT_STARTER', 'Starter', 'tenant_type', 'tenant_classification', 'Small organization with basic features', true, false, 3, 'active', '{"max_users": 10, "features": ["basic"]}'),

-- System Roles
('SYS_ROLE_SUPER_ADMIN', 'Super Administrator', 'user_role', 'system_roles', 'Full system access across all tenants', true, false, 1, 'active', '{"permissions": ["*"], "level": 0}'),
('SYS_ROLE_TENANT_ADMIN', 'Tenant Administrator', 'user_role', 'system_roles', 'Full access within tenant', true, false, 2, 'active', '{"permissions": ["tenant.*"], "level": 1}'),
('SYS_ROLE_USER', 'User', 'user_role', 'system_roles', 'Standard user access', true, false, 3, 'active', '{"permissions": ["read"], "level": 2}'),

-- Entity Status
('SYS_STATUS_PENDING', 'Pending', 'entity_status', 'workflow_states', 'Awaiting approval or processing', true, true, 1, 'active', '{"color": "#f59e0b", "icon": "clock"}'),
('SYS_STATUS_APPROVED', 'Approved', 'entity_status', 'workflow_states', 'Approved and active', true, true, 2, 'active', '{"color": "#10b981", "icon": "check-circle"}'),
('SYS_STATUS_REJECTED', 'Rejected', 'entity_status', 'workflow_states', 'Rejected or declined', true, true, 3, 'active', '{"color": "#ef4444", "icon": "x-circle"}'),
('SYS_STATUS_ARCHIVED', 'Archived', 'entity_status', 'workflow_states', 'Archived for record keeping', true, true, 4, 'active', '{"color": "#6b7280", "icon": "archive"}'),

-- Priority Levels
('SYS_PRIORITY_CRITICAL', 'Critical', 'priority_level', 'priority_classification', 'Highest priority - immediate action required', true, false, 1, 'active', '{"color": "#dc2626", "weight": 4}'),
('SYS_PRIORITY_HIGH', 'High', 'priority_level', 'priority_classification', 'High priority - action required soon', true, false, 2, 'active', '{"color": "#ea580c", "weight": 3}'),
('SYS_PRIORITY_MEDIUM', 'Medium', 'priority_level', 'priority_classification', 'Medium priority - normal processing', true, false, 3, 'active', '{"color": "#f59e0b", "weight": 2}'),
('SYS_PRIORITY_LOW', 'Low', 'priority_level', 'priority_classification', 'Low priority - when time permits', true, false, 4, 'active', '{"color": "#84cc16", "weight": 1}');

-- Add comments for documentation
COMMENT ON TABLE system_categories IS 'Stores system-level declaration categories';
COMMENT ON COLUMN system_categories.code IS 'Unique identifier code (uppercase, numbers, underscores)';
COMMENT ON COLUMN system_categories.name IS 'Display name of the category';
COMMENT ON COLUMN system_categories.type IS 'Type classification (e.g., user_role, tenant_type)';
COMMENT ON COLUMN system_categories.category_group IS 'Group classification for organizing categories';
COMMENT ON COLUMN system_categories.description IS 'Detailed description of the category';
COMMENT ON COLUMN system_categories.is_system IS 'Indicates if category is managed by system';
COMMENT ON COLUMN system_categories.is_editable IS 'Indicates if category can be edited or deleted';
COMMENT ON COLUMN system_categories."order" IS 'Display order (lower numbers appear first)';
COMMENT ON COLUMN system_categories.status IS 'Active or inactive status';
COMMENT ON COLUMN system_categories.metadata IS 'Additional custom data in JSON format';

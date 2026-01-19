-- =====================================================
-- Migration: Applications & Permissions Tables
-- Date: 2026-01-16
-- Description: Create tables for applications and permissions
--              to support dynamic role permission management
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: applications
-- Purpose: Store application definitions
-- =====================================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  icon_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT applications_name_not_empty CHECK (name <> ''),
  CONSTRAINT applications_code_not_empty CHECK (code <> ''),
  CONSTRAINT applications_code_lowercase CHECK (code = LOWER(code))
);

-- Indexes for applications table
CREATE INDEX IF NOT EXISTS idx_applications_code ON applications(code);
CREATE INDEX IF NOT EXISTS idx_applications_is_active ON applications(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Add comment to table
COMMENT ON TABLE applications IS 'Stores application definitions for permission management';
COMMENT ON COLUMN applications.id IS 'Primary key (UUID)';
COMMENT ON COLUMN applications.name IS 'Display name of the application';
COMMENT ON COLUMN applications.code IS 'Unique code identifier (lowercase, no spaces)';
COMMENT ON COLUMN applications.description IS 'Optional description of the application';
COMMENT ON COLUMN applications.is_active IS 'Whether the application is active';
COMMENT ON COLUMN applications.icon_url IS 'Optional URL to application icon';
COMMENT ON COLUMN applications.metadata IS 'Additional metadata in JSON format';
COMMENT ON COLUMN applications.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN applications.updated_at IS 'Timestamp when record was last updated';

-- =====================================================
-- Table: permissions
-- Purpose: Store permission definitions
-- =====================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  resource VARCHAR(100),
  action VARCHAR(100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT permissions_code_not_empty CHECK (code <> ''),
  CONSTRAINT permissions_name_not_empty CHECK (name <> ''),
  CONSTRAINT permissions_code_format CHECK (code ~ '^[a-z0-9:_-]+$')
);

-- Indexes for permissions table
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_application_id ON permissions(application_id);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON permissions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_permissions_created_at ON permissions(created_at);

-- Add comment to table
COMMENT ON TABLE permissions IS 'Stores permission definitions linked to applications';
COMMENT ON COLUMN permissions.id IS 'Primary key (UUID)';
COMMENT ON COLUMN permissions.code IS 'Unique permission code (format: app:resource:action)';
COMMENT ON COLUMN permissions.name IS 'Display name of the permission';
COMMENT ON COLUMN permissions.description IS 'Optional description of the permission';
COMMENT ON COLUMN permissions.application_id IS 'Foreign key to applications table';
COMMENT ON COLUMN permissions.resource IS 'Resource type (e.g., users, roles, tenants)';
COMMENT ON COLUMN permissions.action IS 'Action type (e.g., read, write, delete)';
COMMENT ON COLUMN permissions.is_active IS 'Whether the permission is active';
COMMENT ON COLUMN permissions.metadata IS 'Additional metadata in JSON format';
COMMENT ON COLUMN permissions.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN permissions.updated_at IS 'Timestamp when record was last updated';

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for applications table
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for permissions table
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data: Sample Applications
-- =====================================================

INSERT INTO applications (name, code, description, is_active) VALUES
  ('Core System', 'core', 'Main application core features including user management, roles, and system settings', true),
  ('HR Management', 'hr', 'Human resources management including employees, attendance, and payroll', true),
  ('Finance', 'finance', 'Financial management system including invoices, payments, and accounting', true),
  ('Reports & Analytics', 'reports', 'Reporting and analytics module for business insights', true),
  ('Support', 'support', 'Customer support and ticketing system', true),
  ('CRM', 'crm', 'Customer relationship management', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Seed Data: Sample Permissions
-- =====================================================

-- Core System Permissions
INSERT INTO permissions (code, name, description, application_id, resource, action, is_active) VALUES
  -- Users
  ('core:users:read', 'Read Users', 'View user information and list', (SELECT id FROM applications WHERE code = 'core'), 'users', 'read', true),
  ('core:users:write', 'Write Users', 'Create and update users', (SELECT id FROM applications WHERE code = 'core'), 'users', 'write', true),
  ('core:users:delete', 'Delete Users', 'Delete users from the system', (SELECT id FROM applications WHERE code = 'core'), 'users', 'delete', true),
  
  -- Roles
  ('core:roles:read', 'Read Roles', 'View role information and list', (SELECT id FROM applications WHERE code = 'core'), 'roles', 'read', true),
  ('core:roles:write', 'Write Roles', 'Create and update roles', (SELECT id FROM applications WHERE code = 'core'), 'roles', 'write', true),
  ('core:roles:delete', 'Delete Roles', 'Delete roles from the system', (SELECT id FROM applications WHERE code = 'core'), 'roles', 'delete', true),
  
  -- Tenants
  ('core:tenants:read', 'Read Tenants', 'View tenant information and list', (SELECT id FROM applications WHERE code = 'core'), 'tenants', 'read', true),
  ('core:tenants:write', 'Write Tenants', 'Create and update tenants', (SELECT id FROM applications WHERE code = 'core'), 'tenants', 'write', true),
  ('core:tenants:delete', 'Delete Tenants', 'Delete tenants from the system', (SELECT id FROM applications WHERE code = 'core'), 'tenants', 'delete', true),
  
  -- Members
  ('core:members:read', 'Read Members', 'View tenant members', (SELECT id FROM applications WHERE code = 'core'), 'members', 'read', true),
  ('core:members:write', 'Write Members', 'Manage tenant members', (SELECT id FROM applications WHERE code = 'core'), 'members', 'write', true),
  ('core:members:delete', 'Delete Members', 'Remove tenant members', (SELECT id FROM applications WHERE code = 'core'), 'members', 'delete', true),
  
  -- Settings
  ('core:settings:read', 'Read Settings', 'View system settings', (SELECT id FROM applications WHERE code = 'core'), 'settings', 'read', true),
  ('core:settings:write', 'Write Settings', 'Update system settings', (SELECT id FROM applications WHERE code = 'core'), 'settings', 'write', true)
ON CONFLICT (code) DO NOTHING;

-- HR Permissions
INSERT INTO permissions (code, name, description, application_id, resource, action, is_active) VALUES
  ('hr:employees:read', 'Read Employees', 'View employee information', (SELECT id FROM applications WHERE code = 'hr'), 'employees', 'read', true),
  ('hr:employees:write', 'Write Employees', 'Create and update employees', (SELECT id FROM applications WHERE code = 'hr'), 'employees', 'write', true),
  ('hr:employees:delete', 'Delete Employees', 'Delete employees', (SELECT id FROM applications WHERE code = 'hr'), 'employees', 'delete', true),
  ('hr:attendance:read', 'Read Attendance', 'View attendance records', (SELECT id FROM applications WHERE code = 'hr'), 'attendance', 'read', true),
  ('hr:attendance:write', 'Write Attendance', 'Manage attendance records', (SELECT id FROM applications WHERE code = 'hr'), 'attendance', 'write', true),
  ('hr:payroll:read', 'Read Payroll', 'View payroll information', (SELECT id FROM applications WHERE code = 'hr'), 'payroll', 'read', true),
  ('hr:payroll:write', 'Write Payroll', 'Process payroll', (SELECT id FROM applications WHERE code = 'hr'), 'payroll', 'write', true)
ON CONFLICT (code) DO NOTHING;

-- Finance Permissions
INSERT INTO permissions (code, name, description, application_id, resource, action, is_active) VALUES
  ('finance:invoices:read', 'Read Invoices', 'View invoices', (SELECT id FROM applications WHERE code = 'finance'), 'invoices', 'read', true),
  ('finance:invoices:write', 'Write Invoices', 'Create and update invoices', (SELECT id FROM applications WHERE code = 'finance'), 'invoices', 'write', true),
  ('finance:invoices:delete', 'Delete Invoices', 'Delete invoices', (SELECT id FROM applications WHERE code = 'finance'), 'invoices', 'delete', true),
  ('finance:payments:read', 'Read Payments', 'View payment records', (SELECT id FROM applications WHERE code = 'finance'), 'payments', 'read', true),
  ('finance:payments:write', 'Write Payments', 'Process payments', (SELECT id FROM applications WHERE code = 'finance'), 'payments', 'write', true),
  ('finance:accounting:read', 'Read Accounting', 'View accounting records', (SELECT id FROM applications WHERE code = 'finance'), 'accounting', 'read', true),
  ('finance:accounting:write', 'Write Accounting', 'Manage accounting records', (SELECT id FROM applications WHERE code = 'finance'), 'accounting', 'write', true)
ON CONFLICT (code) DO NOTHING;

-- Reports Permissions
INSERT INTO permissions (code, name, description, application_id, resource, action, is_active) VALUES
  ('reports:view', 'View Reports', 'View all reports', (SELECT id FROM applications WHERE code = 'reports'), 'reports', 'view', true),
  ('reports:create', 'Create Reports', 'Create custom reports', (SELECT id FROM applications WHERE code = 'reports'), 'reports', 'create', true),
  ('reports:export', 'Export Reports', 'Export reports to various formats', (SELECT id FROM applications WHERE code = 'reports'), 'reports', 'export', true),
  ('reports:schedule', 'Schedule Reports', 'Schedule automated reports', (SELECT id FROM applications WHERE code = 'reports'), 'reports', 'schedule', true)
ON CONFLICT (code) DO NOTHING;

-- Support Permissions
INSERT INTO permissions (code, name, description, application_id, resource, action, is_active) VALUES
  ('support:tickets:read', 'Read Tickets', 'View support tickets', (SELECT id FROM applications WHERE code = 'support'), 'tickets', 'read', true),
  ('support:tickets:write', 'Write Tickets', 'Create and update tickets', (SELECT id FROM applications WHERE code = 'support'), 'tickets', 'write', true),
  ('support:tickets:delete', 'Delete Tickets', 'Delete tickets', (SELECT id FROM applications WHERE code = 'support'), 'tickets', 'delete', true),
  ('support:tickets:assign', 'Assign Tickets', 'Assign tickets to staff', (SELECT id FROM applications WHERE code = 'support'), 'tickets', 'assign', true)
ON CONFLICT (code) DO NOTHING;

-- CRM Permissions
INSERT INTO permissions (code, name, description, application_id, resource, action, is_active) VALUES
  ('crm:contacts:read', 'Read Contacts', 'View customer contacts', (SELECT id FROM applications WHERE code = 'crm'), 'contacts', 'read', true),
  ('crm:contacts:write', 'Write Contacts', 'Manage customer contacts', (SELECT id FROM applications WHERE code = 'crm'), 'contacts', 'write', true),
  ('crm:contacts:delete', 'Delete Contacts', 'Delete customer contacts', (SELECT id FROM applications WHERE code = 'crm'), 'contacts', 'delete', true),
  ('crm:deals:read', 'Read Deals', 'View deals and opportunities', (SELECT id FROM applications WHERE code = 'crm'), 'deals', 'read', true),
  ('crm:deals:write', 'Write Deals', 'Manage deals and opportunities', (SELECT id FROM applications WHERE code = 'crm'), 'deals', 'write', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Count applications
SELECT COUNT(*) as application_count FROM applications;

-- Count permissions by application
SELECT 
  a.name as application_name,
  COUNT(p.id) as permission_count
FROM applications a
LEFT JOIN permissions p ON a.id = p.application_id
GROUP BY a.name
ORDER BY a.name;

-- Show all permissions with application info
SELECT 
  a.name as application,
  p.code,
  p.name as permission_name,
  p.resource,
  p.action
FROM permissions p
JOIN applications a ON p.application_id = a.id
ORDER BY a.name, p.code;

-- =====================================================
-- Rollback (if needed)
-- =====================================================

-- Uncomment the lines below to rollback the migration
/*
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
*/

-- =====================================================
-- Migration Complete
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Applications table created with sample data';
  RAISE NOTICE '🔐 Permissions table created with sample data';
  RAISE NOTICE '🔄 Triggers for updated_at created';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '1. Verify tables in Supabase Table Editor';
  RAISE NOTICE '2. Test Role Form in the application';
  RAISE NOTICE '3. Add more applications/permissions as needed';
END $$;

-- Migration: 005_create_categories_table
-- Description: Create categories table for system classification management
-- Author: System
-- Date: 2024-01-20

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Fields
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Hierarchical Structure
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Ordering and Status
    "order" INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Flexible Metadata (JSONB for better query performance)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Soft Delete (optional, currently not used but ready for future)
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for fast code lookup (unique enforced)
CREATE UNIQUE INDEX idx_categories_code ON categories(code) WHERE deleted_at IS NULL;

-- Index for type-based queries
CREATE INDEX idx_categories_type ON categories(type) WHERE deleted_at IS NULL;

-- Index for status queries
CREATE INDEX idx_categories_status ON categories(status) WHERE deleted_at IS NULL;

-- Index for parent-child relationships
CREATE INDEX idx_categories_parent_id ON categories(parent_id) WHERE deleted_at IS NULL;

-- Index for ordering within same type
CREATE INDEX idx_categories_type_order ON categories(type, "order") WHERE deleted_at IS NULL;

-- Composite index for common filter combinations
CREATE INDEX idx_categories_type_status ON categories(type, status) WHERE deleted_at IS NULL;

-- Index for full-text search on name and description
CREATE INDEX idx_categories_search ON categories USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
) WHERE deleted_at IS NULL;

-- Index for JSONB metadata queries
CREATE INDEX idx_categories_metadata ON categories USING gin(metadata) WHERE deleted_at IS NULL;

-- Index for audit queries
CREATE INDEX idx_categories_created_at ON categories(created_at);
CREATE INDEX idx_categories_updated_at ON categories(updated_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_timestamp
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Trigger to prevent circular parent relationships
CREATE OR REPLACE FUNCTION check_category_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
    current_parent UUID;
    depth INTEGER := 0;
    max_depth INTEGER := 10;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Cannot be its own parent
    IF NEW.id = NEW.parent_id THEN
        RAISE EXCEPTION 'Category cannot be its own parent';
    END IF;
    
    -- Check for circular references
    current_parent := NEW.parent_id;
    WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
        IF current_parent = NEW.id THEN
            RAISE EXCEPTION 'Circular parent reference detected';
        END IF;
        
        SELECT parent_id INTO current_parent 
        FROM categories 
        WHERE id = current_parent;
        
        depth := depth + 1;
    END LOOP;
    
    IF depth >= max_depth THEN
        RAISE EXCEPTION 'Maximum category hierarchy depth exceeded';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_circular_reference
    BEFORE INSERT OR UPDATE OF parent_id ON categories
    FOR EACH ROW
    EXECUTE FUNCTION check_category_circular_reference();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default category types
INSERT INTO categories (code, name, type, description, "order", status) VALUES
-- Tenant Types
('TENANT_FREE', 'Free Tier', 'tenant_type', 'Free tier with basic features', 1, 'active'),
('TENANT_STARTER', 'Starter', 'tenant_type', 'Starter tier for small teams', 2, 'active'),
('TENANT_PROFESSIONAL', 'Professional', 'tenant_type', 'Professional tier for growing businesses', 3, 'active'),
('TENANT_ENTERPRISE', 'Enterprise', 'tenant_type', 'Enterprise tier with advanced features', 4, 'active'),

-- User Roles
('USER_SUPER_ADMIN', 'Super Administrator', 'user_role', 'Full system access across all tenants', 1, 'active'),
('USER_ADMIN', 'Administrator', 'user_role', 'Full tenant access', 2, 'active'),
('USER_MANAGER', 'Manager', 'user_role', 'Team management access', 3, 'active'),
('USER_MEMBER', 'Member', 'user_role', 'Standard user access', 4, 'active'),
('USER_VIEWER', 'Viewer', 'user_role', 'Read-only access', 5, 'active'),

-- User Status
('STATUS_ACTIVE', 'Active', 'user_status', 'User is active and can access the system', 1, 'active'),
('STATUS_INACTIVE', 'Inactive', 'user_status', 'User account is temporarily disabled', 2, 'active'),
('STATUS_PENDING', 'Pending', 'user_status', 'User registration pending approval', 3, 'active'),
('STATUS_SUSPENDED', 'Suspended', 'user_status', 'User account suspended due to violations', 4, 'active'),
('STATUS_LOCKED', 'Locked', 'user_status', 'Account locked after multiple failed login attempts', 5, 'active'),

-- Priority Levels
('PRIORITY_CRITICAL', 'Critical', 'priority_level', 'Requires immediate attention', 1, 'active'),
('PRIORITY_HIGH', 'High', 'priority_level', 'Important and urgent', 2, 'active'),
('PRIORITY_MEDIUM', 'Medium', 'priority_level', 'Normal priority', 3, 'active'),
('PRIORITY_LOW', 'Low', 'priority_level', 'Low priority, can be deferred', 4, 'active'),

-- Document Types
('DOC_CONTRACT', 'Contract', 'document_type', 'Legal contracts and agreements', 1, 'active'),
('DOC_INVOICE', 'Invoice', 'document_type', 'Billing invoices', 2, 'active'),
('DOC_PROPOSAL', 'Proposal', 'document_type', 'Business proposals', 3, 'active'),
('DOC_REPORT', 'Report', 'document_type', 'Various reports', 4, 'active'),
('DOC_OTHER', 'Other', 'document_type', 'Other document types', 5, 'active');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE categories IS 'System classification categories for various entities';
COMMENT ON COLUMN categories.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN categories.code IS 'Unique category code (uppercase, snake_case)';
COMMENT ON COLUMN categories.name IS 'Human-readable category name';
COMMENT ON COLUMN categories.type IS 'Category type (tenant_type, user_role, etc.)';
COMMENT ON COLUMN categories.description IS 'Detailed description of the category';
COMMENT ON COLUMN categories.parent_id IS 'Parent category ID for hierarchical structure';
COMMENT ON COLUMN categories."order" IS 'Display order within same type';
COMMENT ON COLUMN categories.status IS 'Category status (active/inactive)';
COMMENT ON COLUMN categories.metadata IS 'Flexible JSON data for additional properties';
COMMENT ON COLUMN categories.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN categories.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN categories.created_by IS 'User ID who created the record';
COMMENT ON COLUMN categories.updated_by IS 'User ID who last updated the record';

-- ============================================================================
-- DOWN MIGRATION
-- ============================================================================

-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS trigger_check_circular_reference ON categories;
DROP TRIGGER IF EXISTS trigger_update_categories_timestamp ON categories;
DROP FUNCTION IF EXISTS check_category_circular_reference();
DROP FUNCTION IF EXISTS update_categories_updated_at();
DROP INDEX IF EXISTS idx_categories_updated_at;
DROP INDEX IF EXISTS idx_categories_created_at;
DROP INDEX IF EXISTS idx_categories_metadata;
DROP INDEX IF EXISTS idx_categories_search;
DROP INDEX IF EXISTS idx_categories_type_status;
DROP INDEX IF EXISTS idx_categories_type_order;
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_categories_status;
DROP INDEX IF EXISTS idx_categories_type;
DROP INDEX IF EXISTS idx_categories_code;
DROP TABLE IF EXISTS categories CASCADE;
*/

-- Migration: Create app_components table
-- Description: Table for storing application components with hierarchy
-- Created: 2024-01-08

-- Create app_components table
CREATE TABLE IF NOT EXISTS app_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    _id VARCHAR(100) NOT NULL UNIQUE,  -- Manual component ID (e.g., APP_COMP_HEADER)
    title VARCHAR(255) NOT NULL,
    parent_id VARCHAR(100),  -- References _id of parent component
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,  -- Additional component properties
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT fk_parent_component FOREIGN KEY (parent_id) 
        REFERENCES app_components(_id) ON DELETE RESTRICT,
    CONSTRAINT check_parent_not_self CHECK (parent_id != _id)
);

-- Indexes
CREATE INDEX idx_app_components_id ON app_components(_id);
CREATE INDEX idx_app_components_parent_id ON app_components(parent_id);
CREATE INDEX idx_app_components_is_active ON app_components(is_active);
CREATE INDEX idx_app_components_order ON app_components("order");
CREATE INDEX idx_app_components_metadata ON app_components USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_app_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_components_updated_at
    BEFORE UPDATE ON app_components
    FOR EACH ROW
    EXECUTE FUNCTION update_app_components_updated_at();

-- Sample data
INSERT INTO app_components (_id, title, parent_id, description, is_active, "order", metadata)
VALUES 
    ('APP_COMP_ROOT', 'Root Container', NULL, 'Root level application container', true, 1, '{"level": 0}'),
    ('APP_COMP_HEADER', 'Header Component', 'APP_COMP_ROOT', 'Application header with navigation', true, 2, '{"level": 1, "position": "top"}'),
    ('APP_COMP_SIDEBAR', 'Sidebar Component', 'APP_COMP_ROOT', 'Application sidebar navigation', true, 3, '{"level": 1, "position": "left"}'),
    ('APP_COMP_CONTENT', 'Main Content Area', 'APP_COMP_ROOT', 'Main content rendering area', true, 4, '{"level": 1, "position": "center"}'),
    ('APP_COMP_FOOTER', 'Footer Component', 'APP_COMP_ROOT', 'Application footer', false, 5, '{"level": 1, "position": "bottom"}')
ON CONFLICT (_id) DO NOTHING;

-- Comments
COMMENT ON TABLE app_components IS 'Application components with hierarchical structure';
COMMENT ON COLUMN app_components._id IS 'Manual component ID (uppercase, numbers, underscores)';
COMMENT ON COLUMN app_components.title IS 'Component display name';
COMMENT ON COLUMN app_components.parent_id IS 'Parent component _id for hierarchy';
COMMENT ON COLUMN app_components.is_active IS 'Whether component is active';
COMMENT ON COLUMN app_components."order" IS 'Display order (lower numbers first)';

-- ============================================================================
-- LOCATIONS TABLE SETUP FOR SUPABASE
-- ============================================================================
-- 
-- Instructions: Copy and paste this SQL into Supabase SQL Editor
-- 
-- Table: locations
-- Classification: TENANT-SPECIFIC (has tenant_id)
-- Purpose: Physical locations/branches/offices of a tenant
-- 
-- ⚠️ IMPORTANT: Run this AFTER SUPABASE_TENANT_SPECIFIC_TABLES.sql
-- 
-- ============================================================================

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: locations
-- Description: Physical locations, branches, offices, warehouses of a tenant
-- Classification: TENANT-SPECIFIC (has tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- II. LOCATION TYPE & STATUS
    location_type VARCHAR(50) NOT NULL DEFAULT 'OFFICE',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- III. ADDRESS INFORMATION
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- IV. CONTACT INFORMATION
    phone VARCHAR(50),
    email VARCHAR(255),
    fax VARCHAR(50),
    
    -- V. GEOGRAPHIC COORDINATES
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    
    -- VI. BUSINESS INFORMATION
    manager_id UUID, -- References tenant_members._id
    parent_location_id UUID, -- Self-referencing for hierarchy
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_warehouse BOOLEAN NOT NULL DEFAULT false,
    is_retail BOOLEAN NOT NULL DEFAULT false,
    
    -- VII. OPERATIONAL DATA
    area_sqm DECIMAL(10, 2),
    capacity INTEGER,
    opening_hours JSONB DEFAULT '{}',
    
    -- VIII. METADATA & SETTINGS
    description TEXT,
    "order" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- IX. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_locations_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT chk_locations_type CHECK (location_type IN ('OFFICE', 'WAREHOUSE', 'RETAIL', 'FACTORY', 'BRANCH', 'HEADQUARTERS', 'DATACENTER', 'OTHER')),
    CONSTRAINT chk_locations_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'CLOSED', 'MAINTENANCE', 'PLANNED')),
    CONSTRAINT chk_locations_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_locations_version CHECK (version >= 1),
    CONSTRAINT chk_locations_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT chk_locations_longitude CHECK (longitude >= -180 AND longitude <= 180),
    CONSTRAINT fk_locations_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(_id),
    CONSTRAINT fk_locations_manager FOREIGN KEY (manager_id) REFERENCES public.tenant_members(_id),
    CONSTRAINT fk_locations_parent FOREIGN KEY (parent_location_id) REFERENCES public.locations(_id)
);

-- INDEXES for locations
CREATE INDEX IF NOT EXISTS idx_locations_tenant_id ON public.locations (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_manager_id ON public.locations (manager_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations (parent_location_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations (location_type);
CREATE INDEX IF NOT EXISTS idx_locations_status ON public.locations (status);
CREATE INDEX IF NOT EXISTS idx_locations_is_primary ON public.locations (is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_locations_country ON public.locations (country);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations (city);
CREATE INDEX IF NOT EXISTS idx_locations_order ON public.locations ("order");
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON public.locations (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_metadata_gin ON public.locations USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_locations_opening_hours_gin ON public.locations USING GIN (opening_hours);
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_code_active 
    ON public.locations (tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_locations_updated_at ON public.locations;
CREATE TRIGGER trigger_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION update_locations_updated_at();

-- Comments
COMMENT ON TABLE public.locations IS 'Physical locations, branches, offices, warehouses of a tenant';
COMMENT ON COLUMN public.locations.location_type IS 'Type: OFFICE, WAREHOUSE, RETAIL, FACTORY, BRANCH, HEADQUARTERS, DATACENTER, OTHER';
COMMENT ON COLUMN public.locations.is_primary IS 'True if this is the primary/main location';
COMMENT ON COLUMN public.locations.opening_hours IS 'JSON object with weekly schedule: {"monday": "09:00-17:00", ...}';
COMMENT ON COLUMN public.locations.manager_id IS 'Location manager (tenant_member)';
COMMENT ON COLUMN public.locations.parent_location_id IS 'Parent location for hierarchical structure';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on locations" ON public.locations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can view locations
CREATE POLICY "Users can view locations" ON public.locations
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- ============================================================================
-- Sample Data / Demo Data
-- ============================================================================

DO $$
DECLARE
    demo_tenant_id UUID;
    admin_member_id UUID;
    john_member_id UUID;
    jane_member_id UUID;
    hq_location_id UUID;
    sf_office_id UUID;
    ny_office_id UUID;
BEGIN
    -- Get demo tenant
    SELECT _id INTO demo_tenant_id FROM public.tenants WHERE code = 'demo-corp' LIMIT 1;
    
    -- Get demo members
    SELECT _id INTO admin_member_id FROM public.tenant_members 
    WHERE tenant_id = demo_tenant_id AND employee_code = 'EMP-001' LIMIT 1;
    
    SELECT _id INTO john_member_id FROM public.tenant_members 
    WHERE tenant_id = demo_tenant_id AND employee_code = 'EMP-002' LIMIT 1;
    
    SELECT _id INTO jane_member_id FROM public.tenant_members 
    WHERE tenant_id = demo_tenant_id AND employee_code = 'EMP-003' LIMIT 1;
    
    -- Only proceed if demo tenant exists
    IF demo_tenant_id IS NOT NULL THEN
        
        -- ====================================================================
        -- LOCATION 1: Headquarters (Primary)
        -- ====================================================================
        INSERT INTO public.locations (
            tenant_id, code, name, location_type, status,
            address_line1, address_line2, city, state_province, postal_code, country,
            phone, email, timezone,
            latitude, longitude,
            manager_id, is_primary, is_warehouse, is_retail,
            area_sqm, capacity,
            opening_hours,
            description,
            "order"
        ) VALUES (
            demo_tenant_id,
            'HQ-SV',
            'Silicon Valley Headquarters',
            'HEADQUARTERS',
            'ACTIVE',
            '1 Innovation Drive',
            'Building A',
            'Mountain View',
            'California',
            '94043',
            'United States',
            '+1 (650) 555-0100',
            'hq@demo.corp',
            'America/Los_Angeles',
            37.3861,
            -122.0839,
            admin_member_id,
            true, -- is_primary
            false,
            false,
            5000.00, -- 5000 sqm
            250, -- capacity
            jsonb_build_object(
                'monday', '08:00-18:00',
                'tuesday', '08:00-18:00',
                'wednesday', '08:00-18:00',
                'thursday', '08:00-18:00',
                'friday', '08:00-18:00',
                'saturday', 'Closed',
                'sunday', 'Closed'
            ),
            'Main headquarters with executive offices, R&D labs, and employee facilities',
            1
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO hq_location_id;
        
        -- ====================================================================
        -- LOCATION 2: San Francisco Office
        -- ====================================================================
        INSERT INTO public.locations (
            tenant_id, code, name, location_type, status,
            address_line1, city, state_province, postal_code, country,
            phone, email, timezone,
            latitude, longitude,
            manager_id, parent_location_id,
            is_primary, is_warehouse, is_retail,
            area_sqm, capacity,
            opening_hours,
            description,
            "order"
        ) VALUES (
            demo_tenant_id,
            'SF-OFFICE',
            'San Francisco Sales Office',
            'OFFICE',
            'ACTIVE',
            '123 Market Street, Suite 1500',
            'San Francisco',
            'California',
            '94105',
            'United States',
            '+1 (415) 555-0200',
            'sf@demo.corp',
            'America/Los_Angeles',
            37.7749,
            -122.4194,
            jane_member_id,
            hq_location_id, -- parent is HQ
            false,
            false,
            false,
            1200.00,
            60,
            jsonb_build_object(
                'monday', '09:00-17:00',
                'tuesday', '09:00-17:00',
                'wednesday', '09:00-17:00',
                'thursday', '09:00-17:00',
                'friday', '09:00-17:00',
                'saturday', 'Closed',
                'sunday', 'Closed'
            ),
            'Sales and business development office in downtown SF',
            2
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO sf_office_id;
        
        -- ====================================================================
        -- LOCATION 3: New York Branch
        -- ====================================================================
        INSERT INTO public.locations (
            tenant_id, code, name, location_type, status,
            address_line1, city, state_province, postal_code, country,
            phone, email, timezone,
            latitude, longitude,
            manager_id, parent_location_id,
            is_primary, is_warehouse, is_retail,
            area_sqm, capacity,
            opening_hours,
            description,
            "order"
        ) VALUES (
            demo_tenant_id,
            'NY-BRANCH',
            'New York Branch Office',
            'BRANCH',
            'ACTIVE',
            '350 Fifth Avenue, Floor 42',
            'New York',
            'New York',
            '10118',
            'United States',
            '+1 (212) 555-0300',
            'ny@demo.corp',
            'America/New_York',
            40.7484,
            -73.9857,
            john_member_id,
            hq_location_id, -- parent is HQ
            false,
            false,
            false,
            2000.00,
            100,
            jsonb_build_object(
                'monday', '09:00-18:00',
                'tuesday', '09:00-18:00',
                'wednesday', '09:00-18:00',
                'thursday', '09:00-18:00',
                'friday', '09:00-17:00',
                'saturday', 'Closed',
                'sunday', 'Closed'
            ),
            'East coast operations and client services',
            3
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO ny_office_id;
        
        -- ====================================================================
        -- LOCATION 4: Warehouse (Portland)
        -- ====================================================================
        INSERT INTO public.locations (
            tenant_id, code, name, location_type, status,
            address_line1, city, state_province, postal_code, country,
            phone, email, timezone,
            latitude, longitude,
            parent_location_id,
            is_primary, is_warehouse, is_retail,
            area_sqm, capacity,
            opening_hours,
            description,
            "order"
        ) VALUES (
            demo_tenant_id,
            'PDX-WH',
            'Portland Distribution Center',
            'WAREHOUSE',
            'ACTIVE',
            '5000 NW Industrial Parkway',
            'Portland',
            'Oregon',
            '97210',
            'United States',
            '+1 (503) 555-0400',
            'warehouse-pdx@demo.corp',
            'America/Los_Angeles',
            45.5231,
            -122.6765,
            hq_location_id, -- parent is HQ
            false,
            true, -- is_warehouse
            false,
            15000.00, -- large warehouse
            500, -- high capacity
            jsonb_build_object(
                'monday', '06:00-22:00',
                'tuesday', '06:00-22:00',
                'wednesday', '06:00-22:00',
                'thursday', '06:00-22:00',
                'friday', '06:00-22:00',
                'saturday', '08:00-16:00',
                'sunday', 'Closed'
            ),
            'Main distribution and logistics center for West Coast operations',
            4
        )
        ON CONFLICT (tenant_id, code) DO NOTHING;
        
        -- ====================================================================
        -- LOCATION 5: Retail Store (Planned)
        -- ====================================================================
        INSERT INTO public.locations (
            tenant_id, code, name, location_type, status,
            address_line1, city, state_province, postal_code, country,
            timezone,
            latitude, longitude,
            parent_location_id,
            is_primary, is_warehouse, is_retail,
            area_sqm,
            opening_hours,
            description,
            "order"
        ) VALUES (
            demo_tenant_id,
            'LA-RETAIL',
            'Los Angeles Retail Store',
            'RETAIL',
            'PLANNED',
            'The Grove, 189 The Grove Drive',
            'Los Angeles',
            'California',
            '90036',
            'United States',
            'America/Los_Angeles',
            34.0722,
            -118.3592,
            hq_location_id, -- parent is HQ
            false,
            false,
            true, -- is_retail
            300.00,
            jsonb_build_object(
                'monday', '10:00-21:00',
                'tuesday', '10:00-21:00',
                'wednesday', '10:00-21:00',
                'thursday', '10:00-21:00',
                'friday', '10:00-22:00',
                'saturday', '10:00-22:00',
                'sunday', '11:00-20:00'
            ),
            'Flagship retail store opening Q3 2026',
            5
        )
        ON CONFLICT (tenant_id, code) DO NOTHING;
        
        RAISE NOTICE 'Demo locations inserted successfully!';
        RAISE NOTICE 'Created 5 locations: 1 HQ, 2 offices, 1 warehouse, 1 retail (planned)';
        
    ELSE
        RAISE NOTICE 'Demo tenant not found. Please run SUPABASE_TABLES_SETUP.sql first.';
    END IF;
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'locations';

-- Count records
SELECT COUNT(*) as location_count
FROM public.locations
WHERE deleted_at IS NULL;

-- View all locations with manager info
SELECT 
    l.code,
    l.name,
    l.location_type,
    l.status,
    l.city,
    l.state_province,
    l.country,
    l.is_primary,
    parent.name as parent_location,
    u.name as manager_name,
    tm.employee_code as manager_code
FROM public.locations l
LEFT JOIN public.locations parent ON l.parent_location_id = parent._id
LEFT JOIN public.tenant_members tm ON l.manager_id = tm._id
LEFT JOIN public.users u ON tm.user_id = u._id
WHERE l.deleted_at IS NULL
ORDER BY l."order";

-- View location hierarchy
WITH RECURSIVE location_tree AS (
    -- Root locations (no parent)
    SELECT 
        _id,
        code,
        name,
        parent_location_id,
        0 as level,
        code as path
    FROM public.locations
    WHERE parent_location_id IS NULL 
    AND deleted_at IS NULL
    
    UNION ALL
    
    -- Child locations
    SELECT 
        l._id,
        l.code,
        l.name,
        l.parent_location_id,
        lt.level + 1,
        lt.path || ' > ' || l.code
    FROM public.locations l
    JOIN location_tree lt ON l.parent_location_id = lt._id
    WHERE l.deleted_at IS NULL
)
SELECT 
    level,
    REPEAT('  ', level) || name as location_name,
    code,
    path
FROM location_tree
ORDER BY path;

-- Count by type
SELECT 
    location_type,
    COUNT(*) as count
FROM public.locations
WHERE deleted_at IS NULL
GROUP BY location_type
ORDER BY count DESC;

-- Count by status
SELECT 
    status,
    COUNT(*) as count
FROM public.locations
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

-- Count by country
SELECT 
    country,
    COUNT(*) as count
FROM public.locations
WHERE deleted_at IS NULL
GROUP BY country
ORDER BY count DESC;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- Summary:
-- - Table 'locations' created successfully
-- - 5 demo locations inserted:
--   1. Silicon Valley Headquarters (Primary)
--   2. San Francisco Sales Office
--   3. New York Branch Office
--   4. Portland Distribution Center (Warehouse)
--   5. Los Angeles Retail Store (Planned)
-- 
-- Next steps:
-- 1. Run verification queries above
-- 2. Create API endpoints for locations
-- 3. Build UI components
-- 4. Test CRUD operations
-- 
-- ============================================================================

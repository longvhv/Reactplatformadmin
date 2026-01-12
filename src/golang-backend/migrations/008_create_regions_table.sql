-- Migration: Create regions table
-- Description: Table for storing regions (countries, provinces, districts) with date range
-- Created: 2024-01-08

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,  -- Unique region code (e.g., VN, VN-HN, VN-HN-HK)
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),  -- English name
    type VARCHAR(20) NOT NULL CHECK (type IN ('country', 'province', 'district')),
    parent_id UUID,  -- References id of parent region
    
    -- Date range for applicability
    start_date DATE NOT NULL,  -- Date when region becomes effective
    end_date DATE,  -- Date when region becomes inactive (NULL = active indefinitely)
    
    description TEXT,
    metadata JSONB,  -- Additional region properties (timezone, area, etc.)
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT fk_parent_region FOREIGN KEY (parent_id) 
        REFERENCES regions(id) ON DELETE RESTRICT,
    CONSTRAINT check_parent_not_self CHECK (parent_id != id),
    CONSTRAINT check_date_range CHECK (end_date IS NULL OR end_date > start_date),
    CONSTRAINT check_country_no_parent CHECK (
        type != 'country' OR parent_id IS NULL
    ),
    CONSTRAINT check_province_has_parent CHECK (
        type != 'province' OR parent_id IS NOT NULL
    ),
    CONSTRAINT check_district_has_parent CHECK (
        type != 'district' OR parent_id IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_regions_code ON regions(code);
CREATE INDEX idx_regions_type ON regions(type);
CREATE INDEX idx_regions_parent_id ON regions(parent_id);
CREATE INDEX idx_regions_name ON regions(name);
CREATE INDEX idx_regions_name_en ON regions(name_en);
CREATE INDEX idx_regions_start_date ON regions(start_date);
CREATE INDEX idx_regions_end_date ON regions(end_date);
CREATE INDEX idx_regions_active ON regions(start_date, end_date) 
    WHERE end_date IS NULL OR end_date > CURRENT_DATE;
CREATE INDEX idx_regions_metadata ON regions USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_regions_updated_at
    BEFORE UPDATE ON regions
    FOR EACH ROW
    EXECUTE FUNCTION update_regions_updated_at();

-- Sample data (Vietnam regions)
-- Insert countries first
WITH inserted_countries AS (
    INSERT INTO regions (code, name, name_en, type, parent_id, start_date, end_date, description, metadata)
    VALUES 
        ('VN', 'Việt Nam', 'Vietnam', 'country', NULL, '1945-09-02', NULL, 
         'Socialist Republic of Vietnam', 
         '{"iso_code": "VN", "phone_code": "+84", "currency": "VND"}'),
        ('US', 'Hoa Kỳ', 'United States', 'country', NULL, '1776-07-04', NULL, 
         'United States of America', 
         '{"iso_code": "US", "phone_code": "+1", "currency": "USD"}')
    ON CONFLICT (code) DO NOTHING
    RETURNING id, code
),
-- Insert provinces
inserted_provinces AS (
    INSERT INTO regions (code, name, name_en, type, parent_id, start_date, end_date, description, metadata)
    SELECT 'VN-HN', 'Hà Nội', 'Hanoi', 'province', ic.id, '2008-01-01', NULL,
           'Capital city of Vietnam',
           '{"timezone": "Asia/Ho_Chi_Minh", "area": "3359.82 km²"}'
    FROM inserted_countries ic WHERE ic.code = 'VN'
    UNION ALL
    SELECT 'VN-HCM', 'Hồ Chí Minh', 'Ho Chi Minh City', 'province', ic.id, '1976-07-02', NULL,
           'Largest city in Vietnam',
           '{"timezone": "Asia/Ho_Chi_Minh", "area": "2061.4 km²"}'
    FROM inserted_countries ic WHERE ic.code = 'VN'
    UNION ALL
    SELECT 'VN-DN', 'Đà Nẵng', 'Da Nang', 'province', ic.id, '1997-01-01', NULL,
           'Major port city in central Vietnam',
           '{"timezone": "Asia/Ho_Chi_Minh", "area": "1285.4 km²"}'
    FROM inserted_countries ic WHERE ic.code = 'VN'
    ON CONFLICT (code) DO NOTHING
    RETURNING id, code
)
-- Insert districts
INSERT INTO regions (code, name, name_en, type, parent_id, start_date, end_date, description, metadata)
SELECT 'VN-HN-HK', 'Hoàn Kiếm', 'Hoan Kiem', 'district', ip.id, '2008-01-01', NULL,
       'Central district of Hanoi',
       '{"area": "5.29 km²"}'
FROM inserted_provinces ip WHERE ip.code = 'VN-HN'
UNION ALL
SELECT 'VN-HN-BD', 'Ba Đình', 'Ba Dinh', 'district', ip.id, '2008-01-01', NULL,
       'Political center of Vietnam',
       '{"area": "9.21 km²"}'
FROM inserted_provinces ip WHERE ip.code = 'VN-HN'
UNION ALL
SELECT 'VN-HCM-Q1', 'Quận 1', 'District 1', 'district', ip.id, '1976-07-02', NULL,
       'Central business district',
       '{"area": "7.73 km²"}'
FROM inserted_provinces ip WHERE ip.code = 'VN-HCM'
ON CONFLICT (code) DO NOTHING;

-- Comments
COMMENT ON TABLE regions IS 'Hierarchical regions (countries, provinces, districts) with date range applicability';
COMMENT ON COLUMN regions.code IS 'Unique region code (VN, VN-HN, VN-HN-HK)';
COMMENT ON COLUMN regions.type IS 'Region type: country, province, or district';
COMMENT ON COLUMN regions.parent_id IS 'Parent region ID for hierarchy';
COMMENT ON COLUMN regions.start_date IS 'Date when region becomes effective';
COMMENT ON COLUMN regions.end_date IS 'Date when region becomes inactive (NULL = active indefinitely)';

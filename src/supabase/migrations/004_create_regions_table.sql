-- ============================================
-- Migration: Create Regions Table
-- Description: Hierarchical geographic location management (GLOBAL DATA)
-- Author: VHV Platform
-- Date: 2026-01-09
-- ============================================

-- ============================================
-- CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS regions (
  -- Identity (NO tenant_id - this is GLOBAL shared data)
  _id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields
  code            VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('REGION', 'NATION', 'PROVINCE', 'DISTRICT', 'COMMUNE')),
  "order"         INTEGER DEFAULT 0,
  status          SMALLINT DEFAULT 1 CHECK (status IN (0, 1)),
  
  -- Hierarchical structure
  parent_id       UUID REFERENCES regions(_id) ON DELETE SET NULL,
  
  -- Temporal validity
  start_date      DATE,
  end_date        DATE,
  
  -- History tracking
  history_data    JSONB DEFAULT '[]'::jsonb,
  
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
  version         INT DEFAULT 1
);

-- ============================================
-- CREATE INDEXES
-- ============================================
-- Mandatory indexes (no tenant_id because this is global data)
CREATE INDEX idx_regions_deleted_at ON regions(deleted_at);

-- Business indexes
CREATE INDEX idx_regions_type ON regions(type);
CREATE INDEX idx_regions_parent_id ON regions(parent_id);
CREATE INDEX idx_regions_status ON regions(status);
CREATE INDEX idx_regions_code ON regions(code);
CREATE INDEX idx_regions_start_date ON regions(start_date);
CREATE INDEX idx_regions_end_date ON regions(end_date);

-- Composite indexes for hierarchical queries
CREATE INDEX idx_regions_type_parent ON regions(type, parent_id);
CREATE INDEX idx_regions_parent_status ON regions(parent_id, status);

-- JSONB indexes
CREATE INDEX idx_regions_metadata ON regions USING gin(metadata);
CREATE INDEX idx_regions_history_data ON regions USING gin(history_data);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_regions_updated_at
BEFORE UPDATE ON regions
FOR EACH ROW
EXECUTE FUNCTION update_regions_updated_at();

-- ============================================
-- ADD COMMENTS
-- ============================================
COMMENT ON TABLE regions IS 'GLOBAL hierarchical geographic locations - shared across all tenants';
COMMENT ON COLUMN regions._id IS 'Primary key (UUID)';
COMMENT ON COLUMN regions.code IS 'Unique identifier code (e.g., VN, VN-HN, VN-HN-BA)';
COMMENT ON COLUMN regions.type IS 'Geographic level: REGION, NATION, PROVINCE, DISTRICT, COMMUNE';
COMMENT ON COLUMN regions.parent_id IS 'Reference to parent region (NULL for top-level REGION)';
COMMENT ON COLUMN regions.start_date IS 'Date when this region became valid';
COMMENT ON COLUMN regions.end_date IS 'Date when this region became invalid (NULL = still valid)';
COMMENT ON COLUMN regions.history_data IS 'Array of historical changes';
COMMENT ON COLUMN regions.version IS 'Optimistic locking version';

-- ============================================
-- INSERT GEOGRAPHIC CATEGORY TYPES
-- ============================================
-- Add 5 geographic category types to GRP_LOCATION group
DO $$
DECLARE
  system_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  INSERT INTO system_categories (tenant_id, code, name, type, group_category_id, collection_name, extra_fields, status, is_system, is_editable, "order", description) VALUES
    -- Level 1: REGION
    (system_tenant_id, 'REGION', 'Vùng miền', 'SYSTEM_CATEGORY_TYPE', 'GRP_LOCATION', 'regions',
     '[
       {"code": "area", "name": "Diện tích (km²)", "dataType": "number", "defaultValue": 0, "config": {"min": 0}},
       {"code": "population", "name": "Dân số", "dataType": "number", "defaultValue": 0, "config": {"min": 0}},
       {"code": "description", "name": "Mô tả", "dataType": "string", "defaultValue": ""}
     ]'::jsonb,
     1, true, true, 1, 'Vùng miền địa lý (VD: Miền Bắc, Miền Trung, Miền Nam)'),
    
    -- Level 2: NATION
    (system_tenant_id, 'NATION', 'Quốc gia', 'SYSTEM_CATEGORY_TYPE', 'GRP_LOCATION', 'regions',
     '[
       {"code": "iso2_code", "name": "Mã ISO 2 ký tự", "dataType": "string", "defaultValue": "", "config": {"maxLength": 2, "required": true}},
       {"code": "iso3_code", "name": "Mã ISO 3 ký tự", "dataType": "string", "defaultValue": "", "config": {"maxLength": 3}},
       {"code": "phone_code", "name": "Mã điện thoại", "dataType": "string", "defaultValue": "", "config": {"placeholder": "+84"}},
       {"code": "currency", "name": "Đơn vị tiền tệ", "dataType": "string", "defaultValue": ""},
       {"code": "capital", "name": "Thủ đô", "dataType": "string", "defaultValue": ""},
       {"code": "area", "name": "Diện tích (km²)", "dataType": "number", "defaultValue": 0},
       {"code": "population", "name": "Dân số", "dataType": "number", "defaultValue": 0}
     ]'::jsonb,
     1, true, true, 2, 'Quốc gia (VD: Việt Nam, Hoa Kỳ, Nhật Bản)'),
    
    -- Level 3: PROVINCE
    (system_tenant_id, 'PROVINCE', 'Tỉnh/Thành phố', 'SYSTEM_CATEGORY_TYPE', 'GRP_LOCATION', 'regions',
     '[
       {"code": "province_type", "name": "Loại", "dataType": "string", "defaultValue": "province", "config": {"options": ["province", "city", "centrally_city"]}},
       {"code": "region", "name": "Vùng miền", "dataType": "string", "defaultValue": ""},
       {"code": "area", "name": "Diện tích (km²)", "dataType": "number", "defaultValue": 0},
       {"code": "population", "name": "Dân số", "dataType": "number", "defaultValue": 0},
       {"code": "zip_code", "name": "Mã bưu điện", "dataType": "string", "defaultValue": ""}
     ]'::jsonb,
     1, true, true, 3, 'Tỉnh hoặc Thành phố trực thuộc Trung ương'),
    
    -- Level 4: DISTRICT
    (system_tenant_id, 'DISTRICT', 'Quận/Huyện', 'SYSTEM_CATEGORY_TYPE', 'GRP_LOCATION', 'regions',
     '[
       {"code": "district_type", "name": "Loại", "dataType": "string", "defaultValue": "district", "config": {"options": ["district", "urban_district", "town", "city"]}},
       {"code": "area", "name": "Diện tích (km²)", "dataType": "number", "defaultValue": 0},
       {"code": "population", "name": "Dân số", "dataType": "number", "defaultValue": 0}
     ]'::jsonb,
     1, true, true, 4, 'Quận, Huyện, Thị xã, Thành phố thuộc tỉnh'),
    
    -- Level 5: COMMUNE
    (system_tenant_id, 'COMMUNE', 'Xã/Phường/Thị trấn', 'SYSTEM_CATEGORY_TYPE', 'GRP_LOCATION', 'regions',
     '[
       {"code": "commune_type", "name": "Loại", "dataType": "string", "defaultValue": "commune", "config": {"options": ["commune", "ward", "town"]}},
       {"code": "area", "name": "Diện tích (km²)", "dataType": "number", "defaultValue": 0},
       {"code": "population", "name": "Dân số", "dataType": "number", "defaultValue": 0}
     ]'::jsonb,
     1, true, true, 5, 'Xã, Phường, Thị trấn');
END $$;

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
DO $$
DECLARE
  vietnam_id UUID;
  hanoi_id UUID;
  ba_dinh_id UUID;
BEGIN
  
  -- Level 1: Regions (Vietnam)
  INSERT INTO regions (code, name, type, parent_id, "order", status, is_system, is_editable, metadata) VALUES
    ('VN_NORTH', 'Miền Bắc', 'REGION', NULL, 1, 1, true, true, '{"description": "Vùng Đồng bằng sông Hồng và Trung du miền núi phía Bắc"}'),
    ('VN_CENTRAL', 'Miền Trung', 'REGION', NULL, 2, 1, true, true, '{"description": "Vùng Bắc Trung Bộ, Duyên hải Nam Trung Bộ và Tây Nguyên"}'),
    ('VN_SOUTH', 'Miền Nam', 'REGION', NULL, 3, 1, true, true, '{"description": "Vùng Đông Nam Bộ và Đồng bằng sông Cửu Long"}');

  -- Level 2: Nation (Vietnam)
  INSERT INTO regions (code, name, type, parent_id, "order", status, is_system, is_editable, metadata, start_date) VALUES
    ('VN', 'Việt Nam', 'NATION', NULL, 1, 1, true, true, 
     '{"iso2_code": "VN", "iso3_code": "VNM", "phone_code": "+84", "currency": "VND", "capital": "Hà Nội", "area": 331212, "population": 98000000}',
     '1945-09-02')
  RETURNING _id INTO vietnam_id;

  -- Level 3: Provinces
  INSERT INTO regions (code, name, type, parent_id, "order", status, is_system, is_editable, metadata, start_date) VALUES
    ('VN-HN', 'Hà Nội', 'PROVINCE', vietnam_id, 1, 1, true, true, 
     '{"province_type": "centrally_city", "region": "Miền Bắc", "area": 3359, "population": 8000000, "zip_code": "100000"}',
     '1954-10-10'),
    ('VN-SG', 'Hồ Chí Minh', 'PROVINCE', vietnam_id, 2, 1, true, true, 
     '{"province_type": "centrally_city", "region": "Miền Nam", "area": 2061, "population": 9000000, "zip_code": "700000"}',
     '1976-07-02'),
    ('VN-DN', 'Đà Nẵng', 'PROVINCE', vietnam_id, 3, 1, true, true, 
     '{"province_type": "centrally_city", "region": "Miền Trung", "area": 1285, "population": 1200000, "zip_code": "550000"}',
     '1997-01-01');

  -- Get Hanoi ID
  SELECT _id INTO hanoi_id FROM regions WHERE code = 'VN-HN';

  -- Level 4: Districts
  INSERT INTO regions (code, name, type, parent_id, "order", status, is_system, is_editable, metadata) VALUES
    ('VN-HN-BA', 'Ba Đình', 'DISTRICT', hanoi_id, 1, 1, true, true, 
     '{"district_type": "urban_district", "area": 9.22, "population": 250000}'),
    ('VN-HN-HK', 'Hoàn Kiếm', 'DISTRICT', hanoi_id, 2, 1, true, true, 
     '{"district_type": "urban_district", "area": 5.29, "population": 150000}'),
    ('VN-HN-DX', 'Đống Đa', 'DISTRICT', hanoi_id, 3, 1, true, true, 
     '{"district_type": "urban_district", "area": 9.96, "population": 400000}');

  -- Get Ba Dinh ID
  SELECT _id INTO ba_dinh_id FROM regions WHERE code = 'VN-HN-BA';

  -- Level 5: Communes
  INSERT INTO regions (code, name, type, parent_id, "order", status, is_system, is_editable, metadata) VALUES
    ('VN-HN-BA-PH', 'Phường Phúc Xá', 'COMMUNE', ba_dinh_id, 1, 1, false, true, 
     '{"commune_type": "ward", "area": 0.5, "population": 12000}'),
    ('VN-HN-BA-TT', 'Phường Trúc Bạch', 'COMMUNE', ba_dinh_id, 2, 1, false, true, 
     '{"commune_type": "ward", "area": 0.32, "population": 8000}'),
    ('VN-HN-BA-VT', 'Phường Vĩnh Phúc', 'COMMUNE', ba_dinh_id, 3, 1, false, true, 
     '{"commune_type": "ward", "area": 0.45, "population": 10000}');

END $$;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
  type,
  COUNT(*) as count
FROM regions
WHERE deleted_at IS NULL
GROUP BY type
ORDER BY 
  CASE type
    WHEN 'REGION' THEN 1
    WHEN 'NATION' THEN 2
    WHEN 'PROVINCE' THEN 3
    WHEN 'DISTRICT' THEN 4
    WHEN 'COMMUNE' THEN 5
  END;

COMMENT ON TABLE regions IS 'GLOBAL geographic regions - shared data accessible by all tenants (countries, provinces, districts)';

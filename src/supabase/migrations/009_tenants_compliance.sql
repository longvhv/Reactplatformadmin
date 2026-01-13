-- ============================================
-- Migration 009: Tenants Table - Full Compliance
-- Description: Update tenants table to 100% compliance with DATABASE_SCHEMA_STANDARD.md
-- Author: VHV Platform
-- Date: 2026-01-12
-- ============================================

-- ============================================
-- DROP OLD TABLE (if exists from migration 008)
-- ============================================
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================
-- CREATE TABLE (GLOBAL - NO tenant_id)
-- ============================================
-- NOTE: tenants is a GLOBAL TABLE (manages tenants themselves)
-- It does NOT have a tenant_id field as per DATABASE_SCHEMA_STANDARD.md
CREATE TABLE tenants (
  -- ============================================
  -- 1. IDENTITY (NO tenant_id for this table)
  -- ============================================
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ============================================
  -- 2. BUSINESS FIELDS
  -- ============================================
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Hierarchy
  parent_tenant_id UUID REFERENCES tenants(_id) ON DELETE RESTRICT,
  path TEXT,
  
  -- Classification
  tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
  status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
  
  -- Infrastructure
  data_region VARCHAR(50) NOT NULL DEFAULT 'ap-southeast-1',
  compliance_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
  
  -- Localization
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  
  -- Billing
  billing_type VARCHAR(20) NOT NULL DEFAULT 'POSTPAID',
  
  -- Dynamic data (JSONB)
  profile JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  
  -- ============================================
  -- 3. AUDIT TRAIL
  -- ============================================
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL,
  updated_by UUID NULL,
  
  -- ============================================
  -- 4. SOFT DELETE
  -- ============================================
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL,
  
  -- ============================================
  -- 5. OPTIMISTIC LOCKING
  -- ============================================
  version BIGINT NOT NULL DEFAULT 1,
  
  -- ============================================
  -- 6. CONSTRAINTS
  -- ============================================
  CONSTRAINT uq_tenants_code UNIQUE (code),
  CONSTRAINT chk_tenants_code_format CHECK (code ~ '^[a-z0-9-]+$'),
  CONSTRAINT chk_tenants_tier CHECK (tier IN (
    'FREE', 'PRO', 'ENTERPRISE',
    'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE',
    'PROVIDER'
  )),
  CONSTRAINT chk_tenants_status CHECK (status IN (
    'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'
  )),
  CONSTRAINT chk_tenants_region CHECK (data_region IN (
    'ap-southeast-1', 'us-east-1', 'eu-central-1'
  )),
  CONSTRAINT chk_tenants_compliance CHECK (compliance_level IN (
    'STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS'
  )),
  CONSTRAINT chk_tenants_billing CHECK (billing_type IN (
    'PREPAID', 'POSTPAID'
  )),
  CONSTRAINT chk_tenants_updated_at CHECK (updated_at >= created_at),
  CONSTRAINT chk_tenants_version CHECK (version >= 1)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
-- Mandatory indexes (NO tenant_id index - this IS the tenants table)
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at);

-- Business indexes
CREATE UNIQUE INDEX idx_tenants_code_active ON tenants(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_tier ON tenants(tier) WHERE deleted_at IS NULL;

-- Hierarchy indexes
CREATE INDEX idx_tenants_parent ON tenants(parent_tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_path ON tenants(path) WHERE deleted_at IS NULL;

-- JSONB indexes
CREATE INDEX idx_tenants_profile_gin ON tenants USING GIN (profile);
CREATE INDEX idx_tenants_settings_gin ON tenants USING GIN (settings);

-- Infrastructure indexes
CREATE INDEX idx_tenants_infra_stats ON tenants(data_region, tier, status) WHERE deleted_at IS NULL;

-- Audit indexes
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_created_by ON tenants(created_by);
CREATE INDEX idx_tenants_updated_by ON tenants(updated_by);
CREATE INDEX idx_tenants_deleted_by ON tenants(deleted_by) WHERE deleted_by IS NOT NULL;

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Trigger 1: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- Trigger 2: Auto-calculate materialized path
CREATE OR REPLACE FUNCTION calculate_tenant_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_tenant_id IS NULL THEN
    NEW.path := '/' || NEW._id::TEXT || '/';
  ELSE
    SELECT path INTO parent_path FROM tenants WHERE _id = NEW.parent_tenant_id;
    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Parent tenant not found: %', NEW.parent_tenant_id;
    END IF;
    NEW.path := parent_path || NEW._id::TEXT || '/';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_tenant_path
  BEFORE INSERT OR UPDATE OF parent_tenant_id ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION calculate_tenant_path();

-- Trigger 3: Increment version on update
CREATE OR REPLACE FUNCTION increment_tenant_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_tenant_version
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION increment_tenant_version();

-- ============================================
-- ADD COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE tenants IS 'GLOBAL TABLE: Multi-tenant management with hierarchical structure';
COMMENT ON COLUMN tenants._id IS 'Primary key (UUID)';
COMMENT ON COLUMN tenants.code IS 'Unique slug: lowercase, alphanumeric, hyphens only';
COMMENT ON COLUMN tenants.name IS 'Display name';
COMMENT ON COLUMN tenants.parent_tenant_id IS 'Parent tenant for hierarchy (NULL = root)';
COMMENT ON COLUMN tenants.path IS 'Materialized path for efficient hierarchy queries';
COMMENT ON COLUMN tenants.tier IS 'Subscription tier';
COMMENT ON COLUMN tenants.status IS 'Lifecycle status';
COMMENT ON COLUMN tenants.data_region IS 'AWS region for data storage';
COMMENT ON COLUMN tenants.compliance_level IS 'Regulatory compliance level';
COMMENT ON COLUMN tenants.timezone IS 'Default timezone';
COMMENT ON COLUMN tenants.billing_type IS 'Payment method';
COMMENT ON COLUMN tenants.profile IS 'JSONB: billing_email, phone, contact_person, etc.';
COMMENT ON COLUMN tenants.settings IS 'JSONB: max_users, max_storage, features, quotas';
COMMENT ON COLUMN tenants.created_at IS 'Timestamp: record creation';
COMMENT ON COLUMN tenants.updated_at IS 'Timestamp: last update (auto-managed)';
COMMENT ON COLUMN tenants.created_by IS 'User UUID who created this record';
COMMENT ON COLUMN tenants.updated_by IS 'User UUID who last updated this record';
COMMENT ON COLUMN tenants.deleted_at IS 'Soft delete timestamp (NULL = active)';
COMMENT ON COLUMN tenants.deleted_by IS 'User UUID who deleted this record';
COMMENT ON COLUMN tenants.version IS 'Optimistic locking version counter';

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
INSERT INTO tenants (
  code, 
  name, 
  tier, 
  status, 
  data_region, 
  compliance_level, 
  billing_type,
  timezone,
  profile, 
  settings
) VALUES
(
  'demo-corp',
  'Demo Corporation',
  'ENTERPRISE',
  'ACTIVE',
  'us-east-1',
  'STANDARD',
  'POSTPAID',
  'America/New_York',
  '{"billing_email": "billing@demo.com", "phone": "+1-555-0100", "contact_person": "John Doe"}'::jsonb,
  '{"max_users": 100, "max_storage": 500, "current_users": 0, "current_storage": 0, "mfa_enforced": true, "sso_enabled": true, "custom_branding": true, "api_access": true, "features": ["sso", "api_access", "priority_support"]}'::jsonb
),
(
  'startup-inc',
  'Startup Inc',
  'PRO',
  'ACTIVE',
  'ap-southeast-1',
  'STANDARD',
  'PREPAID',
  'Asia/Singapore',
  '{"billing_email": "billing@startup.com", "phone": "+65-1234-5678", "contact_person": "Jane Smith"}'::jsonb,
  '{"max_users": 20, "max_storage": 100, "current_users": 0, "current_storage": 0, "mfa_enforced": false, "sso_enabled": false, "custom_branding": false, "api_access": true, "features": ["api_access"]}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
  COUNT(*) as total_tenants,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_tenants,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_tenants
FROM tenants;

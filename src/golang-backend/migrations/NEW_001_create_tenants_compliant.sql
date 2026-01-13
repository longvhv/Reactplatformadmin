-- ============================================
-- Migration: Create Tenants Table (Go-Framework Compliant)
-- Description: Main tenant/organization table with FULL audit trail
-- Author: VHV Platform
-- Date: 2026-01-12
-- Version: 2.0.0 (PostgreSQL/YugabyteDB compatible)
-- ============================================

-- ============================================
-- CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  -- ============================================
  -- 1. IDENTITY (NO tenant_id - this is the SOURCE table)
  -- ============================================
  _id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ============================================
  -- 2. CORE BUSINESS FIELDS
  -- ============================================
  code                    VARCHAR(100) NOT NULL UNIQUE,
  name                    VARCHAR(255) NOT NULL,
  slug                    VARCHAR(100) NOT NULL UNIQUE,
  domain                  VARCHAR(255),
  
  -- ============================================
  -- 3. SUBSCRIPTION & BILLING
  -- ============================================
  subscription_tier       VARCHAR(20) NOT NULL DEFAULT 'free' 
                          CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date   TIMESTAMPTZ,
  billing_type            VARCHAR(20) DEFAULT 'POSTPAID' 
                          CHECK (billing_type IN ('PREPAID', 'POSTPAID')),
  
  -- ============================================
  -- 4. LIMITS & USAGE
  -- ============================================
  max_users               INT NOT NULL DEFAULT 10,
  current_users           INT NOT NULL DEFAULT 0,
  max_storage             INT NOT NULL DEFAULT 10,  -- GB
  current_storage         DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- GB
  max_api_calls_per_month BIGINT NOT NULL DEFAULT 10000,
  current_api_calls       BIGINT NOT NULL DEFAULT 0,
  max_projects            INT NOT NULL DEFAULT 5,
  current_projects        INT NOT NULL DEFAULT 0,
  
  -- ============================================
  -- 5. STATUS & COMPLIANCE
  -- ============================================
  status                  VARCHAR(20) NOT NULL DEFAULT 'trial' 
                          CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  compliance_level        VARCHAR(20) DEFAULT 'STANDARD' 
                          CHECK (compliance_level IN ('STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS')),
  data_region             VARCHAR(50) DEFAULT 'ap-southeast-1' 
                          CHECK (data_region IN ('ap-southeast-1', 'us-east-1', 'eu-central-1')),
  timezone                VARCHAR(50) DEFAULT 'UTC',
  
  -- ============================================
  -- 6. MULTI-TENANCY HIERARCHY
  -- ============================================
  parent_tenant_id        UUID NULL REFERENCES tenants(_id) ON DELETE SET NULL,
  path                    TEXT,  -- Materialized path (e.g., /parent/child/)
  
  -- ============================================
  -- 7. FLEXIBLE METADATA (JSONB)
  -- ============================================
  -- Profile: logo_url, website, tax_code, description, socials
  profile                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Settings: password_policy, mfa_enforced, ip_whitelist, session_policy, rate_limiting
  settings                JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata: other custom fields
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Active apps cache
  active_apps             TEXT[],
  
  -- ============================================
  -- 8. AUDIT TRAIL (COMPLETE)
  -- ============================================
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID NULL,  -- References users(_id) but no FK yet (users created later)
  updated_by              UUID NULL,
  
  -- ============================================
  -- 9. SOFT DELETE (COMPLETE)
  -- ============================================
  deleted_at              TIMESTAMPTZ NULL,
  deleted_by              UUID NULL,
  
  -- ============================================
  -- 10. OPTIMISTIC LOCKING
  -- ============================================
  version                 BIGINT NOT NULL DEFAULT 1,
  
  -- ============================================
  -- 11. CONSTRAINTS
  -- ============================================
  CHECK (updated_at >= created_at),
  CHECK (version >= 1),
  CHECK (current_users >= 0 AND current_users <= max_users),
  CHECK (current_storage >= 0 AND current_storage <= max_storage),
  CHECK (current_projects >= 0 AND current_projects <= max_projects),
  CHECK (current_api_calls >= 0)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
-- Business indexes
CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_tier ON tenants(subscription_tier);
CREATE INDEX idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX idx_tenants_data_region ON tenants(data_region);

-- Audit trail indexes
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_created_by ON tenants(created_by);
CREATE INDEX idx_tenants_updated_by ON tenants(updated_by);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at);
CREATE INDEX idx_tenants_deleted_by ON tenants(deleted_by);

-- JSONB indexes (GIN for fast JSONB queries)
CREATE INDEX idx_tenants_profile ON tenants USING gin(profile);
CREATE INDEX idx_tenants_settings ON tenants USING gin(settings);
CREATE INDEX idx_tenants_metadata ON tenants USING gin(metadata);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
-- Auto-update updated_at on any UPDATE
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

-- ============================================
-- ADD COMMENTS
-- ============================================
COMMENT ON TABLE tenants IS 'Main tenant/organization table for multi-tenant SaaS';
COMMENT ON COLUMN tenants._id IS 'Primary key (UUID v7 recommended)';
COMMENT ON COLUMN tenants.code IS 'Unique business code (e.g., tenant-001)';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly identifier (e.g., company-name)';
COMMENT ON COLUMN tenants.domain IS 'Custom domain (e.g., company.example.com)';
COMMENT ON COLUMN tenants.parent_tenant_id IS 'For hierarchical multi-tenancy (partners/resellers)';
COMMENT ON COLUMN tenants.path IS 'Materialized path for fast tree queries';
COMMENT ON COLUMN tenants.profile IS 'JSONB: {logo_url, website, tax_code, description, socials:{facebook, linkedin}}';
COMMENT ON COLUMN tenants.settings IS 'JSONB: {password_policy, mfa_enforced, ip_whitelist, session_policy, rate_limiting}';
COMMENT ON COLUMN tenants.version IS 'Optimistic locking version (increment on each update)';

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
-- System/Demo tenant
INSERT INTO tenants (
  _id,
  code,
  name,
  slug,
  subscription_tier,
  status,
  profile,
  settings
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'SYSTEM',
  'System Tenant',
  'system',
  'enterprise',
  'active',
  '{"description": "System tenant for global data"}'::jsonb,
  '{"mfa_enforced": false}'::jsonb
) ON CONFLICT (_id) DO NOTHING;

-- Demo tenant
INSERT INTO tenants (
  code,
  name,
  slug,
  subscription_tier,
  status,
  max_users,
  max_storage,
  max_projects,
  profile,
  settings
) VALUES (
  'DEMO-001',
  'Demo Company',
  'demo-company',
  'free',
  'trial',
  5,
  5,
  3,
  '{
    "logo_url": "https://via.placeholder.com/150",
    "website": "https://demo.example.com",
    "tax_code": "DEMO-TAX-001",
    "description": "This is a demo tenant for testing"
  }'::jsonb,
  '{
    "password_policy": {
      "min_length": 8,
      "require_special_char": true,
      "expiry_days": 90
    },
    "mfa_enforced": false,
    "session_policy": {
      "timeout_minutes": 30,
      "max_login_attempts": 5
    }
  }'::jsonb
) ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
  COUNT(*) as total_tenants,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'trial') as trial,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as not_deleted
FROM tenants;

-- Verify structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tenants'
  AND table_schema = 'public'
ORDER BY ordinal_position;

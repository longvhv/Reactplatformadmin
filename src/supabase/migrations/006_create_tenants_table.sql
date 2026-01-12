-- ============================================
-- Migration: Create Tenants Table
-- Description: Multi-tenant SaaS management
-- Author: VHV Platform
-- Date: 2026-01-09
-- ============================================

-- ============================================
-- CREATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  -- Identity (Note: tenants table IS the source of tenant_id, so it references itself conceptually)
  _id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields
  name                    VARCHAR(255) NOT NULL,
  slug                    VARCHAR(100) NOT NULL UNIQUE,
  domain                  VARCHAR(255),
  
  -- Status & subscription
  status                  VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  subscription_tier       VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subscription_end_date   DATE NOT NULL,
  
  -- Limits & usage
  max_users               INTEGER NOT NULL DEFAULT 3,
  current_users           INTEGER NOT NULL DEFAULT 0,
  max_storage_gb          INTEGER NOT NULL DEFAULT 10,
  current_storage_gb      INTEGER NOT NULL DEFAULT 0,
  
  -- Contact information
  billing_email           VARCHAR(255) NOT NULL,
  contact_person          VARCHAR(255) NOT NULL,
  phone                   VARCHAR(50) NOT NULL,
  address                 TEXT,
  logo_url                VARCHAR(500),
  
  -- Features & metadata
  features                JSONB DEFAULT '[]'::jsonb,
  settings                JSONB DEFAULT '{}'::jsonb,
  metadata                JSONB DEFAULT '{}'::jsonb,
  
  -- Business flags
  is_active               BOOLEAN DEFAULT true,
  is_trial                BOOLEAN DEFAULT true,
  has_custom_domain       BOOLEAN DEFAULT false,
  can_invite_users        BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  created_by              UUID NULL,
  updated_by              UUID NULL,
  
  -- Soft delete
  deleted_at              TIMESTAMPTZ NULL,
  deleted_by              UUID NULL,
  
  -- Optimistic locking
  version                 INT DEFAULT 1,
  
  -- Constraints
  CHECK (current_users >= 0),
  CHECK (max_users >= -1),  -- -1 = unlimited
  CHECK (current_storage_gb >= 0),
  CHECK (max_storage_gb >= 0),
  CHECK (subscription_end_date >= subscription_start_date)
);

-- ============================================
-- CREATE INDEXES
-- ============================================
-- Core indexes
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_subscription_tier ON tenants(subscription_tier);
CREATE INDEX idx_tenants_billing_email ON tenants(billing_email);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at);

-- Boolean filters
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_is_trial ON tenants(is_trial);

-- Composite indexes
CREATE INDEX idx_tenants_status_tier ON tenants(status, subscription_tier);
CREATE INDEX idx_tenants_subscription_dates ON tenants(subscription_start_date, subscription_end_date);
CREATE INDEX idx_tenants_active_status ON tenants(is_active, status);

-- JSONB indexes
CREATE INDEX idx_tenants_features ON tenants USING gin(features);
CREATE INDEX idx_tenants_settings ON tenants USING gin(settings);
CREATE INDEX idx_tenants_metadata ON tenants USING gin(metadata);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
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

-- Auto-update is_active based on status
CREATE OR REPLACE FUNCTION update_tenants_is_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active' AND NEW.deleted_at IS NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_is_active
BEFORE INSERT OR UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_tenants_is_active();

-- ============================================
-- ADD COMMENTS
-- ============================================
COMMENT ON TABLE tenants IS 'Multi-tenant SaaS customer/organization management';
COMMENT ON COLUMN tenants._id IS 'Primary key (UUID) - also used as tenant_id in other tables';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly unique identifier (e.g., acme-corp)';
COMMENT ON COLUMN tenants.status IS 'Tenant status: active, trial, suspended, cancelled';
COMMENT ON COLUMN tenants.subscription_tier IS 'Subscription plan: free, starter, professional, enterprise';
COMMENT ON COLUMN tenants.subscription_start_date IS 'Date when subscription started';
COMMENT ON COLUMN tenants.subscription_end_date IS 'Date when subscription ends/renews';
COMMENT ON COLUMN tenants.max_users IS 'Maximum allowed users (-1 = unlimited)';
COMMENT ON COLUMN tenants.max_storage_gb IS 'Maximum storage in GB';
COMMENT ON COLUMN tenants.features IS 'Array of enabled features (e.g., ["sso", "api_access"])';
COMMENT ON COLUMN tenants.settings IS 'Tenant-specific settings (branding, preferences, etc.)';
COMMENT ON COLUMN tenants.is_active IS 'Auto-computed: true if status = active AND not deleted';
COMMENT ON COLUMN tenants.is_trial IS 'Whether tenant is in trial period';
COMMENT ON COLUMN tenants.has_custom_domain IS 'Whether tenant has custom domain configured';
COMMENT ON COLUMN tenants.can_invite_users IS 'Whether tenant can invite new users';
COMMENT ON COLUMN tenants.version IS 'Optimistic locking version';

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
INSERT INTO tenants (
  name, slug, domain, status, subscription_tier,
  subscription_start_date, subscription_end_date,
  max_users, current_users, max_storage_gb, current_storage_gb,
  billing_email, contact_person, phone, address,
  is_trial, has_custom_domain,
  features, settings, metadata
) VALUES
  -- Enterprise tenant
  (
    'Acme Corporation', 'acme-corp', 'acme.example.com',
    'active', 'enterprise',
    '2024-01-01', '2024-12-31',
    -1, 78, 500, 342,
    'billing@acme.com', 'John Doe', '+1-555-0100',
    '123 Tech Street, San Francisco, CA 94105',
    false, true,
    '["sso", "api_access", "custom_domain", "priority_support", "advanced_analytics"]'::jsonb,
    '{"theme": "dark", "language": "en", "timezone": "America/Los_Angeles"}'::jsonb,
    '{"industry": "Technology", "company_size": "100-500", "country": "USA"}'::jsonb
  ),
  
  -- Professional tenant
  (
    'TechStart Inc', 'techstart', 'techstart.example.com',
    'active', 'professional',
    '2024-02-15', '2025-02-14',
    50, 32, 200, 145,
    'finance@techstart.io', 'Jane Smith', '+1-555-0200',
    NULL,
    false, true,
    '["api_access", "custom_branding", "analytics"]'::jsonb,
    '{"theme": "light", "language": "en", "timezone": "America/New_York"}'::jsonb,
    '{"industry": "Software", "company_size": "50-100", "country": "USA"}'::jsonb
  ),
  
  -- Trial tenant
  (
    'Digital Solutions', 'digital-solutions', NULL,
    'trial', 'starter',
    '2024-12-01', '2024-12-31',
    10, 5, 50, 12,
    'admin@digitalsol.com', 'Mike Johnson', '+44-20-1234-5678',
    NULL,
    true, false,
    '["basic_support"]'::jsonb,
    '{"theme": "light", "language": "en", "timezone": "Europe/London"}'::jsonb,
    '{"industry": "Consulting", "company_size": "10-50", "country": "UK"}'::jsonb
  ),
  
  -- Another enterprise tenant
  (
    'Global Retail Co', 'global-retail', 'retail.example.com',
    'active', 'enterprise',
    '2023-06-01', '2025-05-31',
    200, 156, 1000, 687,
    'billing@globalretail.com', 'Sarah Williams', '+1-555-0300',
    '456 Commerce Ave, Chicago, IL 60601',
    false, true,
    '["sso", "api_access", "custom_domain", "priority_support", "advanced_analytics", "white_label"]'::jsonb,
    '{"theme": "light", "language": "en", "timezone": "America/Chicago"}'::jsonb,
    '{"industry": "Retail", "company_size": "500+", "country": "USA"}'::jsonb
  ),
  
  -- Suspended tenant
  (
    'StartupHub', 'startuphub', NULL,
    'suspended', 'starter',
    '2024-09-01', '2024-12-01',
    10, 8, 50, 38,
    'info@startuphub.io', 'Tom Brown', '+1-555-0400',
    NULL,
    false, false,
    '["basic_support"]'::jsonb,
    '{"theme": "dark", "language": "en", "timezone": "America/Toronto"}'::jsonb,
    '{"industry": "Startup", "company_size": "1-10", "country": "Canada"}'::jsonb
  ),
  
  -- System tenant (for shared/global data)
  (
    'System', 'system', NULL,
    'active', 'enterprise',
    '2024-01-01', '2099-12-31',
    -1, 0, -1, 0,
    'system@vhvplatform.com', 'System Admin', '+84-123-456-789',
    NULL,
    false, false,
    '["all"]'::jsonb,
    '{}'::jsonb,
    '{"is_system_tenant": true}'::jsonb
  );

-- Update the _id of system tenant to be predictable
UPDATE tenants 
SET _id = '00000000-0000-0000-0000-000000000000', 
    version = version + 1
WHERE slug = 'system';

-- ============================================
-- VERIFY MIGRATION
-- ============================================
SELECT 
  status,
  subscription_tier,
  COUNT(*) as count,
  SUM(current_users) as total_users
FROM tenants
WHERE deleted_at IS NULL
GROUP BY status, subscription_tier
ORDER BY status, subscription_tier;

SELECT 
  is_active,
  is_trial,
  COUNT(*) as count
FROM tenants
WHERE deleted_at IS NULL
GROUP BY is_active, is_trial;

COMMENT ON TABLE tenants IS 'SaaS tenants table for multi-tenant platform management';

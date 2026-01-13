-- Migration 008: Create Tenants Table
-- Aligned with go-framework DatabaseCommand.md schema
-- Date: 2026-01-12

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    -- I. IDENTITY & INFRASTRUCTURE
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL,
    data_region VARCHAR(50) NOT NULL DEFAULT 'ap-southeast-1',
    compliance_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    parent_tenant_id UUID,
    path TEXT,
    
    -- II. BUSINESS INFORMATION & LOCALIZATION
    name TEXT NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
    billing_type VARCHAR(20) NOT NULL DEFAULT 'POSTPAID',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- III. DYNAMIC DATA (JSONB)
    profile JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    
    -- IV. STATUS & AUDIT TRAIL
    status VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_tenants_code UNIQUE (code),
    CONSTRAINT chk_tenants_code_fmt CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_tenants_tier CHECK (tier IN (
        'FREE', 'PRO', 'ENTERPRISE',
        'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE',
        'PROVIDER'
    )),
    CONSTRAINT chk_tenants_status CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED')),
    CONSTRAINT chk_tenants_region CHECK (data_region IN ('ap-southeast-1', 'us-east-1', 'eu-central-1')),
    CONSTRAINT chk_tenants_compliance CHECK (compliance_level IN ('STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS')),
    CONSTRAINT chk_tenants_billing CHECK (billing_type IN ('PREPAID', 'POSTPAID')),
    CONSTRAINT chk_tenants_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_tenants_version CHECK (version >= 1),
    CONSTRAINT fk_tenants_parent FOREIGN KEY (parent_tenant_id) REFERENCES tenants(_id)
);

-- INDEXES
CREATE UNIQUE INDEX idx_tenants_code_active ON tenants (code) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_path ON tenants (path ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_settings_gin ON tenants USING GIN (settings);
CREATE INDEX idx_tenants_profile_gin ON tenants USING GIN (profile);
CREATE INDEX idx_tenants_infra_stats ON tenants (data_region, tier, status);
CREATE INDEX idx_tenants_created_by ON tenants (created_by);
CREATE INDEX idx_tenants_updated_by ON tenants (updated_by);
CREATE INDEX idx_tenants_deleted_by ON tenants (deleted_by);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_tenants_updated_at();

-- Function to calculate materialized path
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
            RAISE EXCEPTION 'Parent tenant not found';
        END IF;
        NEW.path := parent_path || NEW._id::TEXT || '/';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for path calculation
CREATE TRIGGER trigger_calculate_tenant_path
    BEFORE INSERT OR UPDATE OF parent_tenant_id ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION calculate_tenant_path();

-- Comments for documentation
COMMENT ON TABLE tenants IS 'Multi-tenancy table with hierarchical structure';
COMMENT ON COLUMN tenants._id IS 'UUID primary key';
COMMENT ON COLUMN tenants.code IS 'Unique slug (lowercase, alphanumeric, hyphens)';
COMMENT ON COLUMN tenants.path IS 'Materialized path for hierarchy queries';
COMMENT ON COLUMN tenants.profile IS 'JSONB for flexible billing/contact info';
COMMENT ON COLUMN tenants.settings IS 'JSONB for quotas and feature flags';
COMMENT ON COLUMN tenants.version IS 'Optimistic locking version';

-- Insert sample data for testing
INSERT INTO tenants (code, name, tier, data_region, compliance_level, status, profile, settings) VALUES
('demo-corp', 'Demo Corporation', 'ENTERPRISE', 'us-east-1', 'STANDARD', 'ACTIVE',
 '{"billing_email": "billing@demo.com", "phone": "+1-555-0100", "contact_person": "John Doe"}',
 '{"max_users": 100, "max_storage": 500, "current_users": 0, "current_storage": 0, "mfa_enforced": true, "sso_enabled": true, "custom_branding": true, "api_access": true, "features": ["sso", "api_access", "priority_support"]}')
ON CONFLICT (code) DO NOTHING;

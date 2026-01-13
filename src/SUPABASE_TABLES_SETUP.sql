-- ============================================================================
-- SUPABASE TABLES SETUP
-- Instructions: Copy and paste this SQL into Supabase SQL Editor
-- ============================================================================
-- 
-- ⚠️ IMPORTANT: These tables are required for the Figma Make application to work
-- 
-- To create these tables:
-- 1. Go to your Supabase Project Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run" to execute
-- 
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: tenants
-- Multi-tenancy table with hierarchical structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
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

-- INDEXES for tenants
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_code_active ON public.tenants (code) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_path ON public.tenants (path ASC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_settings_gin ON public.tenants USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_tenants_profile_gin ON public.tenants USING GIN (profile);
CREATE INDEX IF NOT EXISTS idx_tenants_infra_stats ON public.tenants (data_region, tier, status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by ON public.tenants (created_by);
CREATE INDEX IF NOT EXISTS idx_tenants_updated_by ON public.tenants (updated_by);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_by ON public.tenants (deleted_by);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON public.tenants;
CREATE TRIGGER trigger_tenants_updated_at
    BEFORE UPDATE ON public.tenants
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
        SELECT path INTO parent_path FROM public.tenants WHERE _id = NEW.parent_tenant_id;
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent tenant not found';
        END IF;
        NEW.path := parent_path || NEW._id::TEXT || '/';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for path calculation
DROP TRIGGER IF EXISTS trigger_calculate_tenant_path ON public.tenants;
CREATE TRIGGER trigger_calculate_tenant_path
    BEFORE INSERT OR UPDATE OF parent_tenant_id ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION calculate_tenant_path();

-- Comments for documentation
COMMENT ON TABLE public.tenants IS 'Multi-tenancy table with hierarchical structure';
COMMENT ON COLUMN public.tenants._id IS 'UUID primary key';
COMMENT ON COLUMN public.tenants.code IS 'Unique slug (lowercase, alphanumeric, hyphens)';
COMMENT ON COLUMN public.tenants.path IS 'Materialized path for hierarchy queries';
COMMENT ON COLUMN public.tenants.profile IS 'JSONB for flexible billing/contact info';
COMMENT ON COLUMN public.tenants.settings IS 'JSONB for quotas and feature flags';
COMMENT ON COLUMN public.tenants.version IS 'Optimistic locking version';

-- ============================================================================
-- Table: users
-- User accounts with tenant association
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- II. PROFILE INFORMATION
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    phone VARCHAR(50),
    location VARCHAR(255),
    department VARCHAR(100),
    position VARCHAR(100),
    bio TEXT,
    
    -- III. ROLE & STATUS
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- IV. TENANT ASSOCIATION (GLOBAL table, tenant_id nullable for system admins)
    tenant_id UUID,
    
    -- V. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('SUPER_ADMIN', 'TENANT_ADMIN', 'USER', 'GUEST')),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    CONSTRAINT chk_users_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_users_version CHECK (version >= 1),
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(_id)
);

-- INDEXES for users
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON public.users (email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users (role, status);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON public.users (created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON public.users (updated_by);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON public.users (deleted_by);

-- Function to automatically update updated_at for users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.users IS 'User accounts with tenant association';
COMMENT ON COLUMN public.users._id IS 'UUID primary key';
COMMENT ON COLUMN public.users.email IS 'Unique email address';
COMMENT ON COLUMN public.users.tenant_id IS 'Associated tenant (NULL for system admins)';
COMMENT ON COLUMN public.users.version IS 'Optimistic locking version';

-- ============================================================================
-- Sample Data (Optional - comment out if not needed)
-- ============================================================================

-- Insert sample tenant
INSERT INTO public.tenants (code, name, tier, data_region, compliance_level, status, profile, settings) 
VALUES (
    'demo-corp', 
    'Demo Corporation', 
    'ENTERPRISE', 
    'ap-southeast-1', 
    'STANDARD', 
    'ACTIVE',
    '{"billing_email": "billing@demo.com", "phone": "+1-555-0100", "contact_person": "John Doe"}',
    '{"max_users": 100, "max_storage": 500, "current_users": 0, "current_storage": 0, "mfa_enforced": true, "sso_enabled": true, "custom_branding": true, "api_access": true, "features": ["sso", "api_access", "priority_support"]}'
)
ON CONFLICT (code) DO NOTHING;

-- Insert sample user (password is 'password123' hashed with SHA-256)
-- Note: In production, use bcrypt or argon2 instead of SHA-256
INSERT INTO public.users (email, password_hash, name, role, status, email_verified, tenant_id)
SELECT 
    'admin@demo.com',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- password123
    'Admin User',
    'TENANT_ADMIN',
    'ACTIVE',
    true,
    _id
FROM public.tenants 
WHERE code = 'demo-corp'
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Enable Row Level Security (RLS) - Optional but recommended
-- ============================================================================

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role
CREATE POLICY "Allow all for service role" ON public.tenants
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Allow read for authenticated users
CREATE POLICY "Allow read for authenticated" ON public.tenants
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role
CREATE POLICY "Allow all for service role on users" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Allow users to read their own data
CREATE POLICY "Allow users to read own data" ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = _id::TEXT::UUID AND deleted_at IS NULL);

-- ============================================================================
-- Verification Queries
-- Run these after setup to verify everything is working
-- ============================================================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users')
ORDER BY table_name;

-- Check tenants count
SELECT COUNT(*) as tenants_count FROM public.tenants WHERE deleted_at IS NULL;

-- Check users count
SELECT COUNT(*) as users_count FROM public.users WHERE deleted_at IS NULL;

-- Check sample data
SELECT _id, code, name, tier, status FROM public.tenants WHERE deleted_at IS NULL;
SELECT _id, email, name, role, status FROM public.users WHERE deleted_at IS NULL;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- Next steps:
-- 1. Verify the queries above return expected results
-- 2. Test your application - navigation should now work correctly
-- 3. Check the browser console for any remaining errors
-- 
-- If you need to drop tables and start over:
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.tenants CASCADE;
-- 
-- ============================================================================

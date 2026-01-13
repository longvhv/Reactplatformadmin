-- ============================================
-- DATABASE MIGRATIONS FOR AUTH-RELATED TABLES
-- ============================================
-- Tuân thủ go-framework standards:
-- - Khóa chính: _id (UUID)
-- - snake_case naming
-- - GLOBAL tables (không có tenant_id)
-- - Audit trail: created_at, updated_at, created_by, updated_by
-- - Soft delete: deleted_at, deleted_by
-- - Optimistic locking: version
-- ============================================

-- ============================================
-- TABLE 1: user_linked_identities (GLOBAL)
-- ============================================
-- Purpose: Store OAuth/Social login provider connections
-- Type: GLOBAL (no tenant_id - users can link identities regardless of tenant)

CREATE TABLE IF NOT EXISTS user_linked_identities (
    -- Primary Key
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Fields
    user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN (
        'GOOGLE', 'FACEBOOK', 'GITHUB', 'GITLAB', 'BITBUCKET',
        'LINKEDIN', 'TWITTER', 'MICROSOFT', 'APPLE', 'SLACK',
        'DISCORD', 'OKTA', 'AUTH0', 'SAML', 'LDAP', 'OTHER'
    )),
    provider_user_id VARCHAR(255) NOT NULL,
    provider_username VARCHAR(255),
    provider_email VARCHAR(255),
    provider_profile JSONB DEFAULT '{}'::jsonb,
    
    -- Display Info
    avatar_url TEXT,
    display_name VARCHAR(255),
    
    -- Status & Verification
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    
    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Trail (go-framework standard)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Soft Delete (go-framework standard)
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    
    -- Optimistic Locking (go-framework standard)
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT uk_user_provider UNIQUE (user_id, provider, deleted_at),
    CONSTRAINT uk_provider_user UNIQUE (provider, provider_user_id, deleted_at)
);

-- Indexes for user_linked_identities
CREATE INDEX IF NOT EXISTS idx_user_linked_identities_user_id ON user_linked_identities(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_linked_identities_provider ON user_linked_identities(provider) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_linked_identities_status ON user_linked_identities(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_linked_identities_is_primary ON user_linked_identities(is_primary) WHERE deleted_at IS NULL AND is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_linked_identities_last_used ON user_linked_identities(last_used_at DESC) WHERE deleted_at IS NULL;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_linked_identities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_linked_identities_updated_at
    BEFORE UPDATE ON user_linked_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_user_linked_identities_updated_at();

-- Comments
COMMENT ON TABLE user_linked_identities IS 'Store OAuth/Social login provider connections for users';
COMMENT ON COLUMN user_linked_identities._id IS 'Primary key (UUID)';
COMMENT ON COLUMN user_linked_identities.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_linked_identities.provider IS 'OAuth/Social provider type';
COMMENT ON COLUMN user_linked_identities.provider_user_id IS 'User ID from the provider';
COMMENT ON COLUMN user_linked_identities.is_primary IS 'Whether this is the primary identity for the user';
COMMENT ON COLUMN user_linked_identities.version IS 'Optimistic locking version';

-- ============================================
-- TABLE 2: user_mfa_methods (GLOBAL)
-- ============================================
-- Purpose: Store Multi-Factor Authentication methods for users
-- Type: GLOBAL (no tenant_id - MFA is user-level, not tenant-specific)

CREATE TABLE IF NOT EXISTS user_mfa_methods (
    -- Primary Key
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Fields
    user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN (
        'TOTP', 'SMS', 'EMAIL', 'WEBAUTHN', 'BACKUP_CODES',
        'PUSH_NOTIFICATION', 'BIOMETRIC', 'HARDWARE_TOKEN', 'OTHER'
    )),
    method_name VARCHAR(255),
    
    -- SMS Fields
    sms_phone_number VARCHAR(20),
    sms_phone_verified BOOLEAN DEFAULT false,
    
    -- Email Fields
    email_address VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    
    -- Status & Settings
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_enforced BOOLEAN NOT NULL DEFAULT false,
    
    -- Usage Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    
    -- Device Info
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    
    -- Backup Codes
    backup_codes_used INTEGER DEFAULT 0,
    backup_codes_total INTEGER DEFAULT 10,
    
    -- Encrypted Secrets (for TOTP, etc.)
    totp_secret_encrypted TEXT,
    totp_backup_codes_encrypted TEXT,
    backup_codes_encrypted TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Trail (go-framework standard)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Soft Delete (go-framework standard)
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    
    -- Optimistic Locking (go-framework standard)
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT chk_sms_phone CHECK (
        (method_type != 'SMS') OR (sms_phone_number IS NOT NULL)
    ),
    CONSTRAINT chk_email_address CHECK (
        (method_type != 'EMAIL') OR (email_address IS NOT NULL)
    )
);

-- Indexes for user_mfa_methods
CREATE INDEX IF NOT EXISTS idx_user_mfa_methods_user_id ON user_mfa_methods(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_mfa_methods_method_type ON user_mfa_methods(method_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_mfa_methods_status ON user_mfa_methods(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_mfa_methods_is_primary ON user_mfa_methods(is_primary) WHERE deleted_at IS NULL AND is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_mfa_methods_last_used ON user_mfa_methods(last_used_at DESC) WHERE deleted_at IS NULL;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_mfa_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_mfa_methods_updated_at
    BEFORE UPDATE ON user_mfa_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_user_mfa_methods_updated_at();

-- Comments
COMMENT ON TABLE user_mfa_methods IS 'Store Multi-Factor Authentication methods for users';
COMMENT ON COLUMN user_mfa_methods._id IS 'Primary key (UUID)';
COMMENT ON COLUMN user_mfa_methods.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_mfa_methods.method_type IS 'Type of MFA method (TOTP, SMS, EMAIL, WEBAUTHN, etc.)';
COMMENT ON COLUMN user_mfa_methods.is_primary IS 'Whether this is the primary MFA method';
COMMENT ON COLUMN user_mfa_methods.is_enforced IS 'Whether this MFA method is required for the user';
COMMENT ON COLUMN user_mfa_methods.version IS 'Optimistic locking version';

-- ============================================
-- TABLE 3: tenant_sso_configs (TENANT-SPECIFIC)
-- ============================================
-- Purpose: Store SSO configurations for tenants (SAML, OAuth2, OIDC)
-- Type: TENANT-SPECIFIC (has tenant_id - each tenant has its own SSO configs)

CREATE TABLE IF NOT EXISTS tenant_sso_configs (
    -- Primary Key
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant Relationship (TENANT-SPECIFIC)
    tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
    
    -- Core Fields
    provider VARCHAR(50) NOT NULL CHECK (provider IN (
        'SAML', 'OAUTH2', 'OIDC', 'LDAP', 'CAS', 'OTHER'
    )),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TESTING', 'DEPRECATED')),
    
    -- SAML Fields
    entity_id VARCHAR(500),
    sso_url TEXT,
    slo_url TEXT,
    certificate TEXT,
    metadata_url TEXT,
    
    -- OAuth2 / OIDC Fields
    client_id VARCHAR(255),
    client_secret TEXT,
    authorization_endpoint TEXT,
    token_endpoint TEXT,
    userinfo_endpoint TEXT,
    jwks_uri TEXT,
    
    -- Scopes & Mappings
    scopes JSONB DEFAULT '[]'::jsonb,
    attribute_mapping JSONB DEFAULT '{}'::jsonb,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Trail (go-framework standard)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Soft Delete (go-framework standard)
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    
    -- Optimistic Locking (go-framework standard)
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT uk_tenant_sso_name UNIQUE (tenant_id, name, deleted_at)
);

-- Indexes for tenant_sso_configs
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_tenant_id ON tenant_sso_configs(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_provider ON tenant_sso_configs(provider) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_status ON tenant_sso_configs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_created_at ON tenant_sso_configs(created_at DESC) WHERE deleted_at IS NULL;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_sso_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenant_sso_configs_updated_at
    BEFORE UPDATE ON tenant_sso_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_sso_configs_updated_at();

-- Comments
COMMENT ON TABLE tenant_sso_configs IS 'Store SSO configurations for tenants (SAML, OAuth2, OIDC)';
COMMENT ON COLUMN tenant_sso_configs._id IS 'Primary key (UUID)';
COMMENT ON COLUMN tenant_sso_configs.tenant_id IS 'Reference to tenants table (TENANT-SPECIFIC)';
COMMENT ON COLUMN tenant_sso_configs.provider IS 'SSO provider type (SAML, OAUTH2, OIDC, etc.)';
COMMENT ON COLUMN tenant_sso_configs.status IS 'Configuration status (ACTIVE, INACTIVE, TESTING, DEPRECATED)';
COMMENT ON COLUMN tenant_sso_configs.version IS 'Optimistic locking version';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant appropriate permissions to service role

GRANT ALL ON user_linked_identities TO service_role;
GRANT ALL ON user_mfa_methods TO service_role;
GRANT ALL ON tenant_sso_configs TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify tables were created successfully

-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_name IN ('user_linked_identities', 'user_mfa_methods', 'tenant_sso_configs');

-- SELECT * FROM user_linked_identities LIMIT 1;
-- SELECT * FROM user_mfa_methods LIMIT 1;
-- SELECT * FROM tenant_sso_configs LIMIT 1;

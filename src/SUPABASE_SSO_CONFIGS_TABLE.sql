-- ============================================
-- Tenant SSO Configurations Table
-- ============================================
-- Purpose: Store SSO (Single Sign-On) configurations for tenants
-- Supports: SAML 2.0, OAuth 2.0, OpenID Connect (OIDC)
-- Schema: Aligned with go-framework standards

CREATE TABLE IF NOT EXISTS tenant_sso_configs (
  -- Primary Key (UUID)
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  
  -- Provider Configuration
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('SAML', 'OAUTH2', 'OIDC')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'TESTING' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TESTING')),
  
  -- SAML-specific fields
  entity_id VARCHAR(500),           -- SAML Entity ID
  sso_url VARCHAR(500),             -- SAML SSO URL
  slo_url VARCHAR(500),             -- SAML Single Logout URL
  certificate TEXT,                  -- X.509 Certificate for SAML
  metadata_url VARCHAR(500),        -- SAML Metadata URL
  
  -- OAuth2/OIDC-specific fields
  client_id VARCHAR(255),           -- OAuth2/OIDC Client ID
  client_secret VARCHAR(500),       -- OAuth2/OIDC Client Secret (encrypted)
  authorization_endpoint VARCHAR(500), -- OAuth2/OIDC Authorization Endpoint
  token_endpoint VARCHAR(500),      -- OAuth2/OIDC Token Endpoint
  userinfo_endpoint VARCHAR(500),   -- OIDC UserInfo Endpoint
  jwks_uri VARCHAR(500),            -- OIDC JWKS URI
  scopes TEXT[],                    -- OAuth2/OIDC Scopes (array)
  
  -- Attribute Mapping (JSON)
  attribute_mapping JSONB DEFAULT '{}'::jsonb,
  
  -- Additional Settings (JSON)
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Audit Trail (go-framework standard)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Soft Delete (go-framework standard)
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  
  -- Optimistic Locking (go-framework standard)
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT tenant_sso_configs_name_tenant_unique UNIQUE (tenant_id, name, deleted_at)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index on tenant_id for filtering by tenant
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_tenant_id 
ON tenant_sso_configs(tenant_id) 
WHERE deleted_at IS NULL;

-- Index on provider for filtering by SSO provider type
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_provider 
ON tenant_sso_configs(provider) 
WHERE deleted_at IS NULL;

-- Index on status for filtering active/inactive configs
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_status 
ON tenant_sso_configs(status) 
WHERE deleted_at IS NULL;

-- Composite index for tenant + status queries
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_tenant_status 
ON tenant_sso_configs(tenant_id, status) 
WHERE deleted_at IS NULL;

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tenant_sso_configs_created_at 
ON tenant_sso_configs(created_at DESC) 
WHERE deleted_at IS NULL;

-- ============================================
-- Trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_tenant_sso_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_sso_configs_updated_at
BEFORE UPDATE ON tenant_sso_configs
FOR EACH ROW
EXECUTE FUNCTION update_tenant_sso_configs_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE tenant_sso_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY tenant_sso_configs_service_role_policy ON tenant_sso_configs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to read their tenant's configs
CREATE POLICY tenant_sso_configs_read_policy ON tenant_sso_configs
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM tenant_members 
    WHERE user_id = auth.uid() 
    AND deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

-- Policy: Allow tenant admins to manage configs
CREATE POLICY tenant_sso_configs_write_policy ON tenant_sso_configs
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM tenant_members 
    WHERE user_id = auth.uid() 
    AND role IN ('ADMIN', 'OWNER')
    AND deleted_at IS NULL
  )
  AND deleted_at IS NULL
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM tenant_members 
    WHERE user_id = auth.uid() 
    AND role IN ('ADMIN', 'OWNER')
    AND deleted_at IS NULL
  )
);

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE tenant_sso_configs IS 'SSO configurations for tenant authentication (SAML, OAuth2, OIDC)';
COMMENT ON COLUMN tenant_sso_configs._id IS 'Primary key (UUID)';
COMMENT ON COLUMN tenant_sso_configs.tenant_id IS 'Foreign key to tenants table';
COMMENT ON COLUMN tenant_sso_configs.provider IS 'SSO provider type: SAML, OAUTH2, or OIDC';
COMMENT ON COLUMN tenant_sso_configs.name IS 'Configuration name (unique per tenant)';
COMMENT ON COLUMN tenant_sso_configs.status IS 'Configuration status: ACTIVE, INACTIVE, or TESTING';
COMMENT ON COLUMN tenant_sso_configs.entity_id IS 'SAML Entity ID';
COMMENT ON COLUMN tenant_sso_configs.sso_url IS 'SAML SSO URL';
COMMENT ON COLUMN tenant_sso_configs.client_id IS 'OAuth2/OIDC Client ID';
COMMENT ON COLUMN tenant_sso_configs.client_secret IS 'OAuth2/OIDC Client Secret (should be encrypted)';
COMMENT ON COLUMN tenant_sso_configs.scopes IS 'OAuth2/OIDC scopes array';
COMMENT ON COLUMN tenant_sso_configs.attribute_mapping IS 'Map SSO attributes to user fields (JSON)';
COMMENT ON COLUMN tenant_sso_configs.settings IS 'Additional provider-specific settings (JSON)';
COMMENT ON COLUMN tenant_sso_configs.version IS 'Optimistic locking version';

-- ============================================
-- Demo/Seed Data (Optional)
-- ============================================

-- Example SAML configuration
INSERT INTO tenant_sso_configs (
  tenant_id,
  provider,
  name,
  description,
  status,
  entity_id,
  sso_url,
  slo_url,
  certificate,
  attribute_mapping,
  settings
) VALUES (
  (SELECT _id FROM tenants WHERE code = 'acme' LIMIT 1),
  'SAML',
  'Corporate SAML SSO',
  'SAML 2.0 integration with corporate identity provider',
  'ACTIVE',
  'https://acme.example.com/saml/metadata',
  'https://idp.acme.com/saml/sso',
  'https://idp.acme.com/saml/slo',
  '-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKuLMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
...
-----END CERTIFICATE-----',
  '{"email": "mail", "firstName": "givenName", "lastName": "sn", "displayName": "displayName"}'::jsonb,
  '{"signRequests": true, "encryptAssertions": false}'::jsonb
) ON CONFLICT DO NOTHING;

-- Example OAuth2 configuration
INSERT INTO tenant_sso_configs (
  tenant_id,
  provider,
  name,
  description,
  status,
  client_id,
  client_secret,
  authorization_endpoint,
  token_endpoint,
  scopes,
  attribute_mapping,
  settings
) VALUES (
  (SELECT _id FROM tenants WHERE code = 'globex' LIMIT 1),
  'OAUTH2',
  'Azure AD OAuth2',
  'OAuth 2.0 integration with Azure Active Directory',
  'ACTIVE',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'encrypted_secret_here',
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  ARRAY['openid', 'profile', 'email', 'User.Read'],
  '{"email": "mail", "firstName": "given_name", "lastName": "family_name"}'::jsonb,
  '{"tenant": "common", "prompt": "select_account"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Example OIDC configuration
INSERT INTO tenant_sso_configs (
  tenant_id,
  provider,
  name,
  description,
  status,
  client_id,
  client_secret,
  authorization_endpoint,
  token_endpoint,
  userinfo_endpoint,
  jwks_uri,
  scopes,
  attribute_mapping,
  settings
) VALUES (
  (SELECT _id FROM tenants WHERE code = 'initech' LIMIT 1),
  'OIDC',
  'Google OIDC',
  'OpenID Connect integration with Google',
  'TESTING',
  '123456789-abcdefghijklmnop.apps.googleusercontent.com',
  'encrypted_google_secret',
  'https://accounts.google.com/o/oauth2/v2/auth',
  'https://oauth2.googleapis.com/token',
  'https://openidconnect.googleapis.com/v1/userinfo',
  'https://www.googleapis.com/oauth2/v3/certs',
  ARRAY['openid', 'profile', 'email'],
  '{"email": "email", "firstName": "given_name", "lastName": "family_name", "avatar": "picture"}'::jsonb,
  '{"access_type": "offline", "include_granted_scopes": true}'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================
-- Grant Permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_sso_configs TO authenticated;
GRANT ALL ON tenant_sso_configs TO service_role;

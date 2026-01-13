-- ============================================================================
-- USER AUTHENTICATION METHODS TABLES FOR SUPABASE
-- ============================================================================
-- 
-- Instructions: Copy and paste this SQL into Supabase SQL Editor
-- 
-- Tables:
-- 1. user_linked_identities - Social login & identity providers
-- 2. user_mfa_methods - Multi-factor authentication methods
-- 
-- Classification: GLOBAL (no tenant_id)
-- 
-- ⚠️ IMPORTANT: Run this AFTER SUPABASE_TABLES_SETUP.sql
-- 
-- ============================================================================

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: user_linked_identities
-- Description: OAuth/Social login providers linked to user accounts
-- Classification: GLOBAL (no tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_linked_identities (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- II. PROVIDER INFORMATION
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_username VARCHAR(255),
    provider_email VARCHAR(255),
    
    -- III. AUTHENTICATION DATA
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    
    -- IV. PROFILE DATA FROM PROVIDER
    provider_profile JSONB DEFAULT '{}',
    avatar_url TEXT,
    display_name VARCHAR(255),
    
    -- V. STATUS & VERIFICATION
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    last_used_at TIMESTAMPTZ,
    
    -- VI. METADATA
    metadata JSONB DEFAULT '{}',
    
    -- VII. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_user_linked_identities_provider UNIQUE (user_id, provider, provider_user_id),
    CONSTRAINT chk_linked_identities_provider CHECK (provider IN (
        'GOOGLE', 'FACEBOOK', 'GITHUB', 'GITLAB', 'BITBUCKET', 
        'LINKEDIN', 'TWITTER', 'MICROSOFT', 'APPLE', 'SLACK',
        'DISCORD', 'OKTA', 'AUTH0', 'SAML', 'LDAP', 'OTHER'
    )),
    CONSTRAINT chk_linked_identities_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED')),
    CONSTRAINT chk_linked_identities_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_linked_identities_version CHECK (version >= 1),
    CONSTRAINT fk_linked_identities_user FOREIGN KEY (user_id) REFERENCES public.users(_id) ON DELETE CASCADE
);

-- INDEXES for user_linked_identities
CREATE INDEX IF NOT EXISTS idx_linked_identities_user_id ON public.user_linked_identities (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_linked_identities_provider ON public.user_linked_identities (provider);
CREATE INDEX IF NOT EXISTS idx_linked_identities_status ON public.user_linked_identities (status);
CREATE INDEX IF NOT EXISTS idx_linked_identities_is_primary ON public.user_linked_identities (is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_linked_identities_provider_email ON public.user_linked_identities (provider_email);
CREATE INDEX IF NOT EXISTS idx_linked_identities_last_used ON public.user_linked_identities (last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_linked_identities_profile_gin ON public.user_linked_identities USING GIN (provider_profile);
CREATE INDEX IF NOT EXISTS idx_linked_identities_metadata_gin ON public.user_linked_identities USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_linked_identities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_linked_identities_updated_at ON public.user_linked_identities;
CREATE TRIGGER trigger_linked_identities_updated_at
    BEFORE UPDATE ON public.user_linked_identities
    FOR EACH ROW
    EXECUTE FUNCTION update_linked_identities_updated_at();

-- Comments
COMMENT ON TABLE public.user_linked_identities IS 'OAuth and social login providers linked to user accounts';
COMMENT ON COLUMN public.user_linked_identities.provider IS 'Identity provider: GOOGLE, FACEBOOK, GITHUB, etc.';
COMMENT ON COLUMN public.user_linked_identities.provider_user_id IS 'User ID from the provider';
COMMENT ON COLUMN public.user_linked_identities.is_primary IS 'True if this is the primary login method';
COMMENT ON COLUMN public.user_linked_identities.provider_profile IS 'Full profile data from provider';

-- ============================================================================
-- Table: user_mfa_methods
-- Description: Multi-factor authentication methods for users
-- Classification: GLOBAL (no tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_mfa_methods (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- II. MFA METHOD INFORMATION
    method_type VARCHAR(50) NOT NULL,
    method_name VARCHAR(100),
    
    -- III. METHOD-SPECIFIC DATA
    -- For TOTP (Time-based One-Time Password)
    totp_secret_encrypted TEXT,
    totp_backup_codes_encrypted TEXT[],
    
    -- For SMS
    sms_phone_number VARCHAR(50),
    sms_phone_verified BOOLEAN DEFAULT false,
    
    -- For Email
    email_address VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    
    -- For Hardware Key (WebAuthn/FIDO2)
    webauthn_credential_id TEXT,
    webauthn_public_key TEXT,
    webauthn_counter BIGINT DEFAULT 0,
    
    -- For Backup Codes
    backup_codes_encrypted TEXT[],
    backup_codes_used INTEGER DEFAULT 0,
    backup_codes_total INTEGER DEFAULT 10,
    
    -- IV. STATUS & VERIFICATION
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_enforced BOOLEAN NOT NULL DEFAULT false,
    
    -- V. USAGE STATISTICS
    last_used_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- VI. DEVICE/CLIENT INFO
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    user_agent TEXT,
    
    -- VII. METADATA
    metadata JSONB DEFAULT '{}',
    
    -- VIII. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT chk_mfa_method_type CHECK (method_type IN (
        'TOTP', 'SMS', 'EMAIL', 'WEBAUTHN', 'BACKUP_CODES', 
        'PUSH_NOTIFICATION', 'BIOMETRIC', 'HARDWARE_TOKEN', 'OTHER'
    )),
    CONSTRAINT chk_mfa_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING')),
    CONSTRAINT chk_mfa_device_type CHECK (device_type IS NULL OR device_type IN (
        'MOBILE', 'DESKTOP', 'TABLET', 'HARDWARE_KEY', 'OTHER'
    )),
    CONSTRAINT chk_mfa_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_mfa_version CHECK (version >= 1),
    CONSTRAINT chk_mfa_backup_codes CHECK (backup_codes_used <= backup_codes_total),
    CONSTRAINT fk_mfa_user FOREIGN KEY (user_id) REFERENCES public.users(_id) ON DELETE CASCADE
);

-- INDEXES for user_mfa_methods
CREATE INDEX IF NOT EXISTS idx_mfa_methods_user_id ON public.user_mfa_methods (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mfa_methods_type ON public.user_mfa_methods (method_type);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_status ON public.user_mfa_methods (status);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_is_primary ON public.user_mfa_methods (is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_mfa_methods_is_verified ON public.user_mfa_methods (is_verified);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_last_used ON public.user_mfa_methods (last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_metadata_gin ON public.user_mfa_methods USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_mfa_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mfa_methods_updated_at ON public.user_mfa_methods;
CREATE TRIGGER trigger_mfa_methods_updated_at
    BEFORE UPDATE ON public.user_mfa_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_mfa_methods_updated_at();

-- Comments
COMMENT ON TABLE public.user_mfa_methods IS 'Multi-factor authentication methods for users';
COMMENT ON COLUMN public.user_mfa_methods.method_type IS 'MFA type: TOTP, SMS, EMAIL, WEBAUTHN, BACKUP_CODES, etc.';
COMMENT ON COLUMN public.user_mfa_methods.is_enforced IS 'True if this MFA method is required for login';
COMMENT ON COLUMN public.user_mfa_methods.totp_secret_encrypted IS 'Encrypted TOTP secret key';
COMMENT ON COLUMN public.user_mfa_methods.webauthn_credential_id IS 'WebAuthn credential ID for FIDO2/hardware keys';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_linked_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa_methods ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on user_linked_identities" ON public.user_linked_identities
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_mfa_methods" ON public.user_mfa_methods
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can view their own records
CREATE POLICY "Users can view own linked identities" ON public.user_linked_identities
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can view own MFA methods" ON public.user_mfa_methods
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

-- ============================================================================
-- Sample Data / Demo Data
-- ============================================================================

DO $$
DECLARE
    admin_user_id UUID;
    john_user_id UUID;
    jane_user_id UUID;
BEGIN
    -- Get demo users
    SELECT _id INTO admin_user_id FROM public.users WHERE email = 'admin@demo.corp' LIMIT 1;
    SELECT _id INTO john_user_id FROM public.users WHERE email = 'john.doe@demo.corp' LIMIT 1;
    SELECT _id INTO jane_user_id FROM public.users WHERE email = 'jane.smith@demo.corp' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        
        -- ====================================================================
        -- LINKED IDENTITIES
        -- ====================================================================
        
        -- Admin: Google + GitHub
        INSERT INTO public.user_linked_identities (
            user_id, provider, provider_user_id, provider_username, provider_email,
            provider_profile, avatar_url, display_name,
            status, is_verified, is_primary, last_used_at
        ) VALUES (
            admin_user_id,
            'GOOGLE',
            '117234567890123456789',
            NULL,
            'admin@demo.corp',
            jsonb_build_object(
                'name', 'Admin User',
                'given_name', 'Admin',
                'family_name', 'User',
                'locale', 'en'
            ),
            'https://lh3.googleusercontent.com/a/default-user',
            'Admin User',
            'ACTIVE',
            true,
            true,
            NOW() - INTERVAL '2 hours'
        ),
        (
            admin_user_id,
            'GITHUB',
            '12345678',
            'admin-demo',
            'admin@demo.corp',
            jsonb_build_object(
                'login', 'admin-demo',
                'name', 'Admin User',
                'company', 'Demo Corp',
                'location', 'San Francisco, CA',
                'bio', 'Platform Administrator'
            ),
            'https://avatars.githubusercontent.com/u/12345678',
            'admin-demo',
            'ACTIVE',
            true,
            false,
            NOW() - INTERVAL '1 day'
        );
        
    END IF;
    
    IF john_user_id IS NOT NULL THEN
        
        -- John: Google + Microsoft
        INSERT INTO public.user_linked_identities (
            user_id, provider, provider_user_id, provider_username, provider_email,
            provider_profile, avatar_url, display_name,
            status, is_verified, is_primary, last_used_at
        ) VALUES (
            john_user_id,
            'GOOGLE',
            '117987654321098765432',
            NULL,
            'john.doe@demo.corp',
            jsonb_build_object(
                'name', 'John Doe',
                'given_name', 'John',
                'family_name', 'Doe',
                'locale', 'en'
            ),
            'https://lh3.googleusercontent.com/a/default-user-2',
            'John Doe',
            'ACTIVE',
            true,
            true,
            NOW() - INTERVAL '30 minutes'
        ),
        (
            john_user_id,
            'MICROSOFT',
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'john.doe@demo.corp',
            'john.doe@demo.corp',
            jsonb_build_object(
                'displayName', 'John Doe',
                'givenName', 'John',
                'surname', 'Doe',
                'mail', 'john.doe@demo.corp',
                'jobTitle', 'Engineering Manager'
            ),
            NULL,
            'John Doe',
            'ACTIVE',
            true,
            false,
            NOW() - INTERVAL '3 days'
        );
        
    END IF;
    
    IF jane_user_id IS NOT NULL THEN
        
        -- Jane: Google only
        INSERT INTO public.user_linked_identities (
            user_id, provider, provider_user_id, provider_username, provider_email,
            provider_profile, avatar_url, display_name,
            status, is_verified, is_primary, last_used_at
        ) VALUES (
            jane_user_id,
            'GOOGLE',
            '117555666777888999000',
            NULL,
            'jane.smith@demo.corp',
            jsonb_build_object(
                'name', 'Jane Smith',
                'given_name', 'Jane',
                'family_name', 'Smith',
                'locale', 'en'
            ),
            'https://lh3.googleusercontent.com/a/default-user-3',
            'Jane Smith',
            'ACTIVE',
            true,
            true,
            NOW() - INTERVAL '1 hour'
        );
        
    END IF;
    
    -- ====================================================================
    -- MFA METHODS
    -- ====================================================================
    
    IF admin_user_id IS NOT NULL THEN
        
        -- Admin: TOTP + Backup Codes + WebAuthn
        INSERT INTO public.user_mfa_methods (
            user_id, method_type, method_name,
            totp_secret_encrypted,
            status, is_verified, is_primary, is_enforced,
            last_used_at, last_verified_at,
            success_count, failure_count,
            device_name, device_type
        ) VALUES (
            admin_user_id,
            'TOTP',
            'Google Authenticator',
            'ENCRYPTED_SECRET_BASE32_ABCDEFGH1234567890',
            'ACTIVE',
            true,
            true,
            true,
            NOW() - INTERVAL '1 hour',
            NOW() - INTERVAL '1 day',
            245,
            2,
            'iPhone 13 Pro',
            'MOBILE'
        ),
        (
            admin_user_id,
            'BACKUP_CODES',
            'Recovery Codes',
            NULL,
            'ACTIVE',
            true,
            false,
            false,
            NULL,
            NOW() - INTERVAL '30 days',
            0,
            0,
            NULL,
            NULL
        ),
        (
            admin_user_id,
            'WEBAUTHN',
            'YubiKey 5 NFC',
            NULL,
            'ACTIVE',
            true,
            false,
            false,
            NOW() - INTERVAL '12 hours',
            NOW() - INTERVAL '7 days',
            89,
            0,
            'YubiKey Serial 12345',
            'HARDWARE_KEY'
        );
        
        -- Set backup codes data
        UPDATE public.user_mfa_methods 
        SET 
            backup_codes_total = 10,
            backup_codes_used = 2
        WHERE user_id = admin_user_id AND method_type = 'BACKUP_CODES';
        
    END IF;
    
    IF john_user_id IS NOT NULL THEN
        
        -- John: TOTP + SMS
        INSERT INTO public.user_mfa_methods (
            user_id, method_type, method_name,
            totp_secret_encrypted,
            status, is_verified, is_primary, is_enforced,
            last_used_at, last_verified_at,
            success_count, failure_count,
            device_name, device_type
        ) VALUES (
            john_user_id,
            'TOTP',
            'Authy',
            'ENCRYPTED_SECRET_BASE32_ZYXWVU9876543210',
            'ACTIVE',
            true,
            true,
            true,
            NOW() - INTERVAL '30 minutes',
            NOW() - INTERVAL '2 days',
            156,
            1,
            'Android Pixel 7',
            'MOBILE'
        );
        
        INSERT INTO public.user_mfa_methods (
            user_id, method_type, method_name,
            sms_phone_number, sms_phone_verified,
            status, is_verified, is_primary, is_enforced,
            last_used_at, last_verified_at,
            success_count, failure_count
        ) VALUES (
            john_user_id,
            'SMS',
            'Mobile Phone',
            '+1 (555) 123-4567',
            true,
            'ACTIVE',
            true,
            false,
            false,
            NOW() - INTERVAL '5 days',
            NOW() - INTERVAL '10 days',
            42,
            0
        );
        
    END IF;
    
    IF jane_user_id IS NOT NULL THEN
        
        -- Jane: TOTP only
        INSERT INTO public.user_mfa_methods (
            user_id, method_type, method_name,
            totp_secret_encrypted,
            status, is_verified, is_primary, is_enforced,
            last_used_at, last_verified_at,
            success_count, failure_count,
            device_name, device_type
        ) VALUES (
            jane_user_id,
            'TOTP',
            '1Password',
            'ENCRYPTED_SECRET_BASE32_QWERTY1234567890',
            'ACTIVE',
            true,
            true,
            true,
            NOW() - INTERVAL '2 hours',
            NOW() - INTERVAL '3 days',
            203,
            3,
            'MacBook Pro',
            'DESKTOP'
        );
        
    END IF;
    
    RAISE NOTICE 'Demo authentication methods inserted successfully!';
    RAISE NOTICE 'Linked Identities: 5 records';
    RAISE NOTICE 'MFA Methods: 6 records';
    
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_linked_identities', 'user_mfa_methods');

-- Count linked identities
SELECT 
    provider,
    COUNT(*) as count,
    COUNT(CASE WHEN is_primary THEN 1 END) as primary_count
FROM public.user_linked_identities
WHERE deleted_at IS NULL
GROUP BY provider
ORDER BY count DESC;

-- Count MFA methods
SELECT 
    method_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_verified THEN 1 END) as verified_count,
    COUNT(CASE WHEN is_primary THEN 1 END) as primary_count
FROM public.user_mfa_methods
WHERE deleted_at IS NULL
GROUP BY method_type
ORDER BY count DESC;

-- View user auth summary
SELECT 
    u.name,
    u.email,
    COUNT(DISTINCT li._id) as linked_identities,
    COUNT(DISTINCT mfa._id) as mfa_methods,
    STRING_AGG(DISTINCT li.provider, ', ' ORDER BY li.provider) as providers,
    STRING_AGG(DISTINCT mfa.method_type, ', ' ORDER BY mfa.method_type) as mfa_types
FROM public.users u
LEFT JOIN public.user_linked_identities li ON u._id = li.user_id AND li.deleted_at IS NULL
LEFT JOIN public.user_mfa_methods mfa ON u._id = mfa.user_id AND mfa.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u._id, u.name, u.email
ORDER BY u.name;

-- View detailed linked identities
SELECT 
    u.name as user_name,
    li.provider,
    li.provider_email,
    li.display_name,
    li.is_primary,
    li.is_verified,
    li.status,
    li.last_used_at
FROM public.user_linked_identities li
JOIN public.users u ON li.user_id = u._id
WHERE li.deleted_at IS NULL
ORDER BY u.name, li.is_primary DESC, li.provider;

-- View detailed MFA methods
SELECT 
    u.name as user_name,
    mfa.method_type,
    mfa.method_name,
    mfa.is_primary,
    mfa.is_verified,
    mfa.is_enforced,
    mfa.status,
    mfa.success_count,
    mfa.failure_count,
    mfa.last_used_at
FROM public.user_mfa_methods mfa
JOIN public.users u ON mfa.user_id = u._id
WHERE mfa.deleted_at IS NULL
ORDER BY u.name, mfa.is_primary DESC, mfa.method_type;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- Summary:
-- - Table 'user_linked_identities' created with 5 demo records
--   * Admin: Google (primary) + GitHub
--   * John: Google (primary) + Microsoft
--   * Jane: Google (primary)
-- 
-- - Table 'user_mfa_methods' created with 6 demo records
--   * Admin: TOTP (primary) + Backup Codes + WebAuthn
--   * John: TOTP (primary) + SMS
--   * Jane: TOTP (primary)
-- 
-- Providers: GOOGLE, FACEBOOK, GITHUB, GITLAB, MICROSOFT, etc.
-- MFA Types: TOTP, SMS, EMAIL, WEBAUTHN, BACKUP_CODES, etc.
-- 
-- Next steps:
-- 1. Run verification queries above
-- 2. Create API endpoints
-- 3. Build UI components
-- 4. Test authentication flows
-- 
-- ============================================================================

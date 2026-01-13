-- ============================================
-- TABLE: user_sessions (GLOBAL)
-- ============================================
-- Purpose: Track user login sessions across devices
-- Type: GLOBAL (no tenant_id - sessions are user-level)

CREATE TABLE IF NOT EXISTS user_sessions (
    -- Primary Key
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Fields
    user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    
    -- Session Info
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    device_name VARCHAR(255),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    
    -- Location
    country VARCHAR(100),
    city VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Status & Timing
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'LOGGED_OUT')),
    is_current BOOLEAN DEFAULT false,
    login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    logout_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    login_method VARCHAR(50) CHECK (login_method IN ('PASSWORD', 'SSO', 'OAUTH', 'MFA', 'BIOMETRIC', 'API_KEY', 'OTHER')),
    mfa_verified BOOLEAN DEFAULT false,
    is_trusted_device BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    
    -- Optimistic Locking
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_at ON user_sessions(login_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_current ON user_sessions(is_current) WHERE deleted_at IS NULL AND is_current = true;

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_sessions_updated_at();

-- Comments
COMMENT ON TABLE user_sessions IS 'Track user login sessions across devices';
COMMENT ON COLUMN user_sessions._id IS 'Primary key (UUID)';
COMMENT ON COLUMN user_sessions.user_id IS 'Reference to users table';
COMMENT ON COLUMN user_sessions.session_token IS 'Unique session token';
COMMENT ON COLUMN user_sessions.is_current IS 'Whether this is the current active session';

-- Permissions
GRANT ALL ON user_sessions TO service_role;

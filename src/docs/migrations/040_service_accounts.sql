-- Migration: Service Accounts Management
-- Version: 1.0.0
-- Date: 2026-01-15
-- Description: OAuth2-style service accounts with client credentials for machine-to-machine authentication

-- ============================================================================
-- SCHEMA: public
-- ============================================================================

-- ============================================================================
-- TABLE: service_accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_accounts (
  -- Primary Key
  _id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL,
  member_id UUID NOT NULL,
  
  -- Account Information
  name TEXT NOT NULL,
  description TEXT NULL,
  
  -- OAuth2 Client Credentials
  client_id VARCHAR(64) NOT NULL,
  client_secret_hash TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Timestamps & Version
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version BIGINT NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT service_accounts_pkey PRIMARY KEY (_id),
  CONSTRAINT uq_service_account_client_id UNIQUE (client_id),
  CONSTRAINT fk_service_account_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants (_id) ON DELETE CASCADE,
  CONSTRAINT fk_service_account_member FOREIGN KEY (member_id) 
    REFERENCES tenant_members (_id),
  CONSTRAINT chk_service_account_name CHECK (length(name) > 0),
  CONSTRAINT chk_service_account_version CHECK (version >= 1)
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for tenant-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_service_accounts_tenant_id 
ON public.service_accounts(tenant_id);

-- Index for member-based queries
CREATE INDEX IF NOT EXISTS idx_service_accounts_member_id 
ON public.service_accounts(member_id);

-- Index for client_id lookup (authentication)
CREATE INDEX IF NOT EXISTS idx_service_accounts_client_id 
ON public.service_accounts(client_id);

-- Index for active status queries
CREATE INDEX IF NOT EXISTS idx_service_accounts_is_active 
ON public.service_accounts(is_active);

-- Composite index for tenant + active accounts
CREATE INDEX IF NOT EXISTS idx_service_accounts_tenant_active 
ON public.service_accounts(tenant_id, is_active) 
WHERE is_active = TRUE;

-- Index for updated_at (last access tracking)
CREATE INDEX IF NOT EXISTS idx_service_accounts_updated_at 
ON public.service_accounts(updated_at DESC);

-- Composite index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_service_accounts_tenant_member 
ON public.service_accounts(tenant_id, member_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.service_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY service_accounts_service_role_policy 
ON public.service_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to view service accounts of their tenants
CREATE POLICY service_accounts_tenant_read_policy 
ON public.service_accounts
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to create service accounts for their tenants
CREATE POLICY service_accounts_tenant_insert_policy 
ON public.service_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update service accounts of their tenants
CREATE POLICY service_accounts_tenant_update_policy 
ON public.service_accounts
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete service accounts of their tenants
CREATE POLICY service_accounts_tenant_delete_policy 
ON public.service_accounts
FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get service account statistics for a tenant
CREATE OR REPLACE FUNCTION public.get_service_account_stats(
  p_tenant_id UUID
)
RETURNS TABLE (
  total_accounts BIGINT,
  active_accounts BIGINT,
  inactive_accounts BIGINT,
  by_member JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_accounts,
    COUNT(*) FILTER (WHERE is_active = TRUE)::BIGINT AS active_accounts,
    COUNT(*) FILTER (WHERE is_active = FALSE)::BIGINT AS inactive_accounts,
    (
      SELECT jsonb_object_agg(member_id::TEXT, count)
      FROM (
        SELECT member_id, COUNT(*) AS count
        FROM public.service_accounts
        WHERE tenant_id = p_tenant_id
        GROUP BY member_id
      ) member_counts
    ) AS by_member
  FROM public.service_accounts
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OAuth2 client credentials
CREATE OR REPLACE FUNCTION public.verify_service_account_credentials(
  p_client_id VARCHAR(64),
  p_client_secret_hash TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  account_id UUID,
  tenant_id UUID,
  tenant_name VARCHAR(255),
  member_id UUID,
  account_name TEXT,
  is_active BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_account_record RECORD;
  v_tenant_record RECORD;
BEGIN
  -- Get service account record
  SELECT * INTO v_account_record
  FROM public.service_accounts
  WHERE client_id = p_client_id
    AND client_secret_hash = p_client_secret_hash;
  
  -- Account not found or credentials invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      NULL::UUID,
      NULL::UUID, 
      NULL::VARCHAR(255),
      NULL::UUID,
      NULL::TEXT,
      NULL::BOOLEAN,
      'Invalid client credentials'::TEXT;
    RETURN;
  END IF;
  
  -- Check if account is active
  IF NOT v_account_record.is_active THEN
    RETURN QUERY SELECT 
      FALSE,
      v_account_record._id,
      v_account_record.tenant_id,
      NULL::VARCHAR(255),
      v_account_record.member_id,
      v_account_record.name,
      v_account_record.is_active,
      'Service account is inactive'::TEXT;
    RETURN;
  END IF;
  
  -- Get tenant info
  SELECT name INTO v_tenant_record
  FROM public.tenants
  WHERE _id = v_account_record.tenant_id;
  
  -- Update updated_at (track last access)
  UPDATE public.service_accounts
  SET updated_at = NOW()
  WHERE _id = v_account_record._id;
  
  -- Return valid result
  RETURN QUERY SELECT 
    TRUE,
    v_account_record._id,
    v_account_record.tenant_id,
    v_tenant_record.name,
    v_account_record.member_id,
    v_account_record.name,
    v_account_record.is_active,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inactive service accounts
CREATE OR REPLACE FUNCTION public.get_inactive_service_accounts(
  p_days_inactive INTEGER DEFAULT 90
)
RETURNS TABLE (
  account_id UUID,
  tenant_id UUID,
  tenant_name VARCHAR(255),
  account_name TEXT,
  member_id UUID,
  last_updated TIMESTAMP WITH TIME ZONE,
  days_since_update INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa._id AS account_id,
    sa.tenant_id,
    t.name AS tenant_name,
    sa.name AS account_name,
    sa.member_id,
    sa.updated_at AS last_updated,
    EXTRACT(DAY FROM (NOW() - sa.updated_at))::INTEGER AS days_since_update
  FROM public.service_accounts sa
  JOIN public.tenants t ON t._id = sa.tenant_id
  WHERE sa.updated_at < NOW() - (p_days_inactive || ' days')::INTERVAL
    AND sa.is_active = TRUE
  ORDER BY sa.updated_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk activate service accounts
CREATE OR REPLACE FUNCTION public.bulk_activate_service_accounts(
  p_account_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.service_accounts
  SET 
    is_active = TRUE,
    updated_at = NOW(),
    version = version + 1
  WHERE _id = ANY(p_account_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk deactivate service accounts
CREATE OR REPLACE FUNCTION public.bulk_deactivate_service_accounts(
  p_account_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.service_accounts
  SET 
    is_active = FALSE,
    updated_at = NOW(),
    version = version + 1
  WHERE _id = ANY(p_account_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get service accounts by member
CREATE OR REPLACE FUNCTION public.get_service_accounts_by_member(
  p_member_id UUID
)
RETURNS TABLE (
  account_id UUID,
  tenant_id UUID,
  account_name TEXT,
  description TEXT,
  client_id VARCHAR(64),
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    _id AS account_id,
    service_accounts.tenant_id,
    name AS account_name,
    service_accounts.description,
    service_accounts.client_id,
    service_accounts.is_active,
    service_accounts.created_at,
    service_accounts.updated_at
  FROM public.service_accounts
  WHERE member_id = p_member_id
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to validate service account data
CREATE OR REPLACE FUNCTION public.service_account_before_insert_or_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate name
  IF length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Service account name cannot be empty';
  END IF;
  
  -- Validate version
  IF NEW.version < 1 THEN
    RAISE EXCEPTION 'Service account version must be >= 1';
  END IF;
  
  -- Validate client_id format and length
  IF length(NEW.client_id) > 64 THEN
    RAISE EXCEPTION 'Client ID cannot exceed 64 characters';
  END IF;
  
  IF NEW.client_id !~ '^sa_[a-f0-9]+$' THEN
    RAISE EXCEPTION 'Client ID must start with "sa_" and contain only lowercase hex characters';
  END IF;
  
  -- Validate client_secret_hash is not empty
  IF length(trim(NEW.client_secret_hash)) = 0 THEN
    RAISE EXCEPTION 'Client secret hash cannot be empty';
  END IF;
  
  -- Auto-update updated_at on UPDATE
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_account_before_insert_or_update_trigger
BEFORE INSERT OR UPDATE ON public.service_accounts
FOR EACH ROW
EXECUTE FUNCTION public.service_account_before_insert_or_update();

-- Trigger to log service account creation
CREATE OR REPLACE FUNCTION public.log_service_account_creation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Service account created: % (%) for tenant %', 
    NEW.name, NEW.client_id, NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_service_account_creation_trigger
AFTER INSERT ON public.service_accounts
FOR EACH ROW
EXECUTE FUNCTION public.log_service_account_creation();

-- Trigger to log service account deletion
CREATE OR REPLACE FUNCTION public.log_service_account_deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Service account deleted: % (%) for tenant %', 
    OLD.name, OLD.client_id, OLD.tenant_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_service_account_deletion_trigger
AFTER DELETE ON public.service_accounts
FOR EACH ROW
EXECUTE FUNCTION public.log_service_account_deletion();

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION public.log_service_account_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    RAISE NOTICE 'Service account % (%) status changed: % -> %', 
      NEW.name, NEW.client_id, OLD.is_active, NEW.is_active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_service_account_status_change_trigger
AFTER UPDATE ON public.service_accounts
FOR EACH ROW
EXECUTE FUNCTION public.log_service_account_status_change();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.service_accounts IS 'OAuth2-style service accounts for machine-to-machine authentication';
COMMENT ON COLUMN public.service_accounts._id IS 'Unique identifier for the service account';
COMMENT ON COLUMN public.service_accounts.tenant_id IS 'ID of the tenant that owns this service account';
COMMENT ON COLUMN public.service_accounts.member_id IS 'ID of the tenant member this account is associated with';
COMMENT ON COLUMN public.service_accounts.name IS 'Descriptive name for the service account';
COMMENT ON COLUMN public.service_accounts.description IS 'Optional detailed description';
COMMENT ON COLUMN public.service_accounts.client_id IS 'Unique OAuth2 client identifier (format: sa_[hex])';
COMMENT ON COLUMN public.service_accounts.client_secret_hash IS 'SHA-256 hash of the client secret';
COMMENT ON COLUMN public.service_accounts.is_active IS 'Whether the service account is active';
COMMENT ON COLUMN public.service_accounts.created_at IS 'Timestamp when account was created';
COMMENT ON COLUMN public.service_accounts.updated_at IS 'Timestamp when account was last updated/accessed';
COMMENT ON COLUMN public.service_accounts.version IS 'Version number for tracking changes';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_accounts TO authenticated;
GRANT ALL ON public.service_accounts TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.get_service_account_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_service_account_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inactive_service_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_activate_service_accounts TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_deactivate_service_accounts TO service_role;
GRANT EXECUTE ON FUNCTION public.get_service_accounts_by_member TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

/*
-- Insert sample service accounts for testing (replace UUIDs with actual values)
-- NOTE: These are example hashes, real secrets must be generated properly
INSERT INTO public.service_accounts 
  (tenant_id, member_id, name, description, client_id, client_secret_hash, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Production API Service',
    'Main service account for production API access',
    'sa_abc123def456789',
    'hash_placeholder_1',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Development Integration',
    'Service account for development environment',
    'sa_dev987654321',
    'hash_placeholder_2',
    TRUE
  );
*/

-- ============================================================================
-- VERIFICATION EXAMPLES
-- ============================================================================

/*
-- Example 1: Get service account statistics for a tenant
SELECT * FROM public.get_service_account_stats('00000000-0000-0000-0000-000000000001');

-- Example 2: Verify OAuth2 client credentials
SELECT * FROM public.verify_service_account_credentials(
  'sa_abc123def456789',
  'hash_placeholder_1'
);

-- Example 3: Get inactive service accounts (not accessed in 90 days)
SELECT * FROM public.get_inactive_service_accounts(90);

-- Example 4: Bulk activate service accounts
SELECT public.bulk_activate_service_accounts(
  ARRAY['account-uuid-1', 'account-uuid-2']::UUID[]
);

-- Example 5: Get service accounts by member
SELECT * FROM public.get_service_accounts_by_member('member-uuid');

-- Example 6: Find accounts by tenant
SELECT * FROM public.service_accounts WHERE tenant_id = 'tenant-uuid';

-- Example 7: Find active accounts
SELECT * FROM public.service_accounts WHERE is_active = TRUE;
*/

-- ============================================================================
-- MAINTENANCE TASKS
-- ============================================================================

-- Monitor inactive service accounts
-- SELECT * FROM public.get_inactive_service_accounts(90);

-- Deactivate stale accounts (not accessed in 180 days)
-- UPDATE public.service_accounts 
-- SET is_active = FALSE 
-- WHERE updated_at < NOW() - INTERVAL '180 days' AND is_active = TRUE;

-- ============================================================================
-- SECURITY BEST PRACTICES
-- ============================================================================

/*
1. Never store plain client secrets in database
2. Always hash secrets using SHA-256 or stronger
3. Show full credentials only once upon creation
4. Rotate credentials regularly (every 90-180 days recommended)
5. Monitor service account usage via updated_at
6. Deactivate unused accounts after 90 days
7. Use RLS to isolate tenant data
8. Implement rate limiting on OAuth2 endpoints
9. Log all credential verification attempts
10. Associate accounts with members for permission inheritance
11. Use is_active flag for soft deactivation (audit trail)
12. Implement token expiration in OAuth2 flow
*/

-- ============================================================================
-- OAUTH2 INTEGRATION NOTES
-- ============================================================================

/*
OAuth2 Client Credentials Flow:

1. Client sends POST request to /oauth/token:
   POST /oauth/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=client_credentials
   &client_id=sa_abc123def456789
   &client_secret=actual_secret_here

2. Server verifies credentials using verify_service_account_credentials()

3. If valid and active, server issues access token:
   {
     "access_token": "eyJhbGci...",
     "token_type": "Bearer",
     "expires_in": 3600,
     "scope": "inherited_from_member"
   }

4. Client uses access token in API requests:
   Authorization: Bearer eyJhbGci...

5. Server validates token and checks permissions from associated member

Benefits:
- Standard OAuth2 flow
- Machine-to-machine authentication
- No user intervention required
- Credentials can be rotated without code changes
- Permissions inherited from tenant member
- Can be activated/deactivated without deletion
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Service Accounts migration completed successfully';
  RAISE NOTICE 'Table: public.service_accounts';
  RAISE NOTICE 'Indexes: 7 created';
  RAISE NOTICE 'RLS Policies: 5 created';
  RAISE NOTICE 'Functions: 6 created';
  RAISE NOTICE 'Triggers: 4 created';
  RAISE NOTICE 'Constraints: 4 check constraints';
  RAISE NOTICE 'Security: SHA-256 hashing, OAuth2 client credentials';
  RAISE NOTICE 'Integration: OAuth2 client_credentials grant type';
END $$;

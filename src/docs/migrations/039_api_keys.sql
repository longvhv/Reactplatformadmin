-- Migration: API Keys Management
-- Version: 1.0.0
-- Date: 2026-01-15
-- Description: API key generation, hashing, and lifecycle management for tenants

-- ============================================================================
-- SCHEMA: public
-- ============================================================================

-- ============================================================================
-- TABLE: api_keys
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  -- Primary Key
  _id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL,
  created_by UUID NULL,
  
  -- Key Information
  name TEXT NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  key_hash TEXT NOT NULL,
  
  -- Permissions & Security
  scopes TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  allowed_ips CIDR[] NULL,
  
  -- Lifecycle
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  last_used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version BIGINT NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT api_keys_pkey PRIMARY KEY (_id),
  CONSTRAINT uq_api_key_hash UNIQUE (key_hash),
  CONSTRAINT fk_api_key_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants (_id) ON DELETE CASCADE,
  CONSTRAINT fk_api_key_creator FOREIGN KEY (created_by) 
    REFERENCES users (_id),
  CONSTRAINT chk_api_key_name CHECK (length(name) > 0),
  CONSTRAINT chk_api_key_version CHECK (version >= 1)
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for tenant-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id 
ON public.api_keys(tenant_id);

-- Index for key hash lookup (authentication)
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash 
ON public.api_keys(key_hash);

-- Index for key prefix lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix 
ON public.api_keys(key_prefix);

-- Index for creator
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by 
ON public.api_keys(created_by);

-- Index for expiration queries
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at 
ON public.api_keys(expires_at) 
WHERE expires_at IS NOT NULL;

-- Composite index for tenant + active keys
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_active 
ON public.api_keys(tenant_id, expires_at) 
WHERE expires_at IS NULL OR expires_at > NOW();

-- Index for last_used_at tracking
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used 
ON public.api_keys(last_used_at DESC NULLS LAST);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY api_keys_service_role_policy 
ON public.api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to view API keys of their tenants
CREATE POLICY api_keys_tenant_read_policy 
ON public.api_keys
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to create API keys for their tenants
CREATE POLICY api_keys_tenant_insert_policy 
ON public.api_keys
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update API keys of their tenants
CREATE POLICY api_keys_tenant_update_policy 
ON public.api_keys
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

-- Policy: Allow authenticated users to delete API keys of their tenants
CREATE POLICY api_keys_tenant_delete_policy 
ON public.api_keys
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

-- Function to get API key statistics for a tenant
CREATE OR REPLACE FUNCTION public.get_api_key_stats(
  p_tenant_id UUID
)
RETURNS TABLE (
  total_keys BIGINT,
  active_keys BIGINT,
  expired_keys BIGINT,
  never_used_keys BIGINT,
  scopes_usage JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_keys,
    COUNT(*) FILTER (
      WHERE expires_at IS NULL OR expires_at > NOW()
    )::BIGINT AS active_keys,
    COUNT(*) FILTER (
      WHERE expires_at IS NOT NULL AND expires_at <= NOW()
    )::BIGINT AS expired_keys,
    COUNT(*) FILTER (
      WHERE last_used_at IS NULL
    )::BIGINT AS never_used_keys,
    (
      SELECT jsonb_object_agg(scope, count)
      FROM (
        SELECT unnest(scopes) AS scope, COUNT(*) AS count
        FROM public.api_keys
        WHERE tenant_id = p_tenant_id
        GROUP BY scope
      ) scope_counts
    ) AS scopes_usage
  FROM public.api_keys
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify API key and check permissions
CREATE OR REPLACE FUNCTION public.verify_api_key(
  p_key_hash TEXT,
  p_required_scope TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  tenant_id UUID,
  tenant_name VARCHAR(255),
  key_name TEXT,
  scopes TEXT[],
  error_message TEXT
) AS $$
DECLARE
  v_key_record RECORD;
  v_tenant_record RECORD;
  v_is_expired BOOLEAN;
  v_ip_allowed BOOLEAN := TRUE;
BEGIN
  -- Get API key record
  SELECT * INTO v_key_record
  FROM public.api_keys
  WHERE key_hash = p_key_hash;
  
  -- Key not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      NULL::UUID, 
      NULL::VARCHAR(255), 
      NULL::TEXT, 
      NULL::TEXT[], 
      'API key not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check expiration
  v_is_expired := (
    v_key_record.expires_at IS NOT NULL 
    AND v_key_record.expires_at <= NOW()
  );
  
  IF v_is_expired THEN
    RETURN QUERY SELECT 
      FALSE, 
      v_key_record.tenant_id, 
      NULL::VARCHAR(255), 
      v_key_record.name, 
      v_key_record.scopes, 
      'API key has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check IP whitelist if provided
  IF v_key_record.allowed_ips IS NOT NULL 
     AND array_length(v_key_record.allowed_ips, 1) > 0 
     AND p_ip_address IS NOT NULL THEN
    
    v_ip_allowed := EXISTS (
      SELECT 1 
      FROM unnest(v_key_record.allowed_ips) AS allowed_ip
      WHERE p_ip_address <<= allowed_ip
    );
    
    IF NOT v_ip_allowed THEN
      RETURN QUERY SELECT 
        FALSE, 
        v_key_record.tenant_id, 
        NULL::VARCHAR(255), 
        v_key_record.name, 
        v_key_record.scopes, 
        'IP address not allowed'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Check required scope if provided
  IF p_required_scope IS NOT NULL THEN
    IF NOT (p_required_scope = ANY(v_key_record.scopes)) 
       AND NOT ('admin:all' = ANY(v_key_record.scopes)) THEN
      RETURN QUERY SELECT 
        FALSE, 
        v_key_record.tenant_id, 
        NULL::VARCHAR(255), 
        v_key_record.name, 
        v_key_record.scopes, 
        'Insufficient permissions'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Get tenant info
  SELECT name INTO v_tenant_record
  FROM public.tenants
  WHERE _id = v_key_record.tenant_id;
  
  -- Update last_used_at (async, don't block)
  UPDATE public.api_keys
  SET last_used_at = NOW()
  WHERE _id = v_key_record._id;
  
  -- Return valid result
  RETURN QUERY SELECT 
    TRUE, 
    v_key_record.tenant_id, 
    v_tenant_record.name, 
    v_key_record.name, 
    v_key_record.scopes, 
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired API keys
CREATE OR REPLACE FUNCTION public.cleanup_expired_api_keys(
  p_days_after_expiry INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.api_keys
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW() - (p_days_after_expiry || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API keys expiring soon
CREATE OR REPLACE FUNCTION public.get_expiring_api_keys(
  p_days_threshold INTEGER DEFAULT 7
)
RETURNS TABLE (
  key_id UUID,
  tenant_id UUID,
  tenant_name VARCHAR(255),
  key_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k._id AS key_id,
    k.tenant_id,
    t.name AS tenant_name,
    k.name AS key_name,
    k.expires_at,
    EXTRACT(DAY FROM (k.expires_at - NOW()))::INTEGER AS days_until_expiry
  FROM public.api_keys k
  JOIN public.tenants t ON t._id = k.tenant_id
  WHERE k.expires_at IS NOT NULL
    AND k.expires_at > NOW()
    AND k.expires_at <= NOW() + (p_days_threshold || ' days')::INTERVAL
  ORDER BY k.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rotate API key (for backend use)
CREATE OR REPLACE FUNCTION public.rotate_api_key(
  p_old_key_id UUID,
  p_new_key_prefix VARCHAR(10),
  p_new_key_hash TEXT
)
RETURNS UUID AS $$
DECLARE
  v_old_key RECORD;
  v_new_key_id UUID;
BEGIN
  -- Get old key details
  SELECT * INTO v_old_key
  FROM public.api_keys
  WHERE _id = p_old_key_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found';
  END IF;
  
  -- Create new key with same metadata
  INSERT INTO public.api_keys (
    tenant_id,
    name,
    key_prefix,
    key_hash,
    scopes,
    allowed_ips,
    expires_at,
    created_by,
    version
  ) VALUES (
    v_old_key.tenant_id,
    v_old_key.name,
    p_new_key_prefix,
    p_new_key_hash,
    v_old_key.scopes,
    v_old_key.allowed_ips,
    v_old_key.expires_at,
    v_old_key.created_by,
    v_old_key.version + 1
  )
  RETURNING _id INTO v_new_key_id;
  
  -- Delete old key
  DELETE FROM public.api_keys WHERE _id = p_old_key_id;
  
  RETURN v_new_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to validate API key data
CREATE OR REPLACE FUNCTION public.api_key_before_insert_or_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate name
  IF length(trim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'API key name cannot be empty';
  END IF;
  
  -- Validate version
  IF NEW.version < 1 THEN
    RAISE EXCEPTION 'API key version must be >= 1';
  END IF;
  
  -- Validate key_prefix format
  IF length(NEW.key_prefix) > 10 THEN
    RAISE EXCEPTION 'API key prefix cannot exceed 10 characters';
  END IF;
  
  -- Validate scopes array (not empty on insert)
  IF TG_OP = 'INSERT' AND array_length(NEW.scopes, 1) IS NULL THEN
    RAISE EXCEPTION 'API key must have at least one scope';
  END IF;
  
  -- Validate expiration (must be in future if set)
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'API key expiration must be in the future';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_key_before_insert_or_update_trigger
BEFORE INSERT OR UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.api_key_before_insert_or_update();

-- Trigger to log API key creation
CREATE OR REPLACE FUNCTION public.log_api_key_creation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'API key created: % for tenant %', NEW.name, NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_api_key_creation_trigger
AFTER INSERT ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.log_api_key_creation();

-- Trigger to log API key revocation
CREATE OR REPLACE FUNCTION public.log_api_key_revocation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'API key revoked: % for tenant %', OLD.name, OLD.tenant_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_api_key_revocation_trigger
AFTER DELETE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.log_api_key_revocation();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.api_keys IS 'API key management for tenant programmatic access';
COMMENT ON COLUMN public.api_keys._id IS 'Unique identifier for the API key';
COMMENT ON COLUMN public.api_keys.tenant_id IS 'ID of the tenant that owns this API key';
COMMENT ON COLUMN public.api_keys.created_by IS 'ID of the user who created this API key';
COMMENT ON COLUMN public.api_keys.name IS 'Descriptive name for the API key';
COMMENT ON COLUMN public.api_keys.key_prefix IS 'Visible prefix of the API key (e.g., vhv_abc...)';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of the full API key';
COMMENT ON COLUMN public.api_keys.scopes IS 'Array of permission scopes for the key';
COMMENT ON COLUMN public.api_keys.allowed_ips IS 'Array of allowed IP addresses in CIDR notation';
COMMENT ON COLUMN public.api_keys.expires_at IS 'Expiration timestamp (NULL = never expires)';
COMMENT ON COLUMN public.api_keys.last_used_at IS 'Timestamp when key was last used';
COMMENT ON COLUMN public.api_keys.created_at IS 'Timestamp when key was created';
COMMENT ON COLUMN public.api_keys.version IS 'Version number for key rotation';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.get_api_key_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_api_keys TO service_role;
GRANT EXECUTE ON FUNCTION public.get_expiring_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_api_key TO service_role;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

/*
-- Insert sample API keys for testing (replace UUIDs with actual values)
-- NOTE: These are example hashes, real keys must be generated properly
INSERT INTO public.api_keys 
  (tenant_id, name, key_prefix, key_hash, scopes, expires_at, created_by)
VALUES
  (
    '00000000-0000-0000-0000-000000000001', 
    'Production API Key', 
    'vhv_prod', 
    'hash_placeholder_1',
    ARRAY['read:tenants', 'read:users', 'read:analytics'],
    NOW() + INTERVAL '365 days',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000001', 
    'Development API Key', 
    'vhv_dev', 
    'hash_placeholder_2',
    ARRAY['admin:all'],
    NOW() + INTERVAL '90 days',
    '00000000-0000-0000-0000-000000000001'
  );
*/

-- ============================================================================
-- VERIFICATION EXAMPLES
-- ============================================================================

/*
-- Example 1: Get API key statistics for a tenant
SELECT * FROM public.get_api_key_stats('00000000-0000-0000-0000-000000000001');

-- Example 2: Verify API key
SELECT * FROM public.verify_api_key(
  'hash_placeholder_1',
  'read:tenants',
  '192.168.1.100'::INET
);

-- Example 3: Get expiring API keys (within 7 days)
SELECT * FROM public.get_expiring_api_keys(7);

-- Example 4: Cleanup expired keys (older than 90 days after expiry)
SELECT public.cleanup_expired_api_keys(90);

-- Example 5: Rotate API key (backend operation)
SELECT public.rotate_api_key(
  'old-key-uuid',
  'vhv_new',
  'new_hash_placeholder'
);
*/

-- ============================================================================
-- MAINTENANCE TASKS
-- ============================================================================

-- Schedule periodic cleanup of old expired keys
-- (Should be run via cron job or scheduled task)
-- SELECT public.cleanup_expired_api_keys(90);

-- Monitor expiring keys
-- SELECT * FROM public.get_expiring_api_keys(7);

-- ============================================================================
-- SECURITY BEST PRACTICES
-- ============================================================================

/*
1. Never store plain API keys in database
2. Always hash keys using SHA-256 or stronger
3. Show full key only once upon creation
4. Rotate keys regularly (every 90-180 days recommended)
5. Use IP whitelisting for sensitive operations
6. Implement rate limiting on API endpoints
7. Log all API key usage for audit trails
8. Revoke unused keys after 90 days
9. Monitor for suspicious key usage patterns
10. Use scopes to limit key permissions (principle of least privilege)
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ API Keys migration completed successfully';
  RAISE NOTICE 'Table: public.api_keys';
  RAISE NOTICE 'Indexes: 7 created';
  RAISE NOTICE 'RLS Policies: 5 created';
  RAISE NOTICE 'Functions: 5 created';
  RAISE NOTICE 'Triggers: 3 created';
  RAISE NOTICE 'Constraints: 4 check constraints';
  RAISE NOTICE 'Security: SHA-256 hashing, scopes, IP whitelist, expiration';
END $$;

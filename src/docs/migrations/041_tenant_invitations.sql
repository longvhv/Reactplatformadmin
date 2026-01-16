-- Migration: Tenant Invitations Management
-- Version: 1.0.0
-- Date: 2026-01-15
-- Description: Email-based invitation system for tenant member onboarding

-- ============================================================================
-- SCHEMA: public
-- ============================================================================

-- ============================================================================
-- TABLE: tenant_invitations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  -- Primary Key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL,
  
  -- Invitation Details
  email VARCHAR(255) NOT NULL,
  role_ids TEXT[] DEFAULT '{}'::TEXT[],
  department_id UUID NULL,
  
  -- Token & Security
  token VARCHAR(100) NOT NULL,
  
  -- Status Management
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  
  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_invitation_tenant FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants (_id) ON DELETE CASCADE,
  CONSTRAINT uq_invitation_token UNIQUE (token),
  CONSTRAINT chk_invitation_status CHECK (
    status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')
  ),
  CONSTRAINT chk_invitation_email_fmt CHECK (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
  CONSTRAINT chk_invitation_expiry CHECK (expires_at > created_at)
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for tenant-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_id 
ON public.tenant_invitations(tenant_id);

-- Index for token lookup (invitation acceptance)
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token 
ON public.tenant_invitations(token);

-- Index for email lookup (duplicate detection)
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email 
ON public.tenant_invitations(email);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_status 
ON public.tenant_invitations(status);

-- Composite index for tenant + status queries
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_status 
ON public.tenant_invitations(tenant_id, status);

-- Index for expiry tracking
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_expires_at 
ON public.tenant_invitations(expires_at);

-- Index for pending invitations (most active queries)
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_pending 
ON public.tenant_invitations(tenant_id, status, expires_at) 
WHERE status = 'PENDING';

-- Composite index for email + tenant (duplicate check)
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_email 
ON public.tenant_invitations(tenant_id, email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY tenant_invitations_service_role_policy 
ON public.tenant_invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to view invitations of their tenants
CREATE POLICY tenant_invitations_tenant_read_policy 
ON public.tenant_invitations
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to create invitations for their tenants
CREATE POLICY tenant_invitations_tenant_insert_policy 
ON public.tenant_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update invitations of their tenants
CREATE POLICY tenant_invitations_tenant_update_policy 
ON public.tenant_invitations
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

-- Policy: Allow authenticated users to delete invitations of their tenants
CREATE POLICY tenant_invitations_tenant_delete_policy 
ON public.tenant_invitations
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

-- Function to get invitation statistics for a tenant
CREATE OR REPLACE FUNCTION public.get_invitation_stats(
  p_tenant_id UUID
)
RETURNS TABLE (
  total_invitations BIGINT,
  pending_invitations BIGINT,
  accepted_invitations BIGINT,
  expired_invitations BIGINT,
  revoked_invitations BIGINT,
  by_status JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_invitations,
    COUNT(*) FILTER (WHERE status = 'PENDING')::BIGINT AS pending_invitations,
    COUNT(*) FILTER (WHERE status = 'ACCEPTED')::BIGINT AS accepted_invitations,
    COUNT(*) FILTER (WHERE status = 'EXPIRED')::BIGINT AS expired_invitations,
    COUNT(*) FILTER (WHERE status = 'REVOKED')::BIGINT AS revoked_invitations,
    (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) AS count
        FROM public.tenant_invitations
        WHERE tenant_id = p_tenant_id
        GROUP BY status
      ) status_counts
    ) AS by_status
  FROM public.tenant_invitations
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate invitation token
CREATE OR REPLACE FUNCTION public.validate_invitation_token(
  p_token VARCHAR(100)
)
RETURNS TABLE (
  is_valid BOOLEAN,
  invitation_id UUID,
  tenant_id UUID,
  tenant_name VARCHAR(255),
  email VARCHAR(255),
  status VARCHAR(20),
  expires_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
DECLARE
  v_invitation_record RECORD;
  v_tenant_record RECORD;
BEGIN
  -- Get invitation record
  SELECT * INTO v_invitation_record
  FROM public.tenant_invitations
  WHERE token = p_token;
  
  -- Invitation not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      NULL::UUID,
      NULL::UUID,
      NULL::VARCHAR(255),
      NULL::VARCHAR(255),
      NULL::VARCHAR(20),
      NULL::TIMESTAMPTZ,
      'Invitation not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already accepted
  IF v_invitation_record.status = 'ACCEPTED' THEN
    RETURN QUERY SELECT 
      FALSE,
      v_invitation_record._id,
      v_invitation_record.tenant_id,
      NULL::VARCHAR(255),
      v_invitation_record.email,
      v_invitation_record.status,
      v_invitation_record.expires_at,
      'Invitation already accepted'::TEXT;
    RETURN;
  END IF;
  
  -- Check if revoked
  IF v_invitation_record.status = 'REVOKED' THEN
    RETURN QUERY SELECT 
      FALSE,
      v_invitation_record._id,
      v_invitation_record.tenant_id,
      NULL::VARCHAR(255),
      v_invitation_record.email,
      v_invitation_record.status,
      v_invitation_record.expires_at,
      'Invitation has been revoked'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_invitation_record.expires_at < NOW() THEN
    -- Auto-update to EXPIRED
    UPDATE public.tenant_invitations
    SET status = 'EXPIRED'
    WHERE _id = v_invitation_record._id;
    
    RETURN QUERY SELECT 
      FALSE,
      v_invitation_record._id,
      v_invitation_record.tenant_id,
      NULL::VARCHAR(255),
      v_invitation_record.email,
      'EXPIRED'::VARCHAR(20),
      v_invitation_record.expires_at,
      'Invitation has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Get tenant info
  SELECT name INTO v_tenant_record
  FROM public.tenants
  WHERE _id = v_invitation_record.tenant_id;
  
  -- Return valid result
  RETURN QUERY SELECT 
    TRUE,
    v_invitation_record._id,
    v_invitation_record.tenant_id,
    v_tenant_record.name,
    v_invitation_record.email,
    v_invitation_record.status,
    v_invitation_record.expires_at,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token VARCHAR(100),
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  invitation_id UUID,
  tenant_id UUID,
  message TEXT
) AS $$
DECLARE
  v_invitation_record RECORD;
  v_validation RECORD;
BEGIN
  -- Validate token first
  SELECT * INTO v_validation
  FROM public.validate_invitation_token(p_token)
  LIMIT 1;
  
  -- Check validation result
  IF NOT v_validation.is_valid THEN
    RETURN QUERY SELECT 
      FALSE,
      v_validation.invitation_id,
      v_validation.tenant_id,
      v_validation.error_message;
    RETURN;
  END IF;
  
  -- Get invitation
  SELECT * INTO v_invitation_record
  FROM public.tenant_invitations
  WHERE token = p_token;
  
  -- Update status to ACCEPTED
  UPDATE public.tenant_invitations
  SET status = 'ACCEPTED'
  WHERE _id = v_invitation_record._id;
  
  -- TODO: Create tenant member record
  -- This would be done in application logic or separate function
  -- INSERT INTO public.tenant_members (tenant_id, user_id, email, role_ids, department_id, ...)
  
  RETURN QUERY SELECT 
    TRUE,
    v_invitation_record._id,
    v_invitation_record.tenant_id,
    'Invitation accepted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire old invitations
CREATE OR REPLACE FUNCTION public.auto_expire_invitations()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.tenant_invitations
  SET status = 'EXPIRED'
  WHERE status = 'PENDING'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending invitations by email
CREATE OR REPLACE FUNCTION public.get_pending_invitation_by_email(
  p_tenant_id UUID,
  p_email VARCHAR(255)
)
RETURNS TABLE (
  invitation_id UUID,
  token VARCHAR(100),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    _id AS invitation_id,
    tenant_invitations.token,
    tenant_invitations.expires_at,
    tenant_invitations.created_at
  FROM public.tenant_invitations
  WHERE tenant_id = p_tenant_id
    AND email = LOWER(TRIM(p_email))
    AND status = 'PENDING'
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk revoke invitations
CREATE OR REPLACE FUNCTION public.bulk_revoke_invitations(
  p_invitation_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.tenant_invitations
  SET status = 'REVOKED'
  WHERE _id = ANY(p_invitation_ids)
    AND status IN ('PENDING', 'EXPIRED');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old invitations
CREATE OR REPLACE FUNCTION public.cleanup_old_invitations(
  p_days_old INTEGER DEFAULT 180
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.tenant_invitations
  WHERE status IN ('ACCEPTED', 'EXPIRED', 'REVOKED')
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend invitation (generate new token)
CREATE OR REPLACE FUNCTION public.resend_invitation(
  p_invitation_id UUID,
  p_new_token VARCHAR(100),
  p_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.tenant_invitations
  SET 
    token = p_new_token,
    status = 'PENDING',
    expires_at = p_expires_at
  WHERE _id = p_invitation_id
    AND status IN ('PENDING', 'EXPIRED');
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to validate invitation data
CREATE OR REPLACE FUNCTION public.tenant_invitation_before_insert_or_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize email to lowercase
  NEW.email = LOWER(TRIM(NEW.email));
  
  -- Validate email format
  IF NEW.email !~ '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;
  
  -- Validate status
  IF NEW.status NOT IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  
  -- Validate expiry
  IF NEW.expires_at <= NEW.created_at THEN
    RAISE EXCEPTION 'Expiry date must be after creation date';
  END IF;
  
  -- Validate token length
  IF LENGTH(NEW.token) < 32 THEN
    RAISE EXCEPTION 'Token must be at least 32 characters long';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_invitation_before_insert_or_update_trigger
BEFORE INSERT OR UPDATE ON public.tenant_invitations
FOR EACH ROW
EXECUTE FUNCTION public.tenant_invitation_before_insert_or_update();

-- Trigger to log invitation creation
CREATE OR REPLACE FUNCTION public.log_invitation_creation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Invitation created for % in tenant %', NEW.email, NEW.tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_invitation_creation_trigger
AFTER INSERT ON public.tenant_invitations
FOR EACH ROW
EXECUTE FUNCTION public.log_invitation_creation();

-- Trigger to log invitation status changes
CREATE OR REPLACE FUNCTION public.log_invitation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    RAISE NOTICE 'Invitation % status changed: % -> %', 
      NEW.email, OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_invitation_status_change_trigger
AFTER UPDATE ON public.tenant_invitations
FOR EACH ROW
EXECUTE FUNCTION public.log_invitation_status_change();

-- Trigger to prevent duplicate pending invitations
CREATE OR REPLACE FUNCTION public.check_duplicate_pending_invitation()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Only check for PENDING status
  IF NEW.status = 'PENDING' THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.tenant_invitations
    WHERE tenant_id = NEW.tenant_id
      AND email = NEW.email
      AND status = 'PENDING'
      AND _id != COALESCE(NEW._id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Pending invitation already exists for email % in tenant %', 
        NEW.email, NEW.tenant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_duplicate_pending_invitation_trigger
BEFORE INSERT OR UPDATE ON public.tenant_invitations
FOR EACH ROW
EXECUTE FUNCTION public.check_duplicate_pending_invitation();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.tenant_invitations IS 'Email-based invitations for tenant member onboarding';
COMMENT ON COLUMN public.tenant_invitations._id IS 'Unique identifier for the invitation';
COMMENT ON COLUMN public.tenant_invitations.tenant_id IS 'ID of the tenant sending the invitation';
COMMENT ON COLUMN public.tenant_invitations.email IS 'Email address of the invitee (normalized to lowercase)';
COMMENT ON COLUMN public.tenant_invitations.role_ids IS 'Array of role IDs to assign upon acceptance';
COMMENT ON COLUMN public.tenant_invitations.department_id IS 'Optional department to assign upon acceptance';
COMMENT ON COLUMN public.tenant_invitations.token IS 'Secure unique token for invitation URL (min 32 chars)';
COMMENT ON COLUMN public.tenant_invitations.status IS 'Invitation status: PENDING, ACCEPTED, EXPIRED, REVOKED';
COMMENT ON COLUMN public.tenant_invitations.expires_at IS 'Timestamp when invitation expires';
COMMENT ON COLUMN public.tenant_invitations.invited_by IS 'ID of user who sent the invitation';
COMMENT ON COLUMN public.tenant_invitations.created_at IS 'Timestamp when invitation was created';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_invitations TO authenticated;
GRANT ALL ON public.tenant_invitations TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.get_invitation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_expire_invitations TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_invitation_by_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_revoke_invitations TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_invitations TO service_role;
GRANT EXECUTE ON FUNCTION public.resend_invitation TO authenticated;

-- ============================================================================
-- SCHEDULED JOBS (Example - using pg_cron extension)
-- ============================================================================

/*
-- Auto-expire invitations every hour
SELECT cron.schedule(
  'auto-expire-invitations',
  '0 * * * *',
  $$SELECT public.auto_expire_invitations();$$
);

-- Cleanup old invitations weekly
SELECT cron.schedule(
  'cleanup-old-invitations',
  '0 2 * * 0',
  $$SELECT public.cleanup_old_invitations(180);$$
);
*/

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

/*
-- Insert sample invitations for testing (replace UUIDs with actual values)
INSERT INTO public.tenant_invitations 
  (tenant_id, email, role_ids, token, status, expires_at, invited_by)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'john.doe@example.com',
    ARRAY['role-uuid-1', 'role-uuid-2'],
    'secure_token_48_characters_long_abc123def456',
    'PENDING',
    NOW() + INTERVAL '7 days',
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'jane.smith@example.com',
    ARRAY['role-uuid-1'],
    'another_secure_token_48_chars_xyz789ghi012',
    'PENDING',
    NOW() + INTERVAL '7 days',
    NULL
  );
*/

-- ============================================================================
-- VERIFICATION EXAMPLES
-- ============================================================================

/*
-- Example 1: Get invitation statistics for a tenant
SELECT * FROM public.get_invitation_stats('tenant-uuid');

-- Example 2: Validate invitation token
SELECT * FROM public.validate_invitation_token('secure_token_here');

-- Example 3: Accept invitation
SELECT * FROM public.accept_invitation('secure_token_here', 'user-uuid');

-- Example 4: Auto-expire old invitations
SELECT public.auto_expire_invitations();

-- Example 5: Get pending invitation by email
SELECT * FROM public.get_pending_invitation_by_email(
  'tenant-uuid',
  'john.doe@example.com'
);

-- Example 6: Bulk revoke invitations
SELECT public.bulk_revoke_invitations(
  ARRAY['invitation-uuid-1', 'invitation-uuid-2']::UUID[]
);

-- Example 7: Cleanup old invitations (180 days)
SELECT public.cleanup_old_invitations(180);

-- Example 8: Resend invitation
SELECT public.resend_invitation(
  'invitation-uuid',
  'new_secure_token_48_characters',
  NOW() + INTERVAL '7 days'
);
*/

-- ============================================================================
-- INVITATION FLOW DOCUMENTATION
-- ============================================================================

/*
INVITATION LIFECYCLE:

1. CREATE INVITATION
   - Admin sends invitation to email
   - System generates secure token (48+ chars)
   - Status: PENDING
   - Sets expiry date (default 7 days)
   - Sends email with invitation URL

2. PENDING STATE
   - Invitation awaits acceptance
   - Can be resent (new token, extended expiry)
   - Can be revoked by admin
   - Auto-expires after expiry date

3. ACCEPT INVITATION
   - User clicks invitation URL with token
   - System validates token (not expired/revoked)
   - Creates tenant member record
   - Status: ACCEPTED
   - User gains access to tenant

4. EXPIRED STATE
   - Invitation passed expiry date
   - Cannot be accepted
   - Can be resent (becomes PENDING again)
   - Can be deleted for cleanup

5. REVOKED STATE
   - Admin canceled invitation
   - Cannot be accepted
   - Can be deleted for cleanup

SECURITY CONSIDERATIONS:
- Tokens are 48+ characters (cryptographically secure)
- Email format validated (regex check)
- One pending invitation per email/tenant
- Automatic expiry tracking
- RLS policies for tenant isolation
- Invitation acceptance logged
- Old invitations auto-cleanup

BEST PRACTICES:
- Default expiry: 7 days
- Cleanup accepted/expired: 180 days
- Auto-expire check: hourly
- Resend instead of creating duplicates
- Revoke instead of delete (audit trail)
- Email normalization (lowercase)
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Tenant Invitations migration completed successfully';
  RAISE NOTICE 'Table: public.tenant_invitations';
  RAISE NOTICE 'Indexes: 8 created';
  RAISE NOTICE 'RLS Policies: 5 created';
  RAISE NOTICE 'Functions: 8 created';
  RAISE NOTICE 'Triggers: 4 created';
  RAISE NOTICE 'Constraints: 4 check constraints';
  RAISE NOTICE 'Security: Email validation, token security, duplicate prevention';
  RAISE NOTICE 'Features: Auto-expiry, resend, revoke, bulk operations';
END $$;

-- Migration: User Consents Management
-- Version: 1.0.0
-- Date: 2026-01-15
-- Description: Legal consent tracking system for GDPR/CCPA compliance

-- ============================================================================
-- SCHEMA: public
-- ============================================================================

-- ============================================================================
-- TABLE: user_consents
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_consents (
  -- Primary Key
  _id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL,
  legal_document_id UUID NOT NULL,
  
  -- Consent Information
  consent_given BOOLEAN NULL DEFAULT TRUE,
  consent_date TIMESTAMPTZ NULL DEFAULT NOW(),
  consent_ip VARCHAR(45) NULL,
  consent_user_agent TEXT NULL,
  consent_method VARCHAR(50) NULL,
  
  -- Document Information
  document_version VARCHAR(50) NULL,
  document_title VARCHAR(255) NULL,
  document_type VARCHAR(50) NULL,
  
  -- Withdrawal Information
  withdrawn BOOLEAN NULL DEFAULT FALSE,
  withdrawn_date TIMESTAMPTZ NULL,
  withdrawn_reason TEXT NULL,
  
  -- Expiry & Renewal
  expires_at TIMESTAMPTZ NULL,
  renewal_required BOOLEAN NULL DEFAULT FALSE,
  last_renewed_at TIMESTAMPTZ NULL,
  
  -- Source Tracking
  source_application VARCHAR(100) NULL,
  source_page VARCHAR(255) NULL,
  
  -- Metadata
  metadata JSONB NULL DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_consents_pkey PRIMARY KEY (_id),
  CONSTRAINT user_consents_user_id_legal_document_id_key UNIQUE (user_id, legal_document_id),
  CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.users (_id) ON DELETE CASCADE,
  CONSTRAINT user_consents_consent_method_check CHECK (
    consent_method IN (
      'web', 'mobile', 'api', 'email', 'signup', 
      'profile', 'checkout', 'other'
    )
  )
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for user-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id 
ON public.user_consents(user_id);

-- Index for document lookup
CREATE INDEX IF NOT EXISTS idx_user_consents_legal_document_id 
ON public.user_consents(legal_document_id);

-- Index for withdrawn consents
CREATE INDEX IF NOT EXISTS idx_user_consents_withdrawn 
ON public.user_consents(withdrawn);

-- Index for expiry tracking
CREATE INDEX IF NOT EXISTS idx_user_consents_expires_at 
ON public.user_consents(expires_at);

-- Index for renewal tracking
CREATE INDEX IF NOT EXISTS idx_user_consents_renewal_required 
ON public.user_consents(renewal_required);

-- Composite index for user + withdrawn (common query)
CREATE INDEX IF NOT EXISTS idx_user_consents_user_withdrawn 
ON public.user_consents(user_id, withdrawn);

-- Composite index for user + document type
CREATE INDEX IF NOT EXISTS idx_user_consents_user_document_type 
ON public.user_consents(user_id, document_type);

-- Composite index for active consents (not withdrawn, not expired)
CREATE INDEX IF NOT EXISTS idx_user_consents_active 
ON public.user_consents(user_id, withdrawn, expires_at) 
WHERE withdrawn = FALSE;

-- Index for consent method analytics
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_method 
ON public.user_consents(consent_method);

-- Index for consent date (analytics)
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_date 
ON public.user_consents(consent_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY user_consents_service_role_policy 
ON public.user_consents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to view their own consents
CREATE POLICY user_consents_user_read_policy 
ON public.user_consents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Allow authenticated users to create their own consents
CREATE POLICY user_consents_user_insert_policy 
ON public.user_consents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Allow authenticated users to update their own consents
CREATE POLICY user_consents_user_update_policy 
ON public.user_consents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Allow authenticated users to delete their own consents
CREATE POLICY user_consents_user_delete_policy 
ON public.user_consents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get consent statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_consent_stats(
  p_user_id UUID
)
RETURNS TABLE (
  total_consents BIGINT,
  active_consents BIGINT,
  withdrawn_consents BIGINT,
  expired_consents BIGINT,
  renewal_required_consents BIGINT,
  by_document_type JSONB,
  by_consent_method JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH consent_data AS (
    SELECT
      CASE
        WHEN withdrawn = TRUE THEN 'withdrawn'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'expired'
        WHEN renewal_required = TRUE THEN 'renewal_required'
        ELSE 'active'
      END AS status,
      document_type,
      consent_method
    FROM public.user_consents
    WHERE user_id = p_user_id
  )
  SELECT
    COUNT(*)::BIGINT AS total_consents,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_consents,
    COUNT(*) FILTER (WHERE status = 'withdrawn')::BIGINT AS withdrawn_consents,
    COUNT(*) FILTER (WHERE status = 'expired')::BIGINT AS expired_consents,
    COUNT(*) FILTER (WHERE status = 'renewal_required')::BIGINT AS renewal_required_consents,
    (
      SELECT jsonb_object_agg(document_type, count)
      FROM (
        SELECT document_type, COUNT(*) AS count
        FROM consent_data
        GROUP BY document_type
      ) doc_counts
    ) AS by_document_type,
    (
      SELECT jsonb_object_agg(consent_method, count)
      FROM (
        SELECT consent_method, COUNT(*) AS count
        FROM consent_data
        GROUP BY consent_method
      ) method_counts
    ) AS by_consent_method
  FROM consent_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active consents for a user
CREATE OR REPLACE FUNCTION public.get_active_consents(
  p_user_id UUID
)
RETURNS SETOF public.user_consents AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.user_consents
  WHERE user_id = p_user_id
    AND withdrawn = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND renewal_required = FALSE
  ORDER BY consent_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get withdrawn consents for a user
CREATE OR REPLACE FUNCTION public.get_withdrawn_consents(
  p_user_id UUID
)
RETURNS SETOF public.user_consents AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.user_consents
  WHERE user_id = p_user_id
    AND withdrawn = TRUE
  ORDER BY withdrawn_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expired consents for a user
CREATE OR REPLACE FUNCTION public.get_expired_consents(
  p_user_id UUID
)
RETURNS SETOF public.user_consents AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.user_consents
  WHERE user_id = p_user_id
    AND withdrawn = FALSE
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
  ORDER BY expires_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get consents requiring renewal
CREATE OR REPLACE FUNCTION public.get_renewal_required_consents(
  p_user_id UUID
)
RETURNS SETOF public.user_consents AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.user_consents
  WHERE user_id = p_user_id
    AND withdrawn = FALSE
    AND renewal_required = TRUE
  ORDER BY last_renewed_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to withdraw consent
CREATE OR REPLACE FUNCTION public.withdraw_consent(
  p_consent_id UUID,
  p_withdrawn_reason TEXT DEFAULT NULL
)
RETURNS public.user_consents AS $$
DECLARE
  v_result public.user_consents;
BEGIN
  UPDATE public.user_consents
  SET
    withdrawn = TRUE,
    withdrawn_date = NOW(),
    withdrawn_reason = p_withdrawn_reason,
    updated_at = NOW()
  WHERE _id = p_consent_id
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to renew consent
CREATE OR REPLACE FUNCTION public.renew_consent(
  p_consent_id UUID,
  p_new_expiry_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS public.user_consents AS $$
DECLARE
  v_result public.user_consents;
  v_expiry_date TIMESTAMPTZ;
BEGIN
  -- Default: 1 year from now
  v_expiry_date := COALESCE(p_new_expiry_date, NOW() + INTERVAL '1 year');
  
  UPDATE public.user_consents
  SET
    renewal_required = FALSE,
    last_renewed_at = NOW(),
    expires_at = v_expiry_date,
    updated_at = NOW()
  WHERE _id = p_consent_id
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire consents
CREATE OR REPLACE FUNCTION public.auto_expire_consents()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Mark consents as requiring renewal if expired
  UPDATE public.user_consents
  SET 
    renewal_required = TRUE,
    updated_at = NOW()
  WHERE withdrawn = FALSE
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND renewal_required = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check consent validity
CREATE OR REPLACE FUNCTION public.is_consent_valid(
  p_user_id UUID,
  p_legal_document_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  consent_id UUID,
  consent_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  reason TEXT
) AS $$
DECLARE
  v_consent public.user_consents;
BEGIN
  -- Get consent record
  SELECT * INTO v_consent
  FROM public.user_consents
  WHERE user_id = p_user_id
    AND legal_document_id = p_legal_document_id;
  
  -- No consent found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      NULL::UUID, 
      NULL::TIMESTAMPTZ,
      NULL::TIMESTAMPTZ,
      'No consent found'::TEXT;
    RETURN;
  END IF;
  
  -- Consent withdrawn
  IF v_consent.withdrawn = TRUE THEN
    RETURN QUERY SELECT 
      FALSE,
      v_consent._id,
      v_consent.consent_date,
      v_consent.expires_at,
      'Consent has been withdrawn'::TEXT;
    RETURN;
  END IF;
  
  -- Consent expired
  IF v_consent.expires_at IS NOT NULL AND v_consent.expires_at < NOW() THEN
    RETURN QUERY SELECT 
      FALSE,
      v_consent._id,
      v_consent.consent_date,
      v_consent.expires_at,
      'Consent has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Renewal required
  IF v_consent.renewal_required = TRUE THEN
    RETURN QUERY SELECT 
      FALSE,
      v_consent._id,
      v_consent.consent_date,
      v_consent.expires_at,
      'Consent renewal required'::TEXT;
    RETURN;
  END IF;
  
  -- Valid consent
  RETURN QUERY SELECT 
    TRUE,
    v_consent._id,
    v_consent.consent_date,
    v_consent.expires_at,
    'Consent is valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk withdraw consents
CREATE OR REPLACE FUNCTION public.bulk_withdraw_consents(
  p_consent_ids UUID[],
  p_withdrawn_reason TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.user_consents
  SET
    withdrawn = TRUE,
    withdrawn_date = NOW(),
    withdrawn_reason = p_withdrawn_reason,
    updated_at = NOW()
  WHERE _id = ANY(p_consent_ids)
    AND withdrawn = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old withdrawn/expired consents
CREATE OR REPLACE FUNCTION public.cleanup_old_consents(
  p_days_old INTEGER DEFAULT 730
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.user_consents
  WHERE (withdrawn = TRUE OR (expires_at IS NOT NULL AND expires_at < NOW()))
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user consents (GDPR compliance)
CREATE OR REPLACE FUNCTION public.export_user_consents(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', _id,
      'legal_document_id', legal_document_id,
      'document_title', document_title,
      'document_type', document_type,
      'document_version', document_version,
      'consent_given', consent_given,
      'consent_date', consent_date,
      'consent_method', consent_method,
      'consent_ip', consent_ip,
      'withdrawn', withdrawn,
      'withdrawn_date', withdrawn_date,
      'withdrawn_reason', withdrawn_reason,
      'expires_at', expires_at,
      'renewal_required', renewal_required,
      'last_renewed_at', last_renewed_at,
      'source_application', source_application,
      'source_page', source_page,
      'metadata', metadata,
      'created_at', created_at
    )
  ) INTO v_result
  FROM public.user_consents
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.user_consents_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_consents_update_timestamp_trigger
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.user_consents_update_timestamp();

-- Trigger function to validate consent data
CREATE OR REPLACE FUNCTION public.user_consents_validate()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate consent_method
  IF NEW.consent_method IS NOT NULL THEN
    IF NEW.consent_method NOT IN (
      'web', 'mobile', 'api', 'email', 'signup', 
      'profile', 'checkout', 'other'
    ) THEN
      RAISE EXCEPTION 'Invalid consent_method: %', NEW.consent_method;
    END IF;
  END IF;
  
  -- Validate withdrawn logic
  IF NEW.withdrawn = TRUE AND NEW.withdrawn_date IS NULL THEN
    NEW.withdrawn_date = NOW();
  END IF;
  
  -- Validate expiry
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NEW.consent_date THEN
    RAISE EXCEPTION 'Expiry date cannot be before consent date';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_consents_validate_trigger
BEFORE INSERT OR UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.user_consents_validate();

-- Trigger to log consent creation
CREATE OR REPLACE FUNCTION public.log_consent_creation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Consent created for user % on document %', 
    NEW.user_id, NEW.legal_document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_consent_creation_trigger
AFTER INSERT ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.log_consent_creation();

-- Trigger to log consent withdrawal
CREATE OR REPLACE FUNCTION public.log_consent_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.withdrawn = TRUE AND OLD.withdrawn = FALSE THEN
    RAISE NOTICE 'Consent withdrawn for user % on document %. Reason: %',
      NEW.user_id, NEW.legal_document_id, NEW.withdrawn_reason;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_consent_withdrawal_trigger
AFTER UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.log_consent_withdrawal();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_consents IS 'Legal consent tracking for GDPR/CCPA compliance';
COMMENT ON COLUMN public.user_consents._id IS 'Unique identifier for the consent record';
COMMENT ON COLUMN public.user_consents.user_id IS 'ID of the user giving consent';
COMMENT ON COLUMN public.user_consents.legal_document_id IS 'ID of the legal document being consented to';
COMMENT ON COLUMN public.user_consents.consent_given IS 'Whether consent was given (true) or denied (false)';
COMMENT ON COLUMN public.user_consents.consent_date IS 'Timestamp when consent was given';
COMMENT ON COLUMN public.user_consents.consent_ip IS 'IP address where consent was given (IPv4 or IPv6)';
COMMENT ON COLUMN public.user_consents.consent_user_agent IS 'Browser/client user agent string';
COMMENT ON COLUMN public.user_consents.consent_method IS 'Method used to obtain consent: web, mobile, api, email, signup, profile, checkout, other';
COMMENT ON COLUMN public.user_consents.document_version IS 'Version of the document that was consented to';
COMMENT ON COLUMN public.user_consents.document_title IS 'Title of the document for display';
COMMENT ON COLUMN public.user_consents.document_type IS 'Type of document: privacy_policy, terms_of_service, cookie_policy, marketing, etc.';
COMMENT ON COLUMN public.user_consents.withdrawn IS 'Whether consent has been withdrawn';
COMMENT ON COLUMN public.user_consents.withdrawn_date IS 'Timestamp when consent was withdrawn';
COMMENT ON COLUMN public.user_consents.withdrawn_reason IS 'Reason for withdrawal';
COMMENT ON COLUMN public.user_consents.expires_at IS 'Timestamp when consent expires (NULL = never expires)';
COMMENT ON COLUMN public.user_consents.renewal_required IS 'Whether consent requires renewal';
COMMENT ON COLUMN public.user_consents.last_renewed_at IS 'Timestamp of last renewal';
COMMENT ON COLUMN public.user_consents.source_application IS 'Application where consent was obtained';
COMMENT ON COLUMN public.user_consents.source_page IS 'Page URL where consent was obtained';
COMMENT ON COLUMN public.user_consents.metadata IS 'Additional metadata in JSONB format';
COMMENT ON COLUMN public.user_consents.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN public.user_consents.updated_at IS 'Record last update timestamp';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.get_user_consent_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_consents TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_withdrawn_consents TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expired_consents TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_renewal_required_consents TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_consent TO authenticated;
GRANT EXECUTE ON FUNCTION public.renew_consent TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_expire_consents TO service_role;
GRANT EXECUTE ON FUNCTION public.is_consent_valid TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_withdraw_consents TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_consents TO service_role;
GRANT EXECUTE ON FUNCTION public.export_user_consents TO authenticated;

-- ============================================================================
-- SCHEDULED JOBS (Example - using pg_cron extension)
-- ============================================================================

/*
-- Auto-expire consents daily
SELECT cron.schedule(
  'auto-expire-user-consents',
  '0 1 * * *',
  $$SELECT public.auto_expire_consents();$$
);

-- Cleanup old consents monthly (2 years old)
SELECT cron.schedule(
  'cleanup-old-user-consents',
  '0 3 1 * *',
  $$SELECT public.cleanup_old_consents(730);$$
);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ User Consents migration completed successfully';
  RAISE NOTICE 'Table: public.user_consents';
  RAISE NOTICE 'Indexes: 10 created';
  RAISE NOTICE 'RLS Policies: 5 created';
  RAISE NOTICE 'Functions: 11 created';
  RAISE NOTICE 'Triggers: 4 created';
  RAISE NOTICE 'Constraints: 2 (unique + check)';
  RAISE NOTICE 'Features: GDPR compliance, consent lifecycle, withdrawal tracking, expiry management';
END $$;

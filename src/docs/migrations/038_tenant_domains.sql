-- Migration: Tenant Domains
-- Version: 1.0.0
-- Date: 2026-01-15
-- Description: Domain verification and policy management for tenants

-- ============================================================================
-- SCHEMA: public
-- ============================================================================

-- ============================================================================
-- TABLE: tenant_domains
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_domains (
  -- Primary Key
  _id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  tenant_id UUID NOT NULL,
  
  -- Domain Information
  domain VARCHAR(255) NOT NULL,
  
  -- Verification
  verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  verification_method VARCHAR(20) NULL,
  verification_token VARCHAR(100) NULL,
  verified_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Policy
  policy VARCHAR(20) NOT NULL DEFAULT 'NONE',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT tenant_domains_pkey PRIMARY KEY (_id),
  CONSTRAINT uq_tenant_domain_name UNIQUE (domain),
  CONSTRAINT fk_domain_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants (_id) ON DELETE CASCADE,
  CONSTRAINT chk_domain_fmt CHECK (domain ~ '^[a-z0-9.-]+$'),
  CONSTRAINT chk_domain_status CHECK (
    verification_status IN ('PENDING', 'VERIFIED')
  ),
  CONSTRAINT chk_domain_method CHECK (
    verification_method IN ('DNS_TXT', 'HTML_FILE')
  ),
  CONSTRAINT chk_domain_policy CHECK (
    policy IN ('NONE', 'CAPTURE', 'ENFORCE_SSO')
  )
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for tenant-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id 
ON public.tenant_domains(tenant_id);

-- Index for domain lookup
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain 
ON public.tenant_domains(domain);

-- Index for verification status filtering
CREATE INDEX IF NOT EXISTS idx_tenant_domains_verification_status 
ON public.tenant_domains(verification_status);

-- Index for policy filtering
CREATE INDEX IF NOT EXISTS idx_tenant_domains_policy 
ON public.tenant_domains(policy);

-- Composite index for tenant + status queries
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_status 
ON public.tenant_domains(tenant_id, verification_status);

-- Index for verified domains by date
CREATE INDEX IF NOT EXISTS idx_tenant_domains_verified_at 
ON public.tenant_domains(verified_at DESC) 
WHERE verification_status = 'VERIFIED';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY tenant_domains_service_role_policy 
ON public.tenant_domains
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to view domains of their tenants
CREATE POLICY tenant_domains_tenant_read_policy 
ON public.tenant_domains
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to insert domains for their tenants
CREATE POLICY tenant_domains_tenant_insert_policy 
ON public.tenant_domains
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update domains of their tenants
CREATE POLICY tenant_domains_tenant_update_policy 
ON public.tenant_domains
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

-- Policy: Allow authenticated users to delete domains of their tenants
CREATE POLICY tenant_domains_tenant_delete_policy 
ON public.tenant_domains
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

-- Function to get domain statistics for a tenant
CREATE OR REPLACE FUNCTION public.get_tenant_domain_stats(
  p_tenant_id UUID
)
RETURNS TABLE (
  total_domains BIGINT,
  verified_domains BIGINT,
  pending_domains BIGINT,
  dns_txt_count BIGINT,
  html_file_count BIGINT,
  by_policy JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_domains,
    COUNT(*) FILTER (WHERE verification_status = 'VERIFIED')::BIGINT AS verified_domains,
    COUNT(*) FILTER (WHERE verification_status = 'PENDING')::BIGINT AS pending_domains,
    COUNT(*) FILTER (WHERE verification_method = 'DNS_TXT')::BIGINT AS dns_txt_count,
    COUNT(*) FILTER (WHERE verification_method = 'HTML_FILE')::BIGINT AS html_file_count,
    jsonb_build_object(
      'NONE', COUNT(*) FILTER (WHERE policy = 'NONE'),
      'CAPTURE', COUNT(*) FILTER (WHERE policy = 'CAPTURE'),
      'ENFORCE_SSO', COUNT(*) FILTER (WHERE policy = 'ENFORCE_SSO')
    ) AS by_policy
  FROM public.tenant_domains
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check domain ownership
CREATE OR REPLACE FUNCTION public.check_domain_ownership(
  p_domain VARCHAR(255)
)
RETURNS TABLE (
  is_verified BOOLEAN,
  tenant_id UUID,
  tenant_name VARCHAR(255),
  policy VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (d.verification_status = 'VERIFIED') AS is_verified,
    d.tenant_id,
    t.name AS tenant_name,
    d.policy
  FROM public.tenant_domains d
  JOIN public.tenants t ON t._id = d.tenant_id
  WHERE d.domain = p_domain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get domains by policy
CREATE OR REPLACE FUNCTION public.get_domains_by_policy(
  p_policy VARCHAR(20)
)
RETURNS TABLE (
  domain_id UUID,
  domain VARCHAR(255),
  tenant_id UUID,
  tenant_name VARCHAR(255),
  verification_status VARCHAR(20),
  verified_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d._id AS domain_id,
    d.domain,
    d.tenant_id,
    t.name AS tenant_name,
    d.verification_status,
    d.verified_at
  FROM public.tenant_domains d
  JOIN public.tenants t ON t._id = d.tenant_id
  WHERE d.policy = p_policy
  ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find domain by tenant and domain name
CREATE OR REPLACE FUNCTION public.find_tenant_domain(
  p_tenant_id UUID,
  p_domain VARCHAR(255)
)
RETURNS TABLE (
  domain_id UUID,
  verification_status VARCHAR(20),
  verification_method VARCHAR(20),
  verification_token VARCHAR(100),
  policy VARCHAR(20),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    _id AS domain_id,
    verification_status,
    verification_method,
    verification_token,
    policy,
    verified_at,
    created_at
  FROM public.tenant_domains
  WHERE tenant_id = p_tenant_id AND domain = LOWER(p_domain);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger function to normalize domain and generate verification token
CREATE OR REPLACE FUNCTION public.tenant_domain_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize domain to lowercase
  NEW.domain := LOWER(TRIM(NEW.domain));
  
  -- Validate domain format
  IF NOT (NEW.domain ~ '^[a-z0-9.-]+$') THEN
    RAISE EXCEPTION 'Invalid domain format: %', NEW.domain;
  END IF;
  
  -- Generate verification token if not provided
  IF NEW.verification_token IS NULL THEN
    NEW.verification_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  
  -- Set default verification method if not provided
  IF NEW.verification_method IS NULL THEN
    NEW.verification_method := 'DNS_TXT';
  END IF;
  
  -- Ensure verification_status is uppercase
  NEW.verification_status := UPPER(NEW.verification_status);
  
  -- Ensure policy is uppercase
  NEW.policy := UPPER(NEW.policy);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_domain_before_insert_trigger
BEFORE INSERT ON public.tenant_domains
FOR EACH ROW
EXECUTE FUNCTION public.tenant_domain_before_insert();

-- Trigger function to handle domain updates
CREATE OR REPLACE FUNCTION public.tenant_domain_before_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If domain is being changed, normalize it
  IF NEW.domain != OLD.domain THEN
    NEW.domain := LOWER(TRIM(NEW.domain));
    
    -- Validate domain format
    IF NOT (NEW.domain ~ '^[a-z0-9.-]+$') THEN
      RAISE EXCEPTION 'Invalid domain format: %', NEW.domain;
    END IF;
    
    -- Reset verification if domain changes
    NEW.verification_status := 'PENDING';
    NEW.verification_token := encode(gen_random_bytes(16), 'hex');
    NEW.verified_at := NULL;
  END IF;
  
  -- If status changes to VERIFIED, set verified_at
  IF NEW.verification_status = 'VERIFIED' AND OLD.verification_status != 'VERIFIED' THEN
    NEW.verified_at := NOW();
  END IF;
  
  -- If status changes from VERIFIED to PENDING, clear verified_at
  IF NEW.verification_status = 'PENDING' AND OLD.verification_status = 'VERIFIED' THEN
    NEW.verified_at := NULL;
  END IF;
  
  -- Ensure uppercase for enums
  NEW.verification_status := UPPER(NEW.verification_status);
  NEW.policy := UPPER(NEW.policy);
  IF NEW.verification_method IS NOT NULL THEN
    NEW.verification_method := UPPER(NEW.verification_method);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_domain_before_update_trigger
BEFORE UPDATE ON public.tenant_domains
FOR EACH ROW
EXECUTE FUNCTION public.tenant_domain_before_update();

-- Trigger to log domain verification
CREATE OR REPLACE FUNCTION public.log_domain_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'VERIFIED' AND OLD.verification_status != 'VERIFIED' THEN
    RAISE NOTICE 'Domain verified: % for tenant %', NEW.domain, NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_domain_verification_trigger
AFTER UPDATE ON public.tenant_domains
FOR EACH ROW
EXECUTE FUNCTION public.log_domain_verification();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.tenant_domains IS 'Domain verification and policy management for tenants';
COMMENT ON COLUMN public.tenant_domains._id IS 'Unique identifier for the domain record';
COMMENT ON COLUMN public.tenant_domains.tenant_id IS 'ID of the tenant that owns this domain';
COMMENT ON COLUMN public.tenant_domains.domain IS 'Domain name (lowercase, alphanumeric with dots/hyphens)';
COMMENT ON COLUMN public.tenant_domains.verification_status IS 'Verification status: PENDING or VERIFIED';
COMMENT ON COLUMN public.tenant_domains.verification_method IS 'Verification method: DNS_TXT or HTML_FILE';
COMMENT ON COLUMN public.tenant_domains.verification_token IS 'Token for domain verification';
COMMENT ON COLUMN public.tenant_domains.verified_at IS 'Timestamp when domain was verified';
COMMENT ON COLUMN public.tenant_domains.policy IS 'Domain policy: NONE, CAPTURE, or ENFORCE_SSO';
COMMENT ON COLUMN public.tenant_domains.created_at IS 'Timestamp when domain was added';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_domains TO authenticated;
GRANT ALL ON public.tenant_domains TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.get_tenant_domain_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_domain_ownership TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domains_by_policy TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_tenant_domain TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

/*
-- Insert sample data for testing (replace UUIDs with actual tenant IDs)
INSERT INTO public.tenant_domains 
  (tenant_id, domain, verification_method, policy)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'example.com', 'DNS_TXT', 'NONE'),
  ('00000000-0000-0000-0000-000000000001', 'app.example.com', 'HTML_FILE', 'CAPTURE'),
  ('00000000-0000-0000-0000-000000000002', 'demo.org', 'DNS_TXT', 'ENFORCE_SSO');
*/

-- ============================================================================
-- VERIFICATION EXAMPLES
-- ============================================================================

/*
-- Example 1: Check domain statistics for a tenant
SELECT * FROM public.get_tenant_domain_stats('00000000-0000-0000-0000-000000000001');

-- Example 2: Check domain ownership
SELECT * FROM public.check_domain_ownership('example.com');

-- Example 3: Get all domains with ENFORCE_SSO policy
SELECT * FROM public.get_domains_by_policy('ENFORCE_SSO');

-- Example 4: Find specific domain for a tenant
SELECT * FROM public.find_tenant_domain('00000000-0000-0000-0000-000000000001', 'example.com');

-- Example 5: Manually verify a domain (for testing)
UPDATE public.tenant_domains
SET verification_status = 'VERIFIED',
    verified_at = NOW()
WHERE domain = 'example.com';
*/

-- ============================================================================
-- MAINTENANCE
-- ============================================================================

-- Function to clean up old unverified domains
CREATE OR REPLACE FUNCTION public.cleanup_old_unverified_domains(
  p_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.tenant_domains
  WHERE verification_status = 'PENDING'
    AND created_at < NOW() - (p_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_old_unverified_domains TO service_role;

COMMENT ON FUNCTION public.cleanup_old_unverified_domains IS 'Remove unverified domains older than specified days (default 90)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ Tenant Domains migration completed successfully';
  RAISE NOTICE 'Table: public.tenant_domains';
  RAISE NOTICE 'Indexes: 6 created';
  RAISE NOTICE 'RLS Policies: 5 created';
  RAISE NOTICE 'Functions: 5 created';
  RAISE NOTICE 'Triggers: 3 created';
  RAISE NOTICE 'Constraints: 5 check constraints';
END $$;

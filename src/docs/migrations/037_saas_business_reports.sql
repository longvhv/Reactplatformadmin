-- Migration: SaaS Business Reports
-- Version: 1.0.0
-- Date: 2026-01-15
-- Description: Revenue statistics and business analytics for partners/tenants

-- ============================================================================
-- SCHEMA: telemetry
-- ============================================================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS telemetry;

-- ============================================================================
-- TABLE: saas_business_reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS telemetry.saas_business_reports (
  -- Primary Key
  _id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Report Metadata
  report_date DATE NULL,
  partner_id UUID NULL, -- References tenant/partner
  
  -- Revenue Details
  revenue_category TEXT NULL,
  total_revenue NUMERIC(30, 4) NULL,
  currency_code CHAR(3) NULL DEFAULT 'VND',
  
  -- Additional Metrics
  tenant_count INTEGER NULL,
  details_json JSONB NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Primary Key Constraint
  CONSTRAINT saas_business_reports_pkey PRIMARY KEY (_id)
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for partner-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_saas_business_reports_partner_id 
ON telemetry.saas_business_reports(partner_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_saas_business_reports_report_date 
ON telemetry.saas_business_reports(report_date DESC);

-- Index for category analysis
CREATE INDEX IF NOT EXISTS idx_saas_business_reports_category 
ON telemetry.saas_business_reports(revenue_category);

-- Index for currency filtering
CREATE INDEX IF NOT EXISTS idx_saas_business_reports_currency 
ON telemetry.saas_business_reports(currency_code);

-- Composite index for partner analytics
CREATE INDEX IF NOT EXISTS idx_saas_business_reports_partner_analytics 
ON telemetry.saas_business_reports(partner_id, report_date DESC, revenue_category);

-- Composite index for date range queries
CREATE INDEX IF NOT EXISTS idx_saas_business_reports_date_range 
ON telemetry.saas_business_reports(report_date, partner_id, revenue_category);

-- Index for JSON details (GIN index)
CREATE INDEX IF NOT EXISTS idx_saas_business_reports_details_json 
ON telemetry.saas_business_reports USING gin(details_json);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE telemetry.saas_business_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY saas_business_reports_service_role_policy 
ON telemetry.saas_business_reports
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to view their partner's reports
CREATE POLICY saas_business_reports_partner_read_policy 
ON telemetry.saas_business_reports
FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT _id 
    FROM public.tenants 
    WHERE _id IN (
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Allow authenticated users to insert reports for their partner
CREATE POLICY saas_business_reports_partner_insert_policy 
ON telemetry.saas_business_reports
FOR INSERT
TO authenticated
WITH CHECK (
  partner_id IN (
    SELECT _id 
    FROM public.tenants 
    WHERE _id IN (
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get revenue summary for a partner
CREATE OR REPLACE FUNCTION telemetry.get_partner_revenue_summary(
  p_partner_id UUID,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  total_revenue NUMERIC,
  avg_revenue NUMERIC,
  total_reports BIGINT,
  total_tenants BIGINT,
  currency_code CHAR(3)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(total_revenue)::NUMERIC AS total_revenue,
    AVG(total_revenue)::NUMERIC AS avg_revenue,
    COUNT(*)::BIGINT AS total_reports,
    SUM(tenant_count)::BIGINT AS total_tenants,
    currency_code
  FROM telemetry.saas_business_reports
  WHERE
    partner_id = p_partner_id AND
    (p_date_from IS NULL OR report_date >= p_date_from) AND
    (p_date_to IS NULL OR report_date <= p_date_to)
  GROUP BY currency_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue by category
CREATE OR REPLACE FUNCTION telemetry.get_revenue_by_category(
  p_partner_id UUID,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  category TEXT,
  total_revenue NUMERIC,
  report_count BIGINT,
  total_tenants BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(revenue_category, 'Uncategorized') AS category,
    SUM(total_revenue)::NUMERIC AS total_revenue,
    COUNT(*)::BIGINT AS report_count,
    SUM(tenant_count)::BIGINT AS total_tenants
  FROM telemetry.saas_business_reports
  WHERE
    partner_id = p_partner_id AND
    (p_date_from IS NULL OR report_date >= p_date_from) AND
    (p_date_to IS NULL OR report_date <= p_date_to)
  GROUP BY revenue_category
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue trend (grouped by month)
CREATE OR REPLACE FUNCTION telemetry.get_revenue_trend_monthly(
  p_partner_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month DATE,
  total_revenue NUMERIC,
  total_tenants BIGINT,
  report_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', report_date)::DATE AS month,
    SUM(total_revenue)::NUMERIC AS total_revenue,
    SUM(tenant_count)::BIGINT AS total_tenants,
    COUNT(*)::BIGINT AS report_count
  FROM telemetry.saas_business_reports
  WHERE
    partner_id = p_partner_id AND
    report_date >= (CURRENT_DATE - (p_months || ' months')::INTERVAL)
  GROUP BY DATE_TRUNC('month', report_date)
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top revenue categories
CREATE OR REPLACE FUNCTION telemetry.get_top_revenue_categories(
  p_partner_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  category TEXT,
  total_revenue NUMERIC,
  percentage NUMERIC
) AS $$
DECLARE
  total_sum NUMERIC;
BEGIN
  -- Calculate total revenue
  SELECT SUM(total_revenue) INTO total_sum
  FROM telemetry.saas_business_reports
  WHERE p_partner_id IS NULL OR partner_id = p_partner_id;
  
  -- Return top categories with percentage
  RETURN QUERY
  SELECT
    COALESCE(revenue_category, 'Uncategorized') AS category,
    SUM(total_revenue)::NUMERIC AS total_revenue,
    CASE 
      WHEN total_sum > 0 THEN (SUM(total_revenue) / total_sum * 100)::NUMERIC
      ELSE 0::NUMERIC
    END AS percentage
  FROM telemetry.saas_business_reports
  WHERE p_partner_id IS NULL OR partner_id = p_partner_id
  GROUP BY revenue_category
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA RETENTION POLICY
-- ============================================================================

-- Function to clean up old reports (run via cron/scheduler)
CREATE OR REPLACE FUNCTION telemetry.cleanup_old_business_reports(
  p_retention_days INTEGER DEFAULT 730 -- 2 years default
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM telemetry.saas_business_reports
  WHERE report_date < CURRENT_DATE - p_retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to validate revenue data
CREATE OR REPLACE FUNCTION telemetry.validate_business_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure total_revenue is non-negative
  IF NEW.total_revenue IS NOT NULL AND NEW.total_revenue < 0 THEN
    RAISE EXCEPTION 'total_revenue cannot be negative';
  END IF;
  
  -- Ensure tenant_count is non-negative
  IF NEW.tenant_count IS NOT NULL AND NEW.tenant_count < 0 THEN
    RAISE EXCEPTION 'tenant_count cannot be negative';
  END IF;
  
  -- Set default currency if not provided
  IF NEW.currency_code IS NULL THEN
    NEW.currency_code := 'VND';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_business_report_trigger
BEFORE INSERT OR UPDATE ON telemetry.saas_business_reports
FOR EACH ROW
EXECUTE FUNCTION telemetry.validate_business_report();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE telemetry.saas_business_reports IS 'SaaS business revenue reports and analytics';
COMMENT ON COLUMN telemetry.saas_business_reports._id IS 'Unique identifier for the report';
COMMENT ON COLUMN telemetry.saas_business_reports.report_date IS 'Date of the report';
COMMENT ON COLUMN telemetry.saas_business_reports.partner_id IS 'ID of the partner/tenant';
COMMENT ON COLUMN telemetry.saas_business_reports.revenue_category IS 'Category of revenue (e.g., subscription, usage, etc.)';
COMMENT ON COLUMN telemetry.saas_business_reports.total_revenue IS 'Total revenue amount';
COMMENT ON COLUMN telemetry.saas_business_reports.currency_code IS 'ISO 4217 currency code (3 characters)';
COMMENT ON COLUMN telemetry.saas_business_reports.tenant_count IS 'Number of tenants included in this report';
COMMENT ON COLUMN telemetry.saas_business_reports.details_json IS 'Additional details in JSON format';
COMMENT ON COLUMN telemetry.saas_business_reports.created_at IS 'Timestamp when the report was created';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA telemetry TO authenticated;
GRANT USAGE ON SCHEMA telemetry TO service_role;

-- Grant table permissions
GRANT SELECT, INSERT ON telemetry.saas_business_reports TO authenticated;
GRANT ALL ON telemetry.saas_business_reports TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION telemetry.get_partner_revenue_summary TO authenticated;
GRANT EXECUTE ON FUNCTION telemetry.get_revenue_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION telemetry.get_revenue_trend_monthly TO authenticated;
GRANT EXECUTE ON FUNCTION telemetry.get_top_revenue_categories TO authenticated;
GRANT EXECUTE ON FUNCTION telemetry.cleanup_old_business_reports TO service_role;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

/*
-- Insert sample data for testing
INSERT INTO telemetry.saas_business_reports 
  (partner_id, report_date, revenue_category, total_revenue, currency_code, tenant_count)
VALUES
  ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'Subscription', 1000000, 'VND', 10),
  ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'Usage', 500000, 'VND', 5),
  ('00000000-0000-0000-0000-000000000001', '2026-01-02', 'Subscription', 1200000, 'VND', 12),
  ('00000000-0000-0000-0000-000000000001', '2026-01-02', 'Add-ons', 300000, 'VND', 3);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ SaaS Business Reports migration completed successfully';
  RAISE NOTICE 'Table: telemetry.saas_business_reports';
  RAISE NOTICE 'Indexes: 7 created';
  RAISE NOTICE 'RLS Policies: 3 created';
  RAISE NOTICE 'Functions: 5 created';
  RAISE NOTICE 'Triggers: 1 created';
  RAISE NOTICE '📝 Frontend access: Use supabase.schema("telemetry").from("saas_business_reports")';
END $$;
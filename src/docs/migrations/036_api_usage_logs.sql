-- Migration: API Usage Logs Module
-- Version: 1.0.0
-- Date: 2026-01-15
-- Description: Database schema for API usage telemetry tracking

-- ============================================================================
-- SCHEMA: telemetry
-- ============================================================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS telemetry;

-- ============================================================================
-- TABLE: api_usage_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS telemetry.api_usage_logs (
  -- Primary Key
  _id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Tenant & Application Context
  tenant_id UUID NULL,
  app_code TEXT NULL,
  
  -- API Request Details
  api_endpoint TEXT NULL,
  api_method TEXT NULL,
  status_code SMALLINT NULL,
  
  -- Performance Metrics
  request_size BIGINT NULL DEFAULT 0,
  response_size BIGINT NULL DEFAULT 0,
  latency_ms INTEGER NULL,
  
  -- Authentication
  api_key_id UUID NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Primary Key Constraint
  CONSTRAINT api_usage_logs_pkey PRIMARY KEY (_id)
) TABLESPACE pg_default;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for tenant-based queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_tenant_id 
ON telemetry.api_usage_logs(tenant_id);

-- Index for app-based queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_app_code 
ON telemetry.api_usage_logs(app_code);

-- Index for endpoint searches
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint 
ON telemetry.api_usage_logs(api_endpoint);

-- Index for method filtering
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_method 
ON telemetry.api_usage_logs(api_method);

-- Index for status code analysis
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_status 
ON telemetry.api_usage_logs(status_code);

-- Index for time-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at 
ON telemetry.api_usage_logs(created_at DESC);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_analytics 
ON telemetry.api_usage_logs(tenant_id, app_code, created_at DESC);

-- Index for API key tracking
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key 
ON telemetry.api_usage_logs(api_key_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE telemetry.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY api_usage_logs_service_role_policy 
ON telemetry.api_usage_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to view their tenant's data
CREATE POLICY api_usage_logs_tenant_read_policy 
ON telemetry.api_usage_logs
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Allow authenticated users to insert logs for their tenant
CREATE POLICY api_usage_logs_tenant_insert_policy 
ON telemetry.api_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get API usage statistics
CREATE OR REPLACE FUNCTION telemetry.get_api_usage_stats(
  p_tenant_id UUID DEFAULT NULL,
  p_app_code TEXT DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  avg_latency NUMERIC,
  total_request_size BIGINT,
  total_response_size BIGINT,
  success_rate NUMERIC,
  error_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_requests,
    ROUND(AVG(latency_ms)::NUMERIC, 2) AS avg_latency,
    SUM(request_size)::BIGINT AS total_request_size,
    SUM(response_size)::BIGINT AS total_response_size,
    ROUND(
      (COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300)::NUMERIC / 
       NULLIF(COUNT(*), 0) * 100), 
      2
    ) AS success_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE status_code >= 400)::NUMERIC / 
       NULLIF(COUNT(*), 0) * 100), 
      2
    ) AS error_rate
  FROM telemetry.api_usage_logs
  WHERE
    (p_tenant_id IS NULL OR tenant_id = p_tenant_id) AND
    (p_app_code IS NULL OR app_code = p_app_code) AND
    (p_date_from IS NULL OR created_at >= p_date_from) AND
    (p_date_to IS NULL OR created_at <= p_date_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top endpoints
CREATE OR REPLACE FUNCTION telemetry.get_top_api_endpoints(
  p_tenant_id UUID DEFAULT NULL,
  p_app_code TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  endpoint TEXT,
  request_count BIGINT,
  avg_latency NUMERIC,
  error_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    api_endpoint,
    COUNT(*)::BIGINT AS request_count,
    ROUND(AVG(latency_ms)::NUMERIC, 2) AS avg_latency,
    COUNT(*) FILTER (WHERE status_code >= 400)::BIGINT AS error_count
  FROM telemetry.api_usage_logs
  WHERE
    (p_tenant_id IS NULL OR tenant_id = p_tenant_id) AND
    (p_app_code IS NULL OR app_code = p_app_code) AND
    api_endpoint IS NOT NULL
  GROUP BY api_endpoint
  ORDER BY request_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old logs (run via cron/scheduler)
CREATE OR REPLACE FUNCTION telemetry.cleanup_old_api_logs(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM telemetry.api_usage_logs
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE telemetry.api_usage_logs IS 'Stores API usage telemetry data for monitoring and analytics';
COMMENT ON COLUMN telemetry.api_usage_logs._id IS 'Unique identifier for the log entry';
COMMENT ON COLUMN telemetry.api_usage_logs.tenant_id IS 'ID of the tenant making the API request';
COMMENT ON COLUMN telemetry.api_usage_logs.app_code IS 'Code identifying the application';
COMMENT ON COLUMN telemetry.api_usage_logs.api_endpoint IS 'API endpoint path';
COMMENT ON COLUMN telemetry.api_usage_logs.api_method IS 'HTTP method (GET, POST, PUT, DELETE, etc.)';
COMMENT ON COLUMN telemetry.api_usage_logs.status_code IS 'HTTP response status code';
COMMENT ON COLUMN telemetry.api_usage_logs.request_size IS 'Size of request payload in bytes';
COMMENT ON COLUMN telemetry.api_usage_logs.response_size IS 'Size of response payload in bytes';
COMMENT ON COLUMN telemetry.api_usage_logs.latency_ms IS 'Request processing time in milliseconds';
COMMENT ON COLUMN telemetry.api_usage_logs.api_key_id IS 'ID of the API key used for authentication';
COMMENT ON COLUMN telemetry.api_usage_logs.created_at IS 'Timestamp when the log entry was created';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA telemetry TO authenticated;
GRANT USAGE ON SCHEMA telemetry TO service_role;

-- Grant table permissions
GRANT SELECT, INSERT ON telemetry.api_usage_logs TO authenticated;
GRANT ALL ON telemetry.api_usage_logs TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION telemetry.get_api_usage_stats TO authenticated;
GRANT EXECUTE ON FUNCTION telemetry.get_top_api_endpoints TO authenticated;
GRANT EXECUTE ON FUNCTION telemetry.cleanup_old_api_logs TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE '✅ API Usage Logs migration completed successfully';
  RAISE NOTICE 'Table: telemetry.api_usage_logs';
  RAISE NOTICE 'Indexes: 8 created';
  RAISE NOTICE 'RLS Policies: 3 created';
  RAISE NOTICE 'Functions: 3 created';
  RAISE NOTICE '📝 Frontend access: Use supabase.schema("telemetry").from("api_usage_logs")';
END $$;
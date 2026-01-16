-- Traffic Logs Table Migration
-- Created: 2026-01-15
-- Purpose: Store HTTP traffic telemetry data for monitoring and analytics

-- Drop table if exists (for development only)
-- DROP TABLE IF EXISTS telemetry.traffic_logs CASCADE;

-- Create telemetry schema if not exists
CREATE SCHEMA IF NOT EXISTS telemetry;

-- Create traffic_logs table
CREATE TABLE IF NOT EXISTS telemetry.traffic_logs (
  _id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  user_id uuid NULL,
  app_code text NULL,
  method text NULL,
  domain text NULL,
  path text NULL,
  status_code smallint NULL,
  latency_ms integer NULL,
  request_size bigint NULL DEFAULT 0,
  response_size bigint NULL DEFAULT 0,
  ip_address inet NULL,
  user_agent text NULL,
  data_region text NULL DEFAULT 'ap-southeast-1'::text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT traffic_logs_pkey PRIMARY KEY (_id)
) TABLESPACE pg_default;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_traffic_logs_timestamp ON telemetry.traffic_logs USING btree (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_tenant_id ON telemetry.traffic_logs USING btree (tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_logs_user_id ON telemetry.traffic_logs USING btree (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_logs_app_code ON telemetry.traffic_logs USING btree (app_code) WHERE app_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_logs_method ON telemetry.traffic_logs USING btree (method) WHERE method IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_logs_status_code ON telemetry.traffic_logs USING btree (status_code) WHERE status_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_logs_data_region ON telemetry.traffic_logs USING btree (data_region) WHERE data_region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_logs_latency_ms ON telemetry.traffic_logs USING btree (latency_ms) WHERE latency_ms IS NOT NULL;

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_traffic_logs_tenant_timestamp ON telemetry.traffic_logs USING btree (tenant_id, timestamp DESC) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_traffic_logs_app_timestamp ON telemetry.traffic_logs USING btree (app_code, timestamp DESC) WHERE app_code IS NOT NULL;

-- Add comments
COMMENT ON TABLE telemetry.traffic_logs IS 'HTTP traffic telemetry data for monitoring and analytics';
COMMENT ON COLUMN telemetry.traffic_logs._id IS 'Unique identifier for the traffic log';
COMMENT ON COLUMN telemetry.traffic_logs.tenant_id IS 'Tenant ID associated with the request';
COMMENT ON COLUMN telemetry.traffic_logs.user_id IS 'User ID associated with the request';
COMMENT ON COLUMN telemetry.traffic_logs.app_code IS 'Application code that generated the request';
COMMENT ON COLUMN telemetry.traffic_logs.method IS 'HTTP method (GET, POST, PUT, etc.)';
COMMENT ON COLUMN telemetry.traffic_logs.domain IS 'Domain name of the request';
COMMENT ON COLUMN telemetry.traffic_logs.path IS 'URL path of the request';
COMMENT ON COLUMN telemetry.traffic_logs.status_code IS 'HTTP status code of the response';
COMMENT ON COLUMN telemetry.traffic_logs.latency_ms IS 'Request latency in milliseconds';
COMMENT ON COLUMN telemetry.traffic_logs.request_size IS 'Size of the request in bytes';
COMMENT ON COLUMN telemetry.traffic_logs.response_size IS 'Size of the response in bytes';
COMMENT ON COLUMN telemetry.traffic_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN telemetry.traffic_logs.user_agent IS 'Client user agent string';
COMMENT ON COLUMN telemetry.traffic_logs.data_region IS 'Data region where the request was processed';
COMMENT ON COLUMN telemetry.traffic_logs.timestamp IS 'Timestamp when the request occurred';

-- Enable Row Level Security (RLS)
ALTER TABLE telemetry.traffic_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Allow all operations for authenticated users
CREATE POLICY traffic_logs_all_policy ON telemetry.traffic_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow read-only access for service role
CREATE POLICY traffic_logs_service_role_policy ON telemetry.traffic_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON telemetry.traffic_logs TO authenticated;
GRANT ALL ON telemetry.traffic_logs TO service_role;
GRANT USAGE ON SCHEMA telemetry TO authenticated;
GRANT USAGE ON SCHEMA telemetry TO service_role;

-- Insert sample data (optional, for testing)
INSERT INTO telemetry.traffic_logs (
  tenant_id,
  user_id,
  app_code,
  method,
  domain,
  path,
  status_code,
  latency_ms,
  request_size,
  response_size,
  ip_address,
  user_agent,
  data_region,
  timestamp
) VALUES
  (
    NULL,
    NULL,
    'web-app',
    'GET',
    'api.example.com',
    '/api/v1/users',
    200,
    125,
    512,
    2048,
    '192.168.1.100',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'ap-southeast-1',
    NOW() - INTERVAL '1 hour'
  ),
  (
    NULL,
    NULL,
    'web-app',
    'POST',
    'api.example.com',
    '/api/v1/auth/login',
    201,
    250,
    1024,
    512,
    '192.168.1.101',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'ap-southeast-1',
    NOW() - INTERVAL '2 hours'
  ),
  (
    NULL,
    NULL,
    'mobile-app',
    'GET',
    'api.example.com',
    '/api/v1/products',
    200,
    180,
    256,
    4096,
    '192.168.1.102',
    'okhttp/4.9.0',
    'ap-southeast-1',
    NOW() - INTERVAL '3 hours'
  ),
  (
    NULL,
    NULL,
    'web-app',
    'DELETE',
    'api.example.com',
    '/api/v1/sessions/xyz',
    204,
    95,
    128,
    0,
    '192.168.1.103',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'us-east-1',
    NOW() - INTERVAL '4 hours'
  ),
  (
    NULL,
    NULL,
    'web-app',
    'GET',
    'api.example.com',
    '/api/v1/invalid',
    404,
    45,
    256,
    128,
    '192.168.1.104',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    'eu-west-1',
    NOW() - INTERVAL '5 hours'
  ),
  (
    NULL,
    NULL,
    'web-app',
    'POST',
    'api.example.com',
    '/api/v1/orders',
    500,
    2500,
    2048,
    256,
    '192.168.1.105',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'ap-southeast-1',
    NOW() - INTERVAL '6 hours'
  );

-- Create a function to clean up old logs (optional)
CREATE OR REPLACE FUNCTION telemetry.cleanup_old_traffic_logs(days_to_keep integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM telemetry.traffic_logs
  WHERE timestamp < NOW() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION telemetry.cleanup_old_traffic_logs IS 'Delete traffic logs older than specified days (default: 90 days)';

-- Migration complete
SELECT 'Traffic Logs table created successfully' AS status;

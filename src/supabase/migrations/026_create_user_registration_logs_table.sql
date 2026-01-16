-- Migration: Create User Registration Logs Table
-- Description: Telemetry table for tracking user registration data
-- Date: 2026-01-15
-- Module: User Registration Telemetry

-- Create telemetry schema if not exists
CREATE SCHEMA IF NOT EXISTS telemetry;

-- Create user_registration_logs table
CREATE TABLE IF NOT EXISTS telemetry.user_registration_logs (
  _id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NULL,
  user_id uuid NULL,
  registration_source text NULL,
  data_region text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_registration_logs_pkey PRIMARY KEY (_id)
) TABLESPACE pg_default;

-- Add comments
COMMENT ON TABLE telemetry.user_registration_logs IS 'Tracks user registration telemetry data including source and region';
COMMENT ON COLUMN telemetry.user_registration_logs._id IS 'Primary key (UUID)';
COMMENT ON COLUMN telemetry.user_registration_logs.tenant_id IS 'Reference to tenant (optional)';
COMMENT ON COLUMN telemetry.user_registration_logs.user_id IS 'Reference to user (optional)';
COMMENT ON COLUMN telemetry.user_registration_logs.registration_source IS 'Registration source (web, mobile, api, oauth, etc.)';
COMMENT ON COLUMN telemetry.user_registration_logs.data_region IS 'Data region (us-east-1, eu-west-1, etc.)';
COMMENT ON COLUMN telemetry.user_registration_logs.created_at IS 'Timestamp of registration';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_registration_logs_tenant 
  ON telemetry.user_registration_logs(tenant_id) 
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_registration_logs_user 
  ON telemetry.user_registration_logs(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_registration_logs_created 
  ON telemetry.user_registration_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_registration_logs_source 
  ON telemetry.user_registration_logs(registration_source) 
  WHERE registration_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_registration_logs_region 
  ON telemetry.user_registration_logs(data_region) 
  WHERE data_region IS NOT NULL;

-- Composite index for source/region analysis
CREATE INDEX IF NOT EXISTS idx_user_registration_logs_source_region 
  ON telemetry.user_registration_logs(registration_source, data_region) 
  WHERE registration_source IS NOT NULL AND data_region IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE telemetry.user_registration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all operations for authenticated users
-- Note: Adjust policies based on your security requirements
CREATE POLICY "Allow all for authenticated users" 
  ON telemetry.user_registration_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Allow anonymous read for public analytics (optional)
-- Uncomment if you want to allow public read access
-- CREATE POLICY "Allow read for anonymous" 
--   ON telemetry.user_registration_logs
--   FOR SELECT
--   TO anon
--   USING (true);

-- Insert demo data (optional - comment out in production)
INSERT INTO telemetry.user_registration_logs (_id, tenant_id, user_id, registration_source, data_region, created_at)
VALUES
  (gen_random_uuid(), NULL, NULL, 'web', 'us-east-1', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), NULL, NULL, 'mobile', 'us-west-1', NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), NULL, NULL, 'oauth', 'eu-west-1', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), NULL, NULL, 'google', 'eu-central-1', NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), NULL, NULL, 'api', 'ap-southeast-1', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), NULL, NULL, 'web', 'us-east-1', NOW() - INTERVAL '6 hours'),
  (gen_random_uuid(), NULL, NULL, 'mobile', 'ap-northeast-1', NOW() - INTERVAL '12 hours'),
  (gen_random_uuid(), NULL, NULL, 'email', 'us-east-1', NOW() - INTERVAL '18 hours'),
  (gen_random_uuid(), NULL, NULL, 'sso', 'eu-west-1', NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), NULL, NULL, 'github', 'us-west-1', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Verification query
-- SELECT COUNT(*) as total_logs, 
--        COUNT(DISTINCT registration_source) as unique_sources,
--        COUNT(DISTINCT data_region) as unique_regions
-- FROM telemetry.user_registration_logs;

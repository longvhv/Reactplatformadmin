-- ============================================
-- TENANT RATE LIMITS TABLE
-- Quản lý rate limiting configuration cho tenants
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS tenant_rate_limits CASCADE;

-- Create tenant_rate_limits table
CREATE TABLE tenant_rate_limits (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant & Package references
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  service_package_id UUID REFERENCES service_packages(_id) ON DELETE SET NULL,
  
  -- Rate limit identification
  limit_name VARCHAR(255) NOT NULL, -- API Requests, File Uploads, Database Queries
  limit_key VARCHAR(255) NOT NULL, -- api_requests, file_uploads, db_queries
  resource_type VARCHAR(100), -- api, storage, database, compute, network
  endpoint_pattern VARCHAR(500), -- /api/v1/*, /uploads/*, null for global
  
  -- Rate limit configuration
  max_requests INTEGER NOT NULL, -- Maximum requests
  time_window INTEGER NOT NULL, -- Time window in seconds
  window_unit VARCHAR(20) DEFAULT 'second', -- second, minute, hour, day, month
  
  -- Advanced configuration
  burst_limit INTEGER, -- Allow burst above max_requests
  concurrent_limit INTEGER, -- Max concurrent requests
  
  -- Limit type
  limit_type VARCHAR(50) DEFAULT 'sliding_window', -- sliding_window, fixed_window, token_bucket
  limit_scope VARCHAR(50) DEFAULT 'tenant', -- tenant, user, ip, api_key
  
  -- Enforcement
  is_enabled BOOLEAN DEFAULT TRUE,
  is_strict BOOLEAN DEFAULT TRUE, -- Strict = reject, Soft = log warning
  block_duration INTEGER, -- Block duration in seconds after exceeded
  
  -- Response configuration
  retry_after INTEGER, -- Retry-After header value (seconds)
  custom_error_message TEXT,
  custom_error_code VARCHAR(50), -- RATE_LIMIT_EXCEEDED, TOO_MANY_REQUESTS
  
  -- Tracking & Alerts
  current_usage INTEGER DEFAULT 0,
  peak_usage INTEGER DEFAULT 0,
  last_exceeded_at TIMESTAMPTZ,
  exceeded_count INTEGER DEFAULT 0,
  alert_threshold INTEGER, -- Alert when usage reaches X% (e.g., 80)
  alert_enabled BOOLEAN DEFAULT FALSE,
  
  -- Priority & Override
  priority INTEGER DEFAULT 0, -- Higher = checked first
  can_override BOOLEAN DEFAULT FALSE, -- Allow temporary override
  override_until TIMESTAMPTZ, -- Override expiration
  
  -- Metadata
  description TEXT,
  tags TEXT[], -- ['critical', 'api', 'production']
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CHECK (max_requests > 0),
  CHECK (time_window > 0),
  CHECK (window_unit IN ('second', 'minute', 'hour', 'day', 'month')),
  CHECK (limit_type IN ('sliding_window', 'fixed_window', 'token_bucket', 'leaky_bucket')),
  CHECK (limit_scope IN ('tenant', 'user', 'ip', 'api_key', 'global')),
  CHECK (resource_type IN ('api', 'storage', 'database', 'compute', 'network', 'email', 'sms') OR resource_type IS NULL),
  CHECK (burst_limit IS NULL OR burst_limit >= max_requests),
  CHECK (concurrent_limit IS NULL OR concurrent_limit > 0),
  CHECK (current_usage >= 0),
  CHECK (peak_usage >= 0),
  CHECK (exceeded_count >= 0),
  CHECK (alert_threshold IS NULL OR (alert_threshold > 0 AND alert_threshold <= 100)),
  CHECK (priority >= 0),
  
  -- Unique constraint
  UNIQUE(tenant_id, limit_key, endpoint_pattern)
);

-- Indexes for performance
CREATE INDEX idx_tenant_rate_limits_tenant_id ON tenant_rate_limits(tenant_id);
CREATE INDEX idx_tenant_rate_limits_package_id ON tenant_rate_limits(service_package_id);
CREATE INDEX idx_tenant_rate_limits_limit_key ON tenant_rate_limits(limit_key);
CREATE INDEX idx_tenant_rate_limits_resource_type ON tenant_rate_limits(resource_type);
CREATE INDEX idx_tenant_rate_limits_is_enabled ON tenant_rate_limits(is_enabled);
CREATE INDEX idx_tenant_rate_limits_priority ON tenant_rate_limits(priority DESC);
CREATE INDEX idx_tenant_rate_limits_endpoint ON tenant_rate_limits(endpoint_pattern);

-- Composite indexes
CREATE INDEX idx_tenant_rate_limits_tenant_enabled ON tenant_rate_limits(tenant_id, is_enabled);
CREATE INDEX idx_tenant_rate_limits_tenant_resource ON tenant_rate_limits(tenant_id, resource_type);
CREATE INDEX idx_tenant_rate_limits_key_enabled ON tenant_rate_limits(limit_key, is_enabled);

-- GIN index for tags
CREATE INDEX idx_tenant_rate_limits_tags ON tenant_rate_limits USING GIN(tags);

-- Enable RLS
ALTER TABLE tenant_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON tenant_rate_limits FOR ALL 
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tenant_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_rate_limits_updated_at
  BEFORE UPDATE ON tenant_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_rate_limits_updated_at();

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  tenant_ids UUID[];
  package_ids UUID[];
  limit_count INTEGER;
  tenant_id UUID;
  package_id UUID;
  i INTEGER;
  
  -- Rate limit templates
  limit_templates RECORD;
  
BEGIN
  -- Get real tenant and package IDs
  SELECT ARRAY(SELECT _id FROM tenants LIMIT 20) INTO tenant_ids;
  SELECT ARRAY(SELECT _id FROM service_packages LIMIT 10) INTO package_ids;
  
  IF array_length(tenant_ids, 1) IS NULL OR array_length(tenant_ids, 1) = 0 THEN
    RAISE NOTICE 'No tenants found. Skipping demo data.';
    RETURN;
  END IF;
  
  IF array_length(package_ids, 1) IS NULL OR array_length(package_ids, 1) = 0 THEN
    RAISE NOTICE 'No service packages found. Creating rate limits without package reference.';
    package_ids := NULL;
  END IF;
  
  RAISE NOTICE 'Creating rate limits for % tenants', array_length(tenant_ids, 1);
  
  limit_count := 0;
  
  -- Create rate limits for each tenant
  FOREACH tenant_id IN ARRAY tenant_ids LOOP
    
    -- Pick a random package for this tenant (30% chance)
    IF package_ids IS NOT NULL AND random() < 0.3 THEN
      package_id := package_ids[1 + floor(random() * array_length(package_ids, 1))];
    ELSE
      package_id := NULL;
    END IF;
    
    -- Global API Rate Limit (all tenants)
    BEGIN
      INSERT INTO tenant_rate_limits (
        tenant_id, service_package_id, limit_name, limit_key, resource_type, endpoint_pattern,
        max_requests, time_window, window_unit, limit_type, limit_scope,
        is_enabled, is_strict, retry_after, alert_threshold, alert_enabled,
        priority, description, tags, metadata,
        current_usage, peak_usage, exceeded_count
      ) VALUES (
        tenant_id, package_id,
        'Global API Rate Limit', 'global_api', 'api', NULL,
        CASE 
          WHEN random() < 0.3 THEN 100 -- Low tier
          WHEN random() < 0.7 THEN 1000 -- Mid tier
          ELSE 10000 -- High tier
        END,
        60, 'second', 'sliding_window', 'tenant',
        TRUE, TRUE, 60, 80, TRUE,
        10, 'Global rate limit for all API requests',
        ARRAY['critical', 'api', 'global']::TEXT[],
        jsonb_build_object('tier', 'global', 'auto_scale', FALSE),
        floor(random() * 50)::INTEGER,
        floor(random() * 100)::INTEGER,
        floor(random() * 5)::INTEGER
      );
      limit_count := limit_count + 1;
    EXCEPTION
      WHEN unique_violation THEN NULL;
      WHEN others THEN NULL;
    END;
    
    -- API Endpoint Rate Limits
    FOR i IN 1..floor(3 + random() * 4)::INTEGER LOOP
      DECLARE
        endpoints VARCHAR[] := ARRAY[
          '/api/v1/users', '/api/v1/products', '/api/v1/orders',
          '/api/v1/auth/*', '/api/v1/reports', '/api/v1/analytics',
          '/api/v1/uploads', '/api/v1/exports', '/api/v1/webhooks'
        ];
        endpoint VARCHAR;
        resource_names VARCHAR[] := ARRAY[
          'Users API', 'Products API', 'Orders API',
          'Auth API', 'Reports API', 'Analytics API',
          'Uploads API', 'Exports API', 'Webhooks API'
        ];
      BEGIN
        endpoint := endpoints[1 + floor(random() * array_length(endpoints, 1))];
        
        INSERT INTO tenant_rate_limits (
          tenant_id, service_package_id, limit_name, limit_key, resource_type, endpoint_pattern,
          max_requests, time_window, window_unit, limit_type, limit_scope,
          burst_limit, concurrent_limit,
          is_enabled, is_strict, block_duration, retry_after,
          alert_threshold, alert_enabled,
          priority, description, tags, metadata,
          current_usage, peak_usage, exceeded_count, last_exceeded_at
        ) VALUES (
          tenant_id, package_id,
          resource_names[1 + floor(random() * array_length(resource_names, 1))],
          'api_' || replace(endpoint, '/', '_'),
          'api', endpoint,
          50 + floor(random() * 450)::INTEGER, -- 50-500
          CASE 
            WHEN random() < 0.6 THEN 60 -- per minute
            WHEN random() < 0.9 THEN 3600 -- per hour
            ELSE 86400 -- per day
          END,
          CASE 
            WHEN random() < 0.6 THEN 'minute'
            WHEN random() < 0.9 THEN 'hour'
            ELSE 'day'
          END,
          CASE 
            WHEN random() < 0.7 THEN 'sliding_window'
            WHEN random() < 0.9 THEN 'fixed_window'
            ELSE 'token_bucket'
          END,
          CASE 
            WHEN random() < 0.7 THEN 'tenant'
            WHEN random() < 0.9 THEN 'user'
            ELSE 'ip'
          END,
          -- burst_limit: 20% have burst
          CASE WHEN random() < 0.2 THEN (50 + floor(random() * 450))::INTEGER * 2 ELSE NULL END,
          -- concurrent_limit: 30% have concurrent limit
          CASE WHEN random() < 0.3 THEN 10 + floor(random() * 40)::INTEGER ELSE NULL END,
          -- 90% enabled
          random() < 0.9,
          -- 80% strict
          random() < 0.8,
          -- block_duration: 50% have blocking
          CASE WHEN random() < 0.5 THEN 300 + floor(random() * 3300)::INTEGER ELSE NULL END,
          CASE 
            WHEN random() < 0.5 THEN 60
            WHEN random() < 0.8 THEN 300
            ELSE 3600
          END,
          70 + floor(random() * 20)::INTEGER, -- 70-90%
          random() < 0.6, -- 60% have alerts
          floor(random() * 5)::INTEGER,
          'Rate limit for ' || endpoint,
          ARRAY['api', 'endpoint']::TEXT[],
          jsonb_build_object(
            'endpoint', endpoint,
            'method', CASE 
              WHEN random() < 0.5 THEN 'ALL'
              ELSE (ARRAY['GET', 'POST', 'PUT', 'DELETE'])[1 + floor(random() * 4)]
            END
          ),
          floor(random() * 30)::INTEGER,
          floor(random() * 80)::INTEGER,
          floor(random() * 3)::INTEGER,
          CASE WHEN random() < 0.3 THEN NOW() - (random() * INTERVAL '7 days') ELSE NULL END
        );
        limit_count := limit_count + 1;
      EXCEPTION
        WHEN unique_violation THEN NULL;
        WHEN others THEN NULL;
      END;
    END LOOP;
    
    -- Storage Rate Limits (50% of tenants)
    IF random() < 0.5 THEN
      BEGIN
        INSERT INTO tenant_rate_limits (
          tenant_id, service_package_id, limit_name, limit_key, resource_type,
          max_requests, time_window, window_unit, limit_type, limit_scope,
          is_enabled, is_strict, alert_threshold, alert_enabled,
          description, tags, metadata,
          current_usage, peak_usage
        ) VALUES (
          tenant_id, package_id,
          'File Upload Rate Limit', 'file_uploads', 'storage',
          10 + floor(random() * 90)::INTEGER, -- 10-100 uploads
          3600, 'hour', 'sliding_window', 'tenant',
          TRUE, TRUE, 80, TRUE,
          'Rate limit for file uploads',
          ARRAY['storage', 'uploads']::TEXT[],
          jsonb_build_object('max_file_size_mb', 10 + floor(random() * 90)),
          floor(random() * 20)::INTEGER,
          floor(random() * 50)::INTEGER
        );
        limit_count := limit_count + 1;
      EXCEPTION
        WHEN unique_violation THEN NULL;
        WHEN others THEN NULL;
      END;
    END IF;
    
    -- Database Rate Limits (40% of tenants)
    IF random() < 0.4 THEN
      BEGIN
        INSERT INTO tenant_rate_limits (
          tenant_id, service_package_id, limit_name, limit_key, resource_type,
          max_requests, time_window, window_unit, limit_type, limit_scope,
          concurrent_limit,
          is_enabled, is_strict, alert_threshold, alert_enabled,
          description, tags, metadata,
          current_usage, peak_usage
        ) VALUES (
          tenant_id, package_id,
          'Database Query Rate Limit', 'db_queries', 'database',
          500 + floor(random() * 1500)::INTEGER, -- 500-2000 queries
          60, 'second', 'sliding_window', 'tenant',
          20 + floor(random() * 30)::INTEGER, -- 20-50 concurrent
          TRUE, TRUE, 85, TRUE,
          'Rate limit for database queries',
          ARRAY['database', 'queries']::TEXT[],
          jsonb_build_object('query_timeout_ms', 5000 + floor(random() * 25000)),
          floor(random() * 100)::INTEGER,
          floor(random() * 200)::INTEGER
        );
        limit_count := limit_count + 1;
      EXCEPTION
        WHEN unique_violation THEN NULL;
        WHEN others THEN NULL;
      END;
    END IF;
    
    -- Email Rate Limits (60% of tenants)
    IF random() < 0.6 THEN
      BEGIN
        INSERT INTO tenant_rate_limits (
          tenant_id, service_package_id, limit_name, limit_key, resource_type,
          max_requests, time_window, window_unit, limit_type, limit_scope,
          is_enabled, is_strict, alert_threshold, alert_enabled,
          description, tags, metadata,
          current_usage, peak_usage, exceeded_count
        ) VALUES (
          tenant_id, package_id,
          'Email Sending Rate Limit', 'email_sends', 'email',
          100 + floor(random() * 900)::INTEGER, -- 100-1000 emails
          86400, 'day', 'fixed_window', 'tenant',
          TRUE, TRUE, 90, TRUE,
          'Daily email sending limit',
          ARRAY['email', 'notifications']::TEXT[],
          jsonb_build_object('provider', (ARRAY['sendgrid', 'ses', 'mailgun'])[1 + floor(random() * 3)]),
          floor(random() * 50)::INTEGER,
          floor(random() * 100)::INTEGER,
          floor(random() * 2)::INTEGER
        );
        limit_count := limit_count + 1;
      EXCEPTION
        WHEN unique_violation THEN NULL;
        WHEN others THEN NULL;
      END;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Created % rate limits', limit_count;
END $$;

-- ============================================
-- STATISTICS & VERIFICATION
-- ============================================

-- Summary by resource type
SELECT 
  resource_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenant_rate_limits
GROUP BY resource_type
ORDER BY count DESC;

-- Summary by limit type
SELECT 
  limit_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenant_rate_limits
GROUP BY limit_type
ORDER BY count DESC;

-- Summary by limit scope
SELECT 
  limit_scope,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenant_rate_limits
GROUP BY limit_scope
ORDER BY count DESC;

-- Summary by window unit
SELECT 
  window_unit,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenant_rate_limits
GROUP BY window_unit
ORDER BY count DESC;

-- Top tenants by rate limit count
SELECT 
  t.name as tenant_name,
  COUNT(rl._id) as limit_count,
  COUNT(*) FILTER (WHERE rl.is_enabled) as enabled_limits,
  COUNT(*) FILTER (WHERE rl.resource_type = 'api') as api_limits,
  COUNT(*) FILTER (WHERE rl.resource_type = 'storage') as storage_limits,
  COUNT(*) FILTER (WHERE rl.resource_type = 'database') as db_limits,
  COUNT(*) FILTER (WHERE rl.resource_type = 'email') as email_limits,
  COUNT(*) FILTER (WHERE rl.alert_enabled) as alert_enabled_count,
  SUM(rl.exceeded_count) as total_exceeded,
  AVG(rl.current_usage) as avg_usage,
  AVG(rl.peak_usage) as avg_peak_usage
FROM tenant_rate_limits rl
JOIN tenants t ON t._id = rl.tenant_id
GROUP BY t._id, t.name
ORDER BY limit_count DESC
LIMIT 10;

-- Rate limits with package association
SELECT 
  COUNT(*) FILTER (WHERE service_package_id IS NOT NULL) as with_package,
  COUNT(*) FILTER (WHERE service_package_id IS NULL) as without_package,
  ROUND(COUNT(*) FILTER (WHERE service_package_id IS NOT NULL) * 100.0 / COUNT(*), 2) as package_percentage
FROM tenant_rate_limits;

-- Rate limits by alert status
SELECT 
  alert_enabled,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM tenant_rate_limits
GROUP BY alert_enabled;

-- Rate limits exceeded
SELECT 
  COUNT(*) FILTER (WHERE exceeded_count > 0) as exceeded_at_least_once,
  COUNT(*) FILTER (WHERE exceeded_count >= 5) as exceeded_frequently,
  AVG(exceeded_count) FILTER (WHERE exceeded_count > 0) as avg_exceeded_count,
  MAX(exceeded_count) as max_exceeded_count
FROM tenant_rate_limits;

-- Top rate limits by usage
SELECT 
  t.name as tenant_name,
  rl.limit_name,
  rl.resource_type,
  rl.max_requests,
  rl.time_window,
  rl.window_unit,
  rl.current_usage,
  rl.peak_usage,
  rl.exceeded_count,
  rl.last_exceeded_at,
  ROUND(rl.current_usage * 100.0 / rl.max_requests, 2) as usage_percentage
FROM tenant_rate_limits rl
JOIN tenants t ON t._id = rl.tenant_id
WHERE rl.current_usage > 0
ORDER BY rl.current_usage DESC
LIMIT 20;

-- Verify
SELECT 
  COUNT(*) as total_limits,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  COUNT(DISTINCT service_package_id) as unique_packages,
  COUNT(*) FILTER (WHERE is_enabled) as enabled,
  COUNT(*) FILTER (WHERE NOT is_enabled) as disabled,
  COUNT(*) FILTER (WHERE is_strict) as strict,
  COUNT(*) FILTER (WHERE alert_enabled) as alerts_enabled,
  COUNT(*) FILTER (WHERE burst_limit IS NOT NULL) as with_burst,
  COUNT(*) FILTER (WHERE concurrent_limit IS NOT NULL) as with_concurrent,
  COUNT(*) FILTER (WHERE endpoint_pattern IS NOT NULL) as with_endpoint,
  ROUND(AVG(max_requests), 2) as avg_max_requests,
  ROUND(AVG(time_window), 2) as avg_time_window,
  SUM(current_usage) as total_current_usage,
  SUM(peak_usage) as total_peak_usage,
  SUM(exceeded_count) as total_exceeded
FROM tenant_rate_limits;

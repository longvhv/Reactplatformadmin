-- ============================================
-- WEBHOOKS TABLE
-- Quản lý webhook endpoints cho tenants
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS webhooks CASCADE;

-- Create webhooks table
CREATE TABLE webhooks (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant reference
  tenant_id UUID NOT NULL REFERENCES tenants(_id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Endpoint configuration
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'POST',
  
  -- Event subscription
  event_types TEXT[] NOT NULL DEFAULT '{}', -- ['user.created', 'order.placed', etc.]
  event_filter JSONB, -- Additional event filtering rules
  
  -- Security
  secret_key TEXT, -- For signature verification
  auth_type VARCHAR(50) DEFAULT 'none', -- none, basic, bearer, api_key
  auth_config JSONB, -- Auth credentials/tokens
  
  -- Request configuration
  headers JSONB DEFAULT '{}', -- Custom headers
  timeout_ms INTEGER DEFAULT 5000,
  
  -- Retry configuration
  retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay": 1000, "backoff_multiplier": 2}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE, -- Verified via challenge
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  
  -- Statistics
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  
  -- Configuration
  batch_size INTEGER, -- For batch events
  rate_limit INTEGER, -- Max requests per minute
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CHECK (method IN ('POST', 'GET', 'PUT', 'PATCH', 'DELETE')),
  CHECK (auth_type IN ('none', 'basic', 'bearer', 'api_key', 'oauth2')),
  CHECK (timeout_ms > 0 AND timeout_ms <= 60000),
  CHECK (success_count >= 0),
  CHECK (failure_count >= 0),
  CHECK (total_count >= 0),
  CHECK (total_count = success_count + failure_count),
  CHECK (priority >= 0),
  CHECK (batch_size IS NULL OR batch_size > 0),
  CHECK (rate_limit IS NULL OR rate_limit > 0),
  CHECK (array_length(event_types, 1) > 0)
);

-- Indexes for performance
CREATE INDEX idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX idx_webhooks_event_types ON webhooks USING GIN(event_types);
CREATE INDEX idx_webhooks_is_verified ON webhooks(is_verified);
CREATE INDEX idx_webhooks_priority ON webhooks(priority DESC);
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at DESC);

-- Composite indexes
CREATE INDEX idx_webhooks_tenant_active ON webhooks(tenant_id, is_active);
CREATE INDEX idx_webhooks_tenant_verified ON webhooks(tenant_id, is_verified);

-- GIN index for tags
CREATE INDEX idx_webhooks_tags ON webhooks USING GIN(tags);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON webhooks FOR ALL 
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  tenant_ids UUID[];
  webhook_count INTEGER;
  tenant_id UUID;
  i INTEGER;
  
  -- Event types
  all_event_types TEXT[] := ARRAY[
    'user.created', 'user.updated', 'user.deleted',
    'order.created', 'order.updated', 'order.completed', 'order.cancelled',
    'payment.succeeded', 'payment.failed', 'payment.refunded',
    'subscription.created', 'subscription.updated', 'subscription.cancelled',
    'invoice.created', 'invoice.paid', 'invoice.overdue',
    'tenant.created', 'tenant.updated', 'tenant.suspended',
    'notification.sent', 'notification.failed',
    'auth.login', 'auth.logout', 'auth.failed'
  ];
  
  webhook_names TEXT[] := ARRAY[
    'Production Webhook', 'Staging Webhook', 'Development Webhook',
    'Order Notifications', 'Payment Processor', 'User Events',
    'Subscription Events', 'Invoice Events', 'Auth Events',
    'Analytics Webhook', 'Slack Notifications', 'Email Triggers',
    'Backup Webhook', 'Logging Service', 'Monitoring Alert'
  ];
  
  domains TEXT[] := ARRAY[
    'webhook.example.com', 'api.example.com', 'events.example.com',
    'hooks.company.com', 'notifications.service.io', 'events.platform.io'
  ];
  
BEGIN
  -- Get real tenant IDs
  SELECT ARRAY(SELECT _id FROM tenants LIMIT 20) INTO tenant_ids;
  
  IF array_length(tenant_ids, 1) IS NULL OR array_length(tenant_ids, 1) = 0 THEN
    RAISE NOTICE 'No tenants found. Skipping demo data.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Creating webhooks for % tenants', array_length(tenant_ids, 1);
  
  webhook_count := 0;
  
  -- Create webhooks for each tenant
  FOREACH tenant_id IN ARRAY tenant_ids LOOP
    
    -- Each tenant gets 3-7 webhooks
    FOR i IN 1..floor(3 + random() * 5)::INTEGER LOOP
      DECLARE
        selected_events TEXT[];
        num_events INTEGER;
        j INTEGER;
        event_idx INTEGER;
      BEGIN
        -- Select random events (2-5 events per webhook)
        num_events := 2 + floor(random() * 4)::INTEGER;
        selected_events := ARRAY[]::TEXT[];
        
        FOR j IN 1..num_events LOOP
          event_idx := 1 + floor(random() * array_length(all_event_types, 1))::INTEGER;
          IF NOT (all_event_types[event_idx] = ANY(selected_events)) THEN
            selected_events := array_append(selected_events, all_event_types[event_idx]);
          END IF;
        END LOOP;
        
        -- Ensure at least one event
        IF array_length(selected_events, 1) IS NULL OR array_length(selected_events, 1) = 0 THEN
          selected_events := ARRAY[all_event_types[1 + floor(random() * array_length(all_event_types, 1))::INTEGER]];
        END IF;
        
        INSERT INTO webhooks (
          tenant_id, name, description, url, method,
          event_types, event_filter,
          secret_key, auth_type, auth_config,
          headers, timeout_ms, retry_config,
          is_active, is_verified, verified_at,
          last_triggered_at, last_success_at, last_failure_at,
          success_count, failure_count, total_count,
          avg_response_time_ms,
          batch_size, rate_limit, priority,
          tags, metadata
        ) VALUES (
          tenant_id,
          webhook_names[1 + floor(random() * array_length(webhook_names, 1))],
          CASE 
            WHEN random() < 0.7 THEN 'Webhook for ' || array_to_string(selected_events, ', ')
            ELSE NULL
          END,
          'https://' || domains[1 + floor(random() * array_length(domains, 1))] || '/webhooks/' || substring(md5(random()::text) from 1 for 8),
          (ARRAY['POST', 'POST', 'POST', 'POST', 'PUT', 'PATCH'])[1 + floor(random() * 6)], -- 66% POST
          selected_events,
          CASE 
            WHEN random() < 0.3 THEN 
              jsonb_build_object(
                'status', (ARRAY['active', 'completed', 'pending'])[1 + floor(random() * 3)],
                'priority', (ARRAY['high', 'normal', 'low'])[1 + floor(random() * 3)]
              )
            ELSE NULL
          END,
          -- secret_key (80% have)
          CASE WHEN random() < 0.8 THEN 'whsec_' || substring(md5(random()::text) from 1 for 32) ELSE NULL END,
          -- auth_type
          CASE 
            WHEN random() < 0.5 THEN 'none'
            WHEN random() < 0.75 THEN 'bearer'
            WHEN random() < 0.9 THEN 'api_key'
            ELSE 'basic'
          END,
          -- auth_config
          CASE 
            WHEN random() < 0.5 THEN 
              jsonb_build_object('token', 'sk_' || substring(md5(random()::text) from 1 for 24))
            ELSE NULL
          END,
          -- headers
          jsonb_build_object(
            'Content-Type', 'application/json',
            'User-Agent', 'VHV-Webhook/1.0',
            'X-Custom-Header', CASE WHEN random() < 0.3 THEN 'custom-value' ELSE NULL END
          ),
          -- timeout_ms (3000-10000)
          3000 + floor(random() * 7000)::INTEGER,
          -- retry_config
          jsonb_build_object(
            'max_retries', CASE 
              WHEN random() < 0.5 THEN 3
              WHEN random() < 0.8 THEN 5
              ELSE 10
            END,
            'retry_delay', CASE 
              WHEN random() < 0.5 THEN 1000
              WHEN random() < 0.8 THEN 2000
              ELSE 5000
            END,
            'backoff_multiplier', CASE 
              WHEN random() < 0.7 THEN 2
              ELSE 1.5
            END
          ),
          -- is_active (85% active)
          random() < 0.85,
          -- is_verified (70% verified)
          random() < 0.7,
          -- verified_at
          CASE WHEN random() < 0.7 THEN NOW() - (random() * INTERVAL '30 days') ELSE NULL END,
          -- last_triggered_at
          CASE WHEN random() < 0.8 THEN NOW() - (random() * INTERVAL '7 days') ELSE NULL END,
          -- last_success_at
          CASE WHEN random() < 0.7 THEN NOW() - (random() * INTERVAL '7 days') ELSE NULL END,
          -- last_failure_at
          CASE WHEN random() < 0.4 THEN NOW() - (random() * INTERVAL '7 days') ELSE NULL END,
          -- success_count (0-500)
          floor(random() * 500)::INTEGER,
          -- failure_count (0-50)
          floor(random() * 50)::INTEGER,
          -- total_count (success + failure)
          0, -- Will be calculated below
          -- avg_response_time_ms (100-2000)
          100 + floor(random() * 1900)::INTEGER,
          -- batch_size (30% have)
          CASE WHEN random() < 0.3 THEN 10 + floor(random() * 90)::INTEGER ELSE NULL END,
          -- rate_limit (40% have)
          CASE WHEN random() < 0.4 THEN 60 + floor(random() * 240)::INTEGER ELSE NULL END,
          -- priority (0-10)
          floor(random() * 11)::INTEGER,
          -- tags
          ARRAY(
            SELECT tag FROM unnest(ARRAY[
              'production', 'staging', 'development',
              'critical', 'normal', 'low',
              'payments', 'orders', 'users',
              'notifications', 'analytics', 'monitoring'
            ]) tag
            WHERE random() < 0.3
          ),
          -- metadata
          jsonb_build_object(
            'environment', (ARRAY['production', 'staging', 'development'])[1 + floor(random() * 3)],
            'version', '1.0.' || floor(random() * 10)::TEXT,
            'owner', (ARRAY['backend-team', 'frontend-team', 'devops-team'])[1 + floor(random() * 3)]
          )
        );
        
        webhook_count := webhook_count + 1;
        
      EXCEPTION
        WHEN others THEN 
          RAISE NOTICE 'Error creating webhook: %', SQLERRM;
      END;
    END LOOP;
    
  END LOOP;
  
  -- Update total_count = success_count + failure_count
  UPDATE webhooks 
  SET total_count = success_count + failure_count
  WHERE total_count = 0;
  
  RAISE NOTICE 'Created % webhooks', webhook_count;
END $$;

-- ============================================
-- STATISTICS & VERIFICATION
-- ============================================

-- Summary by method
SELECT 
  method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhooks
GROUP BY method
ORDER BY count DESC;

-- Summary by auth_type
SELECT 
  auth_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhooks
GROUP BY auth_type
ORDER BY count DESC;

-- Active vs Inactive
SELECT 
  is_active,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhooks
GROUP BY is_active;

-- Verified vs Unverified
SELECT 
  is_verified,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM webhooks
GROUP BY is_verified;

-- Top event types
SELECT 
  event_type,
  COUNT(*) as count
FROM webhooks, unnest(event_types) as event_type
GROUP BY event_type
ORDER BY count DESC
LIMIT 10;

-- Top tenants by webhook count
SELECT 
  t.name as tenant_name,
  COUNT(w._id) as webhook_count,
  COUNT(*) FILTER (WHERE w.is_active) as active_webhooks,
  COUNT(*) FILTER (WHERE w.is_verified) as verified_webhooks,
  SUM(w.total_count) as total_triggers,
  SUM(w.success_count) as total_success,
  SUM(w.failure_count) as total_failures,
  ROUND(AVG(w.success_count) * 100.0 / NULLIF(AVG(w.total_count), 0), 2) as avg_success_rate
FROM webhooks w
JOIN tenants t ON t._id = w.tenant_id
GROUP BY t._id, t.name
ORDER BY webhook_count DESC
LIMIT 10;

-- Webhooks with most triggers
SELECT 
  t.name as tenant_name,
  w.name as webhook_name,
  w.url,
  w.total_count,
  w.success_count,
  w.failure_count,
  ROUND(w.success_count * 100.0 / NULLIF(w.total_count, 0), 2) as success_rate,
  w.avg_response_time_ms,
  w.last_triggered_at
FROM webhooks w
JOIN tenants t ON t._id = w.tenant_id
WHERE w.total_count > 0
ORDER BY w.total_count DESC
LIMIT 20;

-- Webhooks with failures
SELECT 
  COUNT(*) FILTER (WHERE failure_count > 0) as with_failures,
  COUNT(*) FILTER (WHERE failure_count >= 10) as high_failure,
  AVG(failure_count) FILTER (WHERE failure_count > 0) as avg_failure_count,
  MAX(failure_count) as max_failure_count
FROM webhooks;

-- Response time statistics
SELECT 
  MIN(avg_response_time_ms) as min_response_time,
  MAX(avg_response_time_ms) as max_response_time,
  ROUND(AVG(avg_response_time_ms), 2) as avg_response_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_response_time_ms) as median_response_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY avg_response_time_ms) as p95_response_time
FROM webhooks
WHERE avg_response_time_ms IS NOT NULL;

-- Verify
SELECT 
  COUNT(*) as total_webhooks,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  COUNT(*) FILTER (WHERE is_active) as active,
  COUNT(*) FILTER (WHERE NOT is_active) as inactive,
  COUNT(*) FILTER (WHERE is_verified) as verified,
  COUNT(*) FILTER (WHERE NOT is_verified) as unverified,
  COUNT(*) FILTER (WHERE secret_key IS NOT NULL) as with_secret,
  COUNT(*) FILTER (WHERE batch_size IS NOT NULL) as with_batch,
  COUNT(*) FILTER (WHERE rate_limit IS NOT NULL) as with_rate_limit,
  SUM(total_count) as total_triggers,
  SUM(success_count) as total_success,
  SUM(failure_count) as total_failures,
  ROUND(AVG(success_count) * 100.0 / NULLIF(AVG(total_count), 0), 2) as avg_success_rate,
  ROUND(AVG(avg_response_time_ms), 2) as avg_response_time
FROM webhooks;

-- ============================================
-- AUTH LOGS TABLE
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS auth_logs CASCADE;

-- Create auth_logs table
CREATE TABLE auth_logs (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(_id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'login_failed', 'password_reset', 'signup', etc.
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'blocked'
  ip_address INET,
  user_agent TEXT,
  browser VARCHAR(100),
  os VARCHAR(100),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet', 'other'
  location VARCHAR(255),
  country_code VARCHAR(10),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_tenant_id ON auth_logs(tenant_id);
CREATE INDEX idx_auth_logs_action ON auth_logs(action);
CREATE INDEX idx_auth_logs_status ON auth_logs(status);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX idx_auth_logs_ip ON auth_logs(ip_address);

-- Enable RLS
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON auth_logs FOR ALL 
  USING (true);

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  user_record RECORD;
  tenant_record RECORD;
  log_count INTEGER;
  action_type TEXT;
  status_type TEXT;
  rand_val FLOAT;
  time_offset INTERVAL;
  browser_list TEXT[] := ARRAY['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120', 'Opera 105'];
  os_list TEXT[] := ARRAY['Windows 11', 'macOS Sonoma', 'Ubuntu 22.04', 'iOS 17', 'Android 14'];
  device_list TEXT[] := ARRAY['desktop', 'mobile', 'tablet', 'desktop'];
  location_list TEXT[] := ARRAY[
    'Ho Chi Minh City, Vietnam', 
    'Hanoi, Vietnam', 
    'Da Nang, Vietnam',
    'Singapore',
    'Tokyo, Japan',
    'Bangkok, Thailand'
  ];
  action_list TEXT[] := ARRAY['login', 'logout', 'login_failed', 'password_reset', 'token_refresh'];
BEGIN
  -- Loop through first 10 users
  FOR user_record IN 
    SELECT u._id, u.email, ut.tenant_id 
    FROM users u
    LEFT JOIN tenant_members ut ON ut.user_id = u._id
    ORDER BY u.created_at 
    LIMIT 10
  LOOP
    log_count := 0;
    
    -- Generate 15-30 logs per user
    FOR i IN 1..(15 + floor(random() * 16)::int) LOOP
      rand_val := random();
      time_offset := (random() * 30)::int * INTERVAL '1 day' + 
                     (random() * 24)::int * INTERVAL '1 hour' + 
                     (random() * 60)::int * INTERVAL '1 minute';
      
      -- Pick random action
      IF rand_val < 0.6 THEN
        action_type := 'login';
        status_type := 'success';
      ELSIF rand_val < 0.75 THEN
        action_type := 'logout';
        status_type := 'success';
      ELSIF rand_val < 0.85 THEN
        action_type := 'login_failed';
        status_type := 'failed';
      ELSIF rand_val < 0.95 THEN
        action_type := 'token_refresh';
        status_type := 'success';
      ELSE
        action_type := 'password_reset';
        status_type := 'success';
      END IF;
      
      INSERT INTO auth_logs (
        user_id,
        tenant_id,
        action,
        status,
        ip_address,
        user_agent,
        browser,
        os,
        device_type,
        location,
        country_code,
        error_message,
        metadata,
        created_at
      ) VALUES (
        user_record._id,
        user_record.tenant_id,
        action_type,
        status_type,
        ('192.168.' || floor(random() * 255) || '.' || floor(random() * 255))::inet,
        'Mozilla/5.0 (' || os_list[1 + floor(random() * array_length(os_list, 1))::int] || ')',
        browser_list[1 + floor(random() * array_length(browser_list, 1))::int],
        os_list[1 + floor(random() * array_length(os_list, 1))::int],
        device_list[1 + floor(random() * array_length(device_list, 1))::int],
        location_list[1 + floor(random() * array_length(location_list, 1))::int],
        CASE 
          WHEN random() < 0.7 THEN 'VN'
          WHEN random() < 0.5 THEN 'SG'
          WHEN random() < 0.3 THEN 'JP'
          ELSE 'TH'
        END,
        CASE 
          WHEN status_type = 'failed' THEN 'Invalid credentials'
          ELSE NULL
        END,
        jsonb_build_object(
          'session_id', 'sess_' || md5(random()::text),
          'login_method', CASE WHEN random() < 0.8 THEN 'password' ELSE 'oauth' END
        ),
        NOW() - time_offset
      );
      
      log_count := log_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % auth logs for user %', log_count, user_record.email;
  END LOOP;
  
  -- Also create some logs without user_id (failed login attempts)
  FOR i IN 1..20 LOOP
    time_offset := (random() * 7)::int * INTERVAL '1 day' + 
                   (random() * 24)::int * INTERVAL '1 hour';
    
    INSERT INTO auth_logs (
      user_id,
      tenant_id,
      action,
      status,
      ip_address,
      user_agent,
      browser,
      os,
      device_type,
      location,
      country_code,
      error_message,
      created_at
    ) VALUES (
      NULL,
      NULL,
      'login_failed',
      'failed',
      ('203.162.' || floor(random() * 255) || '.' || floor(random() * 255))::inet,
      'Mozilla/5.0 (' || os_list[1 + floor(random() * array_length(os_list, 1))::int] || ')',
      browser_list[1 + floor(random() * array_length(browser_list, 1))::int],
      os_list[1 + floor(random() * array_length(os_list, 1))::int],
      device_list[1 + floor(random() * array_length(device_list, 1))::int],
      location_list[1 + floor(random() * array_length(location_list, 1))::int],
      CASE 
        WHEN random() < 0.3 THEN 'VN'
        ELSE 'US'
      END,
      'User not found',
      NOW() - time_offset
    );
  END LOOP;
  
  RAISE NOTICE 'Created 20 failed login attempts without user';
END $$;

-- Summary by action
SELECT 
  action,
  status,
  COUNT(*) as count
FROM auth_logs
GROUP BY action, status
ORDER BY count DESC;

-- Summary by user
SELECT 
  u.email,
  COUNT(al._id) as total_logs,
  COUNT(al._id) FILTER (WHERE al.action = 'login' AND al.status = 'success') as successful_logins,
  COUNT(al._id) FILTER (WHERE al.action = 'login_failed') as failed_logins
FROM users u
LEFT JOIN auth_logs al ON al.user_id = u._id
GROUP BY u._id, u.email
ORDER BY total_logs DESC
LIMIT 10;

-- Verify
SELECT 
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as oldest_log,
  MAX(created_at) as newest_log
FROM auth_logs;

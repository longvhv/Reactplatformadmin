-- ============================================
-- USER SESSIONS TABLE
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Create user_sessions table
CREATE TABLE user_sessions (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet', 'other'
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON user_sessions FOR ALL 
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_updated_at();

-- ============================================
-- DEMO DATA
-- ============================================

-- Get first 5 users for demo
DO $$
DECLARE
  user_record RECORD;
  session_count INTEGER;
BEGIN
  -- Loop through first 5 users
  FOR user_record IN 
    SELECT _id, email FROM users ORDER BY created_at LIMIT 5
  LOOP
    session_count := 0;
    
    -- Active desktop session
    INSERT INTO user_sessions (
      user_id, session_token, device_name, device_type, browser, os,
      ip_address, location, is_active, last_activity_at, expires_at
    ) VALUES (
      user_record._id,
      'sess_' || md5(random()::text || user_record._id::text || '1'),
      'MacBook Pro',
      'desktop',
      'Chrome 120',
      'macOS Sonoma',
      '192.168.1.10',
      'Ho Chi Minh City, Vietnam',
      true,
      NOW() - INTERVAL '5 minutes',
      NOW() + INTERVAL '7 days'
    );
    session_count := session_count + 1;
    
    -- Active mobile session
    INSERT INTO user_sessions (
      user_id, session_token, device_name, device_type, browser, os,
      ip_address, location, is_active, last_activity_at, expires_at
    ) VALUES (
      user_record._id,
      'sess_' || md5(random()::text || user_record._id::text || '2'),
      'iPhone 15 Pro',
      'mobile',
      'Safari Mobile',
      'iOS 17',
      '192.168.1.20',
      'Ho Chi Minh City, Vietnam',
      true,
      NOW() - INTERVAL '2 hours',
      NOW() + INTERVAL '30 days'
    );
    session_count := session_count + 1;
    
    -- Inactive/Locked session
    IF (random() > 0.3) THEN
      INSERT INTO user_sessions (
        user_id, session_token, device_name, device_type, browser, os,
        ip_address, location, is_active, last_activity_at, expires_at
      ) VALUES (
        user_record._id,
        'sess_' || md5(random()::text || user_record._id::text || '3'),
        'Windows PC',
        'desktop',
        'Firefox 121',
        'Windows 11',
        '203.162.10.5',
        'Hanoi, Vietnam',
        false,
        NOW() - INTERVAL '3 days',
        NOW() + INTERVAL '7 days'
      );
      session_count := session_count + 1;
    END IF;
    
    -- Old expired session
    IF (random() > 0.5) THEN
      INSERT INTO user_sessions (
        user_id, session_token, device_name, device_type, browser, os,
        ip_address, location, is_active, last_activity_at, expires_at
      ) VALUES (
        user_record._id,
        'sess_' || md5(random()::text || user_record._id::text || '4'),
        'iPad',
        'tablet',
        'Safari',
        'iPadOS 17',
        '192.168.1.30',
        'Da Nang, Vietnam',
        false,
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '8 days'
      );
      session_count := session_count + 1;
    END IF;
    
    RAISE NOTICE 'Created % sessions for user %', session_count, user_record.email;
  END LOOP;
END $$;

-- Summary
SELECT 
  u.email,
  COUNT(s._id) as total_sessions,
  COUNT(s._id) FILTER (WHERE s.is_active = true) as active_sessions,
  COUNT(s._id) FILTER (WHERE s.is_active = false) as inactive_sessions
FROM users u
LEFT JOIN user_sessions s ON s.user_id = u._id
GROUP BY u._id, u.email
ORDER BY u.created_at
LIMIT 10;

-- Verify
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_sessions,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_sessions
FROM user_sessions;

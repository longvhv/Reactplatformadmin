-- ============================================
-- USER DEVICES TABLE
-- Quản lý thiết bị đã đăng nhập của users
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS user_devices CASCADE;

-- Create user_devices table
CREATE TABLE user_devices (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  
  -- Device identification
  device_type VARCHAR(50) NOT NULL, -- desktop, mobile, tablet, watch, tv, other
  device_name VARCHAR(255), -- User-friendly name: "MacBook Pro", "iPhone 14"
  device_model VARCHAR(255), -- Technical model: "MacBookPro18,1", "iPhone15,2"
  manufacturer VARCHAR(100), -- Apple, Samsung, Google, Dell, etc.
  
  -- Operating System
  os VARCHAR(50), -- windows, macos, linux, ios, android, other
  os_version VARCHAR(100),
  
  -- Browser/App
  browser VARCHAR(50), -- chrome, firefox, safari, edge, opera, brave, other
  browser_version VARCHAR(100),
  app_name VARCHAR(100), -- Mobile app name
  app_version VARCHAR(50),
  
  -- Network & Location
  ip_address INET,
  user_agent TEXT,
  location JSONB DEFAULT '{}', -- {city, country, region, lat, lng}
  
  -- Security
  is_trusted BOOLEAN DEFAULT FALSE,
  fingerprint VARCHAR(255), -- Device fingerprint for tracking
  push_token TEXT, -- For push notifications
  
  -- Usage tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  
  -- Revocation
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'watch', 'tv', 'other')),
  CHECK (os IN ('windows', 'macos', 'linux', 'ios', 'android', 'chromeos', 'other')),
  CHECK (browser IN ('chrome', 'firefox', 'safari', 'edge', 'opera', 'brave', 'samsung', 'other')),
  CHECK (status IN ('active', 'inactive', 'blocked', 'revoked')),
  CHECK (last_used_at >= first_seen_at)
);

-- Indexes for performance
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_status ON user_devices(status);
CREATE INDEX idx_user_devices_device_type ON user_devices(device_type);
CREATE INDEX idx_user_devices_os ON user_devices(os);
CREATE INDEX idx_user_devices_last_used_at ON user_devices(last_used_at);
CREATE INDEX idx_user_devices_is_trusted ON user_devices(is_trusted);
CREATE INDEX idx_user_devices_ip_address ON user_devices(ip_address);

-- Composite indexes
CREATE INDEX idx_user_devices_user_status ON user_devices(user_id, status);
CREATE INDEX idx_user_devices_user_last_used ON user_devices(user_id, last_used_at DESC);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON user_devices FOR ALL 
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_devices_updated_at
  BEFORE UPDATE ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_devices_updated_at();

-- Function to auto-mark inactive devices
CREATE OR REPLACE FUNCTION mark_inactive_devices()
RETURNS void AS $$
BEGIN
  UPDATE user_devices
  SET status = 'inactive'
  WHERE status = 'active'
    AND last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  user_ids UUID[];
  device_count INTEGER;
  user_id UUID;
  i INTEGER;
  j INTEGER;
  
  device_types VARCHAR[] := ARRAY['desktop', 'mobile', 'tablet', 'watch'];
  
  -- Desktop configs
  desktop_os VARCHAR[] := ARRAY['windows', 'macos', 'linux'];
  desktop_browsers VARCHAR[] := ARRAY['chrome', 'firefox', 'safari', 'edge', 'brave'];
  desktop_models VARCHAR[] := ARRAY['MacBook Pro', 'MacBook Air', 'iMac', 'Dell XPS 15', 'ThinkPad X1', 'Surface Laptop'];
  desktop_manufacturers VARCHAR[] := ARRAY['Apple', 'Dell', 'Lenovo', 'Microsoft', 'HP'];
  
  -- Mobile configs
  mobile_os VARCHAR[] := ARRAY['ios', 'android'];
  mobile_browsers VARCHAR[] := ARRAY['safari', 'chrome', 'samsung', 'firefox'];
  mobile_models VARCHAR[] := ARRAY['iPhone 15 Pro', 'iPhone 14', 'iPhone 13', 'Galaxy S23', 'Galaxy S22', 'Pixel 8', 'Pixel 7'];
  mobile_manufacturers VARCHAR[] := ARRAY['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus'];
  
  -- Tablet configs
  tablet_models VARCHAR[] := ARRAY['iPad Pro', 'iPad Air', 'Galaxy Tab S9', 'Surface Pro'];
  
  -- Locations
  cities VARCHAR[] := ARRAY['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  countries VARCHAR[] := ARRAY['Vietnam', 'Vietnam', 'Vietnam', 'Vietnam', 'Vietnam'];
  
  device_type VARCHAR;
  os_choice VARCHAR;
  browser_choice VARCHAR;
  model_choice VARCHAR;
  manufacturer_choice VARCHAR;
  
BEGIN
  -- Get real user IDs
  SELECT ARRAY(SELECT _id FROM users LIMIT 30) INTO user_ids;
  
  IF array_length(user_ids, 1) IS NULL OR array_length(user_ids, 1) = 0 THEN
    RAISE NOTICE 'No users found. Skipping demo data.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Creating user devices for % users', array_length(user_ids, 1);
  
  device_count := 0;
  
  -- Create devices for each user (1-4 devices per user)
  FOREACH user_id IN ARRAY user_ids LOOP
    FOR i IN 1..(1 + floor(random() * 3))::INTEGER LOOP
      
      device_type := device_types[1 + floor(random() * array_length(device_types, 1))];
      
      -- Set configs based on device type
      IF device_type = 'desktop' THEN
        os_choice := desktop_os[1 + floor(random() * array_length(desktop_os, 1))];
        browser_choice := desktop_browsers[1 + floor(random() * array_length(desktop_browsers, 1))];
        model_choice := desktop_models[1 + floor(random() * array_length(desktop_models, 1))];
        manufacturer_choice := desktop_manufacturers[1 + floor(random() * array_length(desktop_manufacturers, 1))];
        
      ELSIF device_type IN ('mobile', 'tablet') THEN
        os_choice := mobile_os[1 + floor(random() * array_length(mobile_os, 1))];
        browser_choice := mobile_browsers[1 + floor(random() * array_length(mobile_browsers, 1))];
        
        IF device_type = 'mobile' THEN
          model_choice := mobile_models[1 + floor(random() * array_length(mobile_models, 1))];
        ELSE
          model_choice := tablet_models[1 + floor(random() * array_length(tablet_models, 1))];
        END IF;
        
        manufacturer_choice := mobile_manufacturers[1 + floor(random() * array_length(mobile_manufacturers, 1))];
        
      ELSE -- watch
        os_choice := 'other';
        browser_choice := 'other';
        model_choice := 'Apple Watch';
        manufacturer_choice := 'Apple';
      END IF;
      
      BEGIN
        INSERT INTO user_devices (
          user_id,
          device_type,
          device_name,
          device_model,
          manufacturer,
          os,
          os_version,
          browser,
          browser_version,
          app_name,
          app_version,
          ip_address,
          user_agent,
          location,
          is_trusted,
          fingerprint,
          push_token,
          first_seen_at,
          last_used_at,
          login_count,
          status,
          metadata
        ) VALUES (
          user_id,
          device_type,
          model_choice,
          model_choice || ' Model-' || floor(random() * 1000),
          manufacturer_choice,
          -- OS
          os_choice,
          CASE 
            WHEN os_choice = 'windows' THEN '11.0'
            WHEN os_choice = 'macos' THEN '14.' || floor(random() * 5)
            WHEN os_choice = 'linux' THEN 'Ubuntu 22.04'
            WHEN os_choice = 'ios' THEN '17.' || floor(random() * 5)
            WHEN os_choice = 'android' THEN '14.0'
            ELSE 'Unknown'
          END,
          -- Browser
          browser_choice,
          floor(random() * 30 + 100) || '.0.' || floor(random() * 9000 + 1000) || '.' || floor(random() * 200),
          -- App
          CASE 
            WHEN device_type IN ('mobile', 'tablet') THEN 'VHP Mobile App'
            ELSE NULL
          END,
          CASE 
            WHEN device_type IN ('mobile', 'tablet') THEN '2.' || floor(random() * 10) || '.' || floor(random() * 100)
            ELSE NULL
          END,
          -- IP
          ('192.168.' || floor(random() * 255) || '.' || floor(random() * 255))::INET,
          -- User Agent
          'Mozilla/5.0 (' || os_choice || ') ' || browser_choice || '/' || floor(random() * 100),
          -- Location
          jsonb_build_object(
            'city', cities[1 + floor(random() * array_length(cities, 1))],
            'country', 'Vietnam',
            'region', 'Asia/Ho_Chi_Minh',
            'lat', 10.0 + random() * 11.0,
            'lng', 105.0 + random() * 5.0
          ),
          -- Is trusted: 40% trusted
          random() < 0.4,
          -- Fingerprint
          md5(random()::text || clock_timestamp()::text),
          -- Push token (if mobile)
          CASE 
            WHEN device_type IN ('mobile', 'tablet') AND random() < 0.7 
            THEN 'token_' || md5(random()::text)
            ELSE NULL
          END,
          -- First seen: 1-180 days ago
          NOW() - (random() * INTERVAL '180 days'),
          -- Last used: 0-30 days ago
          NOW() - (random() * INTERVAL '30 days'),
          -- Login count
          1 + floor(random() * 100)::INTEGER,
          -- Status: 85% active, 10% inactive, 5% blocked
          CASE 
            WHEN random() < 0.85 THEN 'active'
            WHEN random() < 0.95 THEN 'inactive'
            ELSE 'blocked'
          END,
          -- Metadata
          jsonb_build_object(
            'screen_resolution', CASE device_type
              WHEN 'desktop' THEN '1920x1080'
              WHEN 'mobile' THEN '390x844'
              WHEN 'tablet' THEN '1024x1366'
              ELSE '320x480'
            END,
            'timezone', 'Asia/Ho_Chi_Minh',
            'language', 'vi-VN',
            'connection_type', CASE 
              WHEN random() < 0.5 THEN 'wifi'
              ELSE '4g'
            END
          )
        );
        
        device_count := device_count + 1;
        
      EXCEPTION
        WHEN others THEN
          -- Skip if any error
          NULL;
      END;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created % user devices', device_count;
END $$;

-- ============================================
-- STATISTICS & VERIFICATION
-- ============================================

-- Summary by device type
SELECT 
  device_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_devices
GROUP BY device_type
ORDER BY count DESC;

-- Summary by OS
SELECT 
  os,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_devices
GROUP BY os
ORDER BY count DESC;

-- Summary by status
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_devices
GROUP BY status
ORDER BY count DESC;

-- Top users by device count
SELECT 
  u.email,
  u.full_name,
  COUNT(ud._id) as device_count,
  COUNT(*) FILTER (WHERE ud.status = 'active') as active_devices,
  COUNT(*) FILTER (WHERE ud.is_trusted) as trusted_devices,
  MAX(ud.last_used_at) as last_device_used
FROM user_devices ud
JOIN users u ON u._id = ud.user_id
GROUP BY u._id, u.email, u.full_name
ORDER BY device_count DESC
LIMIT 10;

-- Trusted vs Untrusted
SELECT 
  is_trusted,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_devices
GROUP BY is_trusted;

-- Recent devices
SELECT 
  u.email,
  ud.device_type,
  ud.device_name,
  ud.os,
  ud.browser,
  ud.status,
  ud.is_trusted,
  ud.last_used_at,
  ud.login_count
FROM user_devices ud
JOIN users u ON u._id = ud.user_id
ORDER BY ud.last_used_at DESC
LIMIT 20;

-- Verify
SELECT 
  COUNT(*) as total_devices,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked,
  COUNT(*) FILTER (WHERE is_trusted) as trusted,
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile,
  COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop,
  COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet,
  ROUND(AVG(login_count), 2) as avg_login_count,
  COUNT(*) FILTER (WHERE push_token IS NOT NULL) as with_push_token
FROM user_devices;

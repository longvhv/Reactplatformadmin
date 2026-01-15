-- ============================================
-- USER CONSENTS TABLE
-- Quản lý việc user chấp nhận các điều khoản
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS user_consents CASCADE;

-- Create user_consents table
CREATE TABLE user_consents (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  legal_document_id UUID NOT NULL REFERENCES legal_documents(_id) ON DELETE CASCADE,
  
  -- Consent details
  consent_given BOOLEAN DEFAULT TRUE,
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  consent_ip VARCHAR(45), -- IPv4 or IPv6
  consent_user_agent TEXT,
  consent_method VARCHAR(50), -- web, mobile, api, email, etc.
  
  -- Document version at time of consent (snapshot)
  document_version VARCHAR(50),
  document_title VARCHAR(255),
  document_type VARCHAR(50),
  
  -- Withdrawal tracking
  withdrawn BOOLEAN DEFAULT FALSE,
  withdrawn_date TIMESTAMPTZ,
  withdrawn_reason TEXT,
  
  -- Expiry and renewal
  expires_at TIMESTAMPTZ,
  renewal_required BOOLEAN DEFAULT FALSE,
  last_renewed_at TIMESTAMPTZ,
  
  -- Source tracking
  source_application VARCHAR(100), -- Which app user consented from
  source_page VARCHAR(255), -- URL or page where consent was given
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, legal_document_id), -- One consent per user per document
  CHECK (consent_method IN ('web', 'mobile', 'api', 'email', 'signup', 'profile', 'checkout', 'other'))
);

-- Indexes for performance
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_legal_document_id ON user_consents(legal_document_id);
CREATE INDEX idx_user_consents_consent_date ON user_consents(consent_date);
CREATE INDEX idx_user_consents_withdrawn ON user_consents(withdrawn);
CREATE INDEX idx_user_consents_expires_at ON user_consents(expires_at);
CREATE INDEX idx_user_consents_consent_given ON user_consents(consent_given);

-- Enable RLS
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON user_consents FOR ALL 
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_consents_updated_at();

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  user_ids UUID[];
  doc_ids UUID[];
  consent_count INTEGER;
  current_user_id UUID;
  current_doc_id UUID;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Get real user IDs
  SELECT ARRAY(SELECT _id FROM users LIMIT 10) INTO user_ids;
  
  -- Get published legal document IDs
  SELECT ARRAY(SELECT _id FROM legal_documents WHERE status = 'published' LIMIT 8) INTO doc_ids;
  
  IF array_length(user_ids, 1) IS NULL OR array_length(doc_ids, 1) IS NULL THEN
    RAISE NOTICE 'Not enough users or legal documents. Skipping demo data.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Creating user consents for % users and % documents', array_length(user_ids, 1), array_length(doc_ids, 1);
  
  consent_count := 0;
  
  -- Loop through users
  FOR i IN 1..array_length(user_ids, 1) LOOP
    current_user_id := user_ids[i];
    
    -- Each user consents to random documents (50-100% of available docs)
    FOR j IN 1..array_length(doc_ids, 1) LOOP
      current_doc_id := doc_ids[j];
      
      -- 70% chance user has consented to this document
      IF random() < 0.7 THEN
        -- Get document details for snapshot
        DECLARE
          doc_version VARCHAR(50);
          doc_title VARCHAR(255);
          doc_type VARCHAR(50);
        BEGIN
          SELECT version, title, type INTO doc_version, doc_title, doc_type
          FROM legal_documents
          WHERE _id = current_doc_id;
          
          -- Insert consent
          INSERT INTO user_consents (
            user_id,
            legal_document_id,
            consent_given,
            consent_date,
            consent_ip,
            consent_user_agent,
            consent_method,
            document_version,
            document_title,
            document_type,
            withdrawn,
            expires_at,
            renewal_required,
            source_application,
            source_page,
            metadata
          ) VALUES (
            current_user_id,
            current_doc_id,
            true,
            -- Random date in last 6 months
            NOW() - (random() * INTERVAL '180 days'),
            -- Random IP
            CONCAT(
              floor(random() * 255)::text, '.', 
              floor(random() * 255)::text, '.', 
              floor(random() * 255)::text, '.', 
              floor(random() * 255)::text
            ),
            -- Random user agent
            CASE floor(random() * 4)
              WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
              WHEN 2 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
              ELSE 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            END,
            -- Random consent method
            CASE floor(random() * 5)
              WHEN 0 THEN 'web'
              WHEN 1 THEN 'mobile'
              WHEN 2 THEN 'signup'
              WHEN 3 THEN 'profile'
              ELSE 'checkout'
            END,
            doc_version,
            doc_title,
            doc_type,
            -- 5% chance withdrawn
            random() < 0.05,
            -- Expiry: 20% have expiry in next year
            CASE 
              WHEN random() < 0.2 THEN NOW() + (random() * INTERVAL '365 days')
              ELSE NULL
            END,
            -- 10% require renewal
            random() < 0.1,
            CASE floor(random() * 3)
              WHEN 0 THEN 'platform-web'
              WHEN 1 THEN 'platform-mobile'
              ELSE 'platform-api'
            END,
            CASE floor(random() * 4)
              WHEN 0 THEN '/signup'
              WHEN 1 THEN '/profile/settings'
              WHEN 2 THEN '/checkout'
              ELSE '/dashboard'
            END,
            jsonb_build_object(
              'browser', CASE floor(random() * 3)
                WHEN 0 THEN 'Chrome'
                WHEN 1 THEN 'Safari'
                ELSE 'Firefox'
              END,
              'device', CASE floor(random() * 3)
                WHEN 0 THEN 'desktop'
                WHEN 1 THEN 'mobile'
                ELSE 'tablet'
              END,
              'language', CASE floor(random() * 3)
                WHEN 0 THEN 'vi'
                WHEN 1 THEN 'en'
                ELSE 'ja'
              END
            )
          );
          
          consent_count := consent_count + 1;
          
        EXCEPTION
          WHEN unique_violation THEN
            -- Skip if duplicate
            NULL;
        END;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Add some withdrawn consents (update existing)
  UPDATE user_consents 
  SET 
    withdrawn = true,
    withdrawn_date = NOW() - (random() * INTERVAL '30 days'),
    withdrawn_reason = CASE floor(random() * 4)
      WHEN 0 THEN 'User requested data deletion'
      WHEN 1 THEN 'Account closure'
      WHEN 2 THEN 'Privacy concerns'
      ELSE 'No longer using service'
    END
  WHERE withdrawn = true;
  
  -- Add some renewed consents
  UPDATE user_consents 
  SET 
    last_renewed_at = NOW() - (random() * INTERVAL '60 days')
  WHERE renewal_required = true AND random() < 0.5;
  
  RAISE NOTICE 'Created % user consents', consent_count;
END $$;

-- ============================================
-- STATISTICS & VERIFICATION
-- ============================================

-- Summary by document
SELECT 
  ld.title,
  ld.type,
  COUNT(uc._id) as total_consents,
  COUNT(*) FILTER (WHERE uc.consent_given = true) as consents_given,
  COUNT(*) FILTER (WHERE uc.withdrawn = true) as withdrawn,
  COUNT(*) FILTER (WHERE uc.renewal_required = true) as requires_renewal,
  COUNT(*) FILTER (WHERE uc.expires_at IS NOT NULL AND uc.expires_at > NOW()) as with_future_expiry
FROM legal_documents ld
LEFT JOIN user_consents uc ON uc.legal_document_id = ld._id
WHERE ld.status = 'published'
GROUP BY ld._id, ld.title, ld.type
ORDER BY total_consents DESC;

-- Summary by user
SELECT 
  u.email,
  u.full_name,
  COUNT(uc._id) as total_consents,
  COUNT(*) FILTER (WHERE uc.withdrawn = false) as active_consents,
  COUNT(*) FILTER (WHERE uc.withdrawn = true) as withdrawn_consents,
  MIN(uc.consent_date) as first_consent,
  MAX(uc.consent_date) as latest_consent
FROM users u
LEFT JOIN user_consents uc ON uc.user_id = u._id
GROUP BY u._id, u.email, u.full_name
HAVING COUNT(uc._id) > 0
ORDER BY total_consents DESC
LIMIT 20;

-- Consent methods breakdown
SELECT 
  consent_method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_consents
GROUP BY consent_method
ORDER BY count DESC;

-- Recent consents
SELECT 
  u.email,
  ld.title as document,
  uc.consent_date,
  uc.consent_method,
  uc.withdrawn,
  uc.source_page
FROM user_consents uc
JOIN users u ON u._id = uc.user_id
JOIN legal_documents ld ON ld._id = uc.legal_document_id
ORDER BY uc.consent_date DESC
LIMIT 20;

-- Verify
SELECT 
  COUNT(*) as total_consents,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT legal_document_id) as unique_documents,
  COUNT(*) FILTER (WHERE consent_given = true) as consents_given,
  COUNT(*) FILTER (WHERE withdrawn = true) as withdrawn,
  COUNT(*) FILTER (WHERE renewal_required = true) as renewal_required,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as with_expiry,
  AVG(EXTRACT(EPOCH FROM (NOW() - consent_date)) / 86400)::INTEGER as avg_age_days
FROM user_consents;

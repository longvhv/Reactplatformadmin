-- ============================================
-- LEGAL DOCUMENTS TABLE
-- Quản lý điều khoản sử dụng, chính sách
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS legal_documents CASCADE;

-- Create legal_documents table
CREATE TABLE legal_documents (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- terms_of_service, privacy_policy, cookie_policy, gdpr, etc.
  version VARCHAR(50) NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL,
  summary TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, published, archived
  effective_date DATE,
  expiry_date DATE,
  tenant_id UUID REFERENCES tenants(_id) ON DELETE CASCADE, -- NULL = global
  language VARCHAR(10) DEFAULT 'vi',
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  accept_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(_id) ON DELETE SET NULL,
  published_by UUID REFERENCES users(_id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (status IN ('draft', 'published', 'archived')),
  CHECK (type IN ('terms_of_service', 'privacy_policy', 'cookie_policy', 'gdpr', 'eula', 'sla', 'dpa', 'other'))
);

-- Indexes for performance
CREATE INDEX idx_legal_documents_type ON legal_documents(type);
CREATE INDEX idx_legal_documents_status ON legal_documents(status);
CREATE INDEX idx_legal_documents_tenant_id ON legal_documents(tenant_id);
CREATE INDEX idx_legal_documents_effective_date ON legal_documents(effective_date);
CREATE INDEX idx_legal_documents_language ON legal_documents(language);
CREATE INDEX idx_legal_documents_slug ON legal_documents(slug);
CREATE INDEX idx_legal_documents_active ON legal_documents(is_active);

-- Enable RLS
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON legal_documents FOR ALL 
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_legal_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legal_documents_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_documents_updated_at();

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  admin_user_id UUID;
  tenant_ids UUID[];
  doc_count INTEGER;
BEGIN
  -- Get admin user
  SELECT _id INTO admin_user_id 
  FROM users 
  WHERE email LIKE '%admin%' 
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    SELECT _id INTO admin_user_id FROM users LIMIT 1;
  END IF;
  
  -- Get some tenant IDs
  SELECT ARRAY(SELECT _id FROM tenants LIMIT 3) INTO tenant_ids;
  
  RAISE NOTICE 'Creating legal documents with admin user: %', admin_user_id;
  
  doc_count := 0;
  
  -- Global Terms of Service (English)
  INSERT INTO legal_documents (
    title, slug, type, version, content, summary, status, 
    effective_date, language, is_active, created_by, updated_by, 
    published_by, published_at, metadata
  ) VALUES (
    'Terms of Service',
    'terms-of-service-en-v2',
    'terms_of_service',
    '2.0',
    E'# Terms of Service\n\n## 1. Acceptance of Terms\nBy accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.\n\n## 2. Use License\nPermission is granted to temporarily download one copy of the materials on the platform for personal, non-commercial transitory viewing only.\n\n## 3. Disclaimer\nThe materials on the platform are provided on an ''as is'' basis. We make no warranties, expressed or implied.\n\n## 4. Limitations\nIn no event shall our company or its suppliers be liable for any damages arising out of the use or inability to use the materials on the platform.\n\n## 5. Revisions\nWe may revise these terms of service at any time without notice. By using this platform you are agreeing to be bound by the current version of these terms.',
    'Standard terms and conditions for platform usage',
    'published',
    CURRENT_DATE - INTERVAL '30 days',
    'en',
    true,
    admin_user_id,
    admin_user_id,
    admin_user_id,
    NOW() - INTERVAL '30 days',
    jsonb_build_object(
      'last_reviewed', (NOW() - INTERVAL '15 days')::text,
      'review_frequency_months', 6,
      'applicable_regions', ARRAY['global']
    )
  );
  doc_count := doc_count + 1;
  
  -- Global Privacy Policy (Vietnamese)
  INSERT INTO legal_documents (
    title, slug, type, version, content, summary, status,
    effective_date, language, is_active, created_by, updated_by,
    published_by, published_at, metadata, view_count, accept_count
  ) VALUES (
    'Chính sách bảo mật',
    'privacy-policy-vi-v1',
    'privacy_policy',
    '1.0',
    E'# Chính sách bảo mật\n\n## 1. Thu thập thông tin\nChúng tôi thu thập thông tin cá nhân khi bạn đăng ký tài khoản, sử dụng dịch vụ, hoặc liên hệ với chúng tôi.\n\n## 2. Sử dụng thông tin\nThông tin của bạn được sử dụng để:\n- Cung cấp và cải thiện dịch vụ\n- Xử lý giao dịch\n- Gửi thông báo quan trọng\n- Phân tích và nghiên cứu\n\n## 3. Bảo vệ thông tin\nChúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ dữ liệu cá nhân của bạn.\n\n## 4. Chia sẻ thông tin\nChúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba.\n\n## 5. Quyền của bạn\nBạn có quyền truy cập, chỉnh sửa, hoặc xóa thông tin cá nhân của mình bất kỳ lúc nào.',
    'Chính sách bảo vệ dữ liệu cá nhân người dùng',
    'published',
    CURRENT_DATE - INTERVAL '60 days',
    'vi',
    true,
    admin_user_id,
    admin_user_id,
    admin_user_id,
    NOW() - INTERVAL '60 days',
    jsonb_build_object(
      'last_reviewed', (NOW() - INTERVAL '10 days')::text,
      'review_frequency_months', 12,
      'gdpr_compliant', true,
      'applicable_regions', ARRAY['Vietnam', 'EU']
    ),
    1247,
    856
  );
  doc_count := doc_count + 1;
  
  -- Cookie Policy
  INSERT INTO legal_documents (
    title, slug, type, version, content, summary, status,
    effective_date, language, is_active, created_by, updated_by,
    published_by, published_at, metadata, view_count
  ) VALUES (
    'Cookie Policy',
    'cookie-policy-en-v1',
    'cookie_policy',
    '1.0',
    E'# Cookie Policy\n\n## What are cookies?\nCookies are small text files that are placed on your computer or mobile device when you visit a website.\n\n## How we use cookies\nWe use cookies to:\n- Keep you signed in\n- Understand how you use our platform\n- Personalize your experience\n- Analyze site traffic\n\n## Types of cookies we use\n1. **Essential cookies**: Required for the platform to function\n2. **Analytics cookies**: Help us understand usage patterns\n3. **Preference cookies**: Remember your settings\n4. **Marketing cookies**: Track advertising effectiveness\n\n## Managing cookies\nYou can control cookies through your browser settings.',
    'Information about our cookie usage',
    'published',
    CURRENT_DATE - INTERVAL '90 days',
    'en',
    true,
    admin_user_id,
    admin_user_id,
    admin_user_id,
    NOW() - INTERVAL '90 days',
    jsonb_build_object(
      'cookie_categories', ARRAY['essential', 'analytics', 'preference', 'marketing'],
      'third_party_cookies', true
    ),
    543
  );
  doc_count := doc_count + 1;
  
  -- GDPR Compliance
  INSERT INTO legal_documents (
    title, slug, type, version, content, summary, status,
    effective_date, language, is_active, created_by, updated_by,
    published_by, published_at, metadata
  ) VALUES (
    'GDPR Compliance Statement',
    'gdpr-statement-en-v1',
    'gdpr',
    '1.0',
    E'# GDPR Compliance Statement\n\n## Our Commitment\nWe are committed to protecting your personal data and respecting your privacy rights under the General Data Protection Regulation (GDPR).\n\n## Your Rights\nUnder GDPR, you have the right to:\n- Access your personal data\n- Rectify inaccurate data\n- Erase your data (right to be forgotten)\n- Restrict processing\n- Data portability\n- Object to processing\n\n## Legal Basis\nWe process your data based on:\n- Your consent\n- Contract performance\n- Legal obligations\n- Legitimate interests\n\n## Data Protection Officer\nFor GDPR-related inquiries, contact our DPO at dpo@example.com',
    'GDPR compliance and data protection rights',
    'published',
    CURRENT_DATE - INTERVAL '120 days',
    'en',
    true,
    admin_user_id,
    admin_user_id,
    admin_user_id,
    NOW() - INTERVAL '120 days',
    jsonb_build_object(
      'dpo_email', 'dpo@example.com',
      'data_retention_years', 7,
      'applicable_regions', ARRAY['EU', 'EEA']
    )
  );
  doc_count := doc_count + 1;
  
  -- SLA (Service Level Agreement)
  INSERT INTO legal_documents (
    title, slug, type, version, content, summary, status,
    effective_date, expiry_date, language, is_active, created_by, updated_by,
    published_by, published_at, metadata
  ) VALUES (
    'Service Level Agreement',
    'sla-enterprise-v2',
    'sla',
    '2.0',
    E'# Service Level Agreement\n\n## Uptime Guarantee\nWe guarantee 99.9% uptime for our platform.\n\n## Response Times\n- Critical issues: 1 hour\n- High priority: 4 hours\n- Medium priority: 24 hours\n- Low priority: 72 hours\n\n## Support Channels\n- Email support: 24/7\n- Phone support: Business hours\n- Live chat: Business hours\n\n## Credits\nIf we fail to meet our SLA, you may be eligible for service credits.\n\n## Exclusions\nSLA does not cover planned maintenance or issues outside our control.',
    'Enterprise service level commitments',
    'published',
    CURRENT_DATE - INTERVAL '180 days',
    CURRENT_DATE + INTERVAL '185 days',
    'en',
    true,
    admin_user_id,
    admin_user_id,
    admin_user_id,
    NOW() - INTERVAL '180 days',
    jsonb_build_object(
      'uptime_guarantee', 99.9,
      'support_levels', ARRAY['critical', 'high', 'medium', 'low'],
      'tier', 'enterprise'
    )
  );
  doc_count := doc_count + 1;
  
  -- Draft Document (not published)
  INSERT INTO legal_documents (
    title, slug, type, version, content, summary, status,
    language, is_active, created_by, updated_by, metadata
  ) VALUES (
    'Data Processing Agreement (Draft)',
    'dpa-draft-v3',
    'dpa',
    '3.0',
    E'# Data Processing Agreement\n\n[DRAFT - Under Review]\n\nThis agreement will cover data processing terms for enterprise customers.\n\n## Sections to include:\n- Data processing scope\n- Security measures\n- Sub-processors\n- Data transfers\n- Audit rights',
    'DPA for enterprise customers - in draft',
    'draft',
    'en',
    false,
    admin_user_id,
    admin_user_id,
    jsonb_build_object(
      'draft_version', 3,
      'review_status', 'legal_review',
      'target_publish_date', (CURRENT_DATE + INTERVAL '30 days')::text
    )
  );
  doc_count := doc_count + 1;
  
  -- Tenant-specific Terms (if we have tenants)
  IF array_length(tenant_ids, 1) > 0 THEN
    INSERT INTO legal_documents (
      title, slug, type, version, content, summary, status,
      effective_date, tenant_id, language, is_active, created_by, updated_by,
      published_by, published_at, metadata
    ) VALUES (
      'Tenant-Specific Terms',
      'tenant-terms-' || tenant_ids[1]::text,
      'terms_of_service',
      '1.0',
      E'# Tenant-Specific Terms of Service\n\nThese terms apply specifically to users of this tenant organization.\n\n## Additional Terms\n- Custom billing terms\n- Specific data residency requirements\n- Custom support SLA',
      'Terms specific to this tenant',
      'published',
      CURRENT_DATE - INTERVAL '10 days',
      tenant_ids[1],
      'vi',
      true,
      admin_user_id,
      admin_user_id,
      admin_user_id,
      NOW() - INTERVAL '10 days',
      jsonb_build_object(
        'tenant_specific', true,
        'inherits_global_terms', true
      )
    );
    doc_count := doc_count + 1;
  END IF;
  
  -- Archived old version
  INSERT INTO legal_documents (
    title, slug, type, version, content, summary, status,
    effective_date, language, is_active, created_by, updated_by,
    published_by, published_at, metadata, view_count, accept_count
  ) VALUES (
    'Terms of Service (Archived)',
    'terms-of-service-en-v1',
    'terms_of_service',
    '1.0',
    E'# Terms of Service (Version 1.0 - ARCHIVED)\n\nThis is an older version of our terms of service, kept for historical records.',
    'Archived version - superseded by v2.0',
    'archived',
    CURRENT_DATE - INTERVAL '365 days',
    'en',
    false,
    admin_user_id,
    admin_user_id,
    admin_user_id,
    NOW() - INTERVAL '365 days',
    jsonb_build_object(
      'superseded_by', 'terms-of-service-en-v2',
      'archived_date', (NOW() - INTERVAL '30 days')::text
    ),
    3421,
    2876
  );
  doc_count := doc_count + 1;
  
  RAISE NOTICE 'Created % legal documents', doc_count;
END $$;

-- Summary by type
SELECT 
  type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'draft') as draft,
  COUNT(*) FILTER (WHERE status = 'archived') as archived
FROM legal_documents
GROUP BY type
ORDER BY count DESC;

-- Summary by status
SELECT 
  status,
  COUNT(*) as count,
  COUNT(DISTINCT type) as unique_types,
  SUM(view_count) as total_views,
  SUM(accept_count) as total_accepts
FROM legal_documents
GROUP BY status
ORDER BY count DESC;

-- Recent documents
SELECT 
  title,
  type,
  version,
  status,
  effective_date,
  language,
  CASE WHEN tenant_id IS NULL THEN 'Global' ELSE 'Tenant-specific' END as scope
FROM legal_documents
ORDER BY created_at DESC
LIMIT 10;

-- Verify
SELECT 
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE status = 'published') as published_docs,
  COUNT(*) FILTER (WHERE tenant_id IS NULL) as global_docs,
  COUNT(*) FILTER (WHERE is_active = true) as active_docs,
  COUNT(DISTINCT type) as unique_types,
  COUNT(DISTINCT language) as languages
FROM legal_documents;

-- ============================================
-- System Announcements Table Migration
-- Purpose: Store and manage system-wide announcements
-- Created: 2026-01-13
-- ============================================

CREATE TABLE IF NOT EXISTS system_announcements (
  -- Primary Key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  tenant_id UUID NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  
  -- Classification
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, warning, error, success, maintenance
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- low, normal, high, critical
  category VARCHAR(100), -- system, maintenance, feature, security, etc
  
  -- Status & Visibility
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, active, expired, archived
  is_published BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- Scheduling
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Targeting
  target_audience JSONB DEFAULT '{"all": true}'::jsonb, -- {all, roles, users, tenants}
  
  -- Display Settings
  display_location VARCHAR(50)[] DEFAULT ARRAY['dashboard'], -- dashboard, sidebar, modal, banner
  icon VARCHAR(100),
  color VARCHAR(50),
  
  -- Additional Data
  link_url VARCHAR(500),
  link_text VARCHAR(200),
  attachments JSONB,
  metadata JSONB,
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by VARCHAR(255),
  version INTEGER DEFAULT 1
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_system_announcements_tenant_id ON system_announcements(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_system_announcements_status ON system_announcements(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_system_announcements_type ON system_announcements(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_system_announcements_priority ON system_announcements(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_system_announcements_published ON system_announcements(is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_system_announcements_dates ON system_announcements(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_system_announcements_created_at ON system_announcements(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- Demo Data
-- ============================================

INSERT INTO system_announcements (
  tenant_id, title, content, type, priority, category, status, is_published, is_pinned,
  start_date, end_date, published_at, target_audience, display_location, icon, color,
  link_url, link_text, view_count, click_count, created_by, updated_by
) VALUES
  -- Critical Maintenance
  (
    '00000000-0000-0000-0000-000000000001',
    'Scheduled Maintenance: Database Upgrade',
    'We will be performing a critical database upgrade on January 20, 2026 from 2:00 AM to 6:00 AM UTC. Services may be temporarily unavailable during this period. Please save your work before this time.',
    'maintenance',
    'critical',
    'maintenance',
    'active',
    TRUE,
    TRUE,
    '2026-01-15 00:00:00+00',
    '2026-01-20 06:00:00+00',
    '2026-01-15 08:00:00+00',
    '{"all": true}'::jsonb,
    ARRAY['dashboard', 'banner'],
    'wrench',
    '#dc2626',
    'https://status.example.com',
    'View Maintenance Schedule',
    1245,
    89,
    'admin',
    'admin'
  ),
  
  -- New Feature
  (
    '00000000-0000-0000-0000-000000000001',
    'New Feature: Advanced Analytics Dashboard',
    'We are excited to announce the launch of our new Advanced Analytics Dashboard! Get deeper insights into your data with customizable charts, real-time metrics, and export capabilities.',
    'success',
    'high',
    'feature',
    'active',
    TRUE,
    TRUE,
    '2026-01-10 00:00:00+00',
    '2026-01-25 00:00:00+00',
    '2026-01-10 09:00:00+00',
    '{"all": true}'::jsonb,
    ARRAY['dashboard', 'modal'],
    'star',
    '#16a34a',
    '/analytics',
    'Explore Now',
    2341,
    456,
    'admin',
    'admin'
  ),
  
  -- Security Update
  (
    '00000000-0000-0000-0000-000000000001',
    'Important Security Update Required',
    'A critical security patch has been released. Please update your password and enable two-factor authentication to ensure your account security.',
    'warning',
    'high',
    'security',
    'active',
    TRUE,
    FALSE,
    '2026-01-12 00:00:00+00',
    '2026-01-22 00:00:00+00',
    '2026-01-12 10:00:00+00',
    '{"all": true}'::jsonb,
    ARRAY['dashboard', 'sidebar'],
    'shield-alert',
    '#f59e0b',
    '/security-settings',
    'Update Now',
    987,
    234,
    'security_team',
    'security_team'
  ),
  
  -- System Upgrade
  (
    '00000000-0000-0000-0000-000000000001',
    'Platform Performance Improvements',
    'We have upgraded our infrastructure to provide 50% faster load times and improved reliability. You may notice enhanced performance across all features.',
    'info',
    'normal',
    'system',
    'active',
    TRUE,
    FALSE,
    '2026-01-08 00:00:00+00',
    '2026-01-18 00:00:00+00',
    '2026-01-08 12:00:00+00',
    '{"all": true}'::jsonb,
    ARRAY['dashboard'],
    'zap',
    '#6366f1',
    NULL,
    NULL,
    3421,
    0,
    'admin',
    'admin'
  ),
  
  -- Training Webinar
  (
    '00000000-0000-0000-0000-000000000001',
    'Free Training Webinar: Mastering Advanced Features',
    'Join us for a comprehensive training session covering advanced features and best practices. Limited seats available! Register now.',
    'info',
    'normal',
    'training',
    'active',
    TRUE,
    FALSE,
    '2026-01-13 00:00:00+00',
    '2026-01-19 00:00:00+00',
    '2026-01-13 08:00:00+00',
    '{"roles": ["admin", "manager"]}'::jsonb,
    ARRAY['dashboard'],
    'graduation-cap',
    '#8b5cf6',
    'https://webinar.example.com',
    'Register Now',
    567,
    123,
    'training_team',
    'training_team'
  ),
  
  -- API Deprecation
  (
    '00000000-0000-0000-0000-000000000001',
    'API v1 Deprecation Notice',
    'API version 1 will be deprecated on March 1, 2026. Please migrate to API v2 before this date to avoid service interruption. Migration guide available in our documentation.',
    'warning',
    'high',
    'api',
    'active',
    TRUE,
    TRUE,
    '2026-01-11 00:00:00+00',
    '2026-03-01 00:00:00+00',
    '2026-01-11 10:00:00+00',
    '{"roles": ["developer", "admin"]}'::jsonb,
    ARRAY['dashboard', 'banner'],
    'code',
    '#ef4444',
    '/api-migration-guide',
    'View Migration Guide',
    445,
    78,
    'api_team',
    'api_team'
  ),
  
  -- Holiday Notice
  (
    '00000000-0000-0000-0000-000000000001',
    'Holiday Support Hours',
    'Our support team will operate on limited hours during the holiday season (Dec 24 - Jan 2). Emergency support remains available 24/7.',
    'info',
    'low',
    'support',
    'archived',
    TRUE,
    FALSE,
    '2025-12-20 00:00:00+00',
    '2026-01-03 00:00:00+00',
    '2025-12-20 08:00:00+00',
    '{"all": true}'::jsonb,
    ARRAY['dashboard'],
    'calendar',
    '#3b82f6',
    '/support',
    'Contact Support',
    2156,
    45,
    'support_team',
    'support_team'
  ),
  
  -- Billing Update
  (
    '00000000-0000-0000-0000-000000000001',
    'Updated Billing Terms - January 2026',
    'We have updated our billing terms and pricing structure. Existing customers will maintain current rates until renewal. View details in your billing dashboard.',
    'info',
    'normal',
    'billing',
    'active',
    TRUE,
    FALSE,
    '2026-01-01 00:00:00+00',
    '2026-01-31 00:00:00+00',
    '2026-01-01 00:00:00+00',
    '{"roles": ["admin", "billing"]}'::jsonb,
    ARRAY['dashboard'],
    'credit-card',
    '#10b981',
    '/billing',
    'View Billing',
    678,
    156,
    'billing_team',
    'billing_team'
  ),
  
  -- Integration Launch
  (
    '00000000-0000-0000-0000-000000000001',
    'New Integration: Slack & Microsoft Teams',
    'Connect your workspace with Slack and Microsoft Teams for seamless collaboration. Configure notifications and get real-time updates directly in your team chat.',
    'success',
    'normal',
    'integration',
    'active',
    TRUE,
    FALSE,
    '2026-01-09 00:00:00+00',
    '2026-01-30 00:00:00+00',
    '2026-01-09 11:00:00+00',
    '{"all": true}'::jsonb,
    ARRAY['dashboard'],
    'plug',
    '#14b8a6',
    '/integrations',
    'Setup Integrations',
    1234,
    321,
    'integrations_team',
    'integrations_team'
  ),
  
  -- Data Export
  (
    '00000000-0000-0000-0000-000000000001',
    'New: Automated Data Export Feature',
    'Schedule automatic exports of your data in CSV, JSON, or Excel formats. Set up recurring exports and receive them via email or download portal.',
    'success',
    'low',
    'feature',
    'active',
    TRUE,
    FALSE,
    '2026-01-07 00:00:00+00',
    '2026-01-21 00:00:00+00',
    '2026-01-07 14:00:00+00',
    '{"roles": ["admin"]}'::jsonb,
    ARRAY['dashboard'],
    'download',
    '#06b6d4',
    '/data-export',
    'Setup Export',
    789,
    167,
    'admin',
    'admin'
  ),
  
  -- Draft Announcement
  (
    '00000000-0000-0000-0000-000000000001',
    'Upcoming Mobile App Release',
    'Our mobile app for iOS and Android is coming soon! Stay tuned for the official launch announcement next month.',
    'info',
    'normal',
    'mobile',
    'draft',
    FALSE,
    FALSE,
    NULL,
    NULL,
    NULL,
    '{"all": true}'::jsonb,
    ARRAY['dashboard'],
    'smartphone',
    '#6366f1',
    NULL,
    NULL,
    0,
    0,
    'product_team',
    'product_team'
  ),
  
  -- Expired Notice
  (
    '00000000-0000-0000-0000-000000000001',
    'Black Friday Sale - Extended!',
    'Get 40% off all premium plans! Sale extended through December 5th. Use code BLACKFRIDAY at checkout.',
    'success',
    'high',
    'promotion',
    'expired',
    TRUE,
    FALSE,
    '2025-11-24 00:00:00+00',
    '2025-12-05 23:59:59+00',
    '2025-11-24 00:00:00+00',
    '{"all": true}'::jsonb,
    ARRAY['dashboard', 'modal'],
    'gift',
    '#ec4899',
    '/pricing',
    'View Plans',
    5678,
    1234,
    'marketing_team',
    'marketing_team'
  );

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE system_announcements IS 'System-wide announcements for users';
COMMENT ON COLUMN system_announcements.type IS 'Announcement type: info, warning, error, success, maintenance';
COMMENT ON COLUMN system_announcements.priority IS 'Priority level: low, normal, high, critical';
COMMENT ON COLUMN system_announcements.status IS 'Current status: draft, active, expired, archived';
COMMENT ON COLUMN system_announcements.target_audience IS 'JSON object defining who should see this announcement';
COMMENT ON COLUMN system_announcements.display_location IS 'Array of locations where announcement should appear';

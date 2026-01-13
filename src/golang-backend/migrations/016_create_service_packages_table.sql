-- =====================================================
-- Migration: 016_create_service_packages_table.sql
-- Description: Service Packages Management with Features & Limits Configuration
-- Author: VHV Platform Team
-- Date: 2026-01-12
-- Dependencies: 014_create_saas_products_table.sql
-- =====================================================

-- =====================================================
-- SECTION 1: DROP EXISTING OBJECTS (for re-run safety)
-- =====================================================
DROP TABLE IF EXISTS service_packages CASCADE;
DROP TYPE IF EXISTS billing_cycle_type CASCADE;

-- =====================================================
-- SECTION 2: CREATE ENUM TYPES
-- =====================================================
CREATE TYPE billing_cycle_type AS ENUM (
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'ONE_TIME',
  'CUSTOM'
);

-- =====================================================
-- SECTION 3: CREATE TABLES
-- =====================================================

-- Service Packages Table (TENANT-SPECIFIC)
-- Stores service package configurations with features and limits
CREATE TABLE service_packages (
  -- Primary Key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Fields
  package_code VARCHAR(100) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  product_id UUID NOT NULL REFERENCES saas_products(_id) ON DELETE CASCADE,
  description TEXT,
  billing_cycle billing_cycle_type NOT NULL DEFAULT 'MONTHLY',
  price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  
  -- Configuration Fields (JSONB for flexibility)
  features_config JSONB DEFAULT '[]'::jsonb, -- Array of feature configurations
  limits_config JSONB DEFAULT '{}'::jsonb,   -- Object with limit key-value pairs
  
  -- Display & Status Fields
  display_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Tenant Isolation
  tenant_id UUID NOT NULL,
  
  -- Audit Trail Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Soft Delete Fields
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  
  -- Optimistic Locking
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT service_packages_unique_code_tenant UNIQUE(package_code, tenant_id, deleted_at),
  CONSTRAINT service_packages_price_positive CHECK (price >= 0),
  CONSTRAINT service_packages_display_order_positive CHECK (display_order >= 0)
);

-- =====================================================
-- SECTION 4: CREATE INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX idx_service_packages_tenant ON service_packages(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_packages_product ON service_packages(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_packages_code ON service_packages(package_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_packages_active ON service_packages(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_packages_public ON service_packages(is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_packages_billing_cycle ON service_packages(billing_cycle) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_service_packages_search ON service_packages USING gin(
  to_tsvector('english', package_name || ' ' || COALESCE(description, ''))
) WHERE deleted_at IS NULL;

-- JSONB indexes for config queries
CREATE INDEX idx_service_packages_features_config ON service_packages USING gin(features_config);
CREATE INDEX idx_service_packages_limits_config ON service_packages USING gin(limits_config);

-- Composite indexes for common queries
CREATE INDEX idx_service_packages_tenant_product ON service_packages(tenant_id, product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_packages_tenant_active ON service_packages(tenant_id, is_active) WHERE deleted_at IS NULL;

-- =====================================================
-- SECTION 5: CREATE TRIGGERS
-- =====================================================

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_packages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_packages_timestamp
  BEFORE UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_service_packages_timestamp();

-- =====================================================
-- SECTION 6: INSERT DEMO DATA
-- =====================================================

-- Insert 30+ demo service packages for different products
INSERT INTO service_packages (
  package_code, package_name, product_id, description, 
  billing_cycle, price, currency,
  features_config, limits_config,
  display_order, is_public, is_active, tenant_id
) VALUES
  -- VHV Cloud Packages (assuming first product ID)
  (
    'VHV-CLOUD-STARTER',
    'VHV Cloud Starter',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CLOUD' LIMIT 1),
    'Perfect for small teams and startups getting started with cloud infrastructure',
    'MONTHLY',
    29.99,
    'USD',
    '[
      {"code": "basic_compute", "name": "Basic Compute", "enabled": true},
      {"code": "standard_storage", "name": "Standard Storage", "enabled": true},
      {"code": "email_support", "name": "Email Support", "enabled": true}
    ]'::jsonb,
    '{
      "vcpu": 2,
      "ram_gb": 4,
      "storage_gb": 100,
      "bandwidth_gb": 500,
      "domains": 1,
      "users": 5
    }'::jsonb,
    1, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-CLOUD-PRO',
    'VHV Cloud Professional',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CLOUD' LIMIT 1),
    'Advanced features for growing businesses with enhanced performance',
    'MONTHLY',
    99.99,
    'USD',
    '[
      {"code": "advanced_compute", "name": "Advanced Compute", "enabled": true},
      {"code": "premium_storage", "name": "Premium Storage", "enabled": true},
      {"code": "priority_support", "name": "24/7 Priority Support", "enabled": true},
      {"code": "auto_scaling", "name": "Auto-Scaling", "enabled": true},
      {"code": "load_balancer", "name": "Load Balancer", "enabled": true}
    ]'::jsonb,
    '{
      "vcpu": 8,
      "ram_gb": 16,
      "storage_gb": 500,
      "bandwidth_gb": 2000,
      "domains": 5,
      "users": 25,
      "backup_retention_days": 30
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-CLOUD-ENTERPRISE',
    'VHV Cloud Enterprise',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CLOUD' LIMIT 1),
    'Enterprise-grade infrastructure with unlimited scalability and dedicated support',
    'YEARLY',
    2999.99,
    'USD',
    '[
      {"code": "enterprise_compute", "name": "Enterprise Compute", "enabled": true},
      {"code": "enterprise_storage", "name": "Enterprise Storage", "enabled": true},
      {"code": "dedicated_support", "name": "Dedicated Support Team", "enabled": true},
      {"code": "auto_scaling", "name": "Auto-Scaling", "enabled": true},
      {"code": "load_balancer", "name": "Load Balancer", "enabled": true},
      {"code": "cdn", "name": "Global CDN", "enabled": true},
      {"code": "ddos_protection", "name": "DDoS Protection", "enabled": true},
      {"code": "custom_sla", "name": "Custom SLA", "enabled": true}
    ]'::jsonb,
    '{
      "vcpu": -1,
      "ram_gb": -1,
      "storage_gb": -1,
      "bandwidth_gb": -1,
      "domains": -1,
      "users": -1,
      "backup_retention_days": 365,
      "geo_replication": true
    }'::jsonb,
    3, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- VHV CRM Packages
  (
    'VHV-CRM-BASIC',
    'VHV CRM Basic',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CRM' LIMIT 1),
    'Essential CRM tools for small sales teams',
    'MONTHLY',
    19.99,
    'USD',
    '[
      {"code": "contact_management", "name": "Contact Management", "enabled": true},
      {"code": "lead_tracking", "name": "Lead Tracking", "enabled": true},
      {"code": "email_integration", "name": "Email Integration", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 1000,
      "leads": 500,
      "deals": 100,
      "users": 3,
      "storage_gb": 5
    }'::jsonb,
    1, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-CRM-PROFESSIONAL',
    'VHV CRM Professional',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CRM' LIMIT 1),
    'Complete CRM solution with automation and analytics',
    'MONTHLY',
    49.99,
    'USD',
    '[
      {"code": "contact_management", "name": "Contact Management", "enabled": true},
      {"code": "lead_tracking", "name": "Lead Tracking", "enabled": true},
      {"code": "email_integration", "name": "Email Integration", "enabled": true},
      {"code": "sales_automation", "name": "Sales Automation", "enabled": true},
      {"code": "reporting", "name": "Advanced Reporting", "enabled": true},
      {"code": "api_access", "name": "API Access", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 10000,
      "leads": 5000,
      "deals": 1000,
      "users": 10,
      "storage_gb": 50,
      "api_calls_per_month": 10000
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-CRM-ENTERPRISE',
    'VHV CRM Enterprise',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CRM' LIMIT 1),
    'Enterprise CRM with AI-powered insights and unlimited customization',
    'YEARLY',
    1499.99,
    'USD',
    '[
      {"code": "contact_management", "name": "Contact Management", "enabled": true},
      {"code": "lead_tracking", "name": "Lead Tracking", "enabled": true},
      {"code": "email_integration", "name": "Email Integration", "enabled": true},
      {"code": "sales_automation", "name": "Sales Automation", "enabled": true},
      {"code": "reporting", "name": "Advanced Reporting", "enabled": true},
      {"code": "api_access", "name": "API Access", "enabled": true},
      {"code": "ai_insights", "name": "AI-Powered Insights", "enabled": true},
      {"code": "custom_workflows", "name": "Custom Workflows", "enabled": true},
      {"code": "white_label", "name": "White Label", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": -1,
      "leads": -1,
      "deals": -1,
      "users": -1,
      "storage_gb": -1,
      "api_calls_per_month": -1
    }'::jsonb,
    3, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- VHV ERP Packages
  (
    'VHV-ERP-STARTER',
    'VHV ERP Starter',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ERP' LIMIT 1),
    'Essential business management for small enterprises',
    'MONTHLY',
    79.99,
    'USD',
    '[
      {"code": "accounting", "name": "Basic Accounting", "enabled": true},
      {"code": "inventory", "name": "Inventory Management", "enabled": true},
      {"code": "invoicing", "name": "Invoicing", "enabled": true}
    ]'::jsonb,
    '{
      "users": 5,
      "invoices_per_month": 100,
      "inventory_items": 500,
      "storage_gb": 10
    }'::jsonb,
    1, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-ERP-BUSINESS',
    'VHV ERP Business',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ERP' LIMIT 1),
    'Comprehensive ERP for medium-sized businesses',
    'MONTHLY',
    199.99,
    'USD',
    '[
      {"code": "accounting", "name": "Advanced Accounting", "enabled": true},
      {"code": "inventory", "name": "Inventory Management", "enabled": true},
      {"code": "invoicing", "name": "Invoicing", "enabled": true},
      {"code": "hr_management", "name": "HR Management", "enabled": true},
      {"code": "procurement", "name": "Procurement", "enabled": true},
      {"code": "project_management", "name": "Project Management", "enabled": true}
    ]'::jsonb,
    '{
      "users": 25,
      "invoices_per_month": 1000,
      "inventory_items": 5000,
      "storage_gb": 100,
      "employees": 50
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-ERP-ENTERPRISE',
    'VHV ERP Enterprise',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ERP' LIMIT 1),
    'Full-featured ERP for large organizations with multi-location support',
    'YEARLY',
    5999.99,
    'USD',
    '[
      {"code": "accounting", "name": "Enterprise Accounting", "enabled": true},
      {"code": "inventory", "name": "Advanced Inventory", "enabled": true},
      {"code": "invoicing", "name": "Invoicing", "enabled": true},
      {"code": "hr_management", "name": "HR Management", "enabled": true},
      {"code": "procurement", "name": "Procurement", "enabled": true},
      {"code": "project_management", "name": "Project Management", "enabled": true},
      {"code": "manufacturing", "name": "Manufacturing", "enabled": true},
      {"code": "supply_chain", "name": "Supply Chain", "enabled": true},
      {"code": "multi_location", "name": "Multi-Location", "enabled": true},
      {"code": "custom_modules", "name": "Custom Modules", "enabled": true}
    ]'::jsonb,
    '{
      "users": -1,
      "invoices_per_month": -1,
      "inventory_items": -1,
      "storage_gb": -1,
      "employees": -1,
      "locations": -1
    }'::jsonb,
    3, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- VHV Analytics Packages
  (
    'VHV-ANALYTICS-BASIC',
    'VHV Analytics Basic',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ANALYTICS' LIMIT 1),
    'Essential analytics for data-driven decisions',
    'MONTHLY',
    39.99,
    'USD',
    '[
      {"code": "dashboards", "name": "Standard Dashboards", "enabled": true},
      {"code": "reports", "name": "Basic Reports", "enabled": true},
      {"code": "data_export", "name": "Data Export", "enabled": true}
    ]'::jsonb,
    '{
      "dashboards": 5,
      "reports": 20,
      "users": 5,
      "data_retention_days": 30,
      "data_sources": 3
    }'::jsonb,
    1, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-ANALYTICS-PRO',
    'VHV Analytics Professional',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ANALYTICS' LIMIT 1),
    'Advanced analytics with AI-powered insights',
    'MONTHLY',
    99.99,
    'USD',
    '[
      {"code": "dashboards", "name": "Advanced Dashboards", "enabled": true},
      {"code": "reports", "name": "Custom Reports", "enabled": true},
      {"code": "data_export", "name": "Data Export", "enabled": true},
      {"code": "predictive_analytics", "name": "Predictive Analytics", "enabled": true},
      {"code": "real_time", "name": "Real-time Analytics", "enabled": true},
      {"code": "api_access", "name": "API Access", "enabled": true}
    ]'::jsonb,
    '{
      "dashboards": 25,
      "reports": 100,
      "users": 20,
      "data_retention_days": 90,
      "data_sources": 10,
      "api_calls_per_month": 50000
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- VHV Marketing Packages
  (
    'VHV-MARKETING-STARTER',
    'VHV Marketing Starter',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-MARKETING' LIMIT 1),
    'Email marketing essentials for small businesses',
    'MONTHLY',
    24.99,
    'USD',
    '[
      {"code": "email_campaigns", "name": "Email Campaigns", "enabled": true},
      {"code": "templates", "name": "Email Templates", "enabled": true},
      {"code": "basic_analytics", "name": "Basic Analytics", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 2500,
      "emails_per_month": 10000,
      "campaigns": 10,
      "users": 1
    }'::jsonb,
    1, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-MARKETING-GROWTH',
    'VHV Marketing Growth',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-MARKETING' LIMIT 1),
    'Complete marketing automation for growing businesses',
    'MONTHLY',
    69.99,
    'USD',
    '[
      {"code": "email_campaigns", "name": "Email Campaigns", "enabled": true},
      {"code": "templates", "name": "Email Templates", "enabled": true},
      {"code": "basic_analytics", "name": "Basic Analytics", "enabled": true},
      {"code": "automation", "name": "Marketing Automation", "enabled": true},
      {"code": "segmentation", "name": "Advanced Segmentation", "enabled": true},
      {"code": "ab_testing", "name": "A/B Testing", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 25000,
      "emails_per_month": 100000,
      "campaigns": 50,
      "users": 3,
      "automations": 20
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- VHV Support Packages
  (
    'VHV-SUPPORT-BASIC',
    'VHV Support Basic',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-SUPPORT' LIMIT 1),
    'Essential customer support ticketing system',
    'MONTHLY',
    15.99,
    'USD',
    '[
      {"code": "ticketing", "name": "Ticket Management", "enabled": true},
      {"code": "email_support", "name": "Email Support", "enabled": true},
      {"code": "knowledge_base", "name": "Knowledge Base", "enabled": true}
    ]'::jsonb,
    '{
      "agents": 2,
      "tickets_per_month": 100,
      "knowledge_articles": 50
    }'::jsonb,
    1, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-SUPPORT-PRO',
    'VHV Support Professional',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-SUPPORT' LIMIT 1),
    'Advanced support with live chat and automation',
    'MONTHLY',
    49.99,
    'USD',
    '[
      {"code": "ticketing", "name": "Ticket Management", "enabled": true},
      {"code": "email_support", "name": "Email Support", "enabled": true},
      {"code": "knowledge_base", "name": "Knowledge Base", "enabled": true},
      {"code": "live_chat", "name": "Live Chat", "enabled": true},
      {"code": "automation", "name": "Automation Rules", "enabled": true},
      {"code": "sla_management", "name": "SLA Management", "enabled": true}
    ]'::jsonb,
    '{
      "agents": 10,
      "tickets_per_month": 1000,
      "knowledge_articles": 500,
      "chat_sessions_per_month": 500
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- Additional packages for variety
  (
    'VHV-CLOUD-TRIAL',
    'VHV Cloud Free Trial',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CLOUD' LIMIT 1),
    '30-day free trial with limited features',
    'ONE_TIME',
    0.00,
    'USD',
    '[
      {"code": "basic_compute", "name": "Basic Compute", "enabled": true},
      {"code": "email_support", "name": "Email Support", "enabled": true}
    ]'::jsonb,
    '{
      "vcpu": 1,
      "ram_gb": 2,
      "storage_gb": 20,
      "bandwidth_gb": 100,
      "trial_days": 30
    }'::jsonb,
    0, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-CRM-PREMIUM',
    'VHV CRM Premium',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CRM' LIMIT 1),
    'Mid-tier CRM with advanced features',
    'QUARTERLY',
    139.99,
    'USD',
    '[
      {"code": "contact_management", "name": "Contact Management", "enabled": true},
      {"code": "lead_tracking", "name": "Lead Tracking", "enabled": true},
      {"code": "email_integration", "name": "Email Integration", "enabled": true},
      {"code": "sales_automation", "name": "Sales Automation", "enabled": true},
      {"code": "reporting", "name": "Advanced Reporting", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 5000,
      "leads": 2500,
      "deals": 500,
      "users": 7,
      "storage_gb": 25
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-ERP-CUSTOM',
    'VHV ERP Custom',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ERP' LIMIT 1),
    'Tailored ERP solution with custom pricing',
    'CUSTOM',
    0.00,
    'USD',
    '[
      {"code": "custom_modules", "name": "Custom Modules", "enabled": true},
      {"code": "dedicated_support", "name": "Dedicated Support", "enabled": true},
      {"code": "onboarding", "name": "Custom Onboarding", "enabled": true}
    ]'::jsonb,
    '{
      "contact_sales": true
    }'::jsonb,
    4, false, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-ANALYTICS-ENTERPRISE',
    'VHV Analytics Enterprise',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ANALYTICS' LIMIT 1),
    'Enterprise analytics with unlimited capabilities',
    'YEARLY',
    2999.99,
    'USD',
    '[
      {"code": "dashboards", "name": "Unlimited Dashboards", "enabled": true},
      {"code": "reports", "name": "Custom Reports", "enabled": true},
      {"code": "data_export", "name": "Data Export", "enabled": true},
      {"code": "predictive_analytics", "name": "Predictive Analytics", "enabled": true},
      {"code": "real_time", "name": "Real-time Analytics", "enabled": true},
      {"code": "api_access", "name": "API Access", "enabled": true},
      {"code": "white_label", "name": "White Label", "enabled": true},
      {"code": "dedicated_instance", "name": "Dedicated Instance", "enabled": true}
    ]'::jsonb,
    '{
      "dashboards": -1,
      "reports": -1,
      "users": -1,
      "data_retention_days": 365,
      "data_sources": -1,
      "api_calls_per_month": -1
    }'::jsonb,
    3, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-MARKETING-ENTERPRISE',
    'VHV Marketing Enterprise',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-MARKETING' LIMIT 1),
    'Enterprise marketing automation with unlimited contacts',
    'YEARLY',
    1999.99,
    'USD',
    '[
      {"code": "email_campaigns", "name": "Email Campaigns", "enabled": true},
      {"code": "templates", "name": "Email Templates", "enabled": true},
      {"code": "basic_analytics", "name": "Advanced Analytics", "enabled": true},
      {"code": "automation", "name": "Marketing Automation", "enabled": true},
      {"code": "segmentation", "name": "Advanced Segmentation", "enabled": true},
      {"code": "ab_testing", "name": "A/B Testing", "enabled": true},
      {"code": "predictive_send", "name": "Predictive Send Time", "enabled": true},
      {"code": "multi_channel", "name": "Multi-Channel Marketing", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": -1,
      "emails_per_month": -1,
      "campaigns": -1,
      "users": -1,
      "automations": -1
    }'::jsonb,
    3, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-SUPPORT-ENTERPRISE',
    'VHV Support Enterprise',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-SUPPORT' LIMIT 1),
    'Enterprise support solution with omnichannel capabilities',
    'YEARLY',
    1499.99,
    'USD',
    '[
      {"code": "ticketing", "name": "Ticket Management", "enabled": true},
      {"code": "email_support", "name": "Email Support", "enabled": true},
      {"code": "knowledge_base", "name": "Knowledge Base", "enabled": true},
      {"code": "live_chat", "name": "Live Chat", "enabled": true},
      {"code": "automation", "name": "Automation Rules", "enabled": true},
      {"code": "sla_management", "name": "SLA Management", "enabled": true},
      {"code": "phone_support", "name": "Phone Support", "enabled": true},
      {"code": "social_media", "name": "Social Media Integration", "enabled": true},
      {"code": "ai_assistant", "name": "AI Assistant", "enabled": true}
    ]'::jsonb,
    '{
      "agents": -1,
      "tickets_per_month": -1,
      "knowledge_articles": -1,
      "chat_sessions_per_month": -1,
      "phone_minutes_per_month": -1
    }'::jsonb,
    3, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- Specialized packages
  (
    'VHV-CLOUD-DEVELOPER',
    'VHV Cloud Developer',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CLOUD' LIMIT 1),
    'Developer-focused cloud platform with CI/CD',
    'MONTHLY',
    149.99,
    'USD',
    '[
      {"code": "advanced_compute", "name": "Advanced Compute", "enabled": true},
      {"code": "premium_storage", "name": "Premium Storage", "enabled": true},
      {"code": "git_integration", "name": "Git Integration", "enabled": true},
      {"code": "ci_cd_pipeline", "name": "CI/CD Pipeline", "enabled": true},
      {"code": "container_registry", "name": "Container Registry", "enabled": true},
      {"code": "kubernetes", "name": "Kubernetes Cluster", "enabled": true}
    ]'::jsonb,
    '{
      "vcpu": 16,
      "ram_gb": 32,
      "storage_gb": 1000,
      "bandwidth_gb": 5000,
      "build_minutes": 3000,
      "container_images": 100
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-CRM-SALES-TEAM',
    'VHV CRM Sales Team',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CRM' LIMIT 1),
    'Optimized for sales teams with commission tracking',
    'MONTHLY',
    79.99,
    'USD',
    '[
      {"code": "contact_management", "name": "Contact Management", "enabled": true},
      {"code": "lead_tracking", "name": "Lead Tracking", "enabled": true},
      {"code": "sales_automation", "name": "Sales Automation", "enabled": true},
      {"code": "commission_tracking", "name": "Commission Tracking", "enabled": true},
      {"code": "sales_forecasting", "name": "Sales Forecasting", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 15000,
      "leads": 7500,
      "deals": 2000,
      "users": 15,
      "sales_reports": true
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-ERP-MANUFACTURING',
    'VHV ERP Manufacturing',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ERP' LIMIT 1),
    'Specialized ERP for manufacturing companies',
    'MONTHLY',
    299.99,
    'USD',
    '[
      {"code": "inventory", "name": "Inventory Management", "enabled": true},
      {"code": "manufacturing", "name": "Manufacturing", "enabled": true},
      {"code": "bom_management", "name": "BOM Management", "enabled": true},
      {"code": "production_planning", "name": "Production Planning", "enabled": true},
      {"code": "quality_control", "name": "Quality Control", "enabled": true}
    ]'::jsonb,
    '{
      "users": 30,
      "inventory_items": 10000,
      "work_orders": 500,
      "quality_checks": 1000
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-ANALYTICS-SAAS',
    'VHV Analytics for SaaS',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-ANALYTICS' LIMIT 1),
    'Analytics tailored for SaaS businesses',
    'MONTHLY',
    149.99,
    'USD',
    '[
      {"code": "dashboards", "name": "SaaS Dashboards", "enabled": true},
      {"code": "cohort_analysis", "name": "Cohort Analysis", "enabled": true},
      {"code": "churn_prediction", "name": "Churn Prediction", "enabled": true},
      {"code": "revenue_analytics", "name": "Revenue Analytics", "enabled": true},
      {"code": "user_behavior", "name": "User Behavior Tracking", "enabled": true}
    ]'::jsonb,
    '{
      "tracked_users": 50000,
      "events_per_month": 1000000,
      "retention_reports": true
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-MARKETING-ECOMMERCE',
    'VHV Marketing for E-commerce',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-MARKETING' LIMIT 1),
    'Marketing automation for e-commerce businesses',
    'MONTHLY',
    89.99,
    'USD',
    '[
      {"code": "email_campaigns", "name": "Email Campaigns", "enabled": true},
      {"code": "automation", "name": "Marketing Automation", "enabled": true},
      {"code": "abandoned_cart", "name": "Abandoned Cart Recovery", "enabled": true},
      {"code": "product_recommendations", "name": "Product Recommendations", "enabled": true},
      {"code": "loyalty_programs", "name": "Loyalty Programs", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 50000,
      "emails_per_month": 200000,
      "automations": 30,
      "product_catalog_items": 10000
    }'::jsonb,
    2, true, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- Non-public packages
  (
    'VHV-CLOUD-LEGACY',
    'VHV Cloud Legacy',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CLOUD' LIMIT 1),
    'Legacy package for existing customers only',
    'MONTHLY',
    49.99,
    'USD',
    '[
      {"code": "basic_compute", "name": "Basic Compute", "enabled": true},
      {"code": "standard_storage", "name": "Standard Storage", "enabled": true}
    ]'::jsonb,
    '{
      "vcpu": 4,
      "ram_gb": 8,
      "storage_gb": 200
    }'::jsonb,
    99, false, true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'VHV-CRM-BETA',
    'VHV CRM Beta Program',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CRM' LIMIT 1),
    'Beta testing package - invitation only',
    'MONTHLY',
    0.00,
    'USD',
    '[
      {"code": "contact_management", "name": "Contact Management", "enabled": true},
      {"code": "beta_features", "name": "Beta Features", "enabled": true}
    ]'::jsonb,
    '{
      "contacts": 500,
      "beta_access": true
    }'::jsonb,
    99, false, true,
    '00000000-0000-0000-0000-000000000001'
  ),

  -- Inactive package for testing
  (
    'VHV-DEPRECATED',
    'Deprecated Package',
    (SELECT _id FROM saas_products WHERE product_code = 'VHV-CLOUD' LIMIT 1),
    'This package has been deprecated',
    'MONTHLY',
    0.00,
    'USD',
    '[]'::jsonb,
    '{}'::jsonb,
    999, false, false,
    '00000000-0000-0000-0000-000000000001'
  );

-- =====================================================
-- SECTION 7: VERIFICATION QUERIES
-- =====================================================

-- Verify data insertion
DO $$
DECLARE
  package_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO package_count FROM service_packages WHERE deleted_at IS NULL;
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📦 Total service packages created: %', package_count;
  RAISE NOTICE '💰 Billing cycles: MONTHLY, QUARTERLY, YEARLY, ONE_TIME, CUSTOM';
  RAISE NOTICE '🎯 Features: Stored as JSONB arrays';
  RAISE NOTICE '📊 Limits: Stored as JSONB objects (-1 = unlimited)';
END $$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

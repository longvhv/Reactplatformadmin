/**
 * Migration: Create tenant_subscriptions table
 * Version: 1.0.0
 * Description: Tenant subscription management with full audit trail
 * Author: VHV Platform
 * Date: 2026-01-12
 */

-- ============================================
-- DROP EXISTING TABLE (if exists)
-- ============================================
DROP TABLE IF EXISTS tenant_subscriptions CASCADE;

-- ============================================
-- CREATE TABLE: tenant_subscriptions
-- ============================================
CREATE TABLE tenant_subscriptions (
  -- Primary Key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL,
  plan_id UUID,
  order_id UUID,
  
  -- Subscription Identification
  subscription_number VARCHAR(50) NOT NULL UNIQUE,
  subscription_name VARCHAR(255) NOT NULL,
  
  -- Subscription Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  trial_end_date DATE,
  renewal_date DATE,
  
  -- Subscription Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  -- Status values: active, trial, suspended, expired, cancelled, pending
  
  auto_renew BOOLEAN DEFAULT true,
  is_trial BOOLEAN DEFAULT false,
  
  -- Pricing Information
  plan_name VARCHAR(100),
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  -- Billing cycle: monthly, quarterly, yearly, custom
  
  base_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15, 2) DEFAULT 0,
  tax_amount NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Subscription Details
  max_users INTEGER DEFAULT 1,
  current_users INTEGER DEFAULT 0,
  max_storage_gb INTEGER DEFAULT 10,
  current_storage_gb NUMERIC(10, 2) DEFAULT 0,
  
  -- Features & Limits
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  
  -- Payment Information
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  -- Payment status: paid, unpaid, partially_paid, failed, refunded
  
  last_payment_date DATE,
  next_payment_date DATE,
  
  -- Contact Information
  billing_contact_name VARCHAR(255),
  billing_contact_email VARCHAR(255),
  billing_contact_phone VARCHAR(50),
  
  -- Additional Information
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags VARCHAR(100)[],
  
  -- Audit Trail (Complete tracking)
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'trial', 'suspended', 'expired', 'cancelled', 'pending')
  ),
  CONSTRAINT valid_billing_cycle CHECK (
    billing_cycle IN ('monthly', 'quarterly', 'yearly', 'custom')
  ),
  CONSTRAINT valid_payment_status CHECK (
    payment_status IN ('paid', 'unpaid', 'partially_paid', 'failed', 'refunded')
  ),
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_users CHECK (current_users >= 0 AND current_users <= max_users),
  CONSTRAINT valid_storage CHECK (current_storage_gb >= 0 AND current_storage_gb <= max_storage_gb),
  CONSTRAINT valid_amounts CHECK (
    base_price >= 0 AND 
    discount_amount >= 0 AND 
    tax_amount >= 0 AND 
    total_amount >= 0
  )
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_start_date ON tenant_subscriptions(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_end_date ON tenant_subscriptions(end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_plan_id ON tenant_subscriptions(plan_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_order_id ON tenant_subscriptions(order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_number ON tenant_subscriptions(subscription_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_billing_cycle ON tenant_subscriptions(billing_cycle) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_auto_renew ON tenant_subscriptions(auto_renew) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_created_at ON tenant_subscriptions(created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_tenant_subscriptions_features ON tenant_subscriptions USING GIN(features);
CREATE INDEX idx_tenant_subscriptions_metadata ON tenant_subscriptions USING GIN(metadata);

-- ============================================
-- CREATE TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_tenant_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_subscriptions_timestamp
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_subscriptions_updated_at();

-- ============================================
-- INSERT DEMO DATA (8 records)
-- ============================================

-- Demo Subscription 1: Active Enterprise Plan
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, last_payment_date, next_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'SUB-2026-001',
  'Enterprise Plan - Premium',
  '2026-01-01', '2026-12-31', '2026-12-31',
  'active', true, false,
  'Enterprise', 'yearly',
  9999.00, 1000.00, 899.91, 9898.91, 'USD',
  100, 85, 1000, 650.50,
  '["Advanced Analytics", "Priority Support", "Custom Integrations", "SSO", "API Access"]'::jsonb,
  '{"api_calls_per_month": 1000000, "concurrent_sessions": 500}'::jsonb,
  'credit_card', 'paid', '2026-01-01', '2027-01-01',
  'John Smith', 'john.smith@enterprise.com', '+1-555-0101',
  'Premium enterprise customer with full features',
  ARRAY['enterprise', 'premium', 'yearly']
);

-- Demo Subscription 2: Active Professional Plan
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, last_payment_date, next_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'SUB-2026-002',
  'Professional Plan - Monthly',
  '2026-01-01', '2026-02-01', '2026-02-01',
  'active', true, false,
  'Professional', 'monthly',
  299.00, 0, 29.90, 328.90, 'USD',
  25, 18, 250, 120.75,
  '["Standard Analytics", "Email Support", "Basic Integrations", "API Access"]'::jsonb,
  '{"api_calls_per_month": 100000, "concurrent_sessions": 100}'::jsonb,
  'credit_card', 'paid', '2026-01-01', '2026-02-01',
  'Sarah Johnson', 'sarah.j@professional.com', '+1-555-0202',
  'Professional plan with monthly billing',
  ARRAY['professional', 'monthly']
);

-- Demo Subscription 3: Trial Period
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, trial_end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, next_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'SUB-2026-003',
  'Business Plan - Trial',
  '2026-01-10', '2026-02-10', '2026-01-25', '2026-02-10',
  'trial', true, true,
  'Business', 'monthly',
  499.00, 0, 49.90, 548.90, 'USD',
  50, 5, 500, 10.25,
  '["Advanced Analytics", "Priority Support", "Advanced Integrations"]'::jsonb,
  '{"api_calls_per_month": 250000, "concurrent_sessions": 200}'::jsonb,
  NULL, 'unpaid', '2026-01-25',
  'Michael Chen', 'michael.chen@business.com', '+1-555-0303',
  'Trial period - expires on 2026-01-25',
  ARRAY['business', 'trial', 'monthly']
);

-- Demo Subscription 4: Suspended (Payment Failed)
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, last_payment_date, next_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'SUB-2026-004',
  'Startup Plan - Suspended',
  '2025-11-01', '2026-02-01', '2026-02-01',
  'suspended', true, false,
  'Startup', 'quarterly',
  750.00, 50.00, 70.00, 770.00, 'USD',
  10, 8, 100, 85.50,
  '["Basic Analytics", "Email Support", "Basic API"]'::jsonb,
  '{"api_calls_per_month": 50000, "concurrent_sessions": 50}'::jsonb,
  'credit_card', 'failed', '2025-11-01', '2026-01-15',
  'Emily Rodriguez', 'emily.r@startup.com', '+1-555-0404',
  'Suspended due to payment failure - needs attention',
  ARRAY['startup', 'suspended', 'quarterly']
);

-- Demo Subscription 5: Expired
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, last_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  'SUB-2025-005',
  'Basic Plan - Expired',
  '2025-01-01', '2025-12-31', '2025-12-31',
  'expired', false, false,
  'Basic', 'yearly',
  1200.00, 0, 120.00, 1320.00, 'USD',
  5, 3, 50, 25.00,
  '["Basic Features", "Community Support"]'::jsonb,
  '{"api_calls_per_month": 10000, "concurrent_sessions": 10}'::jsonb,
  'bank_transfer', 'paid', '2025-01-01',
  'David Kim', 'david.kim@basic.com', '+1-555-0505',
  'Expired subscription - customer did not renew',
  ARRAY['basic', 'expired', 'yearly']
);

-- Demo Subscription 6: Cancelled
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, last_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags, deleted_at
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  'SUB-2025-006',
  'Professional Plan - Cancelled',
  '2025-06-01', '2026-06-01', '2026-06-01',
  'cancelled', false, false,
  'Professional', 'yearly',
  2999.00, 300.00, 269.91, 2968.91, 'USD',
  25, 15, 250, 150.00,
  '["Standard Analytics", "Email Support", "Basic Integrations"]'::jsonb,
  '{"api_calls_per_month": 100000, "concurrent_sessions": 100}'::jsonb,
  'credit_card', 'refunded', '2025-06-01',
  'Lisa Wang', 'lisa.wang@cancelled.com', '+1-555-0606',
  'Cancelled by customer request - refund processed',
  ARRAY['professional', 'cancelled', 'yearly'],
  '2025-12-15 10:30:00+00'
);

-- Demo Subscription 7: Pending Activation
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, next_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  'SUB-2026-007',
  'Enterprise Plan - Pending',
  '2026-02-01', '2027-02-01', '2027-02-01',
  'pending', true, false,
  'Enterprise', 'yearly',
  12000.00, 1200.00, 1080.00, 11880.00, 'USD',
  150, 0, 2000, 0.00,
  '["All Features", "24/7 Support", "Custom Development", "Dedicated Account Manager"]'::jsonb,
  '{"api_calls_per_month": 5000000, "concurrent_sessions": 1000}'::jsonb,
  'wire_transfer', 'unpaid', '2026-01-25',
  'Robert Taylor', 'robert.t@newenterprise.com', '+1-555-0707',
  'Pending activation - awaiting payment confirmation',
  ARRAY['enterprise', 'pending', 'yearly']
);

-- Demo Subscription 8: Active with Quarterly Billing
INSERT INTO tenant_subscriptions (
  tenant_id, subscription_number, subscription_name,
  start_date, end_date, renewal_date,
  status, auto_renew, is_trial,
  plan_name, billing_cycle,
  base_price, discount_amount, tax_amount, total_amount, currency,
  max_users, current_users, max_storage_gb, current_storage_gb,
  features, limits,
  payment_method, payment_status, last_payment_date, next_payment_date,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  notes, tags
) VALUES (
  '88888888-8888-8888-8888-888888888888',
  'SUB-2026-008',
  'Growth Plan - Quarterly',
  '2026-01-01', '2026-04-01', '2026-04-01',
  'active', true, false,
  'Growth', 'quarterly',
  899.00, 100.00, 79.91, 878.91, 'EUR',
  40, 32, 400, 280.00,
  '["Advanced Analytics", "Phone Support", "Advanced Integrations", "Custom Reports"]'::jsonb,
  '{"api_calls_per_month": 500000, "concurrent_sessions": 250}'::jsonb,
  'credit_card', 'paid', '2026-01-01', '2026-04-01',
  'Maria Garcia', 'maria.garcia@growth.com', '+34-555-0808',
  'Growing business with quarterly billing in EUR',
  ARRAY['growth', 'quarterly', 'european']
);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Note: Adjust these based on your RLS policies
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_subscriptions TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE tenant_subscriptions IS 'Tenant subscription management with complete audit trail';
COMMENT ON COLUMN tenant_subscriptions._id IS 'Primary key (UUID)';
COMMENT ON COLUMN tenant_subscriptions.tenant_id IS 'Reference to tenant';
COMMENT ON COLUMN tenant_subscriptions.subscription_number IS 'Unique subscription identifier';
COMMENT ON COLUMN tenant_subscriptions.status IS 'Subscription status: active, trial, suspended, expired, cancelled, pending';
COMMENT ON COLUMN tenant_subscriptions.billing_cycle IS 'Billing frequency: monthly, quarterly, yearly, custom';
COMMENT ON COLUMN tenant_subscriptions.features IS 'Array of enabled features (JSONB)';
COMMENT ON COLUMN tenant_subscriptions.limits IS 'Usage limits and quotas (JSONB)';
COMMENT ON COLUMN tenant_subscriptions.metadata IS 'Additional custom data (JSONB)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Migration: 016_create_tenant_subscriptions_table.sql
-- Status: SUCCESS
-- Records inserted: 8 demo subscriptions
-- Indexes created: 12
-- Triggers created: 1

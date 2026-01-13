-- ============================================
-- Subscription Orders Table Migration
-- ============================================
-- Purpose: Store subscription orders for SaaS products
-- Created: 2026-01-12
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_orders (
  -- Primary Key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys & Relationships
  tenant_id UUID NOT NULL, -- Tenant who owns this order
  product_id UUID NOT NULL, -- SaaS product ordered
  customer_id UUID, -- Customer/User who placed the order
  
  -- Order Information
  order_code VARCHAR(50) NOT NULL, -- Unique order code
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When order was placed
  start_date TIMESTAMPTZ NOT NULL, -- Subscription start date
  end_date TIMESTAMPTZ, -- Subscription end date (NULL for lifetime)
  
  -- Billing Information
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY', -- DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, LIFETIME
  base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Original price
  discount_amount DECIMAL(12, 2) DEFAULT 0.00, -- Discount applied
  tax_amount DECIMAL(12, 2) DEFAULT 0.00, -- Tax amount
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Final amount
  currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- Currency code
  
  -- Payment Information
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_method VARCHAR(50), -- credit_card, paypal, bank_transfer, etc
  payment_date TIMESTAMPTZ, -- When payment was completed
  payment_reference VARCHAR(100), -- Payment gateway reference
  
  -- Order Status & Lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired, suspended, pending
  auto_renewal BOOLEAN DEFAULT true, -- Auto-renew subscription
  renewal_count INTEGER DEFAULT 0, -- How many times renewed
  
  -- Customer Information
  customer_name VARCHAR(255), -- Customer name
  customer_email VARCHAR(255), -- Customer email
  customer_phone VARCHAR(50), -- Customer phone
  billing_address JSONB, -- Billing address as JSON
  
  -- Features & Limits (copied from product at order time)
  features JSONB, -- Product features snapshot
  limits JSONB, -- Product limits snapshot
  
  -- Additional Data
  notes TEXT, -- Order notes
  metadata JSONB, -- Additional metadata
  
  -- Audit Trail - Standard Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  
  -- Optimistic Locking
  version INTEGER NOT NULL DEFAULT 1
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Primary lookup indexes
CREATE INDEX idx_subscription_orders_tenant_id ON subscription_orders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_product_id ON subscription_orders(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_customer_id ON subscription_orders(customer_id) WHERE deleted_at IS NULL;

-- Order code uniqueness
CREATE UNIQUE INDEX idx_subscription_orders_order_code_unique ON subscription_orders(order_code, tenant_id) WHERE deleted_at IS NULL;

-- Status queries
CREATE INDEX idx_subscription_orders_status ON subscription_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_payment_status ON subscription_orders(payment_status) WHERE deleted_at IS NULL;

-- Date range queries
CREATE INDEX idx_subscription_orders_order_date ON subscription_orders(order_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_start_date ON subscription_orders(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_end_date ON subscription_orders(end_date) WHERE deleted_at IS NULL;

-- Customer lookups
CREATE INDEX idx_subscription_orders_customer_email ON subscription_orders(customer_email) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX idx_subscription_orders_tenant_status ON subscription_orders(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_tenant_payment ON subscription_orders(tenant_id, payment_status) WHERE deleted_at IS NULL;

-- ============================================
-- Trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_subscription_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscription_orders_updated_at
  BEFORE UPDATE ON subscription_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_orders_updated_at();

-- ============================================
-- Demo Data Seeding
-- ============================================

-- Insert demo subscription orders
INSERT INTO subscription_orders (
  _id,
  tenant_id,
  product_id,
  customer_id,
  order_code,
  order_date,
  start_date,
  end_date,
  billing_cycle,
  base_price,
  discount_amount,
  tax_amount,
  total_amount,
  currency,
  payment_status,
  payment_method,
  payment_date,
  status,
  auto_renewal,
  renewal_count,
  customer_name,
  customer_email,
  customer_phone,
  features,
  limits,
  notes,
  metadata
) VALUES
-- Order 1: Active Monthly Subscription
(
  '11111111-1111-1111-1111-000000000001',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-001',
  '2026-01-01 10:00:00+00',
  '2026-01-01 00:00:00+00',
  '2026-02-01 00:00:00+00',
  'MONTHLY',
  49.99,
  0.00,
  4.50,
  54.49,
  'USD',
  'paid',
  'credit_card',
  '2026-01-01 10:05:00+00',
  'active',
  true,
  0,
  'Nguyễn Văn A',
  'nguyenvana@example.com',
  '+84901234567',
  '{"users": 10, "storage": "100GB", "api_calls": 100000}',
  '{"max_users": 10, "max_storage_gb": 100}',
  'Enterprise subscription for VHV Platform',
  '{"sales_rep": "John Doe", "campaign": "new_year_2026"}'
),

-- Order 2: Active Yearly Subscription with Discount
(
  '11111111-1111-1111-1111-000000000002',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-002',
  '2026-01-05 14:30:00+00',
  '2026-01-05 00:00:00+00',
  '2027-01-05 00:00:00+00',
  'YEARLY',
  499.99,
  100.00,
  36.00,
  435.99,
  'USD',
  'paid',
  'bank_transfer',
  '2026-01-05 15:00:00+00',
  'active',
  true,
  0,
  'Trần Thị B',
  'tranthib@example.com',
  '+84912345678',
  '{"users": 50, "storage": "500GB", "api_calls": 500000, "priority_support": true}',
  '{"max_users": 50, "max_storage_gb": 500}',
  'Premium yearly plan with 20% discount',
  '{"promo_code": "NEWYEAR20", "discount_reason": "early_bird"}'
),

-- Order 3: Pending Payment
(
  '11111111-1111-1111-1111-000000000003',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-003',
  '2026-01-10 09:15:00+00',
  '2026-01-10 00:00:00+00',
  '2026-02-10 00:00:00+00',
  'MONTHLY',
  29.99,
  0.00,
  2.70,
  32.69,
  'USD',
  'pending',
  'paypal',
  NULL,
  'pending',
  true,
  0,
  'Lê Văn C',
  'levanc@example.com',
  '+84923456789',
  '{"users": 5, "storage": "50GB", "api_calls": 50000}',
  '{"max_users": 5, "max_storage_gb": 50}',
  'Starter plan - Payment pending',
  '{"reminder_sent": true, "reminder_date": "2026-01-11"}'
),

-- Order 4: Quarterly Subscription
(
  '11111111-1111-1111-1111-000000000004',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-004',
  '2026-01-08 16:45:00+00',
  '2026-01-08 00:00:00+00',
  '2026-04-08 00:00:00+00',
  'QUARTERLY',
  139.99,
  10.00,
  11.70,
  141.69,
  'USD',
  'paid',
  'credit_card',
  '2026-01-08 16:50:00+00',
  'active',
  true,
  1,
  'Phạm Thị D',
  'phamthid@example.com',
  '+84934567890',
  '{"users": 25, "storage": "250GB", "api_calls": 250000}',
  '{"max_users": 25, "max_storage_gb": 250}',
  'Business quarterly - Renewed once',
  '{"referral_code": "REF123", "referred_by": "nguyenvana@example.com"}'
),

-- Order 5: Lifetime Subscription
(
  '11111111-1111-1111-1111-000000000005',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-005',
  '2026-01-03 11:20:00+00',
  '2026-01-03 00:00:00+00',
  NULL,
  'LIFETIME',
  999.99,
  0.00,
  90.00,
  1089.99,
  'USD',
  'paid',
  'bank_transfer',
  '2026-01-04 10:00:00+00',
  'active',
  false,
  0,
  'Hoàng Văn E',
  'hoangvane@example.com',
  '+84945678901',
  '{"users": "unlimited", "storage": "unlimited", "api_calls": "unlimited", "white_label": true}',
  '{"max_users": null, "max_storage_gb": null}',
  'Lifetime enterprise access',
  '{"special_offer": true, "offer_type": "founding_member"}'
),

-- Order 6: Cancelled Subscription
(
  '11111111-1111-1111-1111-000000000006',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-006',
  '2025-12-15 10:00:00+00',
  '2025-12-15 00:00:00+00',
  '2026-01-15 00:00:00+00',
  'MONTHLY',
  49.99,
  0.00,
  4.50,
  54.49,
  'USD',
  'paid',
  'credit_card',
  '2025-12-15 10:05:00+00',
  'cancelled',
  false,
  0,
  'Vũ Thị F',
  'vuthif@example.com',
  '+84956789012',
  '{"users": 10, "storage": "100GB", "api_calls": 100000}',
  '{"max_users": 10, "max_storage_gb": 100}',
  'Cancelled by user on 2025-12-20',
  '{"cancellation_reason": "switching_to_competitor", "cancelled_date": "2025-12-20"}'
),

-- Order 7: Suspended for Non-Payment
(
  '11111111-1111-1111-1111-000000000007',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-007',
  '2025-11-10 09:00:00+00',
  '2025-11-10 00:00:00+00',
  '2025-12-10 00:00:00+00',
  'MONTHLY',
  29.99,
  0.00,
  2.70,
  32.69,
  'USD',
  'failed',
  'credit_card',
  NULL,
  'suspended',
  true,
  2,
  'Đỗ Văn G',
  'dovang@example.com',
  '+84967890123',
  '{"users": 5, "storage": "50GB", "api_calls": 50000}',
  '{"max_users": 5, "max_storage_gb": 50}',
  'Suspended due to payment failure',
  '{"payment_retry_count": 3, "last_retry_date": "2025-12-01"}'
),

-- Order 8: Expired Trial
(
  '11111111-1111-1111-1111-000000000008',
  '00000000-0000-0000-0000-000000000001',
  gen_random_uuid(),
  gen_random_uuid(),
  'ORD-2026-008',
  '2025-12-01 08:00:00+00',
  '2025-12-01 00:00:00+00',
  '2025-12-31 00:00:00+00',
  'MONTHLY',
  0.00,
  0.00,
  0.00,
  0.00,
  'USD',
  'paid',
  'free_trial',
  '2025-12-01 08:00:00+00',
  'expired',
  false,
  0,
  'Bùi Thị H',
  'buithih@example.com',
  '+84978901234',
  '{"users": 3, "storage": "10GB", "api_calls": 10000}',
  '{"max_users": 3, "max_storage_gb": 10}',
  'Trial period expired, no conversion',
  '{"trial_days": 30, "conversion_attempt": false}'
);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE subscription_orders IS 'Stores all subscription orders for SaaS products';
COMMENT ON COLUMN subscription_orders._id IS 'Primary key UUID';
COMMENT ON COLUMN subscription_orders.tenant_id IS 'Tenant who owns this order';
COMMENT ON COLUMN subscription_orders.product_id IS 'Reference to saas_products table';
COMMENT ON COLUMN subscription_orders.order_code IS 'Unique order identifier code';
COMMENT ON COLUMN subscription_orders.billing_cycle IS 'DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, LIFETIME';
COMMENT ON COLUMN subscription_orders.payment_status IS 'pending, paid, failed, refunded';
COMMENT ON COLUMN subscription_orders.status IS 'active, cancelled, expired, suspended, pending';
COMMENT ON COLUMN subscription_orders.auto_renewal IS 'Whether subscription auto-renews';
COMMENT ON COLUMN subscription_orders.features IS 'Snapshot of product features at order time';
COMMENT ON COLUMN subscription_orders.limits IS 'Snapshot of product limits at order time';

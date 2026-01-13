-- ============================================
-- Migration: Create subscription_invoices table
-- Description: Invoices management for subscription orders
-- Version: 1.0.0
-- Author: System
-- Date: 2026-01-12
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS subscription_invoices CASCADE;

-- Create subscription_invoices table
CREATE TABLE subscription_invoices (
  -- Primary key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant context
  tenant_id UUID NOT NULL,
  
  -- Order reference
  order_id UUID NULL,
  customer_id UUID NULL,
  
  -- Invoice Information
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE NULL,
  
  -- Financial Information
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Status & Payment
  status VARCHAR(20) NOT NULL DEFAULT 'draft', 
  -- Values: draft, sent, paid, overdue, cancelled, refunded, partially_paid
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  -- Values: unpaid, paid, partially_paid, refunded, failed
  payment_method VARCHAR(50) NULL,
  payment_reference VARCHAR(100) NULL,
  
  -- Customer Information
  customer_name VARCHAR(255) NULL,
  customer_email VARCHAR(255) NULL,
  customer_phone VARCHAR(50) NULL,
  billing_address JSONB NULL,
  
  -- Invoice Details
  line_items JSONB NULL, -- Array of invoice items
  notes TEXT NULL,
  terms TEXT NULL,
  
  -- Additional metadata
  metadata JSONB NULL,
  
  -- Audit trail (follows Go framework standard)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100) NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100) NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  deleted_by VARCHAR(100) NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  CONSTRAINT check_total_positive CHECK (total_amount >= 0),
  CONSTRAINT check_amounts_valid CHECK (amount_paid >= 0 AND amount_due >= 0),
  CONSTRAINT check_status_valid CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid')),
  CONSTRAINT check_payment_status_valid CHECK (payment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded', 'failed'))
);

-- ============================================
-- Indexes
-- ============================================

-- Primary indexes for performance
CREATE INDEX idx_invoices_tenant ON subscription_invoices(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_order ON subscription_invoices(order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_customer ON subscription_invoices(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_number ON subscription_invoices(invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON subscription_invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_payment_status ON subscription_invoices(payment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_invoice_date ON subscription_invoices(invoice_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON subscription_invoices(due_date) WHERE deleted_at IS NULL;

-- Composite indexes
CREATE INDEX idx_invoices_tenant_status ON subscription_invoices(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_customer_email ON subscription_invoices(customer_email) WHERE deleted_at IS NULL;

-- Unique constraint for invoice number per tenant
CREATE UNIQUE INDEX idx_invoices_number_tenant_unique ON subscription_invoices(tenant_id, invoice_number) WHERE deleted_at IS NULL;

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_timestamp
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE subscription_invoices IS 'Invoices for subscription orders with full audit trail';
COMMENT ON COLUMN subscription_invoices._id IS 'Primary key UUID';
COMMENT ON COLUMN subscription_invoices.tenant_id IS 'Tenant context for multi-tenancy';
COMMENT ON COLUMN subscription_invoices.order_id IS 'Reference to subscription order';
COMMENT ON COLUMN subscription_invoices.invoice_number IS 'Unique invoice number per tenant';
COMMENT ON COLUMN subscription_invoices.status IS 'Invoice status: draft, sent, paid, overdue, cancelled, refunded, partially_paid';
COMMENT ON COLUMN subscription_invoices.payment_status IS 'Payment status: unpaid, paid, partially_paid, refunded, failed';
COMMENT ON COLUMN subscription_invoices.line_items IS 'JSON array of invoice line items';
COMMENT ON COLUMN subscription_invoices.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN subscription_invoices.version IS 'Optimistic locking version';

-- ============================================
-- Seed Data
-- ============================================

INSERT INTO subscription_invoices (
  tenant_id,
  order_id,
  invoice_number,
  invoice_date,
  due_date,
  paid_date,
  subtotal,
  tax_amount,
  discount_amount,
  total_amount,
  amount_paid,
  amount_due,
  currency,
  status,
  payment_status,
  payment_method,
  customer_name,
  customer_email,
  customer_phone,
  billing_address,
  line_items,
  notes,
  created_by,
  updated_by
) VALUES
-- Invoice 1: Paid invoice
(
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'INV-2026-0001',
  '2026-01-01 10:00:00+00',
  '2026-01-15 23:59:59+00',
  '2026-01-10 14:30:00+00',
  1000.00,
  100.00,
  50.00,
  1050.00,
  1050.00,
  0.00,
  'USD',
  'paid',
  'paid',
  'Credit Card',
  'Acme Corporation',
  'billing@acme.com',
  '+1-555-0001',
  '{"street": "123 Business Ave", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}',
  '[{"description": "Enterprise Plan - Monthly", "quantity": 1, "unit_price": 1000.00, "amount": 1000.00}]',
  'Monthly subscription for Enterprise Plan',
  'system',
  'system'
),

-- Invoice 2: Overdue invoice
(
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'INV-2026-0002',
  '2025-12-01 10:00:00+00',
  '2025-12-15 23:59:59+00',
  NULL,
  500.00,
  50.00,
  0.00,
  550.00,
  0.00,
  550.00,
  'USD',
  'overdue',
  'unpaid',
  NULL,
  'TechStart Inc',
  'finance@techstart.com',
  '+1-555-0002',
  '{"street": "456 Startup Blvd", "city": "San Francisco", "state": "CA", "zip": "94102", "country": "USA"}',
  '[{"description": "Professional Plan - Monthly", "quantity": 1, "unit_price": 500.00, "amount": 500.00}]',
  'Monthly subscription - Payment overdue',
  'system',
  'system'
),

-- Invoice 3: Sent (awaiting payment)
(
  '00000000-0000-0000-0000-000000000002',
  NULL,
  'INV-2026-0003',
  '2026-01-05 10:00:00+00',
  '2026-01-20 23:59:59+00',
  NULL,
  2000.00,
  200.00,
  100.00,
  2100.00,
  0.00,
  2100.00,
  'USD',
  'sent',
  'unpaid',
  NULL,
  'Global Systems Ltd',
  'accounts@globalsystems.com',
  '+44-20-1234-5678',
  '{"street": "789 Enterprise Way", "city": "London", "zip": "EC1A 1BB", "country": "UK"}',
  '[{"description": "Enterprise Plus Plan - Monthly", "quantity": 1, "unit_price": 2000.00, "amount": 2000.00}]',
  'Monthly subscription invoice',
  'system',
  'system'
),

-- Invoice 4: Partially paid
(
  '00000000-0000-0000-0000-000000000002',
  NULL,
  'INV-2026-0004',
  '2026-01-08 10:00:00+00',
  '2026-01-22 23:59:59+00',
  NULL,
  750.00,
  75.00,
  0.00,
  825.00,
  400.00,
  425.00,
  'USD',
  'partially_paid',
  'partially_paid',
  'Bank Transfer',
  'Innovation Hub',
  'billing@innovationhub.com',
  '+1-555-0003',
  '{"street": "321 Tech Park", "city": "Austin", "state": "TX", "zip": "73301", "country": "USA"}',
  '[{"description": "Business Plan - Monthly", "quantity": 1, "unit_price": 750.00, "amount": 750.00}]',
  'Partial payment received - Balance due',
  'system',
  'system'
),

-- Invoice 5: Draft invoice
(
  '00000000-0000-0000-0000-000000000003',
  NULL,
  'INV-2026-0005',
  '2026-01-12 10:00:00+00',
  '2026-01-26 23:59:59+00',
  NULL,
  300.00,
  30.00,
  0.00,
  330.00,
  0.00,
  330.00,
  'USD',
  'draft',
  'unpaid',
  NULL,
  'Startup Ventures',
  'billing@startupventures.com',
  '+1-555-0004',
  '{"street": "555 Innovation Dr", "city": "Seattle", "state": "WA", "zip": "98101", "country": "USA"}',
  '[{"description": "Basic Plan - Monthly", "quantity": 1, "unit_price": 300.00, "amount": 300.00}]',
  'Draft invoice - Not yet sent',
  'system',
  'system'
),

-- Invoice 6: Refunded invoice
(
  '00000000-0000-0000-0000-000000000003',
  NULL,
  'INV-2026-0006',
  '2025-11-01 10:00:00+00',
  '2025-11-15 23:59:59+00',
  '2025-11-05 09:00:00+00',
  1500.00,
  150.00,
  0.00,
  1650.00,
  1650.00,
  0.00,
  'USD',
  'refunded',
  'refunded',
  'Credit Card',
  'Digital Solutions Co',
  'finance@digitalsolutions.com',
  '+1-555-0005',
  '{"street": "999 Software Lane", "city": "Boston", "state": "MA", "zip": "02101", "country": "USA"}',
  '[{"description": "Premium Plan - Monthly", "quantity": 1, "unit_price": 1500.00, "amount": 1500.00}]',
  'Full refund processed - Service cancelled',
  'system',
  'system'
),

-- Invoice 7: EUR currency invoice
(
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'INV-2026-0007',
  '2026-01-10 10:00:00+00',
  '2026-01-24 23:59:59+00',
  NULL,
  800.00,
  160.00,
  40.00,
  920.00,
  0.00,
  920.00,
  'EUR',
  'sent',
  'unpaid',
  NULL,
  'European Tech GmbH',
  'billing@eurotech.de',
  '+49-30-12345678',
  '{"street": "Hauptstraße 100", "city": "Berlin", "zip": "10115", "country": "Germany"}',
  '[{"description": "Business Plan - Monthly", "quantity": 1, "unit_price": 800.00, "amount": 800.00}]',
  'Monthly subscription - EUR currency',
  'system',
  'system'
),

-- Invoice 8: Multi-item invoice (Paid)
(
  '00000000-0000-0000-0000-000000000002',
  NULL,
  'INV-2026-0008',
  '2026-01-11 10:00:00+00',
  '2026-01-25 23:59:59+00',
  '2026-01-12 16:45:00+00',
  1200.00,
  120.00,
  120.00,
  1200.00,
  1200.00,
  0.00,
  'USD',
  'paid',
  'paid',
  'PayPal',
  'Cloud Services Inc',
  'accounts@cloudservices.com',
  '+1-555-0006',
  '{"street": "777 Cloud Dr", "city": "Dallas", "state": "TX", "zip": "75201", "country": "USA"}',
  '[{"description": "Pro Plan - Monthly", "quantity": 1, "unit_price": 800.00, "amount": 800.00}, {"description": "Additional Users (5)", "quantity": 5, "unit_price": 50.00, "amount": 250.00}, {"description": "Extra Storage (100GB)", "quantity": 1, "unit_price": 150.00, "amount": 150.00}]',
  'Monthly subscription with add-ons',
  'system',
  'system'
);

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant access to authenticated users
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated access
CREATE POLICY "Enable read access for authenticated users" ON subscription_invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON subscription_invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON subscription_invoices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON subscription_invoices
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- Verification
-- ============================================

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_invoices') THEN
    RAISE NOTICE '✅ Table subscription_invoices created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create table subscription_invoices';
  END IF;
END $$;

-- Count seed data
DO $$
DECLARE
  invoice_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invoice_count FROM subscription_invoices WHERE deleted_at IS NULL;
  RAISE NOTICE '✅ Inserted % invoice records', invoice_count;
END $$;

-- ============================================
-- Update Subscription Orders Schema
-- Fix schema mismatch between DB and API
-- ============================================

-- Add missing columns to match API type definition
ALTER TABLE subscription_orders
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS po_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'NEW',
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3),
  ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS credit_applied DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS items_snapshot JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_ref_id VARCHAR(255);

-- Migrate existing data
UPDATE subscription_orders
SET 
  order_number = order_code,
  currency_code = currency,
  subtotal_amount = base_price,
  items_snapshot = '[]'::jsonb,
  billing_info = jsonb_build_object(
    'customer_name', customer_name,
    'customer_email', customer_email,
    'customer_phone', customer_phone,
    'address', billing_address
  ),
  payment_ref_id = payment_reference
WHERE order_number IS NULL;

-- Create index for order_number
CREATE INDEX IF NOT EXISTS idx_subscription_orders_order_number 
  ON subscription_orders(order_number) 
  WHERE deleted_at IS NULL;

-- Add constraint for type
ALTER TABLE subscription_orders
  ADD CONSTRAINT check_subscription_orders_type 
  CHECK (type IN ('NEW', 'RENEWAL', 'UPGRADE', 'DOWNGRADE', 'ADD_ON'));

-- ============================================
-- Notes:
-- - Added columns to match Order interface in /api/ordersApi.ts
-- - Migrated existing data to new columns
-- - Old columns (order_code, currency, etc) kept for backward compatibility
-- - items_snapshot stores order items as JSONB array
-- - billing_info consolidates customer info into JSONB object
-- ============================================

-- ============================================
-- Migration: Insert Demo Data for Subscription Invoices
-- Description: Add sample invoices for testing and demo
-- Created: 2026-01-14
-- ============================================

-- Insert demo subscription invoices
DO $$
DECLARE
    demo_tenant_id UUID := '00000000-0000-0000-0000-000000000099';
    demo_subscription_id UUID;
    partner_id UUID;
    invoice_count INTEGER := 0;
BEGIN
    -- Get or create a demo subscription (assuming tenant_subscriptions exists)
    SELECT _id INTO demo_subscription_id 
    FROM tenant_subscriptions 
    WHERE tenant_id = demo_tenant_id 
    LIMIT 1;

    -- If no subscription found, create a demo subscription ID
    IF demo_subscription_id IS NULL THEN
        demo_subscription_id := '10000000-0000-0000-0000-000000000001'::UUID;
    END IF;

    -- Get a partner if exists
    SELECT _id INTO partner_id 
    FROM tenants 
    WHERE _id != demo_tenant_id 
    LIMIT 1;

    -- ============================================
    -- 1. PAID Invoice (Last month)
    -- ============================================
    INSERT INTO subscription_invoices (
        _id,
        tenant_id,
        partner_id,
        subscription_id,
        invoice_number,
        amount,
        currency_code,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        paid_at,
        price_adjustments,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        partner_id,
        demo_subscription_id,
        'INV-2024-12-001',
        2990000.00,
        'VND',
        'PAID',
        '2024-12-01 00:00:00+07',
        '2024-12-31 23:59:59+07',
        '2025-01-15 23:59:59+07',
        '2025-01-10 14:30:00+07',
        '[
            {
                "type": "tax",
                "description": "VAT 10%",
                "amount": 299000.00
            }
        ]'::jsonb,
        '{
            "payment_method": "bank_transfer",
            "payment_reference": "BT20250110143000",
            "notes": "Paid via bank transfer"
        }'::jsonb,
        '2024-12-01 00:00:00+07',
        '2025-01-10 14:30:00+07'
    );
    invoice_count := invoice_count + 1;

    -- ============================================
    -- 2. OPEN Invoice (Current month - awaiting payment)
    -- ============================================
    INSERT INTO subscription_invoices (
        _id,
        tenant_id,
        partner_id,
        subscription_id,
        invoice_number,
        amount,
        currency_code,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        paid_at,
        price_adjustments,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        partner_id,
        demo_subscription_id,
        'INV-2025-01-001',
        2990000.00,
        'VND',
        'OPEN',
        '2025-01-01 00:00:00+07',
        '2025-01-31 23:59:59+07',
        '2025-02-15 23:59:59+07',
        NULL,
        '[
            {
                "type": "tax",
                "description": "VAT 10%",
                "amount": 299000.00
            },
            {
                "type": "discount",
                "description": "Loyalty discount 5%",
                "amount": 149500.00
            }
        ]'::jsonb,
        '{
            "auto_reminder_sent": false,
            "reminder_count": 0
        }'::jsonb,
        '2025-01-01 00:00:00+07',
        '2025-01-01 00:00:00+07'
    );
    invoice_count := invoice_count + 1;

    -- ============================================
    -- 3. DRAFT Invoice (Next month - not sent yet)
    -- ============================================
    INSERT INTO subscription_invoices (
        _id,
        tenant_id,
        partner_id,
        subscription_id,
        invoice_number,
        amount,
        currency_code,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        paid_at,
        price_adjustments,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        partner_id,
        demo_subscription_id,
        'INV-2025-02-001',
        2990000.00,
        'VND',
        'DRAFT',
        '2025-02-01 00:00:00+07',
        '2025-02-28 23:59:59+07',
        '2025-03-15 23:59:59+07',
        NULL,
        '[
            {
                "type": "tax",
                "description": "VAT 10%",
                "amount": 299000.00
            }
        ]'::jsonb,
        '{
            "is_draft": true,
            "prepared_by": "system"
        }'::jsonb,
        '2025-01-25 00:00:00+07',
        '2025-01-25 00:00:00+07'
    );
    invoice_count := invoice_count + 1;

    -- ============================================
    -- 4. PAID Invoice with Multiple Adjustments (2 months ago)
    -- ============================================
    INSERT INTO subscription_invoices (
        _id,
        tenant_id,
        partner_id,
        subscription_id,
        invoice_number,
        amount,
        currency_code,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        paid_at,
        price_adjustments,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        partner_id,
        demo_subscription_id,
        'INV-2024-11-001',
        2990000.00,
        'VND',
        'PAID',
        '2024-11-01 00:00:00+07',
        '2024-11-30 23:59:59+07',
        '2024-12-15 23:59:59+07',
        '2024-12-08 10:15:00+07',
        '[
            {
                "type": "tax",
                "description": "VAT 10%",
                "amount": 299000.00
            },
            {
                "type": "discount",
                "description": "Early payment discount",
                "amount": 89700.00
            },
            {
                "type": "fee",
                "description": "Setup fee",
                "amount": 500000.00
            }
        ]'::jsonb,
        '{
            "payment_method": "credit_card",
            "payment_reference": "CC20241208101500",
            "notes": "Paid with credit card - early payment discount applied"
        }'::jsonb,
        '2024-11-01 00:00:00+07',
        '2024-12-08 10:15:00+07'
    );
    invoice_count := invoice_count + 1;

    -- ============================================
    -- 5. VOID Invoice (Cancelled)
    -- ============================================
    INSERT INTO subscription_invoices (
        _id,
        tenant_id,
        partner_id,
        subscription_id,
        invoice_number,
        amount,
        currency_code,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        paid_at,
        price_adjustments,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        partner_id,
        demo_subscription_id,
        'INV-2024-10-001',
        2990000.00,
        'VND',
        'VOID',
        '2024-10-01 00:00:00+07',
        '2024-10-31 23:59:59+07',
        '2024-11-15 23:59:59+07',
        NULL,
        '[
            {
                "type": "tax",
                "description": "VAT 10%",
                "amount": 299000.00
            }
        ]'::jsonb,
        '{
            "void_reason": "Duplicate invoice created by error",
            "voided_at": "2024-10-05T10:00:00+07:00",
            "voided_by": "admin"
        }'::jsonb,
        '2024-10-01 00:00:00+07',
        '2024-10-05 10:00:00+07'
    );
    invoice_count := invoice_count + 1;

    -- ============================================
    -- 6. UNCOLLECTIBLE Invoice (Customer payment failed)
    -- ============================================
    INSERT INTO subscription_invoices (
        _id,
        tenant_id,
        partner_id,
        subscription_id,
        invoice_number,
        amount,
        currency_code,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        paid_at,
        price_adjustments,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        partner_id,
        demo_subscription_id,
        'INV-2024-09-001',
        2990000.00,
        'VND',
        'UNCOLLECTIBLE',
        '2024-09-01 00:00:00+07',
        '2024-09-30 23:59:59+07',
        '2024-10-15 23:59:59+07',
        NULL,
        '[
            {
                "type": "tax",
                "description": "VAT 10%",
                "amount": 299000.00
            }
        ]'::jsonb,
        '{
            "uncollectible_reason": "Customer account suspended - payment method invalid",
            "marked_uncollectible_at": "2024-11-01T00:00:00+07:00",
            "collection_attempts": 5
        }'::jsonb,
        '2024-09-01 00:00:00+07',
        '2024-11-01 00:00:00+07'
    );
    invoice_count := invoice_count + 1;

    -- ============================================
    -- 7. OPEN Invoice in USD (International customer)
    -- ============================================
    INSERT INTO subscription_invoices (
        _id,
        tenant_id,
        partner_id,
        subscription_id,
        invoice_number,
        amount,
        currency_code,
        status,
        billing_period_start,
        billing_period_end,
        due_date,
        paid_at,
        price_adjustments,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        partner_id,
        demo_subscription_id,
        'INV-2025-01-INT-001',
        129.00,
        'USD',
        'OPEN',
        '2025-01-01 00:00:00+07',
        '2025-01-31 23:59:59+07',
        '2025-02-15 23:59:59+07',
        NULL,
        '[
            {
                "type": "tax",
                "description": "Sales Tax 8%",
                "amount": 10.32
            }
        ]'::jsonb,
        '{
            "customer_country": "US",
            "exchange_rate": 23178.50,
            "original_amount_vnd": 2990000.00
        }'::jsonb,
        '2025-01-01 00:00:00+07',
        '2025-01-01 00:00:00+07'
    );
    invoice_count := invoice_count + 1;

    RAISE NOTICE 'Successfully inserted % demo subscription invoices', invoice_count;
END $$;

-- Add comments
COMMENT ON TABLE subscription_invoices IS 'Subscription invoices with demo data for testing';

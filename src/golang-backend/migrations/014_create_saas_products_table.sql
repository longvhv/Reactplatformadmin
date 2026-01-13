-- =====================================================
-- Migration: 014 - Create saas_products table
-- Description: SaaS Product master data (HRM Suite, CRM Suite, etc.)
--              Distinguishes from business app "products" (inventory items)
-- Schema: Tenant-specific table
-- =====================================================

-- Create saas_products table
CREATE TABLE IF NOT EXISTS saas_products (
    -- Primary Key
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Core fields
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Product type reference
    product_type_code VARCHAR(50),
    
    -- Pricing
    base_price NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- Billing configuration
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    trial_days INTEGER NOT NULL DEFAULT 0,
    
    -- Features & capabilities
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    
    -- Business status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    -- Optimistic locking
    version BIGINT NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT chk_saas_products_code CHECK (code ~ '^[a-z0-9-]+$'),
    CONSTRAINT chk_saas_products_status CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT chk_saas_products_billing_cycle CHECK (billing_cycle IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME')),
    CONSTRAINT chk_saas_products_version CHECK (version >= 1),
    CONSTRAINT chk_saas_products_base_price CHECK (base_price >= 0),
    CONSTRAINT chk_saas_products_trial_days CHECK (trial_days >= 0),
    CONSTRAINT uq_saas_products_tenant_code UNIQUE (tenant_id, code)
);

-- Indexes for performance
CREATE INDEX idx_saas_products_tenant_id ON saas_products(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_saas_products_code ON saas_products(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_saas_products_status ON saas_products(status, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_saas_products_product_type ON saas_products(product_type_code, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_saas_products_featured ON saas_products(is_featured, display_order) WHERE deleted_at IS NULL AND status = 'active';

-- GIN index for JSONB fields
CREATE INDEX idx_saas_products_features_gin ON saas_products USING GIN (features);
CREATE INDEX idx_saas_products_limits_gin ON saas_products USING GIN (limits);
CREATE INDEX idx_saas_products_metadata_gin ON saas_products USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_saas_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_saas_products_updated_at
    BEFORE UPDATE ON saas_products
    FOR EACH ROW
    EXECUTE FUNCTION update_saas_products_updated_at();

-- =====================================================
-- Demo Data: 20 SaaS Products
-- =====================================================

-- Tenant ID for demo (replace with actual tenant_id)
DO $$
DECLARE
    demo_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- 1. HRM Suite
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'hrm-suite-pro',
        'HRM Suite Professional',
        'Giải pháp quản lý nhân sự toàn diện với chấm công, tính lương, đánh giá KPI',
        'APP',
        2990000,
        'VND',
        'MONTHLY',
        14,
        '{"modules": ["attendance", "payroll", "recruitment", "performance"], "integrations": ["slack", "google-workspace"], "support": "24/7"}'::jsonb,
        '{"max_employees": 100, "max_departments": 20, "storage_gb": 50}'::jsonb,
        'active',
        true,
        1,
        demo_user_id
    );

    -- 2. CRM Suite
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'crm-suite-enterprise',
        'CRM Suite Enterprise',
        'Quản lý quan hệ khách hàng với AI-powered insights và automation',
        'APP',
        4990000,
        'VND',
        'MONTHLY',
        30,
        '{"modules": ["leads", "deals", "campaigns", "analytics"], "ai_features": ["lead_scoring", "sales_forecast"], "api_access": true}'::jsonb,
        '{"max_contacts": 10000, "max_users": 50, "email_quota": 50000}'::jsonb,
        'active',
        true,
        2,
        demo_user_id
    );

    -- 3. Project Management
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'pm-agile-pro',
        'Project Management Agile Pro',
        'Quản lý dự án Agile/Scrum với Kanban board, Gantt chart, time tracking',
        'APP',
        1990000,
        'VND',
        'MONTHLY',
        7,
        '{"boards": ["kanban", "scrum", "gantt"], "integrations": ["jira", "github", "gitlab"], "reports": ["velocity", "burndown"]}'::jsonb,
        '{"max_projects": 50, "max_team_members": 30, "storage_gb": 100}'::jsonb,
        'active',
        true,
        3,
        demo_user_id
    );

    -- 4. Custom Domain
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'custom-domain-basic',
        'Custom Domain Basic',
        'Kết nối tên miền riêng với SSL miễn phí',
        'DOMAIN',
        99000,
        'VND',
        'MONTHLY',
        0,
        '{"ssl_included": true, "dns_management": true, "subdomain_support": true}'::jsonb,
        '{"max_domains": 1, "max_subdomains": 5}'::jsonb,
        'active',
        false,
        10,
        demo_user_id
    );

    -- 5. SSL Certificate
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'ssl-premium',
        'SSL Certificate Premium',
        'Chứng chỉ SSL Extended Validation (EV) với bảo hiểm $1M',
        'SSL',
        1990000,
        'VND',
        'YEARLY',
        0,
        '{"type": "EV", "warranty": "1000000_USD", "support": "priority"}'::jsonb,
        '{"domains": 1}'::jsonb,
        'active',
        false,
        11,
        demo_user_id
    );

    -- 6. Cloud Storage
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'storage-business-500gb',
        'Cloud Storage Business 500GB',
        'Lưu trữ đám mây bảo mật cao với backup tự động',
        'STORAGE',
        490000,
        'VND',
        'MONTHLY',
        7,
        '{"backup": "daily", "versioning": true, "encryption": "AES-256", "cdn": true}'::jsonb,
        '{"storage_gb": 500, "bandwidth_gb": 1000, "max_file_size_gb": 10}'::jsonb,
        'active',
        false,
        12,
        demo_user_id
    );

    -- 7. Email Marketing
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'email-marketing-pro',
        'Email Marketing Pro',
        'Gửi email marketing chuyên nghiệp với A/B testing và analytics',
        'EMAIL',
        890000,
        'VND',
        'MONTHLY',
        14,
        '{"templates": 500, "automation": true, "ab_testing": true, "analytics": "advanced"}'::jsonb,
        '{"contacts": 10000, "emails_per_month": 100000, "sending_domains": 3}'::jsonb,
        'active',
        false,
        13,
        demo_user_id
    );

    -- 8. API Access
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'api-enterprise',
        'API Access Enterprise',
        'Truy cập API không giới hạn với SLA 99.9%',
        'API_ACCESS',
        2490000,
        'VND',
        'MONTHLY',
        0,
        '{"rate_limiting": "unlimited", "sla": "99.9", "webhook_support": true, "graphql": true}'::jsonb,
        '{"requests_per_second": 1000, "webhook_endpoints": 100}'::jsonb,
        'active',
        false,
        14,
        demo_user_id
    );

    -- 9. SMS Service
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'sms-business-10k',
        'SMS Business 10K',
        'Gói 10,000 tin nhắn SMS Brandname',
        'SMS',
        990000,
        'VND',
        'MONTHLY',
        0,
        '{"brandname": true, "two_way": true, "unicode": true, "scheduling": true}'::jsonb,
        '{"messages": 10000, "brandnames": 3}'::jsonb,
        'active',
        false,
        15,
        demo_user_id
    );

    -- 10. Analytics Platform
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'analytics-advanced',
        'Analytics Platform Advanced',
        'Phân tích dữ liệu nâng cao với AI/ML insights',
        'ANALYTICS',
        3490000,
        'VND',
        'MONTHLY',
        14,
        '{"dashboards": "unlimited", "ai_insights": true, "export": ["pdf", "excel", "csv"], "alerts": true}'::jsonb,
        '{"data_retention_months": 24, "custom_reports": 100, "api_calls": 1000000}'::jsonb,
        'active',
        false,
        16,
        demo_user_id
    );

    -- 11. Accounting Software
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'accounting-standard',
        'Accounting Software Standard',
        'Phần mềm kế toán chuẩn VAS với hóa đơn điện tử',
        'APP',
        1490000,
        'VND',
        'MONTHLY',
        30,
        '{"modules": ["general_ledger", "ap", "ar", "inventory"], "e_invoice": true, "reports": "standard"}'::jsonb,
        '{"transactions_per_month": 5000, "bank_accounts": 10, "users": 5}'::jsonb,
        'active',
        false,
        4,
        demo_user_id
    );

    -- 12. Live Chat Support
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'livechat-pro',
        'Live Chat Support Pro',
        'Live chat với AI chatbot và multi-channel support',
        'CHAT',
        690000,
        'VND',
        'MONTHLY',
        7,
        '{"channels": ["website", "facebook", "zalo"], "chatbot": true, "canned_responses": true, "file_transfer": true}'::jsonb,
        '{"agents": 10, "conversations_per_month": 5000, "chat_history_months": 12}'::jsonb,
        'active',
        false,
        17,
        demo_user_id
    );

    -- 13. Backup Service
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'backup-enterprise',
        'Backup Service Enterprise',
        'Sao lưu tự động với khôi phục point-in-time',
        'BACKUP',
        790000,
        'VND',
        'MONTHLY',
        7,
        '{"frequency": "hourly", "retention_days": 90, "point_in_time_recovery": true, "geo_redundancy": true}'::jsonb,
        '{"storage_gb": 1000, "snapshots": 100}'::jsonb,
        'active',
        false,
        18,
        demo_user_id
    );

    -- 14. CDN Service
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'cdn-global',
        'CDN Global Network',
        'Content Delivery Network với 200+ PoP toàn cầu',
        'CDN',
        1290000,
        'VND',
        'MONTHLY',
        0,
        '{"pop_locations": 200, "ssl": true, "ddos_protection": true, "image_optimization": true}'::jsonb,
        '{"bandwidth_gb": 5000, "requests": 10000000}'::jsonb,
        'active',
        false,
        19,
        demo_user_id
    );

    -- 15. Security Suite
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'security-premium',
        'Security Suite Premium',
        'Bảo mật toàn diện với WAF, DDoS protection, SSL monitoring',
        'SECURITY',
        2990000,
        'VND',
        'MONTHLY',
        7,
        '{"waf": true, "ddos_protection": "100gbps", "ssl_monitoring": true, "vulnerability_scan": "daily"}'::jsonb,
        '{"protected_domains": 10, "firewall_rules": 500}'::jsonb,
        'active',
        false,
        20,
        demo_user_id
    );

    -- 16. E-commerce Platform
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'ecommerce-pro',
        'E-commerce Platform Pro',
        'Nền tảng thương mại điện tử với thanh toán đa kênh',
        'APP',
        3990000,
        'VND',
        'MONTHLY',
        14,
        '{"payment_gateways": ["vnpay", "momo", "zalopay"], "inventory": true, "multi_store": true, "pos": true}'::jsonb,
        '{"products": 10000, "orders_per_month": 5000, "stores": 5}'::jsonb,
        'active',
        true,
        4,
        demo_user_id
    );

    -- 17. Database Hosting
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'database-managed-50gb',
        'Managed Database 50GB',
        'PostgreSQL/MySQL managed với backup tự động',
        'DATABASE',
        1490000,
        'VND',
        'MONTHLY',
        7,
        '{"engines": ["postgresql", "mysql"], "backup": "automated", "replication": "master_slave", "monitoring": true}'::jsonb,
        '{"storage_gb": 50, "connections": 100, "cpu_cores": 4, "ram_gb": 16}'::jsonb,
        'active',
        false,
        21,
        demo_user_id
    );

    -- 18. Video Conferencing
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'video-conference-business',
        'Video Conferencing Business',
        'Họp trực tuyến HD với recording và transcription',
        'VIDEO',
        1290000,
        'VND',
        'MONTHLY',
        14,
        '{"quality": "1080p", "recording": true, "transcription": true, "virtual_background": true}'::jsonb,
        '{"participants": 100, "meeting_minutes": 10000, "storage_gb": 100}'::jsonb,
        'active',
        false,
        22,
        demo_user_id
    );

    -- 19. Marketing Automation
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'marketing-automation-pro',
        'Marketing Automation Pro',
        'Tự động hóa marketing đa kênh với AI personalization',
        'MARKETING',
        2490000,
        'VND',
        'MONTHLY',
        14,
        '{"channels": ["email", "sms", "push", "web"], "ai_personalization": true, "journey_builder": true, "attribution": true}'::jsonb,
        '{"contacts": 50000, "campaigns": 100, "automations": 50}'::jsonb,
        'active',
        false,
        23,
        demo_user_id
    );

    -- 20. White Label Platform
    INSERT INTO saas_products (_id, tenant_id, code, name, description, product_type_code, base_price, currency, billing_cycle, trial_days, features, limits, status, is_featured, display_order, created_by)
    VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'whitelabel-ultimate',
        'White Label Platform Ultimate',
        'Nền tảng white label hoàn toàn với multi-tenant architecture',
        'INFRASTRUCTURE',
        9990000,
        'VND',
        'MONTHLY',
        30,
        '{"custom_branding": true, "custom_domain": true, "api_access": "full", "source_code": false, "dedicated_support": true}'::jsonb,
        '{"tenants": 1000, "users_per_tenant": 500, "storage_tb": 5}'::jsonb,
        'active',
        true,
        5,
        demo_user_id
    );

END $$;

-- =====================================================
-- End of Migration 014
-- =====================================================

-- Migration: Create Tenant Management Tables
-- Version: 003
-- Description: Tables for multi-tenant SaaS management

-- ============================================
-- Table: tenants
-- Description: Main tenant/customer table
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'trial',
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free',
    subscription_start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subscription_end_date TIMESTAMP NOT NULL,
    max_users INT NOT NULL DEFAULT 3,
    current_users INT NOT NULL DEFAULT 0,
    max_storage INT NOT NULL DEFAULT 10,
    current_storage INT NOT NULL DEFAULT 0,
    billing_email VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    logo VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_tenants_status (status),
    INDEX idx_tenants_tier (subscription_tier),
    INDEX idx_tenants_slug (slug),
    INDEX idx_tenants_created (created_at),
    
    CONSTRAINT chk_status CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
    CONSTRAINT chk_tier CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tenant_features
-- Description: Features assigned to tenants
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    feature_code VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tenant_feature (tenant_id, feature_code),
    INDEX idx_tenant_features_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tenant_metadata
-- Description: Flexible metadata for tenants
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    meta_key VARCHAR(100) NOT NULL,
    meta_value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tenant_metadata (tenant_id, meta_key),
    INDEX idx_tenant_metadata_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: subscription_plans
-- Description: Available subscription plans
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    tier VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_users INT NOT NULL,
    max_storage INT NOT NULL,
    max_api_calls_per_month BIGINT NOT NULL,
    max_projects INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: plan_features
-- Description: Features included in each plan
-- ============================================
CREATE TABLE IF NOT EXISTS plan_features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id VARCHAR(50) NOT NULL,
    feature_code VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    included BOOLEAN NOT NULL DEFAULT TRUE,
    feature_description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    UNIQUE KEY uk_plan_feature (plan_id, feature_code),
    INDEX idx_plan_features_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: usage_metrics
-- Description: Daily usage tracking per tenant
-- ============================================
CREATE TABLE IF NOT EXISTS usage_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    metric_date DATE NOT NULL,
    active_users INT NOT NULL DEFAULT 0,
    storage_used DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    api_calls BIGINT NOT NULL DEFAULT 0,
    bandwidth DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tenant_date (tenant_id, metric_date),
    INDEX idx_usage_tenant_date (tenant_id, metric_date),
    INDEX idx_usage_date (metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: invoices
-- Description: Billing invoices
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_invoices_tenant (tenant_id),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_date (issue_date),
    
    CONSTRAINT chk_invoice_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: invoice_items
-- Description: Line items in invoices
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_items_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tenant_audit_log
-- Description: Audit trail for tenant changes
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_value JSON,
    new_value JSON,
    performed_by VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_audit_tenant (tenant_id),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert default subscription plans
-- ============================================
INSERT INTO subscription_plans (id, tier, name, description, price_monthly, price_yearly, max_users, max_storage, max_api_calls_per_month, max_projects) VALUES
('plan-free', 'free', 'Free', 'Cho cá nhân và dự án nhỏ', 0.00, 0.00, 3, 10, 1000, 5),
('plan-starter', 'starter', 'Starter', 'Cho startup và đội nhóm nhỏ', 29.00, 290.00, 10, 50, 10000, 20),
('plan-professional', 'professional', 'Professional', 'Cho doanh nghiệp vừa và nhỏ', 99.00, 990.00, 50, 200, 100000, 100),
('plan-enterprise', 'enterprise', 'Enterprise', 'Cho tổ chức lớn', 299.00, 2990.00, 200, 1000, 1000000, -1);

-- ============================================
-- Insert plan features
-- ============================================
INSERT INTO plan_features (plan_id, feature_code, feature_name, included, feature_description) VALUES
-- Free plan features
('plan-free', 'basic_support', 'Hỗ trợ cơ bản', TRUE, 'Email support'),
('plan-free', 'basic_analytics', 'Phân tích cơ bản', TRUE, 'Basic dashboard'),
('plan-free', 'api_access', 'API Access', FALSE, NULL),

-- Starter plan features
('plan-starter', 'basic_support', 'Hỗ trợ cơ bản', TRUE, 'Email support (24h response)'),
('plan-starter', 'basic_analytics', 'Phân tích cơ bản', TRUE, 'Basic dashboard'),
('plan-starter', 'api_access', 'API Access', TRUE, 'REST API'),

-- Professional plan features
('plan-professional', 'basic_support', 'Hỗ trợ cơ bản', TRUE, 'Email & chat support'),
('plan-professional', 'basic_analytics', 'Phân tích cơ bản', TRUE, 'Advanced reports'),
('plan-professional', 'api_access', 'API Access', TRUE, 'REST API + Webhooks'),
('plan-professional', 'custom_branding', 'Tùy chỉnh thương hiệu', TRUE, 'Custom logo & colors'),
('plan-professional', 'advanced_analytics', 'Phân tích nâng cao', TRUE, 'Advanced reports & exports'),

-- Enterprise plan features
('plan-enterprise', 'basic_support', 'Hỗ trợ 24/7', TRUE, '24/7 priority support'),
('plan-enterprise', 'api_access', 'Full API', TRUE, 'Full API + Webhooks + GraphQL'),
('plan-enterprise', 'custom_branding', 'White Label', TRUE, 'Complete white-label'),
('plan-enterprise', 'advanced_analytics', 'Custom BI', TRUE, 'Custom reports & BI'),
('plan-enterprise', 'sso', 'SSO', TRUE, 'SAML/OAuth SSO'),
('plan-enterprise', 'priority_support', 'Dedicated Manager', TRUE, 'Account manager'),
('plan-enterprise', 'custom_domain', 'Custom Domain', TRUE, 'Custom domain & SSL'),
('plan-enterprise', 'white_label', 'White Label', TRUE, 'Complete white-labeling'),
('plan-enterprise', 'sla', 'SLA', TRUE, '99.9% uptime SLA');

-- ============================================
-- Create indexes for performance
-- ============================================
-- Already created inline with tables above

-- ============================================
-- End of migration
-- ============================================

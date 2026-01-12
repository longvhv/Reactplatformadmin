-- Migration: 004_create_tenants_table
-- Description: Create tenants table for multi-tenant SaaS management
-- Author: System
-- Date: 2026-01-08

-- ============================================
-- Table: tenants
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    domain VARCHAR(255),
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'starter',
    subscription_end_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'trial',
    max_users INT NOT NULL DEFAULT 10,
    current_users INT NOT NULL DEFAULT 0,
    max_storage INT NOT NULL DEFAULT 10,
    current_storage DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    billing_email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Constraints
    CONSTRAINT chk_subscription_tier CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
    CONSTRAINT chk_max_users CHECK (max_users > 0),
    CONSTRAINT chk_current_users CHECK (current_users >= 0),
    CONSTRAINT chk_max_storage CHECK (max_storage > 0),
    CONSTRAINT chk_current_storage CHECK (current_storage >= 0),
    CONSTRAINT chk_user_limit CHECK (current_users <= max_users),
    CONSTRAINT chk_storage_limit CHECK (current_storage <= max_storage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tenant_usage_metrics
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    users INT NOT NULL DEFAULT 0,
    storage DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    api_calls INT NOT NULL DEFAULT 0,
    bandwidth DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint for one metric per tenant per day
    UNIQUE KEY unique_tenant_date (tenant_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tenant_invoices
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_invoices (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_invoice_status CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    CONSTRAINT chk_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tenant_users
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    invited_by BIGINT,
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique constraint
    UNIQUE KEY unique_tenant_user (tenant_id, user_id),
    
    -- Constraints
    CONSTRAINT chk_user_role CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    CONSTRAINT chk_user_status CHECK (status IN ('active', 'inactive', 'pending'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tenant_activity_log
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Indexes
-- ============================================

-- tenants table indexes
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_subscription_tier ON tenants(subscription_tier);
CREATE INDEX idx_tenants_subscription_end_date ON tenants(subscription_end_date);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at);

-- tenant_usage_metrics indexes
CREATE INDEX idx_usage_metrics_date ON tenant_usage_metrics(date);
CREATE INDEX idx_usage_metrics_tenant_date ON tenant_usage_metrics(tenant_id, date DESC);

-- tenant_invoices indexes
CREATE INDEX idx_invoices_tenant ON tenant_invoices(tenant_id);
CREATE INDEX idx_invoices_status ON tenant_invoices(status);
CREATE INDEX idx_invoices_due_date ON tenant_invoices(due_date);
CREATE INDEX idx_invoices_billing_period ON tenant_invoices(billing_period_start, billing_period_end);

-- tenant_users indexes
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_role ON tenant_users(role);
CREATE INDEX idx_tenant_users_status ON tenant_users(status);
CREATE INDEX idx_tenant_users_last_active ON tenant_users(last_active_at);

-- tenant_activity_log indexes
CREATE INDEX idx_activity_log_tenant ON tenant_activity_log(tenant_id);
CREATE INDEX idx_activity_log_user ON tenant_activity_log(user_id);
CREATE INDEX idx_activity_log_action ON tenant_activity_log(action);
CREATE INDEX idx_activity_log_created_at ON tenant_activity_log(created_at DESC);

-- ============================================
-- Triggers
-- ============================================

-- Trigger to update tenant current_users count
DELIMITER $$

CREATE TRIGGER trg_update_tenant_user_count_insert
AFTER INSERT ON tenant_users
FOR EACH ROW
BEGIN
    IF NEW.status = 'active' THEN
        UPDATE tenants 
        SET current_users = current_users + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.tenant_id;
    END IF;
END$$

CREATE TRIGGER trg_update_tenant_user_count_update
AFTER UPDATE ON tenant_users
FOR EACH ROW
BEGIN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE tenants 
        SET current_users = current_users - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.tenant_id;
    ELSEIF OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE tenants 
        SET current_users = current_users + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.tenant_id;
    END IF;
END$$

CREATE TRIGGER trg_update_tenant_user_count_delete
AFTER DELETE ON tenant_users
FOR EACH ROW
BEGIN
    IF OLD.status = 'active' THEN
        UPDATE tenants 
        SET current_users = current_users - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.tenant_id;
    END IF;
END$$

DELIMITER ;

-- ============================================
-- Sample Data (for development only)
-- ============================================

INSERT INTO tenants (id, name, slug, domain, subscription_tier, subscription_end_date, status, max_users, current_users, max_storage, current_storage, billing_email, phone) VALUES
('tenant-1704672000000', 'Acme Corporation', 'acme-corp', 'acme.example.com', 'enterprise', '2026-12-31 23:59:59', 'active', 100, 45, 500, 234.50, 'billing@acme.com', '+1-555-0100'),
('tenant-1704672001000', 'TechStart Inc', 'techstart', 'techstart.io', 'professional', '2026-06-30 23:59:59', 'active', 50, 28, 200, 145.30, 'finance@techstart.io', '+1-555-0200'),
('tenant-1704672002000', 'Creative Studio', 'creative-studio', 'creative.design', 'starter', '2026-03-31 23:59:59', 'trial', 10, 5, 50, 23.70, 'admin@creative.design', '+1-555-0300');

-- ============================================
-- Comments
-- ============================================

ALTER TABLE tenants 
COMMENT = 'Multi-tenant organizations and subscriptions';

ALTER TABLE tenant_usage_metrics 
COMMENT = 'Daily usage metrics per tenant';

ALTER TABLE tenant_invoices 
COMMENT = 'Billing invoices for tenant subscriptions';

ALTER TABLE tenant_users 
COMMENT = 'Users associated with each tenant';

ALTER TABLE tenant_activity_log 
COMMENT = 'Audit log of tenant activities';

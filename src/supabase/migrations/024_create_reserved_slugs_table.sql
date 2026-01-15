-- =====================================================
-- Migration 024: Create Reserved Slugs Table
-- =====================================================
-- Purpose: Manage system-wide reserved slugs/keywords
-- Author: AI Assistant
-- Date: 2026-01-15
-- Production-ready: ✅
-- =====================================================

-- ==================== CREATE TABLE ====================

CREATE TABLE IF NOT EXISTS reserved_slugs (
    -- I. Định danh (Identity)
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- II. Thông tin Từ khóa (Slug Info)
    slug VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    match_type VARCHAR(20) NOT NULL DEFAULT 'EXACT',
    
    -- III. Ngữ cảnh & Snapshot (Context)
    -- items_snapshot: Lưu trữ metadata linh hoạt
    -- Ví dụ: { "affected_routes": ["/api/v1", "/static"], "reserved_by": "System Admin", "ticket_id": "OPS-123" }
    items_snapshot JSONB NOT NULL DEFAULT '{}',
    
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- IV. Audit & Versioning
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 1,

    -- V. Ràng buộc dữ liệu (Constraints)
    
    -- Từ khóa cấm phải là duy nhất
    CONSTRAINT uq_reserved_slug UNIQUE (slug),
    
    -- Chỉ cho phép ký tự URL friendly (chữ thường, số, gạch ngang)
    CONSTRAINT chk_reserved_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    
    -- Kiểm tra giá trị hợp lệ cho phân loại
    CONSTRAINT chk_reserved_type CHECK (type IN ('SYSTEM', 'BUSINESS', 'OFFENSIVE', 'FUTURE')),
    
    -- Kiểm tra cách thức so khớp
    CONSTRAINT chk_match_type CHECK (match_type IN ('EXACT', 'PREFIX', 'REGEX')),
    
    -- Kiểm tra logic thời gian
    CONSTRAINT chk_reserved_dates CHECK (updated_at >= created_at),
    
    -- Kiểm tra phiên bản
    CONSTRAINT chk_reserved_version CHECK (version >= 1)
);

-- ==================== COMMENTS ====================

COMMENT ON TABLE reserved_slugs IS 'Quản lý các slug/từ khóa cấm của hệ thống';

COMMENT ON COLUMN reserved_slugs._id IS 'Primary key - UUID v7 khuyến nghị từ application layer';
COMMENT ON COLUMN reserved_slugs.slug IS 'Slug/từ khóa cấm (chữ thường, số, gạch ngang)';
COMMENT ON COLUMN reserved_slugs.type IS 'Phân loại: SYSTEM, BUSINESS, OFFENSIVE, FUTURE';
COMMENT ON COLUMN reserved_slugs.match_type IS 'Cách thức so khớp: EXACT, PREFIX, REGEX';
COMMENT ON COLUMN reserved_slugs.items_snapshot IS 'Metadata linh hoạt (JSONB)';
COMMENT ON COLUMN reserved_slugs.reason IS 'Lý do đặt từ khóa cấm';
COMMENT ON COLUMN reserved_slugs.is_active IS 'Trạng thái kích hoạt';
COMMENT ON COLUMN reserved_slugs.version IS 'Version cho optimistic locking';

-- ==================== INDEXES ====================

-- Index cho lookup slug nhanh
CREATE INDEX IF NOT EXISTS idx_reserved_slugs_slug 
ON reserved_slugs(slug) 
WHERE deleted_at IS NULL;

-- Index cho filter theo type
CREATE INDEX IF NOT EXISTS idx_reserved_slugs_type 
ON reserved_slugs(type) 
WHERE deleted_at IS NULL;

-- Index cho filter theo is_active
CREATE INDEX IF NOT EXISTS idx_reserved_slugs_active 
ON reserved_slugs(is_active) 
WHERE deleted_at IS NULL;

-- Index cho pattern matching
CREATE INDEX IF NOT EXISTS idx_reserved_slugs_match_type 
ON reserved_slugs(match_type) 
WHERE deleted_at IS NULL;

-- Composite index cho common queries
CREATE INDEX IF NOT EXISTS idx_reserved_slugs_type_active 
ON reserved_slugs(type, is_active) 
WHERE deleted_at IS NULL;

-- Index cho JSONB queries
CREATE INDEX IF NOT EXISTS idx_reserved_slugs_snapshot 
ON reserved_slugs USING GIN(items_snapshot);

-- ==================== TRIGGER FOR updated_at ====================

CREATE OR REPLACE FUNCTION update_reserved_slugs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reserved_slugs_updated_at
    BEFORE UPDATE ON reserved_slugs
    FOR EACH ROW
    EXECUTE FUNCTION update_reserved_slugs_updated_at();

-- ==================== SOFT DELETE SUPPORT ====================

-- Add deleted_at column for soft delete
ALTER TABLE reserved_slugs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN reserved_slugs.deleted_at IS 'Soft delete timestamp';

-- Index cho soft delete
CREATE INDEX IF NOT EXISTS idx_reserved_slugs_deleted 
ON reserved_slugs(deleted_at);

-- ==================== SEED DATA ====================

-- Insert common system reserved slugs
INSERT INTO reserved_slugs (slug, type, match_type, reason, items_snapshot) VALUES
-- System/Technical slugs
('admin', 'SYSTEM', 'EXACT', 'Reserved for admin panel', '{"affected_routes": ["/admin"], "reserved_by": "System"}'),
('api', 'SYSTEM', 'EXACT', 'Reserved for API routes', '{"affected_routes": ["/api"], "reserved_by": "System"}'),
('auth', 'SYSTEM', 'EXACT', 'Reserved for authentication', '{"affected_routes": ["/auth"], "reserved_by": "System"}'),
('login', 'SYSTEM', 'EXACT', 'Reserved for login page', '{"affected_routes": ["/login"], "reserved_by": "System"}'),
('logout', 'SYSTEM', 'EXACT', 'Reserved for logout', '{"affected_routes": ["/logout"], "reserved_by": "System"}'),
('signup', 'SYSTEM', 'EXACT', 'Reserved for signup page', '{"affected_routes": ["/signup"], "reserved_by": "System"}'),
('register', 'SYSTEM', 'EXACT', 'Reserved for registration', '{"affected_routes": ["/register"], "reserved_by": "System"}'),
('dashboard', 'SYSTEM', 'EXACT', 'Reserved for dashboard', '{"affected_routes": ["/dashboard"], "reserved_by": "System"}'),
('settings', 'SYSTEM', 'EXACT', 'Reserved for settings', '{"affected_routes": ["/settings"], "reserved_by": "System"}'),
('profile', 'SYSTEM', 'EXACT', 'Reserved for user profile', '{"affected_routes": ["/profile"], "reserved_by": "System"}'),
('account', 'SYSTEM', 'EXACT', 'Reserved for account management', '{"affected_routes": ["/account"], "reserved_by": "System"}'),
('billing', 'SYSTEM', 'EXACT', 'Reserved for billing', '{"affected_routes": ["/billing"], "reserved_by": "System"}'),
('pricing', 'SYSTEM', 'EXACT', 'Reserved for pricing page', '{"affected_routes": ["/pricing"], "reserved_by": "System"}'),
('docs', 'SYSTEM', 'EXACT', 'Reserved for documentation', '{"affected_routes": ["/docs"], "reserved_by": "System"}'),
('help', 'SYSTEM', 'EXACT', 'Reserved for help center', '{"affected_routes": ["/help"], "reserved_by": "System"}'),
('support', 'SYSTEM', 'EXACT', 'Reserved for support', '{"affected_routes": ["/support"], "reserved_by": "System"}'),
('about', 'SYSTEM', 'EXACT', 'Reserved for about page', '{"affected_routes": ["/about"], "reserved_by": "System"}'),
('contact', 'SYSTEM', 'EXACT', 'Reserved for contact page', '{"affected_routes": ["/contact"], "reserved_by": "System"}'),
('terms', 'SYSTEM', 'EXACT', 'Reserved for terms of service', '{"affected_routes": ["/terms"], "reserved_by": "System"}'),
('privacy', 'SYSTEM', 'EXACT', 'Reserved for privacy policy', '{"affected_routes": ["/privacy"], "reserved_by": "System"}'),
('static', 'SYSTEM', 'EXACT', 'Reserved for static assets', '{"affected_routes": ["/static"], "reserved_by": "System"}'),
('assets', 'SYSTEM', 'EXACT', 'Reserved for assets', '{"affected_routes": ["/assets"], "reserved_by": "System"}'),
('public', 'SYSTEM', 'EXACT', 'Reserved for public resources', '{"affected_routes": ["/public"], "reserved_by": "System"}'),
('health', 'SYSTEM', 'EXACT', 'Reserved for health check', '{"affected_routes": ["/health"], "reserved_by": "System"}'),
('status', 'SYSTEM', 'EXACT', 'Reserved for status page', '{"affected_routes": ["/status"], "reserved_by": "System"}'),

-- Business reserved slugs
('core', 'BUSINESS', 'EXACT', 'Reserved for core modules', '{"reserved_by": "Business"}'),
('app', 'BUSINESS', 'EXACT', 'Reserved for app namespace', '{"reserved_by": "Business"}'),
('portal', 'BUSINESS', 'EXACT', 'Reserved for portal', '{"reserved_by": "Business"}'),
('console', 'BUSINESS', 'EXACT', 'Reserved for console', '{"reserved_by": "Business"}'),

-- Offensive/Security slugs
('fuck', 'OFFENSIVE', 'EXACT', 'Offensive language', '{"severity": "high"}'),
('shit', 'OFFENSIVE', 'EXACT', 'Offensive language', '{"severity": "high"}'),
('damn', 'OFFENSIVE', 'EXACT', 'Offensive language', '{"severity": "medium"}'),
('ass', 'OFFENSIVE', 'EXACT', 'Offensive language', '{"severity": "medium"}'),
('test', 'SYSTEM', 'EXACT', 'Reserved for testing', '{"reserved_by": "System"}'),
('demo', 'SYSTEM', 'EXACT', 'Reserved for demo', '{"reserved_by": "System"}'),
('sample', 'SYSTEM', 'EXACT', 'Reserved for samples', '{"reserved_by": "System"}')

ON CONFLICT (slug) DO NOTHING;

-- ==================== VERIFICATION ====================

-- Verify table creation
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM reserved_slugs) > 0, 'Reserved slugs seed data not inserted';
    RAISE NOTICE '✅ Migration 024 completed successfully';
    RAISE NOTICE '📊 Total reserved slugs: %', (SELECT COUNT(*) FROM reserved_slugs);
END $$;

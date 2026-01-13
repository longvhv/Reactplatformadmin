-- =====================================================
-- Migration 013: Create saas_product_types table
-- Description: Master Data table cho phân loại sản phẩm SaaS thương mại
-- Date: 2026-01-12
-- Standard: YSQL compliant với UUID v7, snake_case, audit trail
-- =====================================================

-- =====================================================
-- I. TẠO BẢNG saas_product_types
-- =====================================================
CREATE TABLE IF NOT EXISTS saas_product_types (
    -- I. ĐỊNH DANH & MÃ KỸ THUẬT
    _id UUID PRIMARY KEY,  -- UUID v7 được sinh từ Application layer
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- II. TRẠNG THÁI VẬN HÀNH
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- III. AUDIT & VERSIONING
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT NOT NULL DEFAULT 1,

    -- IV. CÁC RÀNG BUỘC
    CONSTRAINT uq_product_type_code UNIQUE (code),
    CONSTRAINT chk_product_type_code_fmt CHECK (code ~ '^[A-Z0-9_]+$'),
    CONSTRAINT chk_product_type_name_len CHECK (LENGTH(name) > 0),
    CONSTRAINT chk_product_type_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_product_type_version CHECK (version >= 1)
);

-- =====================================================
-- II. CHIẾN LƯỢC ĐÁNH INDEX (INDEXING STRATEGY)
-- =====================================================

-- Index hỗ trợ tìm kiếm nhanh theo mã loại sản phẩm (Dùng khi validate dữ liệu)
CREATE UNIQUE INDEX idx_product_types_code_lookup 
ON saas_product_types (code) 
WHERE is_active = TRUE;

-- Index hỗ trợ hiển thị danh sách các loại sản phẩm đang hoạt động trên Admin UI
CREATE INDEX idx_product_types_active 
ON saas_product_types (is_active, created_at DESC);

-- Index cho audit trail
CREATE INDEX idx_product_types_created_at ON saas_product_types (created_at DESC);

-- =====================================================
-- III. TRIGGER TỰ ĐỘNG CẬP NHẬT updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_saas_product_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_saas_product_types_updated_at ON saas_product_types;
CREATE TRIGGER trigger_saas_product_types_updated_at
    BEFORE UPDATE ON saas_product_types
    FOR EACH ROW
    EXECUTE FUNCTION update_saas_product_types_updated_at();

-- =====================================================
-- IV. COMMENT MÔ TÁ BẢNG & CỘT
-- =====================================================
COMMENT ON TABLE saas_product_types IS 'Bảng danh mục định nghĩa các loại sản phẩm thương mại của hệ thống SaaS';
COMMENT ON COLUMN saas_product_types._id IS 'Định danh duy nhất UUID v7, hỗ trợ sắp xếp theo thời gian';
COMMENT ON COLUMN saas_product_types.code IS 'Mã định danh kỹ thuật (VD: APP, DOMAIN, SSL). Chỉ chữ hoa, số và gạch dưới';
COMMENT ON COLUMN saas_product_types.name IS 'Tên hiển thị của loại sản phẩm (VD: Phần mềm, Tên miền)';
COMMENT ON COLUMN saas_product_types.description IS 'Mô tả chi tiết về cách hệ thống xử lý loại sản phẩm này';
COMMENT ON COLUMN saas_product_types.is_active IS 'Trạng thái cho phép sử dụng loại sản phẩm này để tạo sản phẩm mới';
COMMENT ON COLUMN saas_product_types.created_at IS 'Thời điểm tạo bản ghi (UTC)';
COMMENT ON COLUMN saas_product_types.updated_at IS 'Thời điểm cập nhật cuối cùng (UTC)';
COMMENT ON COLUMN saas_product_types.version IS 'Optimistic Locking ngăn chặn ghi đè dữ liệu đồng thời';

-- =====================================================
-- V. SEED DEMO DATA
-- =====================================================
-- Các loại sản phẩm SaaS phổ biến trong nền tảng

INSERT INTO saas_product_types (_id, code, name, description, is_active, version) VALUES
-- 1. Phần mềm ứng dụng
(gen_random_uuid(), 'APP', 'Phần mềm ứng dụng', 
 'Các ứng dụng SaaS như HRM, CRM, ERP. Tính phí theo subscription model (user/tháng)', 
 TRUE, 1),

-- 2. Tên miền
(gen_random_uuid(), 'DOMAIN', 'Tên miền', 
 'Quản lý đăng ký và gia hạn tên miền (.com, .vn, .net, etc). Tính phí theo năm', 
 TRUE, 1),

-- 3. Chứng chỉ SSL
(gen_random_uuid(), 'SSL', 'Chứng chỉ SSL/TLS', 
 'Chứng chỉ bảo mật SSL (Wildcard, EV, DV). Tính phí theo năm hoặc subscription', 
 TRUE, 1),

-- 4. Lưu trữ đám mây
(gen_random_uuid(), 'STORAGE', 'Lưu trữ đám mây', 
 'Dung lượng lưu trữ files, backup, CDN. Tính phí theo GB/tháng hoặc gói cố định', 
 TRUE, 1),

-- 5. Email doanh nghiệp
(gen_random_uuid(), 'EMAIL', 'Email doanh nghiệp', 
 'Email với tên miền riêng (@company.com). Tính phí theo mailbox/tháng', 
 TRUE, 1),

-- 6. Hosting/VPS
(gen_random_uuid(), 'HOSTING', 'Web Hosting / VPS', 
 'Shared Hosting, VPS hoặc Dedicated Server. Tính phí theo tháng/năm', 
 TRUE, 1),

-- 7. Dịch vụ API
(gen_random_uuid(), 'API_SERVICE', 'Dịch vụ API', 
 'API key access cho third-party services (SMS, Payment, Maps, etc). Tính theo request hoặc quota', 
 TRUE, 1),

-- 8. Database as a Service
(gen_random_uuid(), 'DATABASE', 'Database as a Service', 
 'Managed database (PostgreSQL, MySQL, MongoDB). Tính phí theo RAM/Storage/tháng', 
 TRUE, 1),

-- 9. CDN & Bandwidth
(gen_random_uuid(), 'CDN', 'CDN & Băng thông', 
 'Content Delivery Network và băng thông. Tính phí theo GB transfer', 
 TRUE, 1),

-- 10. Backup & Recovery
(gen_random_uuid(), 'BACKUP', 'Backup & Recovery', 
 'Backup tự động và disaster recovery. Tính phí theo dung lượng backup', 
 TRUE, 1),

-- 11. Security & Firewall
(gen_random_uuid(), 'SECURITY', 'Security & Firewall', 
 'WAF, DDoS protection, Security scanning. Tính phí theo subscription', 
 TRUE, 1),

-- 12. Monitoring & Analytics
(gen_random_uuid(), 'MONITORING', 'Monitoring & Analytics', 
 'Server monitoring, log analytics, uptime monitoring. Tính phí theo số servers/tháng', 
 TRUE, 1),

-- 13. AI/ML Services
(gen_random_uuid(), 'AI_ML', 'AI/ML Services', 
 'Machine Learning API, ChatGPT, Vision API, etc. Tính phí theo token/request', 
 TRUE, 1),

-- 14. Collaboration Tools
(gen_random_uuid(), 'COLLABORATION', 'Collaboration Tools', 
 'Video conferencing, chat, project management. Tính phí theo user/tháng', 
 TRUE, 1),

-- 15. Add-ons & Extensions
(gen_random_uuid(), 'ADDON', 'Add-ons & Extensions', 
 'Các tính năng mở rộng cho sản phẩm chính. Tính phí riêng hoặc bundled', 
 TRUE, 1);

-- =====================================================
-- VI. VERIFY DATA
-- =====================================================
SELECT COUNT(*) as total_product_types FROM saas_product_types WHERE is_active = TRUE;
SELECT code, name, is_active FROM saas_product_types ORDER BY created_at;

-- =====================================================
-- VII. KHAI BÁO CATEGORY TYPE TRONG system_categories
-- =====================================================
-- Kiểm tra xem bảng system_categories có tồn tại không
DO $$
BEGIN
    -- Nếu table system_categories tồn tại, insert category declaration
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_categories'
    ) THEN
        -- Insert category type cho SAAS_PRODUCT_TYPE
        INSERT INTO system_categories (
            id,
            code, 
            name, 
            type, 
            category_group, 
            description, 
            is_system, 
            is_editable, 
            "order", 
            status,
            metadata
        ) VALUES (
            gen_random_uuid(),
            'SAAS_PRODUCT_TYPE',
            'SaaS Product Type',
            'master_data',
            'product_catalog',
            'Danh mục phân loại sản phẩm SaaS thương mại (APP, DOMAIN, SSL, STORAGE, etc)',
            TRUE,   -- is_system: quản lý bởi hệ thống
            FALSE,  -- is_editable: không cho phép xóa
            100,    -- order: hiển thị sau các system categories khác
            'active',
            jsonb_build_object(
                'table_name', 'saas_product_types',
                'key_field', 'code',
                'display_field', 'name',
                'icon', 'package',
                'color', '#6366f1',
                'features', jsonb_build_array('hierarchical', 'versioned', 'master_data')
            )
        )
        ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            metadata = EXCLUDED.metadata,
            updated_at = NOW();
            
        RAISE NOTICE 'Successfully inserted/updated SAAS_PRODUCT_TYPE in system_categories';
    ELSE
        RAISE NOTICE 'Table system_categories does not exist. Skipping category declaration.';
    END IF;
END $$;

-- =====================================================
-- VIII. FINAL VERIFICATION
-- =====================================================
-- Kiểm tra category đã được insert vào system_categories
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_categories') THEN
        PERFORM * FROM system_categories WHERE code = 'SAAS_PRODUCT_TYPE';
        IF FOUND THEN
            RAISE NOTICE 'SAAS_PRODUCT_TYPE category found in system_categories ✓';
        ELSE
            RAISE WARNING 'SAAS_PRODUCT_TYPE category NOT found in system_categories';
        END IF;
    END IF;
END $$;

-- Hiển thị thông tin category
SELECT 
    code, 
    name, 
    type, 
    category_group, 
    description,
    metadata->'table_name' as table_name,
    metadata->'features' as features
FROM system_categories 
WHERE code = 'SAAS_PRODUCT_TYPE';

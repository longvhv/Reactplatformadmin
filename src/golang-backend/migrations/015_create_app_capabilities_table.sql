-- =====================================================
-- Migration: 015 - Create app_capabilities table
-- Description: Application Features and Limits configuration
-- Schema: Tenant-specific table
-- =====================================================

-- Create app_capabilities table
CREATE TABLE IF NOT EXISTS app_capabilities (
    -- Primary Key
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tenant isolation
    tenant_id UUID NOT NULL,
    
    -- Application reference
    app_id UUID NOT NULL,
    
    -- Core fields
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Type: FEATURE (boolean feature) or LIMIT (numeric limit)
    type VARCHAR(20) NOT NULL DEFAULT 'FEATURE',
    
    -- Default value (JSONB for flexibility)
    -- For FEATURE: {"enabled": true/false}
    -- For LIMIT: {"value": number, "unit": "users/gb/requests"}
    default_value JSONB NOT NULL DEFAULT '{}',
    
    -- Display & validation
    display_order INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    validation_rules JSONB NOT NULL DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
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
    CONSTRAINT chk_app_capabilities_type CHECK (type IN ('FEATURE', 'LIMIT')),
    CONSTRAINT chk_app_capabilities_status CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT chk_app_capabilities_version CHECK (version >= 1),
    CONSTRAINT uq_app_capabilities_app_code UNIQUE (tenant_id, app_id, code)
);

-- Indexes for performance
CREATE INDEX idx_app_capabilities_tenant_id ON app_capabilities(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_capabilities_app_id ON app_capabilities(app_id, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_capabilities_type ON app_capabilities(type, app_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_capabilities_status ON app_capabilities(status, tenant_id) WHERE deleted_at IS NULL;

-- GIN index for JSONB fields
CREATE INDEX idx_app_capabilities_default_value_gin ON app_capabilities USING GIN (default_value);
CREATE INDEX idx_app_capabilities_validation_gin ON app_capabilities USING GIN (validation_rules);
CREATE INDEX idx_app_capabilities_metadata_gin ON app_capabilities USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_app_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_capabilities_updated_at
    BEFORE UPDATE ON app_capabilities
    FOR EACH ROW
    EXECUTE FUNCTION update_app_capabilities_updated_at();

-- =====================================================
-- Demo Data: Capabilities for demo applications
-- =====================================================

DO $$
DECLARE
    demo_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    hrm_app_id UUID;
    crm_app_id UUID;
    pm_app_id UUID;
BEGIN
    -- Get demo application IDs (assuming they exist from previous migrations)
    SELECT _id INTO hrm_app_id FROM applications WHERE code = 'hrm-suite' AND tenant_id = demo_tenant_id LIMIT 1;
    SELECT _id INTO crm_app_id FROM applications WHERE code = 'crm-suite' AND tenant_id = demo_tenant_id LIMIT 1;
    SELECT _id INTO pm_app_id FROM applications WHERE code = 'project-management' AND tenant_id = demo_tenant_id LIMIT 1;

    -- ============================================
    -- HRM Suite Capabilities
    -- ============================================
    IF hrm_app_id IS NOT NULL THEN
        -- Features
        INSERT INTO app_capabilities (_id, tenant_id, app_id, code, name, description, type, default_value, display_order, created_by) VALUES
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'attendance-management', 'Quản lý chấm công', 'Chấm công theo giờ, ca làm việc, GPS', 'FEATURE', '{"enabled": true}'::jsonb, 1, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'payroll-processing', 'Tính lương tự động', 'Tính lương, phụ cấp, khấu trừ tự động', 'FEATURE', '{"enabled": true}'::jsonb, 2, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'recruitment', 'Tuyển dụng', 'Đăng tin, quản lý ứng viên, phỏng vấn', 'FEATURE', '{"enabled": false}'::jsonb, 3, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'performance-review', 'Đánh giá hiệu suất', 'KPI, OKR, 360 feedback', 'FEATURE', '{"enabled": false}'::jsonb, 4, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'leave-management', 'Quản lý nghỉ phép', 'Đăng ký, duyệt phép, tracking', 'FEATURE', '{"enabled": true}'::jsonb, 5, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'asset-management', 'Quản lý tài sản', 'Thiết bị, laptop, điện thoại', 'FEATURE', '{"enabled": false}'::jsonb, 6, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'training', 'Đào tạo', 'Khóa học, certificate, LMS', 'FEATURE', '{"enabled": false}'::jsonb, 7, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'e-signature', 'Chữ ký điện tử', 'Ký hợp đồng, quyết định điện tử', 'FEATURE', '{"enabled": false}'::jsonb, 8, demo_user_id),
        
        -- Limits
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'max-employees', 'Số lượng nhân viên tối đa', 'Giới hạn số nhân viên trong hệ thống', 'LIMIT', '{"value": 100, "unit": "employees"}'::jsonb, 10, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'max-departments', 'Số phòng ban tối đa', 'Giới hạn số phòng ban', 'LIMIT', '{"value": 20, "unit": "departments"}'::jsonb, 11, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'storage-limit', 'Dung lượng lưu trữ', 'Dung lượng cho files, ảnh, tài liệu', 'LIMIT', '{"value": 50, "unit": "GB"}'::jsonb, 12, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'api-calls-per-day', 'API calls mỗi ngày', 'Số lượng API requests cho phép', 'LIMIT', '{"value": 10000, "unit": "requests/day"}'::jsonb, 13, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, hrm_app_id, 'concurrent-users', 'Người dùng đồng thời', 'Số user có thể online cùng lúc', 'LIMIT', '{"value": 50, "unit": "users"}'::jsonb, 14, demo_user_id);
    END IF;

    -- ============================================
    -- CRM Suite Capabilities
    -- ============================================
    IF crm_app_id IS NOT NULL THEN
        -- Features
        INSERT INTO app_capabilities (_id, tenant_id, app_id, code, name, description, type, default_value, display_order, created_by) VALUES
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'lead-management', 'Quản lý leads', 'Tracking, scoring, nurturing leads', 'FEATURE', '{"enabled": true}'::jsonb, 1, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'deal-pipeline', 'Pipeline bán hàng', 'Kanban, forecast, conversion', 'FEATURE', '{"enabled": true}'::jsonb, 2, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'email-marketing', 'Email marketing', 'Campaign, automation, A/B test', 'FEATURE', '{"enabled": false}'::jsonb, 3, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'ai-insights', 'AI Insights', 'Lead scoring, sales forecast AI', 'FEATURE', '{"enabled": false}'::jsonb, 4, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'advanced-reports', 'Báo cáo nâng cao', 'Custom dashboards, export', 'FEATURE', '{"enabled": true}'::jsonb, 5, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'team-collaboration', 'Cộng tác nhóm', 'Comments, mentions, notifications', 'FEATURE', '{"enabled": true}'::jsonb, 6, demo_user_id),
        
        -- Limits
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'max-contacts', 'Số contacts tối đa', 'Giới hạn số lượng khách hàng', 'LIMIT', '{"value": 10000, "unit": "contacts"}'::jsonb, 10, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'max-deals', 'Số deals tối đa', 'Giới hạn số deals đang active', 'LIMIT', '{"value": 1000, "unit": "deals"}'::jsonb, 11, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'email-quota', 'Email quota', 'Số email gửi mỗi tháng', 'LIMIT', '{"value": 50000, "unit": "emails/month"}'::jsonb, 12, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, crm_app_id, 'custom-fields', 'Custom fields', 'Số trường tùy chỉnh', 'LIMIT', '{"value": 50, "unit": "fields"}'::jsonb, 13, demo_user_id);
    END IF;

    -- ============================================
    -- Project Management Capabilities
    -- ============================================
    IF pm_app_id IS NOT NULL THEN
        -- Features
        INSERT INTO app_capabilities (_id, tenant_id, app_id, code, name, description, type, default_value, display_order, created_by) VALUES
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'kanban-board', 'Kanban Board', 'Quản lý task dạng kanban', 'FEATURE', '{"enabled": true}'::jsonb, 1, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'gantt-chart', 'Gantt Chart', 'Timeline view, dependencies', 'FEATURE', '{"enabled": false}'::jsonb, 2, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'time-tracking', 'Time Tracking', 'Tracking giờ làm việc', 'FEATURE', '{"enabled": true}'::jsonb, 3, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'resource-planning', 'Lập kế hoạch nguồn lực', 'Resource allocation, capacity', 'FEATURE', '{"enabled": false}'::jsonb, 4, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'agile-sprint', 'Agile/Scrum Sprint', 'Sprint planning, velocity chart', 'FEATURE', '{"enabled": true}'::jsonb, 5, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'file-storage', 'File Storage', 'Upload, share files trong project', 'FEATURE', '{"enabled": true}'::jsonb, 6, demo_user_id),
        
        -- Limits
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'max-projects', 'Số projects tối đa', 'Giới hạn số dự án active', 'LIMIT', '{"value": 50, "unit": "projects"}'::jsonb, 10, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'max-tasks-per-project', 'Tasks mỗi project', 'Số task tối đa trong 1 project', 'LIMIT', '{"value": 500, "unit": "tasks"}'::jsonb, 11, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'max-team-members', 'Thành viên team', 'Số người trong team', 'LIMIT', '{"value": 30, "unit": "members"}'::jsonb, 12, demo_user_id),
        (gen_random_uuid(), demo_tenant_id, pm_app_id, 'storage-per-project', 'Storage mỗi project', 'Dung lượng files cho 1 project', 'LIMIT', '{"value": 10, "unit": "GB"}'::jsonb, 13, demo_user_id);
    END IF;

END $$;

-- =====================================================
-- End of Migration 015
-- =====================================================

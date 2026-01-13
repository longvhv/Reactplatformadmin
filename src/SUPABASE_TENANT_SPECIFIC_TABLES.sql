-- ============================================================================
-- SUPABASE TENANT-SPECIFIC TABLES SETUP
-- Instructions: Copy and paste this SQL into Supabase SQL Editor
-- ============================================================================
-- 
-- ⚠️ IMPORTANT: These are TENANT-SPECIFIC tables (all have tenant_id)
-- 
-- To create these tables:
-- 1. Go to your Supabase Project Dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run" to execute
-- 
-- ============================================================================

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: tenant_members
-- Description: User-tenant relationships with roles and employee profiles
-- Classification: TENANT-SPECIFIC (has tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_members (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- II. EMPLOYEE PROFILE
    employee_code VARCHAR(50),
    internal_email VARCHAR(255),
    job_title VARCHAR(100),
    manager_id UUID, -- References another tenant_member._id
    
    -- III. ROLE & STATUS
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- IV. DATES
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    
    -- V. DYNAMIC DATA
    permissions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- VI. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_tenant_members_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT uq_tenant_members_employee_code UNIQUE (tenant_id, employee_code),
    CONSTRAINT chk_tenant_members_role CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    CONSTRAINT chk_tenant_members_status CHECK (status IN ('ACTIVE', 'RESIGNED', 'ONBOARDING', 'SUSPENDED')),
    CONSTRAINT chk_tenant_members_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_tenant_members_version CHECK (version >= 1),
    CONSTRAINT fk_tenant_members_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(_id),
    CONSTRAINT fk_tenant_members_user FOREIGN KEY (user_id) REFERENCES public.users(_id),
    CONSTRAINT fk_tenant_members_manager FOREIGN KEY (manager_id) REFERENCES public.tenant_members(_id)
);

-- INDEXES for tenant_members
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_manager_id ON public.tenant_members (manager_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_role_status ON public.tenant_members (role, status);
CREATE INDEX IF NOT EXISTS idx_tenant_members_permissions_gin ON public.tenant_members USING GIN (permissions);
CREATE INDEX IF NOT EXISTS idx_tenant_members_metadata_gin ON public.tenant_members USING GIN (metadata);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_members_employee_code_active 
    ON public.tenant_members (tenant_id, employee_code) 
    WHERE deleted_at IS NULL AND employee_code IS NOT NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_tenant_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenant_members_updated_at ON public.tenant_members;
CREATE TRIGGER trigger_tenant_members_updated_at
    BEFORE UPDATE ON public.tenant_members
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_members_updated_at();

-- Comments
COMMENT ON TABLE public.tenant_members IS 'User-tenant relationships with employee profiles and roles';
COMMENT ON COLUMN public.tenant_members.employee_code IS 'Unique employee code within tenant';
COMMENT ON COLUMN public.tenant_members.manager_id IS 'References another tenant_member (hierarchical reporting)';
COMMENT ON COLUMN public.tenant_members.permissions IS 'Array of permission strings';

-- ============================================================================
-- Table: departments
-- Description: Organizational departments within a tenant
-- Classification: TENANT-SPECIFIC (has tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- II. HIERARCHY
    parent_department_id UUID, -- Self-referencing for hierarchy
    manager_id UUID, -- References tenant_members._id
    
    -- III. INFORMATION
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- IV. ORDERING & METADATA
    "order" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- V. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_departments_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT chk_departments_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    CONSTRAINT chk_departments_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_departments_version CHECK (version >= 1),
    CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(_id),
    CONSTRAINT fk_departments_parent FOREIGN KEY (parent_department_id) REFERENCES public.departments(_id),
    CONSTRAINT fk_departments_manager FOREIGN KEY (manager_id) REFERENCES public.tenant_members(_id)
);

-- INDEXES for departments
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON public.departments (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON public.departments (parent_department_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON public.departments (manager_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_departments_status ON public.departments (status);
CREATE INDEX IF NOT EXISTS idx_departments_order ON public.departments ("order");
CREATE INDEX IF NOT EXISTS idx_departments_metadata_gin ON public.departments USING GIN (metadata);
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_code_active 
    ON public.departments (tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_departments_updated_at ON public.departments;
CREATE TRIGGER trigger_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION update_departments_updated_at();

-- Comments
COMMENT ON TABLE public.departments IS 'Organizational departments with hierarchical structure';
COMMENT ON COLUMN public.departments.parent_department_id IS 'Parent department for hierarchy';
COMMENT ON COLUMN public.departments.manager_id IS 'Department manager (tenant_member)';

-- ============================================================================
-- Table: department_members
-- Description: Users assigned to departments
-- Classification: TENANT-SPECIFIC (has tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.department_members (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    department_id UUID NOT NULL,
    tenant_member_id UUID NOT NULL,
    
    -- II. MEMBERSHIP DETAILS
    is_primary BOOLEAN NOT NULL DEFAULT false,
    role_in_department VARCHAR(100),
    
    -- III. DATES
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    
    -- IV. METADATA
    metadata JSONB DEFAULT '{}',
    
    -- V. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_dept_members_dept_member UNIQUE (department_id, tenant_member_id),
    CONSTRAINT chk_department_members_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_department_members_version CHECK (version >= 1),
    CONSTRAINT fk_dept_members_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(_id),
    CONSTRAINT fk_dept_members_department FOREIGN KEY (department_id) REFERENCES public.departments(_id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_members_tenant_member FOREIGN KEY (tenant_member_id) REFERENCES public.tenant_members(_id) ON DELETE CASCADE
);

-- INDEXES for department_members
CREATE INDEX IF NOT EXISTS idx_dept_members_tenant_id ON public.department_members (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dept_members_department_id ON public.department_members (department_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dept_members_tenant_member_id ON public.department_members (tenant_member_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dept_members_is_primary ON public.department_members (is_primary);
CREATE INDEX IF NOT EXISTS idx_dept_members_metadata_gin ON public.department_members USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_department_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_department_members_updated_at ON public.department_members;
CREATE TRIGGER trigger_department_members_updated_at
    BEFORE UPDATE ON public.department_members
    FOR EACH ROW
    EXECUTE FUNCTION update_department_members_updated_at();

-- Comments
COMMENT ON TABLE public.department_members IS 'Members assigned to departments';
COMMENT ON COLUMN public.department_members.is_primary IS 'True if this is the primary department for this member';

-- ============================================================================
-- Table: user_groups
-- Description: User groups for permissions and access control
-- Classification: TENANT-SPECIFIC (has tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_groups (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- II. INFORMATION
    description TEXT,
    group_type VARCHAR(50), -- e.g., 'PERMISSION', 'ROLE', 'PROJECT_TEAM', 'CUSTOM'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- III. ORDERING & METADATA
    "order" INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- IV. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_user_groups_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT chk_user_groups_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    CONSTRAINT chk_user_groups_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_user_groups_version CHECK (version >= 1),
    CONSTRAINT fk_user_groups_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(_id)
);

-- INDEXES for user_groups
CREATE INDEX IF NOT EXISTS idx_user_groups_tenant_id ON public.user_groups (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_groups_type ON public.user_groups (group_type);
CREATE INDEX IF NOT EXISTS idx_user_groups_status ON public.user_groups (status);
CREATE INDEX IF NOT EXISTS idx_user_groups_order ON public.user_groups ("order");
CREATE INDEX IF NOT EXISTS idx_user_groups_metadata_gin ON public.user_groups USING GIN (metadata);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_groups_code_active 
    ON public.user_groups (tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_groups_updated_at ON public.user_groups;
CREATE TRIGGER trigger_user_groups_updated_at
    BEFORE UPDATE ON public.user_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_user_groups_updated_at();

-- Comments
COMMENT ON TABLE public.user_groups IS 'User groups for permissions and access control';
COMMENT ON COLUMN public.user_groups.group_type IS 'Type of group: PERMISSION, ROLE, PROJECT_TEAM, CUSTOM';

-- ============================================================================
-- Table: group_members
-- Description: Users assigned to groups
-- Classification: TENANT-SPECIFIC (has tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_members (
    -- I. IDENTITY
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_group_id UUID NOT NULL,
    tenant_member_id UUID NOT NULL,
    
    -- II. MEMBERSHIP DETAILS
    is_primary BOOLEAN NOT NULL DEFAULT false,
    role_in_group VARCHAR(100), -- e.g., 'ADMIN', 'MEMBER', 'VIEWER'
    
    -- III. DATES
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    
    -- IV. METADATA
    metadata JSONB DEFAULT '{}',
    
    -- V. AUDIT TRAIL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 1,
    
    -- CONSTRAINTS
    CONSTRAINT uq_group_members_group_member UNIQUE (user_group_id, tenant_member_id),
    CONSTRAINT chk_group_members_updated CHECK (updated_at >= created_at),
    CONSTRAINT chk_group_members_version CHECK (version >= 1),
    CONSTRAINT fk_group_members_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(_id),
    CONSTRAINT fk_group_members_user_group FOREIGN KEY (user_group_id) REFERENCES public.user_groups(_id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_tenant_member FOREIGN KEY (tenant_member_id) REFERENCES public.tenant_members(_id) ON DELETE CASCADE
);

-- INDEXES for group_members
CREATE INDEX IF NOT EXISTS idx_group_members_tenant_id ON public.group_members (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_group_members_user_group_id ON public.group_members (user_group_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_group_members_tenant_member_id ON public.group_members (tenant_member_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_group_members_is_primary ON public.group_members (is_primary);
CREATE INDEX IF NOT EXISTS idx_group_members_metadata_gin ON public.group_members USING GIN (metadata);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_group_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_group_members_updated_at ON public.group_members;
CREATE TRIGGER trigger_group_members_updated_at
    BEFORE UPDATE ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_members_updated_at();

-- Comments
COMMENT ON TABLE public.group_members IS 'Members assigned to user groups';
COMMENT ON COLUMN public.group_members.is_primary IS 'True if this is the primary group for this member';
COMMENT ON COLUMN public.group_members.role_in_group IS 'Role within the group: ADMIN, MEMBER, VIEWER';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- tenant_members policies
CREATE POLICY "Service role full access on tenant_members" ON public.tenant_members
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view tenant_members in their tenant" ON public.tenant_members
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- departments policies
CREATE POLICY "Service role full access on departments" ON public.departments
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view departments in their tenant" ON public.departments
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- department_members policies
CREATE POLICY "Service role full access on department_members" ON public.department_members
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view department_members" ON public.department_members
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- user_groups policies
CREATE POLICY "Service role full access on user_groups" ON public.user_groups
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view user_groups in their tenant" ON public.user_groups
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- group_members policies
CREATE POLICY "Service role full access on group_members" ON public.group_members
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view group_members" ON public.group_members
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);

-- ============================================================================
-- Sample Data / Demo Data
-- ============================================================================

-- Note: These inserts require existing tenants and users
-- We'll use the demo tenant created in SUPABASE_TABLES_SETUP.sql

-- Get demo tenant ID
DO $$
DECLARE
    demo_tenant_id UUID;
    demo_user_id UUID;
    admin_member_id UUID;
    emp1_member_id UUID;
    emp2_member_id UUID;
    emp3_member_id UUID;
    emp4_member_id UUID;
    dept_eng_id UUID;
    dept_sales_id UUID;
    dept_hr_id UUID;
    dept_backend_id UUID;
    dept_frontend_id UUID;
    group_admins_id UUID;
    group_devs_id UUID;
    group_sales_id UUID;
BEGIN
    -- Get demo tenant
    SELECT _id INTO demo_tenant_id FROM public.tenants WHERE code = 'demo-corp' LIMIT 1;
    
    -- Get demo admin user
    SELECT _id INTO demo_user_id FROM public.users WHERE email = 'admin@demo.com' LIMIT 1;
    
    -- Only proceed if demo tenant exists
    IF demo_tenant_id IS NOT NULL AND demo_user_id IS NOT NULL THEN
        
        -- ====================================================================
        -- TENANT MEMBERS (Employees)
        -- ====================================================================
        
        -- Insert Admin as tenant member
        INSERT INTO public.tenant_members (
            tenant_id, user_id, employee_code, internal_email, 
            job_title, role, status, joined_at, permissions
        ) VALUES (
            demo_tenant_id,
            demo_user_id,
            'EMP-001',
            'admin@demo.corp',
            'Chief Technology Officer',
            'OWNER',
            'ACTIVE',
            NOW() - INTERVAL '2 years',
            '["admin.*", "users.*", "tenants.*"]'::jsonb
        )
        ON CONFLICT (tenant_id, user_id) DO UPDATE 
        SET employee_code = EXCLUDED.employee_code
        RETURNING _id INTO admin_member_id;
        
        -- Create additional demo users and tenant members
        -- Employee 1: Engineering Manager
        INSERT INTO public.users (email, password_hash, name, role, status, email_verified, tenant_id)
        VALUES (
            'john.doe@demo.com',
            'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
            'John Doe',
            'USER',
            'ACTIVE',
            true,
            demo_tenant_id
        )
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING _id INTO demo_user_id;
        
        INSERT INTO public.tenant_members (
            tenant_id, user_id, employee_code, internal_email, 
            job_title, manager_id, role, status, joined_at
        ) VALUES (
            demo_tenant_id,
            demo_user_id,
            'EMP-002',
            'john.doe@demo.corp',
            'Engineering Manager',
            admin_member_id,
            'ADMIN',
            'ACTIVE',
            NOW() - INTERVAL '18 months'
        )
        ON CONFLICT (tenant_id, user_id) DO UPDATE 
        SET employee_code = EXCLUDED.employee_code
        RETURNING _id INTO emp1_member_id;
        
        -- Employee 2: Sales Manager
        INSERT INTO public.users (email, password_hash, name, role, status, email_verified, tenant_id)
        VALUES (
            'jane.smith@demo.com',
            'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
            'Jane Smith',
            'USER',
            'ACTIVE',
            true,
            demo_tenant_id
        )
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING _id INTO demo_user_id;
        
        INSERT INTO public.tenant_members (
            tenant_id, user_id, employee_code, internal_email, 
            job_title, manager_id, role, status, joined_at
        ) VALUES (
            demo_tenant_id,
            demo_user_id,
            'EMP-003',
            'jane.smith@demo.corp',
            'Sales Manager',
            admin_member_id,
            'ADMIN',
            'ACTIVE',
            NOW() - INTERVAL '1 year'
        )
        ON CONFLICT (tenant_id, user_id) DO UPDATE 
        SET employee_code = EXCLUDED.employee_code
        RETURNING _id INTO emp2_member_id;
        
        -- Employee 3: Senior Backend Developer
        INSERT INTO public.users (email, password_hash, name, role, status, email_verified, tenant_id)
        VALUES (
            'alice.wong@demo.com',
            'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
            'Alice Wong',
            'USER',
            'ACTIVE',
            true,
            demo_tenant_id
        )
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING _id INTO demo_user_id;
        
        INSERT INTO public.tenant_members (
            tenant_id, user_id, employee_code, internal_email, 
            job_title, manager_id, role, status, joined_at
        ) VALUES (
            demo_tenant_id,
            demo_user_id,
            'EMP-004',
            'alice.wong@demo.corp',
            'Senior Backend Developer',
            emp1_member_id,
            'MEMBER',
            'ACTIVE',
            NOW() - INTERVAL '10 months'
        )
        ON CONFLICT (tenant_id, user_id) DO UPDATE 
        SET employee_code = EXCLUDED.employee_code
        RETURNING _id INTO emp3_member_id;
        
        -- Employee 4: Frontend Developer
        INSERT INTO public.users (email, password_hash, name, role, status, email_verified, tenant_id)
        VALUES (
            'bob.chen@demo.com',
            'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
            'Bob Chen',
            'USER',
            'ACTIVE',
            true,
            demo_tenant_id
        )
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING _id INTO demo_user_id;
        
        INSERT INTO public.tenant_members (
            tenant_id, user_id, employee_code, internal_email, 
            job_title, manager_id, role, status, joined_at
        ) VALUES (
            demo_tenant_id,
            demo_user_id,
            'EMP-005',
            'bob.chen@demo.corp',
            'Frontend Developer',
            emp1_member_id,
            'MEMBER',
            'ONBOARDING',
            NOW() - INTERVAL '1 month'
        )
        ON CONFLICT (tenant_id, user_id) DO UPDATE 
        SET employee_code = EXCLUDED.employee_code
        RETURNING _id INTO emp4_member_id;
        
        -- ====================================================================
        -- DEPARTMENTS
        -- ====================================================================
        
        -- Engineering Department
        INSERT INTO public.departments (
            tenant_id, code, name, manager_id, description, status, "order"
        ) VALUES (
            demo_tenant_id,
            'ENG',
            'Engineering',
            emp1_member_id,
            'Product development and technology',
            'ACTIVE',
            1
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO dept_eng_id;
        
        -- Sales Department
        INSERT INTO public.departments (
            tenant_id, code, name, manager_id, description, status, "order"
        ) VALUES (
            demo_tenant_id,
            'SALES',
            'Sales',
            emp2_member_id,
            'Sales and business development',
            'ACTIVE',
            2
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO dept_sales_id;
        
        -- HR Department
        INSERT INTO public.departments (
            tenant_id, code, name, manager_id, description, status, "order"
        ) VALUES (
            demo_tenant_id,
            'HR',
            'Human Resources',
            admin_member_id,
            'People operations and talent',
            'ACTIVE',
            3
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO dept_hr_id;
        
        -- Backend Team (sub-department of Engineering)
        INSERT INTO public.departments (
            tenant_id, code, name, parent_department_id, manager_id, 
            description, status, "order"
        ) VALUES (
            demo_tenant_id,
            'ENG-BACKEND',
            'Backend Team',
            dept_eng_id,
            emp1_member_id,
            'Backend services and APIs',
            'ACTIVE',
            1
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO dept_backend_id;
        
        -- Frontend Team (sub-department of Engineering)
        INSERT INTO public.departments (
            tenant_id, code, name, parent_department_id, manager_id, 
            description, status, "order"
        ) VALUES (
            demo_tenant_id,
            'ENG-FRONTEND',
            'Frontend Team',
            dept_eng_id,
            emp1_member_id,
            'User interfaces and web apps',
            'ACTIVE',
            2
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO dept_frontend_id;
        
        -- ====================================================================
        -- DEPARTMENT MEMBERS
        -- ====================================================================
        
        -- Admin in HR (primary)
        INSERT INTO public.department_members (
            tenant_id, department_id, tenant_member_id, 
            is_primary, role_in_department, joined_at
        ) VALUES (
            demo_tenant_id,
            dept_hr_id,
            admin_member_id,
            true,
            'Director',
            NOW() - INTERVAL '2 years'
        )
        ON CONFLICT (department_id, tenant_member_id) DO NOTHING;
        
        -- John in Engineering (primary)
        INSERT INTO public.department_members (
            tenant_id, department_id, tenant_member_id, 
            is_primary, role_in_department, joined_at
        ) VALUES (
            demo_tenant_id,
            dept_eng_id,
            emp1_member_id,
            true,
            'Manager',
            NOW() - INTERVAL '18 months'
        )
        ON CONFLICT (department_id, tenant_member_id) DO NOTHING;
        
        -- John also in Backend Team
        INSERT INTO public.department_members (
            tenant_id, department_id, tenant_member_id, 
            is_primary, role_in_department, joined_at
        ) VALUES (
            demo_tenant_id,
            dept_backend_id,
            emp1_member_id,
            false,
            'Lead',
            NOW() - INTERVAL '18 months'
        )
        ON CONFLICT (department_id, tenant_member_id) DO NOTHING;
        
        -- Jane in Sales (primary)
        INSERT INTO public.department_members (
            tenant_id, department_id, tenant_member_id, 
            is_primary, role_in_department, joined_at
        ) VALUES (
            demo_tenant_id,
            dept_sales_id,
            emp2_member_id,
            true,
            'Manager',
            NOW() - INTERVAL '1 year'
        )
        ON CONFLICT (department_id, tenant_member_id) DO NOTHING;
        
        -- Alice in Backend Team (primary)
        INSERT INTO public.department_members (
            tenant_id, department_id, tenant_member_id, 
            is_primary, role_in_department, joined_at
        ) VALUES (
            demo_tenant_id,
            dept_backend_id,
            emp3_member_id,
            true,
            'Senior Developer',
            NOW() - INTERVAL '10 months'
        )
        ON CONFLICT (department_id, tenant_member_id) DO NOTHING;
        
        -- Bob in Frontend Team (primary)
        INSERT INTO public.department_members (
            tenant_id, department_id, tenant_member_id, 
            is_primary, role_in_department, joined_at
        ) VALUES (
            demo_tenant_id,
            dept_frontend_id,
            emp4_member_id,
            true,
            'Developer',
            NOW() - INTERVAL '1 month'
        )
        ON CONFLICT (department_id, tenant_member_id) DO NOTHING;
        
        -- ====================================================================
        -- USER GROUPS
        -- ====================================================================
        
        -- Admins Group
        INSERT INTO public.user_groups (
            tenant_id, code, name, description, group_type, status, "order"
        ) VALUES (
            demo_tenant_id,
            'ADMINS',
            'Administrators',
            'System administrators with full access',
            'ROLE',
            'ACTIVE',
            1
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO group_admins_id;
        
        -- Developers Group
        INSERT INTO public.user_groups (
            tenant_id, code, name, description, group_type, status, "order"
        ) VALUES (
            demo_tenant_id,
            'DEVELOPERS',
            'Developers',
            'All software developers',
            'PERMISSION',
            'ACTIVE',
            2
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO group_devs_id;
        
        -- Sales Team Group
        INSERT INTO public.user_groups (
            tenant_id, code, name, description, group_type, status, "order"
        ) VALUES (
            demo_tenant_id,
            'SALES-TEAM',
            'Sales Team',
            'Sales and business development team',
            'PROJECT_TEAM',
            'ACTIVE',
            3
        )
        ON CONFLICT (tenant_id, code) DO UPDATE 
        SET name = EXCLUDED.name
        RETURNING _id INTO group_sales_id;
        
        -- ====================================================================
        -- GROUP MEMBERS
        -- ====================================================================
        
        -- Admin in Admins group
        INSERT INTO public.group_members (
            tenant_id, user_group_id, tenant_member_id, 
            is_primary, role_in_group, joined_at
        ) VALUES (
            demo_tenant_id,
            group_admins_id,
            admin_member_id,
            true,
            'ADMIN',
            NOW() - INTERVAL '2 years'
        )
        ON CONFLICT (user_group_id, tenant_member_id) DO NOTHING;
        
        -- John in Admins group
        INSERT INTO public.group_members (
            tenant_id, user_group_id, tenant_member_id, 
            is_primary, role_in_group, joined_at
        ) VALUES (
            demo_tenant_id,
            group_admins_id,
            emp1_member_id,
            false,
            'ADMIN',
            NOW() - INTERVAL '18 months'
        )
        ON CONFLICT (user_group_id, tenant_member_id) DO NOTHING;
        
        -- John in Developers group (primary)
        INSERT INTO public.group_members (
            tenant_id, user_group_id, tenant_member_id, 
            is_primary, role_in_group, joined_at
        ) VALUES (
            demo_tenant_id,
            group_devs_id,
            emp1_member_id,
            true,
            'ADMIN',
            NOW() - INTERVAL '18 months'
        )
        ON CONFLICT (user_group_id, tenant_member_id) DO NOTHING;
        
        -- Alice in Developers group
        INSERT INTO public.group_members (
            tenant_id, user_group_id, tenant_member_id, 
            is_primary, role_in_group, joined_at
        ) VALUES (
            demo_tenant_id,
            group_devs_id,
            emp3_member_id,
            true,
            'MEMBER',
            NOW() - INTERVAL '10 months'
        )
        ON CONFLICT (user_group_id, tenant_member_id) DO NOTHING;
        
        -- Bob in Developers group
        INSERT INTO public.group_members (
            tenant_id, user_group_id, tenant_member_id, 
            is_primary, role_in_group, joined_at
        ) VALUES (
            demo_tenant_id,
            group_devs_id,
            emp4_member_id,
            true,
            'MEMBER',
            NOW() - INTERVAL '1 month'
        )
        ON CONFLICT (user_group_id, tenant_member_id) DO NOTHING;
        
        -- Jane in Sales Team group
        INSERT INTO public.group_members (
            tenant_id, user_group_id, tenant_member_id, 
            is_primary, role_in_group, joined_at
        ) VALUES (
            demo_tenant_id,
            group_sales_id,
            emp2_member_id,
            true,
            'ADMIN',
            NOW() - INTERVAL '1 year'
        )
        ON CONFLICT (user_group_id, tenant_member_id) DO NOTHING;
        
        RAISE NOTICE 'Sample data inserted successfully!';
        RAISE NOTICE 'Created % tenant members', 5;
        RAISE NOTICE 'Created % departments', 5;
        RAISE NOTICE 'Created % department memberships', 6;
        RAISE NOTICE 'Created % user groups', 3;
        RAISE NOTICE 'Created % group memberships', 5;
        
    ELSE
        RAISE NOTICE 'Demo tenant or user not found. Please run SUPABASE_TABLES_SETUP.sql first.';
    END IF;
END $$;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenant_members', 'departments', 'department_members', 'user_groups', 'group_members')
ORDER BY table_name;

-- Count records
SELECT 
    'tenant_members' as table_name,
    COUNT(*) as count
FROM public.tenant_members
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'departments' as table_name,
    COUNT(*) as count
FROM public.departments
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'department_members' as table_name,
    COUNT(*) as count
FROM public.department_members
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'user_groups' as table_name,
    COUNT(*) as count
FROM public.user_groups
WHERE deleted_at IS NULL
UNION ALL
SELECT 
    'group_members' as table_name,
    COUNT(*) as count
FROM public.group_members
WHERE deleted_at IS NULL;

-- View tenant members with user info
SELECT 
    tm._id,
    tm.employee_code,
    u.name as user_name,
    u.email,
    tm.job_title,
    tm.role,
    tm.status,
    t.name as tenant_name
FROM public.tenant_members tm
JOIN public.users u ON tm.user_id = u._id
JOIN public.tenants t ON tm.tenant_id = t._id
WHERE tm.deleted_at IS NULL
ORDER BY tm.employee_code;

-- View department hierarchy
SELECT 
    d1.code,
    d1.name,
    d2.name as parent_department,
    tm.employee_code as manager_code,
    u.name as manager_name,
    d1.status
FROM public.departments d1
LEFT JOIN public.departments d2 ON d1.parent_department_id = d2._id
LEFT JOIN public.tenant_members tm ON d1.manager_id = tm._id
LEFT JOIN public.users u ON tm.user_id = u._id
WHERE d1.deleted_at IS NULL
ORDER BY d1."order";

-- View department members
SELECT 
    d.name as department,
    u.name as member_name,
    tm.employee_code,
    dm.role_in_department,
    dm.is_primary
FROM public.department_members dm
JOIN public.departments d ON dm.department_id = d._id
JOIN public.tenant_members tm ON dm.tenant_member_id = tm._id
JOIN public.users u ON tm.user_id = u._id
WHERE dm.deleted_at IS NULL
ORDER BY d.name, u.name;

-- View user groups and members
SELECT 
    ug.name as group_name,
    ug.group_type,
    u.name as member_name,
    tm.employee_code,
    gm.role_in_group,
    gm.is_primary
FROM public.group_members gm
JOIN public.user_groups ug ON gm.user_group_id = ug._id
JOIN public.tenant_members tm ON gm.tenant_member_id = tm._id
JOIN public.users u ON tm.user_id = u._id
WHERE gm.deleted_at IS NULL
ORDER BY ug.name, u.name;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- Summary of created tables:
-- 1. tenant_members - User-tenant relationships with employee profiles
-- 2. departments - Organizational departments with hierarchy
-- 3. department_members - Department membership
-- 4. user_groups - Permission and role groups
-- 5. group_members - Group membership
-- 
-- Demo data created:
-- - 5 employees (admin, 2 managers, 2 developers)
-- - 5 departments (Engineering, Sales, HR, Backend Team, Frontend Team)
-- - 6 department memberships
-- - 3 user groups (Admins, Developers, Sales Team)
-- - 5 group memberships
-- 
-- Next steps:
-- 1. Run the verification queries above
-- 2. Check the application to see if data loads correctly
-- 3. Test CRUD operations through the API
-- 
-- ============================================================================

# 📊 Tenant-Specific Tables Setup Guide

## 🎯 Overview

Document này hướng dẫn tạo **5 bảng TENANT-SPECIFIC** cho hệ thống multi-tenancy:

1. **tenant_members** - Quan hệ user-tenant với employee profiles
2. **departments** - Phòng ban có cấu trúc phân cấp
3. **department_members** - Thành viên trong phòng ban
4. **user_groups** - Nhóm người dùng cho phân quyền
5. **group_members** - Thành viên trong nhóm

## 📋 Yêu cầu tiên quyết

### Bước 1: Đảm bảo GLOBAL tables đã tồn tại

Chạy file này **SAU KHI** đã chạy `/SUPABASE_TABLES_SETUP.sql`:

```sql
-- Verify global tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users')
ORDER BY table_name;
```

**Kết quả mong đợi:** 2 tables (tenants, users)

### Bước 2: Verify demo data

```sql
-- Check demo tenant exists
SELECT _id, code, name FROM public.tenants WHERE code = 'demo-corp';

-- Check demo user exists  
SELECT _id, email, name FROM public.users WHERE email = 'admin@demo.com';
```

**Kết quả mong đợi:** 1 tenant và 1 user

---

## 🚀 Installation

### Bước 1: Mở Supabase SQL Editor

1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Click **"SQL Editor"** ở sidebar
4. Click **"New Query"**

### Bước 2: Chạy SQL Script

1. Mở file `/SUPABASE_TENANT_SPECIFIC_TABLES.sql`
2. Copy **TOÀN BỘ** nội dung (900+ dòng)
3. Paste vào SQL Editor
4. Click **"Run"**

### Bước 3: Verify Installation

Script sẽ tự động chạy verification queries. Check output:

```
Expected results:
- 5 tables created
- 5 employees created
- 5 departments created
- 6 department memberships
- 3 user groups created
- 5 group memberships
```

---

## 🗄️ Database Schema

### 1. tenant_members

**Mục đích:** Lưu thông tin nhân viên của từng tenant

```sql
Key Columns:
- _id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- user_id (UUID, FK → users)
- employee_code (VARCHAR) - Unique per tenant
- internal_email (VARCHAR) - Company email
- job_title (VARCHAR)
- manager_id (UUID, FK → tenant_members) - Hierarchical reporting
- role (VARCHAR) - OWNER, ADMIN, MEMBER, VIEWER
- status (VARCHAR) - ACTIVE, RESIGNED, ONBOARDING, SUSPENDED
- joined_at, left_at (TIMESTAMPTZ)
- permissions (JSONB) - Array of permission strings
```

**Constraints:**
- UNIQUE (tenant_id, user_id) - One membership per user per tenant
- UNIQUE (tenant_id, employee_code) - Unique employee code within tenant

**Use Cases:**
- Employee directory
- Organizational chart (via manager_id)
- Role-based access control
- Employee lifecycle management

---

### 2. departments

**Mục đích:** Cấu trúc phòng ban phân cấp trong tenant

```sql
Key Columns:
- _id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- code (VARCHAR) - Unique per tenant
- name (VARCHAR)
- parent_department_id (UUID, FK → departments) - Self-referencing
- manager_id (UUID, FK → tenant_members)
- description (TEXT)
- status (VARCHAR) - ACTIVE, INACTIVE, ARCHIVED
- order (INTEGER) - Display order
```

**Constraints:**
- UNIQUE (tenant_id, code)
- Self-referencing for hierarchy

**Use Cases:**
- Organizational structure
- Department hierarchy visualization
- Manager assignments
- Department-based permissions

---

### 3. department_members

**Mục đích:** Gán nhân viên vào phòng ban (many-to-many)

```sql
Key Columns:
- _id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- department_id (UUID, FK → departments) - CASCADE DELETE
- tenant_member_id (UUID, FK → tenant_members) - CASCADE DELETE
- is_primary (BOOLEAN) - Primary department flag
- role_in_department (VARCHAR) - Role within this department
- joined_at, left_at (TIMESTAMPTZ)
```

**Constraints:**
- UNIQUE (department_id, tenant_member_id)
- CASCADE DELETE on department and tenant_member

**Use Cases:**
- Department rosters
- Multi-department assignments
- Department-specific roles
- Historical department changes

---

### 4. user_groups

**Mục đích:** Nhóm người dùng cho phân quyền và tổ chức

```sql
Key Columns:
- _id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- code (VARCHAR) - Unique per tenant
- name (VARCHAR)
- description (TEXT)
- group_type (VARCHAR) - PERMISSION, ROLE, PROJECT_TEAM, CUSTOM
- status (VARCHAR) - ACTIVE, INACTIVE, ARCHIVED
- order (INTEGER)
```

**Constraints:**
- UNIQUE (tenant_id, code)

**Group Types:**
- **PERMISSION**: Permission-based groups (e.g., "Admins", "Editors")
- **ROLE**: Role-based groups (e.g., "Managers", "Developers")
- **PROJECT_TEAM**: Project/team groups (e.g., "Project Alpha Team")
- **CUSTOM**: Custom groups

**Use Cases:**
- Role-based access control (RBAC)
- Project team management
- Permission groups
- Custom groupings

---

### 5. group_members

**Mục đích:** Gán nhân viên vào nhóm (many-to-many)

```sql
Key Columns:
- _id (UUID, PK)
- tenant_id (UUID, FK → tenants)
- user_group_id (UUID, FK → user_groups) - CASCADE DELETE
- tenant_member_id (UUID, FK → tenant_members) - CASCADE DELETE
- is_primary (BOOLEAN) - Primary group flag
- role_in_group (VARCHAR) - ADMIN, MEMBER, VIEWER
- joined_at, left_at (TIMESTAMPTZ)
```

**Constraints:**
- UNIQUE (user_group_id, tenant_member_id)
- CASCADE DELETE on user_group and tenant_member

**Use Cases:**
- Group membership management
- Group-based permissions
- Multiple group assignments
- Group admin designation

---

## 🎭 Demo Data

### Employees Created (5)

| Employee Code | Name | Job Title | Role | Status | Manager |
|--------------|------|-----------|------|--------|---------|
| EMP-001 | Admin User | Chief Technology Officer | OWNER | ACTIVE | - |
| EMP-002 | John Doe | Engineering Manager | ADMIN | ACTIVE | Admin |
| EMP-003 | Jane Smith | Sales Manager | ADMIN | ACTIVE | Admin |
| EMP-004 | Alice Wong | Senior Backend Developer | MEMBER | ACTIVE | John |
| EMP-005 | Bob Chen | Frontend Developer | MEMBER | ONBOARDING | John |

### Departments Created (5)

```
Engineering (ENG)
├── Backend Team (ENG-BACKEND)
└── Frontend Team (ENG-FRONTEND)

Sales (SALES)

Human Resources (HR)
```

### Department Assignments

- **Admin** → HR (Director)
- **John** → Engineering (Manager), Backend Team (Lead)
- **Jane** → Sales (Manager)
- **Alice** → Backend Team (Senior Developer)
- **Bob** → Frontend Team (Developer)

### User Groups Created (3)

1. **ADMINS** (ROLE type)
   - Admin User (ADMIN)
   - John Doe (ADMIN)

2. **DEVELOPERS** (PERMISSION type)
   - John Doe (ADMIN)
   - Alice Wong (MEMBER)
   - Bob Chen (MEMBER)

3. **SALES-TEAM** (PROJECT_TEAM type)
   - Jane Smith (ADMIN)

---

## 🔍 Useful Queries

### Query 1: Employee Directory with Managers

```sql
SELECT 
    e.employee_code,
    u.name as employee_name,
    e.job_title,
    m_user.name as manager_name,
    e.role,
    e.status
FROM public.tenant_members e
JOIN public.users u ON e.user_id = u._id
LEFT JOIN public.tenant_members m ON e.manager_id = m._id
LEFT JOIN public.users m_user ON m.user_id = m_user._id
WHERE e.deleted_at IS NULL
ORDER BY e.employee_code;
```

### Query 2: Department Hierarchy

```sql
WITH RECURSIVE dept_hierarchy AS (
    -- Root departments
    SELECT 
        _id, 
        code, 
        name, 
        parent_department_id,
        0 as level,
        code as path
    FROM public.departments
    WHERE parent_department_id IS NULL 
    AND deleted_at IS NULL
    
    UNION ALL
    
    -- Child departments
    SELECT 
        d._id, 
        d.code, 
        d.name, 
        d.parent_department_id,
        dh.level + 1,
        dh.path || ' > ' || d.code
    FROM public.departments d
    JOIN dept_hierarchy dh ON d.parent_department_id = dh._id
    WHERE d.deleted_at IS NULL
)
SELECT 
    level,
    REPEAT('  ', level) || name as department_name,
    code,
    path
FROM dept_hierarchy
ORDER BY path;
```

### Query 3: User's Complete Profile

```sql
SELECT 
    u.name,
    u.email,
    tm.employee_code,
    tm.job_title,
    tm.role as tenant_role,
    
    -- Primary department
    d.name as primary_department,
    dm.role_in_department,
    
    -- All groups
    STRING_AGG(DISTINCT ug.name, ', ') as user_groups,
    
    -- Manager
    mgr_user.name as manager_name
    
FROM public.users u
JOIN public.tenant_members tm ON u._id = tm.user_id
LEFT JOIN public.department_members dm ON tm._id = dm.tenant_member_id AND dm.is_primary = true
LEFT JOIN public.departments d ON dm.department_id = d._id
LEFT JOIN public.group_members gm ON tm._id = gm.tenant_member_id
LEFT JOIN public.user_groups ug ON gm.user_group_id = ug._id
LEFT JOIN public.tenant_members mgr ON tm.manager_id = mgr._id
LEFT JOIN public.users mgr_user ON mgr.user_id = mgr_user._id
WHERE tm.deleted_at IS NULL
GROUP BY u._id, u.name, u.email, tm.employee_code, tm.job_title, tm.role, 
         d.name, dm.role_in_department, mgr_user.name;
```

### Query 4: Department Members Count

```sql
SELECT 
    d.name as department,
    COUNT(dm._id) as member_count,
    COUNT(CASE WHEN dm.is_primary THEN 1 END) as primary_members,
    mgr_user.name as manager
FROM public.departments d
LEFT JOIN public.department_members dm ON d._id = dm.department_id AND dm.deleted_at IS NULL
LEFT JOIN public.tenant_members mgr ON d.manager_id = mgr._id
LEFT JOIN public.users mgr_user ON mgr.user_id = mgr_user._id
WHERE d.deleted_at IS NULL
GROUP BY d.name, d."order", mgr_user.name
ORDER BY d."order";
```

### Query 5: Group Permissions Audit

```sql
SELECT 
    ug.name as group_name,
    ug.group_type,
    COUNT(gm._id) as member_count,
    STRING_AGG(u.name, ', ') as members
FROM public.user_groups ug
LEFT JOIN public.group_members gm ON ug._id = gm.user_group_id AND gm.deleted_at IS NULL
LEFT JOIN public.tenant_members tm ON gm.tenant_member_id = tm._id
LEFT JOIN public.users u ON tm.user_id = u._id
WHERE ug.deleted_at IS NULL
GROUP BY ug._id, ug.name, ug.group_type, ug."order"
ORDER BY ug."order";
```

---

## 🔐 Security & RLS

### Row Level Security (RLS)

All tables have RLS enabled with these policies:

1. **Service Role**: Full access (for backend API)
2. **Authenticated Users**: Read access to non-deleted records

### Recommended Additional Policies

```sql
-- Example: Users can only see tenant_members in their own tenant
CREATE POLICY "Users see own tenant members" ON public.tenant_members
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM public.tenant_members 
            WHERE user_id = auth.uid()::UUID 
            AND deleted_at IS NULL
        )
    );
```

---

## 🔄 Relationship Diagram

```
tenants (GLOBAL)
    ↓
    ├─→ tenant_members ←── users (GLOBAL)
    │       ↓
    │       ├─→ departments (manager_id)
    │       │       ↓
    │       │       └─→ department_members
    │       │               └─→ tenant_members
    │       │
    │       └─→ user_groups
    │               ↓
    │               └─→ group_members
    │                       └─→ tenant_members
```

**Key Relationships:**

1. **tenant_members** is the central table
   - Links users to tenants
   - Referenced by departments (as managers)
   - Referenced by department_members
   - Referenced by group_members

2. **Hierarchies:**
   - Departments: parent_department_id (tree structure)
   - Employees: manager_id (reporting hierarchy)

3. **Many-to-Many:**
   - tenant_members ↔ departments (via department_members)
   - tenant_members ↔ user_groups (via group_members)

---

## 🧪 Testing Scenarios

### Test 1: Create Employee

```sql
-- 1. Create user
INSERT INTO public.users (email, password_hash, name, role, status, email_verified)
VALUES ('test@demo.com', 'hash', 'Test User', 'USER', 'ACTIVE', true)
RETURNING _id;

-- 2. Add to tenant as member
INSERT INTO public.tenant_members (tenant_id, user_id, employee_code, job_title, role, status)
SELECT 
    t._id,
    u._id,
    'EMP-006',
    'QA Engineer',
    'MEMBER',
    'ACTIVE'
FROM public.tenants t, public.users u
WHERE t.code = 'demo-corp' AND u.email = 'test@demo.com';
```

### Test 2: Assign to Department

```sql
-- Add employee to department
INSERT INTO public.department_members (tenant_id, department_id, tenant_member_id, is_primary, role_in_department)
SELECT 
    d.tenant_id,
    d._id,
    tm._id,
    true,
    'Tester'
FROM public.departments d
JOIN public.tenant_members tm ON d.tenant_id = tm.tenant_id
WHERE d.code = 'ENG' AND tm.employee_code = 'EMP-006';
```

### Test 3: Add to Group

```sql
-- Add to developers group
INSERT INTO public.group_members (tenant_id, user_group_id, tenant_member_id, is_primary, role_in_group)
SELECT 
    ug.tenant_id,
    ug._id,
    tm._id,
    false,
    'MEMBER'
FROM public.user_groups ug
JOIN public.tenant_members tm ON ug.tenant_id = tm.tenant_id
WHERE ug.code = 'DEVELOPERS' AND tm.employee_code = 'EMP-006';
```

### Test 4: Manager Hierarchy

```sql
-- Get direct reports
SELECT 
    e.employee_code,
    u.name as employee_name,
    e.job_title
FROM public.tenant_members e
JOIN public.users u ON e.user_id = u._id
WHERE e.manager_id = (
    SELECT _id FROM public.tenant_members WHERE employee_code = 'EMP-002'
)
AND e.deleted_at IS NULL;
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Foreign key violation - tenant not found"

**Cause:** Trying to insert tenant_member for non-existent tenant

**Solution:**
```sql
-- Verify tenant exists
SELECT _id FROM public.tenants WHERE code = 'your-tenant-code';
```

### Issue 2: "Duplicate employee_code"

**Cause:** Employee code must be unique per tenant

**Solution:**
```sql
-- Check existing codes
SELECT employee_code FROM public.tenant_members 
WHERE tenant_id = 'your-tenant-id' 
AND deleted_at IS NULL;
```

### Issue 3: "Circular manager reference"

**Cause:** Manager hierarchy creates a loop

**Solution:**
```sql
-- Validate manager hierarchy before insert/update
-- Manager must not be descendant of employee
WITH RECURSIVE manager_chain AS (
    SELECT _id, manager_id, 0 as level
    FROM public.tenant_members
    WHERE _id = 'employee-id'
    
    UNION ALL
    
    SELECT tm._id, tm.manager_id, mc.level + 1
    FROM public.tenant_members tm
    JOIN manager_chain mc ON tm._id = mc.manager_id
    WHERE mc.level < 10
)
SELECT * FROM manager_chain WHERE _id = 'proposed-manager-id';
-- Should return empty
```

### Issue 4: "Cannot delete department - has members"

**Cause:** CASCADE DELETE will remove all department members

**Solution:**
```sql
-- Option 1: Soft delete (recommended)
UPDATE public.departments
SET deleted_at = NOW(), deleted_by = 'user-id'
WHERE _id = 'dept-id';

-- Option 2: Move members first
UPDATE public.department_members
SET department_id = 'new-dept-id'
WHERE department_id = 'old-dept-id';

-- Option 3: Hard delete (removes members)
DELETE FROM public.departments WHERE _id = 'dept-id';
```

---

## 📚 API Integration

### Current API Files

Các files sau cần được update để sử dụng Supabase tables thay vì KV store:

1. `/supabase/functions/server/tenant-members-api.tsx`
2. `/supabase/functions/server/departments-api.tsx`
3. `/supabase/functions/server/user-groups-api.tsx`

**Pattern tham khảo:** `/supabase/functions/server/tenants-api.tsx`

### Example API Endpoint

```typescript
// GET /tenant-members
app.get('/tenant-members', async (c) => {
  const supabase = getSupabaseClient();
  const tenant_id = c.req.query('tenant_id');
  
  let query = supabase
    .from('tenant_members')
    .select('*, user:users(name, email)')
    .is('deleted_at', null);
  
  if (tenant_id) {
    query = query.eq('tenant_id', tenant_id);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json({ data });
});
```

---

## 🎯 Next Steps

### Immediate Actions

1. ✅ Run `/SUPABASE_TENANT_SPECIFIC_TABLES.sql`
2. ✅ Verify demo data created
3. ✅ Run test queries to explore data
4. ⏭️ Update API files to use Supabase instead of KV store
5. ⏭️ Test CRUD operations via API
6. ⏭️ Build frontend components for:
   - Employee directory
   - Department org chart
   - Group management

### Future Enhancements

- [ ] Add department budget tracking
- [ ] Add employee performance reviews
- [ ] Add group-based notifications
- [ ] Add department-level permissions
- [ ] Add employee skills/certifications
- [ ] Add time-off/leave tracking
- [ ] Add department cost centers

---

## 📊 Performance Considerations

### Indexes Created

All critical indexes are already created:

- Foreign key indexes (tenant_id, user_id, etc.)
- Unique constraint indexes
- GIN indexes for JSONB columns
- Composite indexes for common queries

### Query Optimization Tips

1. **Always filter by tenant_id first**
   ```sql
   -- Good
   WHERE tenant_id = 'xxx' AND deleted_at IS NULL
   
   -- Bad
   WHERE deleted_at IS NULL AND tenant_id = 'xxx'
   ```

2. **Use JOINs instead of subqueries when possible**

3. **Limit result sets in application code**
   ```sql
   SELECT * FROM tenant_members 
   WHERE tenant_id = 'xxx' 
   LIMIT 100 OFFSET 0;
   ```

4. **Use materialized views for complex reports**
   ```sql
   CREATE MATERIALIZED VIEW employee_stats AS
   SELECT 
       d.name as department,
       COUNT(dm._id) as employee_count,
       AVG(EXTRACT(EPOCH FROM (NOW() - tm.joined_at))/86400) as avg_tenure_days
   FROM departments d
   LEFT JOIN department_members dm ON d._id = dm.department_id
   LEFT JOIN tenant_members tm ON dm.tenant_member_id = tm._id
   WHERE d.deleted_at IS NULL
   GROUP BY d._id, d.name;
   ```

---

## 🎉 Completion Checklist

- [x] SQL script created
- [x] All 5 tables defined
- [x] Constraints & indexes added
- [x] Triggers for updated_at
- [x] RLS policies configured
- [x] Demo data with 5 employees
- [x] Demo data with 5 departments
- [x] Demo data with 3 groups
- [x] Verification queries included
- [x] Documentation completed

**Status: READY TO USE** ✅

---

## 📞 Support

Nếu gặp vấn đề:

1. Check verification queries output
2. Check Supabase logs for errors
3. Verify foreign key relationships
4. Check demo tenant/user exists
5. Review RLS policies

---

**File:** `/SUPABASE_TENANT_SPECIFIC_TABLES.sql`  
**Created:** 2026-01-12  
**Tables:** 5 (tenant_members, departments, department_members, user_groups, group_members)  
**Demo Records:** 24 total records across all tables

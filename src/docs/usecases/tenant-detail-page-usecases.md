# Tenant Detail Page - Use Cases

## Overview
Tài liệu mô tả các use cases cho trang chi tiết Tenant với 13 tabs khác nhau

---

## Page Structure

### Tabs Available
1. **Tổng quan** (Overview) - Thông tin cơ bản
2. **App Routes** - Quản lý routes
3. **Rate Limits** - Giới hạn tần suất
4. **Webhooks** - Cấu hình webhooks
5. **Thành viên** (Members) - Quản lý members
6. **Vai trò** (Roles) - Quản lý roles
7. **Phòng ban** (Departments) - Cấu trúc tổ chức
8. **Nhóm người dùng** (User Groups) - Nhóm và permissions
9. **Ủy quyền** (Delegations) - Phân quyền tạm thời
10. **Địa điểm** (Locations) - Chi nhánh, văn phòng
11. **SSO Configs** - Single Sign-On
12. **Hoạt động** (Activity) - Audit logs
13. **Thống kê** (Stats) - Dashboard thống kê

---

## UC-1: Xem tổng quan Tenant

### Actors
- **Primary:** Tenant Admin
- **Secondary:** Platform Admin

### Preconditions
- User có quyền xem tenant
- User là member của tenant hoặc platform admin

### Flow
1. User click vào tenant từ danh sách
2. System load `/core/tenants/{id}`
3. Default tab "Tổng quan" được hiển thị
4. System fetch:
   - Basic tenant info (name, code, tier, status)
   - Profile data (JSONB)
   - Settings data (JSONB)
   - Metadata (created_at, version)
5. Display thông tin theo sections:
   - **Thông tin cơ bản:** name, code, tier, status
   - **Hạ tầng & Tuân thủ:** region, compliance, billing type
   - **Thông tin doanh nghiệp:** company name, tax code (từ profile)
   - **Cấu hình hệ thống:** security, features, quotas (từ settings)
   - **Metadata:** timestamps, version

### API Calls
```bash
GET /api/v1/tenants/{id}
# or
GET /api/v1/tenants/{id}/overview  # Includes stats + activities
```

### Postconditions
- User thấy đầy đủ thông tin tenant
- Can navigate to other tabs
- Can edit tenant info (if has permission)

### UI Components
- Cards hiển thị từng section
- Badge cho status, tier
- JSON viewer cho settings (toggle)
- Edit button dẫn đến edit page

---

## UC-2: Xem thống kê Tenant

### Actors
- **Primary:** Tenant Admin
- **Secondary:** Analyst, Manager

### Preconditions
- User có quyền xem stats
- Tenant đã có dữ liệu

### Flow
1. User click tab "Thống kê"
2. System fetch stats từ API
3. Display dashboard với:
   - **People & Org:** members, departments, groups, locations, roles
   - **Billing:** subscriptions, revenue, orders, invoices
   - **Technical:** app routes, webhooks, rate limits, SSO
   - **Usage:** storage, API calls
4. Stats cards với icons, colors, trends
5. Additional info cards
6. Summary card

### API Calls
```bash
GET /api/v1/tenants/{id}/stats
```

### Data Displayed
```
┌─────────────────────────────────────────────┐
│ Thành viên: 150    | Phòng ban: 12          │
│ 142 active         | Nhóm: 8                │
├─────────────────────────────────────────────┤
│ Gói đăng ký: 3     | Doanh thu: $5,000      │
│ 24 orders          | 0 unpaid               │
├─────────────────────────────────────────────┤
│ App Routes: 45     | Webhooks: 3            │
│ Rate Limits: 10    | SSO: 2                 │
├─────────────────────────────────────────────┤
│ Storage: 25.5 GB   | API calls: 125K        │
└─────────────────────────────────────────────┘
```

### Postconditions
- User có overview về usage
- Can identify issues (unpaid invoices, quota limits)
- Can drill down to specific areas

---

## UC-3: Xem lịch sử hoạt động

### Actors
- **Primary:** Tenant Admin, Auditor
- **Secondary:** Compliance Officer

### Preconditions
- Audit logging enabled
- User có quyền xem activity logs

### Flow
1. User click tab "Hoạt động"
2. System fetch activities (limit 50, offset 0)
3. Display timeline:
   - Action badge (CREATE, UPDATE, DELETE)
   - Resource type
   - User who performed action
   - Timestamp
   - IP address
   - Details
4. User can:
   - Search by keyword
   - Filter by action type
   - Load more (pagination)
5. Real-time updates (optional, via WebSocket)

### API Calls
```bash
GET /api/v1/tenants/{id}/activities?limit=50&offset=0

# With filters
GET /api/v1/tenants/{id}/activities?limit=50&offset=0&action=CREATE
```

### Data Displayed
```
┌────────────────────────────────────────────┐
│ ➕ CREATE | user                          │
│ John Doe created user: jane@acme.com       │
│ 👤 john@acme.com | 1.2.3.4 | 2024-01-20   │
├────────────────────────────────────────────┤
│ ✏️ UPDATE | department                     │
│ John Doe updated department: Engineering   │
│ 👤 john@acme.com | 1.2.3.4 | 2024-01-20   │
└────────────────────────────────────────────┘
```

### Postconditions
- Full audit trail visible
- Can track changes
- Can investigate security incidents

---

## UC-4: Quản lý Members

### Actors
- **Primary:** Tenant Admin, HR Manager

### Preconditions
- User có quyền quản lý members

### Flow
1. User click tab "Thành viên"
2. System fetch members với:
   - Basic info (email, name, avatar)
   - Status (ACTIVE, INVITED, SUSPENDED)
   - Roles
   - Departments
   - Join date
3. Display table với:
   - Avatar + name
   - Email
   - Status badge
   - Roles badges
   - Actions (edit, remove, change status)
4. User can:
   - Search members
   - Filter by status
   - Invite new member
   - Edit member roles
   - Remove member
   - Change member status

### API Calls
```bash
GET /api/v1/tenants/{id}/members-detailed
POST /api/v1/tenant-members
PATCH /api/v1/tenant-members/{member_id}
DELETE /api/v1/tenant-members/{member_id}
```

### Postconditions
- Members managed
- Invitations sent
- Roles updated

---

## UC-5: Quản lý Phòng ban (Departments)

### Actors
- **Primary:** Tenant Admin, HR Manager

### Preconditions
- User có quyền quản lý departments

### Flow
1. User click tab "Phòng ban"
2. System fetch departments hierarchy
3. Display tree structure:
   ```
   Engineering
   ├─ Backend Team
   ├─ Frontend Team
   └─ DevOps Team
   
   Sales
   ├─ Direct Sales
   └─ Channel Sales
   ```
4. User can:
   - Create root department
   - Create sub-department
   - Edit department (name, head)
   - Move department (drag & drop)
   - Delete department
   - View members in department

### API Calls
```bash
GET /api/v1/departments?tenant_id={id}
POST /api/v1/departments
PATCH /api/v1/departments/{dept_id}
DELETE /api/v1/departments/{dept_id}
```

### Features
- Materialized path for hierarchy
- Drag & drop reorder
- Assign department head
- Bulk member assignment

---

## UC-6: Quản lý User Groups

### Actors
- **Primary:** Tenant Admin

### Preconditions
- User có quyền quản lý groups

### Flow
1. User click tab "Nhóm người dùng"
2. System fetch user groups
3. Display groups:
   - Name, code
   - Type (ORG_UNIT, PROJECT, PERMISSION, CUSTOM)
   - Member count
4. User can:
   - Create new group
   - Add/remove members
   - Set group permissions
   - Dynamic rules (auto-add based on criteria)

### API Calls
```bash
GET /api/v1/user-groups?tenant_id={id}
POST /api/v1/user-groups
POST /api/v1/group-members
```

### Use Cases for Groups
- **ORG_UNIT:** Department-based groups
- **PROJECT:** Project teams
- **PERMISSION:** Access control groups
- **CUSTOM:** Ad-hoc groups

---

## UC-7: Quản lý Webhooks

### Actors
- **Primary:** Developer, DevOps

### Preconditions
- Tenant tier allows webhooks
- User có quyền manage integrations

### Flow
1. User click tab "Webhooks"
2. System fetch webhooks
3. Display webhooks:
   - URL
   - Events subscribed
   - Status (active/inactive)
   - Last delivery status
4. User can:
   - Create webhook
   - Test webhook
   - View delivery logs
   - Retry failed deliveries
   - Disable/enable webhook

### API Calls
```bash
GET /api/v1/webhooks?tenant_id={id}
POST /api/v1/webhooks
POST /api/v1/webhooks/{id}/test
GET /api/v1/webhooks/{id}/deliveries
```

### Events Available
- `user.created`
- `user.updated`
- `user.deleted`
- `member.invited`
- `subscription.created`
- `invoice.paid`
- Custom events

---

## UC-8: Quản lý Rate Limits

### Actors
- **Primary:** Platform Admin, Tenant Admin

### Preconditions
- User có quyền manage rate limits

### Flow
1. User click tab "Rate Limits"
2. System fetch rate limits
3. Display limits:
   - Resource (API endpoint, action)
   - Limit (requests per minute/hour/day)
   - Current usage
   - Status (active/breached)
4. User can:
   - Set custom limits
   - View usage graphs
   - Get alerts on breach
   - Whitelist IPs

### API Calls
```bash
GET /api/v1/rate-limits?tenant_id={id}
POST /api/v1/rate-limits
GET /api/v1/rate-limits/{id}/usage
```

### Rate Limit Types
- **Global:** All API calls
- **Per-endpoint:** Specific endpoints
- **Per-user:** User-based limits
- **Per-IP:** IP-based limits

---

## UC-9: Quản lý Locations

### Actors
- **Primary:** Tenant Admin, Facilities Manager

### Preconditions
- User có quyền manage locations

### Flow
1. User click tab "Địa điểm"
2. System fetch locations hierarchy
3. Display locations:
   ```
   HQ - Ho Chi Minh
   ├─ Office Floor 1
   ├─ Office Floor 2
   └─ Warehouse
   
   Branch - Ha Noi
   └─ Office
   ```
4. User can:
   - Create location
   - Set GPS coordinates
   - Set geofence radius
   - Assign timezone
   - Mark as headquarters
   - Custom fields (area, capacity)

### API Calls
```bash
GET /api/v1/locations?tenant_id={id}
POST /api/v1/locations
PATCH /api/v1/locations/{id}
```

### Features
- Map view with markers
- Geofencing for attendance
- Custom metadata (EAV pattern)

---

## UC-10: Quản lý SSO Configs

### Actors
- **Primary:** IT Admin, Security Officer

### Preconditions
- Tenant tier = ENTERPRISE
- User có quyền manage SSO

### Flow
1. User click tab "SSO Configs"
2. System fetch SSO configurations
3. Display providers:
   - Google Workspace
   - Microsoft Azure AD
   - Okta
   - SAML 2.0 custom
4. User can:
   - Add new SSO provider
   - Configure SAML metadata
   - Test SSO login
   - Set as default login method
   - Require SSO for all users

### API Calls
```bash
GET /api/v1/sso-configs?tenant_id={id}
POST /api/v1/sso-configs
POST /api/v1/sso-configs/{id}/test
```

### Configuration
- **SAML:** EntityID, SSO URL, X.509 Certificate
- **OAuth2:** Client ID, Client Secret, Redirect URI
- **OIDC:** Discovery URL, Scopes

---

## UC-11: Quick Actions từ Header

### Actors
- **Primary:** Tenant Admin

### Flow
1. User đang ở bất kỳ tab nào
2. Header luôn hiển thị:
   - Tenant name + code
   - Status badge
   - Tier badge
3. Quick actions:
   - **Kích hoạt/Tạm ngưng:** Toggle status
   - **Sửa:** Navigate to edit page
   - **Xóa:** Soft delete tenant (with confirmation)
4. Status changes:
   - TRIAL → ACTIVE (after payment)
   - ACTIVE ↔ SUSPENDED (admin action)
   - Any → CANCELLED (customer churn)

### API Calls
```bash
PATCH /api/v1/tenants/{id}/status
PATCH /api/v1/tenants/{id}
DELETE /api/v1/tenants/{id}
```

---

## UC-12: Navigation giữa các Tabs

### Flow
1. User click vào tab bất kỳ
2. System:
   - Update URL hash hoặc query param
   - Fetch data cho tab đó (nếu chưa load)
   - Display loading state
   - Render tab content
3. Tab state được preserve (không reload khi switch)
4. Sidebar highlight tab active

### State Management
```typescript
const [activeTab, setActiveTab] = useState<TabType>('overview');
const [tabData, setTabData] = useState<Record<string, any>>({});

const switchTab = async (tab: TabType) => {
  setActiveTab(tab);
  
  if (!tabData[tab]) {
    const data = await fetchTabData(tab);
    setTabData({ ...tabData, [tab]: data });
  }
};
```

---

## UC-13: Multi-tenant Context Switch

### Actors
- User thuộc nhiều tenants

### Flow
1. User đang xem tenant A
2. User cần switch sang tenant B
3. Options:
   - Navigate back to tenants list
   - Use tenant switcher (dropdown in header)
   - Recent tenants quick access
4. System loads tenant B detail page
5. User context switched

### API Calls
```bash
GET /api/v1/tenant-members?user_id={user_id}
# Returns list of tenants user belongs to
```

---

## Performance Optimization

### Lazy Loading
```typescript
// Only load tab data when tab is activated
const TenantDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const renderTab = () => {
    switch(activeTab) {
      case 'stats':
        return <TenantStats tenantId={id} />; // Fetches on mount
      case 'activity':
        return <TenantActivity tenantId={id} />; // Fetches on mount
      // ... other tabs
    }
  };
};
```

### Caching
```typescript
// Cache tab data for 5 minutes
const useTabCache = (tab: string, fetcher: () => Promise<any>) => {
  const [data, setData] = useState(null);
  const [timestamp, setTimestamp] = useState(0);
  
  useEffect(() => {
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      fetcher().then(result => {
        setData(result);
        setTimestamp(Date.now());
      });
    }
  }, [tab]);
  
  return data;
};
```

---

## Summary

| Tab | Data Source | Complexity | API Calls |
|-----|-------------|------------|-----------|
| Overview | tenants | Low | 1 |
| Stats | Multiple tables | Medium | 1 (aggregated) |
| Activity | audit_logs | Medium | 1 (paginated) |
| Members | tenant_members + users | High | 1 (JOIN) |
| Roles | roles | Low | 1 |
| Departments | departments | Medium | 1 (hierarchy) |
| User Groups | user_groups | Medium | 1 |
| Delegations | user_delegations | Low | 1 |
| Locations | locations | Medium | 1 (hierarchy) |
| SSO Configs | sso_configs | Low | 1 |
| App Routes | app_routes | Low | 1 |
| Rate Limits | rate_limits | Low | 1 |
| Webhooks | webhooks | Low | 1 |

**Total APIs:** 5 new endpoints for tenant details + existing CRUD for each resource

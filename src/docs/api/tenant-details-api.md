# Tenant Details API Documentation

## Overview
API bổ sung để hỗ trợ trang chi tiết tenant với thống kê, hoạt động, và thông tin liên quan.

**Base URL:** `/api/v1/tenants/:id`

---

## Endpoints

### 1. Get Tenant Statistics
```http
GET /api/v1/tenants/:id/stats
```

**Description:** Lấy thống kê tổng quan của tenant

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Response:** `200 OK`
```json
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_name": "ACME Corporation",
  "tenant_code": "acme-corp",
  "tier": "ENTERPRISE",
  "status": "ACTIVE",
  "created_at": "2024-01-15T10:30:00Z",
  
  "members_count": 150,
  "active_members": 142,
  "departments_count": 12,
  "user_groups_count": 8,
  "locations_count": 5,
  "roles_count": 15,
  
  "active_subscriptions": 3,
  "monthly_revenue": 5000.00,
  "total_orders": 24,
  "unpaid_invoices": 0,
  
  "app_routes_count": 45,
  "webhooks_count": 3,
  "rate_limits_count": 10,
  "sso_configs_count": 2,
  
  "storage_used_gb": 25.5,
  "api_calls_month": 125000,
  "last_activity_at": "2024-01-20T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Tenant not found
- `500 Internal Server Error` - Server error

**Use Cases:**
- Dashboard overview
- Analytics display
- Health monitoring

---

### 2. Get Tenant Activities
```http
GET /api/v1/tenants/:id/activities
```

**Description:** Lấy lịch sử hoạt động/audit logs của tenant

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | No | 50 | Number of records |
| offset | integer | No | 0 | Offset for pagination |

**Response:** `200 OK`
```json
[
  {
    "_id": "activity-id",
    "tenant_id": "tenant-id",
    "user_id": "user-id",
    "user_name": "John Doe",
    "user_email": "john@acme.com",
    "action": "CREATE",
    "resource": "user",
    "details": "Created new user: jane@acme.com",
    "ip_address": "1.2.3.4",
    "created_at": "2024-01-20T14:30:00Z"
  },
  {
    "_id": "activity-id-2",
    "tenant_id": "tenant-id",
    "user_id": "user-id",
    "user_name": "John Doe",
    "user_email": "john@acme.com",
    "action": "UPDATE",
    "resource": "department",
    "details": "Updated department: Engineering",
    "ip_address": "1.2.3.4",
    "created_at": "2024-01-20T13:15:00Z"
  }
]
```

**Activity Actions:**
- `CREATE` - Created resource
- `UPDATE` - Updated resource
- `DELETE` - Deleted resource
- `LOGIN` - User logged in
- `LOGOUT` - User logged out
- `INVITE` - Invited user
- `APPROVE` - Approved action
- `REJECT` - Rejected action

**Use Cases:**
- Audit trail
- Security monitoring
- Compliance reporting

---

### 3. Get Tenant Members (Detailed)
```http
GET /api/v1/tenants/:id/members-detailed
```

**Description:** Lấy danh sách members với thông tin chi tiết (roles, departments)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Response:** `200 OK`
```json
[
  {
    "_id": "member-id",
    "user_id": "user-id",
    "email": "john@acme.com",
    "full_name": "John Doe",
    "avatar_url": "https://cdn.acme.com/avatars/john.jpg",
    "display_name": "Johnny",
    "status": "ACTIVE",
    "joined_at": "2024-01-15T10:30:00Z",
    "roles": ["Admin", "Developer"],
    "departments": ["Engineering", "Product"],
    "last_login_at": "2024-01-20T14:30:00Z"
  }
]
```

**Use Cases:**
- Team directory
- Member management
- Role assignment

---

### 4. Get Tenant Hierarchy
```http
GET /api/v1/tenants/:id/hierarchy
```

**Description:** Lấy cấu trúc phân cấp (parent & children) của tenant

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Response:** `200 OK`
```json
{
  "_id": "current-tenant-id",
  "code": "acme-corp",
  "name": "ACME Corporation",
  "tier": "ENTERPRISE",
  "status": "ACTIVE",
  "parent": {
    "_id": "parent-id",
    "code": "partner-abc",
    "name": "Partner ABC",
    "tier": "PARTNER_ELITE",
    "status": "ACTIVE"
  },
  "children": [
    {
      "_id": "child-id-1",
      "code": "acme-subsidiary-1",
      "name": "ACME Subsidiary 1",
      "tier": "PRO",
      "status": "ACTIVE"
    },
    {
      "_id": "child-id-2",
      "code": "acme-subsidiary-2",
      "name": "ACME Subsidiary 2",
      "tier": "FREE",
      "status": "TRIAL"
    }
  ]
}
```

**Use Cases:**
- Partner management
- Reseller hierarchy
- Multi-tenant organization

---

### 5. Get Tenant Overview
```http
GET /api/v1/tenants/:id/overview
```

**Description:** Lấy tổng quan đầy đủ (tenant + stats + recent activities)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | UUID | Yes | Tenant ID |

**Response:** `200 OK`
```json
{
  "tenant": {
    "_id": "tenant-id",
    "code": "acme-corp",
    "name": "ACME Corporation",
    "tier": "ENTERPRISE",
    "status": "ACTIVE",
    "data_region": "ap-southeast-1",
    "compliance_level": "STANDARD",
    "billing_type": "POSTPAID",
    "timezone": "Asia/Ho_Chi_Minh",
    "profile": {
      "company_name": "ACME Corp",
      "tax_code": "0123456789"
    },
    "settings": {
      "security": {
        "mfa_required": true
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:30:00Z",
    "version": 5
  },
  "stats": {
    "members_count": 150,
    "departments_count": 12,
    "locations_count": 5
  },
  "recent_activities": [
    {
      "_id": "activity-id",
      "action": "CREATE",
      "resource": "user",
      "created_at": "2024-01-20T14:30:00Z",
      "user_name": "John Doe"
    }
  ],
  "total_members": 150
}
```

**Use Cases:**
- Dashboard page
- Quick overview
- Single API call for initial load

---

## Complete Use Cases

### UC-1: Dashboard Page Initial Load
```bash
# Single call to get everything
curl http://localhost:8080/api/v1/tenants/{id}/overview
```

**Frontend:**
```typescript
const loadDashboard = async (tenantId: string) => {
  const overview = await fetch(`/api/v1/tenants/${tenantId}/overview`);
  return overview.json();
};
```

---

### UC-2: Statistics Dashboard
```bash
# Get detailed stats
curl http://localhost:8080/api/v1/tenants/{id}/stats
```

**Frontend:**
```typescript
const TenantStatsPage = ({ tenantId }) => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch(`/api/v1/tenants/${tenantId}/stats`)
      .then(res => res.json())
      .then(setStats);
  }, [tenantId]);
  
  return (
    <div>
      <StatCard title="Members" value={stats.members_count} />
      <StatCard title="Departments" value={stats.departments_count} />
      {/* ... more stats */}
    </div>
  );
};
```

---

### UC-3: Activity Log Page
```bash
# Get recent activities
curl "http://localhost:8080/api/v1/tenants/{id}/activities?limit=50&offset=0"

# Load more (pagination)
curl "http://localhost:8080/api/v1/tenants/{id}/activities?limit=50&offset=50"
```

**Frontend:**
```typescript
const TenantActivityLog = ({ tenantId }) => {
  const [activities, setActivities] = useState([]);
  const [offset, setOffset] = useState(0);
  
  const loadActivities = async () => {
    const res = await fetch(
      `/api/v1/tenants/${tenantId}/activities?limit=50&offset=${offset}`
    );
    const data = await res.json();
    setActivities([...activities, ...data]);
    setOffset(offset + 50);
  };
  
  return (
    <div>
      {activities.map(activity => (
        <ActivityCard key={activity._id} activity={activity} />
      ))}
      <button onClick={loadActivities}>Load More</button>
    </div>
  );
};
```

---

### UC-4: Team Directory
```bash
# Get all members with roles and departments
curl http://localhost:8080/api/v1/tenants/{id}/members-detailed
```

**Frontend:**
```typescript
const TeamDirectory = ({ tenantId }) => {
  const [members, setMembers] = useState([]);
  
  useEffect(() => {
    fetch(`/api/v1/tenants/${tenantId}/members-detailed`)
      .then(res => res.json())
      .then(setMembers);
  }, [tenantId]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {members.map(member => (
        <MemberCard key={member._id}>
          <Avatar src={member.avatar_url} />
          <h3>{member.full_name}</h3>
          <p>{member.email}</p>
          <Badges>
            {member.roles.map(role => (
              <Badge key={role}>{role}</Badge>
            ))}
          </Badges>
        </MemberCard>
      ))}
    </div>
  );
};
```

---

### UC-5: Hierarchy Visualization
```bash
# Get tenant hierarchy
curl http://localhost:8080/api/v1/tenants/{id}/hierarchy
```

**Frontend:**
```typescript
const TenantHierarchy = ({ tenantId }) => {
  const [hierarchy, setHierarchy] = useState(null);
  
  useEffect(() => {
    fetch(`/api/v1/tenants/${tenantId}/hierarchy`)
      .then(res => res.json())
      .then(setHierarchy);
  }, [tenantId]);
  
  return (
    <div className="tree">
      {hierarchy.parent && (
        <div className="parent">
          <TenantCard tenant={hierarchy.parent} />
        </div>
      )}
      <div className="current">
        <TenantCard tenant={hierarchy} highlighted />
      </div>
      {hierarchy.children.length > 0 && (
        <div className="children">
          {hierarchy.children.map(child => (
            <TenantCard key={child._id} tenant={child} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Performance Considerations

### Caching
```typescript
// Cache stats for 5 minutes
const cacheStats = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getStatsWithCache = async (tenantId: string) => {
  const cached = cacheStats.get(tenantId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetch(`/api/v1/tenants/${tenantId}/stats`).then(r => r.json());
  cacheStats.set(tenantId, { data, timestamp: Date.now() });
  return data;
};
```

### Pagination Best Practices
```typescript
// Infinite scroll pattern
const useInfiniteActivities = (tenantId: string) => {
  const [activities, setActivities] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const loadMore = async () => {
    const data = await fetch(
      `/api/v1/tenants/${tenantId}/activities?limit=50&offset=${offset}`
    ).then(r => r.json());
    
    if (data.length < 50) setHasMore(false);
    setActivities([...activities, ...data]);
    setOffset(offset + 50);
  };
  
  return { activities, loadMore, hasMore };
};
```

---

## Error Handling

### Frontend Pattern
```typescript
const fetchTenantStats = async (tenantId: string) => {
  try {
    const response = await fetch(`/api/v1/tenants/${tenantId}/stats`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    toast.error('Không thể tải thống kê');
    return null;
  }
};
```

---

## Security

### Access Control
```go
// Backend: Check user has access to tenant
func (h *TenantDetailsHandler) GetStats(c *gin.Context) {
    tenantID := c.Param("id")
    userID := c.GetString("user_id") // From auth middleware
    
    // Check if user is member of tenant
    var isMember bool
    h.db.QueryRow(`
        SELECT EXISTS(
            SELECT 1 FROM tenant_members
            WHERE tenant_id = $1 AND user_id = $2
            AND deleted_at IS NULL
        )
    `, tenantID, userID).Scan(&isMember)
    
    if !isMember {
        c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
        return
    }
    
    // ... continue with stats retrieval
}
```

---

## Summary Table

| Endpoint | Method | Purpose | Performance |
|----------|--------|---------|-------------|
| `/stats` | GET | Statistics dashboard | ⭐⭐⭐⭐ Fast (indexed queries) |
| `/activities` | GET | Audit logs | ⭐⭐⭐ Medium (pagination required) |
| `/members-detailed` | GET | Team directory | ⭐⭐⭐ Medium (multiple JOINs) |
| `/hierarchy` | GET | Org structure | ⭐⭐⭐⭐ Fast (simple queries) |
| `/overview` | GET | Complete overview | ⭐⭐⭐ Medium (combines multiple queries) |

---

## Integration with Frontend

### Route Registration
```go
// main.go
detailsHandler := handlers.NewTenantDetailsHandler(db)

tenants.GET("/:id/stats", detailsHandler.GetStats)
tenants.GET("/:id/activities", detailsHandler.GetActivities)
tenants.GET("/:id/members-detailed", detailsHandler.GetMembersDetailed)
tenants.GET("/:id/hierarchy", detailsHandler.GetHierarchy)
tenants.GET("/:id/overview", detailsHandler.GetOverview)
```

### TypeScript Types
```typescript
// types/tenant-details.ts
export interface TenantStats {
  tenant_id: string;
  tenant_name: string;
  members_count: number;
  // ... all other fields
}

export interface TenantActivity {
  _id: string;
  action: string;
  resource: string;
  // ... all other fields
}
```

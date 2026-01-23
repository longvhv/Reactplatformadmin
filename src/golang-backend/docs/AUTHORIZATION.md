# Authorization System

## Overview

VHV Platform implements Role-Based Access Control (RBAC) with the following components:

1. **Permissions** - Granular access rights (e.g., `user:create`, `product:update`)
2. **Roles** - Collections of permissions (e.g., ADMIN, EDITOR, VIEWER)
3. **User Roles** - Assignment of roles to users within tenants

## Database Schema

### permissions
```sql
- _id: UUID
- app_code: VARCHAR (references applications.code)
- code: VARCHAR UNIQUE (e.g., "user:create")
- parent_code: VARCHAR (hierarchical permissions)
- path: TEXT (permission hierarchy path)
- is_group: BOOLEAN (true if permission is a group)
- name: VARCHAR
- description: TEXT
```

### roles
```sql
- _id: UUID
- tenant_id: UUID (references tenants._id)
- name: VARCHAR (e.g., "ADMIN", "EDITOR")
- description: TEXT
- type: VARCHAR (SYSTEM or CUSTOM)
- permission_codes: ARRAY (list of permission codes)
```

### user_roles
```sql
- _id: UUID
- user_id: UUID (references users._id)
- role_id: UUID (references roles._id)
- tenant_id: UUID (references tenants._id)
- scope: VARCHAR (global, tenant, department, etc.)
- scope_id: UUID (ID of the scope entity)
- granted_by: UUID (who granted this role)
- granted_at: TIMESTAMP
- expires_at: TIMESTAMP (nullable, for temporary roles)
- is_active: BOOLEAN
```

## Permission Naming Convention

Permissions follow the format: `resource:action`

### Common Actions:
- `view` - Read access
- `create` - Create new resources
- `update` - Modify existing resources
- `delete` - Delete resources
- `manage` - Full CRUD access

### Examples:
```
user:view
user:create
user:update
user:delete
user:manage

product:view
product:create
product:update
product:delete

tenant:view
tenant:update
tenant:delete
tenant:manage

settings:view
settings:update

analytics:view

audit:view
```

## Standard Roles

### Platform Level
- **PLATFORM_ADMIN** - Full platform access
- **PLATFORM_SUPPORT** - View-only platform access

### Tenant Level
- **OWNER** - Full tenant access, can delete tenant
- **ADMIN** - Manage tenant settings and users
- **MANAGER** - Manage resources, cannot modify tenant
- **EDITOR** - Create and edit resources
- **VIEWER** - Read-only access

## Usage

### 1. Service Layer Authorization

Wrap services with authorization checks:

```go
type ProductServiceWithAuthz struct {
    productService *ProductService
    authzService   *AuthorizationService
}

func (s *ProductServiceWithAuthz) CreateProduct(ctx context.Context, req CreateProductRequest) (*models.Product, error) {
    userID, ok := contextutil.GetUserID(ctx)
    if !ok {
        return nil, errors.ErrUnauthorized
    }

    tenantID, ok := contextutil.GetTenantID(ctx)
    if !ok {
        return nil, fmt.Errorf("tenant_id required")
    }

    // Check permission
    hasPermission, err := s.authzService.HasPermission(ctx, userID, tenantID, PermissionProductCreate)
    if err != nil {
        return nil, err
    }

    if !hasPermission {
        return nil, errors.ErrPermissionDenied
    }

    return s.productService.CreateProduct(ctx, req)
}
```

### 2. Middleware Authorization

Use middleware for route-level protection:

```go
// Require specific permission
router.POST("/products", 
    middleware.RequireAuth(),
    middleware.RequirePermission(authzService, service.PermissionProductCreate),
    productHandler.CreateProduct,
)

// Require any of multiple permissions
router.GET("/analytics", 
    middleware.RequireAuth(),
    middleware.RequireAnyPermission(authzService, []string{
        service.PermissionAnalyticsView,
        service.PermissionTenantView,
    }),
    analyticsHandler.GetAnalytics,
)

// Require tenant admin
router.DELETE("/tenants/:id", 
    middleware.RequireAuth(),
    middleware.RequireTenantOwner(authzService),
    tenantHandler.DeleteTenant,
)

// Require resource owner or admin
router.PUT("/users/:id", 
    middleware.RequireAuth(),
    middleware.RequireResourceOwner(authzService, "id"),
    userHandler.UpdateUser,
)
```

### 3. Authorization Service Methods

```go
// Check single permission
hasPermission, err := authzService.HasPermission(ctx, userID, tenantID, "product:create")

// Check any of multiple permissions
hasAny, err := authzService.HasAnyPermission(ctx, userID, tenantID, []string{
    "product:create",
    "product:update",
})

// Check all permissions
hasAll, err := authzService.HasAllPermissions(ctx, userID, tenantID, []string{
    "product:view",
    "product:create",
})

// Get user permissions
permissions, err := authzService.GetUserPermissions(ctx, userID, tenantID)

// Get user roles
roles, err := authzService.GetUserRoles(ctx, userID, tenantID)

// Check tenant admin
isAdmin, err := authzService.IsTenantAdmin(ctx, userID, tenantID)

// Check tenant owner
isOwner, err := authzService.IsTenantOwner(ctx, userID, tenantID)
```

## Permission Caching

Permissions are cached for 15 minutes to improve performance:

```go
// Cache key format
cacheKey := fmt.Sprintf("permissions:%s:%s", tenantID, userID)

// TTL
const PermissionTTL = 15 * time.Minute
```

### Cache Invalidation

Invalidate cache when:
- User roles are granted/revoked
- Role permissions are modified
- User is removed from tenant

```go
// Invalidate user permissions
authzService.InvalidateUserPermissions(ctx, userID, tenantID)
```

## Role Management

### Grant Role to User

```go
err := authzService.GrantRole(ctx, userID, roleID, tenantID, grantedByUserID)
```

### Revoke Role from User

```go
err := authzService.RevokeRole(ctx, userID, roleID, tenantID)
```

### Create Custom Role

```go
role := &models.Role{
    TenantID: tenantID,
    Name: "Content Editor",
    Description: "Can create and edit content",
    Type: "CUSTOM",
    PermissionCodes: []string{
        "product:view",
        "product:create",
        "product:update",
    },
}

err := roleRepo.Create(ctx, role)
```

## Hierarchical Permissions

Permissions can be hierarchical using the `path` field:

```
user
├── user:view
├── user:create
├── user:update
└── user:delete

product
├── product:view
├── product:create
├── product:update
└── product:delete
```

Parent permissions grant all child permissions:
- `user:manage` grants all `user:*` permissions
- `admin` grants all permissions

## Multi-Tenancy

Users can have different roles in different tenants:

```sql
-- User is ADMIN in Tenant A
INSERT INTO user_roles (user_id, role_id, tenant_id, scope)
VALUES ('user-123', 'role-admin', 'tenant-a', 'tenant');

-- Same user is VIEWER in Tenant B
INSERT INTO user_roles (user_id, role_id, tenant_id, scope)
VALUES ('user-123', 'role-viewer', 'tenant-b', 'tenant');
```

## Scope-Based Permissions

Roles can be scoped to different levels:

- **global** - Platform-wide permissions
- **tenant** - Tenant-level permissions
- **department** - Department-level permissions
- **project** - Project-level permissions

```go
userRole := &models.UserRole{
    UserID:   userID,
    RoleID:   roleID,
    TenantID: &tenantID,
    Scope:    "department",
    ScopeID:  &departmentID,
}
```

## Temporary Roles

Roles can expire automatically:

```go
userRole := &models.UserRole{
    UserID:    userID,
    RoleID:    roleID,
    TenantID:  &tenantID,
    ExpiresAt: time.Now().Add(30 * 24 * time.Hour), // 30 days
}
```

Expired roles are automatically deactivated by a background job:

```go
count, err := userRoleRepo.RevokeExpiredRoles(ctx)
```

## Best Practices

1. **Principle of Least Privilege**: Grant minimum permissions required
2. **Use Roles**: Don't assign permissions directly to users
3. **Cache Wisely**: Balance performance and security
4. **Audit Permissions**: Log all permission changes
5. **Regular Review**: Periodically review and clean up roles
6. **Temporary Access**: Use expiring roles for temporary access
7. **Hierarchical Design**: Use permission hierarchy for easier management

## Security Considerations

1. **Always authenticate first**: Check user is logged in before authorization
2. **Validate tenant context**: Ensure user has access to the tenant
3. **Generic error messages**: Don't reveal permission structure in errors
4. **Cache invalidation**: Invalidate cache immediately when permissions change
5. **Audit trail**: Log all authorization failures for security monitoring

## Example: Complete Flow

```go
// 1. User authenticates
token := authService.Login(email, password)

// 2. User makes request with token
// Request includes: userID, tenantID in context

// 3. Middleware checks authentication
userID := contextutil.GetUserID(ctx)
tenantID := contextutil.GetTenantID(ctx)

// 4. Middleware or service checks authorization
hasPermission := authzService.HasPermission(ctx, userID, tenantID, "product:create")

// 5. If authorized, execute business logic
if hasPermission {
    product := productService.CreateProduct(req)
}
```

## Testing

```go
func TestAuthorizationService_HasPermission(t *testing.T) {
    // Create test user, role, and permissions
    userID := uuid.New()
    tenantID := uuid.New()
    roleID := uuid.New()
    
    role := &models.Role{
        ID: roleID,
        TenantID: tenantID,
        PermissionCodes: []string{"product:create"},
    }
    
    userRole := &models.UserRole{
        UserID: userID,
        RoleID: roleID,
        TenantID: &tenantID,
        IsActive: true,
    }
    
    // Test has permission
    hasPermission, err := authzService.HasPermission(ctx, userID, tenantID, "product:create")
    assert.NoError(t, err)
    assert.True(t, hasPermission)
    
    // Test doesn't have permission
    hasPermission, err = authzService.HasPermission(ctx, userID, tenantID, "product:delete")
    assert.NoError(t, err)
    assert.False(t, hasPermission)
}
```

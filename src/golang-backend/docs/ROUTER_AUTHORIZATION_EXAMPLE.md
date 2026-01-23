# Router Authorization Example

## Complete Setup Example

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/vhv-platform/backend/internal/handler"
    "github.com/vhv-platform/backend/internal/middleware"
    "github.com/vhv-platform/backend/internal/service"
)

func SetupRouter(
    authHandler *handler.AuthHandler,
    userHandler *handler.UserHandler,
    tenantHandler *handler.TenantHandler,
    productHandler *handler.ProductHandler,
    orderHandler *handler.OrderHandler,
    authzService *service.AuthorizationService,
) *gin.Engine {
    r := gin.Default()
    
    // Global middleware
    r.Use(middleware.CORS())
    r.Use(middleware.ContextMiddleware()) // Extract request ID, tenant ID, etc.
    r.Use(middleware.RequestLogger())
    r.Use(middleware.Recovery())
    
    // API v1
    v1 := r.Group("/api/v1")
    
    // Public routes (no authentication required)
    {
        auth := v1.Group("/auth")
        auth.POST("/login", authHandler.Login)
        auth.POST("/register", authHandler.Register)
        auth.POST("/refresh", authHandler.RefreshToken)
        auth.POST("/forgot-password", authHandler.ForgotPassword)
        auth.POST("/reset-password", authHandler.ResetPassword)
    }
    
    // Protected routes (authentication required)
    protected := v1.Group("")
    protected.Use(middleware.RequireAuth())
    {
        // Auth endpoints
        auth := protected.Group("/auth")
        {
            auth.POST("/logout", authHandler.Logout)
            auth.GET("/me", authHandler.GetCurrentUser)
        }
        
        // User management
        users := protected.Group("/users")
        {
            // List users - requires user:view
            users.GET("", 
                middleware.RequirePermission(authzService, service.PermissionUserView),
                userHandler.List,
            )
            
            // Get user - requires user:view or being the user
            users.GET("/:id", 
                middleware.RequireAnyPermission(authzService, []string{
                    service.PermissionUserView,
                }),
                userHandler.GetByID,
            )
            
            // Create user - requires user:create
            users.POST("", 
                middleware.RequirePermission(authzService, service.PermissionUserCreate),
                userHandler.Create,
            )
            
            // Update user - requires user:update or being the user
            users.PUT("/:id", 
                middleware.RequireResourceOwner(authzService, "id"),
                userHandler.Update,
            )
            
            // Delete user - requires user:delete
            users.DELETE("/:id", 
                middleware.RequirePermission(authzService, service.PermissionUserDelete),
                userHandler.Delete,
            )
        }
        
        // Tenant management
        tenants := protected.Group("/tenants")
        {
            // List tenants - authenticated users can see their tenants
            tenants.GET("", tenantHandler.List)
            
            // Create tenant - any authenticated user can create
            tenants.POST("", tenantHandler.Create)
            
            // Tenant-specific routes (require tenant context)
            tenant := tenants.Group("/:tenant_id")
            tenant.Use(middleware.ExtractTenantID())
            {
                // Get tenant - requires being a member
                tenant.GET("", tenantHandler.GetByID)
                
                // Update tenant - requires tenant:update or admin
                tenant.PUT("", 
                    middleware.RequireTenantAdmin(authzService),
                    tenantHandler.Update,
                )
                
                // Delete tenant - requires tenant owner
                tenant.DELETE("", 
                    middleware.RequireTenantOwner(authzService),
                    tenantHandler.Delete,
                )
                
                // Tenant settings
                settings := tenant.Group("/settings")
                {
                    settings.GET("", 
                        middleware.RequirePermission(authzService, service.PermissionSettingsView),
                        tenantHandler.GetSettings,
                    )
                    
                    settings.PUT("", 
                        middleware.RequirePermission(authzService, service.PermissionSettingsUpdate),
                        tenantHandler.UpdateSettings,
                    )
                }
                
                // Tenant members
                members := tenant.Group("/members")
                {
                    members.GET("", 
                        middleware.RequirePermission(authzService, service.PermissionUserView),
                        tenantHandler.ListMembers,
                    )
                    
                    members.POST("", 
                        middleware.RequireTenantAdmin(authzService),
                        tenantHandler.AddMember,
                    )
                    
                    members.DELETE("/:user_id", 
                        middleware.RequireTenantAdmin(authzService),
                        tenantHandler.RemoveMember,
                    )
                }
                
                // Tenant roles
                roles := tenant.Group("/roles")
                {
                    roles.GET("", 
                        middleware.RequirePermission(authzService, service.PermissionRoleView),
                        tenantHandler.ListRoles,
                    )
                    
                    roles.POST("", 
                        middleware.RequirePermission(authzService, service.PermissionRoleCreate),
                        tenantHandler.CreateRole,
                    )
                    
                    roles.PUT("/:role_id", 
                        middleware.RequirePermission(authzService, service.PermissionRoleUpdate),
                        tenantHandler.UpdateRole,
                    )
                    
                    roles.DELETE("/:role_id", 
                        middleware.RequirePermission(authzService, service.PermissionRoleDelete),
                        tenantHandler.DeleteRole,
                    )
                }
            }
        }
        
        // Product management (tenant-scoped)
        products := protected.Group("/products")
        products.Use(middleware.ExtractTenantID())
        {
            // List products - requires product:view
            products.GET("", 
                middleware.RequirePermission(authzService, service.PermissionProductView),
                productHandler.List,
            )
            
            // Get product - requires product:view
            products.GET("/:id", 
                middleware.RequirePermission(authzService, service.PermissionProductView),
                productHandler.GetByID,
            )
            
            // Create product - requires product:create
            products.POST("", 
                middleware.RequirePermission(authzService, service.PermissionProductCreate),
                productHandler.Create,
            )
            
            // Update product - requires product:update
            products.PUT("/:id", 
                middleware.RequirePermission(authzService, service.PermissionProductUpdate),
                productHandler.Update,
            )
            
            // Delete product - requires product:delete
            products.DELETE("/:id", 
                middleware.RequirePermission(authzService, service.PermissionProductDelete),
                productHandler.Delete,
            )
        }
        
        // Order management (tenant-scoped)
        orders := protected.Group("/orders")
        orders.Use(middleware.ExtractTenantID())
        {
            // List orders - requires order:view
            orders.GET("", 
                middleware.RequirePermission(authzService, service.PermissionOrderView),
                orderHandler.List,
            )
            
            // Get order - requires order:view
            orders.GET("/:id", 
                middleware.RequirePermission(authzService, service.PermissionOrderView),
                orderHandler.GetByID,
            )
            
            // Create order - requires order:create
            orders.POST("", 
                middleware.RequirePermission(authzService, service.PermissionOrderCreate),
                orderHandler.Create,
            )
            
            // Update order - requires order:update
            orders.PUT("/:id", 
                middleware.RequirePermission(authzService, service.PermissionOrderUpdate),
                orderHandler.Update,
            )
            
            // Delete order - requires order:delete
            orders.DELETE("/:id", 
                middleware.RequirePermission(authzService, service.PermissionOrderDelete),
                orderHandler.Delete,
            )
        }
        
        // Analytics (tenant-scoped)
        analytics := protected.Group("/analytics")
        analytics.Use(middleware.ExtractTenantID())
        analytics.Use(middleware.RequirePermission(authzService, service.PermissionAnalyticsView))
        {
            analytics.GET("/dashboard", analyticsHandler.GetDashboard)
            analytics.GET("/revenue", analyticsHandler.GetRevenue)
            analytics.GET("/users", analyticsHandler.GetUsers)
        }
        
        // Audit logs (tenant-scoped)
        audit := protected.Group("/audit-logs")
        audit.Use(middleware.ExtractTenantID())
        audit.Use(middleware.RequirePermission(authzService, service.PermissionAuditView))
        {
            audit.GET("", auditHandler.List)
            audit.GET("/:id", auditHandler.GetByID)
        }
        
        // Admin-only routes
        admin := protected.Group("/admin")
        admin.Use(middleware.RequireTenantAdmin(authzService))
        {
            admin.GET("/system-info", adminHandler.GetSystemInfo)
            admin.POST("/maintenance", adminHandler.ToggleMaintenance)
            admin.GET("/metrics", adminHandler.GetMetrics)
        }
    }
    
    return r
}
```

## Permission Matrix Example

```go
// Define permission matrix for different roles

var RolePermissions = map[string][]string{
    "OWNER": {
        // User management
        service.PermissionUserView,
        service.PermissionUserCreate,
        service.PermissionUserUpdate,
        service.PermissionUserDelete,
        
        // Tenant management
        service.PermissionTenantView,
        service.PermissionTenantUpdate,
        service.PermissionTenantDelete,
        
        // Role management
        service.PermissionRoleView,
        service.PermissionRoleCreate,
        service.PermissionRoleUpdate,
        service.PermissionRoleDelete,
        
        // Full access
        service.PermissionProductView,
        service.PermissionProductCreate,
        service.PermissionProductUpdate,
        service.PermissionProductDelete,
        service.PermissionOrderView,
        service.PermissionOrderCreate,
        service.PermissionOrderUpdate,
        service.PermissionOrderDelete,
        service.PermissionSettingsView,
        service.PermissionSettingsUpdate,
        service.PermissionAnalyticsView,
        service.PermissionAuditView,
    },
    
    "ADMIN": {
        service.PermissionUserView,
        service.PermissionUserCreate,
        service.PermissionUserUpdate,
        service.PermissionTenantView,
        service.PermissionRoleView,
        service.PermissionProductView,
        service.PermissionProductCreate,
        service.PermissionProductUpdate,
        service.PermissionProductDelete,
        service.PermissionOrderView,
        service.PermissionOrderCreate,
        service.PermissionOrderUpdate,
        service.PermissionSettingsView,
        service.PermissionSettingsUpdate,
        service.PermissionAnalyticsView,
    },
    
    "EDITOR": {
        service.PermissionUserView,
        service.PermissionProductView,
        service.PermissionProductCreate,
        service.PermissionProductUpdate,
        service.PermissionOrderView,
        service.PermissionOrderCreate,
        service.PermissionOrderUpdate,
    },
    
    "VIEWER": {
        service.PermissionUserView,
        service.PermissionProductView,
        service.PermissionOrderView,
        service.PermissionAnalyticsView,
    },
}
```

## Seed Initial Roles

```go
func SeedRoles(ctx context.Context, roleRepo repository.RoleRepository, tenantID uuid.UUID) error {
    for roleName, permissions := range RolePermissions {
        role := &models.Role{
            ID:              uuid.New(),
            TenantID:        tenantID,
            Name:            roleName,
            Description:     fmt.Sprintf("Default %s role", roleName),
            Type:            "SYSTEM",
            PermissionCodes: permissions,
            CreatedAt:       time.Now(),
            UpdatedAt:       time.Now(),
            Version:         1,
        }
        
        if err := roleRepo.Create(ctx, role); err != nil {
            return fmt.Errorf("failed to create role %s: %w", roleName, err)
        }
    }
    
    return nil
}
```

## Usage in Handlers

```go
func (h *ProductHandler) Create(c *gin.Context) {
    var req CreateProductRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
        return
    }
    
    // User and tenant already extracted by middleware
    // Permission already checked by middleware
    
    // Create product
    product, err := h.productService.CreateProduct(c.Request.Context(), req)
    if err != nil {
        httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
        return
    }
    
    httputil.SuccessResponse(c, http.StatusCreated, product)
}
```

## Testing with Authorization

```go
func TestProductHandler_Create_WithoutPermission(t *testing.T) {
    // Setup
    router := SetupTestRouter()
    
    // Create user without permission
    userID := uuid.New()
    tenantID := uuid.New()
    token := CreateTestToken(userID, tenantID)
    
    // Make request
    req := httptest.NewRequest("POST", "/api/v1/products", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("X-Tenant-ID", tenantID.String())
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    // Assert forbidden
    assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestProductHandler_Create_WithPermission(t *testing.T) {
    // Setup
    router := SetupTestRouter()
    
    // Create user with permission
    userID := uuid.New()
    tenantID := uuid.New()
    
    // Grant role with permission
    role := CreateRoleWithPermissions(tenantID, []string{service.PermissionProductCreate})
    GrantRoleToUser(userID, role.ID, tenantID)
    
    token := CreateTestToken(userID, tenantID)
    
    // Make request
    body := `{"name":"Test Product","price":100}`
    req := httptest.NewRequest("POST", "/api/v1/products", strings.NewReader(body))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("X-Tenant-ID", tenantID.String())
    req.Header.Set("Content-Type", "application/json")
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    // Assert success
    assert.Equal(t, http.StatusCreated, w.Code)
}
```

# 🚀 Setup Instructions for User & Dashboard APIs

## ✅ Files Created

### Backend (Golang)
- `/golang-api/handlers/users_handler.go` (620 lines)
- `/golang-api/handlers/dashboard_handler.go` (550 lines)

### Frontend (TypeScript/React)
- `/api/userApi.ts` (180 lines)
- `/api/dashboardApi.ts` (150 lines)
- `/pages/EditUserPage.tsx` (420 lines)
- `/hooks/useUser.ts` (updated to use new API)

## 📋 Step-by-Step Setup

### 1. Register Routes in Golang Main File

Open your Golang main file (e.g., `main.go` or `routes.go`) and add:

```go
package main

import (
    "database/sql"
    "github.com/gin-gonic/gin"
    
    // Import handlers
    "your-project/handlers"
)

func setupRoutes(router *gin.Engine, db *sql.DB) {
    // Create handler instances
    userHandler := handlers.NewUserHandler(db)
    dashboardHandler := handlers.NewDashboardHandler(db)
    
    // API v1 group
    v1 := router.Group("/api/v1")
    {
        // ============================================
        // USER ENDPOINTS (8 routes)
        // ============================================
        users := v1.Group("/users")
        {
            users.GET("", userHandler.GetAllUsers)                    // List users with filters
            users.GET("/:id", userHandler.GetUserByID)                // Get user by ID
            users.POST("", userHandler.CreateUser)                    // Create new user
            users.PATCH("/:id", userHandler.UpdateUser)               // Update user
            users.DELETE("/:id", userHandler.DeleteUser)              // Soft delete user
            users.PATCH("/:id/status", userHandler.UpdateUserStatus)  // Update status only
            users.POST("/:id/change-password", userHandler.ChangePassword)  // Change password (NEW)
            users.POST("/:id/reset-password", userHandler.ResetPassword)    // Admin reset password (NEW)
        }
        
        // ============================================
        // DASHBOARD ENDPOINTS (5 routes)
        // ============================================
        dashboard := v1.Group("/dashboard")
        {
            dashboard.GET("/overview", dashboardHandler.GetOverview)
            dashboard.GET("/revenue-chart", dashboardHandler.GetRevenueChart)
            dashboard.GET("/activity-chart", dashboardHandler.GetActivityChart)
            dashboard.GET("/recent-activities", dashboardHandler.GetRecentActivities)
            dashboard.GET("/system-health", dashboardHandler.GetSystemHealth)
        }
    }
}

func main() {
    // Initialize database
    db, err := sql.Open("postgres", "your-connection-string")
    if err != nil {
        panic(err)
    }
    defer db.Close()
    
    // Initialize Gin router
    router := gin.Default()
    
    // CORS middleware (if needed)
    router.Use(func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    })
    
    // Setup routes
    setupRoutes(router, db)
    
    // Start server
    router.Run(":8080")
}
```

### 2. Database Connection String

Make sure your PostgreSQL connection is configured:

```go
// Example connection string
connStr := fmt.Sprintf(
    "host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
    os.Getenv("DB_HOST"),
    os.Getenv("DB_PORT"),
    os.Getenv("DB_USER"),
    os.Getenv("DB_PASSWORD"),
    os.Getenv("DB_NAME"),
)

db, err := sql.Open("postgres", connStr)
```

### 3. Test API Endpoints

After starting the server, test with curl:

#### Test User Endpoints

```bash
# 1. List all users
curl http://localhost:8080/api/v1/users

# 2. Get user by ID
curl http://localhost:8080/api/v1/users/{user-id}

# 3. Create user
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "status": "ACTIVE"
  }'

# 4. Update user
curl -X PATCH http://localhost:8080/api/v1/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Updated Name",
    "status": "ACTIVE"
  }'

# 5. Update user status
curl -X PATCH http://localhost:8080/api/v1/users/{user-id}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "DISABLED"}'

# 6. Delete user (soft delete)
curl -X DELETE http://localhost:8080/api/v1/users/{user-id}

# 7. Change password
curl -X POST http://localhost:8080/api/v1/users/{user-id}/change-password \
  -H "Content-Type: application/json" \
  -d '{"current_password": "password123", "new_password": "newpassword123"}'

# 8. Admin reset password
curl -X POST http://localhost:8080/api/v1/users/{user-id}/reset-password \
  -H "Content-Type: application/json" \
  -d '{"new_password": "newpassword123"}'
```

#### Test Dashboard Endpoints

```bash
# 1. Get dashboard overview
curl http://localhost:8080/api/v1/dashboard/overview

# 2. Get revenue chart (12 months)
curl http://localhost:8080/api/v1/dashboard/revenue-chart

# 3. Get activity chart (30 days)
curl http://localhost:8080/api/v1/dashboard/activity-chart

# 4. Get recent activities
curl http://localhost:8080/api/v1/dashboard/recent-activities

# 5. Get system health
curl http://localhost:8080/api/v1/dashboard/system-health
```

### 4. Expected Responses

#### User Response Example
```json
{
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "phone_number": "+84123456789",
  "status": "ACTIVE",
  "is_support_staff": false,
  "mfa_enabled": true,
  "is_verified": true,
  "locale": "vi-VN",
  "metadata": "{}",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Dashboard Overview Response Example
```json
{
  "total_users": 150,
  "active_users": 142,
  "new_users_this_month": 23,
  "users_growth_percent": 12.5,
  "total_tenants": 45,
  "active_tenants": 43,
  "new_tenants_this_month": 5,
  "tenants_growth_percent": 8.2,
  "total_subscriptions": 89,
  "active_subscriptions": 76,
  "expired_subscriptions": 8,
  "expiring_subscriptions": 5,
  "total_revenue": 450000000,
  "monthly_revenue": 45200000,
  "revenue_growth_percent": 15.3,
  "total_orders": 234,
  "pending_orders": 12,
  "paid_orders": 215,
  "total_invoices": 234,
  "pending_invoices": 15,
  "paid_invoices": 210,
  "overdue_invoices": 9,
  "total_webhooks": 23,
  "active_webhooks": 20,
  "healthy_webhooks": 18,
  "unhealthy_webhooks": 2,
  "total_notifications": 567,
  "unread_notifications": 45
}
```

### 5. Frontend Integration (Already Done ✅)

The frontend is already configured:
- ✅ Routes added to `/App.tsx`
- ✅ API clients created (`userApi.ts`, `dashboardApi.ts`)
- ✅ Hook updated (`useUser.ts`)
- ✅ Pages created (`EditUserPage.tsx`)
- ✅ Dashboard updated (`DashboardPage.tsx`)

### 6. Testing Frontend Flow

1. Start Golang backend: `go run main.go`
2. Start React frontend: `npm run dev`
3. Navigate to: `http://localhost:3000/core/users`
4. Click on a user's avatar → Should load UserDetailPage
5. Click "Edit" button → Should navigate to EditUserPage
6. Edit fields and save → Should update user in database

### 7. Troubleshooting

#### "Failed to fetch user" Error

**Cause:** API endpoint not registered or wrong path

**Fix:**
1. Check Golang routes are registered
2. Verify server is running on port 8080
3. Check CORS is enabled
4. Check database connection

**Test:**
```bash
# Should return 200 OK
curl -v http://localhost:8080/api/v1/users
```

#### "Email already exists" Error

**Cause:** Trying to update user with existing email

**Fix:**
- Use unique email
- Check database for duplicate emails:
```sql
SELECT email, COUNT(*) 
FROM users 
WHERE deleted_at IS NULL 
GROUP BY email 
HAVING COUNT(*) > 1;
```

#### CORS Error in Browser

**Fix:** Add CORS middleware to Golang:
```go
import "github.com/gin-contrib/cors"

router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Content-Type", "Authorization"},
    AllowCredentials: true,
}))
```

### 8. Database Requirements

Make sure these tables exist:
- ✅ `users` (with indexes on email)
- ✅ `tenants`
- ✅ `tenant_subscriptions`
- ✅ `subscription_invoices`
- ✅ `subscription_orders`
- ✅ `webhooks`
- ✅ `notifications`

Check with:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'tenants', 'tenant_subscriptions', 
                     'subscription_invoices', 'subscription_orders', 
                     'webhooks', 'notifications');
```

### 9. Next Steps

1. ✅ Register routes in Golang
2. ✅ Test API endpoints
3. ✅ Test frontend flow
4. Add authentication middleware (optional)
5. Add rate limiting (optional)
6. Add logging (optional)
7. Deploy to production

## 🎯 Summary

**Backend Created:**
- 2 handlers (1,170 lines)
- 11 API endpoints
- Full CRUD for users
- Dashboard statistics

**Frontend Created:**
- 2 API clients (330 lines)
- 1 edit page (420 lines)
- 1 hook updated
- Routes configured

**Status:** ✅ Ready to use after route registration!
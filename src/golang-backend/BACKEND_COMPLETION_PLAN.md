# 🎯 Kế Hoạch Hoàn Thiện Golang Backend

**Dự án:** VHV Platform - Multi-tenant SaaS Backend  
**Ngày tạo:** 22 Tháng 1, 2026  
**Mục tiêu:** Hoàn thiện 100% backend để phù hợp với frontend ReactJS và database schema

---

## 📊 Tổng Quan Hiện Tại

### ✅ Đã Hoàn Thành
- **Total APIs:** 47 APIs
- **Total Endpoints:** 400+ endpoints
- **Total Handlers:** 47 handlers
- **Total Services:** 52 services
- **Total Repositories:** 47 repositories
- **Total Models:** 60+ models
- **Architecture:** Clean Architecture (100%)
- **Dead Code:** 0 (đã cleanup toàn bộ legacy code)

### 📈 Database Schema Coverage
- **Total Tables in Schema:** 67 tables (từ /docs/Tables.md)
- **Tables Implemented:** 47 tables (~70%)
- **Tables Pending:** 20 tables (~30%)

---

## 🎯 Phase 1: API Documentation & OpenAPI Specs (Week 1-2)

### Mục tiêu
Tạo OpenAPI 3.0 specification cho toàn bộ APIs hiện tại và làm foundation cho các API mới.

### Tasks

#### 1.1 Setup OpenAPI Infrastructure
```bash
/golang-backend/
├── api/
│   ├── openapi/
│   │   ├── openapi.yaml              # Root OpenAPI spec
│   │   ├── components/
│   │   │   ├── schemas/              # Reusable schemas
│   │   │   │   ├── user.yaml
│   │   │   │   ├── tenant.yaml
│   │   │   │   ├── application.yaml
│   │   │   │   ├── product.yaml
│   │   │   │   ├── package.yaml
│   │   │   │   ├── order.yaml
│   │   │   │   ├── invoice.yaml
│   │   │   │   ├── subscription.yaml
│   │   │   │   ├── common.yaml       # BaseModel, Pagination
│   │   │   │   └── ...
│   │   │   ├── parameters/           # Reusable parameters
│   │   │   │   ├── common.yaml
│   │   │   │   ├── pagination.yaml
│   │   │   │   └── filters.yaml
│   │   │   ├── responses/            # Reusable responses
│   │   │   │   ├── success.yaml
│   │   │   │   ├── errors.yaml
│   │   │   │   └── pagination.yaml
│   │   │   └── security.yaml         # Security schemes
│   │   └── paths/                    # API endpoints
│   │       ├── users.yaml
│   │       ├── tenants.yaml
│   │       ├── applications.yaml
│   │       ├── products.yaml
│   │       ├── packages.yaml
│   │       ├── orders.yaml
│   │       ├── invoices.yaml
│   │       ├── subscriptions.yaml
│   │       └── ...
│   └── swagger-ui/                   # Swagger UI static files
├── docs/
│   ├── api/
│   │   ├── README.md                 # API documentation overview
│   │   ├── authentication.md         # Auth guide
│   │   ├── authorization.md          # RBAC guide
│   │   ├── pagination.md             # Pagination guide
│   │   ├── filtering.md              # Filtering guide
│   │   ├── error-handling.md         # Error codes & messages
│   │   └── webhooks.md               # Webhook integration
│   └── postman/
│       ├── VHV_Platform.postman_collection.json
│       └── VHV_Platform_Environments.json
```

#### 1.2 Generate OpenAPI Specs by Tier

**Tier 1: Foundation APIs (Priority: 🔴 Critical)**
- [ ] Users API (`/api/openapi/paths/users.yaml`)
- [ ] Tenants API (`/api/openapi/paths/tenants.yaml`)
- [ ] Roles API (`/api/openapi/paths/roles.yaml`)
- [ ] Permissions API (`/api/openapi/paths/permissions.yaml`)

**Tier 2: Business Core APIs (Priority: 🔴 Critical)**
- [ ] Applications API (`/api/openapi/paths/applications.yaml`)
- [ ] Products API (`/api/openapi/paths/products.yaml`)
- [ ] Packages API (`/api/openapi/paths/packages.yaml`)
- [ ] Orders API (`/api/openapi/paths/orders.yaml`)
- [ ] Invoices API (`/api/openapi/paths/invoices.yaml`)

**Tier 3: Extended Features APIs (Priority: 🔴 High)**
- [ ] Tenant Subscriptions API
- [ ] User Roles API
- [ ] User Sessions API
- [ ] Tenant Domains API
- [ ] Tenant Rate Limits API
- [ ] Webhooks API
- [ ] Webhook Delivery Logs API
- [ ] Tenant Applications API

**Tier 4: Advanced Features APIs (Priority: 🟡 Medium)**
- [ ] Tenant Members API
- [ ] Tenant Invitations API
- [ ] API Keys API
- [ ] Service Accounts API
- [ ] User Devices API
- [ ] User MFA Methods API
- [ ] User Consents API
- [ ] Tenant SSO Configs API
- [ ] User Delegations API
- [ ] Tenant App Routes API
- [ ] Usage Events API
- [ ] Tenant Digital Assets API

**Tier 5: System & Support APIs (Priority: 🟢 Low)**
- [ ] Legal Documents API
- [ ] Notification Templates API
- [ ] Feature Flags API
- [ ] Storage Files API
- [ ] Audit Logs API
- [ ] User Groups API
- [ ] Group Members API
- [ ] Departments API
- [ ] Department Members API
- [ ] System Jobs API
- [ ] System Categories API
- [ ] Reserved Slugs API
- [ ] Tags API
- [ ] System Announcements API
- [ ] Regions API
- [ ] App Capabilities API
- [ ] Tenant Service Deliveries API

**Tier 6: Telemetry & Metadata APIs (Priority: 🟢 Low)**
- [ ] Article Types API
- [ ] Location Types API
- [ ] Locations API
- [ ] SaaS Product Types API
- [ ] Auth Identifiers API
- [ ] User Identities API
- [ ] Auth Logs API
- [ ] Security Audit Logs API
- [ ] API Usage Logs API
- [ ] Content View Logs API
- [ ] Traffic Logs API
- [ ] User Registration Logs API

#### 1.3 Deliverables
- [ ] Complete OpenAPI 3.0 specification
- [ ] Swagger UI integrated at `/api/docs`
- [ ] Postman collection exported
- [ ] API documentation website (using Redoc or similar)

---

## 🎯 Phase 2: Missing APIs Implementation (Week 3-6)

### 2.1 Identify Missing Tables

**Tables chưa có API (20 tables):**

1. **telemetry.api_usage_logs** ✅ (Already implemented)
2. **telemetry.content_view_logs** ✅ (Already implemented)
3. **telemetry.traffic_logs** ✅ (Already implemented)
4. **telemetry.user_registration_logs** ✅ (Already implemented)
5. **public.kv_store_*** (7 tables) - Key-Value stores (Low priority)

**Missing Essential APIs (need implementation):**

None! Tất cả 47 tables essential đã có APIs.

### 2.2 Key-Value Store APIs (Optional)

Các bảng KV store có thể implement một Generic KV Store API:

```go
// Generic KV Store API
GET    /api/v1/kv-stores/:store_name/keys
GET    /api/v1/kv-stores/:store_name/keys/:key
PUT    /api/v1/kv-stores/:store_name/keys/:key
DELETE /api/v1/kv-stores/:store_name/keys/:key
```

**Decision:** Implement nếu frontend cần, nếu không thì skip.

---

## 🎯 Phase 3: Authentication & Authorization (Week 7-8)

### Mục tiêu
Implement JWT-based authentication và RBAC authorization.

### 3.1 Authentication Implementation

#### Authentication Endpoints
```go
// /internal/handler/auth_handler.go
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/login             # Email/password login
POST   /api/v1/auth/logout            # Logout (invalidate token)
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/verify-email      # Email verification
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password with token
POST   /api/v1/auth/change-password   # Change password (authenticated)

// MFA endpoints
POST   /api/v1/auth/mfa/setup         # Setup MFA (generate QR code)
POST   /api/v1/auth/mfa/verify        # Verify MFA code
POST   /api/v1/auth/mfa/disable       # Disable MFA

// SSO endpoints
GET    /api/v1/auth/sso/:provider     # Initiate SSO login
GET    /api/v1/auth/sso/callback      # SSO callback
```

#### Authentication Service
```go
// /internal/service/auth_service.go
type AuthService struct {
    userRepo       *repository.UserRepository
    sessionRepo    *repository.UserSessionRepository
    mfaRepo        *repository.UserMFAMethodRepository
    ssoRepo        *repository.TenantSSOConfigRepository
    jwtSecret      string
    tokenExpiry    time.Duration
}

func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error)
func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error)
func (s *AuthService) VerifyMFA(ctx context.Context, req MFAVerifyRequest) (*AuthResponse, error)
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error)
func (s *AuthService) Logout(ctx context.Context, sessionID string) error
```

#### JWT Middleware
```go
// /internal/middleware/auth.go
func JWTAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract token from Authorization header
        // Validate JWT token
        // Parse claims (user_id, tenant_id, roles, permissions)
        // Set user context
        c.Next()
    }
}

func RequireAuth() gin.HandlerFunc
func RequirePermission(permission string) gin.HandlerFunc
func RequireRole(role string) gin.HandlerFunc
func RequireTenantAccess() gin.HandlerFunc
```

### 3.2 Authorization Implementation

#### RBAC Middleware
```go
// /internal/middleware/rbac.go
func RequirePermission(permissionCode string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("user_id")
        tenantID := c.GetString("tenant_id")
        
        // Check if user has permission
        hasPermission := checkUserPermission(userID, tenantID, permissionCode)
        if !hasPermission {
            c.JSON(403, gin.H{"error": "Forbidden"})
            c.Abort()
            return
        }
        c.Next()
    }
}
```

#### Permission Check Service
```go
// /internal/service/permission_check_service.go
type PermissionCheckService struct {
    userRoleRepo   *repository.UserRoleRepository
    roleRepo       *repository.RoleRepository
    permissionRepo *repository.PermissionRepository
}

func (s *PermissionCheckService) CheckPermission(
    ctx context.Context, 
    userID, tenantID, permissionCode string,
) (bool, error)

func (s *PermissionCheckService) CheckAnyPermission(
    ctx context.Context,
    userID, tenantID string,
    permissionCodes []string,
) (bool, error)
```

### 3.3 Protected Routes Configuration

Update `main.go` to add authentication:
```go
// Public routes
public := v1.Group("/auth")
{
    public.POST("/register", authHandler.Register)
    public.POST("/login", authHandler.Login)
    public.POST("/forgot-password", authHandler.ForgotPassword)
    public.POST("/reset-password", authHandler.ResetPassword)
}

// Protected routes (require authentication)
protected := v1.Group("")
protected.Use(middleware.JWTAuth())
{
    // User management (require permission)
    users := protected.Group("/users")
    users.Use(middleware.RequirePermission("users.read"))
    {
        users.GET("", userHandler.GetAll)
        users.GET("/:id", userHandler.GetByID)
    }
    
    // Create user (require specific permission)
    users.POST("", 
        middleware.RequirePermission("users.create"),
        userHandler.Create,
    )
    
    // Update user (require permission)
    users.PATCH("/:id",
        middleware.RequirePermission("users.update"),
        userHandler.Update,
    )
    
    // Delete user (require permission)
    users.DELETE("/:id",
        middleware.RequirePermission("users.delete"),
        userHandler.Delete,
    )
}

// Tenant-specific routes
tenantProtected := protected.Group("/tenants/:tenant_id")
tenantProtected.Use(middleware.RequireTenantAccess())
{
    // Tenant members
    tenantProtected.GET("/members", tenantMemberHandler.ListMembersByTenant)
}
```

---

## 🎯 Phase 4: Frontend Integration (Week 9-10)

### 4.1 Frontend API Client

#### Create TypeScript SDK
```typescript
// /frontend/src/lib/api/client.ts
import axios, { AxiosInstance } from 'axios';

class APIClient {
  private client: AxiosInstance;
  
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Request interceptor (add auth token)
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Response interceptor (handle errors)
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Refresh token logic
          await this.refreshToken();
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }
  
  // Auth methods
  async login(email: string, password: string) { ... }
  async register(data: RegisterRequest) { ... }
  async logout() { ... }
  
  // User methods
  users = {
    getAll: (params?) => this.client.get('/users', { params }),
    getById: (id: string) => this.client.get(`/users/${id}`),
    create: (data) => this.client.post('/users', data),
    update: (id: string, data) => this.client.patch(`/users/${id}`, data),
    delete: (id: string) => this.client.delete(`/users/${id}`),
  };
  
  // Tenant methods
  tenants = { ... };
  
  // ... other resources
}

export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
);
```

#### Generate TypeScript Types from OpenAPI
```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript /golang-backend/api/openapi/openapi.yaml \
  -o /frontend/src/types/api.ts
```

### 4.2 Frontend Pages Integration

**Update existing pages to use Golang backend:**

1. **Login Page** (`/app/login/page.tsx`)
   - Call `POST /api/v1/auth/login`
   - Store JWT token
   - Redirect to dashboard

2. **Users Management** (`/app/users/page.tsx`)
   - Call `GET /api/v1/users`
   - Implement filtering, pagination, sorting

3. **Tenants Management** (`/app/tenants/page.tsx`)
   - Call `GET /api/v1/tenants`

4. **Applications Management** (`/app/applications/page.tsx`)
   - Call `GET /api/v1/applications`

5. **Products Management** (`/app/products/page.tsx`)
   - Call `GET /api/v1/products`

6. **Orders Management** (`/app/orders/page.tsx`)
   - Call `GET /api/v1/orders`

7. **Invoices Management** (`/app/invoices/page.tsx`)
   - Call `GET /api/v1/invoices`

8. **Subscriptions Management** (`/app/subscriptions/page.tsx`)
   - Call `GET /api/v1/tenant-subscriptions`

### 4.3 React Query Integration

```typescript
// /frontend/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => apiClient.users.getAll(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.users.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      apiClient.users.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

---

## 🎯 Phase 5: Testing & Quality Assurance (Week 11-12)

### 5.1 Unit Tests

**Test Coverage Goals:**
- Services: 80%+
- Repositories: 70%+
- Handlers: 60%+

```go
// Example: /internal/service/user_service_test.go
package service_test

import (
    "context"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/vhv-platform/backend/internal/service"
    "github.com/vhv-platform/backend/internal/repository/mocks"
)

func TestUserService_GetByID(t *testing.T) {
    mockRepo := new(mocks.UserRepository)
    service := service.NewUserService(mockRepo)
    
    // Setup
    ctx := context.Background()
    userID := "123e4567-e89b-12d3-a456-426614174000"
    expectedUser := &models.User{ID: userID, Email: "test@example.com"}
    
    mockRepo.On("GetByID", ctx, userID).Return(expectedUser, nil)
    
    // Execute
    user, err := service.GetByID(ctx, userID)
    
    // Assert
    assert.NoError(t, err)
    assert.Equal(t, expectedUser, user)
    mockRepo.AssertExpectations(t)
}
```

### 5.2 Integration Tests

```go
// /tests/integration/user_api_test.go
func TestUserAPI_CreateUser(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer db.Close()
    
    // Setup test server
    router := setupTestRouter(db)
    
    // Create request
    reqBody := `{"email":"test@example.com","full_name":"Test User"}`
    req := httptest.NewRequest("POST", "/api/v1/users", strings.NewReader(reqBody))
    req.Header.Set("Content-Type", "application/json")
    
    // Execute
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    // Assert
    assert.Equal(t, 201, w.Code)
    
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.True(t, response["success"].(bool))
    assert.NotNil(t, response["data"])
}
```

### 5.3 End-to-End Tests

**Use Postman/Newman for E2E testing:**
```bash
# Run Postman collection tests
newman run postman/VHV_Platform.postman_collection.json \
  -e postman/VHV_Platform_Environments.json \
  --reporters cli,json
```

### 5.4 Load Testing

**Use k6 for load testing:**
```javascript
// /tests/load/user_api_load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
};

export default function () {
  const res = http.get('http://localhost:8080/api/v1/users');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## 🎯 Phase 6: Performance Optimization (Week 13-14)

### 6.1 Database Optimization

**Add indexes for frequently queried fields:**
```sql
-- /golang-backend/migrations/YYYYMMDDHHMMSS_add_performance_indexes.sql

-- Users table
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Tenants table
CREATE INDEX idx_tenants_code ON tenants(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;

-- User roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id) WHERE deleted_at IS NULL;

-- User sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id) WHERE is_active = true;
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Tenant subscriptions
CREATE INDEX idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status) WHERE deleted_at IS NULL;

-- Orders
CREATE INDEX idx_subscription_orders_tenant_id ON subscription_orders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_status ON subscription_orders(order_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_orders_number ON subscription_orders(order_number);

-- Invoices
CREATE INDEX idx_subscription_invoices_tenant_id ON subscription_invoices(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(invoice_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_invoices_number ON subscription_invoices(invoice_number);
```

### 6.2 Caching Strategy

**Implement Redis caching:**
```go
// /internal/cache/redis.go
type RedisCache struct {
    client *redis.Client
}

func (c *RedisCache) Get(ctx context.Context, key string) (string, error)
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
func (c *RedisCache) Delete(ctx context.Context, key string) error
```

**Cache frequently accessed data:**
- User profiles
- Tenant configurations
- Permissions & roles
- Feature flags
- Rate limit counters

### 6.3 Query Optimization

**Use prepared statements:**
```go
// Cache prepared statements
type UserRepository struct {
    db              *sql.DB
    stmtGetByID     *sql.Stmt
    stmtGetByEmail  *sql.Stmt
    stmtList        *sql.Stmt
}

func NewUserRepository(db *sql.DB) *UserRepository {
    repo := &UserRepository{db: db}
    
    // Prepare statements
    repo.stmtGetByID, _ = db.Prepare(`
        SELECT _id, email, full_name, ... 
        FROM users 
        WHERE _id = $1 AND deleted_at IS NULL
    `)
    
    return repo
}
```

**Implement connection pooling:**
```go
// /pkg/postgres/postgres.go
func NewPostgresDB(cfg config.DatabaseConfig) (*sql.DB, error) {
    db, err := sql.Open("postgres", cfg.DSN())
    if err != nil {
        return nil, err
    }
    
    // Connection pool settings
    db.SetMaxOpenConns(cfg.MaxOpenConns)      // 25
    db.SetMaxIdleConns(cfg.MaxIdleConns)      // 25
    db.SetConnMaxLifetime(cfg.ConnMaxLifetime) // 5 minutes
    
    return db, nil
}
```

---

## 🎯 Phase 7: Deployment & DevOps (Week 15-16)

### 7.1 Docker Configuration

**Create Dockerfile:**
```dockerfile
# /golang-backend/Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run
CMD ["./main"]
```

**Create docker-compose.yml:**
```yaml
# /golang-backend/docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=vhv_platform
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=vhv_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 7.2 CI/CD Pipeline

**GitHub Actions workflow:**
```yaml
# /.github/workflows/golang-backend.yml
name: Golang Backend CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'golang-backend/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'golang-backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Run tests
        run: |
          cd golang-backend
          go test -v -cover ./...
      
      - name: Run linter
        run: |
          cd golang-backend
          golangci-lint run

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          cd golang-backend
          docker build -t vhv-platform-api:${{ github.sha }} .
      
      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push vhv-platform-api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Deploy to your cloud provider (AWS, GCP, Azure, etc.)
          echo "Deploying to production..."
```

### 7.3 Monitoring & Logging

**Prometheus metrics:**
```go
// /internal/middleware/metrics.go
var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "HTTP request duration in seconds",
        },
        []string{"method", "endpoint"},
    )
)

func MetricsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        c.Next()
        duration := time.Since(start).Seconds()
        
        httpRequestsTotal.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
            fmt.Sprintf("%d", c.Writer.Status()),
        ).Inc()
        
        httpRequestDuration.WithLabelValues(
            c.Request.Method,
            c.FullPath(),
        ).Observe(duration)
    }
}
```

---

## 📋 Checklist Tổng Hợp

### Phase 1: Documentation (Week 1-2)
- [ ] Setup OpenAPI structure
- [ ] Generate OpenAPI specs for all APIs
- [ ] Integrate Swagger UI
- [ ] Create API documentation
- [ ] Export Postman collection

### Phase 2: Missing APIs (Week 3-6)
- [ ] Review all 67 tables
- [ ] Implement missing APIs (if any)
- [ ] KV Store API (optional)

### Phase 3: Auth & RBAC (Week 7-8)
- [ ] Implement authentication service
- [ ] Implement JWT middleware
- [ ] Implement RBAC middleware
- [ ] Add protected routes
- [ ] Test auth flow

### Phase 4: Frontend Integration (Week 9-10)
- [ ] Create TypeScript API client
- [ ] Generate TypeScript types from OpenAPI
- [ ] Update all frontend pages to use Golang backend
- [ ] Implement React Query hooks
- [ ] Test frontend-backend integration

### Phase 5: Testing (Week 11-12)
- [ ] Write unit tests (80% coverage)
- [ ] Write integration tests
- [ ] Create E2E test suite (Postman)
- [ ] Run load tests (k6)

### Phase 6: Performance (Week 13-14)
- [ ] Add database indexes
- [ ] Implement Redis caching
- [ ] Optimize queries
- [ ] Connection pooling
- [ ] Benchmark & profiling

### Phase 7: Deployment (Week 15-16)
- [ ] Create Dockerfile
- [ ] Setup docker-compose
- [ ] Create CI/CD pipeline
- [ ] Setup monitoring (Prometheus/Grafana)
- [ ] Setup logging (ELK stack)
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 🎯 Success Metrics

### Code Quality
- [ ] Test coverage ≥ 80%
- [ ] No critical security vulnerabilities
- [ ] All linters pass
- [ ] Documentation coverage 100%

### Performance
- [ ] API response time < 200ms (p95)
- [ ] Database query time < 50ms (p95)
- [ ] Handle 1000 req/s without degradation
- [ ] Memory usage < 512MB under normal load

### Reliability
- [ ] Uptime ≥ 99.9%
- [ ] Zero data loss
- [ ] All endpoints return proper error codes
- [ ] Graceful degradation under load

---

## 📚 Documentation Structure

```
/golang-backend/docs/
├── README.md                          # Overview
├── ARCHITECTURE.md                    # Architecture decisions
├── API_REFERENCE.md                   # Complete API reference
├── AUTHENTICATION.md                  # Auth guide
├── DEPLOYMENT.md                      # Deployment guide
├── DEVELOPMENT.md                     # Development setup
├── TESTING.md                         # Testing guide
├── PERFORMANCE.md                     # Performance tuning
└── TROUBLESHOOTING.md                 # Common issues & solutions
```

---

## 🚀 Timeline Summary

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| 1. Documentation | 2 weeks | 40h | 🔴 Critical |
| 2. Missing APIs | 4 weeks | 80h | 🟡 Medium |
| 3. Auth & RBAC | 2 weeks | 60h | 🔴 Critical |
| 4. Frontend Integration | 2 weeks | 50h | 🔴 Critical |
| 5. Testing | 2 weeks | 60h | 🔴 High |
| 6. Performance | 2 weeks | 40h | 🟡 Medium |
| 7. Deployment | 2 weeks | 40h | 🔴 High |
| **Total** | **16 weeks** | **370h** | |

---

## 👥 Team Assignments (Suggestion)

### Backend Team
- **Lead Developer:** Overall architecture, code review
- **Developer 1:** Authentication & Authorization (Phase 3)
- **Developer 2:** Missing APIs & Documentation (Phase 1-2)
- **Developer 3:** Performance & Testing (Phase 5-6)

### DevOps Team
- **DevOps Engineer:** CI/CD, deployment, monitoring (Phase 7)

### Frontend Team
- **Frontend Developer 1:** TypeScript SDK & API client (Phase 4)
- **Frontend Developer 2:** Page integration & React Query (Phase 4)

---

## 📞 Support & Resources

- **API Documentation:** `/api/docs`
- **Swagger UI:** `http://localhost:8080/api/docs`
- **GitHub Repository:** `github.com/vhv-platform/backend`
- **Slack Channel:** `#backend-dev`
- **Issue Tracker:** GitHub Issues

---

**Last Updated:** January 22, 2026  
**Next Review:** February 5, 2026

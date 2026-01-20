# Kế hoạch Triển khai Golang API Backend

## 📋 Tổng quan

Tài liệu này mô tả kế hoạch chi tiết để:
1. **Gộp** thư mục `/golang-api` vào `/golang-backend`
2. **Triển khai** Golang API backend hoàn chỉnh
3. **Migration** từ Supabase sang Golang API

---

## 🎯 Mục tiêu

### 1. Gộp Code (Hoàn thành ngay)
- ✅ Di chuyển tất cả handlers từ `/golang-api/handlers/` sang `/golang-backend/handlers/`
- ✅ Di chuyển docs từ `/golang-api/*.md` sang `/golang-backend/docs/migration/`
- ✅ Tổ chức lại cấu trúc thư mục chuẩn Golang project

### 2. Cấu trúc Backend (Tuần 1-2)
- Thiết lập project structure theo best practices
- Cấu hình environment và database connection
- Implement middleware (CORS, auth, logging, rate limiting)
- Setup routing và API versioning

### 3. Implementation (Tuần 3-6)
- Implement models (structs) cho tất cả tables
- Implement repository layer (database operations)
- Implement service layer (business logic)
- Implement handlers (API endpoints)
- Add validation và error handling

### 4. Testing & Migration (Tuần 7-8)
- Unit tests cho services
- Integration tests cho API endpoints
- Migration script từ Supabase
- Performance testing

---

## 📁 Cấu trúc Thư mục Mới

```
golang-backend/
├── cmd/
│   └── api/
│       └── main.go                 # Entry point
├── internal/
│   ├── config/
│   │   ├── config.go              # Configuration management
│   │   └── database.go            # Database config
│   ├── models/
│   │   ├── tenant.go              # Tenant model
│   │   ├── user.go                # User model
│   │   ├── role.go                # Role model
│   │   ├── application.go         # Application model
│   │   ├── product.go             # Product model
│   │   ├── subscription.go        # Subscription model
│   │   ├── order.go               # Order model
│   │   ├── invoice.go             # Invoice model
│   │   ├── webhook.go             # Webhook model
│   │   ├── announcement.go        # Announcement model
│   │   └── ...                    # Other models
│   ├── repository/
│   │   ├── tenant_repository.go   # Tenant DB operations
│   │   ├── user_repository.go     # User DB operations
│   │   ├── role_repository.go     # Role DB operations
│   │   └── ...                    # Other repositories
│   ├── service/
│   │   ├── tenant_service.go      # Tenant business logic
│   │   ├── user_service.go        # User business logic
│   │   ├── role_service.go        # Role business logic
│   │   └── ...                    # Other services
│   ├── handler/
│   │   ├── tenant_handler.go      # Tenant API endpoints
│   │   ├── user_handler.go        # User API endpoints
│   │   ├── role_handler.go        # Role API endpoints
│   │   └── ...                    # Other handlers
│   ├── middleware/
│   │   ├── auth.go                # Authentication middleware
│   │   ├── cors.go                # CORS middleware
│   │   ├── logger.go              # Logging middleware
│   │   ├── rate_limit.go          # Rate limiting
│   │   └── recovery.go            # Panic recovery
│   ├── validator/
│   │   ├── tenant_validator.go    # Tenant validation rules
│   │   ├── user_validator.go      # User validation rules
│   │   └── ...                    # Other validators
│   └── utils/
│       ├── response.go            # Standard API responses
│       ├── error.go               # Error handling
│       └── pagination.go          # Pagination helpers
├── pkg/
│   ├── postgres/
│   │   └── postgres.go            # PostgreSQL client
│   ├── logger/
│   │   └── logger.go              # Logger implementation
│   └── httputil/
│       └── httputil.go            # HTTP utilities
├── migrations/
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_roles.sql
│   └── ...
├── api/
│   └── openapi.yaml               # OpenAPI/Swagger spec
├── docs/
│   ├── API_DOCUMENTATION.md       # API documentation
│   ├── SETUP.md                   # Setup guide
│   ├── MIGRATION.md               # Migration guide
│   └── migration/                 # Docs from golang-api
│       ├── TENANTS_SETUP.md
│       ├── TENANT_DETAILS_SETUP.md
│       └── USER_ROLES_SETUP.md
├── scripts/
│   ├── migrate.sh                 # Run migrations
│   ├── seed.sh                    # Seed data
│   └── test.sh                    # Run tests
├── test/
│   ├── integration/
│   └── unit/
├── .env.example
├── .gitignore
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## 🔧 Chi tiết Triển khai

### Phase 1: Setup Project (Ngay lập tức)

#### 1.1. Gộp golang-api vào golang-backend
```bash
# Di chuyển handlers
mkdir -p /golang-backend/internal/handler/legacy
cp /golang-api/handlers/* /golang-backend/internal/handler/legacy/

# Di chuyển docs
mkdir -p /golang-backend/docs/migration
cp /golang-api/*.md /golang-backend/docs/migration/
```

#### 1.2. Initialize Go Module
```bash
cd golang-backend
go mod init github.com/yourusername/vhv-platform-backend
```

#### 1.3. Install Dependencies
```go
// go.mod
require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
    github.com/golang-migrate/migrate/v4 v4.16.2
    github.com/joho/godotenv v1.5.1
    github.com/go-playground/validator/v10 v10.15.5
    github.com/golang-jwt/jwt/v5 v5.1.0
    github.com/redis/go-redis/v9 v9.3.0
    go.uber.org/zap v1.26.0
)
```

### Phase 2: Core Infrastructure (Tuần 1)

#### 2.1. Configuration Management
```go
// internal/config/config.go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    JWT      JWTConfig
}

type ServerConfig struct {
    Port         string
    Environment  string
    ReadTimeout  time.Duration
    WriteTimeout time.Duration
}

type DatabaseConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
    SSLMode  string
}
```

#### 2.2. Database Connection
```go
// pkg/postgres/postgres.go
func NewPostgresDB(cfg DatabaseConfig) (*sql.DB, error) {
    dsn := fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
    )
    
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, err
    }
    
    // Configure connection pool
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(25)
    db.SetConnMaxLifetime(5 * time.Minute)
    
    return db, nil
}
```

#### 2.3. Router Setup
```go
// cmd/api/main.go
func main() {
    // Load config
    cfg := config.Load()
    
    // Initialize database
    db, err := postgres.NewPostgresDB(cfg.Database)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()
    
    // Initialize router
    router := gin.Default()
    
    // Middleware
    router.Use(middleware.CORS())
    router.Use(middleware.Logger())
    router.Use(middleware.Recovery())
    
    // API v1
    v1 := router.Group("/api/v1")
    {
        // Health check
        v1.GET("/health", healthHandler)
        
        // Tenants
        tenants := v1.Group("/tenants")
        tenants.Use(middleware.Auth())
        {
            tenants.GET("", tenantHandler.GetAll)
            tenants.GET("/:id", tenantHandler.GetByID)
            tenants.POST("", tenantHandler.Create)
            tenants.PATCH("/:id", tenantHandler.Update)
            tenants.DELETE("/:id", tenantHandler.Delete)
        }
        
        // Users
        users := v1.Group("/users")
        users.Use(middleware.Auth())
        {
            users.GET("", userHandler.GetAll)
            users.GET("/:id", userHandler.GetByID)
            users.POST("", userHandler.Create)
            users.PATCH("/:id", userHandler.Update)
            users.DELETE("/:id", userHandler.Delete)
        }
        
        // Roles
        roles := v1.Group("/roles")
        roles.Use(middleware.Auth())
        {
            roles.GET("", roleHandler.GetAll)
            roles.GET("/:id", roleHandler.GetByID)
            roles.POST("", roleHandler.Create)
            roles.PATCH("/:id", roleHandler.Update)
            roles.DELETE("/:id", roleHandler.Delete)
        }
        
        // ... other routes
    }
    
    // Start server
    router.Run(cfg.Server.Port)
}
```

### Phase 3: Models Implementation (Tuần 2)

#### 3.1. Base Model
```go
// internal/models/base.go
type BaseModel struct {
    ID        string     `json:"_id" db:"_id"`
    CreatedAt time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
    Version   int64      `json:"version" db:"version"`
}
```

#### 3.2. Tenant Model
```go
// internal/models/tenant.go
type Tenant struct {
    BaseModel
    Code              string                 `json:"code" db:"code" validate:"required"`
    Name              string                 `json:"name" db:"name" validate:"required"`
    ParentTenantID    *string                `json:"parent_tenant_id,omitempty" db:"parent_tenant_id"`
    Path              *string                `json:"path,omitempty" db:"path"`
    Tier              string                 `json:"tier" db:"tier" validate:"required,oneof=FREE PRO ENTERPRISE"`
    Status            string                 `json:"status" db:"status" validate:"required,oneof=TRIAL ACTIVE SUSPENDED CANCELLED"`
    DataRegion        string                 `json:"data_region" db:"data_region"`
    ComplianceLevel   string                 `json:"compliance_level" db:"compliance_level"`
    Timezone          string                 `json:"timezone" db:"timezone"`
    BillingType       string                 `json:"billing_type" db:"billing_type"`
    Profile           map[string]interface{} `json:"profile" db:"profile"`
    Settings          map[string]interface{} `json:"settings" db:"settings"`
    CreatedBy         *string                `json:"created_by,omitempty" db:"created_by"`
    UpdatedBy         *string                `json:"updated_by,omitempty" db:"updated_by"`
    DeletedBy         *string                `json:"deleted_by,omitempty" db:"deleted_by"`
    PartnerTenantID   *string                `json:"partner_tenant_id,omitempty" db:"partner_tenant_id"`
}
```

#### 3.3. User Model
```go
// internal/models/user.go
type User struct {
    BaseModel
    Email           string                 `json:"email" db:"email" validate:"required,email"`
    PhoneNumber     *string                `json:"phone_number,omitempty" db:"phone_number"`
    FullName        string                 `json:"full_name" db:"full_name" validate:"required"`
    AvatarURL       *string                `json:"avatar_url,omitempty" db:"avatar_url"`
    Status          string                 `json:"status" db:"status" validate:"required"`
    IsSupportStaff  bool                   `json:"is_support_staff" db:"is_support_staff"`
    MFAEnabled      bool                   `json:"mfa_enabled" db:"mfa_enabled"`
    Locale          string                 `json:"locale" db:"locale"`
    Metadata        map[string]interface{} `json:"metadata" db:"metadata"`
    CreatedBy       *string                `json:"created_by,omitempty" db:"created_by"`
    UpdatedBy       *string                `json:"updated_by,omitempty" db:"updated_by"`
}
```

#### 3.4. Role Model
```go
// internal/models/role.go
type Role struct {
    BaseModel
    TenantID        string   `json:"tenant_id" db:"tenant_id" validate:"required"`
    Name            string   `json:"name" db:"name" validate:"required"`
    Description     *string  `json:"description,omitempty" db:"description"`
    Type            string   `json:"type" db:"type" validate:"required,oneof=SYSTEM CUSTOM"`
    PermissionCodes []string `json:"permission_codes" db:"permission_codes"`
}
```

### Phase 4: Repository Layer (Tuần 3)

#### 4.1. Base Repository Interface
```go
// internal/repository/repository.go
type Repository[T any] interface {
    GetAll(ctx context.Context, filters map[string]interface{}) ([]T, error)
    GetByID(ctx context.Context, id string) (*T, error)
    Create(ctx context.Context, entity *T) error
    Update(ctx context.Context, id string, entity *T) error
    Delete(ctx context.Context, id string) error
}
```

#### 4.2. Tenant Repository
```go
// internal/repository/tenant_repository.go
type TenantRepository struct {
    db *sql.DB
}

func NewTenantRepository(db *sql.DB) *TenantRepository {
    return &TenantRepository{db: db}
}

func (r *TenantRepository) GetAll(ctx context.Context, filters map[string]interface{}) ([]models.Tenant, error) {
    query := `
        SELECT _id, code, name, parent_tenant_id, path, tier, status, 
               data_region, compliance_level, timezone, billing_type,
               profile, settings, created_at, updated_at, version
        FROM tenants
        WHERE deleted_at IS NULL
    `
    
    // Apply filters
    var args []interface{}
    argIndex := 1
    
    if status, ok := filters["status"].(string); ok && status != "" {
        query += fmt.Sprintf(" AND status = $%d", argIndex)
        args = append(args, status)
        argIndex++
    }
    
    if tier, ok := filters["tier"].(string); ok && tier != "" {
        query += fmt.Sprintf(" AND tier = $%d", argIndex)
        args = append(args, tier)
        argIndex++
    }
    
    query += " ORDER BY created_at DESC"
    
    rows, err := r.db.QueryContext(ctx, query, args...)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var tenants []models.Tenant
    for rows.Next() {
        var t models.Tenant
        err := rows.Scan(
            &t.ID, &t.Code, &t.Name, &t.ParentTenantID, &t.Path,
            &t.Tier, &t.Status, &t.DataRegion, &t.ComplianceLevel,
            &t.Timezone, &t.BillingType, &t.Profile, &t.Settings,
            &t.CreatedAt, &t.UpdatedAt, &t.Version,
        )
        if err != nil {
            return nil, err
        }
        tenants = append(tenants, t)
    }
    
    return tenants, nil
}

func (r *TenantRepository) GetByID(ctx context.Context, id string) (*models.Tenant, error) {
    query := `
        SELECT _id, code, name, parent_tenant_id, path, tier, status,
               data_region, compliance_level, timezone, billing_type,
               profile, settings, created_at, updated_at, version
        FROM tenants
        WHERE _id = $1 AND deleted_at IS NULL
    `
    
    var t models.Tenant
    err := r.db.QueryRowContext(ctx, query, id).Scan(
        &t.ID, &t.Code, &t.Name, &t.ParentTenantID, &t.Path,
        &t.Tier, &t.Status, &t.DataRegion, &t.ComplianceLevel,
        &t.Timezone, &t.BillingType, &t.Profile, &t.Settings,
        &t.CreatedAt, &t.UpdatedAt, &t.Version,
    )
    
    if err == sql.ErrNoRows {
        return nil, fmt.Errorf("tenant not found")
    }
    if err != nil {
        return nil, err
    }
    
    return &t, nil
}

func (r *TenantRepository) Create(ctx context.Context, tenant *models.Tenant) error {
    query := `
        INSERT INTO tenants (
            code, name, parent_tenant_id, tier, status,
            data_region, compliance_level, timezone, billing_type,
            profile, settings
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING _id, created_at, updated_at, version
    `
    
    return r.db.QueryRowContext(
        ctx, query,
        tenant.Code, tenant.Name, tenant.ParentTenantID,
        tenant.Tier, tenant.Status, tenant.DataRegion,
        tenant.ComplianceLevel, tenant.Timezone, tenant.BillingType,
        tenant.Profile, tenant.Settings,
    ).Scan(&tenant.ID, &tenant.CreatedAt, &tenant.UpdatedAt, &tenant.Version)
}

func (r *TenantRepository) Update(ctx context.Context, id string, tenant *models.Tenant) error {
    query := `
        UPDATE tenants
        SET name = $1, tier = $2, status = $3, settings = $4,
            updated_at = NOW(), version = version + 1
        WHERE _id = $5 AND deleted_at IS NULL
        RETURNING updated_at, version
    `
    
    return r.db.QueryRowContext(
        ctx, query,
        tenant.Name, tenant.Tier, tenant.Status, tenant.Settings, id,
    ).Scan(&tenant.UpdatedAt, &tenant.Version)
}

func (r *TenantRepository) Delete(ctx context.Context, id string) error {
    query := `
        UPDATE tenants
        SET deleted_at = NOW()
        WHERE _id = $1 AND deleted_at IS NULL
    `
    
    _, err := r.db.ExecContext(ctx, query, id)
    return err
}
```

### Phase 5: Service Layer (Tuần 4)

#### 5.1. Tenant Service
```go
// internal/service/tenant_service.go
type TenantService struct {
    repo *repository.TenantRepository
}

func NewTenantService(repo *repository.TenantRepository) *TenantService {
    return &TenantService{repo: repo}
}

func (s *TenantService) GetAll(ctx context.Context, filters map[string]interface{}) ([]models.Tenant, error) {
    return s.repo.GetAll(ctx, filters)
}

func (s *TenantService) GetByID(ctx context.Context, id string) (*models.Tenant, error) {
    // Validate UUID
    if !isValidUUID(id) {
        return nil, fmt.Errorf("invalid tenant ID")
    }
    
    return s.repo.GetByID(ctx, id)
}

func (s *TenantService) Create(ctx context.Context, tenant *models.Tenant) error {
    // Validate tenant
    if err := s.validateTenant(tenant); err != nil {
        return err
    }
    
    // Check if code already exists
    existing, _ := s.repo.GetByCode(ctx, tenant.Code)
    if existing != nil {
        return fmt.Errorf("tenant code already exists")
    }
    
    return s.repo.Create(ctx, tenant)
}

func (s *TenantService) Update(ctx context.Context, id string, tenant *models.Tenant) error {
    // Validate
    if !isValidUUID(id) {
        return fmt.Errorf("invalid tenant ID")
    }
    
    if err := s.validateTenant(tenant); err != nil {
        return err
    }
    
    return s.repo.Update(ctx, id, tenant)
}

func (s *TenantService) Delete(ctx context.Context, id string) error {
    // Validate
    if !isValidUUID(id) {
        return fmt.Errorf("invalid tenant ID")
    }
    
    // Check if tenant has children
    children, _ := s.repo.GetChildren(ctx, id)
    if len(children) > 0 {
        return fmt.Errorf("cannot delete tenant with children")
    }
    
    return s.repo.Delete(ctx, id)
}

func (s *TenantService) validateTenant(tenant *models.Tenant) error {
    if tenant.Code == "" {
        return fmt.Errorf("tenant code is required")
    }
    if tenant.Name == "" {
        return fmt.Errorf("tenant name is required")
    }
    // Add more validation...
    return nil
}
```

### Phase 6: Handler Layer (Tuần 5)

#### 6.1. Standard Response
```go
// internal/utils/response.go
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   *ErrorInfo  `json:"error,omitempty"`
    Meta    *MetaInfo   `json:"meta,omitempty"`
}

type ErrorInfo struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}

type MetaInfo struct {
    Page       int `json:"page"`
    PageSize   int `json:"page_size"`
    TotalPages int `json:"total_pages"`
    TotalCount int `json:"total_count"`
}

func SuccessResponse(c *gin.Context, statusCode int, data interface{}) {
    c.JSON(statusCode, Response{
        Success: true,
        Data:    data,
    })
}

func ErrorResponse(c *gin.Context, statusCode int, code, message string) {
    c.JSON(statusCode, Response{
        Success: false,
        Error: &ErrorInfo{
            Code:    code,
            Message: message,
        },
    })
}
```

#### 6.2. Tenant Handler
```go
// internal/handler/tenant_handler.go
type TenantHandler struct {
    service *service.TenantService
}

func NewTenantHandler(service *service.TenantService) *TenantHandler {
    return &TenantHandler{service: service}
}

func (h *TenantHandler) GetAll(c *gin.Context) {
    // Get filters from query params
    filters := make(map[string]interface{})
    
    if status := c.Query("status"); status != "" {
        filters["status"] = status
    }
    if tier := c.Query("tier"); tier != "" {
        filters["tier"] = tier
    }
    
    tenants, err := h.service.GetAll(c.Request.Context(), filters)
    if err != nil {
        utils.ErrorResponse(c, 500, "INTERNAL_ERROR", err.Error())
        return
    }
    
    utils.SuccessResponse(c, 200, tenants)
}

func (h *TenantHandler) GetByID(c *gin.Context) {
    id := c.Param("id")
    
    tenant, err := h.service.GetByID(c.Request.Context(), id)
    if err != nil {
        if err.Error() == "tenant not found" {
            utils.ErrorResponse(c, 404, "NOT_FOUND", "Tenant not found")
            return
        }
        utils.ErrorResponse(c, 500, "INTERNAL_ERROR", err.Error())
        return
    }
    
    utils.SuccessResponse(c, 200, tenant)
}

func (h *TenantHandler) Create(c *gin.Context) {
    var tenant models.Tenant
    
    if err := c.ShouldBindJSON(&tenant); err != nil {
        utils.ErrorResponse(c, 400, "VALIDATION_ERROR", err.Error())
        return
    }
    
    if err := h.service.Create(c.Request.Context(), &tenant); err != nil {
        utils.ErrorResponse(c, 400, "CREATE_ERROR", err.Error())
        return
    }
    
    utils.SuccessResponse(c, 201, tenant)
}

func (h *TenantHandler) Update(c *gin.Context) {
    id := c.Param("id")
    
    var tenant models.Tenant
    if err := c.ShouldBindJSON(&tenant); err != nil {
        utils.ErrorResponse(c, 400, "VALIDATION_ERROR", err.Error())
        return
    }
    
    if err := h.service.Update(c.Request.Context(), id, &tenant); err != nil {
        utils.ErrorResponse(c, 400, "UPDATE_ERROR", err.Error())
        return
    }
    
    utils.SuccessResponse(c, 200, tenant)
}

func (h *TenantHandler) Delete(c *gin.Context) {
    id := c.Param("id")
    
    if err := h.service.Delete(c.Request.Context(), id); err != nil {
        utils.ErrorResponse(c, 400, "DELETE_ERROR", err.Error())
        return
    }
    
    utils.SuccessResponse(c, 204, nil)
}
```

---

## 📊 Thứ tự Ưu tiên Triển khai API

### Tier 1: Core APIs (Tuần 3-4)
1. **Tenants API** - Quản lý tenant
2. **Users API** - Quản lý người dùng
3. **Roles API** - Quản lý vai trò
4. **Permissions API** - Quản lý quyền

### Tier 2: Platform APIs (Tuần 5-6)
5. **Applications API** - Quản lý ứng dụng
6. **Products API** - Quản lý sản phẩm
7. **Packages API** - Quản lý gói
8. **Orders API** - Quản lý đơn hàng
9. **Invoices API** - Quản lý hóa đơn

### Tier 3: Advanced APIs (Tuần 7-8)
10. **Subscriptions API** - Quản lý đăng ký
11. **Webhooks API** - Quản lý webhook
12. **Announcements API** - Quản lý thông báo
13. **Audit Logs API** - Nhật ký kiểm toán
14. **Dashboard API** - Dashboard statistics

---

## 🔄 Migration Strategy

### 1. Dual-Stack Approach (Recommended)
```
Frontend ──┬──> Supabase (Current)
           └──> Golang API (New)
```

- Implement Golang API song song với Supabase
- Frontend có thể switch giữa 2 backends via config
- Migrate từng module một (feature flags)

### 2. Migration Steps per API

#### Step 1: Implement Golang API
- Models, Repository, Service, Handler
- Unit tests
- Integration tests

#### Step 2: Add Feature Flag
```typescript
// api/config.ts
const USE_GOLANG_API = {
  tenants: process.env.NEXT_PUBLIC_USE_GOLANG_TENANTS === 'true',
  users: process.env.NEXT_PUBLIC_USE_GOLANG_USERS === 'true',
  roles: process.env.NEXT_PUBLIC_USE_GOLANG_ROLES === 'true',
};
```

#### Step 3: Update Adapter
```typescript
// api/adapters/index.ts
export function createAdapter<T>(table: string, endpoint: string) {
  const useGolang = USE_GOLANG_API[table as keyof typeof USE_GOLANG_API];
  
  if (useGolang) {
    return createHttpAdapter<T>(endpoint);  // Golang API
  }
  
  return createSupabaseAdapter<T>(table);   // Supabase
}
```

#### Step 4: Test & Validate
- Test with Golang API enabled
- Compare responses with Supabase
- Performance testing

#### Step 5: Gradual Rollout
- Enable for 10% users
- Monitor errors & performance
- Increase to 50%, then 100%

---

## 📝 Environment Variables

```env
# Server
PORT=8080
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=vhv_platform
DB_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=1m
```

---

## 🧪 Testing Strategy

### Unit Tests
```go
func TestTenantService_Create(t *testing.T) {
    // Mock repository
    mockRepo := &MockTenantRepository{}
    service := NewTenantService(mockRepo)
    
    // Test data
    tenant := &models.Tenant{
        Code: "test-tenant",
        Name: "Test Tenant",
        Tier: "FREE",
        Status: "TRIAL",
    }
    
    // Execute
    err := service.Create(context.Background(), tenant)
    
    // Assert
    assert.NoError(t, err)
    assert.NotEmpty(t, tenant.ID)
}
```

### Integration Tests
```go
func TestTenantAPI_GetAll(t *testing.T) {
    // Setup test server
    router := setupTestRouter()
    
    // Make request
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/api/v1/tenants", nil)
    router.ServeHTTP(w, req)
    
    // Assert
    assert.Equal(t, 200, w.Code)
    
    var response Response
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.True(t, response.Success)
}
```

---

## 📈 Performance Targets

- **Response Time**: < 100ms (p95)
- **Throughput**: > 1000 req/s
- **Database Queries**: < 5ms (p95)
- **Memory Usage**: < 500MB
- **CPU Usage**: < 50%

---

## 🚀 Deployment

### Docker
```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vhv-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vhv-api
  template:
    metadata:
      labels:
        app: vhv-api
    spec:
      containers:
      - name: api
        image: vhv-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
```

---

## ✅ Checklist

### Phase 1: Setup (Hoàn thành ngay)
- [ ] Gộp golang-api vào golang-backend
- [ ] Initialize Go module
- [ ] Setup project structure
- [ ] Install dependencies

### Phase 2: Infrastructure (Tuần 1)
- [ ] Configuration management
- [ ] Database connection pool
- [ ] Logging setup
- [ ] Middleware implementation
- [ ] Router setup

### Phase 3: Core Implementation (Tuần 2-6)
- [ ] Models for all tables
- [ ] Repository layer
- [ ] Service layer
- [ ] Handler layer
- [ ] Validation

### Phase 4: Testing (Tuần 7)
- [ ] Unit tests (80% coverage)
- [ ] Integration tests
- [ ] Load testing
- [ ] Security testing

### Phase 5: Migration (Tuần 8)
- [ ] Feature flags
- [ ] Dual-stack deployment
- [ ] Data migration scripts
- [ ] Rollback plan
- [ ] Production deployment

---

## 📞 Support & Documentation

- **API Documentation**: `/golang-backend/docs/API_DOCUMENTATION.md`
- **Setup Guide**: `/golang-backend/docs/SETUP.md`
- **Migration Guide**: `/golang-backend/docs/MIGRATION.md`
- **OpenAPI Spec**: `/golang-backend/api/openapi.yaml`

---

**Tác giả**: VHV Platform Team  
**Ngày tạo**: 2026-01-20  
**Phiên bản**: 1.0.0

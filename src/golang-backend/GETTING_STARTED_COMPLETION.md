# 🚀 Hướng Dẫn Hoàn Thiện Golang Backend

**Mục tiêu:** Hoàn thiện 100% Golang backend để tích hợp hoàn hảo với frontend ReactJS

---

## 📋 Tổng Quan

Kế hoạch hoàn thiện backend được chia thành **7 phases** trong **16 tuần**:

| Phase | Tên | Thời gian | Ưu tiên |
|-------|-----|-----------|---------|
| 1 | API Documentation & OpenAPI Specs | 2 tuần | 🔴 Critical |
| 2 | Missing APIs Implementation | 4 tuần | 🟡 Medium |
| 3 | Authentication & Authorization | 2 tuần | 🔴 Critical |
| 4 | Frontend Integration | 2 tuần | 🔴 Critical |
| 5 | Testing & QA | 2 tuần | 🔴 High |
| 6 | Performance Optimization | 2 tuần | 🟡 Medium |
| 7 | Deployment & DevOps | 2 tuần | 🔴 High |

📖 **Chi tiết đầy đủ:** Xem file `/golang-backend/BACKEND_COMPLETION_PLAN.md`

---

## 🎯 Phase 1: API Documentation (HIỆN TẠI)

### ✅ Đã Hoàn Thành

1. **Kế hoạch tổng thể** (`/BACKEND_COMPLETION_PLAN.md`)
   - 7 phases chi tiết
   - Timeline 16 tuần
   - Resource allocation
   - Success metrics

2. **OpenAPI Infrastructure**
   - ✅ Root OpenAPI spec (`/api/openapi/openapi.yaml`)
   - ✅ Common schemas (`/components/schemas/common.yaml`)
   - ✅ Success responses (`/components/responses/success.yaml`)
   - ✅ Error responses (`/components/responses/errors.yaml`)

### 📝 Cần Làm Tiếp

#### 1.1 Tạo Schema Definitions

**Tạo file schemas cho các entities chính:**

```bash
/api/openapi/components/schemas/
├── user.yaml                 # User entity schema
├── tenant.yaml               # Tenant entity schema
├── role.yaml                 # Role entity schema
├── permission.yaml           # Permission entity schema
├── application.yaml          # Application entity schema
├── product.yaml              # Product entity schema
├── package.yaml              # Package entity schema
├── order.yaml                # Order entity schema
├── invoice.yaml              # Invoice entity schema
└── subscription.yaml         # Subscription entity schema
```

**Ví dụ: `/api/openapi/components/schemas/user.yaml`**
```yaml
User:
  allOf:
    - $ref: './common.yaml#/BaseModel'
    - type: object
      properties:
        email:
          type: string
          format: email
          description: User email address (unique)
          example: "user@example.com"
        full_name:
          type: string
          minLength: 1
          maxLength: 255
          description: User full name
          example: "Nguyen Van A"
        avatar_url:
          type: string
          format: uri
          nullable: true
          description: URL to user avatar image
          example: "https://example.com/avatars/user.jpg"
        phone_number:
          type: string
          nullable: true
          description: User phone number
          example: "+84901234567"
        status:
          $ref: './common.yaml#/UserStatus'
        is_support_staff:
          type: boolean
          description: Whether user is support staff
          example: false
        mfa_enabled:
          type: boolean
          description: Whether MFA is enabled
          example: false
        is_verified:
          type: boolean
          description: Whether email is verified
          example: true
        locale:
          $ref: './common.yaml#/Locale'
        metadata:
          $ref: './common.yaml#/Metadata'
      required:
        - email
        - full_name
        - status

CreateUserRequest:
  type: object
  properties:
    email:
      type: string
      format: email
      description: User email address
      example: "newuser@example.com"
    password:
      type: string
      format: password
      minLength: 8
      description: User password (min 8 characters)
      example: "SecurePass123!"
    full_name:
      type: string
      minLength: 1
      maxLength: 255
      description: User full name
      example: "Nguyen Van A"
    phone_number:
      type: string
      nullable: true
      description: User phone number
      example: "+84901234567"
    locale:
      $ref: './common.yaml#/Locale'
    metadata:
      $ref: './common.yaml#/Metadata'
  required:
    - email
    - password
    - full_name

UpdateUserRequest:
  type: object
  properties:
    full_name:
      type: string
      minLength: 1
      maxLength: 255
      description: User full name
    avatar_url:
      type: string
      format: uri
      nullable: true
    phone_number:
      type: string
      nullable: true
    status:
      $ref: './common.yaml#/UserStatus'
    is_support_staff:
      type: boolean
    is_verified:
      type: boolean
    locale:
      $ref: './common.yaml#/Locale'
    metadata:
      $ref: './common.yaml#/Metadata'
  minProperties: 1
```

#### 1.2 Tạo Path Definitions

**Tạo file paths cho các endpoints:**

```bash
/api/openapi/paths/
├── health.yaml               # Health check endpoint
├── auth.yaml                 # Authentication endpoints
├── users.yaml                # User endpoints
├── tenants.yaml              # Tenant endpoints
├── roles.yaml                # Role endpoints
├── permissions.yaml          # Permission endpoints
├── applications.yaml         # Application endpoints
├── products.yaml             # Product endpoints
├── packages.yaml             # Package endpoints
├── orders.yaml               # Order endpoints
└── invoices.yaml             # Invoice endpoints
```

**Ví dụ: `/api/openapi/paths/users.yaml`**
```yaml
/users:
  get:
    summary: List all users
    description: Retrieve a paginated list of users with optional filters
    tags:
      - Users
    security:
      - BearerAuth: []
    parameters:
      - $ref: '../components/parameters/pagination.yaml#/PageParam'
      - $ref: '../components/parameters/pagination.yaml#/LimitParam'
      - $ref: '../components/parameters/common.yaml#/SortByParam'
      - $ref: '../components/parameters/common.yaml#/SortOrderParam'
      - $ref: '../components/parameters/filters.yaml#/SearchParam'
      - name: status
        in: query
        schema:
          $ref: '../components/schemas/common.yaml#/UserStatus'
        description: Filter by user status
      - name: is_verified
        in: query
        schema:
          type: boolean
        description: Filter by email verification status
      - name: mfa_enabled
        in: query
        schema:
          type: boolean
        description: Filter by MFA enabled status
    responses:
      '200':
        description: Successful response
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  type: array
                  items:
                    $ref: '../components/schemas/user.yaml#/User'
                meta:
                  $ref: '../components/schemas/common.yaml#/PaginationMeta'
      '401':
        $ref: '../components/responses/errors.yaml#/UnauthorizedError'
      '403':
        $ref: '../components/responses/errors.yaml#/ForbiddenError'
      '500':
        $ref: '../components/responses/errors.yaml#/InternalServerError'
  
  post:
    summary: Create a new user
    description: Create a new user account
    tags:
      - Users
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '../components/schemas/user.yaml#/CreateUserRequest'
    responses:
      '201':
        description: User created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas/user.yaml#/User'
      '400':
        $ref: '../components/responses/errors.yaml#/ValidationError'
      '401':
        $ref: '../components/responses/errors.yaml#/UnauthorizedError'
      '403':
        $ref: '../components/responses/errors.yaml#/ForbiddenError'
      '409':
        $ref: '../components/responses/errors.yaml#/ConflictError'
      '500':
        $ref: '../components/responses/errors.yaml#/InternalServerError'

/users/{id}:
  get:
    summary: Get user by ID
    description: Retrieve a single user by their ID
    tags:
      - Users
    security:
      - BearerAuth: []
    parameters:
      - $ref: '../components/parameters/common.yaml#/IDParam'
    responses:
      '200':
        description: Successful response
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas/user.yaml#/User'
      '401':
        $ref: '../components/responses/errors.yaml#/UnauthorizedError'
      '403':
        $ref: '../components/responses/errors.yaml#/ForbiddenError'
      '404':
        $ref: '../components/responses/errors.yaml#/NotFoundError'
      '500':
        $ref: '../components/responses/errors.yaml#/InternalServerError'
  
  patch:
    summary: Update user
    description: Update user information
    tags:
      - Users
    security:
      - BearerAuth: []
    parameters:
      - $ref: '../components/parameters/common.yaml#/IDParam'
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '../components/schemas/user.yaml#/UpdateUserRequest'
    responses:
      '200':
        description: User updated successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                success:
                  type: boolean
                  example: true
                data:
                  $ref: '../components/schemas/user.yaml#/User'
      '400':
        $ref: '../components/responses/errors.yaml#/ValidationError'
      '401':
        $ref: '../components/responses/errors.yaml#/UnauthorizedError'
      '403':
        $ref: '../components/responses/errors.yaml#/ForbiddenError'
      '404':
        $ref: '../components/responses/errors.yaml#/NotFoundError'
      '500':
        $ref: '../components/responses/errors.yaml#/InternalServerError'
  
  delete:
    summary: Delete user
    description: Soft delete a user (sets deleted_at timestamp)
    tags:
      - Users
    security:
      - BearerAuth: []
    parameters:
      - $ref: '../components/parameters/common.yaml#/IDParam'
    responses:
      '204':
        $ref: '../components/responses/success.yaml#/NoContentResponse'
      '401':
        $ref: '../components/responses/errors.yaml#/UnauthorizedError'
      '403':
        $ref: '../components/responses/errors.yaml#/ForbiddenError'
      '404':
        $ref: '../components/responses/errors.yaml#/NotFoundError'
      '500':
        $ref: '../components/responses/errors.yaml#/InternalServerError'
```

#### 1.3 Tạo Parameter Definitions

```bash
/api/openapi/components/parameters/
├── common.yaml               # Common parameters (ID, sort)
├── pagination.yaml           # Pagination parameters
└── filters.yaml              # Filter parameters
```

#### 1.4 Setup Swagger UI

**Install Swagger UI static files:**

```bash
cd /golang-backend
mkdir -p api/swagger-ui

# Download Swagger UI dist
curl -L https://github.com/swagger-api/swagger-ui/archive/refs/tags/v5.10.0.tar.gz \
  -o swagger-ui.tar.gz

tar -xzf swagger-ui.tar.gz
cp -r swagger-ui-5.10.0/dist/* api/swagger-ui/
rm -rf swagger-ui-5.10.0 swagger-ui.tar.gz

# Update swagger-ui/index.html to point to openapi.yaml
sed -i 's|https://petstore.swagger.io/v2/swagger.json|/api/openapi/openapi.yaml|g' api/swagger-ui/index.html
```

**Add Swagger UI route in main.go:**

```go
// Serve Swagger UI
router.Static("/api/docs", "./api/swagger-ui")
router.StaticFile("/api/openapi/openapi.yaml", "./api/openapi/openapi.yaml")

// Serve all OpenAPI files
router.Static("/api/openapi", "./api/openapi")
```

---

## 🎯 Phase 3: Authentication (QUAN TRỌNG)

### Thiết Lập Authentication

#### 1. Tạo Auth Service

```go
// /internal/service/auth_service.go
package service

import (
    "context"
    "errors"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
)

type AuthService struct {
    userRepo    *repository.UserRepository
    sessionRepo *repository.UserSessionRepository
    jwtSecret   string
    tokenExpiry time.Duration
}

type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
}

type RegisterRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    FullName string `json:"full_name" validate:"required"`
}

type AuthResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int64  `json:"expires_in"`
    User         *models.User `json:"user"`
}

func NewAuthService(
    userRepo *repository.UserRepository,
    sessionRepo *repository.UserSessionRepository,
    jwtSecret string,
    tokenExpiry time.Duration,
) *AuthService {
    return &AuthService{
        userRepo:    userRepo,
        sessionRepo: sessionRepo,
        jwtSecret:   jwtSecret,
        tokenExpiry: tokenExpiry,
    }
}

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
    // Get user by email
    user, err := s.userRepo.GetByEmail(ctx, req.Email)
    if err != nil {
        return nil, errors.New("invalid credentials")
    }
    
    // Check if user is active
    if user.Status != models.UserStatusActive {
        return nil, errors.New("user account is not active")
    }
    
    // Verify password
    if err := bcrypt.CompareHashAndPassword(
        []byte(user.PasswordHash),
        []byte(req.Password),
    ); err != nil {
        return nil, errors.New("invalid credentials")
    }
    
    // Generate JWT token
    accessToken, err := s.generateToken(user)
    if err != nil {
        return nil, err
    }
    
    // Create session
    session := &models.UserSession{
        UserID:       user.ID,
        SessionToken: accessToken,
        ExpiresAt:    time.Now().Add(s.tokenExpiry),
        IsActive:     true,
    }
    
    if err := s.sessionRepo.Create(ctx, session); err != nil {
        return nil, err
    }
    
    return &AuthResponse{
        AccessToken:  accessToken,
        RefreshToken: "", // TODO: Implement refresh token
        ExpiresIn:    int64(s.tokenExpiry.Seconds()),
        User:         user,
    }, nil
}

func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
    // Check if email exists
    existing, _ := s.userRepo.GetByEmail(ctx, req.Email)
    if existing != nil {
        return nil, errors.New("email already exists")
    }
    
    // Hash password
    hashedPassword, err := bcrypt.GenerateFromPassword(
        []byte(req.Password),
        bcrypt.DefaultCost,
    )
    if err != nil {
        return nil, err
    }
    
    // Create user
    user := &models.User{
        Email:        req.Email,
        PasswordHash: string(hashedPassword),
        FullName:     req.FullName,
        Status:       models.UserStatusPending,
        IsVerified:   false,
    }
    
    createdUser, err := s.userRepo.Create(ctx, user)
    if err != nil {
        return nil, err
    }
    
    // Generate token
    accessToken, err := s.generateToken(createdUser)
    if err != nil {
        return nil, err
    }
    
    return &AuthResponse{
        AccessToken:  accessToken,
        RefreshToken: "",
        ExpiresIn:    int64(s.tokenExpiry.Seconds()),
        User:         createdUser,
    }, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
    claims := jwt.MapClaims{
        "user_id": user.ID,
        "email":   user.Email,
        "exp":     time.Now().Add(s.tokenExpiry).Unix(),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(s.jwtSecret))
}
```

#### 2. Tạo Auth Handler

```go
// /internal/handler/auth_handler.go
package handler

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
    "github.com/vhv-platform/backend/internal/service"
    "github.com/vhv-platform/backend/internal/utils"
)

type AuthHandler struct {
    service *service.AuthService
}

func NewAuthHandler(service *service.AuthService) *AuthHandler {
    return &AuthHandler{service: service}
}

func (h *AuthHandler) Login(c *gin.Context) {
    var req service.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    response, err := h.service.Login(c.Request.Context(), req)
    if err != nil {
        utils.ErrorResponse(c, http.StatusUnauthorized, "LOGIN_FAILED", err.Error())
        return
    }
    
    utils.SuccessResponse(c, http.StatusOK, response)
}

func (h *AuthHandler) Register(c *gin.Context) {
    var req service.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    response, err := h.service.Register(c.Request.Context(), req)
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "REGISTRATION_FAILED", err.Error())
        return
    }
    
    utils.SuccessResponse(c, http.StatusCreated, response)
}

func (h *AuthHandler) Logout(c *gin.Context) {
    // TODO: Implement logout (invalidate session)
    utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
}
```

---

## 🎯 Phase 4: Frontend Integration

### Tạo TypeScript API Client

**Cài đặt dependencies:**

```bash
cd /frontend
npm install axios @tanstack/react-query
npm install -D openapi-typescript
```

**Generate TypeScript types:**

```bash
npx openapi-typescript /golang-backend/api/openapi/openapi.yaml \
  -o src/types/api.ts
```

**Tạo API client:**

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
    
    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
  
  // Auth
  auth = {
    login: (email: string, password: string) =>
      this.client.post('/auth/login', { email, password }),
    register: (data: any) =>
      this.client.post('/auth/register', data),
    logout: () =>
      this.client.post('/auth/logout'),
  };
  
  // Users
  users = {
    getAll: (params?: any) =>
      this.client.get('/users', { params }),
    getById: (id: string) =>
      this.client.get(`/users/${id}`),
    create: (data: any) =>
      this.client.post('/users', data),
    update: (id: string, data: any) =>
      this.client.patch(`/users/${id}`, data),
    delete: (id: string) =>
      this.client.delete(`/users/${id}`),
  };
  
  // Add other resources...
}

export const apiClient = new APIClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
);
```

---

## 📊 Tracking Progress

### Checklist

**Phase 1: Documentation**
- [x] Kế hoạch tổng thể
- [x] OpenAPI infrastructure
- [ ] Complete all schema definitions (47 entities)
- [ ] Complete all path definitions (400+ endpoints)
- [ ] Setup Swagger UI
- [ ] Generate Postman collection

**Phase 3: Authentication**
- [ ] Auth service implementation
- [ ] Auth handler implementation
- [ ] JWT middleware
- [ ] Update main.go with auth routes
- [ ] Test login/register flow

**Phase 4: Frontend Integration**
- [ ] TypeScript API client
- [ ] Generate types from OpenAPI
- [ ] Update login page
- [ ] Update all admin pages
- [ ] React Query integration

---

## 📚 Resources

- **Kế hoạch chi tiết:** `/golang-backend/BACKEND_COMPLETION_PLAN.md`
- **OpenAPI Spec:** `/golang-backend/api/openapi/openapi.yaml`
- **Swagger UI:** `http://localhost:8080/api/docs` (sau khi setup)
- **Frontend:** `/frontend/`

---

## 🆘 Cần Hỗ Trợ?

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra `/golang-backend/BACKEND_COMPLETION_PLAN.md`
2. Xem examples trong `/api/openapi/components/`
3. Tham khảo existing handlers trong `/internal/handler/`

---

**Updated:** January 22, 2026

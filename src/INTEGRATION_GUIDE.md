# 🔗 Frontend-Backend Integration Guide

**Mục tiêu:** Kết nối frontend ReactJS với Golang backend API

---

## 📊 Current State Analysis

### ✅ Frontend Đã Có Sẵn

1. **AuthProvider** (`/providers/AuthProvider.tsx`)
   - ✅ Hỗ trợ switch giữa Supabase và Golang API
   - ✅ JWT token storage (`vhv-auth-token`)
   - ✅ Login/Logout logic cho cả 2 backends
   - ✅ Session persistence

2. **DataClient Factory**
   - ✅ Abstraction layer cho data fetching
   - ✅ Support Golang API và Supabase
   - ✅ Configuration từ environment variables

3. **Login Page** (`/app/login/page.tsx`)
   - ✅ UI hoàn chỉnh
   - ✅ Form validation
   - ✅ Error handling
   - ⚠️ Đang ở "Bypass Mode" (chỉ cần email đúng)

### ⏳ Cần Hoàn Thiện

1. **Golang Backend Authentication API** (Từ kế hoạch Phase 3)
2. **Environment Configuration**
3. **API Client Integration**
4. **Remove Bypass Mode**

---

## 🎯 Step-by-Step Integration

### Step 1: Setup Environment Variables

**Frontend `.env.local`:**
```bash
# Data source configuration
NEXT_PUBLIC_DATA_SOURCE=golang-api  # hoặc 'supabase'

# Golang API
NEXT_PUBLIC_GOLANG_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOLANG_API_KEY=your-api-key-here

# Supabase (fallback)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Golang Backend `.env`:**
```bash
# Server
PORT=8080
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=vhv_platform
DB_SSL_MODE=disable

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=24h

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

### Step 2: Implement Golang Authentication API

#### 2.1 Create Auth Models

```go
// /golang-backend/internal/models/auth.go
package models

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
    Success bool        `json:"success"`
    Data    *AuthData   `json:"data,omitempty"`
    Error   *ErrorInfo  `json:"error,omitempty"`
}

type AuthData struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int64  `json:"expires_in"`
    TokenType    string `json:"token_type"`
    User         *User  `json:"user"`
}
```

#### 2.2 Create Auth Service

```go
// /golang-backend/internal/service/auth_service.go
package service

import (
    "context"
    "errors"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
    "github.com/vhv-platform/backend/internal/models"
    "github.com/vhv-platform/backend/internal/repository"
)

type AuthService struct {
    userRepo       *repository.UserRepository
    sessionRepo    *repository.UserSessionRepository
    jwtSecret      string
    tokenExpiry    time.Duration
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

// Login authenticates user and returns JWT token
func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthData, error) {
    // Get user by email
    user, err := s.userRepo.GetByEmail(ctx, req.Email)
    if err != nil {
        return nil, errors.New("invalid email or password")
    }
    
    // Check if user is active
    if user.Status != models.UserStatusActive && user.Status != models.UserStatusPending {
        return nil, errors.New("user account is not active")
    }
    
    // Verify password
    if err := bcrypt.CompareHashAndPassword(
        []byte(user.PasswordHash),
        []byte(req.Password),
    ); err != nil {
        return nil, errors.New("invalid email or password")
    }
    
    // Generate JWT token
    accessToken, err := s.generateAccessToken(user)
    if err != nil {
        return nil, err
    }
    
    refreshToken, err := s.generateRefreshToken(user)
    if err != nil {
        return nil, err
    }
    
    // Create/update session
    session := &models.UserSession{
        UserID:       user.ID,
        SessionToken: accessToken,
        ExpiresAt:    time.Now().Add(s.tokenExpiry),
        IsActive:     true,
        IPAddress:    "", // TODO: Extract from context
        UserAgent:    "", // TODO: Extract from context
    }
    
    if err := s.sessionRepo.Create(ctx, session); err != nil {
        return nil, err
    }
    
    // Remove password hash from response
    user.PasswordHash = ""
    
    return &models.AuthData{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresIn:    int64(s.tokenExpiry.Seconds()),
        TokenType:    "Bearer",
        User:         user,
    }, nil
}

// Register creates a new user account
func (s *AuthService) Register(ctx context.Context, req models.RegisterRequest) (*models.AuthData, error) {
    // Check if email already exists
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
        MFAEnabled:   false,
    }
    
    createdUser, err := s.userRepo.Create(ctx, user)
    if err != nil {
        return nil, err
    }
    
    // Generate tokens
    accessToken, err := s.generateAccessToken(createdUser)
    if err != nil {
        return nil, err
    }
    
    refreshToken, err := s.generateRefreshToken(createdUser)
    if err != nil {
        return nil, err
    }
    
    // Create session
    session := &models.UserSession{
        UserID:       createdUser.ID,
        SessionToken: accessToken,
        ExpiresAt:    time.Now().Add(s.tokenExpiry),
        IsActive:     true,
    }
    
    if err := s.sessionRepo.Create(ctx, session); err != nil {
        return nil, err
    }
    
    // Remove password from response
    createdUser.PasswordHash = ""
    
    return &models.AuthData{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresIn:    int64(s.tokenExpiry.Seconds()),
        TokenType:    "Bearer",
        User:         createdUser,
    }, nil
}

// GetProfile returns current user profile
func (s *AuthService) GetProfile(ctx context.Context, userID string) (*models.User, error) {
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    // Remove sensitive data
    user.PasswordHash = ""
    
    return user, nil
}

// Logout invalidates user session
func (s *AuthService) Logout(ctx context.Context, sessionToken string) error {
    // Deactivate session
    return s.sessionRepo.DeactivateByToken(ctx, sessionToken)
}

// RefreshToken generates new access token from refresh token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*models.AuthData, error) {
    // Verify refresh token
    claims, err := s.verifyToken(refreshToken)
    if err != nil {
        return nil, errors.New("invalid refresh token")
    }
    
    userID, ok := claims["user_id"].(string)
    if !ok {
        return nil, errors.New("invalid token claims")
    }
    
    // Get user
    user, err := s.userRepo.GetByID(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    // Generate new access token
    accessToken, err := s.generateAccessToken(user)
    if err != nil {
        return nil, err
    }
    
    // Remove password from response
    user.PasswordHash = ""
    
    return &models.AuthData{
        AccessToken:  accessToken,
        RefreshToken: refreshToken, // Keep same refresh token
        ExpiresIn:    int64(s.tokenExpiry.Seconds()),
        TokenType:    "Bearer",
        User:         user,
    }, nil
}

// Private helper methods

func (s *AuthService) generateAccessToken(user *models.User) (string, error) {
    claims := jwt.MapClaims{
        "user_id":  user.ID,
        "email":    user.Email,
        "type":     "access",
        "exp":      time.Now().Add(s.tokenExpiry).Unix(),
        "iat":      time.Now().Unix(),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) generateRefreshToken(user *models.User) (string, error) {
    claims := jwt.MapClaims{
        "user_id":  user.ID,
        "email":    user.Email,
        "type":     "refresh",
        "exp":      time.Now().Add(7 * 24 * time.Hour).Unix(), // 7 days
        "iat":      time.Now().Unix(),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) verifyToken(tokenString string) (jwt.MapClaims, error) {
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return []byte(s.jwtSecret), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, errors.New("invalid token")
}
```

#### 2.3 Create Auth Handler

```go
// /golang-backend/internal/handler/auth_handler.go
package handler

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
    "github.com/vhv-platform/backend/internal/models"
    "github.com/vhv-platform/backend/internal/service"
    "github.com/vhv-platform/backend/internal/utils"
)

type AuthHandler struct {
    service *service.AuthService
}

func NewAuthHandler(service *service.AuthService) *AuthHandler {
    return &AuthHandler{service: service}
}

// Login godoc
// @Summary User login
// @Description Authenticate user with email and password
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} utils.ErrorResponse
// @Failure 401 {object} utils.ErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
    var req models.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    authData, err := h.service.Login(c.Request.Context(), req)
    if err != nil {
        utils.ErrorResponse(c, http.StatusUnauthorized, "LOGIN_FAILED", err.Error())
        return
    }
    
    utils.SuccessResponse(c, http.StatusOK, authData)
}

// Register godoc
// @Summary User registration
// @Description Create a new user account
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "User registration data"
// @Success 201 {object} models.AuthResponse
// @Failure 400 {object} utils.ErrorResponse
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
    var req models.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    authData, err := h.service.Register(c.Request.Context(), req)
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "REGISTRATION_FAILED", err.Error())
        return
    }
    
    utils.SuccessResponse(c, http.StatusCreated, authData)
}

// GetProfile godoc
// @Summary Get current user profile
// @Description Get authenticated user's profile
// @Tags Authentication
// @Produce json
// @Success 200 {object} models.User
// @Failure 401 {object} utils.ErrorResponse
// @Security BearerAuth
// @Router /auth/me [get]
func (h *AuthHandler) GetProfile(c *gin.Context) {
    userID := c.GetString("user_id")
    if userID == "" {
        utils.UnauthorizedResponse(c)
        return
    }
    
    user, err := h.service.GetProfile(c.Request.Context(), userID)
    if err != nil {
        utils.ErrorResponse(c, http.StatusNotFound, "USER_NOT_FOUND", err.Error())
        return
    }
    
    utils.SuccessResponse(c, http.StatusOK, user)
}

// Logout godoc
// @Summary User logout
// @Description Invalidate current session
// @Tags Authentication
// @Produce json
// @Success 200 {object} utils.SuccessResponse
// @Failure 401 {object} utils.ErrorResponse
// @Security BearerAuth
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
    sessionToken := c.GetString("session_token")
    
    if err := h.service.Logout(c.Request.Context(), sessionToken); err != nil {
        utils.InternalErrorResponse(c, err)
        return
    }
    
    utils.SuccessResponse(c, http.StatusOK, gin.H{
        "message": "Logged out successfully",
    })
}

// RefreshToken godoc
// @Summary Refresh access token
// @Description Get new access token using refresh token
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body object{refresh_token=string} true "Refresh token"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} utils.ErrorResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
    var req struct {
        RefreshToken string `json:"refresh_token" validate:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.ValidationErrorResponse(c, err.Error())
        return
    }
    
    authData, err := h.service.RefreshToken(c.Request.Context(), req.RefreshToken)
    if err != nil {
        utils.ErrorResponse(c, http.StatusBadRequest, "REFRESH_FAILED", err.Error())
        return
    }
    
    utils.SuccessResponse(c, http.StatusOK, authData)
}
```

#### 2.4 Create JWT Middleware

```go
// /golang-backend/internal/middleware/jwt.go
package middleware

import (
    "net/http"
    "strings"
    
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "github.com/vhv-platform/backend/internal/utils"
)

func JWTAuth(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract token from Authorization header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            utils.UnauthorizedResponse(c)
            c.Abort()
            return
        }
        
        // Check Bearer scheme
        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            utils.ErrorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid authorization header format")
            c.Abort()
            return
        }
        
        tokenString := parts[1]
        
        // Parse and validate token
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, jwt.ErrSignatureInvalid
            }
            return []byte(jwtSecret), nil
        })
        
        if err != nil || !token.Valid {
            utils.ErrorResponse(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token")
            c.Abort()
            return
        }
        
        // Extract claims
        if claims, ok := token.Claims.(jwt.MapClaims); ok {
            userID, _ := claims["user_id"].(string)
            email, _ := claims["email"].(string)
            
            // Set user context
            c.Set("user_id", userID)
            c.Set("email", email)
            c.Set("session_token", tokenString)
        }
        
        c.Next()
    }
}

// Optional: RequirePermission middleware
func RequirePermission(permission string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("user_id")
        if userID == "" {
            utils.UnauthorizedResponse(c)
            c.Abort()
            return
        }
        
        // TODO: Check user permissions from database
        // For now, just continue
        
        c.Next()
    }
}
```

#### 2.5 Update main.go

```go
// Add to main.go initialization

// Initialize auth service
authService := service.NewAuthService(
    userRepo,
    userSessionRepo,
    cfg.JWT.Secret,
    cfg.JWT.Expiry,
)

// Initialize auth handler
authHandler := handler.NewAuthHandler(authService)

// In setupRouter function, add auth routes:

func setupRouter(...) *gin.Engine {
    // ... existing code ...
    
    // Public auth routes
    auth := v1.Group("/auth")
    {
        auth.POST("/login", authHandler.Login)
        auth.POST("/register", authHandler.Register)
        auth.POST("/refresh", authHandler.RefreshToken)
    }
    
    // Protected routes
    protected := v1.Group("")
    protected.Use(middleware.JWTAuth(cfg.JWT.Secret))
    {
        // Auth endpoints (require authentication)
        protected.GET("/auth/me", authHandler.GetProfile)
        protected.POST("/auth/logout", authHandler.Logout)
        
        // All other endpoints...
        users := protected.Group("/users")
        {
            users.GET("", userHandler.GetAll)
            users.GET("/:id", userHandler.GetByID)
            // ... rest of user endpoints
        }
        
        // ... all other protected endpoints
    }
    
    return router
}
```

---

### Step 3: Update Frontend to Use Golang API

#### 3.1 Update `.env.local`

```bash
# Switch to Golang API
NEXT_PUBLIC_DATA_SOURCE=golang-api
NEXT_PUBLIC_GOLANG_API_URL=http://localhost:8080/api/v1
```

#### 3.2 Remove Bypass Mode from Login Page

```typescript
// /app/login/page.tsx
// Remove the bypass mode section:

// DELETE THESE LINES:
<div className="mt-6 text-center text-sm text-gray-600">
  <p>Tài khoản mặc định:</p>
  <p className="font-mono mt-1">admin@saas.coquan.vn</p>
  <p className="font-mono">Vhv@2026</p>
  <p className="text-xs text-amber-600 mt-2">
    🔓 Bypass Mode: Chỉ cần email đúng là login được
  </p>
  ...
</div>
```

#### 3.3 Update AuthProvider Response Handling

```typescript
// /providers/AuthProvider.tsx
// The current code already handles Golang API responses correctly:

if (config?.type === 'golang-api') {
    const client = getDataClient();
    const response = await client.execute<{ 
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
            user: any;
        }
    }>('auth/login', {
       method: 'POST',
       body: { email, password }
    });

    if (response?.success && response.data?.access_token) {
        localStorage.setItem('vhv-auth-token', response.data.access_token);
        localStorage.setItem('vhv-refresh-token', response.data.refresh_token);
        setIsAuthenticated(true);
        
        const userProfile = response.data.user;
        setUser({
           id: userProfile._id || userProfile.id,
           email: userProfile.email,
           aud: 'authenticated',
           role: userProfile.role || 'user',
           created_at: userProfile.created_at,
           updated_at: userProfile.updated_at,
           app_metadata: {},
           user_metadata: userProfile.metadata || {},
           display_name: userProfile.full_name,
           full_name: userProfile.full_name,
           avatar_url: userProfile.avatar_url
        } as CurrentUser);
        return;
    }
}
```

---

### Step 4: Testing Integration

#### 4.1 Start Golang Backend

```bash
cd /golang-backend

# Run migrations if needed
make migrate-up

# Start server
make run
# or
go run cmd/api/main.go
```

#### 4.2 Start Frontend

```bash
cd /frontend

# Make sure .env.local is configured
npm run dev
```

#### 4.3 Test Login Flow

1. Go to `http://localhost:3000/login`
2. Use test credentials:
   - Email: `admin@saas.coquan.vn`
   - Password: `Vhv@2026`
3. Click "Đăng nhập"
4. Should receive JWT token and redirect to dashboard

#### 4.4 Verify JWT Token

```bash
# Check localStorage in browser console
localStorage.getItem('vhv-auth-token')

# Should see a JWT token like:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔍 Troubleshooting

### Problem: CORS Error

**Solution:**
```go
// /golang-backend/internal/middleware/cors.go
func CORS(origins []string) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", "*")
        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    }
}
```

### Problem: Token Not Sent in Requests

**Check DataClient configuration:**
```typescript
// Make sure axios instance adds auth header
this.client.interceptors.request.use((config) => {
    const token = localStorage.getItem('vhv-auth-token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### Problem: Password Mismatch

**Create test user in database:**
```sql
-- Hash password "Vhv@2026" using bcrypt
-- You can use online tool or Go code to generate hash

INSERT INTO users (
    _id, 
    email, 
    password_hash,
    full_name, 
    status,
    is_verified,
    created_at,
    updated_at,
    version
) VALUES (
    gen_random_uuid(),
    'admin@saas.coquan.vn',
    '$2a$10$...',  -- bcrypt hash of "Vhv@2026"
    'System Admin',
    'ACTIVE',
    true,
    now(),
    now(),
    1
);
```

---

## ✅ Integration Checklist

### Backend (Golang)
- [ ] Auth service implemented
- [ ] Auth handler created
- [ ] JWT middleware added
- [ ] Routes configured in main.go
- [ ] CORS properly configured
- [ ] Test user created in database
- [ ] Backend running on port 8080

### Frontend (ReactJS)
- [ ] Environment variables configured
- [ ] DATA_SOURCE set to `golang-api`
- [ ] Bypass mode removed from login page
- [ ] AuthProvider configured correctly
- [ ] DataClient factory configured
- [ ] Frontend running on port 3000

### Testing
- [ ] Can access login page
- [ ] Can submit login form
- [ ] JWT token received and stored
- [ ] Redirected to dashboard after login
- [ ] Token sent in subsequent requests
- [ ] Logout works correctly
- [ ] Token refresh works (if implemented)

---

## 🚀 Next Steps After Integration

1. **Implement all other endpoints** (Users, Tenants, etc.)
2. **Add RBAC middleware** for permission checks
3. **Implement refresh token rotation**
4. **Add MFA support**
5. **Setup monitoring and logging**
6. **Write integration tests**
7. **Deploy to staging environment**

---

**Updated:** January 22, 2026  
**Status:** Ready for implementation

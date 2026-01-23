package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) ValidateToken(token string) (*models.User, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	mockAuthService := new(MockAuthService)
	router := setupTestRouter()

	user := &models.User{
		ID:       uuid.New(),
		TenantID: uuid.New(),
		Email:    "test@example.com",
		FullName: "Test User",
	}

	mockAuthService.On("ValidateToken", "valid-token").Return(user, nil)

	router.Use(AuthMiddleware(mockAuthService))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockAuthService.AssertExpectations(t)
}

func TestAuthMiddleware_MissingToken(t *testing.T) {
	mockAuthService := new(MockAuthService)
	router := setupTestRouter()

	router.Use(AuthMiddleware(mockAuthService))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	mockAuthService := new(MockAuthService)
	router := setupTestRouter()

	mockAuthService.On("ValidateToken", "invalid-token").Return(nil, assert.AnError)

	router.Use(AuthMiddleware(mockAuthService))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	mockAuthService.AssertExpectations(t)
}

func TestAuthMiddleware_MalformedAuthHeader(t *testing.T) {
	mockAuthService := new(MockAuthService)
	router := setupTestRouter()

	router.Use(AuthMiddleware(mockAuthService))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "InvalidFormat token")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestTenantMiddleware_ValidTenant(t *testing.T) {
	router := setupTestRouter()

	tenantID := uuid.New()

	router.Use(TenantMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Tenant-ID", tenantID.String())
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestTenantMiddleware_MissingTenant(t *testing.T) {
	router := setupTestRouter()

	router.Use(TenantMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestTenantMiddleware_InvalidTenant(t *testing.T) {
	router := setupTestRouter()

	router.Use(TenantMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Tenant-ID", "invalid-uuid")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRateLimitMiddleware(t *testing.T) {
	router := setupTestRouter()

	// Allow 5 requests per second
	router.Use(RateLimitMiddleware(5, 1))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	// First 5 requests should succeed
	for i := 0; i < 5; i++ {
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.1:12345"
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code, "Request %d should succeed", i+1)
	}

	// 6th request should be rate limited
	req, _ := http.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.1:12345"
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusTooManyRequests, w.Code)
}

func TestCORSMiddleware(t *testing.T) {
	router := setupTestRouter()

	router.Use(CORSMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
}

func TestCORSMiddleware_Preflight(t *testing.T) {
	router := setupTestRouter()

	router.Use(CORSMiddleware())
	router.OPTIONS("/test", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	req, _ := http.NewRequest("OPTIONS", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.NotEmpty(t, w.Header().Get("Access-Control-Allow-Methods"))
}

func TestLoggingMiddleware(t *testing.T) {
	router := setupTestRouter()

	router.Use(LoggingMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRecoveryMiddleware(t *testing.T) {
	router := setupTestRouter()

	router.Use(RecoveryMiddleware())
	router.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})

	req, _ := http.NewRequest("GET", "/panic", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

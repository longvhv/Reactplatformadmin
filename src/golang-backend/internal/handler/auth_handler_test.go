package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
)

type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(req service.RegisterRequest) (*models.User, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockAuthService) Login(email, password string) (*models.User, string, error) {
	args := m.Called(email, password)
	if args.Get(0) == nil {
		return nil, "", args.Error(2)
	}
	return args.Get(0).(*models.User), args.Get(1).(string), args.Error(2)
}

func (m *MockAuthService) ValidateToken(token string) (*models.User, error) {
	args := m.Called(token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func setupAuthTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestRegister_Success(t *testing.T) {
	mockAuthService := new(MockAuthService)
	handler := NewAuthHandler(mockAuthService)
	router := setupAuthTestRouter()

	router.POST("/auth/register", handler.Register)

	userID := uuid.New()
	tenantID := uuid.New()
	user := &models.User{
		ID:       userID,
		TenantID: tenantID,
		Email:    "test@example.com",
		FullName: "Test User",
	}

	mockAuthService.On("Register", mock.AnythingOfType("service.RegisterRequest")).Return(user, nil)

	body := map[string]interface{}{
		"tenant_id": tenantID.String(),
		"email":     "test@example.com",
		"password":  "password123",
		"full_name": "Test User",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
	mockAuthService.AssertExpectations(t)
}

func TestRegister_InvalidEmail(t *testing.T) {
	mockAuthService := new(MockAuthService)
	handler := NewAuthHandler(mockAuthService)
	router := setupAuthTestRouter()

	router.POST("/auth/register", handler.Register)

	body := map[string]interface{}{
		"tenant_id": uuid.New().String(),
		"email":     "invalid-email",
		"password":  "password123",
		"full_name": "Test User",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLogin_Success(t *testing.T) {
	mockAuthService := new(MockAuthService)
	handler := NewAuthHandler(mockAuthService)
	router := setupAuthTestRouter()

	router.POST("/auth/login", handler.Login)

	user := &models.User{
		ID:       uuid.New(),
		Email:    "test@example.com",
		FullName: "Test User",
	}
	token := "mock-jwt-token"

	mockAuthService.On("Login", "test@example.com", "password123").Return(user, token, nil)

	body := map[string]interface{}{
		"email":    "test@example.com",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
	
	data := response["data"].(map[string]interface{})
	assert.Equal(t, token, data["token"])
	mockAuthService.AssertExpectations(t)
}

func TestLogin_InvalidCredentials(t *testing.T) {
	mockAuthService := new(MockAuthService)
	handler := NewAuthHandler(mockAuthService)
	router := setupAuthTestRouter()

	router.POST("/auth/login", handler.Login)

	mockAuthService.On("Login", "test@example.com", "wrong-password").Return(nil, "", assert.AnError)

	body := map[string]interface{}{
		"email":    "test@example.com",
		"password": "wrong-password",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	mockAuthService.AssertExpectations(t)
}

func TestLogin_MissingFields(t *testing.T) {
	mockAuthService := new(MockAuthService)
	handler := NewAuthHandler(mockAuthService)
	router := setupAuthTestRouter()

	router.POST("/auth/login", handler.Login)

	body := map[string]interface{}{
		"email": "test@example.com",
		// Missing password
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

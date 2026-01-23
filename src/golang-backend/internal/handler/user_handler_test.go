package handler

import (
	"bytes"
	"context"
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
	"github.com/vhv-platform/backend/pkg/contextutil"
)

type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.User, int64, error) {
	args := m.Called(ctx, tenantID, page, limit)
	return args.Get(0).([]*models.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserService) CreateUser(ctx context.Context, req service.CreateUserRequest) (*models.User, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) UpdateUser(ctx context.Context, id uuid.UUID, req service.UpdateUserRequest) (*models.User, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

type MockAuthzService struct {
	mock.Mock
}

func (m *MockAuthzService) CheckPermission(ctx context.Context, userID uuid.UUID, resource, action string) (bool, error) {
	args := m.Called(ctx, userID, resource, action)
	return args.Bool(0), args.Error(1)
}

func setupUserTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func addTestContext(ctx *gin.Context, userID, tenantID uuid.UUID) {
	c := context.Background()
	c = contextutil.WithUserID(c, userID)
	c = contextutil.WithTenantID(c, tenantID)
	ctx.Request = ctx.Request.WithContext(c)
}

func TestGetUserByID_Success(t *testing.T) {
	mockUserService := new(MockUserService)
	mockAuthzService := new(MockAuthzService)
	handler := NewUserHandler(mockUserService, mockAuthzService)
	router := setupUserTestRouter()

	router.GET("/users/:id", func(c *gin.Context) {
		userID := uuid.New()
		tenantID := uuid.New()
		addTestContext(c, userID, tenantID)
		handler.GetByID(c)
	})

	userID := uuid.New()
	user := &models.User{
		ID:       userID,
		Email:    "test@example.com",
		FullName: "Test User",
	}

	mockUserService.On("GetByID", mock.Anything, userID).Return(user, nil)

	req, _ := http.NewRequest("GET", "/users/"+userID.String(), nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "success", response["status"])
	mockUserService.AssertExpectations(t)
}

func TestGetUserByID_InvalidUUID(t *testing.T) {
	mockUserService := new(MockUserService)
	mockAuthzService := new(MockAuthzService)
	handler := NewUserHandler(mockUserService, mockAuthzService)
	router := setupUserTestRouter()

	router.GET("/users/:id", handler.GetByID)

	req, _ := http.NewRequest("GET", "/users/invalid-uuid", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestListUsers_Success(t *testing.T) {
	mockUserService := new(MockUserService)
	mockAuthzService := new(MockAuthzService)
	handler := NewUserHandler(mockUserService, mockAuthzService)
	router := setupUserTestRouter()

	router.GET("/users", func(c *gin.Context) {
		userID := uuid.New()
		tenantID := uuid.New()
		addTestContext(c, userID, tenantID)
		handler.List(c)
	})

	tenantID := uuid.New()
	users := []*models.User{
		{ID: uuid.New(), Email: "user1@example.com"},
		{ID: uuid.New(), Email: "user2@example.com"},
	}

	mockUserService.On("ListByTenant", mock.Anything, tenantID, 1, 20).Return(users, int64(2), nil)

	req, _ := http.NewRequest("GET", "/users", nil)
	
	// Add context with tenant ID
	ctx := context.Background()
	ctx = contextutil.WithTenantID(ctx, tenantID)
	req = req.WithContext(ctx)
	
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCreateUser_Success(t *testing.T) {
	mockUserService := new(MockUserService)
	mockAuthzService := new(MockAuthzService)
	handler := NewUserHandler(mockUserService, mockAuthzService)
	router := setupUserTestRouter()

	router.POST("/users", func(c *gin.Context) {
		userID := uuid.New()
		tenantID := uuid.New()
		addTestContext(c, userID, tenantID)
		handler.Create(c)
	})

	userID := uuid.New()
	tenantID := uuid.New()
	user := &models.User{
		ID:       userID,
		TenantID: tenantID,
		Email:    "newuser@example.com",
		FullName: "New User",
	}

	mockUserService.On("CreateUser", mock.Anything, mock.AnythingOfType("service.CreateUserRequest")).Return(user, nil)

	body := map[string]interface{}{
		"email":     "newuser@example.com",
		"password":  "password123",
		"full_name": "New User",
		"role":      "user",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/users", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestUpdateUser_Success(t *testing.T) {
	mockUserService := new(MockUserService)
	mockAuthzService := new(MockAuthzService)
	handler := NewUserHandler(mockUserService, mockAuthzService)
	router := setupUserTestRouter()

	router.PUT("/users/:id", func(c *gin.Context) {
		userID := uuid.New()
		tenantID := uuid.New()
		addTestContext(c, userID, tenantID)
		handler.Update(c)
	})

	userID := uuid.New()
	user := &models.User{
		ID:       userID,
		Email:    "updated@example.com",
		FullName: "Updated User",
	}

	mockUserService.On("UpdateUser", mock.Anything, userID, mock.AnythingOfType("service.UpdateUserRequest")).Return(user, nil)

	body := map[string]interface{}{
		"full_name": "Updated User",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("PUT", "/users/"+userID.String(), bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

func TestDeleteUser_Success(t *testing.T) {
	mockUserService := new(MockUserService)
	mockAuthzService := new(MockAuthzService)
	handler := NewUserHandler(mockUserService, mockAuthzService)
	router := setupUserTestRouter()

	router.DELETE("/users/:id", func(c *gin.Context) {
		userID := uuid.New()
		tenantID := uuid.New()
		addTestContext(c, userID, tenantID)
		handler.Delete(c)
	})

	userID := uuid.New()
	mockUserService.On("DeleteUser", mock.Anything, userID).Return(nil)

	req, _ := http.NewRequest("DELETE", "/users/"+userID.String(), nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockUserService.AssertExpectations(t)
}

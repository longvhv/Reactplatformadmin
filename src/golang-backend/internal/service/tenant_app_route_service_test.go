package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockTenantAppRouteRepository is a mock of TenantAppRouteRepository
type MockTenantAppRouteRepository struct {
	mock.Mock
}

func (m *MockTenantAppRouteRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantAppRoute, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantAppRoute), args.Error(1)
}

func (m *MockTenantAppRouteRepository) GetByDomain(ctx context.Context, domain string) (*models.TenantAppRoute, error) {
	args := m.Called(ctx, domain)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantAppRoute), args.Error(1)
}

func (m *MockTenantAppRouteRepository) GetPrimary(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantAppRoute, error) {
	args := m.Called(ctx, tenantID, appCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantAppRoute), args.Error(1)
}

func (m *MockTenantAppRouteRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, appCode, status string, limit, offset int) ([]*models.TenantAppRoute, int64, error) {
	args := m.Called(ctx, tenantID, appCode, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantAppRoute), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantAppRouteRepository) UnsetPrimary(ctx context.Context, tenantID uuid.UUID, appCode string) error {
	args := m.Called(ctx, tenantID, appCode)
	return args.Error(0)
}

func (m *MockTenantAppRouteRepository) Create(ctx context.Context, route *models.TenantAppRoute) error {
	args := m.Called(ctx, route)
	return args.Error(0)
}

func (m *MockTenantAppRouteRepository) Update(ctx context.Context, route *models.TenantAppRoute) error {
	args := m.Called(ctx, route)
	return args.Error(0)
}

func (m *MockTenantAppRouteRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestTenantAppRouteService_CreateRoute(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success - basic route", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantAppRouteRequest{
			TenantID: tenantID,
			AppCode:  "web-portal",
			Domain:   "example.com",
		}

		mockRepo.On("GetByDomain", ctx, "example.com").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantAppRoute")).Return(nil).Once()

		route, err := service.CreateRoute(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.Equal(t, "example.com", route.Domain)
		assert.Equal(t, "/", route.PathPrefix)
		assert.Equal(t, "SPECIFIC_DOMAIN", route.RouteScope)
		assert.Equal(t, "ACTIVE", route.Status)
		assert.Equal(t, "NONE", route.SSLStatus)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - custom domain with primary", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantAppRouteRequest{
			TenantID:       tenantID,
			AppCode:        "web-portal",
			Domain:         "custom.example.com",
			PathPrefix:     "/app",
			IsPrimary:      true,
			IsCustomDomain: true,
		}

		mockRepo.On("GetByDomain", ctx, "custom.example.com").Return(nil, errors.New("not found")).Once()
		mockRepo.On("UnsetPrimary", ctx, tenantID, "web-portal").Return(nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantAppRoute")).Return(nil).Once()

		route, err := service.CreateRoute(ctx, req)

		assert.NoError(t, err)
		assert.True(t, route.IsPrimary)
		assert.True(t, route.IsCustomDomain)
		assert.Equal(t, "PENDING_DNS", route.Status)
		assert.Equal(t, "PENDING", route.SSLStatus)
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate domain", func(t *testing.T) {
		tenantID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:     uuid.New(),
			Domain: "existing.com",
		}
		req := CreateTenantAppRouteRequest{
			TenantID: tenantID,
			AppCode:  "web-portal",
			Domain:   "existing.com",
		}

		mockRepo.On("GetByDomain", ctx, "existing.com").Return(existing, nil).Once()

		route, err := service.CreateRoute(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, route)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateTenantAppRouteRequest{
			TenantID: uuid.New(),
			AppCode:  "web-portal",
			Domain:   "test.com",
		}

		mockRepo.On("GetByDomain", ctx, "test.com").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantAppRoute")).Return(errors.New("db error")).Once()

		route, err := service.CreateRoute(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, route)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_UpdateRoute(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		routeID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:         routeID,
			PathPrefix: "/",
			Status:     "ACTIVE",
			Version:    1,
		}

		newPrefix := "/api"
		newStatus := "MAINTENANCE"
		req := UpdateTenantAppRouteRequest{
			PathPrefix: &newPrefix,
			Status:     &newStatus,
		}

		mockRepo.On("GetByID", ctx, routeID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantAppRoute")).Return(nil).Once()

		route, err := service.UpdateRoute(ctx, routeID, req)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.Equal(t, "/api", route.PathPrefix)
		assert.Equal(t, "MAINTENANCE", route.Status)
		assert.Equal(t, 2, route.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("route not found", func(t *testing.T) {
		routeID := uuid.New()
		req := UpdateTenantAppRouteRequest{}

		mockRepo.On("GetByID", ctx, routeID).Return(nil, errors.New("not found")).Once()

		route, err := service.UpdateRoute(ctx, routeID, req)

		assert.Error(t, err)
		assert.Nil(t, route)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_DeleteRoute(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		routeID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:        routeID,
			IsPrimary: false,
		}

		mockRepo.On("GetByID", ctx, routeID).Return(existing, nil).Once()
		mockRepo.On("Delete", ctx, routeID).Return(nil).Once()

		err := service.DeleteRoute(ctx, routeID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot delete primary", func(t *testing.T) {
		routeID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:        routeID,
			IsPrimary: true,
		}

		mockRepo.On("GetByID", ctx, routeID).Return(existing, nil).Once()

		err := service.DeleteRoute(ctx, routeID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete primary")
		mockRepo.AssertExpectations(t)
	})

	t.Run("route not found", func(t *testing.T) {
		routeID := uuid.New()

		mockRepo.On("GetByID", ctx, routeID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteRoute(ctx, routeID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_SetPrimary(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		routeID := uuid.New()
		tenantID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:        routeID,
			TenantID:  tenantID,
			AppCode:   "web-portal",
			IsPrimary: false,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, routeID).Return(existing, nil).Once()
		mockRepo.On("UnsetPrimary", ctx, tenantID, "web-portal").Return(nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantAppRoute")).Return(nil).Once()

		route, err := service.SetPrimary(ctx, routeID)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.True(t, route.IsPrimary)
		assert.Equal(t, 2, route.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("already primary", func(t *testing.T) {
		routeID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:        routeID,
			IsPrimary: true,
		}

		mockRepo.On("GetByID", ctx, routeID).Return(existing, nil).Once()

		route, err := service.SetPrimary(ctx, routeID)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.True(t, route.IsPrimary)
		mockRepo.AssertExpectations(t)
	})

	t.Run("route not found", func(t *testing.T) {
		routeID := uuid.New()

		mockRepo.On("GetByID", ctx, routeID).Return(nil, errors.New("not found")).Once()

		route, err := service.SetPrimary(ctx, routeID)

		assert.Error(t, err)
		assert.Nil(t, route)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_VerifySSL(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		routeID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:             routeID,
			IsCustomDomain: true,
			SSLStatus:      "NONE",
			Version:        1,
		}

		mockRepo.On("GetByID", ctx, routeID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantAppRoute")).Return(nil).Once()

		route, err := service.VerifySSL(ctx, routeID)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.Equal(t, "PENDING", route.SSLStatus)
		assert.Equal(t, 2, route.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not custom domain", func(t *testing.T) {
		routeID := uuid.New()
		existing := &models.TenantAppRoute{
			ID:             routeID,
			IsCustomDomain: false,
		}

		mockRepo.On("GetByID", ctx, routeID).Return(existing, nil).Once()

		route, err := service.VerifySSL(ctx, routeID)

		assert.Error(t, err)
		assert.Nil(t, route)
		assert.Contains(t, err.Error(), "only for custom domains")
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_GetByID(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		routeID := uuid.New()
		expected := &models.TenantAppRoute{
			ID:     routeID,
			Domain: "example.com",
		}

		mockRepo.On("GetByID", ctx, routeID).Return(expected, nil).Once()

		route, err := service.GetByID(ctx, routeID)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.Equal(t, routeID, route.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		routeID := uuid.New()
		mockRepo.On("GetByID", ctx, routeID).Return(nil, errors.New("not found")).Once()

		route, err := service.GetByID(ctx, routeID)

		assert.Error(t, err)
		assert.Nil(t, route)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_GetByDomain(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		domain := "example.com"
		expected := &models.TenantAppRoute{
			ID:     uuid.New(),
			Domain: domain,
		}

		mockRepo.On("GetByDomain", ctx, domain).Return(expected, nil).Once()

		route, err := service.GetByDomain(ctx, domain)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.Equal(t, domain, route.Domain)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_GetPrimaryRoute(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		appCode := "web-portal"
		expected := &models.TenantAppRoute{
			ID:        uuid.New(),
			TenantID:  tenantID,
			AppCode:   appCode,
			IsPrimary: true,
		}

		mockRepo.On("GetPrimary", ctx, tenantID, appCode).Return(expected, nil).Once()

		route, err := service.GetPrimaryRoute(ctx, tenantID, appCode)

		assert.NoError(t, err)
		assert.NotNil(t, route)
		assert.True(t, route.IsPrimary)
		mockRepo.AssertExpectations(t)
	})

	t.Run("no primary found", func(t *testing.T) {
		tenantID := uuid.New()
		appCode := "web-portal"

		mockRepo.On("GetPrimary", ctx, tenantID, appCode).Return(nil, errors.New("not found")).Once()

		route, err := service.GetPrimaryRoute(ctx, tenantID, appCode)

		assert.Error(t, err)
		assert.Nil(t, route)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantAppRouteService_ListByTenant(t *testing.T) {
	mockRepo := new(MockTenantAppRouteRepository)
	service := NewTenantAppRouteService(mockRepo)
	ctx := context.Background()

	t.Run("success - all routes", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantAppRoute{
			{ID: uuid.New(), Domain: "example.com"},
			{ID: uuid.New(), Domain: "custom.com"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", "", 10, 0).Return(expected, int64(2), nil).Once()

		routes, total, err := service.ListByTenant(ctx, tenantID, "", "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, routes, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with app filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantAppRoute{
			{ID: uuid.New(), AppCode: "web-portal"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "web-portal", "", 10, 0).Return(expected, int64(1), nil).Once()

		routes, total, err := service.ListByTenant(ctx, tenantID, "web-portal", "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, routes, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with status filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantAppRoute{
			{ID: uuid.New(), Status: "ACTIVE"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", "ACTIVE", 10, 0).Return(expected, int64(1), nil).Once()

		routes, total, err := service.ListByTenant(ctx, tenantID, "", "ACTIVE", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, routes, 1)
		mockRepo.AssertExpectations(t)
	})
}

package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockTenantApplicationRepository is a mock of TenantApplicationRepository
type MockTenantApplicationRepository struct {
	mock.Mock
}

func (m *MockTenantApplicationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantApplication, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantApplication), args.Error(1)
}

func (m *MockTenantApplicationRepository) GetByAppCode(ctx context.Context, tenantID uuid.UUID, appCode string) (*models.TenantApplication, error) {
	args := m.Called(ctx, tenantID, appCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantApplication), args.Error(1)
}

func (m *MockTenantApplicationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, isActive *bool, limit, offset int) ([]*models.TenantApplication, int64, error) {
	args := m.Called(ctx, tenantID, isActive, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantApplication), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantApplicationRepository) Create(ctx context.Context, app *models.TenantApplication) error {
	args := m.Called(ctx, app)
	return args.Error(0)
}

func (m *MockTenantApplicationRepository) Update(ctx context.Context, app *models.TenantApplication) error {
	args := m.Called(ctx, app)
	return args.Error(0)
}

func (m *MockTenantApplicationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestTenantApplicationService_CreateTenantApplication(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantApplicationRequest{
			TenantID:  tenantID,
			AppCode:   "crm",
			CreatedBy: uuid.New(),
		}

		mockRepo.On("GetByAppCode", ctx, tenantID, "crm").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantApplication")).Return(nil).Once()

		app, err := service.CreateTenantApplication(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, "crm", app.AppCode)
		assert.True(t, app.IsActive)
		assert.NotNil(t, app.ActivatedAt)
		assert.Equal(t, "TRIAL", app.LicenseType)
		assert.Equal(t, 10, app.MaxUsers)
		assert.Equal(t, 1, app.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full details", func(t *testing.T) {
		tenantID := uuid.New()
		expiresAt := time.Now().Add(365 * 24 * time.Hour).Format(time.RFC3339)
		req := CreateTenantApplicationRequest{
			TenantID:    tenantID,
			AppCode:     "erp",
			LicenseType: "ENTERPRISE",
			MaxUsers:    1000,
			ExpiresAt:   &expiresAt,
			Settings: map[string]interface{}{
				"theme":    "dark",
				"language": "en",
			},
			CreatedBy: uuid.New(),
		}

		mockRepo.On("GetByAppCode", ctx, tenantID, "erp").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantApplication")).Return(nil).Once()

		app, err := service.CreateTenantApplication(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "ENTERPRISE", app.LicenseType)
		assert.Equal(t, 1000, app.MaxUsers)
		assert.NotNil(t, app.ExpiresAt)
		assert.NotNil(t, app.Settings)
		assert.Equal(t, "dark", app.Settings["theme"])
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate application", func(t *testing.T) {
		tenantID := uuid.New()
		existing := &models.TenantApplication{
			ID:       uuid.New(),
			TenantID: tenantID,
			AppCode:  "crm",
		}
		req := CreateTenantApplicationRequest{
			TenantID:  tenantID,
			AppCode:   "crm",
			CreatedBy: uuid.New(),
		}

		mockRepo.On("GetByAppCode", ctx, tenantID, "crm").Return(existing, nil).Once()

		app, err := service.CreateTenantApplication(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateTenantApplicationRequest{
			TenantID:  uuid.New(),
			AppCode:   "hrm",
			CreatedBy: uuid.New(),
		}

		mockRepo.On("GetByAppCode", ctx, req.TenantID, "hrm").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantApplication")).Return(errors.New("db error")).Once()

		app, err := service.CreateTenantApplication(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantApplicationService_UpdateTenantApplication(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		appID := uuid.New()
		existing := &models.TenantApplication{
			ID:          appID,
			LicenseType: "TRIAL",
			MaxUsers:    10,
			Version:     1,
		}

		newLicense := "PROFESSIONAL"
		newMaxUsers := 100
		expiresAt := time.Now().Add(90 * 24 * time.Hour).Format(time.RFC3339)
		req := UpdateTenantApplicationRequest{
			LicenseType: &newLicense,
			MaxUsers:    &newMaxUsers,
			ExpiresAt:   &expiresAt,
			Settings: map[string]interface{}{
				"feature_x": true,
			},
			UpdatedBy: uuid.New(),
		}

		mockRepo.On("GetByID", ctx, appID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantApplication")).Return(nil).Once()

		app, err := service.UpdateTenantApplication(ctx, appID, req)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, "PROFESSIONAL", app.LicenseType)
		assert.Equal(t, 100, app.MaxUsers)
		assert.NotNil(t, app.ExpiresAt)
		assert.NotNil(t, app.Settings)
		assert.Equal(t, 2, app.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("application not found", func(t *testing.T) {
		appID := uuid.New()
		req := UpdateTenantApplicationRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, appID).Return(nil, errors.New("not found")).Once()

		app, err := service.UpdateTenantApplication(ctx, appID, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantApplicationService_ActivateApplication(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		appID := uuid.New()
		existing := &models.TenantApplication{
			ID:       appID,
			IsActive: false,
			Version:  1,
		}

		mockRepo.On("GetByID", ctx, appID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantApplication")).Return(nil).Once()

		app, err := service.ActivateApplication(ctx, appID)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.True(t, app.IsActive)
		assert.NotNil(t, app.ActivatedAt)
		assert.Nil(t, app.DeactivatedAt)
		assert.Equal(t, 2, app.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("already active", func(t *testing.T) {
		appID := uuid.New()
		now := time.Now()
		existing := &models.TenantApplication{
			ID:          appID,
			IsActive:    true,
			ActivatedAt: &now,
		}

		mockRepo.On("GetByID", ctx, appID).Return(existing, nil).Once()

		app, err := service.ActivateApplication(ctx, appID)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.True(t, app.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("application not found", func(t *testing.T) {
		appID := uuid.New()

		mockRepo.On("GetByID", ctx, appID).Return(nil, errors.New("not found")).Once()

		app, err := service.ActivateApplication(ctx, appID)

		assert.Error(t, err)
		assert.Nil(t, app)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantApplicationService_DeactivateApplication(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		appID := uuid.New()
		now := time.Now()
		existing := &models.TenantApplication{
			ID:          appID,
			IsActive:    true,
			ActivatedAt: &now,
			Version:     1,
		}

		mockRepo.On("GetByID", ctx, appID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantApplication")).Return(nil).Once()

		app, err := service.DeactivateApplication(ctx, appID)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.False(t, app.IsActive)
		assert.NotNil(t, app.DeactivatedAt)
		assert.Equal(t, 2, app.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("already inactive", func(t *testing.T) {
		appID := uuid.New()
		now := time.Now()
		existing := &models.TenantApplication{
			ID:            appID,
			IsActive:      false,
			DeactivatedAt: &now,
		}

		mockRepo.On("GetByID", ctx, appID).Return(existing, nil).Once()

		app, err := service.DeactivateApplication(ctx, appID)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.False(t, app.IsActive)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantApplicationService_DeleteTenantApplication(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		appID := uuid.New()
		existing := &models.TenantApplication{
			ID:       appID,
			IsActive: false,
		}

		mockRepo.On("GetByID", ctx, appID).Return(existing, nil).Once()
		mockRepo.On("Delete", ctx, appID).Return(nil).Once()

		err := service.DeleteTenantApplication(ctx, appID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot delete active application", func(t *testing.T) {
		appID := uuid.New()
		existing := &models.TenantApplication{
			ID:       appID,
			IsActive: true,
		}

		mockRepo.On("GetByID", ctx, appID).Return(existing, nil).Once()

		err := service.DeleteTenantApplication(ctx, appID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete active")
		mockRepo.AssertExpectations(t)
	})

	t.Run("application not found", func(t *testing.T) {
		appID := uuid.New()

		mockRepo.On("GetByID", ctx, appID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteTenantApplication(ctx, appID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantApplicationService_GetByID(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		appID := uuid.New()
		expected := &models.TenantApplication{
			ID:      appID,
			AppCode: "crm",
		}

		mockRepo.On("GetByID", ctx, appID).Return(expected, nil).Once()

		app, err := service.GetByID(ctx, appID)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, appID, app.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		appID := uuid.New()
		mockRepo.On("GetByID", ctx, appID).Return(nil, errors.New("not found")).Once()

		app, err := service.GetByID(ctx, appID)

		assert.Error(t, err)
		assert.Nil(t, app)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantApplicationService_GetByAppCode(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		appCode := "crm"
		expected := &models.TenantApplication{
			ID:       uuid.New(),
			TenantID: tenantID,
			AppCode:  appCode,
		}

		mockRepo.On("GetByAppCode", ctx, tenantID, appCode).Return(expected, nil).Once()

		app, err := service.GetByAppCode(ctx, tenantID, appCode)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, appCode, app.AppCode)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantApplicationService_ListByTenant(t *testing.T) {
	mockRepo := new(MockTenantApplicationRepository)
	service := NewTenantApplicationService(mockRepo)
	ctx := context.Background()

	t.Run("success - all applications", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantApplication{
			{ID: uuid.New(), AppCode: "crm", IsActive: true},
			{ID: uuid.New(), AppCode: "erp", IsActive: false},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, (*bool)(nil), 10, 0).Return(expected, int64(2), nil).Once()

		apps, total, err := service.ListByTenant(ctx, tenantID, nil, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, apps, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - active only", func(t *testing.T) {
		tenantID := uuid.New()
		isActive := true
		expected := []*models.TenantApplication{
			{ID: uuid.New(), AppCode: "crm", IsActive: true},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, &isActive, 10, 0).Return(expected, int64(1), nil).Once()

		apps, total, err := service.ListByTenant(ctx, tenantID, &isActive, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, apps, 1)
		assert.Equal(t, int64(1), total)
		assert.True(t, apps[0].IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - inactive only", func(t *testing.T) {
		tenantID := uuid.New()
		isActive := false
		expected := []*models.TenantApplication{
			{ID: uuid.New(), AppCode: "erp", IsActive: false},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, &isActive, 10, 0).Return(expected, int64(1), nil).Once()

		apps, total, err := service.ListByTenant(ctx, tenantID, &isActive, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, apps, 1)
		assert.False(t, apps[0].IsActive)
		mockRepo.AssertExpectations(t)
	})
}

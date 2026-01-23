package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang-backend/internal/models"
)

// MockAppCapabilityRepository is a mock of AppCapabilityRepository
type MockAppCapabilityRepository struct {
	mock.Mock
}

func (m *MockAppCapabilityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AppCapability, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AppCapability), args.Error(1)
}

func (m *MockAppCapabilityRepository) List(ctx context.Context, page, pageSize int, tenantID, appID *uuid.UUID, capabilityType *string) ([]*models.AppCapability, int, error) {
	args := m.Called(ctx, page, pageSize, tenantID, appID, capabilityType)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.AppCapability), args.Int(1), args.Error(2)
}

func (m *MockAppCapabilityRepository) ListByApp(ctx context.Context, appID uuid.UUID) ([]*models.AppCapability, error) {
	args := m.Called(ctx, appID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AppCapability), args.Error(1)
}

func (m *MockAppCapabilityRepository) Create(ctx context.Context, capability *models.AppCapability) error {
	args := m.Called(ctx, capability)
	return args.Error(0)
}

func (m *MockAppCapabilityRepository) Update(ctx context.Context, capability *models.AppCapability) error {
	args := m.Called(ctx, capability)
	return args.Error(0)
}

func (m *MockAppCapabilityRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockAppCapabilityRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	args := m.Called(ctx, id, deletedBy)
	return args.Error(0)
}

func TestAppCapabilityService_CreateCapability(t *testing.T) {
	mockRepo := new(MockAppCapabilityRepository)
	service := NewAppCapabilityService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		req := &models.CreateAppCapabilityRequest{
			TenantID: uuid.New(),
			AppID:    uuid.New(),
			Code:     "api_access",
			Name:     "API Access",
			Type:     "FEATURE",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AppCapability")).Return(nil).Once()

		capability, err := service.CreateCapability(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, capability)
		assert.Equal(t, "api_access", capability.Code)
		assert.Equal(t, "API Access", capability.Name)
		assert.Equal(t, "FEATURE", capability.Type)
		assert.Equal(t, "active", capability.Status)
		assert.Equal(t, 0, capability.DisplayOrder) // Default
		assert.False(t, capability.IsRequired)     // Default
		assert.Equal(t, 1, capability.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full details", func(t *testing.T) {
		displayOrder := 10
		isRequired := true
		description := "Allows API access"
		defaultValue := "true"
		req := &models.CreateAppCapabilityRequest{
			TenantID:     uuid.New(),
			AppID:        uuid.New(),
			Code:         "sso_login",
			Name:         "SSO Login",
			Description:  &description,
			Type:         "INTEGRATION",
			DefaultValue: &defaultValue,
			DisplayOrder: &displayOrder,
			IsRequired:   &isRequired,
			ValidationRules: map[string]interface{}{
				"min_value": 1,
				"max_value": 100,
			},
			Metadata: map[string]interface{}{
				"category": "authentication",
			},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AppCapability")).Return(nil).Once()

		capability, err := service.CreateCapability(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, capability)
		assert.Equal(t, "SSO Login", capability.Name)
		assert.Equal(t, &description, capability.Description)
		assert.Equal(t, 10, capability.DisplayOrder)
		assert.True(t, capability.IsRequired)
		assert.NotNil(t, capability.ValidationRules)
		assert.NotNil(t, capability.Metadata)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateAppCapabilityRequest{
			TenantID: uuid.New(),
			AppID:    uuid.New(),
			Code:     "test",
			Name:     "Test",
			Type:     "FEATURE",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AppCapability")).Return(errors.New("db error")).Once()

		capability, err := service.CreateCapability(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, capability)
		mockRepo.AssertExpectations(t)
	})
}

func TestAppCapabilityService_GetCapability(t *testing.T) {
	mockRepo := new(MockAppCapabilityRepository)
	service := NewAppCapabilityService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		capabilityID := uuid.New()
		expected := &models.AppCapability{
			ID:   capabilityID,
			Code: "api_access",
		}

		mockRepo.On("GetByID", ctx, capabilityID).Return(expected, nil).Once()

		capability, err := service.GetCapability(ctx, capabilityID)

		assert.NoError(t, err)
		assert.NotNil(t, capability)
		assert.Equal(t, capabilityID, capability.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		capabilityID := uuid.New()
		mockRepo.On("GetByID", ctx, capabilityID).Return(nil, errors.New("not found")).Once()

		capability, err := service.GetCapability(ctx, capabilityID)

		assert.Error(t, err)
		assert.Nil(t, capability)
		mockRepo.AssertExpectations(t)
	})
}

func TestAppCapabilityService_ListCapabilities(t *testing.T) {
	mockRepo := new(MockAppCapabilityRepository)
	service := NewAppCapabilityService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filters", func(t *testing.T) {
		expected := []*models.AppCapability{
			{ID: uuid.New(), Code: "cap1"},
			{ID: uuid.New(), Code: "cap2"},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*string)(nil)).
			Return(expected, 2, nil).Once()

		capabilities, total, err := service.ListCapabilities(ctx, 1, 10, nil, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, capabilities, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with tenant filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.AppCapability{
			{ID: uuid.New(), TenantID: tenantID},
		}

		mockRepo.On("List", ctx, 1, 10, &tenantID, (*uuid.UUID)(nil), (*string)(nil)).
			Return(expected, 1, nil).Once()

		capabilities, total, err := service.ListCapabilities(ctx, 1, 10, &tenantID, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, capabilities, 1)
		assert.Equal(t, 1, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with app filter", func(t *testing.T) {
		appID := uuid.New()
		expected := []*models.AppCapability{
			{ID: uuid.New(), AppID: appID},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), &appID, (*string)(nil)).
			Return(expected, 1, nil).Once()

		capabilities, total, err := service.ListCapabilities(ctx, 1, 10, nil, &appID, nil)

		assert.NoError(t, err)
		assert.Len(t, capabilities, 1)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with type filter", func(t *testing.T) {
		capType := "FEATURE"
		expected := []*models.AppCapability{
			{ID: uuid.New(), Type: "FEATURE"},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), &capType).
			Return(expected, 1, nil).Once()

		capabilities, total, err := service.ListCapabilities(ctx, 1, 10, nil, nil, &capType)

		assert.NoError(t, err)
		assert.Len(t, capabilities, 1)
		mockRepo.AssertExpectations(t)
	})
}

func TestAppCapabilityService_ListCapabilitiesByApp(t *testing.T) {
	mockRepo := new(MockAppCapabilityRepository)
	service := NewAppCapabilityService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		appID := uuid.New()
		expected := []*models.AppCapability{
			{ID: uuid.New(), AppID: appID},
			{ID: uuid.New(), AppID: appID},
		}

		mockRepo.On("ListByApp", ctx, appID).Return(expected, nil).Once()

		capabilities, err := service.ListCapabilitiesByApp(ctx, appID)

		assert.NoError(t, err)
		assert.Len(t, capabilities, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestAppCapabilityService_UpdateCapability(t *testing.T) {
	mockRepo := new(MockAppCapabilityRepository)
	service := NewAppCapabilityService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		capabilityID := uuid.New()
		existing := &models.AppCapability{
			ID:           capabilityID,
			Name:         "Old Name",
			DisplayOrder: 0,
			IsRequired:   false,
		}

		newName := "New Name"
		newDescription := "Updated description"
		newDisplayOrder := 5
		newIsRequired := true
		newStatus := "inactive"
		req := &models.UpdateAppCapabilityRequest{
			Name:         &newName,
			Description:  &newDescription,
			DisplayOrder: &newDisplayOrder,
			IsRequired:   &newIsRequired,
			Status:       &newStatus,
			ValidationRules: map[string]interface{}{
				"required": true,
			},
			Metadata: map[string]interface{}{
				"updated": true,
			},
		}

		mockRepo.On("GetByID", ctx, capabilityID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.AppCapability")).Return(nil).Once()

		capability, err := service.UpdateCapability(ctx, capabilityID, req)

		assert.NoError(t, err)
		assert.Equal(t, "New Name", capability.Name)
		assert.Equal(t, &newDescription, capability.Description)
		assert.Equal(t, 5, capability.DisplayOrder)
		assert.True(t, capability.IsRequired)
		assert.Equal(t, "inactive", capability.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("capability not found", func(t *testing.T) {
		capabilityID := uuid.New()
		req := &models.UpdateAppCapabilityRequest{}

		mockRepo.On("GetByID", ctx, capabilityID).Return(nil, errors.New("not found")).Once()

		capability, err := service.UpdateCapability(ctx, capabilityID, req)

		assert.Error(t, err)
		assert.Nil(t, capability)
		mockRepo.AssertExpectations(t)
	})
}

func TestAppCapabilityService_DeleteCapability(t *testing.T) {
	mockRepo := new(MockAppCapabilityRepository)
	service := NewAppCapabilityService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		capabilityID := uuid.New()

		mockRepo.On("Delete", ctx, capabilityID).Return(nil).Once()

		err := service.DeleteCapability(ctx, capabilityID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		capabilityID := uuid.New()

		mockRepo.On("Delete", ctx, capabilityID).Return(errors.New("db error")).Once()

		err := service.DeleteCapability(ctx, capabilityID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestAppCapabilityService_SoftDeleteCapability(t *testing.T) {
	mockRepo := new(MockAppCapabilityRepository)
	service := NewAppCapabilityService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		capabilityID := uuid.New()
		deletedBy := uuid.New()

		mockRepo.On("SoftDelete", ctx, capabilityID, deletedBy).Return(nil).Once()

		err := service.SoftDeleteCapability(ctx, capabilityID, deletedBy)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		capabilityID := uuid.New()
		deletedBy := uuid.New()

		mockRepo.On("SoftDelete", ctx, capabilityID, deletedBy).Return(errors.New("db error")).Once()

		err := service.SoftDeleteCapability(ctx, capabilityID, deletedBy)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

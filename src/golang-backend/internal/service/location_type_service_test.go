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

// MockLocationTypeRepository is a mock of LocationTypeRepository
type MockLocationTypeRepository struct {
	mock.Mock
}

func (m *MockLocationTypeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.LocationType, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LocationType), args.Error(1)
}

func (m *MockLocationTypeRepository) GetByCode(ctx context.Context, code string) (*models.LocationType, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LocationType), args.Error(1)
}

func (m *MockLocationTypeRepository) List(ctx context.Context, page, pageSize int, tenantID *uuid.UUID) ([]*models.LocationType, int, error) {
	args := m.Called(ctx, page, pageSize, tenantID)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.LocationType), args.Int(1), args.Error(2)
}

func (m *MockLocationTypeRepository) ListActive(ctx context.Context) ([]*models.LocationType, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.LocationType), args.Error(1)
}

func (m *MockLocationTypeRepository) Create(ctx context.Context, locationType *models.LocationType) error {
	args := m.Called(ctx, locationType)
	return args.Error(0)
}

func (m *MockLocationTypeRepository) Update(ctx context.Context, locationType *models.LocationType) error {
	args := m.Called(ctx, locationType)
	return args.Error(0)
}

func (m *MockLocationTypeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestLocationTypeService_CreateLocationType(t *testing.T) {
	mockRepo := new(MockLocationTypeRepository)
	service := NewLocationTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success with full data", func(t *testing.T) {
		tenantID := uuid.New()
		description := "Office locations"
		extraFields := map[string]interface{}{
			"capacity":  100,
			"hasParking": true,
		}
		req := &models.CreateLocationTypeRequest{
			TenantID:    &tenantID,
			Code:        "office",
			Name:        "Office",
			Description: &description,
			ExtraFields: extraFields,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.LocationType")).Return(nil).Once()

		locationType, err := service.CreateLocationType(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, locationType)
		assert.Equal(t, "office", locationType.Code)
		assert.Equal(t, "Office", locationType.Name)
		assert.False(t, locationType.IsSystem) // Default
		assert.True(t, locationType.IsActive)  // Default
		assert.Equal(t, 1, locationType.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success without optional fields", func(t *testing.T) {
		req := &models.CreateLocationTypeRequest{
			Code: "warehouse",
			Name: "Warehouse",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.LocationType")).Return(nil).Once()

		locationType, err := service.CreateLocationType(ctx, req)

		assert.NoError(t, err)
		assert.Nil(t, locationType.TenantID)
		assert.Nil(t, locationType.Description)
		assert.Nil(t, locationType.ExtraFields)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateLocationTypeRequest{
			Code: "store",
			Name: "Store",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.LocationType")).Return(errors.New("db error")).Once()

		locationType, err := service.CreateLocationType(ctx, req)

		assert.Error(t, err)
		assert.NotNil(t, locationType) // Service returns object even on error
		mockRepo.AssertExpectations(t)
	})
}

func TestLocationTypeService_GetLocationType(t *testing.T) {
	mockRepo := new(MockLocationTypeRepository)
	service := NewLocationTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		locationTypeID := uuid.New()
		expected := &models.LocationType{
			ID:   locationTypeID,
			Code: "office",
			Name: "Office",
		}

		mockRepo.On("GetByID", ctx, locationTypeID).Return(expected, nil).Once()

		locationType, err := service.GetLocationType(ctx, locationTypeID)

		assert.NoError(t, err)
		assert.NotNil(t, locationType)
		assert.Equal(t, locationTypeID, locationType.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		locationTypeID := uuid.New()
		mockRepo.On("GetByID", ctx, locationTypeID).Return(nil, errors.New("not found")).Once()

		locationType, err := service.GetLocationType(ctx, locationTypeID)

		assert.Error(t, err)
		assert.Nil(t, locationType)
		mockRepo.AssertExpectations(t)
	})
}

func TestLocationTypeService_GetLocationTypeByCode(t *testing.T) {
	mockRepo := new(MockLocationTypeRepository)
	service := NewLocationTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := &models.LocationType{
			ID:   uuid.New(),
			Code: "office",
			Name: "Office",
		}

		mockRepo.On("GetByCode", ctx, "office").Return(expected, nil).Once()

		locationType, err := service.GetLocationTypeByCode(ctx, "office")

		assert.NoError(t, err)
		assert.NotNil(t, locationType)
		assert.Equal(t, "office", locationType.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, "factory").Return(nil, errors.New("not found")).Once()

		locationType, err := service.GetLocationTypeByCode(ctx, "factory")

		assert.Error(t, err)
		assert.Nil(t, locationType)
		mockRepo.AssertExpectations(t)
	})
}

func TestLocationTypeService_ListLocationTypes(t *testing.T) {
	mockRepo := new(MockLocationTypeRepository)
	service := NewLocationTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filter", func(t *testing.T) {
		expected := []*models.LocationType{
			{ID: uuid.New(), Code: "office"},
			{ID: uuid.New(), Code: "warehouse"},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil)).Return(expected, 2, nil).Once()

		locationTypes, total, err := service.ListLocationTypes(ctx, 1, 10, nil)

		assert.NoError(t, err)
		assert.Len(t, locationTypes, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with tenant filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.LocationType{
			{ID: uuid.New(), TenantID: &tenantID, Code: "office"},
		}

		mockRepo.On("List", ctx, 1, 10, &tenantID).Return(expected, 1, nil).Once()

		locationTypes, total, err := service.ListLocationTypes(ctx, 1, 10, &tenantID)

		assert.NoError(t, err)
		assert.Len(t, locationTypes, 1)
		assert.Equal(t, 1, total)
		mockRepo.AssertExpectations(t)
	})
}

func TestLocationTypeService_ListActiveLocationTypes(t *testing.T) {
	mockRepo := new(MockLocationTypeRepository)
	service := NewLocationTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := []*models.LocationType{
			{ID: uuid.New(), Code: "office", IsActive: true},
			{ID: uuid.New(), Code: "warehouse", IsActive: true},
		}

		mockRepo.On("ListActive", ctx).Return(expected, nil).Once()

		locationTypes, err := service.ListActiveLocationTypes(ctx)

		assert.NoError(t, err)
		assert.Len(t, locationTypes, 2)
		for _, lt := range locationTypes {
			assert.True(t, lt.IsActive)
		}
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		mockRepo.On("ListActive", ctx).Return([]*models.LocationType{}, nil).Once()

		locationTypes, err := service.ListActiveLocationTypes(ctx)

		assert.NoError(t, err)
		assert.Empty(t, locationTypes)
		mockRepo.AssertExpectations(t)
	})
}

func TestLocationTypeService_UpdateLocationType(t *testing.T) {
	mockRepo := new(MockLocationTypeRepository)
	service := NewLocationTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success - update all fields", func(t *testing.T) {
		locationTypeID := uuid.New()
		existing := &models.LocationType{
			ID:       locationTypeID,
			Name:     "Old Name",
			IsActive: true,
		}

		newName := "New Name"
		newDescription := "Updated description"
		newExtraFields := map[string]interface{}{
			"capacity": 200,
		}
		isActive := false
		req := &models.UpdateLocationTypeRequest{
			Name:        &newName,
			Description: &newDescription,
			ExtraFields: newExtraFields,
			IsActive:    &isActive,
		}

		mockRepo.On("GetByID", ctx, locationTypeID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.LocationType")).Return(nil).Once()

		locationType, err := service.UpdateLocationType(ctx, locationTypeID, req)

		assert.NoError(t, err)
		assert.Equal(t, "New Name", locationType.Name)
		assert.Equal(t, &newDescription, locationType.Description)
		assert.Equal(t, newExtraFields, locationType.ExtraFields)
		assert.False(t, locationType.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - partial update", func(t *testing.T) {
		locationTypeID := uuid.New()
		existing := &models.LocationType{
			ID:       locationTypeID,
			Name:     "Original Name",
			IsActive: true,
		}

		newName := "Updated Name"
		req := &models.UpdateLocationTypeRequest{
			Name: &newName,
			// Other fields not updated
		}

		mockRepo.On("GetByID", ctx, locationTypeID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.LocationType")).Return(nil).Once()

		locationType, err := service.UpdateLocationType(ctx, locationTypeID, req)

		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", locationType.Name)
		assert.True(t, locationType.IsActive) // Unchanged
		mockRepo.AssertExpectations(t)
	})

	t.Run("location type not found", func(t *testing.T) {
		locationTypeID := uuid.New()
		req := &models.UpdateLocationTypeRequest{}

		mockRepo.On("GetByID", ctx, locationTypeID).Return(nil, errors.New("not found")).Once()

		locationType, err := service.UpdateLocationType(ctx, locationTypeID, req)

		assert.Error(t, err)
		assert.Nil(t, locationType)
		mockRepo.AssertExpectations(t)
	})
}

func TestLocationTypeService_DeleteLocationType(t *testing.T) {
	mockRepo := new(MockLocationTypeRepository)
	service := NewLocationTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		locationTypeID := uuid.New()

		mockRepo.On("Delete", ctx, locationTypeID).Return(nil).Once()

		err := service.DeleteLocationType(ctx, locationTypeID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		locationTypeID := uuid.New()

		mockRepo.On("Delete", ctx, locationTypeID).Return(errors.New("db error")).Once()

		err := service.DeleteLocationType(ctx, locationTypeID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

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

// MockSaaSProductTypeRepository is a mock of SaaSProductTypeRepository
type MockSaaSProductTypeRepository struct {
	mock.Mock
}

func (m *MockSaaSProductTypeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SaaSProductType, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SaaSProductType), args.Error(1)
}

func (m *MockSaaSProductTypeRepository) GetByCode(ctx context.Context, code string) (*models.SaaSProductType, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SaaSProductType), args.Error(1)
}

func (m *MockSaaSProductTypeRepository) List(ctx context.Context, page, pageSize int) ([]*models.SaaSProductType, int, error) {
	args := m.Called(ctx, page, pageSize)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.SaaSProductType), args.Int(1), args.Error(2)
}

func (m *MockSaaSProductTypeRepository) ListActive(ctx context.Context) ([]*models.SaaSProductType, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.SaaSProductType), args.Error(1)
}

func (m *MockSaaSProductTypeRepository) Create(ctx context.Context, productType *models.SaaSProductType) error {
	args := m.Called(ctx, productType)
	return args.Error(0)
}

func (m *MockSaaSProductTypeRepository) Update(ctx context.Context, productType *models.SaaSProductType) error {
	args := m.Called(ctx, productType)
	return args.Error(0)
}

func (m *MockSaaSProductTypeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestSaaSProductTypeService_CreateProductType(t *testing.T) {
	mockRepo := new(MockSaaSProductTypeRepository)
	service := NewSaaSProductTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		desc := "Subscription-based products"
		req := &models.CreateSaaSProductTypeRequest{
			Code:        "SUBSCRIPTION",
			Name:        "Subscription",
			Description: &desc,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SaaSProductType")).Return(nil).Once()

		productType, err := service.CreateProductType(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, productType)
		assert.Equal(t, "SUBSCRIPTION", productType.Code)
		assert.Equal(t, "Subscription", productType.Name)
		assert.True(t, productType.IsActive)
		assert.Equal(t, 1, productType.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateSaaSProductTypeRequest{
			Code: "TEST",
			Name: "Test Type",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SaaSProductType")).Return(errors.New("db error")).Once()

		productType, err := service.CreateProductType(ctx, req)

		assert.Error(t, err)
		assert.NotNil(t, productType) // Service returns product even on error
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductTypeService_GetProductType(t *testing.T) {
	mockRepo := new(MockSaaSProductTypeRepository)
	service := NewSaaSProductTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		productTypeID := uuid.New()
		expectedType := &models.SaaSProductType{
			ID:       productTypeID,
			Code:     "SUBSCRIPTION",
			Name:     "Subscription",
			IsActive: true,
		}

		mockRepo.On("GetByID", ctx, productTypeID).Return(expectedType, nil).Once()

		productType, err := service.GetProductType(ctx, productTypeID)

		assert.NoError(t, err)
		assert.NotNil(t, productType)
		assert.Equal(t, "SUBSCRIPTION", productType.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		productTypeID := uuid.New()
		mockRepo.On("GetByID", ctx, productTypeID).Return(nil, errors.New("not found")).Once()

		productType, err := service.GetProductType(ctx, productTypeID)

		assert.Error(t, err)
		assert.Nil(t, productType)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductTypeService_GetProductTypeByCode(t *testing.T) {
	mockRepo := new(MockSaaSProductTypeRepository)
	service := NewSaaSProductTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expectedType := &models.SaaSProductType{
			ID:       uuid.New(),
			Code:     "SUBSCRIPTION",
			Name:     "Subscription",
			IsActive: true,
		}

		mockRepo.On("GetByCode", ctx, "SUBSCRIPTION").Return(expectedType, nil).Once()

		productType, err := service.GetProductTypeByCode(ctx, "SUBSCRIPTION")

		assert.NoError(t, err)
		assert.NotNil(t, productType)
		assert.Equal(t, "SUBSCRIPTION", productType.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, "UNKNOWN").Return(nil, errors.New("not found")).Once()

		productType, err := service.GetProductTypeByCode(ctx, "UNKNOWN")

		assert.Error(t, err)
		assert.Nil(t, productType)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductTypeService_ListProductTypes(t *testing.T) {
	mockRepo := new(MockSaaSProductTypeRepository)
	service := NewSaaSProductTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success with pagination", func(t *testing.T) {
		expectedTypes := []*models.SaaSProductType{
			{ID: uuid.New(), Code: "SUBSCRIPTION", Name: "Subscription"},
			{ID: uuid.New(), Code: "ONE_TIME", Name: "One Time Purchase"},
		}

		mockRepo.On("List", ctx, 1, 10).Return(expectedTypes, 2, nil).Once()

		productTypes, total, err := service.ListProductTypes(ctx, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, productTypes, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		mockRepo.On("List", ctx, 1, 10).Return([]*models.SaaSProductType{}, 0, nil).Once()

		productTypes, total, err := service.ListProductTypes(ctx, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, productTypes, 0)
		assert.Equal(t, 0, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, 1, 10).Return(nil, 0, errors.New("db error")).Once()

		productTypes, total, err := service.ListProductTypes(ctx, 1, 10)

		assert.Error(t, err)
		assert.Nil(t, productTypes)
		assert.Equal(t, 0, total)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductTypeService_ListActiveProductTypes(t *testing.T) {
	mockRepo := new(MockSaaSProductTypeRepository)
	service := NewSaaSProductTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expectedTypes := []*models.SaaSProductType{
			{ID: uuid.New(), Code: "SUBSCRIPTION", IsActive: true},
			{ID: uuid.New(), Code: "ONE_TIME", IsActive: true},
		}

		mockRepo.On("ListActive", ctx).Return(expectedTypes, nil).Once()

		productTypes, err := service.ListActiveProductTypes(ctx)

		assert.NoError(t, err)
		assert.Len(t, productTypes, 2)
		assert.True(t, productTypes[0].IsActive)
		assert.True(t, productTypes[1].IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		mockRepo.On("ListActive", ctx).Return([]*models.SaaSProductType{}, nil).Once()

		productTypes, err := service.ListActiveProductTypes(ctx)

		assert.NoError(t, err)
		assert.Len(t, productTypes, 0)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("ListActive", ctx).Return(nil, errors.New("db error")).Once()

		productTypes, err := service.ListActiveProductTypes(ctx)

		assert.Error(t, err)
		assert.Nil(t, productTypes)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductTypeService_UpdateProductType(t *testing.T) {
	mockRepo := new(MockSaaSProductTypeRepository)
	service := NewSaaSProductTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success - update name", func(t *testing.T) {
		productTypeID := uuid.New()
		existingType := &models.SaaSProductType{
			ID:       productTypeID,
			Code:     "SUBSCRIPTION",
			Name:     "Old Name",
			IsActive: true,
		}

		newName := "New Subscription Name"
		req := &models.UpdateSaaSProductTypeRequest{
			Name: &newName,
		}

		mockRepo.On("GetByID", ctx, productTypeID).Return(existingType, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProductType")).Return(nil).Once()

		productType, err := service.UpdateProductType(ctx, productTypeID, req)

		assert.NoError(t, err)
		assert.NotNil(t, productType)
		assert.Equal(t, "New Subscription Name", productType.Name)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - update description", func(t *testing.T) {
		productTypeID := uuid.New()
		existingType := &models.SaaSProductType{
			ID:   productTypeID,
			Code: "ONE_TIME",
			Name: "One Time",
		}

		newDesc := "Updated description"
		req := &models.UpdateSaaSProductTypeRequest{
			Description: &newDesc,
		}

		mockRepo.On("GetByID", ctx, productTypeID).Return(existingType, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProductType")).Return(nil).Once()

		productType, err := service.UpdateProductType(ctx, productTypeID, req)

		assert.NoError(t, err)
		assert.NotNil(t, productType)
		assert.Equal(t, &newDesc, productType.Description)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - update is_active", func(t *testing.T) {
		productTypeID := uuid.New()
		existingType := &models.SaaSProductType{
			ID:       productTypeID,
			Code:     "TEST",
			Name:     "Test",
			IsActive: true,
		}

		isActive := false
		req := &models.UpdateSaaSProductTypeRequest{
			IsActive: &isActive,
		}

		mockRepo.On("GetByID", ctx, productTypeID).Return(existingType, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProductType")).Return(nil).Once()

		productType, err := service.UpdateProductType(ctx, productTypeID, req)

		assert.NoError(t, err)
		assert.NotNil(t, productType)
		assert.False(t, productType.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - update multiple fields", func(t *testing.T) {
		productTypeID := uuid.New()
		existingType := &models.SaaSProductType{
			ID:       productTypeID,
			Code:     "SUBSCRIPTION",
			Name:     "Old Name",
			IsActive: true,
		}

		newName := "Updated Name"
		newDesc := "Updated Description"
		isActive := false
		req := &models.UpdateSaaSProductTypeRequest{
			Name:        &newName,
			Description: &newDesc,
			IsActive:    &isActive,
		}

		mockRepo.On("GetByID", ctx, productTypeID).Return(existingType, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProductType")).Return(nil).Once()

		productType, err := service.UpdateProductType(ctx, productTypeID, req)

		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", productType.Name)
		assert.Equal(t, &newDesc, productType.Description)
		assert.False(t, productType.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("product type not found", func(t *testing.T) {
		productTypeID := uuid.New()
		req := &models.UpdateSaaSProductTypeRequest{}

		mockRepo.On("GetByID", ctx, productTypeID).Return(nil, errors.New("not found")).Once()

		productType, err := service.UpdateProductType(ctx, productTypeID, req)

		assert.Error(t, err)
		assert.Nil(t, productType)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		productTypeID := uuid.New()
		existingType := &models.SaaSProductType{ID: productTypeID}
		req := &models.UpdateSaaSProductTypeRequest{}

		mockRepo.On("GetByID", ctx, productTypeID).Return(existingType, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProductType")).Return(errors.New("db error")).Once()

		productType, err := service.UpdateProductType(ctx, productTypeID, req)

		assert.Error(t, err)
		assert.NotNil(t, productType) // Service returns product even on error
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductTypeService_DeleteProductType(t *testing.T) {
	mockRepo := new(MockSaaSProductTypeRepository)
	service := NewSaaSProductTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		productTypeID := uuid.New()
		mockRepo.On("Delete", ctx, productTypeID).Return(nil).Once()

		err := service.DeleteProductType(ctx, productTypeID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		productTypeID := uuid.New()
		mockRepo.On("Delete", ctx, productTypeID).Return(errors.New("db error")).Once()

		err := service.DeleteProductType(ctx, productTypeID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		productTypeID := uuid.New()
		mockRepo.On("Delete", ctx, productTypeID).Return(errors.New("not found")).Once()

		err := service.DeleteProductType(ctx, productTypeID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

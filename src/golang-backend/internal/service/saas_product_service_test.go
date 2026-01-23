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

// MockSaaSProductRepository is a mock of SaaSProductRepository
type MockSaaSProductRepository struct {
	mock.Mock
}

func (m *MockSaaSProductRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SaaSProduct, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SaaSProduct), args.Error(1)
}

func (m *MockSaaSProductRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SaaSProduct, error) {
	args := m.Called(ctx, tenantID, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SaaSProduct), args.Error(1)
}

func (m *MockSaaSProductRepository) ExistsByCode(ctx context.Context, tenantID uuid.UUID, code string) (bool, error) {
	args := m.Called(ctx, tenantID, code)
	return args.Bool(0), args.Error(1)
}

func (m *MockSaaSProductRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, isFeatured bool, limit, offset int) ([]*models.SaaSProduct, int64, error) {
	args := m.Called(ctx, tenantID, status, isFeatured, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.SaaSProduct), args.Get(1).(int64), args.Error(2)
}

func (m *MockSaaSProductRepository) GetPublicProducts(ctx context.Context, tenantID uuid.UUID) ([]*models.SaaSProduct, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.SaaSProduct), args.Error(1)
}

func (m *MockSaaSProductRepository) Create(ctx context.Context, product *models.SaaSProduct) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockSaaSProductRepository) Update(ctx context.Context, product *models.SaaSProduct) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockSaaSProductRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockCache is a mock of Cache
type MockCache struct {
	mock.Mock
}

func (m *MockCache) GetJSON(ctx context.Context, key string, dest interface{}) error {
	args := m.Called(ctx, key, dest)
	return args.Error(0)
}

func (m *MockCache) SetJSON(ctx context.Context, key string, value interface{}, ttl int) error {
	args := m.Called(ctx, key, value, ttl)
	return args.Error(0)
}

func (m *MockCache) Delete(ctx context.Context, key string) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func TestSaaSProductService_GetByID(t *testing.T) {
	mockRepo := new(MockSaaSProductRepository)
	mockCache := new(MockCache)
	service := NewSaaSProductService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success - from cache", func(t *testing.T) {
		productID := uuid.New()
		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(nil).Once()

		product, err := service.GetByID(ctx, productID)

		// Product will be empty since we're testing cache hit
		assert.NoError(t, err)
		assert.NotNil(t, product)
		mockCache.AssertExpectations(t)
	})

	t.Run("success - from database", func(t *testing.T) {
		productID := uuid.New()
		expectedProduct := &models.SaaSProduct{
			ID:       productID,
			Code:     "premium",
			Name:     "Premium Plan",
			Status:   "active",
			Currency: "VND",
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, productID).Return(expectedProduct, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, expectedProduct, mock.Anything).Return(nil).Once()

		product, err := service.GetByID(ctx, productID)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, "premium", product.Code)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		productID := uuid.New()

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, productID).Return(nil, errors.New("not found")).Once()

		product, err := service.GetByID(ctx, productID)

		assert.Error(t, err)
		assert.Nil(t, product)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

func TestSaaSProductService_GetByCode(t *testing.T) {
	mockRepo := new(MockSaaSProductRepository)
	mockCache := new(MockCache)
	service := NewSaaSProductService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success - from database", func(t *testing.T) {
		tenantID := uuid.New()
		expectedProduct := &models.SaaSProduct{
			ID:       uuid.New(),
			TenantID: tenantID,
			Code:     "premium",
			Name:     "Premium Plan",
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByCode", ctx, tenantID, "premium").Return(expectedProduct, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, expectedProduct, mock.Anything).Return(nil).Once()

		product, err := service.GetByCode(ctx, tenantID, "premium")

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, "premium", product.Code)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		tenantID := uuid.New()

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByCode", ctx, tenantID, "unknown").Return(nil, errors.New("not found")).Once()

		product, err := service.GetByCode(ctx, tenantID, "unknown")

		assert.Error(t, err)
		assert.Nil(t, product)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductService_CreateProduct(t *testing.T) {
	mockRepo := new(MockSaaSProductRepository)
	mockCache := new(MockCache)
	service := NewSaaSProductService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		req := CreateSaaSProductRequest{
			TenantID:  tenantID,
			Code:      "PREMIUM",
			Name:      "Premium Plan",
			BasePrice: 100000,
			CreatedBy: userID,
		}

		mockRepo.On("ExistsByCode", ctx, tenantID, "premium").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SaaSProduct")).Return(nil).Once()

		product, err := service.CreateProduct(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, "premium", product.Code) // Normalized to lowercase
		assert.Equal(t, "VND", product.Currency)
		assert.Equal(t, "MONTHLY", product.BillingCycle)
		assert.Equal(t, "active", product.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with custom values", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		productType := "SUBSCRIPTION"
		req := CreateSaaSProductRequest{
			TenantID:        tenantID,
			Code:            "enterprise",
			Name:            "Enterprise Plan",
			ProductTypeCode: &productType,
			BasePrice:       500000,
			Currency:        "USD",
			BillingCycle:    "YEARLY",
			TrialDays:       30,
			IsFeatured:      true,
			DisplayOrder:    1,
			CreatedBy:       userID,
		}

		mockRepo.On("ExistsByCode", ctx, tenantID, "enterprise").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SaaSProduct")).Return(nil).Once()

		product, err := service.CreateProduct(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, "USD", product.Currency)
		assert.Equal(t, "YEARLY", product.BillingCycle)
		assert.Equal(t, 30, product.TrialDays)
		assert.True(t, product.IsFeatured)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty code", func(t *testing.T) {
		req := CreateSaaSProductRequest{
			TenantID: uuid.New(),
			Code:     "   ",
			Name:     "Test",
		}

		product, err := service.CreateProduct(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "code is required")
	})

	t.Run("duplicate code", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateSaaSProductRequest{
			TenantID:  tenantID,
			Code:      "premium",
			Name:      "Premium Plan",
			BasePrice: 100000,
			CreatedBy: uuid.New(),
		}

		mockRepo.On("ExistsByCode", ctx, tenantID, "premium").Return(true, nil).Once()

		product, err := service.CreateProduct(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateSaaSProductRequest{
			TenantID:  tenantID,
			Code:      "premium",
			Name:      "Premium",
			BasePrice: 100000,
			CreatedBy: uuid.New(),
		}

		mockRepo.On("ExistsByCode", ctx, tenantID, "premium").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SaaSProduct")).Return(errors.New("db error")).Once()

		product, err := service.CreateProduct(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with features and limits", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateSaaSProductRequest{
			TenantID:  tenantID,
			Code:      "pro",
			Name:      "Pro Plan",
			BasePrice: 200000,
			Features: map[string]interface{}{
				"api_access":       true,
				"custom_domain":    true,
				"priority_support": true,
			},
			Limits: map[string]interface{}{
				"max_users":    100,
				"max_storage":  "100GB",
				"max_requests": 10000,
			},
			CreatedBy: uuid.New(),
		}

		mockRepo.On("ExistsByCode", ctx, tenantID, "pro").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SaaSProduct")).Return(nil).Once()

		product, err := service.CreateProduct(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Len(t, product.Features, 3)
		assert.Len(t, product.Limits, 3)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductService_UpdateProduct(t *testing.T) {
	mockRepo := new(MockSaaSProductRepository)
	mockCache := new(MockCache)
	service := NewSaaSProductService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		productID := uuid.New()
		tenantID := uuid.New()
		existingProduct := &models.SaaSProduct{
			ID:           productID,
			TenantID:     tenantID,
			Code:         "premium",
			Name:         "Old Name",
			BasePrice:    100000,
			Currency:     "VND",
			BillingCycle: "MONTHLY",
			Status:       "active",
			Version:      1,
		}

		newName := "Premium Plus"
		newPrice := 150000.0
		req := UpdateSaaSProductRequest{
			Name:      &newName,
			BasePrice: &newPrice,
			UpdatedBy: uuid.New(),
		}

		mockRepo.On("GetByID", ctx, productID).Return(existingProduct, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProduct")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Times(2)

		product, err := service.UpdateProduct(ctx, productID, req)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, "Premium Plus", product.Name)
		assert.Equal(t, 150000.0, product.BasePrice)
		assert.Equal(t, 2, product.Version)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("update status", func(t *testing.T) {
		productID := uuid.New()
		existingProduct := &models.SaaSProduct{
			ID:     productID,
			Status: "active",
		}

		newStatus := "inactive"
		req := UpdateSaaSProductRequest{
			Status:    &newStatus,
			UpdatedBy: uuid.New(),
		}

		mockRepo.On("GetByID", ctx, productID).Return(existingProduct, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProduct")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Times(2)

		product, err := service.UpdateProduct(ctx, productID, req)

		assert.NoError(t, err)
		assert.Equal(t, "inactive", product.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("product not found", func(t *testing.T) {
		productID := uuid.New()
		req := UpdateSaaSProductRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, productID).Return(nil, errors.New("not found")).Once()

		product, err := service.UpdateProduct(ctx, productID, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		productID := uuid.New()
		existingProduct := &models.SaaSProduct{ID: productID}
		req := UpdateSaaSProductRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, productID).Return(existingProduct, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SaaSProduct")).Return(errors.New("db error")).Once()

		product, err := service.UpdateProduct(ctx, productID, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductService_DeleteProduct(t *testing.T) {
	mockRepo := new(MockSaaSProductRepository)
	mockCache := new(MockCache)
	service := NewSaaSProductService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		productID := uuid.New()
		tenantID := uuid.New()
		existingProduct := &models.SaaSProduct{
			ID:       productID,
			TenantID: tenantID,
			Code:     "premium",
		}

		mockRepo.On("GetByID", ctx, productID).Return(existingProduct, nil).Once()
		mockRepo.On("Delete", ctx, productID).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Times(2)

		err := service.DeleteProduct(ctx, productID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("product not found", func(t *testing.T) {
		productID := uuid.New()

		mockRepo.On("GetByID", ctx, productID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteProduct(ctx, productID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		productID := uuid.New()
		existingProduct := &models.SaaSProduct{ID: productID, TenantID: uuid.New(), Code: "test"}

		mockRepo.On("GetByID", ctx, productID).Return(existingProduct, nil).Once()
		mockRepo.On("Delete", ctx, productID).Return(errors.New("db error")).Once()

		err := service.DeleteProduct(ctx, productID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductService_ListByTenant(t *testing.T) {
	mockRepo := new(MockSaaSProductRepository)
	mockCache := new(MockCache)
	service := NewSaaSProductService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expectedProducts := []*models.SaaSProduct{
			{ID: uuid.New(), Code: "basic", Name: "Basic Plan"},
			{ID: uuid.New(), Code: "premium", Name: "Premium Plan"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "active", false, 10, 0).
			Return(expectedProducts, int64(2), nil).Once()

		products, total, err := service.ListByTenant(ctx, tenantID, "active", false, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, products, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("featured only", func(t *testing.T) {
		tenantID := uuid.New()
		expectedProducts := []*models.SaaSProduct{
			{ID: uuid.New(), Code: "premium", IsFeatured: true},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", true, 10, 0).
			Return(expectedProducts, int64(1), nil).Once()

		products, total, err := service.ListByTenant(ctx, tenantID, "", true, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, products, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()

		mockRepo.On("ListByTenant", ctx, tenantID, "", false, 10, 0).
			Return(nil, int64(0), errors.New("db error")).Once()

		products, total, err := service.ListByTenant(ctx, tenantID, "", false, 1, 10)

		assert.Error(t, err)
		assert.Nil(t, products)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestSaaSProductService_GetPublicProducts(t *testing.T) {
	mockRepo := new(MockSaaSProductRepository)
	mockCache := new(MockCache)
	service := NewSaaSProductService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expectedProducts := []*models.SaaSProduct{
			{ID: uuid.New(), Code: "basic", Status: "active"},
			{ID: uuid.New(), Code: "premium", Status: "active"},
		}

		mockRepo.On("GetPublicProducts", ctx, tenantID).Return(expectedProducts, nil).Once()

		products, err := service.GetPublicProducts(ctx, tenantID)

		assert.NoError(t, err)
		assert.Len(t, products, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()

		mockRepo.On("GetPublicProducts", ctx, tenantID).Return(nil, errors.New("db error")).Once()

		products, err := service.GetPublicProducts(ctx, tenantID)

		assert.Error(t, err)
		assert.Nil(t, products)
		mockRepo.AssertExpectations(t)
	})
}

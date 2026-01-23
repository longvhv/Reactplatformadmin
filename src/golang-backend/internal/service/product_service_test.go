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

// MockProductRepository is a mock of ProductRepository
type MockProductRepository struct {
	mock.Mock
}

func (m *MockProductRepository) Create(ctx context.Context, product *models.Product) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockProductRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductRepository) Update(ctx context.Context, product *models.Product) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockProductRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockProductRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.Product, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Product), args.Get(1).(int64), args.Error(2)
}

func (m *MockProductRepository) ExistsByCode(ctx context.Context, tenantID uuid.UUID, code string) (bool, error) {
	args := m.Called(ctx, tenantID, code)
	return args.Bool(0), args.Error(1)
}

func TestProductService_CreateProduct(t *testing.T) {
	mockRepo := new(MockProductRepository)
	mockCache := new(MockCache)
	service := NewProductService(mockRepo, mockCache)

	ctx := context.Background()
	tenantID := uuid.New()
	code := "PROD001"
	name := "Premium Plan"
	productType := "SUBSCRIPTION"
	currency := "USD"
	price := 99.99

	t.Run("success", func(t *testing.T) {
		description := "Premium subscription plan"
		category := "Subscription"

		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Product")).Return(nil).Once()

		req := CreateProductRequest{
			TenantID:    tenantID,
			Name:        name,
			Code:        code,
			Description: &description,
			Type:        productType,
			Category:    &category,
			Price:       price,
			Currency:    currency,
			IsActive:    true,
			IsVisible:   true,
			Features:    []string{"Feature 1", "Feature 2"},
		}

		product, err := service.CreateProduct(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, code, product.Code)
		assert.Equal(t, name, product.Name)
		assert.Equal(t, productType, product.Type)
		assert.Equal(t, price, product.Price)
		assert.Equal(t, currency, product.Currency)
		assert.True(t, product.IsActive)
		assert.True(t, product.IsVisible)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty code", func(t *testing.T) {
		req := CreateProductRequest{
			TenantID: tenantID,
			Name:     name,
			Code:     "",
			Type:     productType,
			Price:    price,
			Currency: currency,
		}

		product, err := service.CreateProduct(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "code is required")
	})

	t.Run("code already exists", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(true, nil).Once()

		req := CreateProductRequest{
			TenantID: tenantID,
			Name:     name,
			Code:     code,
			Type:     productType,
			Price:    price,
			Currency: currency,
		}

		product, err := service.CreateProduct(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on exists check", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, errors.New("db error")).Once()

		req := CreateProductRequest{
			TenantID: tenantID,
			Name:     name,
			Code:     code,
			Type:     productType,
			Price:    price,
			Currency: currency,
		}

		product, err := service.CreateProduct(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "failed to check product code")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Product")).Return(errors.New("db error")).Once()

		req := CreateProductRequest{
			TenantID: tenantID,
			Name:     name,
			Code:     code,
			Type:     productType,
			Price:    price,
			Currency: currency,
		}

		product, err := service.CreateProduct(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "failed to create product")
		mockRepo.AssertExpectations(t)
	})
}

func TestProductService_GetByID(t *testing.T) {
	mockRepo := new(MockProductRepository)
	mockCache := new(MockCache)
	service := NewProductService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success - from cache", func(t *testing.T) {
		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(nil).Once()

		product, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		mockCache.AssertExpectations(t)
	})

	t.Run("success - from database", func(t *testing.T) {
		expectedProduct := &models.Product{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "PROD001",
			Name:     "Premium Plan",
			Type:     "SUBSCRIPTION",
			Price:    99.99,
			Currency: "USD",
			IsActive: true,
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, id).Return(expectedProduct, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, expectedProduct, mock.Anything).Return(nil).Once()

		product, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, id, product.ID)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		product, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, product)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

func TestProductService_ListByTenant(t *testing.T) {
	mockRepo := new(MockProductRepository)
	mockCache := new(MockCache)
	service := NewProductService(mockRepo, mockCache)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		expectedProducts := []*models.Product{
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "PROD001",
				Name:     "Basic Plan",
				Type:     "SUBSCRIPTION",
				Price:    49.99,
				Currency: "USD",
				IsActive: true,
			},
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "PROD002",
				Name:     "Premium Plan",
				Type:     "SUBSCRIPTION",
				Price:    99.99,
				Currency: "USD",
				IsActive: true,
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(expectedProducts, int64(2), nil).Once()

		products, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, products)
		assert.Len(t, products, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return([]*models.Product{}, int64(0), nil).Once()

		products, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, products)
		assert.Len(t, products, 0)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		products, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, products)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestProductService_UpdateProduct(t *testing.T) {
	mockRepo := new(MockProductRepository)
	mockCache := new(MockCache)
	service := NewProductService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingProduct := &models.Product{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "PROD001",
			Name:     "Old Name",
			Type:     "SUBSCRIPTION",
			Price:    49.99,
			Currency: "USD",
			IsActive: true,
		}

		newName := "New Name"
		newPrice := 59.99
		isActive := false

		mockRepo.On("GetByID", ctx, id).Return(existingProduct, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Product")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		req := UpdateProductRequest{
			Name:     &newName,
			Price:    &newPrice,
			IsActive: &isActive,
		}

		product, err := service.UpdateProduct(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, newName, product.Name)
		assert.Equal(t, newPrice, product.Price)
		assert.False(t, product.IsActive)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("product not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newName := "New Name"
		req := UpdateProductRequest{
			Name: &newName,
		}

		product, err := service.UpdateProduct(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingProduct := &models.Product{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "PROD001",
			Name:     "Old Name",
			Type:     "SUBSCRIPTION",
			Price:    49.99,
			Currency: "USD",
		}

		newName := "New Name"

		mockRepo.On("GetByID", ctx, id).Return(existingProduct, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Product")).Return(errors.New("db error")).Once()

		req := UpdateProductRequest{
			Name: &newName,
		}

		product, err := service.UpdateProduct(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, product)
		assert.Contains(t, err.Error(), "failed to update product")
		mockRepo.AssertExpectations(t)
	})

	t.Run("update all fields", func(t *testing.T) {
		existingProduct := &models.Product{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "PROD001",
			Name:     "Old Name",
			Type:     "SUBSCRIPTION",
			Price:    49.99,
			Currency: "USD",
			IsActive: true,
		}

		newName := "New Name"
		newDesc := "New Description"
		newType := "ONE_TIME"
		newCategory := "Premium"
		newPrice := 199.99
		newCurrency := "EUR"
		isActive := false
		isVisible := true
		features := []string{"Feature A", "Feature B"}

		mockRepo.On("GetByID", ctx, id).Return(existingProduct, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Product")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		req := UpdateProductRequest{
			Name:        &newName,
			Description: &newDesc,
			Type:        &newType,
			Category:    &newCategory,
			Price:       &newPrice,
			Currency:    &newCurrency,
			IsActive:    &isActive,
			IsVisible:   &isVisible,
			Features:    features,
		}

		product, err := service.UpdateProduct(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, product)
		assert.Equal(t, newName, product.Name)
		assert.Equal(t, &newDesc, product.Description)
		assert.Equal(t, newType, product.Type)
		assert.Equal(t, &newCategory, product.Category)
		assert.Equal(t, newPrice, product.Price)
		assert.Equal(t, newCurrency, product.Currency)
		assert.False(t, product.IsActive)
		assert.True(t, product.IsVisible)
		assert.Equal(t, features, product.Features)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

package service

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockPackageRepository is a mock of PackageRepository
type MockPackageRepository struct {
	mock.Mock
}

func (m *MockPackageRepository) GetAll(ctx context.Context, filters models.PackageFilters) ([]models.Package, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.Package), args.Error(1)
}

func (m *MockPackageRepository) GetByID(ctx context.Context, id string) (*models.Package, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Package), args.Error(1)
}

func (m *MockPackageRepository) GetByCode(ctx context.Context, productID, code string) (*models.Package, error) {
	args := m.Called(ctx, productID, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Package), args.Error(1)
}

func (m *MockPackageRepository) Create(ctx context.Context, req models.CreatePackageRequest) (*models.Package, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Package), args.Error(1)
}

func (m *MockPackageRepository) Update(ctx context.Context, id string, req models.UpdatePackageRequest) (*models.Package, error) {
	args := m.Called(ctx, id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Package), args.Error(1)
}

func (m *MockPackageRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// Helper function to mock UUID validation
func isValidUUID(id string) bool {
	// Simple validation - in real code would use uuid.Parse
	return len(id) == 36 && id != ""
}

func TestPackageService_Create(t *testing.T) {
	mockRepo := new(MockPackageRepository)
	service := NewPackageService(mockRepo)

	ctx := context.Background()
	productID := "550e8400-e29b-41d4-a716-446655440000"

	t.Run("success", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, productID, "BASIC").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("models.CreatePackageRequest")).Return(&models.Package{
			ID:        "pkg-123",
			ProductID: productID,
			Code:      "BASIC",
			Name:      "Basic Package",
			Price:     49.99,
			Currency:  "USD",
		}, nil).Once()

		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "BASIC",
			Name:      "Basic Package",
			Price:     49.99,
			Currency:  "USD",
		}

		pkg, err := service.Create(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, pkg)
		assert.Equal(t, "BASIC", pkg.Code)
		assert.Equal(t, "Basic Package", pkg.Name)
		assert.Equal(t, 49.99, pkg.Price)
		assert.Equal(t, "USD", pkg.Currency)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty code", func(t *testing.T) {
		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "",
			Name:      "Basic Package",
			Price:     49.99,
			Currency:  "USD",
		}

		pkg, err := service.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "code is required")
	})

	t.Run("empty name", func(t *testing.T) {
		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "BASIC",
			Name:      "",
			Price:     49.99,
			Currency:  "USD",
		}

		pkg, err := service.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "name is required")
	})

	t.Run("name too long", func(t *testing.T) {
		longName := string(make([]byte, 256))
		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "BASIC",
			Name:      longName,
			Price:     49.99,
			Currency:  "USD",
		}

		pkg, err := service.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "cannot exceed 255 characters")
	})

	t.Run("negative price", func(t *testing.T) {
		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "BASIC",
			Name:      "Basic Package",
			Price:     -49.99,
			Currency:  "USD",
		}

		pkg, err := service.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "price cannot be negative")
	})

	t.Run("invalid currency code", func(t *testing.T) {
		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "BASIC",
			Name:      "Basic Package",
			Price:     49.99,
			Currency:  "US", // Should be 3 letters
		}

		pkg, err := service.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "currency must be 3-letter code")
	})

	t.Run("code already exists", func(t *testing.T) {
		existingPkg := &models.Package{
			ID:        "pkg-existing",
			ProductID: productID,
			Code:      "BASIC",
			Name:      "Existing Package",
		}

		mockRepo.On("GetByCode", ctx, productID, "BASIC").Return(existingPkg, nil).Once()

		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "BASIC",
			Name:      "Basic Package",
			Price:     49.99,
			Currency:  "USD",
		}

		pkg, err := service.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, productID, "BASIC").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("models.CreatePackageRequest")).Return(nil, errors.New("db error")).Once()

		req := models.CreatePackageRequest{
			ProductID: productID,
			Code:      "BASIC",
			Name:      "Basic Package",
			Price:     49.99,
			Currency:  "USD",
		}

		pkg, err := service.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		mockRepo.AssertExpectations(t)
	})
}

func TestPackageService_GetByID(t *testing.T) {
	mockRepo := new(MockPackageRepository)
	service := NewPackageService(mockRepo)

	ctx := context.Background()
	validID := "550e8400-e29b-41d4-a716-446655440000"

	t.Run("success", func(t *testing.T) {
		expectedPkg := &models.Package{
			ID:       validID,
			Code:     "BASIC",
			Name:     "Basic Package",
			Price:    49.99,
			Currency: "USD",
		}

		mockRepo.On("GetByID", ctx, validID).Return(expectedPkg, nil).Once()

		pkg, err := service.GetByID(ctx, validID)

		assert.NoError(t, err)
		assert.NotNil(t, pkg)
		assert.Equal(t, validID, pkg.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid UUID format", func(t *testing.T) {
		invalidID := "invalid-uuid"

		pkg, err := service.GetByID(ctx, invalidID)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "invalid package ID format")
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, validID).Return(nil, errors.New("not found")).Once()

		pkg, err := service.GetByID(ctx, validID)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		mockRepo.AssertExpectations(t)
	})
}

func TestPackageService_GetByCode(t *testing.T) {
	mockRepo := new(MockPackageRepository)
	service := NewPackageService(mockRepo)

	ctx := context.Background()
	productID := "550e8400-e29b-41d4-a716-446655440000"
	code := "BASIC"

	t.Run("success", func(t *testing.T) {
		expectedPkg := &models.Package{
			ID:        "pkg-123",
			ProductID: productID,
			Code:      code,
			Name:      "Basic Package",
			Price:     49.99,
			Currency:  "USD",
		}

		mockRepo.On("GetByCode", ctx, productID, code).Return(expectedPkg, nil).Once()

		pkg, err := service.GetByCode(ctx, productID, code)

		assert.NoError(t, err)
		assert.NotNil(t, pkg)
		assert.Equal(t, code, pkg.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid product UUID format", func(t *testing.T) {
		invalidID := "invalid-uuid"

		pkg, err := service.GetByCode(ctx, invalidID, code)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "invalid product ID format")
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, productID, code).Return(nil, errors.New("not found")).Once()

		pkg, err := service.GetByCode(ctx, productID, code)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		mockRepo.AssertExpectations(t)
	})
}

func TestPackageService_GetAll(t *testing.T) {
	mockRepo := new(MockPackageRepository)
	service := NewPackageService(mockRepo)

	ctx := context.Background()
	filters := models.PackageFilters{}

	t.Run("success", func(t *testing.T) {
		expectedPackages := []models.Package{
			{
				ID:       "pkg-1",
				Code:     "BASIC",
				Name:     "Basic Package",
				Price:    49.99,
				Currency: "USD",
			},
			{
				ID:       "pkg-2",
				Code:     "PREMIUM",
				Name:     "Premium Package",
				Price:    99.99,
				Currency: "USD",
			},
		}

		mockRepo.On("GetAll", ctx, filters).Return(expectedPackages, nil).Once()

		packages, err := service.GetAll(ctx, filters)

		assert.NoError(t, err)
		assert.NotNil(t, packages)
		assert.Len(t, packages, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("GetAll", ctx, filters).Return(nil, errors.New("db error")).Once()

		packages, err := service.GetAll(ctx, filters)

		assert.Error(t, err)
		assert.Nil(t, packages)
		mockRepo.AssertExpectations(t)
	})
}

func TestPackageService_Update(t *testing.T) {
	mockRepo := new(MockPackageRepository)
	service := NewPackageService(mockRepo)

	ctx := context.Background()
	validID := "550e8400-e29b-41d4-a716-446655440000"

	t.Run("success", func(t *testing.T) {
		newName := "Updated Package"
		newPrice := 59.99

		mockRepo.On("Update", ctx, validID, mock.AnythingOfType("models.UpdatePackageRequest")).Return(&models.Package{
			ID:       validID,
			Code:     "BASIC",
			Name:     newName,
			Price:    newPrice,
			Currency: "USD",
		}, nil).Once()

		req := models.UpdatePackageRequest{
			Name:  &newName,
			Price: &newPrice,
		}

		pkg, err := service.Update(ctx, validID, req)

		assert.NoError(t, err)
		assert.NotNil(t, pkg)
		assert.Equal(t, newName, pkg.Name)
		assert.Equal(t, newPrice, pkg.Price)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid UUID format", func(t *testing.T) {
		invalidID := "invalid-uuid"
		newName := "Updated Package"

		req := models.UpdatePackageRequest{
			Name: &newName,
		}

		pkg, err := service.Update(ctx, invalidID, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "invalid package ID format")
	})

	t.Run("empty name", func(t *testing.T) {
		emptyName := ""

		req := models.UpdatePackageRequest{
			Name: &emptyName,
		}

		pkg, err := service.Update(ctx, validID, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "name cannot be empty")
	})

	t.Run("negative price", func(t *testing.T) {
		negativePrice := -49.99

		req := models.UpdatePackageRequest{
			Price: &negativePrice,
		}

		pkg, err := service.Update(ctx, validID, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "price cannot be negative")
	})

	t.Run("invalid currency code", func(t *testing.T) {
		invalidCurrency := "US"

		req := models.UpdatePackageRequest{
			Currency: &invalidCurrency,
		}

		pkg, err := service.Update(ctx, validID, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		assert.Contains(t, err.Error(), "currency must be 3-letter code")
	})

	t.Run("repository error", func(t *testing.T) {
		newName := "Updated Package"

		mockRepo.On("Update", ctx, validID, mock.AnythingOfType("models.UpdatePackageRequest")).Return(nil, errors.New("db error")).Once()

		req := models.UpdatePackageRequest{
			Name: &newName,
		}

		pkg, err := service.Update(ctx, validID, req)

		assert.Error(t, err)
		assert.Nil(t, pkg)
		mockRepo.AssertExpectations(t)
	})
}

func TestPackageService_Delete(t *testing.T) {
	mockRepo := new(MockPackageRepository)
	service := NewPackageService(mockRepo)

	ctx := context.Background()
	validID := "550e8400-e29b-41d4-a716-446655440000"

	t.Run("success", func(t *testing.T) {
		mockRepo.On("Delete", ctx, validID).Return(nil).Once()

		err := service.Delete(ctx, validID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid UUID format", func(t *testing.T) {
		invalidID := "invalid-uuid"

		err := service.Delete(ctx, invalidID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid package ID format")
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("Delete", ctx, validID).Return(errors.New("db error")).Once()

		err := service.Delete(ctx, validID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

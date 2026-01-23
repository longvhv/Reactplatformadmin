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

// MockSystemCategoryRepository is a mock of SystemCategoryRepository
type MockSystemCategoryRepository struct {
	mock.Mock
}

func (m *MockSystemCategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemCategory, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SystemCategory), args.Error(1)
}

func (m *MockSystemCategoryRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.SystemCategory, error) {
	args := m.Called(ctx, tenantID, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SystemCategory), args.Error(1)
}

func (m *MockSystemCategoryRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, categoryType string, status *int, limit, offset int) ([]*models.SystemCategory, int64, error) {
	args := m.Called(ctx, tenantID, categoryType, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.SystemCategory), args.Get(1).(int64), args.Error(2)
}

func (m *MockSystemCategoryRepository) GetChildren(ctx context.Context, tenantID uuid.UUID, parentCode string) ([]*models.SystemCategory, error) {
	args := m.Called(ctx, tenantID, parentCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.SystemCategory), args.Error(1)
}

func (m *MockSystemCategoryRepository) GetByGroup(ctx context.Context, tenantID uuid.UUID, groupID string) ([]*models.SystemCategory, error) {
	args := m.Called(ctx, tenantID, groupID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.SystemCategory), args.Error(1)
}

func (m *MockSystemCategoryRepository) Create(ctx context.Context, category *models.SystemCategory) error {
	args := m.Called(ctx, category)
	return args.Error(0)
}

func (m *MockSystemCategoryRepository) Update(ctx context.Context, category *models.SystemCategory) error {
	args := m.Called(ctx, category)
	return args.Error(0)
}

func (m *MockSystemCategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestSystemCategoryService_GetByID(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		categoryID := uuid.New()
		expected := &models.SystemCategory{
			ID:     categoryID,
			Code:   "ELECTRONICS",
			Name:   "Electronics",
			Type:   "product",
			Status: 1,
		}

		mockRepo.On("GetByID", ctx, categoryID).Return(expected, nil).Once()

		category, err := service.GetByID(ctx, categoryID)

		assert.NoError(t, err)
		assert.NotNil(t, category)
		assert.Equal(t, "ELECTRONICS", category.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		categoryID := uuid.New()
		mockRepo.On("GetByID", ctx, categoryID).Return(nil, errors.New("not found")).Once()

		category, err := service.GetByID(ctx, categoryID)

		assert.Error(t, err)
		assert.Nil(t, category)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_GetByCode(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := &models.SystemCategory{
			ID:       uuid.New(),
			TenantID: tenantID,
			Code:     "ELECTRONICS",
			Name:     "Electronics",
		}

		mockRepo.On("GetByCode", ctx, tenantID, "ELECTRONICS").Return(expected, nil).Once()

		category, err := service.GetByCode(ctx, tenantID, "ELECTRONICS")

		assert.NoError(t, err)
		assert.NotNil(t, category)
		assert.Equal(t, "ELECTRONICS", category.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		tenantID := uuid.New()
		mockRepo.On("GetByCode", ctx, tenantID, "UNKNOWN").Return(nil, errors.New("not found")).Once()

		category, err := service.GetByCode(ctx, tenantID, "UNKNOWN")

		assert.Error(t, err)
		assert.Nil(t, category)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_CreateCategory(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		req := CreateSystemCategoryRequest{
			TenantID:   tenantID,
			Type:       "product",
			Code:       "ELECTRONICS",
			Name:       "Electronics",
			IsEditable: true,
			CreatedBy:  userID,
		}

		mockRepo.On("GetByCode", ctx, tenantID, "ELECTRONICS").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SystemCategory")).Return(nil).Once()

		category, err := service.CreateCategory(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, category)
		assert.Equal(t, "ELECTRONICS", category.Code)
		assert.Equal(t, 1, category.Status)
		assert.Equal(t, "system_categories", category.CollectionName)
		assert.Len(t, category.ExtraFields, 0)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with custom values", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		desc := "Electronics and gadgets"
		parentID := "TECHNOLOGY"
		groupID := "MAIN_CATEGORIES"

		req := CreateSystemCategoryRequest{
			TenantID:        tenantID,
			Type:            "product",
			Code:            "ELECTRONICS",
			Name:            "Electronics",
			Status:          2,
			Order:           10,
			Description:     &desc,
			ParentID:        &parentID,
			GroupCategoryID: &groupID,
			CollectionName:  "custom_categories",
			ExtraFields:     []interface{}{"field1", "field2"},
			Metadata: map[string]interface{}{
				"icon":  "electronics",
				"color": "blue",
			},
			IsSystem:   true,
			IsEditable: false,
			CreatedBy:  userID,
		}

		mockRepo.On("GetByCode", ctx, tenantID, "ELECTRONICS").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SystemCategory")).Return(nil).Once()

		category, err := service.CreateCategory(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, 2, category.Status)
		assert.Equal(t, 10, category.Order)
		assert.Equal(t, &desc, category.Description)
		assert.Equal(t, &parentID, category.ParentID)
		assert.Equal(t, &groupID, category.GroupCategoryID)
		assert.Equal(t, "custom_categories", category.CollectionName)
		assert.Len(t, category.ExtraFields, 2)
		assert.True(t, category.IsSystem)
		assert.False(t, category.IsEditable)
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate code", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateSystemCategoryRequest{
			TenantID:  tenantID,
			Type:      "product",
			Code:      "ELECTRONICS",
			Name:      "Electronics",
			CreatedBy: uuid.New(),
		}

		existing := &models.SystemCategory{ID: uuid.New(), Code: "ELECTRONICS"}
		mockRepo.On("GetByCode", ctx, tenantID, "ELECTRONICS").Return(existing, nil).Once()

		category, err := service.CreateCategory(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, category)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateSystemCategoryRequest{
			TenantID:  tenantID,
			Type:      "product",
			Code:      "TEST",
			Name:      "Test",
			CreatedBy: uuid.New(),
		}

		mockRepo.On("GetByCode", ctx, tenantID, "TEST").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SystemCategory")).Return(errors.New("db error")).Once()

		category, err := service.CreateCategory(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, category)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_UpdateCategory(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		categoryID := uuid.New()
		existing := &models.SystemCategory{
			ID:         categoryID,
			Code:       "ELECTRONICS",
			Name:       "Old Name",
			Status:     1,
			IsEditable: true,
			Version:    1,
		}

		newName := "Electronics & Gadgets"
		newStatus := 2
		newOrder := 5
		req := UpdateSystemCategoryRequest{
			Name:      &newName,
			Status:    &newStatus,
			Order:     &newOrder,
			UpdatedBy: uuid.New(),
		}

		mockRepo.On("GetByID", ctx, categoryID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemCategory")).Return(nil).Once()

		category, err := service.UpdateCategory(ctx, categoryID, req)

		assert.NoError(t, err)
		assert.NotNil(t, category)
		assert.Equal(t, "Electronics & Gadgets", category.Name)
		assert.Equal(t, 2, category.Status)
		assert.Equal(t, 5, category.Order)
		assert.Equal(t, 2, category.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("category not found", func(t *testing.T) {
		categoryID := uuid.New()
		req := UpdateSystemCategoryRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, categoryID).Return(nil, errors.New("not found")).Once()

		category, err := service.UpdateCategory(ctx, categoryID, req)

		assert.Error(t, err)
		assert.Nil(t, category)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not editable", func(t *testing.T) {
		categoryID := uuid.New()
		existing := &models.SystemCategory{
			ID:         categoryID,
			IsEditable: false,
		}
		req := UpdateSystemCategoryRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, categoryID).Return(existing, nil).Once()

		category, err := service.UpdateCategory(ctx, categoryID, req)

		assert.Error(t, err)
		assert.Nil(t, category)
		assert.Contains(t, err.Error(), "not editable")
		mockRepo.AssertExpectations(t)
	})

	t.Run("update parent and group", func(t *testing.T) {
		categoryID := uuid.New()
		existing := &models.SystemCategory{
			ID:         categoryID,
			IsEditable: true,
		}

		newParentID := "TECHNOLOGY"
		newGroupID := "MAIN"
		req := UpdateSystemCategoryRequest{
			ParentID:        &newParentID,
			GroupCategoryID: &newGroupID,
			UpdatedBy:       uuid.New(),
		}

		mockRepo.On("GetByID", ctx, categoryID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemCategory")).Return(nil).Once()

		category, err := service.UpdateCategory(ctx, categoryID, req)

		assert.NoError(t, err)
		assert.Equal(t, &newParentID, category.ParentID)
		assert.Equal(t, &newGroupID, category.GroupCategoryID)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_DeleteCategory(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		categoryID := uuid.New()
		existing := &models.SystemCategory{
			ID:         categoryID,
			IsSystem:   false,
			IsEditable: true,
		}

		mockRepo.On("GetByID", ctx, categoryID).Return(existing, nil).Once()
		mockRepo.On("Delete", ctx, categoryID).Return(nil).Once()

		err := service.DeleteCategory(ctx, categoryID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("category not found", func(t *testing.T) {
		categoryID := uuid.New()
		mockRepo.On("GetByID", ctx, categoryID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteCategory(ctx, categoryID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("system category", func(t *testing.T) {
		categoryID := uuid.New()
		existing := &models.SystemCategory{
			ID:       categoryID,
			IsSystem: true,
		}

		mockRepo.On("GetByID", ctx, categoryID).Return(existing, nil).Once()

		err := service.DeleteCategory(ctx, categoryID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete system category")
		mockRepo.AssertExpectations(t)
	})

	t.Run("not editable", func(t *testing.T) {
		categoryID := uuid.New()
		existing := &models.SystemCategory{
			ID:         categoryID,
			IsSystem:   false,
			IsEditable: false,
		}

		mockRepo.On("GetByID", ctx, categoryID).Return(existing, nil).Once()

		err := service.DeleteCategory(ctx, categoryID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not editable")
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_ListByTenant(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.SystemCategory{
			{ID: uuid.New(), Code: "ELECTRONICS", Name: "Electronics"},
			{ID: uuid.New(), Code: "FASHION", Name: "Fashion"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", (*int)(nil), 10, 0).
			Return(expected, int64(2), nil).Once()

		categories, total, err := service.ListByTenant(ctx, tenantID, "", nil, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, categories, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with filters", func(t *testing.T) {
		tenantID := uuid.New()
		status := 1
		expected := []*models.SystemCategory{
			{ID: uuid.New(), Type: "product", Status: 1},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "product", &status, 10, 0).
			Return(expected, int64(1), nil).Once()

		categories, total, err := service.ListByTenant(ctx, tenantID, "product", &status, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, categories, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_GetByType(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.SystemCategory{
			{ID: uuid.New(), Type: "product"},
			{ID: uuid.New(), Type: "product"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "product", (*int)(nil), 1000, 0).
			Return(expected, int64(2), nil).Once()

		categories, err := service.GetByType(ctx, tenantID, "product")

		assert.NoError(t, err)
		assert.Len(t, categories, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()

		mockRepo.On("ListByTenant", ctx, tenantID, "product", (*int)(nil), 1000, 0).
			Return(nil, int64(0), errors.New("db error")).Once()

		categories, err := service.GetByType(ctx, tenantID, "product")

		assert.Error(t, err)
		assert.Nil(t, categories)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_GetChildren(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		parentCode := "TECHNOLOGY"
		expected := []*models.SystemCategory{
			{ID: uuid.New(), Code: "ELECTRONICS", ParentID: &parentCode},
			{ID: uuid.New(), Code: "SOFTWARE", ParentID: &parentCode},
		}

		mockRepo.On("GetChildren", ctx, tenantID, parentCode).Return(expected, nil).Once()

		children, err := service.GetChildren(ctx, tenantID, parentCode)

		assert.NoError(t, err)
		assert.Len(t, children, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("no children", func(t *testing.T) {
		tenantID := uuid.New()
		parentCode := "LEAF"

		mockRepo.On("GetChildren", ctx, tenantID, parentCode).Return([]*models.SystemCategory{}, nil).Once()

		children, err := service.GetChildren(ctx, tenantID, parentCode)

		assert.NoError(t, err)
		assert.Len(t, children, 0)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()
		parentCode := "TEST"

		mockRepo.On("GetChildren", ctx, tenantID, parentCode).Return(nil, errors.New("db error")).Once()

		children, err := service.GetChildren(ctx, tenantID, parentCode)

		assert.Error(t, err)
		assert.Nil(t, children)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemCategoryService_GetByGroup(t *testing.T) {
	mockRepo := new(MockSystemCategoryRepository)
	service := NewSystemCategoryService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		groupID := "MAIN_CATEGORIES"
		expected := []*models.SystemCategory{
			{ID: uuid.New(), GroupCategoryID: &groupID},
			{ID: uuid.New(), GroupCategoryID: &groupID},
		}

		mockRepo.On("GetByGroup", ctx, tenantID, groupID).Return(expected, nil).Once()

		categories, err := service.GetByGroup(ctx, tenantID, groupID)

		assert.NoError(t, err)
		assert.Len(t, categories, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()
		groupID := "TEST"

		mockRepo.On("GetByGroup", ctx, tenantID, groupID).Return(nil, errors.New("db error")).Once()

		categories, err := service.GetByGroup(ctx, tenantID, groupID)

		assert.Error(t, err)
		assert.Nil(t, categories)
		mockRepo.AssertExpectations(t)
	})
}

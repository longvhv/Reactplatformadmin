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

// MockArticleTypeRepository is a mock of ArticleTypeRepository
type MockArticleTypeRepository struct {
	mock.Mock
}

func (m *MockArticleTypeRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ArticleType, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ArticleType), args.Error(1)
}

func (m *MockArticleTypeRepository) GetByCode(ctx context.Context, appCode, code string) (*models.ArticleType, error) {
	args := m.Called(ctx, appCode, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ArticleType), args.Error(1)
}

func (m *MockArticleTypeRepository) List(ctx context.Context, page, pageSize int, appCode *string) ([]*models.ArticleType, int, error) {
	args := m.Called(ctx, page, pageSize, appCode)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.ArticleType), args.Int(1), args.Error(2)
}

func (m *MockArticleTypeRepository) ListByApp(ctx context.Context, appCode string) ([]*models.ArticleType, error) {
	args := m.Called(ctx, appCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.ArticleType), args.Error(1)
}

func (m *MockArticleTypeRepository) Create(ctx context.Context, articleType *models.ArticleType) error {
	args := m.Called(ctx, articleType)
	return args.Error(0)
}

func (m *MockArticleTypeRepository) Update(ctx context.Context, articleType *models.ArticleType) error {
	args := m.Called(ctx, articleType)
	return args.Error(0)
}

func (m *MockArticleTypeRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestArticleTypeService_CreateArticleType(t *testing.T) {
	mockRepo := new(MockArticleTypeRepository)
	service := NewArticleTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		iconURL := "https://example.com/icon.png"
		configSchema := map[string]interface{}{
			"fields": []string{"title", "content"},
		}
		req := &models.CreateArticleTypeRequest{
			AppCode:      "blog",
			Code:         "post",
			Name:         "Blog Post",
			IconURL:      &iconURL,
			ConfigSchema: configSchema,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ArticleType")).Return(nil).Once()

		articleType, err := service.CreateArticleType(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, articleType)
		assert.Equal(t, "blog", articleType.AppCode)
		assert.Equal(t, "post", articleType.Code)
		assert.Equal(t, "Blog Post", articleType.Name)
		assert.False(t, articleType.IsSystem) // Default
		assert.True(t, articleType.IsActive)  // Default
		mockRepo.AssertExpectations(t)
	})

	t.Run("success without optional fields", func(t *testing.T) {
		req := &models.CreateArticleTypeRequest{
			AppCode: "wiki",
			Code:    "page",
			Name:    "Wiki Page",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ArticleType")).Return(nil).Once()

		articleType, err := service.CreateArticleType(ctx, req)

		assert.NoError(t, err)
		assert.Nil(t, articleType.IconURL)
		assert.Nil(t, articleType.ConfigSchema)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateArticleTypeRequest{
			AppCode: "blog",
			Code:    "post",
			Name:    "Post",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ArticleType")).Return(errors.New("db error")).Once()

		articleType, err := service.CreateArticleType(ctx, req)

		assert.Error(t, err)
		assert.NotNil(t, articleType) // Service returns the object even on error
		mockRepo.AssertExpectations(t)
	})
}

func TestArticleTypeService_GetArticleType(t *testing.T) {
	mockRepo := new(MockArticleTypeRepository)
	service := NewArticleTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		articleTypeID := uuid.New()
		expected := &models.ArticleType{
			ID:      articleTypeID,
			AppCode: "blog",
			Code:    "post",
		}

		mockRepo.On("GetByID", ctx, articleTypeID).Return(expected, nil).Once()

		articleType, err := service.GetArticleType(ctx, articleTypeID)

		assert.NoError(t, err)
		assert.NotNil(t, articleType)
		assert.Equal(t, articleTypeID, articleType.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		articleTypeID := uuid.New()
		mockRepo.On("GetByID", ctx, articleTypeID).Return(nil, errors.New("not found")).Once()

		articleType, err := service.GetArticleType(ctx, articleTypeID)

		assert.Error(t, err)
		assert.Nil(t, articleType)
		mockRepo.AssertExpectations(t)
	})
}

func TestArticleTypeService_GetArticleTypeByCode(t *testing.T) {
	mockRepo := new(MockArticleTypeRepository)
	service := NewArticleTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := &models.ArticleType{
			ID:      uuid.New(),
			AppCode: "blog",
			Code:    "post",
		}

		mockRepo.On("GetByCode", ctx, "blog", "post").Return(expected, nil).Once()

		articleType, err := service.GetArticleTypeByCode(ctx, "blog", "post")

		assert.NoError(t, err)
		assert.NotNil(t, articleType)
		assert.Equal(t, "blog", articleType.AppCode)
		assert.Equal(t, "post", articleType.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, "wiki", "page").Return(nil, errors.New("not found")).Once()

		articleType, err := service.GetArticleTypeByCode(ctx, "wiki", "page")

		assert.Error(t, err)
		assert.Nil(t, articleType)
		mockRepo.AssertExpectations(t)
	})
}

func TestArticleTypeService_ListArticleTypes(t *testing.T) {
	mockRepo := new(MockArticleTypeRepository)
	service := NewArticleTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filter", func(t *testing.T) {
		expected := []*models.ArticleType{
			{ID: uuid.New(), Code: "post"},
			{ID: uuid.New(), Code: "page"},
		}

		mockRepo.On("List", ctx, 1, 10, (*string)(nil)).Return(expected, 2, nil).Once()

		articleTypes, total, err := service.ListArticleTypes(ctx, 1, 10, nil)

		assert.NoError(t, err)
		assert.Len(t, articleTypes, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with app filter", func(t *testing.T) {
		appCode := "blog"
		expected := []*models.ArticleType{
			{ID: uuid.New(), AppCode: "blog", Code: "post"},
		}

		mockRepo.On("List", ctx, 1, 10, &appCode).Return(expected, 1, nil).Once()

		articleTypes, total, err := service.ListArticleTypes(ctx, 1, 10, &appCode)

		assert.NoError(t, err)
		assert.Len(t, articleTypes, 1)
		assert.Equal(t, 1, total)
		assert.Equal(t, "blog", articleTypes[0].AppCode)
		mockRepo.AssertExpectations(t)
	})
}

func TestArticleTypeService_ListArticleTypesByApp(t *testing.T) {
	mockRepo := new(MockArticleTypeRepository)
	service := NewArticleTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := []*models.ArticleType{
			{ID: uuid.New(), AppCode: "blog", Code: "post"},
			{ID: uuid.New(), AppCode: "blog", Code: "page"},
		}

		mockRepo.On("ListByApp", ctx, "blog").Return(expected, nil).Once()

		articleTypes, err := service.ListArticleTypesByApp(ctx, "blog")

		assert.NoError(t, err)
		assert.Len(t, articleTypes, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		mockRepo.On("ListByApp", ctx, "wiki").Return([]*models.ArticleType{}, nil).Once()

		articleTypes, err := service.ListArticleTypesByApp(ctx, "wiki")

		assert.NoError(t, err)
		assert.Empty(t, articleTypes)
		mockRepo.AssertExpectations(t)
	})
}

func TestArticleTypeService_UpdateArticleType(t *testing.T) {
	mockRepo := new(MockArticleTypeRepository)
	service := NewArticleTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		articleTypeID := uuid.New()
		existing := &models.ArticleType{
			ID:       articleTypeID,
			Name:     "Old Name",
			IsActive: true,
		}

		newName := "New Name"
		newIconURL := "https://example.com/new-icon.png"
		newConfigSchema := map[string]interface{}{
			"fields": []string{"title", "content", "tags"},
		}
		isActive := false
		req := &models.UpdateArticleTypeRequest{
			Name:         &newName,
			IconURL:      &newIconURL,
			ConfigSchema: newConfigSchema,
			IsActive:     &isActive,
		}

		mockRepo.On("GetByID", ctx, articleTypeID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ArticleType")).Return(nil).Once()

		articleType, err := service.UpdateArticleType(ctx, articleTypeID, req)

		assert.NoError(t, err)
		assert.Equal(t, "New Name", articleType.Name)
		assert.Equal(t, &newIconURL, articleType.IconURL)
		assert.Equal(t, newConfigSchema, articleType.ConfigSchema)
		assert.False(t, articleType.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("partial update", func(t *testing.T) {
		articleTypeID := uuid.New()
		existing := &models.ArticleType{
			ID:       articleTypeID,
			Name:     "Original Name",
			IsActive: true,
		}

		newName := "Updated Name"
		req := &models.UpdateArticleTypeRequest{
			Name: &newName,
			// Other fields not updated
		}

		mockRepo.On("GetByID", ctx, articleTypeID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ArticleType")).Return(nil).Once()

		articleType, err := service.UpdateArticleType(ctx, articleTypeID, req)

		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", articleType.Name)
		assert.True(t, articleType.IsActive) // Unchanged
		mockRepo.AssertExpectations(t)
	})

	t.Run("article type not found", func(t *testing.T) {
		articleTypeID := uuid.New()
		req := &models.UpdateArticleTypeRequest{}

		mockRepo.On("GetByID", ctx, articleTypeID).Return(nil, errors.New("not found")).Once()

		articleType, err := service.UpdateArticleType(ctx, articleTypeID, req)

		assert.Error(t, err)
		assert.Nil(t, articleType)
		mockRepo.AssertExpectations(t)
	})
}

func TestArticleTypeService_DeleteArticleType(t *testing.T) {
	mockRepo := new(MockArticleTypeRepository)
	service := NewArticleTypeService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		articleTypeID := uuid.New()

		mockRepo.On("Delete", ctx, articleTypeID).Return(nil).Once()

		err := service.DeleteArticleType(ctx, articleTypeID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		articleTypeID := uuid.New()

		mockRepo.On("Delete", ctx, articleTypeID).Return(errors.New("db error")).Once()

		err := service.DeleteArticleType(ctx, articleTypeID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

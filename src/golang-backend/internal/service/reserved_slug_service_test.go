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

// MockReservedSlugRepository is a mock of ReservedSlugRepository
type MockReservedSlugRepository struct {
	mock.Mock
}

func (m *MockReservedSlugRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ReservedSlug, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ReservedSlug), args.Error(1)
}

func (m *MockReservedSlugRepository) GetBySlug(ctx context.Context, slug string) (*models.ReservedSlug, error) {
	args := m.Called(ctx, slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ReservedSlug), args.Error(1)
}

func (m *MockReservedSlugRepository) List(ctx context.Context, slugType, matchType string, limit, offset int) ([]*models.ReservedSlug, int64, error) {
	args := m.Called(ctx, slugType, matchType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.ReservedSlug), args.Get(1).(int64), args.Error(2)
}

func (m *MockReservedSlugRepository) Create(ctx context.Context, slug *models.ReservedSlug) error {
	args := m.Called(ctx, slug)
	return args.Error(0)
}

func (m *MockReservedSlugRepository) Update(ctx context.Context, slug *models.ReservedSlug) error {
	args := m.Called(ctx, slug)
	return args.Error(0)
}

func (m *MockReservedSlugRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestReservedSlugService_GetByID(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		slugID := uuid.New()
		expectedSlug := &models.ReservedSlug{
			ID:        slugID,
			Slug:      "admin",
			Type:      "system",
			MatchType: "EXACT",
			IsActive:  true,
		}

		mockRepo.On("GetByID", ctx, slugID).Return(expectedSlug, nil).Once()

		slug, err := service.GetByID(ctx, slugID)

		assert.NoError(t, err)
		assert.NotNil(t, slug)
		assert.Equal(t, "admin", slug.Slug)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		slugID := uuid.New()
		mockRepo.On("GetByID", ctx, slugID).Return(nil, errors.New("not found")).Once()

		slug, err := service.GetByID(ctx, slugID)

		assert.Error(t, err)
		assert.Nil(t, slug)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_GetBySlug(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expectedSlug := &models.ReservedSlug{
			ID:        uuid.New(),
			Slug:      "admin",
			Type:      "system",
			MatchType: "EXACT",
			IsActive:  true,
		}

		mockRepo.On("GetBySlug", ctx, "admin").Return(expectedSlug, nil).Once()

		slug, err := service.GetBySlug(ctx, "admin")

		assert.NoError(t, err)
		assert.NotNil(t, slug)
		assert.Equal(t, "admin", slug.Slug)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetBySlug", ctx, "unknown").Return(nil, errors.New("not found")).Once()

		slug, err := service.GetBySlug(ctx, "unknown")

		assert.Error(t, err)
		assert.Nil(t, slug)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_IsSlugReserved(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("exact match - reserved", func(t *testing.T) {
		reason := "System reserved"
		slugs := []*models.ReservedSlug{
			{
				ID:        uuid.New(),
				Slug:      "admin",
				Type:      "system",
				MatchType: "EXACT",
				Reason:    &reason,
				IsActive:  true,
			},
		}

		mockRepo.On("List", ctx, "", "", 1000, 0).Return(slugs, int64(1), nil).Once()

		reserved, returnedReason, err := service.IsSlugReserved(ctx, "admin")

		assert.NoError(t, err)
		assert.True(t, reserved)
		assert.Equal(t, "System reserved", returnedReason)
		mockRepo.AssertExpectations(t)
	})

	t.Run("exact match - not reserved", func(t *testing.T) {
		slugs := []*models.ReservedSlug{
			{
				ID:        uuid.New(),
				Slug:      "admin",
				Type:      "system",
				MatchType: "EXACT",
				IsActive:  true,
			},
		}

		mockRepo.On("List", ctx, "", "", 1000, 0).Return(slugs, int64(1), nil).Once()

		reserved, reason, err := service.IsSlugReserved(ctx, "user")

		assert.NoError(t, err)
		assert.False(t, reserved)
		assert.Equal(t, "", reason)
		mockRepo.AssertExpectations(t)
	})

	t.Run("prefix match - reserved", func(t *testing.T) {
		slugs := []*models.ReservedSlug{
			{
				ID:        uuid.New(),
				Slug:      "admin",
				Type:      "system",
				MatchType: "PREFIX",
				IsActive:  true,
			},
		}

		mockRepo.On("List", ctx, "", "", 1000, 0).Return(slugs, int64(1), nil).Once()

		reserved, _, err := service.IsSlugReserved(ctx, "admin-panel")

		assert.NoError(t, err)
		assert.True(t, reserved)
		mockRepo.AssertExpectations(t)
	})

	t.Run("regex match - reserved", func(t *testing.T) {
		slugs := []*models.ReservedSlug{
			{
				ID:        uuid.New(),
				Slug:      "^test-[0-9]+$",
				Type:      "system",
				MatchType: "REGEX",
				IsActive:  true,
			},
		}

		mockRepo.On("List", ctx, "", "", 1000, 0).Return(slugs, int64(1), nil).Once()

		reserved, _, err := service.IsSlugReserved(ctx, "test-123")

		assert.NoError(t, err)
		assert.True(t, reserved)
		mockRepo.AssertExpectations(t)
	})

	t.Run("case insensitive", func(t *testing.T) {
		slugs := []*models.ReservedSlug{
			{
				ID:        uuid.New(),
				Slug:      "admin",
				Type:      "system",
				MatchType: "EXACT",
				IsActive:  true,
			},
		}

		mockRepo.On("List", ctx, "", "", 1000, 0).Return(slugs, int64(1), nil).Once()

		reserved, _, err := service.IsSlugReserved(ctx, "ADMIN")

		assert.NoError(t, err)
		assert.True(t, reserved)
		mockRepo.AssertExpectations(t)
	})

	t.Run("inactive slug - not reserved", func(t *testing.T) {
		slugs := []*models.ReservedSlug{
			{
				ID:        uuid.New(),
				Slug:      "admin",
				Type:      "system",
				MatchType: "EXACT",
				IsActive:  false,
			},
		}

		mockRepo.On("List", ctx, "", "", 1000, 0).Return(slugs, int64(1), nil).Once()

		reserved, _, err := service.IsSlugReserved(ctx, "admin")

		assert.NoError(t, err)
		assert.False(t, reserved)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, "", "", 1000, 0).Return(nil, int64(0), errors.New("db error")).Once()

		reserved, reason, err := service.IsSlugReserved(ctx, "admin")

		assert.Error(t, err)
		assert.False(t, reserved)
		assert.Equal(t, "", reason)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_CreateSlug(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		req := CreateReservedSlugRequest{
			Slug:     "admin",
			Type:     "system",
			IsActive: true,
		}

		mockRepo.On("GetBySlug", ctx, "admin").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ReservedSlug")).Return(nil).Once()

		slug, err := service.CreateSlug(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, slug)
		assert.Equal(t, "admin", slug.Slug)
		assert.Equal(t, "EXACT", slug.MatchType)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid slug format", func(t *testing.T) {
		req := CreateReservedSlugRequest{
			Slug:     "Admin Panel",
			Type:     "system",
			IsActive: true,
		}

		slug, err := service.CreateSlug(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, slug)
		assert.Contains(t, err.Error(), "invalid slug format")
		mockRepo.AssertExpectations(t)
	})

	t.Run("slug already exists", func(t *testing.T) {
		req := CreateReservedSlugRequest{
			Slug:     "admin",
			Type:     "system",
			IsActive: true,
		}

		existingSlug := &models.ReservedSlug{ID: uuid.New(), Slug: "admin"}
		mockRepo.On("GetBySlug", ctx, "admin").Return(existingSlug, nil).Once()

		slug, err := service.CreateSlug(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, slug)
		assert.Contains(t, err.Error(), "already reserved")
		mockRepo.AssertExpectations(t)
	})

	t.Run("with custom match type", func(t *testing.T) {
		req := CreateReservedSlugRequest{
			Slug:      "test",
			Type:      "custom",
			MatchType: "PREFIX",
			IsActive:  true,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ReservedSlug")).Return(nil).Once()

		slug, err := service.CreateSlug(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, slug)
		assert.Equal(t, "PREFIX", slug.MatchType)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateReservedSlugRequest{
			Slug:     "admin",
			Type:     "system",
			IsActive: true,
		}

		mockRepo.On("GetBySlug", ctx, "admin").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ReservedSlug")).Return(errors.New("db error")).Once()

		slug, err := service.CreateSlug(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, slug)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_UpdateSlug(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		slugID := uuid.New()
		existingSlug := &models.ReservedSlug{
			ID:        slugID,
			Slug:      "admin",
			Type:      "system",
			MatchType: "EXACT",
			IsActive:  true,
			Version:   1,
		}

		isActive := false
		req := UpdateReservedSlugRequest{
			IsActive: &isActive,
		}

		mockRepo.On("GetByID", ctx, slugID).Return(existingSlug, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ReservedSlug")).Return(nil).Once()

		slug, err := service.UpdateSlug(ctx, slugID, req)

		assert.NoError(t, err)
		assert.NotNil(t, slug)
		assert.False(t, slug.IsActive)
		assert.Equal(t, 2, slug.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("slug not found", func(t *testing.T) {
		slugID := uuid.New()
		req := UpdateReservedSlugRequest{}

		mockRepo.On("GetByID", ctx, slugID).Return(nil, errors.New("not found")).Once()

		slug, err := service.UpdateSlug(ctx, slugID, req)

		assert.Error(t, err)
		assert.Nil(t, slug)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		slugID := uuid.New()
		existingSlug := &models.ReservedSlug{ID: slugID, Slug: "admin"}
		req := UpdateReservedSlugRequest{}

		mockRepo.On("GetByID", ctx, slugID).Return(existingSlug, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ReservedSlug")).Return(errors.New("db error")).Once()

		slug, err := service.UpdateSlug(ctx, slugID, req)

		assert.Error(t, err)
		assert.Nil(t, slug)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_DeleteSlug(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		slugID := uuid.New()
		mockRepo.On("Delete", ctx, slugID).Return(nil).Once()

		err := service.DeleteSlug(ctx, slugID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		slugID := uuid.New()
		mockRepo.On("Delete", ctx, slugID).Return(errors.New("db error")).Once()

		err := service.DeleteSlug(ctx, slugID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_BulkCheckSlugs(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		slugs := []*models.ReservedSlug{
			{ID: uuid.New(), Slug: "admin", MatchType: "EXACT", IsActive: true},
			{ID: uuid.New(), Slug: "api", MatchType: "EXACT", IsActive: true},
		}

		mockRepo.On("List", ctx, "", "", 1000, 0).Return(slugs, int64(2), nil).Times(3)

		results, err := service.BulkCheckSlugs(ctx, []string{"admin", "user", "api"})

		assert.NoError(t, err)
		assert.Len(t, results, 3)
		assert.True(t, results["admin"])
		assert.False(t, results["user"])
		assert.True(t, results["api"])
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, "", "", 1000, 0).Return(nil, int64(0), errors.New("db error")).Once()

		results, err := service.BulkCheckSlugs(ctx, []string{"admin"})

		assert.Error(t, err)
		assert.Nil(t, results)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_GetReservedSlugsByType(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expectedSlugs := []*models.ReservedSlug{
			{ID: uuid.New(), Slug: "admin", Type: "system"},
			{ID: uuid.New(), Slug: "api", Type: "system"},
		}

		mockRepo.On("List", ctx, "system", "", 1000, 0).Return(expectedSlugs, int64(2), nil).Once()

		slugs, err := service.GetReservedSlugsByType(ctx, "system")

		assert.NoError(t, err)
		assert.Len(t, slugs, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, "system", "", 1000, 0).Return(nil, int64(0), errors.New("db error")).Once()

		slugs, err := service.GetReservedSlugsByType(ctx, "system")

		assert.Error(t, err)
		assert.Nil(t, slugs)
		mockRepo.AssertExpectations(t)
	})
}

func TestReservedSlugService_ListSlugs(t *testing.T) {
	mockRepo := new(MockReservedSlugRepository)
	service := NewReservedSlugService(mockRepo)
	ctx := context.Background()

	t.Run("success with pagination", func(t *testing.T) {
		expectedSlugs := []*models.ReservedSlug{
			{ID: uuid.New(), Slug: "admin", Type: "system"},
			{ID: uuid.New(), Slug: "api", Type: "system"},
		}

		mockRepo.On("List", ctx, "system", "EXACT", 10, 0).Return(expectedSlugs, int64(2), nil).Once()

		slugs, total, err := service.ListSlugs(ctx, "system", "EXACT", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, slugs, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, "", "", 10, 0).Return(nil, int64(0), errors.New("db error")).Once()

		slugs, total, err := service.ListSlugs(ctx, "", "", 1, 10)

		assert.Error(t, err)
		assert.Nil(t, slugs)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

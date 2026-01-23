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

// MockFeatureFlagRepository is a mock of FeatureFlagRepository
type MockFeatureFlagRepository struct {
	mock.Mock
}

func (m *MockFeatureFlagRepository) Create(ctx context.Context, flag *models.FeatureFlag) error {
	args := m.Called(ctx, flag)
	return args.Error(0)
}

func (m *MockFeatureFlagRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.FeatureFlag, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.FeatureFlag), args.Error(1)
}

func (m *MockFeatureFlagRepository) GetByKey(ctx context.Context, key string) (*models.FeatureFlag, error) {
	args := m.Called(ctx, key)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.FeatureFlag), args.Error(1)
}

func (m *MockFeatureFlagRepository) Update(ctx context.Context, flag *models.FeatureFlag) error {
	args := m.Called(ctx, flag)
	return args.Error(0)
}

func (m *MockFeatureFlagRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockFeatureFlagRepository) List(ctx context.Context, category string, limit, offset int) ([]*models.FeatureFlag, int64, error) {
	args := m.Called(ctx, category, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.FeatureFlag), args.Get(1).(int64), args.Error(2)
}

func TestFeatureFlagService_CreateFlag(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	flagKey := "feature.new_dashboard"
	flagName := "New Dashboard"

	t.Run("success", func(t *testing.T) {
		description := "New dashboard feature"
		category := "ui"

		mockRepo.On("GetByKey", ctx, flagKey).Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.FeatureFlag")).Return(nil).Once()

		req := CreateFeatureFlagRequest{
			FlagKey:           flagKey,
			FlagName:          flagName,
			Description:       &description,
			IsEnabled:         true,
			Category:          &category,
			PercentageRollout: 100,
		}

		flag, err := service.CreateFlag(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.Equal(t, flagKey, flag.FlagKey)
		assert.Equal(t, flagName, flag.FlagName)
		assert.True(t, flag.IsEnabled)
		assert.NotNil(t, flag.EnabledAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - disabled flag", func(t *testing.T) {
		mockRepo.On("GetByKey", ctx, flagKey).Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.FeatureFlag")).Return(nil).Once()

		req := CreateFeatureFlagRequest{
			FlagKey:           flagKey,
			FlagName:          flagName,
			IsEnabled:         false,
			PercentageRollout: 0,
		}

		flag, err := service.CreateFlag(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.False(t, flag.IsEnabled)
		assert.Nil(t, flag.EnabledAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("flag key already exists", func(t *testing.T) {
		existingFlag := &models.FeatureFlag{
			ID:       uuid.New(),
			FlagKey:  flagKey,
			FlagName: flagName,
		}

		mockRepo.On("GetByKey", ctx, flagKey).Return(existingFlag, nil).Once()

		req := CreateFeatureFlagRequest{
			FlagKey:  flagKey,
			FlagName: flagName,
		}

		flag, err := service.CreateFlag(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, flag)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("GetByKey", ctx, flagKey).Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.FeatureFlag")).Return(errors.New("db error")).Once()

		req := CreateFeatureFlagRequest{
			FlagKey:  flagKey,
			FlagName: flagName,
		}

		flag, err := service.CreateFlag(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, flag)
		assert.Contains(t, err.Error(), "failed to create flag")
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_GetByID(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedFlag := &models.FeatureFlag{
			ID:        id,
			FlagKey:   "feature.test",
			FlagName:  "Test Feature",
			IsEnabled: true,
		}

		mockRepo.On("GetByID", ctx, id).Return(expectedFlag, nil).Once()

		flag, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.Equal(t, id, flag.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		flag, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, flag)
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_GetByKey(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	flagKey := "feature.test"

	t.Run("success", func(t *testing.T) {
		expectedFlag := &models.FeatureFlag{
			ID:        uuid.New(),
			FlagKey:   flagKey,
			FlagName:  "Test Feature",
			IsEnabled: true,
		}

		mockRepo.On("GetByKey", ctx, flagKey).Return(expectedFlag, nil).Once()

		flag, err := service.GetByKey(ctx, flagKey)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.Equal(t, flagKey, flag.FlagKey)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByKey", ctx, flagKey).Return(nil, errors.New("not found")).Once()

		flag, err := service.GetByKey(ctx, flagKey)

		assert.Error(t, err)
		assert.Nil(t, flag)
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_ListFlags(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()

	t.Run("success - all categories", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		expectedFlags := []*models.FeatureFlag{
			{
				ID:        uuid.New(),
				FlagKey:   "feature.one",
				FlagName:  "Feature One",
				IsEnabled: true,
			},
			{
				ID:        uuid.New(),
				FlagKey:   "feature.two",
				FlagName:  "Feature Two",
				IsEnabled: false,
			},
		}

		mockRepo.On("List", ctx, "", limit, offset).Return(expectedFlags, int64(2), nil).Once()

		flags, total, err := service.ListFlags(ctx, "", page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, flags)
		assert.Len(t, flags, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with category filter", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0
		category := "ui"

		expectedFlags := []*models.FeatureFlag{
			{
				ID:        uuid.New(),
				FlagKey:   "feature.ui",
				FlagName:  "UI Feature",
				IsEnabled: true,
			},
		}

		mockRepo.On("List", ctx, category, limit, offset).Return(expectedFlags, int64(1), nil).Once()

		flags, total, err := service.ListFlags(ctx, category, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, flags)
		assert.Len(t, flags, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("List", ctx, "", limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		flags, total, err := service.ListFlags(ctx, "", page, limit)

		assert.Error(t, err)
		assert.Nil(t, flags)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_UpdateFlag(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingFlag := &models.FeatureFlag{
			ID:                id,
			FlagKey:           "feature.test",
			FlagName:          "Old Name",
			IsEnabled:         false,
			PercentageRollout: 0,
		}

		newName := "New Name"
		newPercentage := 50

		mockRepo.On("GetByID", ctx, id).Return(existingFlag, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.FeatureFlag")).Return(nil).Once()

		req := UpdateFeatureFlagRequest{
			FlagName:          &newName,
			PercentageRollout: &newPercentage,
		}

		flag, err := service.UpdateFlag(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.Equal(t, newName, flag.FlagName)
		assert.Equal(t, newPercentage, flag.PercentageRollout)
		mockRepo.AssertExpectations(t)
	})

	t.Run("flag not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newName := "New Name"
		req := UpdateFeatureFlagRequest{
			FlagName: &newName,
		}

		flag, err := service.UpdateFlag(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, flag)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingFlag := &models.FeatureFlag{
			ID:       id,
			FlagKey:  "feature.test",
			FlagName: "Old Name",
		}

		newName := "New Name"

		mockRepo.On("GetByID", ctx, id).Return(existingFlag, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.FeatureFlag")).Return(errors.New("db error")).Once()

		req := UpdateFeatureFlagRequest{
			FlagName: &newName,
		}

		flag, err := service.UpdateFlag(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, flag)
		assert.Contains(t, err.Error(), "failed to update flag")
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_EnableFlag(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		disabledFlag := &models.FeatureFlag{
			ID:        id,
			FlagKey:   "feature.test",
			FlagName:  "Test Feature",
			IsEnabled: false,
		}

		mockRepo.On("GetByID", ctx, id).Return(disabledFlag, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.FeatureFlag")).Return(nil).Once()

		flag, err := service.EnableFlag(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.True(t, flag.IsEnabled)
		assert.NotNil(t, flag.EnabledAt)
		assert.Nil(t, flag.DisabledAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("already enabled", func(t *testing.T) {
		enabledAt := time.Now()
		enabledFlag := &models.FeatureFlag{
			ID:        id,
			FlagKey:   "feature.test",
			FlagName:  "Test Feature",
			IsEnabled: true,
			EnabledAt: &enabledAt,
		}

		mockRepo.On("GetByID", ctx, id).Return(enabledFlag, nil).Once()

		flag, err := service.EnableFlag(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.True(t, flag.IsEnabled)
		mockRepo.AssertExpectations(t)
	})

	t.Run("flag not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		flag, err := service.EnableFlag(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, flag)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_DisableFlag(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		enabledAt := time.Now()
		enabledFlag := &models.FeatureFlag{
			ID:        id,
			FlagKey:   "feature.test",
			FlagName:  "Test Feature",
			IsEnabled: true,
			EnabledAt: &enabledAt,
		}

		mockRepo.On("GetByID", ctx, id).Return(enabledFlag, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.FeatureFlag")).Return(nil).Once()

		flag, err := service.DisableFlag(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.False(t, flag.IsEnabled)
		assert.NotNil(t, flag.DisabledAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("already disabled", func(t *testing.T) {
		disabledFlag := &models.FeatureFlag{
			ID:        id,
			FlagKey:   "feature.test",
			FlagName:  "Test Feature",
			IsEnabled: false,
		}

		mockRepo.On("GetByID", ctx, id).Return(disabledFlag, nil).Once()

		flag, err := service.DisableFlag(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, flag)
		assert.False(t, flag.IsEnabled)
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_DeleteFlag(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := service.DeleteFlag(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(errors.New("db error")).Once()

		err := service.DeleteFlag(ctx, id)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_EvaluateFlag(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()
	flagKey := "feature.test"

	t.Run("flag enabled - 100% rollout", func(t *testing.T) {
		userID := uuid.New()
		flag := &models.FeatureFlag{
			ID:                uuid.New(),
			FlagKey:           flagKey,
			FlagName:          "Test Feature",
			IsEnabled:         true,
			PercentageRollout: 100,
		}

		mockRepo.On("GetByKey", ctx, flagKey).Return(flag, nil).Once()

		enabled, err := service.EvaluateFlag(ctx, flagKey, &userID, nil, nil)

		assert.NoError(t, err)
		assert.True(t, enabled)
		mockRepo.AssertExpectations(t)
	})

	t.Run("flag disabled", func(t *testing.T) {
		userID := uuid.New()
		flag := &models.FeatureFlag{
			ID:        uuid.New(),
			FlagKey:   flagKey,
			FlagName:  "Test Feature",
			IsEnabled: false,
		}

		mockRepo.On("GetByKey", ctx, flagKey).Return(flag, nil).Once()

		enabled, err := service.EvaluateFlag(ctx, flagKey, &userID, nil, nil)

		assert.NoError(t, err)
		assert.False(t, enabled)
		mockRepo.AssertExpectations(t)
	})

	t.Run("flag not found - default to false", func(t *testing.T) {
		userID := uuid.New()

		mockRepo.On("GetByKey", ctx, flagKey).Return(nil, errors.New("not found")).Once()

		enabled, err := service.EvaluateFlag(ctx, flagKey, &userID, nil, nil)

		assert.NoError(t, err)
		assert.False(t, enabled)
		mockRepo.AssertExpectations(t)
	})

	t.Run("partial rollout with user ID", func(t *testing.T) {
		userID := uuid.New()
		flag := &models.FeatureFlag{
			ID:                uuid.New(),
			FlagKey:           flagKey,
			FlagName:          "Test Feature",
			IsEnabled:         true,
			PercentageRollout: 50, // 50% rollout
		}

		mockRepo.On("GetByKey", ctx, flagKey).Return(flag, nil).Once()

		enabled, err := service.EvaluateFlag(ctx, flagKey, &userID, nil, nil)

		assert.NoError(t, err)
		// Result depends on hash, so we just check no error
		mockRepo.AssertExpectations(t)
	})
}

func TestFeatureFlagService_GetEnabledFlags(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	service := NewFeatureFlagService(mockRepo)

	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		allFlags := []*models.FeatureFlag{
			{
				ID:        uuid.New(),
				FlagKey:   "feature.one",
				FlagName:  "Feature One",
				IsEnabled: true,
			},
			{
				ID:        uuid.New(),
				FlagKey:   "feature.two",
				FlagName:  "Feature Two",
				IsEnabled: false,
			},
			{
				ID:        uuid.New(),
				FlagKey:   "feature.three",
				FlagName:  "Feature Three",
				IsEnabled: true,
			},
		}

		mockRepo.On("List", ctx, "", 1000, 0).Return(allFlags, int64(3), nil).Once()

		enabledFlags, err := service.GetEnabledFlags(ctx)

		assert.NoError(t, err)
		assert.NotNil(t, enabledFlags)
		assert.Len(t, enabledFlags, 2) // Only 2 enabled flags
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, "", 1000, 0).Return(nil, int64(0), errors.New("db error")).Once()

		enabledFlags, err := service.GetEnabledFlags(ctx)

		assert.Error(t, err)
		assert.Nil(t, enabledFlags)
		mockRepo.AssertExpectations(t)
	})
}

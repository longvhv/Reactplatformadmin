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

// MockApplicationRepository is a mock of ApplicationRepository
type MockApplicationRepository struct {
	mock.Mock
}

func (m *MockApplicationRepository) Create(ctx context.Context, app *models.Application) error {
	args := m.Called(ctx, app)
	return args.Error(0)
}

func (m *MockApplicationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Application, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Application), args.Error(1)
}

func (m *MockApplicationRepository) GetByCode(ctx context.Context, code string) (*models.Application, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Application), args.Error(1)
}

func (m *MockApplicationRepository) Update(ctx context.Context, app *models.Application) error {
	args := m.Called(ctx, app)
	return args.Error(0)
}

func (m *MockApplicationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockApplicationRepository) List(ctx context.Context, limit, offset int) ([]*models.Application, int64, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Application), args.Get(1).(int64), args.Error(2)
}

func (m *MockApplicationRepository) ExistsByCode(ctx context.Context, code string) (bool, error) {
	args := m.Called(ctx, code)
	return args.Bool(0), args.Error(1)
}

func TestApplicationService_CreateApplication(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	service := NewApplicationService(mockRepo)

	ctx := context.Background()
	code := "TEST_APP"
	name := "Test Application"
	description := "Test description"
	appType := "web"

	t.Run("success", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Application")).Return(nil).Once()

		req := CreateApplicationRequest{
			Code:        code,
			Name:        name,
			Description: &description,
			Type:        appType,
			IsActive:    true,
		}

		app, err := service.CreateApplication(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, code, app.Code)
		assert.Equal(t, name, app.Name)
		assert.Equal(t, &description, app.Description)
		assert.Equal(t, appType, app.Type)
		assert.True(t, app.IsActive)
		assert.Equal(t, 1, app.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("code already exists", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, code).Return(true, nil).Once()

		req := CreateApplicationRequest{
			Code:     code,
			Name:     name,
			Type:     appType,
			IsActive: true,
		}

		app, err := service.CreateApplication(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty code", func(t *testing.T) {
		req := CreateApplicationRequest{
			Code:     "",
			Name:     name,
			Type:     appType,
			IsActive: true,
		}

		app, err := service.CreateApplication(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		assert.Contains(t, err.Error(), "code is required")
	})

	t.Run("repository error on exists check", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, code).Return(false, errors.New("db error")).Once()

		req := CreateApplicationRequest{
			Code:     code,
			Name:     name,
			Type:     appType,
			IsActive: true,
		}

		app, err := service.CreateApplication(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		assert.Contains(t, err.Error(), "failed to check application code")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Application")).Return(errors.New("db error")).Once()

		req := CreateApplicationRequest{
			Code:     code,
			Name:     name,
			Type:     appType,
			IsActive: true,
		}

		app, err := service.CreateApplication(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		assert.Contains(t, err.Error(), "failed to create application")
		mockRepo.AssertExpectations(t)
	})
}

func TestApplicationService_GetByID(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	service := NewApplicationService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedApp := &models.Application{
			ID:        id,
			Code:      "TEST_APP",
			Name:      "Test Application",
			Type:      "web",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, id).Return(expectedApp, nil).Once()

		app, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, expectedApp.ID, app.ID)
		assert.Equal(t, expectedApp.Code, app.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		app, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, app)
		mockRepo.AssertExpectations(t)
	})
}

func TestApplicationService_GetByCode(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	service := NewApplicationService(mockRepo)

	ctx := context.Background()
	code := "TEST_APP"

	t.Run("success", func(t *testing.T) {
		expectedApp := &models.Application{
			ID:        uuid.New(),
			Code:      code,
			Name:      "Test Application",
			Type:      "web",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}

		mockRepo.On("GetByCode", ctx, code).Return(expectedApp, nil).Once()

		app, err := service.GetByCode(ctx, code)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, code, app.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, code).Return(nil, errors.New("not found")).Once()

		app, err := service.GetByCode(ctx, code)

		assert.Error(t, err)
		assert.Nil(t, app)
		mockRepo.AssertExpectations(t)
	})
}

func TestApplicationService_List(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	service := NewApplicationService(mockRepo)

	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		expectedApps := []*models.Application{
			{
				ID:        uuid.New(),
				Code:      "APP1",
				Name:      "Application 1",
				Type:      "web",
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
				Version:   1,
			},
			{
				ID:        uuid.New(),
				Code:      "APP2",
				Name:      "Application 2",
				Type:      "mobile",
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
				Version:   1,
			},
		}

		mockRepo.On("List", ctx, limit, offset).Return(expectedApps, int64(2), nil).Once()

		apps, total, err := service.List(ctx, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, apps)
		assert.Len(t, apps, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("List", ctx, limit, offset).Return([]*models.Application{}, int64(0), nil).Once()

		apps, total, err := service.List(ctx, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, apps)
		assert.Len(t, apps, 0)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("List", ctx, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		apps, total, err := service.List(ctx, page, limit)

		assert.Error(t, err)
		assert.Nil(t, apps)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestApplicationService_UpdateApplication(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	service := NewApplicationService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingApp := &models.Application{
			ID:        id,
			Code:      "TEST_APP",
			Name:      "Old Name",
			Type:      "web",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}

		newName := "New Name"
		newDescription := "New Description"
		isActive := false

		mockRepo.On("GetByID", ctx, id).Return(existingApp, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Application")).Return(nil).Once()

		req := UpdateApplicationRequest{
			Name:        &newName,
			Description: &newDescription,
			IsActive:    &isActive,
		}

		app, err := service.UpdateApplication(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, app)
		assert.Equal(t, newName, app.Name)
		assert.Equal(t, &newDescription, app.Description)
		assert.False(t, app.IsActive)
		assert.Equal(t, 2, app.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("application not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newName := "New Name"
		req := UpdateApplicationRequest{
			Name: &newName,
		}

		app, err := service.UpdateApplication(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingApp := &models.Application{
			ID:        id,
			Code:      "TEST_APP",
			Name:      "Old Name",
			Type:      "web",
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}

		newName := "New Name"

		mockRepo.On("GetByID", ctx, id).Return(existingApp, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Application")).Return(errors.New("db error")).Once()

		req := UpdateApplicationRequest{
			Name: &newName,
		}

		app, err := service.UpdateApplication(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, app)
		assert.Contains(t, err.Error(), "failed to update application")
		mockRepo.AssertExpectations(t)
	})
}

func TestApplicationService_DeleteApplication(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	service := NewApplicationService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := service.DeleteApplication(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(errors.New("db error")).Once()

		err := service.DeleteApplication(ctx, id)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

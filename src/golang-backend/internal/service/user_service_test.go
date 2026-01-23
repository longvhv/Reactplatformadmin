package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockUserRepository is a mock of UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) Update(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserRepository) List(ctx context.Context, page, limit int) ([]*models.User, int64, error) {
	args := m.Called(ctx, page, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	args := m.Called(ctx, email)
	return args.Bool(0), args.Error(1)
}

func TestUserService_CreateUser(t *testing.T) {
	mockRepo := new(MockUserRepository)
	service := &UserService{
		userRepo: mockRepo,
	}

	ctx := context.Background()
	email := "test@example.com"
	password := "Test@123"
	fullName := "Test User"

	t.Run("success", func(t *testing.T) {
		mockRepo.On("ExistsByEmail", ctx, email).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.User")).Return(nil).Once()

		req := CreateUserRequest{
			Email:    email,
			Password: password,
			FullName: fullName,
		}

		user, err := service.CreateUser(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, email, user.Email)
		assert.Equal(t, fullName, user.FullName)
		assert.NotEmpty(t, user.PasswordHash)
		mockRepo.AssertExpectations(t)
	})

	t.Run("email already exists", func(t *testing.T) {
		mockRepo.On("ExistsByEmail", ctx, email).Return(true, nil).Once()

		req := CreateUserRequest{
			Email:    email,
			Password: password,
			FullName: fullName,
		}

		user, err := service.CreateUser(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})
}

func TestUserService_GetUserByID(t *testing.T) {
	mockRepo := new(MockUserRepository)
	service := &UserService{
		userRepo: mockRepo,
	}

	ctx := context.Background()
	userID := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedUser := &models.User{
			ID:       userID,
			Email:    "test@example.com",
			FullName: "Test User",
		}

		mockRepo.On("GetByID", ctx, userID).Return(expectedUser, nil).Once()

		user, err := service.GetUserByID(ctx, userID)

		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, userID, user.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, userID).Return(nil, ErrNotFound).Once()

		user, err := service.GetUserByID(ctx, userID)

		assert.Error(t, err)
		assert.Nil(t, user)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserService_UpdateUser(t *testing.T) {
	mockRepo := new(MockUserRepository)
	service := &UserService{
		userRepo: mockRepo,
	}

	ctx := context.Background()
	userID := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingUser := &models.User{
			ID:        userID,
			Email:     "test@example.com",
			FullName:  "Old Name",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		newName := "New Name"

		mockRepo.On("GetByID", ctx, userID).Return(existingUser, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.User")).Return(nil).Once()

		req := UpdateUserRequest{
			FullName: &newName,
		}

		user, err := service.UpdateUser(ctx, userID, req)

		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, newName, user.FullName)
		mockRepo.AssertExpectations(t)
	})
}

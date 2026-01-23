package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/auth"
)

// MockUserRepository is a mock implementation of UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *models.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) Exists(ctx context.Context, email string) (bool, error) {
	args := m.Called(ctx, email)
	return args.Bool(0), args.Error(1)
}

// Additional methods would be mocked here...

func TestAuthService_Register(t *testing.T) {
	// Setup
	mockRepo := new(MockUserRepository)
	jwtManager := auth.NewJWTManager("test-secret", 15*time.Minute, 7*24*time.Hour, "test-issuer", "test-audience")
	passwordValidator := auth.NewPasswordValidator(8, true, true, true, true)
	authService := service.NewAuthService(mockRepo, jwtManager, passwordValidator)

	ctx := context.Background()

	t.Run("Success - Valid registration", func(t *testing.T) {
		// Arrange
		req := service.RegisterRequest{
			Email:     "test@example.com",
			Password:  "Password123!",
			FirstName: "Test",
			LastName:  "User",
		}

		mockRepo.On("Exists", ctx, req.Email).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.User")).Return(nil).Once()

		// Act
		user, err := authService.Register(ctx, req)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, req.Email, user.Email)
		assert.Equal(t, req.FirstName, user.FirstName)
		assert.Equal(t, req.LastName, user.LastName)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Failure - Email already exists", func(t *testing.T) {
		// Arrange
		req := service.RegisterRequest{
			Email:     "existing@example.com",
			Password:  "Password123!",
			FirstName: "Test",
			LastName:  "User",
		}

		mockRepo.On("Exists", ctx, req.Email).Return(true, nil).Once()

		// Act
		user, err := authService.Register(ctx, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, user)
		assert.Contains(t, err.Error(), "email already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("Failure - Weak password", func(t *testing.T) {
		// Arrange
		req := service.RegisterRequest{
			Email:     "test@example.com",
			Password:  "weak",
			FirstName: "Test",
			LastName:  "User",
		}

		mockRepo.On("Exists", ctx, req.Email).Return(false, nil).Once()

		// Act
		user, err := authService.Register(ctx, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, user)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuthService_Login(t *testing.T) {
	// Setup
	mockRepo := new(MockUserRepository)
	jwtManager := auth.NewJWTManager("test-secret", 15*time.Minute, 7*24*time.Hour, "test-issuer", "test-audience")
	passwordValidator := auth.NewPasswordValidator(8, true, true, true, true)
	authService := service.NewAuthService(mockRepo, jwtManager, passwordValidator)

	ctx := context.Background()

	t.Run("Success - Valid credentials", func(t *testing.T) {
		// Arrange
		hasher := auth.NewPasswordHasher()
		password := "Password123!"
		hashedPassword, _ := hasher.Hash(password)

		user := &models.User{
			BaseModel:       models.NewBaseModel(),
			Email:           "test@example.com",
			PasswordHash:    hashedPassword,
			FirstName:       "Test",
			LastName:        "User",
			Status:          "ACTIVE",
			IsEmailVerified: true,
		}

		req := service.LoginRequest{
			Email:    "test@example.com",
			Password: password,
		}

		mockRepo.On("GetByEmail", ctx, req.Email).Return(user, nil).Once()

		// Act
		response, err := authService.Login(ctx, req)

		// Assert
		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.NotEmpty(t, response.AccessToken)
		assert.NotEmpty(t, response.RefreshToken)
		assert.Equal(t, user.Email, response.User.Email)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Failure - Invalid email", func(t *testing.T) {
		// Arrange
		req := service.LoginRequest{
			Email:    "notfound@example.com",
			Password: "Password123!",
		}

		mockRepo.On("GetByEmail", ctx, req.Email).Return(nil, assert.AnError).Once()

		// Act
		response, err := authService.Login(ctx, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, response)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Failure - Invalid password", func(t *testing.T) {
		// Arrange
		hasher := auth.NewPasswordHasher()
		hashedPassword, _ := hasher.Hash("CorrectPassword123!")

		user := &models.User{
			BaseModel:       models.NewBaseModel(),
			Email:           "test@example.com",
			PasswordHash:    hashedPassword,
			FirstName:       "Test",
			LastName:        "User",
			Status:          "ACTIVE",
			IsEmailVerified: true,
		}

		req := service.LoginRequest{
			Email:    "test@example.com",
			Password: "WrongPassword123!",
		}

		mockRepo.On("GetByEmail", ctx, req.Email).Return(user, nil).Once()

		// Act
		response, err := authService.Login(ctx, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Contains(t, err.Error(), "invalid credentials")
		mockRepo.AssertExpectations(t)
	})

	t.Run("Failure - Inactive user", func(t *testing.T) {
		// Arrange
		hasher := auth.NewPasswordHasher()
		password := "Password123!"
		hashedPassword, _ := hasher.Hash(password)

		user := &models.User{
			BaseModel:       models.NewBaseModel(),
			Email:           "test@example.com",
			PasswordHash:    hashedPassword,
			FirstName:       "Test",
			LastName:        "User",
			Status:          "INACTIVE",
			IsEmailVerified: true,
		}

		req := service.LoginRequest{
			Email:    "test@example.com",
			Password: password,
		}

		mockRepo.On("GetByEmail", ctx, req.Email).Return(user, nil).Once()

		// Act
		response, err := authService.Login(ctx, req)

		// Assert
		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Contains(t, err.Error(), "account is not active")
		mockRepo.AssertExpectations(t)
	})
}

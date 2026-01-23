package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// MockServiceAccountRepository is a mock of ServiceAccountRepository
type MockServiceAccountRepository struct {
	mock.Mock
}

func (m *MockServiceAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ServiceAccount), args.Error(1)
}

func (m *MockServiceAccountRepository) GetByClientID(ctx context.Context, clientID string) (*models.ServiceAccount, error) {
	args := m.Called(ctx, clientID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ServiceAccount), args.Error(1)
}

func (m *MockServiceAccountRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.ServiceAccount, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.ServiceAccount), args.Get(1).(int64), args.Error(2)
}

func (m *MockServiceAccountRepository) ExistsByClientID(ctx context.Context, clientID string) (bool, error) {
	args := m.Called(ctx, clientID)
	return args.Bool(0), args.Error(1)
}

func (m *MockServiceAccountRepository) Create(ctx context.Context, account *models.ServiceAccount) error {
	args := m.Called(ctx, account)
	return args.Error(0)
}

func (m *MockServiceAccountRepository) Update(ctx context.Context, account *models.ServiceAccount) error {
	args := m.Called(ctx, account)
	return args.Error(0)
}

func (m *MockServiceAccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestServiceAccountService_CreateAccount(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		req := CreateServiceAccountRequest{
			TenantID: uuid.New(),
			MemberID: uuid.New(),
			Name:     "API Service Account",
		}

		mockRepo.On("ExistsByClientID", ctx, mock.Anything).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(nil).Once()

		account, clientSecret, err := service.CreateAccount(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, account)
		assert.NotEmpty(t, clientSecret)
		assert.True(t, account.IsActive)
		assert.Empty(t, account.ClientSecretHash) // Should be hidden
		assert.NotEmpty(t, account.ClientID)
		assert.Contains(t, account.ClientID, "sa_")
		assert.Contains(t, clientSecret, "sk_")
		assert.Equal(t, "API Service Account", account.Name)
		assert.Equal(t, 1, account.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with description", func(t *testing.T) {
		description := "Service account for CI/CD"
		req := CreateServiceAccountRequest{
			TenantID:    uuid.New(),
			MemberID:    uuid.New(),
			Name:        "CI/CD Account",
			Description: &description,
		}

		mockRepo.On("ExistsByClientID", ctx, mock.Anything).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(nil).Once()

		account, _, err := service.CreateAccount(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, account.Description)
		assert.Equal(t, description, *account.Description)
		mockRepo.AssertExpectations(t)
	})

	t.Run("client ID collision - retry", func(t *testing.T) {
		req := CreateServiceAccountRequest{
			TenantID: uuid.New(),
			MemberID: uuid.New(),
			Name:     "Test Account",
		}

		// First check finds collision, second check succeeds
		mockRepo.On("ExistsByClientID", ctx, mock.Anything).Return(true, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(nil).Once()

		account, _, err := service.CreateAccount(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, account)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateServiceAccountRequest{
			TenantID: uuid.New(),
			MemberID: uuid.New(),
			Name:     "Test Account",
		}

		mockRepo.On("ExistsByClientID", ctx, mock.Anything).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(errors.New("db error")).Once()

		account, secret, err := service.CreateAccount(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, account)
		assert.Empty(t, secret)
		mockRepo.AssertExpectations(t)
	})
}

func TestServiceAccountService_GetByID(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		accountID := uuid.New()
		expected := &models.ServiceAccount{
			ID:               accountID,
			Name:             "Test Account",
			ClientSecretHash: "hashed_secret",
		}

		mockRepo.On("GetByID", ctx, accountID).Return(expected, nil).Once()

		account, err := service.GetByID(ctx, accountID)

		assert.NoError(t, err)
		assert.NotNil(t, account)
		assert.Empty(t, account.ClientSecretHash) // Should be hidden
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		accountID := uuid.New()
		mockRepo.On("GetByID", ctx, accountID).Return(nil, errors.New("not found")).Once()

		account, err := service.GetByID(ctx, accountID)

		assert.Error(t, err)
		assert.Nil(t, account)
		mockRepo.AssertExpectations(t)
	})
}

func TestServiceAccountService_ListByTenant(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.ServiceAccount{
			{ID: uuid.New(), Name: "Account 1", ClientSecretHash: "hash1"},
			{ID: uuid.New(), Name: "Account 2", ClientSecretHash: "hash2"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, 10, 0).Return(expected, int64(2), nil).Once()

		accounts, total, err := service.ListByTenant(ctx, tenantID, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, accounts, 2)
		assert.Equal(t, int64(2), total)
		// Verify secrets are hidden
		for _, account := range accounts {
			assert.Empty(t, account.ClientSecretHash)
		}
		mockRepo.AssertExpectations(t)
	})
}

func TestServiceAccountService_UpdateAccount(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		accountID := uuid.New()
		existing := &models.ServiceAccount{
			ID:       accountID,
			Name:     "Old Name",
			IsActive: true,
			Version:  1,
		}

		newName := "New Name"
		newDescription := "Updated description"
		isActive := false
		req := UpdateServiceAccountRequest{
			Name:        &newName,
			Description: &newDescription,
			IsActive:    &isActive,
		}

		mockRepo.On("GetByID", ctx, accountID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(nil).Once()

		account, err := service.UpdateAccount(ctx, accountID, req)

		assert.NoError(t, err)
		assert.Equal(t, "New Name", account.Name)
		assert.Equal(t, &newDescription, account.Description)
		assert.False(t, account.IsActive)
		assert.Equal(t, 2, account.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("account not found", func(t *testing.T) {
		accountID := uuid.New()
		req := UpdateServiceAccountRequest{}

		mockRepo.On("GetByID", ctx, accountID).Return(nil, errors.New("not found")).Once()

		account, err := service.UpdateAccount(ctx, accountID, req)

		assert.Error(t, err)
		assert.Nil(t, account)
		mockRepo.AssertExpectations(t)
	})
}

func TestServiceAccountService_DeleteAccount(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		accountID := uuid.New()

		mockRepo.On("Delete", ctx, accountID).Return(nil).Once()

		err := service.DeleteAccount(ctx, accountID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		accountID := uuid.New()

		mockRepo.On("Delete", ctx, accountID).Return(errors.New("db error")).Once()

		err := service.DeleteAccount(ctx, accountID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestServiceAccountService_RegenerateSecret(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		accountID := uuid.New()
		existing := &models.ServiceAccount{
			ID:               accountID,
			ClientSecretHash: "old_hash",
			Version:          1,
		}

		mockRepo.On("GetByID", ctx, accountID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(nil).Once()

		account, newSecret, err := service.RegenerateSecret(ctx, accountID)

		assert.NoError(t, err)
		assert.NotNil(t, account)
		assert.NotEmpty(t, newSecret)
		assert.Contains(t, newSecret, "sk_")
		assert.Empty(t, account.ClientSecretHash) // Should be hidden
		assert.Equal(t, 2, account.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("account not found", func(t *testing.T) {
		accountID := uuid.New()

		mockRepo.On("GetByID", ctx, accountID).Return(nil, errors.New("not found")).Once()

		account, secret, err := service.RegenerateSecret(ctx, accountID)

		assert.Error(t, err)
		assert.Nil(t, account)
		assert.Empty(t, secret)
		mockRepo.AssertExpectations(t)
	})
}

func TestServiceAccountService_ToggleAccount(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("toggle active to inactive", func(t *testing.T) {
		accountID := uuid.New()
		existing := &models.ServiceAccount{
			ID:       accountID,
			IsActive: true,
			Version:  1,
		}

		mockRepo.On("GetByID", ctx, accountID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(nil).Once()

		account, err := service.ToggleAccount(ctx, accountID)

		assert.NoError(t, err)
		assert.False(t, account.IsActive)
		assert.Equal(t, 2, account.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("toggle inactive to active", func(t *testing.T) {
		accountID := uuid.New()
		existing := &models.ServiceAccount{
			ID:       accountID,
			IsActive: false,
			Version:  1,
		}

		mockRepo.On("GetByID", ctx, accountID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.ServiceAccount")).Return(nil).Once()

		account, err := service.ToggleAccount(ctx, accountID)

		assert.NoError(t, err)
		assert.True(t, account.IsActive)
		mockRepo.AssertExpectations(t)
	})
}

func TestServiceAccountService_ValidateCredentials(t *testing.T) {
	mockRepo := new(MockServiceAccountRepository)
	service := NewServiceAccountService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		clientID := "sa_test123"
		clientSecret := "sk_secret123"
		
		// Hash the secret for comparison
		hash, _ := bcrypt.GenerateFromPassword([]byte(clientSecret), bcrypt.DefaultCost)
		
		account := &models.ServiceAccount{
			ID:               uuid.New(),
			ClientID:         clientID,
			ClientSecretHash: string(hash),
			IsActive:         true,
		}

		mockRepo.On("GetByClientID", ctx, clientID).Return(account, nil).Once()

		validatedAccount, err := service.ValidateCredentials(ctx, clientID, clientSecret)

		assert.NoError(t, err)
		assert.NotNil(t, validatedAccount)
		assert.Equal(t, account.ID, validatedAccount.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid client ID", func(t *testing.T) {
		clientID := "invalid_client"
		clientSecret := "sk_secret123"

		mockRepo.On("GetByClientID", ctx, clientID).Return(nil, errors.New("not found")).Once()

		account, err := service.ValidateCredentials(ctx, clientID, clientSecret)

		assert.Error(t, err)
		assert.Nil(t, account)
		assert.Contains(t, err.Error(), "invalid credentials")
		mockRepo.AssertExpectations(t)
	})

	t.Run("inactive account", func(t *testing.T) {
		clientID := "sa_test123"
		clientSecret := "sk_secret123"
		
		account := &models.ServiceAccount{
			ID:       uuid.New(),
			ClientID: clientID,
			IsActive: false,
		}

		mockRepo.On("GetByClientID", ctx, clientID).Return(account, nil).Once()

		validatedAccount, err := service.ValidateCredentials(ctx, clientID, clientSecret)

		assert.Error(t, err)
		assert.Nil(t, validatedAccount)
		assert.Contains(t, err.Error(), "not active")
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid secret", func(t *testing.T) {
		clientID := "sa_test123"
		correctSecret := "sk_correct123"
		wrongSecret := "sk_wrong123"
		
		hash, _ := bcrypt.GenerateFromPassword([]byte(correctSecret), bcrypt.DefaultCost)
		
		account := &models.ServiceAccount{
			ID:               uuid.New(),
			ClientID:         clientID,
			ClientSecretHash: string(hash),
			IsActive:         true,
		}

		mockRepo.On("GetByClientID", ctx, clientID).Return(account, nil).Once()

		validatedAccount, err := service.ValidateCredentials(ctx, clientID, wrongSecret)

		assert.Error(t, err)
		assert.Nil(t, validatedAccount)
		assert.Contains(t, err.Error(), "invalid credentials")
		mockRepo.AssertExpectations(t)
	})
}

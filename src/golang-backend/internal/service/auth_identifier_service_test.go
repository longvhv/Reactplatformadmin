package service

import (
	"context"
	"crypto/sha256"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang-backend/internal/models"
)

// MockAuthIdentifierRepository is a mock of AuthIdentifierRepository
type MockAuthIdentifierRepository struct {
	mock.Mock
}

func (m *MockAuthIdentifierRepository) GetByHash(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) (*models.AuthIdentifier, error) {
	args := m.Called(ctx, tenantID, identifierHash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.AuthIdentifier), args.Error(1)
}

func (m *MockAuthIdentifierRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.AuthIdentifier, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.AuthIdentifier), args.Error(1)
}

func (m *MockAuthIdentifierRepository) Create(ctx context.Context, identifier *models.AuthIdentifier) error {
	args := m.Called(ctx, identifier)
	return args.Error(0)
}

func (m *MockAuthIdentifierRepository) Delete(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) error {
	args := m.Called(ctx, tenantID, identifierHash)
	return args.Error(0)
}

func TestAuthIdentifierService_CreateIdentifier(t *testing.T) {
	mockRepo := new(MockAuthIdentifierRepository)
	service := NewAuthIdentifierService(mockRepo)
	ctx := context.Background()

	t.Run("success - email identifier", func(t *testing.T) {
		email := "user@example.com"
		hash := sha256.Sum256([]byte(email))
		tenantID := uuid.New()
		userID := uuid.New()
		identityID := uuid.New()

		req := &models.CreateAuthIdentifierRequest{
			TenantID:       tenantID,
			IdentifierHash: hash[:],
			UserID:         userID,
			IdentityID:     &identityID,
			IdentifierType: "EMAIL",
			OriginalValue:  &email,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuthIdentifier")).Return(nil).Once()

		identifier, err := service.CreateIdentifier(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, identifier)
		assert.Equal(t, tenantID, identifier.TenantID)
		assert.Equal(t, userID, identifier.UserID)
		assert.Equal(t, "EMAIL", identifier.IdentifierType)
		assert.Equal(t, &email, identifier.OriginalValue)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - phone identifier", func(t *testing.T) {
		phone := "+1234567890"
		hash := sha256.Sum256([]byte(phone))
		tenantID := uuid.New()
		userID := uuid.New()

		req := &models.CreateAuthIdentifierRequest{
			TenantID:       tenantID,
			IdentifierHash: hash[:],
			UserID:         userID,
			IdentityID:     nil, // Optional
			IdentifierType: "PHONE",
			OriginalValue:  &phone,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuthIdentifier")).Return(nil).Once()

		identifier, err := service.CreateIdentifier(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "PHONE", identifier.IdentifierType)
		assert.Nil(t, identifier.IdentityID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - username identifier", func(t *testing.T) {
		username := "john_doe"
		hash := sha256.Sum256([]byte(username))
		tenantID := uuid.New()
		userID := uuid.New()

		req := &models.CreateAuthIdentifierRequest{
			TenantID:       tenantID,
			IdentifierHash: hash[:],
			UserID:         userID,
			IdentifierType: "USERNAME",
			OriginalValue:  &username,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuthIdentifier")).Return(nil).Once()

		identifier, err := service.CreateIdentifier(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "USERNAME", identifier.IdentifierType)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - SSO identifier", func(t *testing.T) {
		ssoID := "google|12345"
		hash := sha256.Sum256([]byte(ssoID))
		tenantID := uuid.New()
		userID := uuid.New()

		req := &models.CreateAuthIdentifierRequest{
			TenantID:       tenantID,
			IdentifierHash: hash[:],
			UserID:         userID,
			IdentifierType: "SSO",
			OriginalValue:  &ssoID,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuthIdentifier")).Return(nil).Once()

		identifier, err := service.CreateIdentifier(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "SSO", identifier.IdentifierType)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateAuthIdentifierRequest{
			TenantID:       uuid.New(),
			IdentifierHash: []byte("hash"),
			UserID:         uuid.New(),
			IdentifierType: "EMAIL",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.AuthIdentifier")).Return(errors.New("db error")).Once()

		identifier, err := service.CreateIdentifier(ctx, req)

		assert.Error(t, err)
		assert.NotNil(t, identifier) // Service returns object even on error
		mockRepo.AssertExpectations(t)
	})
}

func TestAuthIdentifierService_GetIdentifierByHash(t *testing.T) {
	mockRepo := new(MockAuthIdentifierRepository)
	service := NewAuthIdentifierService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		email := "user@example.com"
		hash := sha256.Sum256([]byte(email))

		expected := &models.AuthIdentifier{
			TenantID:       tenantID,
			IdentifierHash: hash[:],
			UserID:         userID,
			IdentifierType: "EMAIL",
			OriginalValue:  &email,
		}

		mockRepo.On("GetByHash", ctx, tenantID, hash[:]).Return(expected, nil).Once()

		identifier, err := service.GetIdentifierByHash(ctx, tenantID, hash[:])

		assert.NoError(t, err)
		assert.NotNil(t, identifier)
		assert.Equal(t, tenantID, identifier.TenantID)
		assert.Equal(t, userID, identifier.UserID)
		assert.Equal(t, "EMAIL", identifier.IdentifierType)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		tenantID := uuid.New()
		hash := []byte("unknown_hash")

		mockRepo.On("GetByHash", ctx, tenantID, hash).Return(nil, errors.New("not found")).Once()

		identifier, err := service.GetIdentifierByHash(ctx, tenantID, hash)

		assert.Error(t, err)
		assert.Nil(t, identifier)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuthIdentifierService_ListIdentifiersByUser(t *testing.T) {
	mockRepo := new(MockAuthIdentifierRepository)
	service := NewAuthIdentifierService(mockRepo)
	ctx := context.Background()

	t.Run("success - multiple identifiers", func(t *testing.T) {
		userID := uuid.New()
		email := "user@example.com"
		phone := "+1234567890"
		
		expected := []*models.AuthIdentifier{
			{
				UserID:         userID,
				IdentifierType: "EMAIL",
				OriginalValue:  &email,
			},
			{
				UserID:         userID,
				IdentifierType: "PHONE",
				OriginalValue:  &phone,
			},
		}

		mockRepo.On("ListByUser", ctx, userID).Return(expected, nil).Once()

		identifiers, err := service.ListIdentifiersByUser(ctx, userID)

		assert.NoError(t, err)
		assert.Len(t, identifiers, 2)
		assert.Equal(t, "EMAIL", identifiers[0].IdentifierType)
		assert.Equal(t, "PHONE", identifiers[1].IdentifierType)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - single identifier", func(t *testing.T) {
		userID := uuid.New()
		username := "john_doe"

		expected := []*models.AuthIdentifier{
			{
				UserID:         userID,
				IdentifierType: "USERNAME",
				OriginalValue:  &username,
			},
		}

		mockRepo.On("ListByUser", ctx, userID).Return(expected, nil).Once()

		identifiers, err := service.ListIdentifiersByUser(ctx, userID)

		assert.NoError(t, err)
		assert.Len(t, identifiers, 1)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - no identifiers", func(t *testing.T) {
		userID := uuid.New()

		mockRepo.On("ListByUser", ctx, userID).Return([]*models.AuthIdentifier{}, nil).Once()

		identifiers, err := service.ListIdentifiersByUser(ctx, userID)

		assert.NoError(t, err)
		assert.Empty(t, identifiers)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		userID := uuid.New()

		mockRepo.On("ListByUser", ctx, userID).Return(nil, errors.New("db error")).Once()

		identifiers, err := service.ListIdentifiersByUser(ctx, userID)

		assert.Error(t, err)
		assert.Nil(t, identifiers)
		mockRepo.AssertExpectations(t)
	})
}

func TestAuthIdentifierService_DeleteIdentifier(t *testing.T) {
	mockRepo := new(MockAuthIdentifierRepository)
	service := NewAuthIdentifierService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		hash := []byte("identifier_hash")

		mockRepo.On("Delete", ctx, tenantID, hash).Return(nil).Once()

		err := service.DeleteIdentifier(ctx, tenantID, hash)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()
		hash := []byte("identifier_hash")

		mockRepo.On("Delete", ctx, tenantID, hash).Return(errors.New("db error")).Once()

		err := service.DeleteIdentifier(ctx, tenantID, hash)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

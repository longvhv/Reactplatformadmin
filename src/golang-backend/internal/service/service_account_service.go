package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

// ServiceAccountService defines the interface for service account business logic
type ServiceAccountService interface {
	CreateServiceAccount(ctx context.Context, req *models.CreateServiceAccountRequest) (*models.ServiceAccountResponse, error)
	GetServiceAccount(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, error)
	GetServiceAccountByClientID(ctx context.Context, clientID string) (*models.ServiceAccount, error)
	ListServiceAccounts(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, isActive *bool) ([]*models.ServiceAccount, int, error)
	ListServiceAccountsByTenant(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*models.ServiceAccount, int, error)
	ListServiceAccountsByMember(ctx context.Context, memberID uuid.UUID) ([]*models.ServiceAccount, error)
	UpdateServiceAccount(ctx context.Context, id uuid.UUID, req *models.UpdateServiceAccountRequest) (*models.ServiceAccount, error)
	DeleteServiceAccount(ctx context.Context, id uuid.UUID) error
	ActivateServiceAccount(ctx context.Context, id uuid.UUID) error
	DeactivateServiceAccount(ctx context.Context, id uuid.UUID) error
	ValidateCredentials(ctx context.Context, clientID, clientSecret string) (*models.ServiceAccount, error)
	RegenerateClientSecret(ctx context.Context, id uuid.UUID) (*models.ServiceAccountResponse, error)
}

type serviceAccountService struct {
	repo repository.ServiceAccountRepository
}

// NewServiceAccountService creates a new service account service
func NewServiceAccountService(repo repository.ServiceAccountRepository) ServiceAccountService {
	return &serviceAccountService{repo: repo}
}

// generateClientID generates a unique client ID
func generateClientID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "sa_" + hex.EncodeToString(bytes), nil
}

// generateClientSecret generates a secure random client secret
func generateClientSecret() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

// hashClientSecret hashes the client secret using SHA256
func hashClientSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

// CreateServiceAccount creates a new service account with generated credentials
func (s *serviceAccountService) CreateServiceAccount(ctx context.Context, req *models.CreateServiceAccountRequest) (*models.ServiceAccountResponse, error) {
	// Generate client ID and secret
	clientID, err := generateClientID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate client ID: %w", err)
	}

	clientSecret, err := generateClientSecret()
	if err != nil {
		return nil, fmt.Errorf("failed to generate client secret: %w", err)
	}

	// Hash the secret for storage
	secretHash := hashClientSecret(clientSecret)

	now := time.Now()
	account := &models.ServiceAccount{
		BaseModel: models.BaseModel{
			ID:        uuid.New(),
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		},
		TenantID:         req.TenantID,
		MemberID:         req.MemberID,
		Name:             req.Name,
		ClientID:         clientID,
		ClientSecretHash: secretHash,
		IsActive:         true,
	}

	if req.Description != "" {
		account.Description.String = req.Description
		account.Description.Valid = true
	}

	if err := s.repo.Create(ctx, account); err != nil {
		return nil, fmt.Errorf("failed to create service account: %w", err)
	}

	// Return with plain secret (only time it's exposed)
	return &models.ServiceAccountResponse{
		ServiceAccount: *account,
		ClientSecret:   clientSecret,
	}, nil
}

// GetServiceAccount gets a service account by ID
func (s *serviceAccountService) GetServiceAccount(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, error) {
	return s.repo.GetByID(ctx, id)
}

// GetServiceAccountByClientID gets a service account by client ID
func (s *serviceAccountService) GetServiceAccountByClientID(ctx context.Context, clientID string) (*models.ServiceAccount, error) {
	return s.repo.GetByClientID(ctx, clientID)
}

// ListServiceAccounts lists service accounts with pagination and filters
func (s *serviceAccountService) ListServiceAccounts(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, isActive *bool) ([]*models.ServiceAccount, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, isActive)
}

// ListServiceAccountsByTenant lists service accounts for a specific tenant
func (s *serviceAccountService) ListServiceAccountsByTenant(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*models.ServiceAccount, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.ListByTenantID(ctx, tenantID, page, pageSize)
}

// ListServiceAccountsByMember lists service accounts for a specific member
func (s *serviceAccountService) ListServiceAccountsByMember(ctx context.Context, memberID uuid.UUID) ([]*models.ServiceAccount, error) {
	return s.repo.ListByMemberID(ctx, memberID)
}

// UpdateServiceAccount updates a service account
func (s *serviceAccountService) UpdateServiceAccount(ctx context.Context, id uuid.UUID, req *models.UpdateServiceAccountRequest) (*models.ServiceAccount, error) {
	account, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Name != nil {
		account.Name = *req.Name
	}
	if req.Description != nil {
		if *req.Description == "" {
			account.Description.Valid = false
		} else {
			account.Description.String = *req.Description
			account.Description.Valid = true
		}
	}
	if req.IsActive != nil {
		account.IsActive = *req.IsActive
	}

	account.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, account); err != nil {
		return nil, fmt.Errorf("failed to update service account: %w", err)
	}

	return account, nil
}

// DeleteServiceAccount deletes a service account
func (s *serviceAccountService) DeleteServiceAccount(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// ActivateServiceAccount activates a service account
func (s *serviceAccountService) ActivateServiceAccount(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateStatus(ctx, id, true)
}

// DeactivateServiceAccount deactivates a service account
func (s *serviceAccountService) DeactivateServiceAccount(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateStatus(ctx, id, false)
}

// ValidateCredentials validates client credentials
func (s *serviceAccountService) ValidateCredentials(ctx context.Context, clientID, clientSecret string) (*models.ServiceAccount, error) {
	secretHash := hashClientSecret(clientSecret)
	return s.repo.ValidateCredentials(ctx, clientID, secretHash)
}

// RegenerateClientSecret generates a new client secret for an existing account
func (s *serviceAccountService) RegenerateClientSecret(ctx context.Context, id uuid.UUID) (*models.ServiceAccountResponse, error) {
	account, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Generate new secret
	clientSecret, err := generateClientSecret()
	if err != nil {
		return nil, fmt.Errorf("failed to generate client secret: %w", err)
	}

	// Update the hash
	account.ClientSecretHash = hashClientSecret(clientSecret)
	account.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, account); err != nil {
		return nil, fmt.Errorf("failed to update service account: %w", err)
	}

	// Return with new plain secret
	return &models.ServiceAccountResponse{
		ServiceAccount: *account,
		ClientSecret:   clientSecret,
	}, nil
}

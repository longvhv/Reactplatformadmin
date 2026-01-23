package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type ServiceAccountService struct {
	serviceAccountRepo repository.ServiceAccountRepository
}

func NewServiceAccountService(serviceAccountRepo repository.ServiceAccountRepository) *ServiceAccountService {
	return &ServiceAccountService{
		serviceAccountRepo: serviceAccountRepo,
	}
}

type CreateServiceAccountRequest struct {
	TenantID    uuid.UUID `json:"tenant_id" binding:"required"`
	MemberID    uuid.UUID `json:"member_id" binding:"required"`
	Name        string    `json:"name" binding:"required"`
	Description *string   `json:"description"`
}

type UpdateServiceAccountRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

// GetByID gets service account by ID
func (s *ServiceAccountService) GetByID(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, error) {
	account, err := s.serviceAccountRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Don't expose secret hash
	account.ClientSecretHash = ""

	return account, nil
}

// ListByTenant lists service accounts by tenant
func (s *ServiceAccountService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.ServiceAccount, int64, error) {
	offset := (page - 1) * limit
	accounts, total, err := s.serviceAccountRepo.ListByTenant(ctx, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// Don't expose secret hashes
	for _, account := range accounts {
		account.ClientSecretHash = ""
	}

	return accounts, total, nil
}

// CreateAccount creates a new service account
func (s *ServiceAccountService) CreateAccount(ctx context.Context, req CreateServiceAccountRequest) (*models.ServiceAccount, string, error) {
	// Generate client ID
	clientID := generateClientID()

	// Check if client ID exists (unlikely but possible)
	exists, err := s.serviceAccountRepo.ExistsByClientID(ctx, clientID)
	if err != nil {
		return nil, "", fmt.Errorf("failed to check client ID: %w", err)
	}
	if exists {
		// Try again with new ID
		clientID = generateClientID()
	}

	// Generate client secret
	clientSecret := generateClientSecret()

	// Hash the secret
	secretHash, err := hashSecret(clientSecret)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash secret: %w", err)
	}

	account := &models.ServiceAccount{
		ID:               uuid.New(),
		TenantID:         req.TenantID,
		MemberID:         req.MemberID,
		Name:             req.Name,
		Description:      req.Description,
		ClientID:         clientID,
		ClientSecretHash: secretHash,
		IsActive:         true,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		Version:          1,
	}

	if err := s.serviceAccountRepo.Create(ctx, account); err != nil {
		return nil, "", fmt.Errorf("failed to create service account: %w", err)
	}

	// Don't expose hash in response
	account.ClientSecretHash = ""

	return account, clientSecret, nil
}

// UpdateAccount updates a service account
func (s *ServiceAccountService) UpdateAccount(ctx context.Context, id uuid.UUID, req UpdateServiceAccountRequest) (*models.ServiceAccount, error) {
	account, err := s.serviceAccountRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("service account not found: %w", err)
	}

	if req.Name != nil {
		account.Name = *req.Name
	}
	if req.Description != nil {
		account.Description = req.Description
	}
	if req.IsActive != nil {
		account.IsActive = *req.IsActive
	}

	account.UpdatedAt = time.Now()
	account.Version++

	if err := s.serviceAccountRepo.Update(ctx, account); err != nil {
		return nil, fmt.Errorf("failed to update service account: %w", err)
	}

	// Don't expose hash
	account.ClientSecretHash = ""

	return account, nil
}

// DeleteAccount deletes a service account
func (s *ServiceAccountService) DeleteAccount(ctx context.Context, id uuid.UUID) error {
	return s.serviceAccountRepo.Delete(ctx, id)
}

// RegenerateSecret regenerates client secret
func (s *ServiceAccountService) RegenerateSecret(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, string, error) {
	account, err := s.serviceAccountRepo.GetByID(ctx, id)
	if err != nil {
		return nil, "", fmt.Errorf("service account not found: %w", err)
	}

	// Generate new secret
	newSecret := generateClientSecret()

	// Hash it
	secretHash, err := hashSecret(newSecret)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash secret: %w", err)
	}

	account.ClientSecretHash = secretHash
	account.UpdatedAt = time.Now()
	account.Version++

	if err := s.serviceAccountRepo.Update(ctx, account); err != nil {
		return nil, "", fmt.Errorf("failed to update service account: %w", err)
	}

	// Don't expose hash
	account.ClientSecretHash = ""

	return account, newSecret, nil
}

// ToggleAccount toggles service account active status
func (s *ServiceAccountService) ToggleAccount(ctx context.Context, id uuid.UUID) (*models.ServiceAccount, error) {
	account, err := s.serviceAccountRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("service account not found: %w", err)
	}

	account.IsActive = !account.IsActive
	account.UpdatedAt = time.Now()
	account.Version++

	if err := s.serviceAccountRepo.Update(ctx, account); err != nil {
		return nil, fmt.Errorf("failed to toggle service account: %w", err)
	}

	// Don't expose hash
	account.ClientSecretHash = ""

	return account, nil
}

// ValidateCredentials validates service account credentials
func (s *ServiceAccountService) ValidateCredentials(ctx context.Context, clientID, clientSecret string) (*models.ServiceAccount, error) {
	account, err := s.serviceAccountRepo.GetByClientID(ctx, clientID)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if !account.IsActive {
		return nil, fmt.Errorf("service account is not active")
	}

	// Verify secret
	if err := bcrypt.CompareHashAndPassword([]byte(account.ClientSecretHash), []byte(clientSecret)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	return account, nil
}

// Helper functions
func generateClientID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return "sa_" + base64.URLEncoding.EncodeToString(b)[:22]
}

func generateClientSecret() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return "sk_" + base64.URLEncoding.EncodeToString(b)
}

func hashSecret(secret string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(secret), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

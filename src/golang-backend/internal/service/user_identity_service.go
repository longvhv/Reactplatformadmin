package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type UserIdentityService interface {
	CreateIdentity(ctx context.Context, req *models.CreateUserIdentityRequest) (*models.UserIdentity, error)
	GetIdentity(ctx context.Context, id uuid.UUID) (*models.UserIdentity, error)
	GetIdentityByTypeAndValue(ctx context.Context, identityType, identityValue string) (*models.UserIdentity, error)
	ListIdentitiesByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserIdentity, error)
	UpdateIdentity(ctx context.Context, id uuid.UUID, req *models.UpdateUserIdentityRequest) (*models.UserIdentity, error)
	UpdateLastLogin(ctx context.Context, id uuid.UUID) error
	VerifyIdentity(ctx context.Context, id uuid.UUID) error
	DeleteIdentity(ctx context.Context, id uuid.UUID) error
}

type userIdentityService struct {
	repo repository.UserIdentityRepository
}

func NewUserIdentityService(repo repository.UserIdentityRepository) UserIdentityService {
	return &userIdentityService{repo: repo}
}

func (s *userIdentityService) CreateIdentity(ctx context.Context, req *models.CreateUserIdentityRequest) (*models.UserIdentity, error) {
	identity := &models.UserIdentity{
		ID:               uuid.New(),
		UserID:           req.UserID,
		IdentityType:     req.IdentityType,
		IdentityValue:    req.IdentityValue,
		CredentialSecret: req.CredentialSecret,
		Metadata:         req.Metadata,
		IsVerified:       false,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		Version:          1,
	}
	err := s.repo.Create(ctx, identity)
	return identity, err
}

func (s *userIdentityService) GetIdentity(ctx context.Context, id uuid.UUID) (*models.UserIdentity, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *userIdentityService) GetIdentityByTypeAndValue(ctx context.Context, identityType, identityValue string) (*models.UserIdentity, error) {
	return s.repo.GetByTypeAndValue(ctx, identityType, identityValue)
}

func (s *userIdentityService) ListIdentitiesByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserIdentity, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *userIdentityService) UpdateIdentity(ctx context.Context, id uuid.UUID, req *models.UpdateUserIdentityRequest) (*models.UserIdentity, error) {
	identity, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.IdentityValue != nil {
		identity.IdentityValue = *req.IdentityValue
	}
	if req.CredentialSecret != nil {
		identity.CredentialSecret = req.CredentialSecret
	}
	if req.Metadata != nil {
		identity.Metadata = req.Metadata
	}
	if req.IsVerified != nil {
		identity.IsVerified = *req.IsVerified
	}
	err = s.repo.Update(ctx, identity)
	return identity, err
}

func (s *userIdentityService) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateLastLogin(ctx, id)
}

func (s *userIdentityService) VerifyIdentity(ctx context.Context, id uuid.UUID) error {
	return s.repo.VerifyIdentity(ctx, id)
}

func (s *userIdentityService) DeleteIdentity(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

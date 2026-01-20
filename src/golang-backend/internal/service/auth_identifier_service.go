package service

import (
	"context"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type AuthIdentifierService interface {
	CreateIdentifier(ctx context.Context, req *models.CreateAuthIdentifierRequest) (*models.AuthIdentifier, error)
	GetIdentifierByHash(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) (*models.AuthIdentifier, error)
	ListIdentifiersByUser(ctx context.Context, userID uuid.UUID) ([]*models.AuthIdentifier, error)
	DeleteIdentifier(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) error
}

type authIdentifierService struct {
	repo repository.AuthIdentifierRepository
}

func NewAuthIdentifierService(repo repository.AuthIdentifierRepository) AuthIdentifierService {
	return &authIdentifierService{repo: repo}
}

func (s *authIdentifierService) CreateIdentifier(ctx context.Context, req *models.CreateAuthIdentifierRequest) (*models.AuthIdentifier, error) {
	identifier := &models.AuthIdentifier{
		TenantID:       req.TenantID,
		IdentifierHash: req.IdentifierHash,
		UserID:         req.UserID,
		IdentityID:     req.IdentityID,
		IdentifierType: req.IdentifierType,
		OriginalValue:  req.OriginalValue,
	}
	err := s.repo.Create(ctx, identifier)
	return identifier, err
}

func (s *authIdentifierService) GetIdentifierByHash(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) (*models.AuthIdentifier, error) {
	return s.repo.GetByHash(ctx, tenantID, identifierHash)
}

func (s *authIdentifierService) ListIdentifiersByUser(ctx context.Context, userID uuid.UUID) ([]*models.AuthIdentifier, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *authIdentifierService) DeleteIdentifier(ctx context.Context, tenantID uuid.UUID, identifierHash []byte) error {
	return s.repo.Delete(ctx, tenantID, identifierHash)
}

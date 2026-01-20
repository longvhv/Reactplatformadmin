package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type UserConsentService interface {
	CreateConsent(ctx context.Context, req *models.CreateUserConsentRequest) (*models.UserConsent, error)
	GetConsent(ctx context.Context, id uuid.UUID) (*models.UserConsent, error)
	ListConsents(ctx context.Context, page, pageSize int, userID *uuid.UUID, documentID *uuid.UUID, withdrawn *bool) ([]*models.UserConsent, int, error)
	ListConsentsByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserConsent, error)
	ListConsentsByDocument(ctx context.Context, documentID uuid.UUID) ([]*models.UserConsent, error)
	GetLatestConsent(ctx context.Context, userID, documentID uuid.UUID) (*models.UserConsent, error)
	WithdrawConsent(ctx context.Context, id uuid.UUID, reason string) error
	RenewConsent(ctx context.Context, id uuid.UUID) error
	DeleteConsent(ctx context.Context, id uuid.UUID) error
	GetExpiredConsents(ctx context.Context) ([]*models.UserConsent, error)
}

type userConsentService struct {
	repo repository.UserConsentRepository
}

func NewUserConsentService(repo repository.UserConsentRepository) UserConsentService {
	return &userConsentService{repo: repo}
}

func (s *userConsentService) CreateConsent(ctx context.Context, req *models.CreateUserConsentRequest) (*models.UserConsent, error) {
	now := time.Now()
	consent := &models.UserConsent{
		ID:              uuid.New(),
		UserID:          req.UserID,
		LegalDocumentID: req.LegalDocumentID,
		ConsentGiven:    req.ConsentGiven,
		ConsentDate:     now,
		Withdrawn:       false,
		RenewalRequired: false,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if req.ConsentIP != "" {
		consent.ConsentIP.String = req.ConsentIP
		consent.ConsentIP.Valid = true
	}

	if req.ConsentUserAgent != "" {
		consent.ConsentUserAgent.String = req.ConsentUserAgent
		consent.ConsentUserAgent.Valid = true
	}

	if req.ConsentMethod != "" {
		consent.ConsentMethod.String = req.ConsentMethod
		consent.ConsentMethod.Valid = true
	}

	if req.DocumentVersion != "" {
		consent.DocumentVersion.String = req.DocumentVersion
		consent.DocumentVersion.Valid = true
	}

	if req.DocumentTitle != "" {
		consent.DocumentTitle.String = req.DocumentTitle
		consent.DocumentTitle.Valid = true
	}

	if req.DocumentType != "" {
		consent.DocumentType.String = req.DocumentType
		consent.DocumentType.Valid = true
	}

	if req.ExpiresAt != nil {
		consent.ExpiresAt.Time = *req.ExpiresAt
		consent.ExpiresAt.Valid = true
	}

	if req.SourceApplication != "" {
		consent.SourceApplication.String = req.SourceApplication
		consent.SourceApplication.Valid = true
	}

	if req.SourcePage != "" {
		consent.SourcePage.String = req.SourcePage
		consent.SourcePage.Valid = true
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		consent.Metadata = metadataJSON
	} else {
		consent.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, consent); err != nil {
		return nil, fmt.Errorf("failed to create consent: %w", err)
	}

	return consent, nil
}

func (s *userConsentService) GetConsent(ctx context.Context, id uuid.UUID) (*models.UserConsent, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *userConsentService) ListConsents(ctx context.Context, page, pageSize int, userID *uuid.UUID, documentID *uuid.UUID, withdrawn *bool) ([]*models.UserConsent, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, userID, documentID, withdrawn)
}

func (s *userConsentService) ListConsentsByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserConsent, error) {
	return s.repo.ListByUserID(ctx, userID)
}

func (s *userConsentService) ListConsentsByDocument(ctx context.Context, documentID uuid.UUID) ([]*models.UserConsent, error) {
	return s.repo.ListByDocumentID(ctx, documentID)
}

func (s *userConsentService) GetLatestConsent(ctx context.Context, userID, documentID uuid.UUID) (*models.UserConsent, error) {
	return s.repo.GetLatestConsent(ctx, userID, documentID)
}

func (s *userConsentService) WithdrawConsent(ctx context.Context, id uuid.UUID, reason string) error {
	return s.repo.WithdrawConsent(ctx, id, reason)
}

func (s *userConsentService) RenewConsent(ctx context.Context, id uuid.UUID) error {
	return s.repo.RenewConsent(ctx, id)
}

func (s *userConsentService) DeleteConsent(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *userConsentService) GetExpiredConsents(ctx context.Context) ([]*models.UserConsent, error) {
	return s.repo.GetExpiredConsents(ctx)
}

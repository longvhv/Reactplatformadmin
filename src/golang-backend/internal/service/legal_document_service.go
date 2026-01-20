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

type LegalDocumentService interface {
	CreateDocument(ctx context.Context, req *models.CreateLegalDocumentRequest) (*models.LegalDocument, error)
	GetDocument(ctx context.Context, id uuid.UUID) (*models.LegalDocument, error)
	GetDocumentBySlug(ctx context.Context, slug string) (*models.LegalDocument, error)
	ListDocuments(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, docType, status, language *string) ([]*models.LegalDocument, int, error)
	ListDocumentsByType(ctx context.Context, docType string) ([]*models.LegalDocument, error)
	ListDocumentsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.LegalDocument, error)
	ListPublishedDocuments(ctx context.Context) ([]*models.LegalDocument, error)
	GetLatestByType(ctx context.Context, docType string, language string) (*models.LegalDocument, error)
	UpdateDocument(ctx context.Context, id uuid.UUID, req *models.UpdateLegalDocumentRequest) (*models.LegalDocument, error)
	PublishDocument(ctx context.Context, id uuid.UUID, req *models.PublishDocumentRequest) error
	ArchiveDocument(ctx context.Context, id uuid.UUID) error
	DeleteDocument(ctx context.Context, id uuid.UUID) error
	IncrementViewCount(ctx context.Context, id uuid.UUID) error
	IncrementAcceptCount(ctx context.Context, id uuid.UUID) error
}

type legalDocumentService struct {
	repo repository.LegalDocumentRepository
}

func NewLegalDocumentService(repo repository.LegalDocumentRepository) LegalDocumentService {
	return &legalDocumentService{repo: repo}
}

func (s *legalDocumentService) CreateDocument(ctx context.Context, req *models.CreateLegalDocumentRequest) (*models.LegalDocument, error) {
	now := time.Now()
	doc := &models.LegalDocument{
		ID:          uuid.New(),
		Title:       req.Title,
		Slug:        req.Slug,
		Type:        req.Type,
		Version:     "1.0",
		Content:     req.Content,
		Status:      "draft",
		Language:    "vi",
		IsActive:    true,
		ViewCount:   0,
		AcceptCount: 0,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if req.Version != "" {
		doc.Version = req.Version
	}

	if req.Summary != "" {
		doc.Summary.String = req.Summary
		doc.Summary.Valid = true
	}

	if req.EffectiveDate != nil {
		doc.EffectiveDate.Time = *req.EffectiveDate
		doc.EffectiveDate.Valid = true
	}

	if req.ExpiryDate != nil {
		doc.ExpiryDate.Time = *req.ExpiryDate
		doc.ExpiryDate.Valid = true
	}

	if req.TenantID != nil {
		doc.TenantID.String = req.TenantID.String()
		doc.TenantID.Valid = true
	}

	if req.Language != "" {
		doc.Language = req.Language
	}

	if req.CreatedBy != nil {
		doc.CreatedBy.String = req.CreatedBy.String()
		doc.CreatedBy.Valid = true
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		doc.Metadata = metadataJSON
	} else {
		doc.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, doc); err != nil {
		return nil, fmt.Errorf("failed to create legal document: %w", err)
	}

	return doc, nil
}

func (s *legalDocumentService) GetDocument(ctx context.Context, id uuid.UUID) (*models.LegalDocument, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *legalDocumentService) GetDocumentBySlug(ctx context.Context, slug string) (*models.LegalDocument, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *legalDocumentService) ListDocuments(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, docType, status, language *string) ([]*models.LegalDocument, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, docType, status, language)
}

func (s *legalDocumentService) ListDocumentsByType(ctx context.Context, docType string) ([]*models.LegalDocument, error) {
	return s.repo.ListByType(ctx, docType)
}

func (s *legalDocumentService) ListDocumentsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.LegalDocument, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *legalDocumentService) ListPublishedDocuments(ctx context.Context) ([]*models.LegalDocument, error) {
	return s.repo.ListPublished(ctx)
}

func (s *legalDocumentService) GetLatestByType(ctx context.Context, docType string, language string) (*models.LegalDocument, error) {
	if language == "" {
		language = "vi"
	}
	return s.repo.GetLatestByType(ctx, docType, language)
}

func (s *legalDocumentService) UpdateDocument(ctx context.Context, id uuid.UUID, req *models.UpdateLegalDocumentRequest) (*models.LegalDocument, error) {
	doc, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		doc.Title = *req.Title
	}

	if req.Content != nil {
		doc.Content = *req.Content
	}

	if req.Summary != nil {
		if *req.Summary == "" {
			doc.Summary.Valid = false
		} else {
			doc.Summary.String = *req.Summary
			doc.Summary.Valid = true
		}
	}

	if req.Version != nil {
		doc.Version = *req.Version
	}

	if req.EffectiveDate != nil {
		doc.EffectiveDate.Time = *req.EffectiveDate
		doc.EffectiveDate.Valid = true
	}

	if req.ExpiryDate != nil {
		doc.ExpiryDate.Time = *req.ExpiryDate
		doc.ExpiryDate.Valid = true
	}

	if req.Language != nil {
		doc.Language = *req.Language
	}

	if req.IsActive != nil {
		doc.IsActive = *req.IsActive
	}

	if req.UpdatedBy != nil {
		doc.UpdatedBy.String = req.UpdatedBy.String()
		doc.UpdatedBy.Valid = true
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		doc.Metadata = metadataJSON
	}

	doc.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, doc); err != nil {
		return nil, fmt.Errorf("failed to update legal document: %w", err)
	}

	return doc, nil
}

func (s *legalDocumentService) PublishDocument(ctx context.Context, id uuid.UUID, req *models.PublishDocumentRequest) error {
	doc, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if doc.Status == "published" {
		return fmt.Errorf("document is already published")
	}

	// Update effective date if provided
	if req.EffectiveDate != nil {
		doc.EffectiveDate.Time = *req.EffectiveDate
		doc.EffectiveDate.Valid = true
		if err := s.repo.Update(ctx, doc); err != nil {
			return err
		}
	}

	return s.repo.Publish(ctx, id, req.PublishedBy)
}

func (s *legalDocumentService) ArchiveDocument(ctx context.Context, id uuid.UUID) error {
	return s.repo.Archive(ctx, id)
}

func (s *legalDocumentService) DeleteDocument(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *legalDocumentService) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	return s.repo.IncrementViewCount(ctx, id)
}

func (s *legalDocumentService) IncrementAcceptCount(ctx context.Context, id uuid.UUID) error {
	return s.repo.IncrementAcceptCount(ctx, id)
}

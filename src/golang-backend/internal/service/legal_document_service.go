package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type LegalDocumentService struct {
	docRepo     repository.LegalDocumentRepository
	consentRepo repository.UserConsentRepository
}

func NewLegalDocumentService(docRepo repository.LegalDocumentRepository, consentRepo repository.UserConsentRepository) *LegalDocumentService {
	return &LegalDocumentService{
		docRepo:     docRepo,
		consentRepo: consentRepo,
	}
}

type CreateLegalDocumentRequest struct {
	Title         string                 `json:"title" binding:"required"`
	Slug          string                 `json:"slug" binding:"required"`
	Type          string                 `json:"type" binding:"required"`
	Version       string                 `json:"version"`
	Content       string                 `json:"content" binding:"required"`
	Summary       *string                `json:"summary"`
	Language      string                 `json:"language"`
	Scope         string                 `json:"scope"`
	TenantID      *uuid.UUID             `json:"tenant_id"`
	EffectiveDate *string                `json:"effective_date"`
	ExpiryDate    *string                `json:"expiry_date"`
	Metadata      map[string]interface{} `json:"metadata"`
	CreatedBy     uuid.UUID              `json:"-"`
}

type UpdateLegalDocumentRequest struct {
	Title         *string                `json:"title"`
	Content       *string                `json:"content"`
	Summary       *string                `json:"summary"`
	EffectiveDate *string                `json:"effective_date"`
	ExpiryDate    *string                `json:"expiry_date"`
	Metadata      map[string]interface{} `json:"metadata"`
	UpdatedBy     uuid.UUID              `json:"-"`
}

type CreateUserConsentRequest struct {
	UserID           uuid.UUID  `json:"user_id" binding:"required"`
	LegalDocumentID  uuid.UUID  `json:"legal_document_id" binding:"required"`
	ConsentGiven     bool       `json:"consent_given"`
	IPAddress        *string    `json:"ip_address"`
	UserAgent        *string    `json:"user_agent"`
	ConsentDate      *time.Time `json:"consent_date"`
	RevokedDate      *time.Time `json:"revoked_date"`
	ConsentMetadata  map[string]interface{} `json:"consent_metadata"`
}

// GetByID gets document by ID
func (s *LegalDocumentService) GetByID(ctx context.Context, id uuid.UUID) (*models.LegalDocument, error) {
	return s.docRepo.GetByID(ctx, id)
}

// GetBySlug gets document by slug
func (s *LegalDocumentService) GetBySlug(ctx context.Context, slug string) (*models.LegalDocument, error) {
	return s.docRepo.GetBySlug(ctx, slug)
}

// GetLatestByType gets latest document by type
func (s *LegalDocumentService) GetLatestByType(ctx context.Context, docType string) (*models.LegalDocument, error) {
	return s.docRepo.GetLatestByType(ctx, docType)
}

// ListDocuments lists documents
func (s *LegalDocumentService) ListDocuments(ctx context.Context, tenantID *uuid.UUID, docType, status string, page, limit int) ([]*models.LegalDocument, int64, error) {
	offset := (page - 1) * limit
	return s.docRepo.List(ctx, tenantID, docType, status, limit, offset)
}

// CreateDocument creates a new document
func (s *LegalDocumentService) CreateDocument(ctx context.Context, req CreateLegalDocumentRequest) (*models.LegalDocument, error) {
	// Check if slug exists
	existing, err := s.docRepo.GetBySlug(ctx, req.Slug)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("document slug already exists")
	}

	version := req.Version
	if version == "" {
		version = "1.0"
	}

	language := req.Language
	if language == "" {
		language = "vi-VN"
	}

	scope := req.Scope
	if scope == "" {
		scope = "GLOBAL"
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	var effectiveDate, expiryDate *time.Time
	if req.EffectiveDate != nil && *req.EffectiveDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.EffectiveDate)
		if err == nil {
			effectiveDate = &parsed
		}
	}
	if req.ExpiryDate != nil && *req.ExpiryDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiryDate)
		if err == nil {
			expiryDate = &parsed
		}
	}

	doc := &models.LegalDocument{
		ID:            uuid.New(),
		Title:         req.Title,
		Slug:          req.Slug,
		Type:          req.Type,
		Version:       version,
		Content:       req.Content,
		Summary:       req.Summary,
		Language:      language,
		Scope:         scope,
		TenantID:      req.TenantID,
		Status:        "DRAFT",
		IsPublished:   false,
		IsMandatory:   false,
		RequiresLogin: false,
		EffectiveDate: effectiveDate,
		ExpiryDate:    expiryDate,
		Metadata:      metadata,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		CreatedBy:     &req.CreatedBy,
		Version:       1,
	}

	if err := s.docRepo.Create(ctx, doc); err != nil {
		return nil, fmt.Errorf("failed to create document: %w", err)
	}

	return doc, nil
}

// UpdateDocument updates a document
func (s *LegalDocumentService) UpdateDocument(ctx context.Context, id uuid.UUID, req UpdateLegalDocumentRequest) (*models.LegalDocument, error) {
	doc, err := s.docRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("document not found: %w", err)
	}

	if doc.Status == "PUBLISHED" {
		return nil, fmt.Errorf("cannot update published document, create a new version instead")
	}

	if req.Title != nil {
		doc.Title = *req.Title
	}
	if req.Content != nil {
		doc.Content = *req.Content
	}
	if req.Summary != nil {
		doc.Summary = req.Summary
	}
	if req.EffectiveDate != nil && *req.EffectiveDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.EffectiveDate)
		if err == nil {
			doc.EffectiveDate = &parsed
		}
	}
	if req.ExpiryDate != nil && *req.ExpiryDate != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiryDate)
		if err == nil {
			doc.ExpiryDate = &parsed
		}
	}
	if req.Metadata != nil {
		doc.Metadata = req.Metadata
	}

	doc.UpdatedAt = time.Now()
	doc.UpdatedBy = &req.UpdatedBy
	doc.Version++

	if err := s.docRepo.Update(ctx, doc); err != nil {
		return nil, fmt.Errorf("failed to update document: %w", err)
	}

	return doc, nil
}

// DeleteDocument deletes a document
func (s *LegalDocumentService) DeleteDocument(ctx context.Context, id uuid.UUID) error {
	doc, err := s.docRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("document not found: %w", err)
	}

	if doc.Status == "PUBLISHED" {
		return fmt.Errorf("cannot delete published document")
	}

	return s.docRepo.Delete(ctx, id)
}

// PublishDocument publishes a document
func (s *LegalDocumentService) PublishDocument(ctx context.Context, id, publishedBy uuid.UUID) (*models.LegalDocument, error) {
	doc, err := s.docRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("document not found: %w", err)
	}

	if doc.Status == "PUBLISHED" {
		return doc, nil
	}

	now := time.Now()
	doc.Status = "PUBLISHED"
	doc.IsPublished = true
	doc.PublishedAt = &now
	doc.PublishedBy = &publishedBy
	doc.UpdatedAt = now
	doc.Version++

	if err := s.docRepo.Update(ctx, doc); err != nil {
		return nil, fmt.Errorf("failed to publish document: %w", err)
	}

	return doc, nil
}

// ArchiveDocument archives a document
func (s *LegalDocumentService) ArchiveDocument(ctx context.Context, id uuid.UUID) (*models.LegalDocument, error) {
	doc, err := s.docRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("document not found: %w", err)
	}

	doc.Status = "ARCHIVED"
	doc.IsPublished = false
	doc.UpdatedAt = time.Now()
	doc.Version++

	if err := s.docRepo.Update(ctx, doc); err != nil {
		return nil, fmt.Errorf("failed to archive document: %w", err)
	}

	return doc, nil
}

// RecordConsent records user consent
func (s *LegalDocumentService) RecordConsent(ctx context.Context, req CreateUserConsentRequest) (*models.UserConsent, error) {
	// Check if document exists
	doc, err := s.docRepo.GetByID(ctx, req.LegalDocumentID)
	if err != nil {
		return nil, fmt.Errorf("document not found: %w", err)
	}

	consentDate := time.Now()
	if req.ConsentDate != nil {
		consentDate = *req.ConsentDate
	}

	metadata := req.ConsentMetadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	// Add document version to metadata
	metadata["document_version"] = doc.Version

	consent := &models.UserConsent{
		ID:              uuid.New(),
		UserID:          req.UserID,
		LegalDocumentID: req.LegalDocumentID,
		ConsentGiven:    req.ConsentGiven,
		ConsentDate:     consentDate,
		IPAddress:       req.IPAddress,
		UserAgent:       req.UserAgent,
		RevokedDate:     req.RevokedDate,
		ConsentMetadata: metadata,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.consentRepo.Create(ctx, consent); err != nil {
		return nil, fmt.Errorf("failed to record consent: %w", err)
	}

	return consent, nil
}

// GetUserConsents gets user consents
func (s *LegalDocumentService) GetUserConsents(ctx context.Context, userID uuid.UUID) ([]*models.UserConsent, error) {
	return s.consentRepo.GetByUser(ctx, userID)
}

// CheckUserConsent checks if user has consented to a document
func (s *LegalDocumentService) CheckUserConsent(ctx context.Context, userID uuid.UUID, docType string) (bool, error) {
	// Get latest document of type
	doc, err := s.docRepo.GetLatestByType(ctx, docType)
	if err != nil {
		return false, fmt.Errorf("document not found: %w", err)
	}

	// Get user consents
	consents, err := s.consentRepo.GetByUser(ctx, userID)
	if err != nil {
		return false, err
	}

	// Check if user has consented to this document
	for _, consent := range consents {
		if consent.LegalDocumentID == doc.ID && consent.ConsentGiven && consent.RevokedDate == nil {
			return true, nil
		}
	}

	return false, nil
}

// Helper function to generate slug
func (s *LegalDocumentService) GenerateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	return slug
}

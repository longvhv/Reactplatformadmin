package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// LegalDocument represents a legal document
type LegalDocument struct {
	ID           uuid.UUID      `json:"_id" db:"_id"`
	Title        string         `json:"title" db:"title"`
	Slug         string         `json:"slug" db:"slug"`
	Type         string         `json:"type" db:"type"` // terms_of_service, privacy_policy, cookie_policy, gdpr, eula, sla, dpa, other
	Version      string         `json:"version" db:"version"`
	Content      string         `json:"content" db:"content"`
	Summary      sql.NullString `json:"summary,omitempty" db:"summary"`
	Status       string         `json:"status" db:"status"` // draft, published, archived
	EffectiveDate sql.NullTime  `json:"effective_date,omitempty" db:"effective_date"`
	ExpiryDate   sql.NullTime   `json:"expiry_date,omitempty" db:"expiry_date"`
	TenantID     sql.NullString `json:"tenant_id,omitempty" db:"tenant_id"`
	Language     string         `json:"language" db:"language"`
	IsActive     bool           `json:"is_active" db:"is_active"`
	ViewCount    int            `json:"view_count" db:"view_count"`
	AcceptCount  int            `json:"accept_count" db:"accept_count"`
	CreatedBy    sql.NullString `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy    sql.NullString `json:"updated_by,omitempty" db:"updated_by"`
	PublishedBy  sql.NullString `json:"published_by,omitempty" db:"published_by"`
	PublishedAt  sql.NullTime   `json:"published_at,omitempty" db:"published_at"`
	Metadata     JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt    time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at" db:"updated_at"`
}

// CreateLegalDocumentRequest represents the request to create a legal document
type CreateLegalDocumentRequest struct {
	Title         string                 `json:"title" validate:"required,min=1,max=500"`
	Slug          string                 `json:"slug" validate:"required,min=1,max=200"`
	Type          string                 `json:"type" validate:"required,oneof=terms_of_service privacy_policy cookie_policy gdpr eula sla dpa other"`
	Version       string                 `json:"version,omitempty"`
	Content       string                 `json:"content" validate:"required"`
	Summary       string                 `json:"summary,omitempty"`
	EffectiveDate *time.Time             `json:"effective_date,omitempty"`
	ExpiryDate    *time.Time             `json:"expiry_date,omitempty"`
	TenantID      *uuid.UUID             `json:"tenant_id,omitempty"`
	Language      string                 `json:"language,omitempty"`
	CreatedBy     *uuid.UUID             `json:"created_by,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateLegalDocumentRequest represents the request to update a legal document
type UpdateLegalDocumentRequest struct {
	Title         *string                 `json:"title,omitempty" validate:"omitempty,min=1,max=500"`
	Content       *string                 `json:"content,omitempty"`
	Summary       *string                 `json:"summary,omitempty"`
	Version       *string                 `json:"version,omitempty"`
	EffectiveDate *time.Time              `json:"effective_date,omitempty"`
	ExpiryDate    *time.Time              `json:"expiry_date,omitempty"`
	Language      *string                 `json:"language,omitempty"`
	IsActive      *bool                   `json:"is_active,omitempty"`
	UpdatedBy     *uuid.UUID              `json:"updated_by,omitempty"`
	Metadata      *map[string]interface{} `json:"metadata,omitempty"`
}

// PublishDocumentRequest represents the request to publish a document
type PublishDocumentRequest struct {
	PublishedBy   uuid.UUID  `json:"published_by" validate:"required,uuid"`
	EffectiveDate *time.Time `json:"effective_date,omitempty"`
}

// TableName returns the table name for LegalDocument
func (LegalDocument) TableName() string {
	return "legal_documents"
}

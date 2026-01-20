package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// UserConsent represents a user's consent record
type UserConsent struct {
	ID                uuid.UUID      `json:"_id" db:"_id"`
	UserID            uuid.UUID      `json:"user_id" db:"user_id"`
	LegalDocumentID   uuid.UUID      `json:"legal_document_id" db:"legal_document_id"`
	ConsentGiven      bool           `json:"consent_given" db:"consent_given"`
	ConsentDate       time.Time      `json:"consent_date" db:"consent_date"`
	ConsentIP         sql.NullString `json:"consent_ip,omitempty" db:"consent_ip"`
	ConsentUserAgent  sql.NullString `json:"consent_user_agent,omitempty" db:"consent_user_agent"`
	ConsentMethod     sql.NullString `json:"consent_method,omitempty" db:"consent_method"` // web, mobile, api, email, signup, profile, checkout, other
	DocumentVersion   sql.NullString `json:"document_version,omitempty" db:"document_version"`
	DocumentTitle     sql.NullString `json:"document_title,omitempty" db:"document_title"`
	DocumentType      sql.NullString `json:"document_type,omitempty" db:"document_type"`
	Withdrawn         bool           `json:"withdrawn" db:"withdrawn"`
	WithdrawnDate     sql.NullTime   `json:"withdrawn_date,omitempty" db:"withdrawn_date"`
	WithdrawnReason   sql.NullString `json:"withdrawn_reason,omitempty" db:"withdrawn_reason"`
	ExpiresAt         sql.NullTime   `json:"expires_at,omitempty" db:"expires_at"`
	RenewalRequired   bool           `json:"renewal_required" db:"renewal_required"`
	LastRenewedAt     sql.NullTime   `json:"last_renewed_at,omitempty" db:"last_renewed_at"`
	SourceApplication sql.NullString `json:"source_application,omitempty" db:"source_application"`
	SourcePage        sql.NullString `json:"source_page,omitempty" db:"source_page"`
	Metadata          JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt         time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at" db:"updated_at"`
}

// CreateUserConsentRequest represents the request to create a consent
type CreateUserConsentRequest struct {
	UserID            uuid.UUID              `json:"user_id" validate:"required,uuid"`
	LegalDocumentID   uuid.UUID              `json:"legal_document_id" validate:"required,uuid"`
	ConsentGiven      bool                   `json:"consent_given"`
	ConsentIP         string                 `json:"consent_ip,omitempty"`
	ConsentUserAgent  string                 `json:"consent_user_agent,omitempty"`
	ConsentMethod     string                 `json:"consent_method,omitempty" validate:"omitempty,oneof=web mobile api email signup profile checkout other"`
	DocumentVersion   string                 `json:"document_version,omitempty"`
	DocumentTitle     string                 `json:"document_title,omitempty"`
	DocumentType      string                 `json:"document_type,omitempty"`
	ExpiresAt         *time.Time             `json:"expires_at,omitempty"`
	SourceApplication string                 `json:"source_application,omitempty"`
	SourcePage        string                 `json:"source_page,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
}

// WithdrawConsentRequest represents the request to withdraw consent
type WithdrawConsentRequest struct {
	Reason string `json:"reason,omitempty"`
}

// TableName returns the table name for UserConsent
func (UserConsent) TableName() string {
	return "user_consents"
}

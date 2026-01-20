package models

import (
	"github.com/google/uuid"
)

type AuthIdentifier struct {
	TenantID       uuid.UUID `json:"tenant_id" db:"tenant_id"`
	IdentifierHash []byte    `json:"identifier_hash" db:"identifier_hash"`
	UserID         uuid.UUID `json:"user_id" db:"user_id"`
	IdentityID     uuid.UUID `json:"identity_id" db:"identity_id"`
	IdentifierType string    `json:"identifier_type" db:"identifier_type"`
	OriginalValue  *string   `json:"original_value,omitempty" db:"original_value"`
}

type CreateAuthIdentifierRequest struct {
	TenantID       uuid.UUID `json:"tenant_id" binding:"required"`
	IdentifierHash []byte    `json:"identifier_hash" binding:"required"`
	UserID         uuid.UUID `json:"user_id" binding:"required"`
	IdentityID     uuid.UUID `json:"identity_id" binding:"required"`
	IdentifierType string    `json:"identifier_type" binding:"required"`
	OriginalValue  *string   `json:"original_value"`
}

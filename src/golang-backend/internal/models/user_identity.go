package models

import (
	"time"

	"github.com/google/uuid"
)

type UserIdentity struct {
	ID               uuid.UUID  `json:"id" db:"_id"`
	UserID           uuid.UUID  `json:"user_id" db:"user_id"`
	IdentityType     string     `json:"identity_type" db:"identity_type"` // PASSWORD, GOOGLE, GITHUB, etc.
	IdentityValue    string     `json:"identity_value" db:"identity_value"`
	CredentialSecret *string    `json:"credential_secret,omitempty" db:"credential_secret"`
	Metadata         []byte     `json:"metadata" db:"metadata"`
	IsVerified       bool       `json:"is_verified" db:"is_verified"`
	VerifiedAt       *time.Time `json:"verified_at,omitempty" db:"verified_at"`
	LastLoginAt      *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
	Version          int64      `json:"version" db:"version"`
}

type CreateUserIdentityRequest struct {
	UserID           uuid.UUID `json:"user_id" binding:"required"`
	IdentityType     string    `json:"identity_type" binding:"required,oneof=PASSWORD GOOGLE GITHUB MICROSOFT APPLE SAML OIDC"`
	IdentityValue    string    `json:"identity_value" binding:"required"`
	CredentialSecret *string   `json:"credential_secret"`
	Metadata         []byte    `json:"metadata"`
}

type UpdateUserIdentityRequest struct {
	IdentityValue    *string `json:"identity_value"`
	CredentialSecret *string `json:"credential_secret"`
	Metadata         []byte  `json:"metadata"`
	IsVerified       *bool   `json:"is_verified"`
}

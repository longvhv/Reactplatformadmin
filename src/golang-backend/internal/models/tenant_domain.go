package models

import (
	"time"
)

type TenantDomain struct {
	ID                   string     `json:"_id" db:"_id"`
	TenantID             string     `json:"tenant_id" db:"tenant_id"`
	Domain               string     `json:"domain" db:"domain"`
	VerificationStatus   string     `json:"verification_status" db:"verification_status"`
	VerificationMethod   *string    `json:"verification_method,omitempty" db:"verification_method"`
	VerificationToken    *string    `json:"verification_token,omitempty" db:"verification_token"`
	Policy               string     `json:"policy" db:"policy"`
	VerifiedAt           *time.Time `json:"verified_at,omitempty" db:"verified_at"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
}

type CreateTenantDomainRequest struct {
	TenantID           string  `json:"tenant_id" validate:"required,uuid"`
	Domain             string  `json:"domain" validate:"required"`
	VerificationMethod *string `json:"verification_method,omitempty"`
	Policy             string  `json:"policy" validate:"required,oneof=NONE CAPTURE ENFORCE_SSO"`
}

type UpdateTenantDomainRequest struct {
	VerificationStatus *string `json:"verification_status,omitempty" validate:"omitempty,oneof=PENDING VERIFIED"`
	VerificationMethod *string `json:"verification_method,omitempty" validate:"omitempty,oneof=DNS_TXT HTML_FILE"`
	Policy             *string `json:"policy,omitempty" validate:"omitempty,oneof=NONE CAPTURE ENFORCE_SSO"`
}

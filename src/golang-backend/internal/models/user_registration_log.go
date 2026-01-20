package models

import (
	"time"

	"github.com/google/uuid"
)

type UserRegistrationLog struct {
	ID                 uuid.UUID  `json:"id" db:"_id"`
	TenantID           *uuid.UUID `json:"tenant_id,omitempty" db:"tenant_id"`
	UserID             *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	RegistrationSource *string    `json:"registration_source,omitempty" db:"registration_source"`
	DataRegion         *string    `json:"data_region,omitempty" db:"data_region"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
}

type CreateUserRegistrationLogRequest struct {
	TenantID           *uuid.UUID `json:"tenant_id"`
	UserID             *uuid.UUID `json:"user_id"`
	RegistrationSource *string    `json:"registration_source"`
	DataRegion         *string    `json:"data_region"`
}

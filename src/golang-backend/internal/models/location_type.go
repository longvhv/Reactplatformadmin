package models

import (
	"time"

	"github.com/google/uuid"
)

type LocationType struct {
	ID          uuid.UUID  `json:"id" db:"_id"`
	TenantID    *uuid.UUID `json:"tenant_id,omitempty" db:"tenant_id"`
	Code        string     `json:"code" db:"code"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description,omitempty" db:"description"`
	ExtraFields []byte     `json:"extra_fields" db:"extra_fields"`
	IsSystem    bool       `json:"is_system" db:"is_system"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	Version     int64      `json:"version" db:"version"`
}

type CreateLocationTypeRequest struct {
	TenantID    *uuid.UUID `json:"tenant_id"`
	Code        string     `json:"code" binding:"required"`
	Name        string     `json:"name" binding:"required"`
	Description *string    `json:"description"`
	ExtraFields []byte     `json:"extra_fields"`
}

type UpdateLocationTypeRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	ExtraFields []byte  `json:"extra_fields"`
	IsActive    *bool   `json:"is_active"`
}

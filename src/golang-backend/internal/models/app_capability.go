package models

import (
	"time"

	"github.com/google/uuid"
)

type AppCapability struct {
	ID              uuid.UUID  `json:"id" db:"_id"`
	TenantID        uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	AppID           uuid.UUID  `json:"app_id" db:"app_id"`
	Code            string     `json:"code" db:"code"`
	Name            string     `json:"name" db:"name"`
	Description     *string    `json:"description,omitempty" db:"description"`
	Type            string     `json:"type" db:"type"` // FEATURE, LIMIT
	DefaultValue    []byte     `json:"default_value" db:"default_value"`
	DisplayOrder    int        `json:"display_order" db:"display_order"`
	IsRequired      bool       `json:"is_required" db:"is_required"`
	ValidationRules []byte     `json:"validation_rules" db:"validation_rules"`
	Status          string     `json:"status" db:"status"` // active, inactive, archived
	Metadata        []byte     `json:"metadata" db:"metadata"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	CreatedBy       *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy       *uuid.UUID `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy       *uuid.UUID `json:"deleted_by,omitempty" db:"deleted_by"`
	Version         int64      `json:"version" db:"version"`
}

type CreateAppCapabilityRequest struct {
	TenantID        uuid.UUID `json:"tenant_id" binding:"required"`
	AppID           uuid.UUID `json:"app_id" binding:"required"`
	Code            string    `json:"code" binding:"required"`
	Name            string    `json:"name" binding:"required"`
	Description     *string   `json:"description"`
	Type            string    `json:"type" binding:"required,oneof=FEATURE LIMIT"`
	DefaultValue    []byte    `json:"default_value"`
	DisplayOrder    *int      `json:"display_order"`
	IsRequired      *bool     `json:"is_required"`
	ValidationRules []byte    `json:"validation_rules"`
	Metadata        []byte    `json:"metadata"`
}

type UpdateAppCapabilityRequest struct {
	Name            *string `json:"name"`
	Description     *string `json:"description"`
	DefaultValue    []byte  `json:"default_value"`
	DisplayOrder    *int    `json:"display_order"`
	IsRequired      *bool   `json:"is_required"`
	ValidationRules []byte  `json:"validation_rules"`
	Status          *string `json:"status"`
	Metadata        []byte  `json:"metadata"`
}

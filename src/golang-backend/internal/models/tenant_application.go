package models

import (
	"time"
)

type TenantApplication struct {
	ID             string     `json:"_id" db:"_id"`
	TenantID       string     `json:"tenant_id" db:"tenant_id"`
	AppCode        string     `json:"app_code" db:"app_code"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	ActivatedAt    *time.Time `json:"activated_at,omitempty" db:"activated_at"`
	DeactivatedAt  *time.Time `json:"deactivated_at,omitempty" db:"deactivated_at"`
	LicenseType    string     `json:"license_type" db:"license_type"`
	MaxUsers       int        `json:"max_users" db:"max_users"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty" db:"expires_at"`
	Settings       JSONB      `json:"settings" db:"settings"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	CreatedBy      *string    `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy      *string    `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy      *string    `json:"deleted_by,omitempty" db:"deleted_by"`
	Version        int64      `json:"version" db:"version"`
}

type CreateTenantApplicationRequest struct {
	TenantID    string    `json:"tenant_id" validate:"required,uuid"`
	AppCode     string    `json:"app_code" validate:"required"`
	IsActive    bool      `json:"is_active"`
	LicenseType string    `json:"license_type" validate:"required,oneof=TRIAL BASIC PREMIUM ENTERPRISE"`
	MaxUsers    int       `json:"max_users" validate:"required,gt=0"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	Settings    JSONB     `json:"settings,omitempty"`
	CreatedBy   *string   `json:"created_by,omitempty" validate:"omitempty,uuid"`
}

type UpdateTenantApplicationRequest struct {
	IsActive    *bool      `json:"is_active,omitempty"`
	LicenseType *string    `json:"license_type,omitempty" validate:"omitempty,oneof=TRIAL BASIC PREMIUM ENTERPRISE"`
	MaxUsers    *int       `json:"max_users,omitempty" validate:"omitempty,gt=0"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	Settings    JSONB      `json:"settings,omitempty"`
	UpdatedBy   *string    `json:"updated_by,omitempty" validate:"omitempty,uuid"`
}

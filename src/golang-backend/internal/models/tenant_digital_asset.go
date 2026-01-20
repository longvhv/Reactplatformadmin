package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// TenantDigitalAsset represents a tenant's digital asset
type TenantDigitalAsset struct {
	ID            uuid.UUID      `json:"_id" db:"_id"`
	TenantID      uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	OrderID       sql.NullString `json:"order_id,omitempty" db:"order_id"`
	AssetType     string         `json:"asset_type" db:"asset_type"`
	Name          string         `json:"name" db:"name"`
	Status        string         `json:"status" db:"status"` // PENDING, PROVISIONING, ACTIVE, EXPIRED, SUSPENDED, TRANSFERRING
	AutoRenew     bool           `json:"auto_renew" db:"auto_renew"`
	AssetMetadata JSONB          `json:"asset_metadata" db:"asset_metadata"`
	ActivatedAt   sql.NullTime   `json:"activated_at,omitempty" db:"activated_at"`
	ExpiresAt     sql.NullTime   `json:"expires_at,omitempty" db:"expires_at"`
	CreatedAt     time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at" db:"updated_at"`
	Version       int64          `json:"version" db:"version"`
}

// CreateTenantDigitalAssetRequest represents the request to create a digital asset
type CreateTenantDigitalAssetRequest struct {
	TenantID      uuid.UUID              `json:"tenant_id" validate:"required,uuid"`
	OrderID       *uuid.UUID             `json:"order_id,omitempty"`
	AssetType     string                 `json:"asset_type" validate:"required,min=1,max=100"`
	Name          string                 `json:"name" validate:"required,min=1,max=500"`
	AutoRenew     bool                   `json:"auto_renew"`
	AssetMetadata map[string]interface{} `json:"asset_metadata,omitempty"`
	ExpiresAt     *time.Time             `json:"expires_at,omitempty"`
}

// UpdateTenantDigitalAssetRequest represents the request to update a digital asset
type UpdateTenantDigitalAssetRequest struct {
	Name          *string                 `json:"name,omitempty" validate:"omitempty,min=1,max=500"`
	Status        *string                 `json:"status,omitempty" validate:"omitempty,oneof=PENDING PROVISIONING ACTIVE EXPIRED SUSPENDED TRANSFERRING"`
	AutoRenew     *bool                   `json:"auto_renew,omitempty"`
	AssetMetadata *map[string]interface{} `json:"asset_metadata,omitempty"`
	ExpiresAt     *time.Time              `json:"expires_at,omitempty"`
}

// TableName returns the table name for TenantDigitalAsset
func (TenantDigitalAsset) TableName() string {
	return "tenant_digital_assets"
}

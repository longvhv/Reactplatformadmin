package models

import (
	"time"

	"github.com/google/uuid"
)

type TenantServiceDelivery struct {
	ID              uuid.UUID  `json:"id" db:"_id"`
	TenantID        uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	ProductID       uuid.UUID  `json:"product_id" db:"product_id"`
	SubscriptionID  *uuid.UUID `json:"subscription_id,omitempty" db:"subscription_id"`
	UnitType        string     `json:"unit_type" db:"unit_type"`
	TotalUnits      float64    `json:"total_units" db:"total_units"`
	DeliveredUnits  float64    `json:"delivered_units" db:"delivered_units"`
	UnitPrice       float64    `json:"unit_price" db:"unit_price"`
	CurrencyCode    string     `json:"currency_code" db:"currency_code"`
	Status          string     `json:"status" db:"status"` // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
	ServiceMetadata []byte     `json:"service_metadata" db:"service_metadata"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	Version         int64      `json:"version" db:"version"`
}

type CreateTenantServiceDeliveryRequest struct {
	TenantID        uuid.UUID  `json:"tenant_id" binding:"required"`
	ProductID       uuid.UUID  `json:"product_id" binding:"required"`
	SubscriptionID  *uuid.UUID `json:"subscription_id"`
	UnitType        string     `json:"unit_type" binding:"required"`
	TotalUnits      float64    `json:"total_units" binding:"required,min=0"`
	UnitPrice       float64    `json:"unit_price" binding:"required,min=0"`
	CurrencyCode    string     `json:"currency_code"`
	ServiceMetadata []byte     `json:"service_metadata"`
}

type UpdateTenantServiceDeliveryRequest struct {
	DeliveredUnits  *float64 `json:"delivered_units"`
	Status          *string  `json:"status"`
	ServiceMetadata []byte   `json:"service_metadata"`
}

type UpdateDeliveryProgressRequest struct {
	DeliveredUnits float64 `json:"delivered_units" binding:"required,min=0"`
}

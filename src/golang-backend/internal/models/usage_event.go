package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// UsageEvent represents a usage tracking event
type UsageEvent struct {
	ID             uuid.UUID      `json:"_id" db:"_id"`
	TenantID       sql.NullString `json:"tenant_id,omitempty" db:"tenant_id"`
	SubscriptionID sql.NullString `json:"subscription_id,omitempty" db:"subscription_id"`
	AppCode        sql.NullString `json:"app_code,omitempty" db:"app_code"`
	EventType      sql.NullString `json:"event_type,omitempty" db:"event_type"`
	Quantity       float64        `json:"quantity" db:"quantity"`
	Unit           sql.NullString `json:"unit,omitempty" db:"unit"`
	Metadata       JSONB          `json:"metadata,omitempty" db:"metadata"`
	DataRegion     sql.NullString `json:"data_region,omitempty" db:"data_region"`
	Timestamp      time.Time      `json:"timestamp" db:"timestamp"`
}

// CreateUsageEventRequest represents the request to create a usage event
type CreateUsageEventRequest struct {
	TenantID       *uuid.UUID             `json:"tenant_id,omitempty"`
	SubscriptionID *uuid.UUID             `json:"subscription_id,omitempty"`
	AppCode        string                 `json:"app_code,omitempty"`
	EventType      string                 `json:"event_type" validate:"required"`
	Quantity       float64                `json:"quantity" validate:"required,gt=0"`
	Unit           string                 `json:"unit" validate:"required"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	DataRegion     string                 `json:"data_region,omitempty"`
}

// UsageEventSummary represents aggregated usage data
type UsageEventSummary struct {
	EventType    string    `json:"event_type" db:"event_type"`
	TotalCount   int64     `json:"total_count" db:"total_count"`
	TotalQuantity float64  `json:"total_quantity" db:"total_quantity"`
	Unit         string    `json:"unit" db:"unit"`
	FirstEvent   time.Time `json:"first_event" db:"first_event"`
	LastEvent    time.Time `json:"last_event" db:"last_event"`
}

// TableName returns the table name for UsageEvent
func (UsageEvent) TableName() string {
	return "usage_events"
}

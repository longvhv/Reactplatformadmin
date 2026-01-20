package models

import (
	"time"

	"github.com/google/uuid"
)

type ContentViewLog struct {
	ID           uuid.UUID   `json:"id" db:"_id"`
	TenantID     uuid.UUID   `json:"tenant_id" db:"tenant_id"`
	ObjectType   string      `json:"object_type" db:"object_type"`
	ObjectID     uuid.UUID   `json:"object_id" db:"object_id"`
	CategoryIDs  []uuid.UUID `json:"category_ids" db:"category_ids"`
	AuthorID     *uuid.UUID  `json:"author_id,omitempty" db:"author_id"`
	UserID       *uuid.UUID  `json:"user_id,omitempty" db:"user_id"`
	VisitorID    string      `json:"visitor_id" db:"visitor_id"`
	IPAddress    string      `json:"ip_address" db:"ip_address"`
	UserAgent    string      `json:"user_agent" db:"user_agent"`
	DeviceType   string      `json:"device_type" db:"device_type"`
	Referrer     *string     `json:"referrer,omitempty" db:"referrer"`
	ViewDuration int         `json:"view_duration" db:"view_duration"`
	CreatedAt    time.Time   `json:"created_at" db:"created_at"`
}

type CreateContentViewLogRequest struct {
	TenantID     uuid.UUID   `json:"tenant_id" binding:"required"`
	ObjectType   string      `json:"object_type" binding:"required"`
	ObjectID     uuid.UUID   `json:"object_id" binding:"required"`
	CategoryIDs  []uuid.UUID `json:"category_ids"`
	AuthorID     *uuid.UUID  `json:"author_id"`
	UserID       *uuid.UUID  `json:"user_id"`
	VisitorID    string      `json:"visitor_id" binding:"required"`
	IPAddress    string      `json:"ip_address" binding:"required"`
	UserAgent    string      `json:"user_agent" binding:"required"`
	DeviceType   string      `json:"device_type" binding:"required"`
	Referrer     *string     `json:"referrer"`
	ViewDuration *int        `json:"view_duration"`
}

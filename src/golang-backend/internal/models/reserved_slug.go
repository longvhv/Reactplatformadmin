package models

import (
	"time"

	"github.com/google/uuid"
)

type ReservedSlug struct {
	ID            uuid.UUID  `json:"id" db:"_id"`
	Slug          string     `json:"slug" db:"slug"`
	Type          string     `json:"type" db:"type"` // SYSTEM, BUSINESS, OFFENSIVE, FUTURE
	MatchType     string     `json:"match_type" db:"match_type"` // EXACT, PREFIX, REGEX
	ItemsSnapshot []byte     `json:"items_snapshot,omitempty" db:"items_snapshot"`
	Reason        *string    `json:"reason,omitempty" db:"reason"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	Version       int64      `json:"version" db:"version"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type CreateReservedSlugRequest struct {
	Slug          string  `json:"slug" binding:"required,lowercase,alphanum_dash"`
	Type          string  `json:"type" binding:"required,oneof=SYSTEM BUSINESS OFFENSIVE FUTURE"`
	MatchType     string  `json:"match_type" binding:"required,oneof=EXACT PREFIX REGEX"`
	ItemsSnapshot []byte  `json:"items_snapshot"`
	Reason        *string `json:"reason"`
}

type UpdateReservedSlugRequest struct {
	Type          *string `json:"type"`
	MatchType     *string `json:"match_type"`
	ItemsSnapshot []byte  `json:"items_snapshot"`
	Reason        *string `json:"reason"`
	IsActive      *bool   `json:"is_active"`
}

type CheckSlugRequest struct {
	Slug string `json:"slug" binding:"required"`
}

type CheckSlugResponse struct {
	IsReserved bool   `json:"is_reserved"`
	Type       string `json:"type,omitempty"`
	Reason     string `json:"reason,omitempty"`
}

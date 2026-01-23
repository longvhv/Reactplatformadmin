package models

import (
	"time"

	"github.com/google/uuid"
)

// Location represents a physical or virtual location
type Location struct {
	ID            uuid.UUID       `json:"id" db:"_id"`
	TenantID      uuid.UUID       `json:"tenant_id" db:"tenant_id"`
	ParentID      *uuid.UUID      `json:"parent_id,omitempty" db:"parent_id"`
	TypeID        uuid.UUID       `json:"type_id" db:"type_id"`
	Name          string          `json:"name" db:"name"`
	Code          *string         `json:"code,omitempty" db:"code"`
	Path          *string         `json:"path,omitempty" db:"path"`
	Status        string          `json:"status" db:"status"`
	Address       map[string]any  `json:"address" db:"address"`         // JSONB field
	Coordinates   *string         `json:"coordinates,omitempty" db:"coordinates"` // Point type stored as string
	RadiusMeters  *int            `json:"radius_meters,omitempty" db:"radius_meters"`
	Timezone      string          `json:"timezone" db:"timezone"`
	IsHeadquarter bool            `json:"is_headquarter" db:"is_headquarter"`
	Metadata      map[string]any  `json:"metadata" db:"metadata"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt     *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
	Version       int64           `json:"version" db:"version"`
}

// NewLocation creates a new location
func NewLocation(tenantID uuid.UUID, code, name string, typeID uuid.UUID) *Location {
	now := time.Now()
	codeStr := code
	return &Location{
		ID:            uuid.New(),
		TenantID:      tenantID,
		TypeID:        typeID,
		Name:          name,
		Code:          &codeStr,
		Status:        "ACTIVE",
		Address:       make(map[string]any),
		Timezone:      "UTC",
		IsHeadquarter: false,
		Metadata:      make(map[string]any),
		CreatedAt:     now,
		UpdatedAt:     now,
		Version:       1,
	}
}

// Touch updates the updated_at timestamp
func (l *Location) Touch() {
	l.UpdatedAt = time.Now()
}
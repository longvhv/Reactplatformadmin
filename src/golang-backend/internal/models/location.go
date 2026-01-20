package models

import (
	"time"

	"github.com/google/uuid"
)

type Location struct {
	ID            uuid.UUID  `json:"id" db:"_id"`
	TenantID      uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	ParentID      *uuid.UUID `json:"parent_id,omitempty" db:"parent_id"`
	TypeID        uuid.UUID  `json:"type_id" db:"type_id"`
	Name          string     `json:"name" db:"name"`
	Code          *string    `json:"code,omitempty" db:"code"`
	Path          *string    `json:"path,omitempty" db:"path"`
	Status        string     `json:"status" db:"status"` // ACTIVE, INACTIVE, CLOSED
	Address       []byte     `json:"address" db:"address"`
	Coordinates   *string    `json:"coordinates,omitempty" db:"coordinates"` // point type as string
	RadiusMeters  int        `json:"radius_meters" db:"radius_meters"`
	Timezone      string     `json:"timezone" db:"timezone"`
	IsHeadquarter bool       `json:"is_headquarter" db:"is_headquarter"`
	Metadata      []byte     `json:"metadata" db:"metadata"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	Version       int64      `json:"version" db:"version"`
}

type CreateLocationRequest struct {
	TenantID      uuid.UUID  `json:"tenant_id" binding:"required"`
	ParentID      *uuid.UUID `json:"parent_id"`
	TypeID        uuid.UUID  `json:"type_id" binding:"required"`
	Name          string     `json:"name" binding:"required"`
	Code          *string    `json:"code"`
	Address       []byte     `json:"address"`
	Coordinates   *string    `json:"coordinates"`
	RadiusMeters  *int       `json:"radius_meters"`
	Timezone      *string    `json:"timezone"`
	IsHeadquarter *bool      `json:"is_headquarter"`
	Metadata      []byte     `json:"metadata"`
}

type UpdateLocationRequest struct {
	Name          *string `json:"name"`
	Code          *string `json:"code"`
	Status        *string `json:"status"`
	Address       []byte  `json:"address"`
	Coordinates   *string `json:"coordinates"`
	RadiusMeters  *int    `json:"radius_meters"`
	Timezone      *string `json:"timezone"`
	IsHeadquarter *bool   `json:"is_headquarter"`
	Metadata      []byte  `json:"metadata"`
}

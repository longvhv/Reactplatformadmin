package models

import (
	"time"

	"github.com/google/uuid"
)

type Tag struct {
	ID          uuid.UUID `json:"id" db:"_id"`
	TenantID    uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Name        string    `json:"name" db:"name"`
	Slug        string    `json:"slug" db:"slug"`
	Description *string   `json:"description,omitempty" db:"description"`
	Color       *string   `json:"color,omitempty" db:"color"`
	Metadata    []byte    `json:"metadata,omitempty" db:"metadata"`
	UsageCount  int64     `json:"usage_count" db:"usage_count"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	Version     int64     `json:"version" db:"version"`
}

type CreateTagRequest struct {
	TenantID    uuid.UUID `json:"tenant_id" binding:"required"`
	Name        string    `json:"name" binding:"required"`
	Slug        string    `json:"slug" binding:"required,lowercase,alphanum_dash"`
	Description *string   `json:"description"`
	Color       *string   `json:"color"`
	Metadata    []byte    `json:"metadata"`
}

type UpdateTagRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Color       *string `json:"color"`
	Metadata    []byte  `json:"metadata"`
}

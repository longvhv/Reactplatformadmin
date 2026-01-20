package models

import (
	"time"

	"github.com/google/uuid"
)

type SystemCategory struct {
	ID               uuid.UUID  `json:"id" db:"_id"`
	TenantID         uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	Type             string     `json:"type" db:"type"`
	Code             string     `json:"code" db:"code"`
	Name             string     `json:"name" db:"name"`
	Status           int16      `json:"status" db:"status"` // 0=inactive, 1=active
	Order            int        `json:"order" db:"order"`
	Description      *string    `json:"description,omitempty" db:"description"`
	ParentID         *string    `json:"parent_id,omitempty" db:"parent_id"`
	GroupCategoryID  *string    `json:"group_category_id,omitempty" db:"group_category_id"`
	CollectionName   string     `json:"collection_name" db:"collection_name"`
	ExtraFields      []byte     `json:"extra_fields,omitempty" db:"extra_fields"`
	Metadata         []byte     `json:"metadata,omitempty" db:"metadata"`
	IsSystem         bool       `json:"is_system" db:"is_system"`
	IsEditable       bool       `json:"is_editable" db:"is_editable"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
	CreatedBy        *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy        *uuid.UUID `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy        *uuid.UUID `json:"deleted_by,omitempty" db:"deleted_by"`
	Version          int        `json:"version" db:"version"`
}

type CreateSystemCategoryRequest struct {
	TenantID        uuid.UUID `json:"tenant_id" binding:"required"`
	Type            string    `json:"type" binding:"required"`
	Code            string    `json:"code" binding:"required"`
	Name            string    `json:"name" binding:"required"`
	Order           *int      `json:"order"`
	Description     *string   `json:"description"`
	ParentID        *string   `json:"parent_id"`
	GroupCategoryID *string   `json:"group_category_id"`
	CollectionName  *string   `json:"collection_name"`
	ExtraFields     []byte    `json:"extra_fields"`
	Metadata        []byte    `json:"metadata"`
}

type UpdateSystemCategoryRequest struct {
	Name            *string `json:"name"`
	Status          *int16  `json:"status"`
	Order           *int    `json:"order"`
	Description     *string `json:"description"`
	ParentID        *string `json:"parent_id"`
	GroupCategoryID *string `json:"group_category_id"`
	ExtraFields     []byte  `json:"extra_fields"`
	Metadata        []byte  `json:"metadata"`
}

package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// Department represents a department in an organization
type Department struct {
	ID                 uuid.UUID      `json:"_id" db:"_id"`
	TenantID           uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	Code               string         `json:"code" db:"code"`
	Name               string         `json:"name" db:"name"`
	ParentDepartmentID sql.NullString `json:"parent_department_id,omitempty" db:"parent_department_id"`
	ManagerID          sql.NullString `json:"manager_id,omitempty" db:"manager_id"`
	Description        sql.NullString `json:"description,omitempty" db:"description"`
	Status             string         `json:"status" db:"status"` // ACTIVE, INACTIVE, ARCHIVED
	Order              int            `json:"order" db:"order"`
	Metadata           JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedAt          time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at" db:"updated_at"`
	DeletedAt          sql.NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
	CreatedBy          sql.NullString `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy          sql.NullString `json:"updated_by,omitempty" db:"updated_by"`
	DeletedBy          sql.NullString `json:"deleted_by,omitempty" db:"deleted_by"`
	Version            int64          `json:"version" db:"version"`
}

// CreateDepartmentRequest represents the request to create a department
type CreateDepartmentRequest struct {
	TenantID           uuid.UUID              `json:"tenant_id" validate:"required,uuid"`
	Code               string                 `json:"code" validate:"required,min=1,max=200"`
	Name               string                 `json:"name" validate:"required,min=1,max=500"`
	ParentDepartmentID *uuid.UUID             `json:"parent_department_id,omitempty"`
	ManagerID          *uuid.UUID             `json:"manager_id,omitempty"`
	Description        string                 `json:"description,omitempty"`
	Order              int                    `json:"order,omitempty"`
	Metadata           map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy          *uuid.UUID             `json:"created_by,omitempty"`
}

// UpdateDepartmentRequest represents the request to update a department
type UpdateDepartmentRequest struct {
	Name               *string                 `json:"name,omitempty" validate:"omitempty,min=1,max=500"`
	ParentDepartmentID *uuid.UUID              `json:"parent_department_id,omitempty"`
	ManagerID          *uuid.UUID              `json:"manager_id,omitempty"`
	Description        *string                 `json:"description,omitempty"`
	Status             *string                 `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE INACTIVE ARCHIVED"`
	Order              *int                    `json:"order,omitempty"`
	Metadata           *map[string]interface{} `json:"metadata,omitempty"`
	UpdatedBy          *uuid.UUID              `json:"updated_by,omitempty"`
}

// TableName returns the table name for Department
func (Department) TableName() string {
	return "departments"
}
